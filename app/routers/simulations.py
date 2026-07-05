"""
KrushRock — Router de Simulaciones
Ejecutar, guardar, recuperar, comparar simulaciones
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, field_validator, model_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import anthropic

from app.core.supabase import get_supabase
from app.core.config import settings
from app.routers.auth import get_current_user
from app.services.simulation_engine import simulate, ROCK_DB
from app.services.recommender import recommend, run_config, HOURS_PER_MONTH

router = APIRouter()


# ── SCHEMAS ───────────────────────────────────────────────────────────────────
class NodeEquipment(BaseModel):
    id: str
    brand: str
    model: str
    type: str
    specs: Optional[Dict] = {}
    curves: Optional[Dict] = {}
    capex_usd: Optional[float] = 600_000
    color: Optional[str] = "#f59e0b"


class SimNode(BaseModel):
    id: str
    type: str
    equipment: NodeEquipment
    x: Optional[float] = 0
    y: Optional[float] = 0
    # css_mm: si se envía, se usa directamente (sobreescribe target_p80_mm)
    css_mm: Optional[float] = None
    # target_p80_mm: el backend resuelve el CSS via bisección sobre curvas normalizadas
    target_p80_mm: Optional[float] = None
    aperture_mm: Optional[float] = None
    efficiency: Optional[float] = None


class ProductDef(BaseModel):
    id: Optional[Any] = None
    label: Optional[str] = ""
    min_mm: Optional[float] = 0
    max_mm: Optional[float] = 9999
    # Acepta también claves camelCase del frontend
    minMm: Optional[float] = None
    maxMm: Optional[float] = None


class SimulationRequest(BaseModel):
    project_id: Optional[str] = None
    name: Optional[str] = "Simulación"
    tph: float
    f80: float
    p80_target: float
    rock_type: str
    humidity: int = 0
    circuit: str = "closed"
    hours_per_year: int = 6000
    nodes: List[SimNode]
    save: bool = True
    # Nuevos campos para el motor v2
    f50: Optional[float] = None
    feed_curve: Optional[Dict[str, float]] = None
    products: Optional[List[ProductDef]] = None

    @field_validator("tph")
    @classmethod
    def tph_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("tph debe ser mayor que 0 — indica la capacidad en tph o una meta de tonelaje por producto")
        return v


class CompareRequest(BaseModel):
    scenario_a: SimulationRequest
    scenario_b: SimulationRequest


# ── CURVA GRANULOMÉTRICA DE ALIMENTACIÓN ──────────────────────────────────────

class FeedCurvePoint(BaseModel):
    size_mm: float
    passing_pct: float


def _validate_feed_curve(points: List[FeedCurvePoint]) -> None:
    """Valida que los % pasantes sean monótonamente crecientes con el tamaño."""
    sorted_pts = sorted(points, key=lambda p: p.size_mm)
    for i in range(1, len(sorted_pts)):
        prev, curr = sorted_pts[i - 1], sorted_pts[i]
        if curr.passing_pct < prev.passing_pct:
            raise ValueError(
                f"Curva inválida: el % pasante en {curr.size_mm} mm "
                f"({curr.passing_pct}%) es menor que en {prev.size_mm} mm "
                f"({prev.passing_pct}%). Los % pasantes deben crecer con el tamaño."
            )


def _f80_from_curve(points: List[FeedCurvePoint]) -> float:
    """Interpola el F80 desde una curva granulométrica (% pasante = 80)."""
    sorted_pts = sorted(points, key=lambda p: p.size_mm)
    for i in range(len(sorted_pts) - 1):
        p1, p2 = sorted_pts[i], sorted_pts[i + 1]
        if p1.passing_pct <= 80.0 <= p2.passing_pct:
            frac = (80.0 - p1.passing_pct) / max(p2.passing_pct - p1.passing_pct, 1e-9)
            return round(p1.size_mm + frac * (p2.size_mm - p1.size_mm), 1)
    # Fuera del rango: extrapolar por el extremo más cercano
    if sorted_pts[0].passing_pct >= 80.0:
        return sorted_pts[0].size_mm
    return sorted_pts[-1].size_mm


# ── SCHEMAS PARA /compare-configs ─────────────────────────────────────────────

class EquipoConfig(BaseModel):
    etapa: str            # "jaw", "cone", "screen", etc.
    marca: str
    modelo: str


class PlantConfig(BaseModel):
    equipos: List[EquipoConfig]
    circuit: str = "closed"
    n_units: int = 1
    tarifa_arriendo_usd_mes: Optional[float] = None  # null → no hay tarifa conocida


class ProductInput(BaseModel):
    name: Optional[str] = ""
    min_mm: float = 0.0
    max_mm: float
    volumen_ton: Optional[float] = None  # tonelaje total requerido para este producto


class FaenaData(BaseModel):
    rock_type: str
    f80_mm: Optional[float] = None
    feed_curve: Optional[List[FeedCurvePoint]] = None
    products: List[ProductInput]
    duracion_meses: int = 1
    inchancables: bool = False

    @model_validator(mode="after")
    def check_feed_input(self) -> "FaenaData":
        if self.f80_mm is None and not self.feed_curve:
            raise ValueError("Debe proporcionar f80_mm o feed_curve")
        if self.feed_curve:
            _validate_feed_curve(self.feed_curve)
        return self


class CompareConfigsRequest(BaseModel):
    config_usuario: PlantConfig
    config_sugerida: PlantConfig
    faena: FaenaData


class RecommendRequest(BaseModel):
    rock_type: str
    f80_mm: Optional[float] = None
    feed_curve: Optional[List[FeedCurvePoint]] = None
    products: List[ProductInput]
    duracion_meses: int = 1
    inchancables: bool = False

    @model_validator(mode="after")
    def check_feed_input(self) -> "RecommendRequest":
        if self.f80_mm is None and not self.feed_curve:
            raise ValueError("Debe proporcionar f80_mm o feed_curve")
        if self.f80_mm is not None and self.f80_mm <= 0:
            raise ValueError("f80_mm debe ser mayor que 0")
        if self.feed_curve:
            _validate_feed_curve(self.feed_curve)
        return self


# ── HELPERS ───────────────────────────────────────────────────────────────────
def _check_sim_limit(user: dict):
    plan = user.get("plan", "free")
    count = user.get("sim_count_month", 0)
    limits = {"free": settings.PLAN_FREE_SIM_LIMIT,
              "pro": settings.PLAN_PRO_SIM_LIMIT,
              "enterprise": settings.PLAN_ENTERPRISE_SIM_LIMIT}
    limit = limits.get(plan, 5)
    if count >= limit:
        raise HTTPException(
            status_code=429,
            detail=f"Límite de {limit} simulaciones/mes alcanzado para plan '{plan}'. Actualiza tu plan."
        )


def _increment_sim_count(user_id: str):
    sb = get_supabase()
    user = sb.table("users").select("sim_count_month").eq("id", user_id).single().execute()
    current = user.data.get("sim_count_month", 0) if user.data else 0
    sb.table("users").update({"sim_count_month": current + 1}).eq("id", user_id).execute()


# ── ENDPOINTS ─────────────────────────────────────────────────────────────────
@router.post("/run")
async def run_simulation(
    req: SimulationRequest,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user)
):
    _check_sim_limit(user)

    # Convertir nodos (incluye css_mm, aperture_mm, efficiency si vienen del frontend)
    nodes_raw = [n.dict() for n in req.nodes]
    products_raw = [p.dict() for p in req.products] if req.products else None

    # Ejecutar motor v2
    result = simulate(
        nodes=nodes_raw,
        tph=req.tph,
        f80=req.f80,
        p80_target=req.p80_target,
        rock_type=req.rock_type,
        humidity=req.humidity,
        circuit=req.circuit,
        hours_per_year=req.hours_per_year,
        f50=req.f50,
        feed_curve_dict=req.feed_curve,
        products=products_raw,
    )

    # Guardar en background si se solicita
    sim_id = str(uuid.uuid4())
    if req.save:
        sim_record = {
            "id": sim_id,
            "user_id": user["id"],
            "project_id": req.project_id,
            "name": req.name or f"Simulación {datetime.utcnow().strftime('%d/%m/%Y %H:%M')}",
            "tph": req.tph, "f80": req.f80, "p80_target": req.p80_target,
            "rock_type": req.rock_type, "humidity": req.humidity,
            "circuit_type": req.circuit,
            "hours_per_year": req.hours_per_year,
            "nodes_json": nodes_raw,
            "result_json": result,
            "final_p80":  result["final_p80_mm"],
            "circ_load":  result["circ_load_pct"],
            "opex_total_usd_t": result["opex"]["total_usd_t"],
            "created_at": datetime.utcnow().isoformat(),
        }
        background_tasks.add_task(_save_simulation, sim_record, user["id"], req.project_id)

    return {
        "simulation_id": sim_id,
        "result": result,
        "saved": req.save,
    }


async def _save_simulation(record: dict, user_id: str, project_id: Optional[str]):
    sb = get_supabase()
    sb.table("simulations").insert(record).execute()
    _increment_sim_count(user_id)
    if project_id:
        proj = sb.table("projects").select("sim_count").eq("id", project_id).single().execute()
        if proj.data:
            sb.table("projects").update({
                "sim_count": proj.data["sim_count"] + 1,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", project_id).execute()


@router.post("/calculate")
async def calculate_simulation(req: SimulationRequest):
    """
    Endpoint público (sin autenticación) para calcular una simulación.
    Solo cálculo — no guarda en base de datos.
    Permite al frontend obtener resultados del motor v2 sin login.
    """
    try:
        nodes_raw = [n.dict() for n in req.nodes]
        products_raw = [p.dict() for p in req.products] if req.products else None

        result = simulate(
            nodes=nodes_raw,
            tph=req.tph,
            f80=req.f80,
            p80_target=req.p80_target,
            rock_type=req.rock_type,
            humidity=req.humidity,
            circuit=req.circuit,
            hours_per_year=req.hours_per_year,
            f50=req.f50,
            feed_curve_dict=req.feed_curve,
            products=products_raw,
        )
        return {"result": result}
    except Exception as exc:
        import traceback
        detail = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=detail)


@router.post("/recommend")
async def recommend_circuit(req: RecommendRequest):
    """
    Endpoint público — recomienda las 2 mejores configuraciones de circuito
    para el material y producto indicados, sin requerir autenticación.
    """
    try:
        f80 = req.f80_mm if req.f80_mm is not None else _f80_from_curve(req.feed_curve)
        feed_curve_dict = (
            {str(p.size_mm): p.passing_pct for p in req.feed_curve}
            if req.feed_curve else None
        )
        products_raw = [
            {"name": p.name, "min_mm": p.min_mm, "max_mm": p.max_mm,
             "volumen_ton": p.volumen_ton}
            for p in req.products
        ]
        results = recommend(
            rock_type=req.rock_type,
            f80_mm=f80,
            products=products_raw,
            duracion_meses=req.duracion_meses,
            inchancables=req.inchancables,
            feed_curve_dict=feed_curve_dict,
        )
        return {"recommendations": results}
    except Exception as exc:
        import traceback
        detail = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=detail)


def _build_compare_table(req: CompareConfigsRequest) -> Dict[str, Any]:
    """
    Lógica compartida por /compare-configs y /compare-simple.

    Corre el motor sobre las dos configuraciones de planta y construye
    la tabla comparativa de 6 indicadores. Lanza ValueError si algún
    equipo no existe en el catálogo.
    """
    f80 = req.faena.f80_mm if req.faena.f80_mm is not None else _f80_from_curve(req.faena.feed_curve)
    feed_curve_dict = (
        {str(p.size_mm): p.passing_pct for p in req.faena.feed_curve}
        if req.faena.feed_curve else None
    )
    products_raw = [
        {"name": p.name, "min_mm": p.min_mm, "max_mm": p.max_mm,
         "volumen_ton": p.volumen_ton}
        for p in req.faena.products
    ]

    def _run(plant: PlantConfig) -> Dict[str, Any]:
        return run_config(
            equipos=[
                {"etapa": e.etapa, "marca": e.marca, "modelo": e.modelo}
                for e in plant.equipos
            ],
            f80_mm=f80,
            products=products_raw,
            duracion_meses=req.faena.duracion_meses,
            rock_type=req.faena.rock_type,
            n_units=plant.n_units,
            circuit=plant.circuit,
            tarifa_arriendo_usd_mes=plant.tarifa_arriendo_usd_mes,
            feed_curve_dict=feed_curve_dict,
        )

    res_u = _run(req.config_usuario)
    res_s = _run(req.config_sugerida)

    def _row(indicador: str, unidad: str, key: str) -> Dict:
        return {
            "indicador": indicador,
            "usuario":  res_u[key],
            "sugerida": res_s[key],
            "unidad":   unidad,
        }

    return {"tabla": [
        _row("tph_efectivo",         "tph",      "tph_efectivo"),
        _row("material_aprovechado", "%",        "product_fit_pct"),
        _row("carga_circulante",     "%",        "circ_load_pct"),
        _row("n_equipos_total",      "unidades", "n_equipos_total"),
        _row("costo_arriendo_mes",   "USD/mes",  "costo_arriendo_mes_usd"),
        _row("cumple_plazo",         "bool",     "cumple_plazo"),
    ]}


@router.post("/compare-configs")
async def compare_configs(req: CompareConfigsRequest):
    """
    Endpoint público — compara dos configuraciones de planta sobre la misma faena
    y devuelve una tabla comparativa con indicadores clave (sin análisis IA).
    """
    try:
        return _build_compare_table(req)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        import traceback
        detail = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=detail)


@router.post("/compare-simple")
async def compare_simple(req: CompareConfigsRequest):
    """
    Endpoint público — idéntico a /compare-configs en entrada y salida.
    Creado explícitamente para el flujo de modo simple del frontend.
    Comparte toda la lógica de cálculo vía _build_compare_table().
    """
    try:
        return _build_compare_table(req)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        import traceback
        detail = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=detail)


@router.post("/compare")
async def compare_simulations(req: CompareRequest, user=Depends(get_current_user)):
    """Compara dos escenarios y genera análisis IA."""
    _check_sim_limit(user)

    nodes_a = [n.dict() for n in req.scenario_a.nodes]
    nodes_b = [n.dict() for n in req.scenario_b.nodes]

    res_a = simulate(nodes=nodes_a, tph=req.scenario_a.tph,
                     f80=req.scenario_a.f80, p80_target=req.scenario_a.p80_target,
                     rock_type=req.scenario_a.rock_type, humidity=req.scenario_a.humidity,
                     circuit=req.scenario_a.circuit, hours_per_year=req.scenario_a.hours_per_year)

    res_b = simulate(nodes=nodes_b, tph=req.scenario_b.tph,
                     f80=req.scenario_b.f80, p80_target=req.scenario_b.p80_target,
                     rock_type=req.scenario_b.rock_type, humidity=req.scenario_b.humidity,
                     circuit=req.scenario_b.circuit, hours_per_year=req.scenario_b.hours_per_year)

    # Análisis IA comparativo
    ai_analysis = await _ai_compare(req.scenario_a, req.scenario_b, res_a, res_b)

    return {
        "scenario_a": {"name": req.scenario_a.name, "result": res_a},
        "scenario_b": {"name": req.scenario_b.name, "result": res_b},
        "winner_technical": "A" if res_a["production_factor"] >= res_b["production_factor"] else "B",
        "winner_opex":      "A" if res_a["opex"]["total_usd_t"] <= res_b["opex"]["total_usd_t"] else "B",
        "delta_opex_usd_t": round(abs(res_a["opex"]["total_usd_t"] - res_b["opex"]["total_usd_t"]), 3),
        "ai_analysis": ai_analysis,
    }


async def _ai_compare(sc_a, sc_b, res_a, res_b) -> str:
    """Llama a Claude para análisis comparativo."""
    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        eq_a = " + ".join(f"{n.equipment.brand} {n.equipment.model}" for n in sc_a.nodes)
        eq_b = " + ".join(f"{n.equipment.brand} {n.equipment.model}" for n in sc_b.nodes)

        prompt = f"""Eres KrushRock, experto en ingeniería de chancado y análisis económico de plantas móviles en Chile.

ESCENARIO A — {sc_a.name}:
Equipos: {eq_a}
Roca: {res_a['rock']['name']} (Wi={res_a['rock']['wi']}, ab={res_a['rock']['ab']})
{sc_a.tph} tph | F80={sc_a.f80}mm | P80={sc_a.p80_target}mm | Hum={sc_a.humidity}/3
Ajuste producto: {res_a['product_fit_pct'] if res_a['product_fit_pct'] is not None else 'N/A'}% | P80final: {res_a['final_p80_mm']}mm | CC: {res_a['circ_load_pct']}% | Factor producción: {round(res_a['production_factor']*100,1)}%
OPEX: {res_a['opex']['total_usd_t']} USD/t | EBITDA: {res_a['opex']['ebitda_yr_k']}k USD/año ({res_a['opex']['ebitda_pct']}%)
Capex: {res_a['opex']['capex_m_usd']} M USD | Payback: {res_a['opex']['payback_years']} años
Bottlenecks: {', '.join(res_a['bottlenecks']) or 'ninguno'}

ESCENARIO B — {sc_b.name}:
Equipos: {eq_b}
Roca: {res_b['rock']['name']} (Wi={res_b['rock']['wi']}, ab={res_b['rock']['ab']})
{sc_b.tph} tph | F80={sc_b.f80}mm | P80={sc_b.p80_target}mm | Hum={sc_b.humidity}/3
Ajuste producto: {res_b['product_fit_pct'] if res_b['product_fit_pct'] is not None else 'N/A'}% | P80final: {res_b['final_p80_mm']}mm | CC: {res_b['circ_load_pct']}% | Factor producción: {round(res_b['production_factor']*100,1)}%
OPEX: {res_b['opex']['total_usd_t']} USD/t | EBITDA: {res_b['opex']['ebitda_yr_k']}k USD/año ({res_b['opex']['ebitda_pct']}%)
Capex: {res_b['opex']['capex_m_usd']} M USD | Payback: {res_b['opex']['payback_years']} años
Bottlenecks: {', '.join(res_b['bottlenecks']) or 'ninguno'}

Análisis comparativo técnico-económico (máximo 220 palabras):
1. **Veredicto** (cuál recomiendas y por qué, 2 líneas)
2. **Ventajas A** (2-3 bullets con ●)
3. **Ventajas B** (2-3 bullets con ●)
4. **Consideración económica** (payback, diferencial OPEX)
5. **Recomendación final** (1 línea)"""

        msg = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}]
        )
        return msg.content[0].text
    except Exception as e:
        return f"Análisis IA no disponible: {str(e)}"


@router.get("/")
async def list_simulations(
    project_id: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    user=Depends(get_current_user)
):
    sb = get_supabase()
    q = sb.table("simulations").select(
        "id, name, tph, rock_type, circuit_type, "
        "final_p80, circ_load, opex_total_usd_t, project_id, created_at"
    ).eq("user_id", user["id"])
    if project_id:
        q = q.eq("project_id", project_id)
    result = q.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return {"simulations": result.data, "total": len(result.data)}


@router.get("/{sim_id}")
async def get_simulation(sim_id: str, user=Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("simulations").select("*").eq("id", sim_id).eq("user_id", user["id"]).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Simulación no encontrada")
    return result.data


@router.delete("/{sim_id}", status_code=204)
async def delete_simulation(sim_id: str, user=Depends(get_current_user)):
    sb = get_supabase()
    existing = sb.table("simulations").select("id").eq("id", sim_id).eq("user_id", user["id"]).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Simulación no encontrada")
    sb.table("simulations").delete().eq("id", sim_id).execute()
