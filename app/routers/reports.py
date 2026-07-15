"""
KrushRock — Router de Reportes
Genera PDFs profesionales desde simulaciones guardadas
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from typing import List, Optional
import os, uuid
from datetime import date

from app.core.config import settings
from app.core.supabase import get_supabase
from app.routers.auth import get_current_user

router = APIRouter()


# ── /proposal — PDF de propuesta técnica (público, sin auth) ──────────────────

class _EquipoProposal(BaseModel):
    etapa: str
    marca: str
    modelo: str


class _PlantProposal(BaseModel):
    equipos: List[_EquipoProposal]
    circuit: str = "closed"
    n_units: int = 1


class _ProductProposal(BaseModel):
    name: Optional[str] = ""
    min_mm: float = 0.0
    max_mm: float
    volumen_ton: Optional[float] = None


class _FeedCurvePoint(BaseModel):
    size_mm: float
    passing_pct: float


class _FaenaProposal(BaseModel):
    rock_type: str
    f80_mm: Optional[float] = None
    feed_curve: Optional[List[_FeedCurvePoint]] = None
    products: List[_ProductProposal]
    duracion_meses: int = 1
    inchancables: bool = False
    horas_dia: Optional[float] = None
    dias_mes: Optional[float] = None


class ProposalRequest(BaseModel):
    cliente: Optional[str] = None
    proyecto: Optional[str] = None
    empresa: Optional[str] = None
    faena: _FaenaProposal
    config: _PlantProposal


@router.post("/proposal")
async def generate_proposal(req: ProposalRequest):
    """
    Genera PDF de propuesta técnica (sin autenticación requerida).
    Corre run_config con la faena y configuración provistas y retorna el PDF.
    """
    from app.services.recommender import run_config
    from app.services.proposal_pdf import build_proposal_pdf

    # Validar que haya f80 o curva
    if req.faena.f80_mm is None and not req.faena.feed_curve:
        raise HTTPException(status_code=422, detail="Debe proporcionar f80_mm o feed_curve")

    f80 = req.faena.f80_mm
    if f80 is None:
        from app.routers.simulations import _f80_from_curve
        f80 = _f80_from_curve(req.faena.feed_curve)

    feed_curve_dict = (
        {str(p.size_mm): p.passing_pct for p in req.faena.feed_curve}
        if req.faena.feed_curve else None
    )
    products_raw = [
        {"name": p.name or "", "min_mm": p.min_mm, "max_mm": p.max_mm,
         "volumen_ton": p.volumen_ton}
        for p in req.faena.products
    ]
    equipos_raw = [
        {"etapa": e.etapa, "marca": e.marca, "modelo": e.modelo}
        for e in req.config.equipos
    ]

    try:
        resultado = run_config(
            equipos=equipos_raw,
            f80_mm=f80,
            products=products_raw,
            duracion_meses=req.faena.duracion_meses,
            rock_type=req.faena.rock_type,
            n_units=req.config.n_units,
            circuit=req.config.circuit,
            feed_curve_dict=feed_curve_dict,
            horas_dia=req.faena.horas_dia,
            dias_mes=req.faena.dias_mes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error en simulación: {exc}")

    # Enriquecer equipos con parámetros operativos del resultado
    node_results = resultado.get("node_results_raw", {})
    equipos_enriquecidos = []
    for eq_raw in equipos_raw:
        eq_out = dict(eq_raw)
        # Buscar el nodo correspondiente en los resultados del motor
        node_key = next(
            (k for k in node_results if eq_raw["modelo"].replace(" ", "_").replace("-", "_") in k),
            None
        )
        if node_key:
            nr = node_results[node_key]
            if nr.get("type") in ("jaw", "cone"):
                eq_out["css_mm"] = nr.get("css_mm")
            elif nr.get("type") == "screen":
                eq_out["abertura_mm"] = nr.get("aperture_mm")
        equipos_enriquecidos.append(eq_out)

    data = {
        "cliente":  req.cliente,
        "proyecto": req.proyecto,
        "empresa":  req.empresa,
        "faena": {
            "rock_type":    req.faena.rock_type,
            "f80_mm":       f80,
            "horas_dia":    req.faena.horas_dia,
            "dias_mes":     req.faena.dias_mes,
            "duracion_meses": req.faena.duracion_meses,
            "inchancables": req.faena.inchancables,
            "feed_curve":   req.faena.feed_curve,
        },
        "productos": products_raw,
        "config": {
            "equipos": equipos_enriquecidos,
            "circuit": req.config.circuit,
            "n_units": req.config.n_units,
        },
        "resultado": {
            "tph_efectivo":     resultado.get("tph_efectivo"),
            "product_fit_pct":  resultado.get("product_fit_pct"),
            "meses_requeridos": resultado.get("meses_requeridos"),
            "products_detail":  resultado.get("products_detail", []),
        },
    }

    try:
        pdf_bytes = build_proposal_pdf(data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {exc}")

    proyecto_slug = (req.proyecto or date.today().isoformat()).replace(" ", "_")[:40]
    filename = f"KrushRock_Propuesta_{proyecto_slug}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


class ReportRequest(BaseModel):
    simulation_id: str
    project_name: Optional[str] = "Simulación KrushRock"
    company: Optional[str] = ""
    include_ai_analysis: bool = True
    logo_url: Optional[str] = None   # white-label: URL del logo del cliente


@router.post("/generate")
async def generate_report(req: ReportRequest, user=Depends(get_current_user)):
    """Genera un PDF del reporte de simulación."""
    sb = get_supabase()

    # Obtener simulación
    result = sb.table("simulations").select("*").eq(
        "id", req.simulation_id).eq("user_id", user["id"]).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Simulación no encontrada")

    sim = result.data
    out_path = os.path.join(settings.PDF_OUTPUT_DIR, f"krushrock_{uuid.uuid4().hex[:8]}.pdf")

    # Importar generador PDF
    try:
        from scripts.generate_pdf import build_pdf
        build_pdf(
            data={
                "projectName":  req.project_name,
                "company":      req.company or user.get("company", ""),
                "rock":         sim["result_json"].get("rock", {}),
                "inputs": {
                    "tph":       sim["tph"],
                    "f80":       sim["f80"],
                    "p80Target": sim["p80_target"],
                    "humidity":  sim["humidity"],
                    "circuit":   sim["circuit_type"],
                },
                "results":      sim["result_json"],
                "nodes":        sim["nodes_json"],
                "aiAnalysis":   sim.get("ai_analysis", ""),
            },
            out_path=out_path
        )
    except ImportError:
        # Fallback: retornar JSON si no está disponible reportlab en este entorno
        return {"error": "PDF generator not available in this environment",
                "data": sim["result_json"]}

    # Registrar reporte generado
    sb.table("reports").insert({
        "id": str(uuid.uuid4()),
        "user_id":       user["id"],
        "simulation_id": req.simulation_id,
        "project_name":  req.project_name,
        "pdf_path":      out_path,
        "generated_at":  __import__("datetime").datetime.utcnow().isoformat(),
    }).execute()

    filename = f"KrushRock_{req.project_name.replace(' ', '_')}.pdf"
    return FileResponse(
        path=out_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/history")
async def report_history(limit: int = 10, user=Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("reports").select(
        "id, project_name, simulation_id, generated_at"
    ).eq("user_id", user["id"]).order("generated_at", desc=True).limit(limit).execute()
    return result.data
