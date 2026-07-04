"""
KrushRock — Servicio de Recomendación de Circuitos

Genera configuraciones candidatas (mandíbula sola, +seleccionadora,
+cono+seleccionadora), corre el motor existente sobre cada una y
retorna las 2 mejores opciones rankeadas.

No modifica simulation_engine.py ni granulometry.py.
"""
from typing import List, Dict, Optional

from app.services.simulation_engine import simulate, ROCK_DB
from app.routers.equipment import _FALLBACK

# Horas de operación estándar por mes (6000 h/año ÷ 12)
HOURS_PER_MONTH: float = 500.0

# Factor de capacidad efectiva (80 % de la nominal del catálogo)
capR: float = 0.80

# Umbrales para filtrar configuraciones por producto más fino
_JAW_ONLY_MIN_MM: float = 50.0     # mandíbula sola solo viable si finest_max >= 50mm
_JAW_SCREEN_MIN_MM: float = 20.0   # mandíbula + seleccionadora para finest_max >= 20mm

# Máximo de equipos a considerar por tipo (limita el nº de simulaciones)
_PICK: int = 2


# ── FILTROS DE CATÁLOGO ───────────────────────────────────────────────────────

def _viable_jaws(f80_mm: float) -> List[Dict]:
    """Mandíbulas que aceptan el F80 de alimentación, orden ascendente de capacidad."""
    return sorted(
        [e for e in _FALLBACK["jaw"]
         if (e.get("feed_max_mm") or 0) >= f80_mm],
        key=lambda e: e["cap_max_tph"],
    )


def _viable_cones(jaw_output_p80_mm: float) -> List[Dict]:
    """Conos que pueden recibir la salida estimada de la mandíbula."""
    return sorted(
        [e for e in _FALLBACK["cone"]
         if (e.get("feed_max_mm") or 0) >= jaw_output_p80_mm],
        key=lambda e: e["cap_max_tph"],
    )


def _viable_screens(n_products: int) -> List[Dict]:
    """
    Seleccionadoras con decks suficientes para el número de fracciones de producto.
    3 productos → deck triple mínimo; caso general → doble deck.
    """
    min_decks = 3 if n_products >= 3 else 2
    return sorted(
        [e for e in _FALLBACK["screen"]
         if (e.get("decks") or 2) >= min_decks],
        key=lambda e: e["cap_max_tph"],
    )


# ── CAPACIDAD Y PARALELO ──────────────────────────────────────────────────────

def _bottleneck_cap(eq_list: List[Dict]) -> float:
    """Capacidad mínima (cap_max_tph) del conjunto de equipos — el cuello de botella."""
    caps = [e["cap_max_tph"] for e in eq_list if "cap_max_tph" in e]
    return min(caps) if caps else 0.0


def _parallel_n(min_cap_tph: float, tph_required: float) -> int:
    """
    Número mínimo de unidades paralelas para cubrir el tph requerido.
    Intenta N=1..4; retorna 0 si 4 unidades son insuficientes.
    """
    if min_cap_tph <= 0:
        return 0
    for n in range(1, 5):
        if min_cap_tph * n >= tph_required:
            return n
    return 0


# ── CONSTRUCTORES DE NODOS PARA simulate() ───────────────────────────────────

def _make_jaw_node(eq: Dict, target_p80_mm: float) -> Dict:
    safe_id = eq["model"].replace(" ", "_").replace("-", "_")
    return {
        "id": f"jaw_{safe_id}",
        "type": "jaw",
        "target_p80_mm": target_p80_mm,
        "equipment": {
            "id": f"jaw_{eq['model']}",
            "brand": eq["brand"],
            "model": eq["model"],
            "type": "jaw",
            "specs": {
                "feedMm": eq.get("feed_max_mm"),
                "cssRange": [
                    eq.get("css_min_mm", 40),
                    eq.get("css_max_mm", 175),
                ],
            },
            "curves": {},
            "capex_usd": 600_000,
            "color": "#f59e0b",
        },
    }


def _make_cone_node(eq: Dict, target_p80_mm: float) -> Dict:
    safe_id = eq["model"].replace(" ", "_").replace("-", "_")
    return {
        "id": f"cone_{safe_id}",
        "type": "cone",
        "target_p80_mm": target_p80_mm,
        "equipment": {
            "id": f"cone_{eq['model']}",
            "brand": eq["brand"],
            "model": eq["model"],
            "type": "cone",
            "specs": {
                "feedMm": eq.get("feed_max_mm"),
                "cssRange": [
                    eq.get("css_min_mm", 8),
                    eq.get("css_max_mm", 44),
                ],
            },
            "curves": {},
            "capex_usd": 800_000,
            "color": "#3b82f6",
        },
    }


def _make_screen_node(eq: Dict, aperture_mm: float) -> Dict:
    safe_id = eq["model"].replace(" ", "_").replace("-", "_")
    return {
        "id": f"screen_{safe_id}",
        "type": "screen",
        "aperture_mm": aperture_mm,
        "equipment": {
            "id": f"screen_{eq['model']}",
            "brand": eq["brand"],
            "model": eq["model"],
            "type": "screen",
            "specs": {},
            "curves": {},
            "capex_usd": 400_000,
            "color": "#10b981",
        },
    }


# ── FUNCIÓN PRINCIPAL ─────────────────────────────────────────────────────────

def recommend(
    rock_type: str,
    f80_mm: float,
    products: List[Dict],
    tonelaje_mes: float,
    duracion_meses: int,
    inchancables: bool,
) -> List[Dict]:
    """
    Genera las 2 mejores configuraciones de equipo para un proyecto de chancado.

    Parámetros
    ----------
    rock_type      : clave en ROCK_DB ("granito", "caliza", etc.)
    f80_mm         : F80 de alimentación en mm
    products       : lista de {name, min_mm, max_mm} por fracción objetivo
    tonelaje_mes   : toneladas requeridas por mes
    duracion_meses : duración total del proyecto en meses
    inchancables   : hay riesgo de metal / material inchancable en la alimentación

    Retorna
    -------
    Lista de hasta 2 dicts con:
      config, equipos, n_units, tph_efectivo,
      product_fit_pct, circ_load_pct, cumple_plazo, inchancables_recomendado
    """
    tph_required = tonelaje_mes / HOURS_PER_MONTH

    # P80 objetivo: max_mm del producto más fino × 0.85 (criterio conservador)
    if products:
        finest_max = min(float(p.get("max_mm", 9999)) for p in products)
        p80_target = finest_max * 0.85
    else:
        finest_max = max(f80_mm * 0.3, 10.0)
        p80_target = finest_max * 0.85

    # Apertura de seleccionadora = max_mm del producto más fino
    aperture_mm = finest_max

    # P80 estimado a la salida de la mandíbula (primaria):
    # al menos 3× el objetivo final, o 35% del F80 de alimentación
    jaw_target_p80 = max(p80_target * 3.0, f80_mm * 0.35)

    # Filtros de catálogo
    jaws = _viable_jaws(f80_mm)
    cones = _viable_cones(jaw_target_p80)
    screens = _viable_screens(len(products))

    top_jaws = jaws[:_PICK]
    top_cones = cones[:_PICK]
    top_screens = screens[:_PICK] if screens else []

    if not top_jaws:
        return []

    # Productos en el formato que acepta simulate()
    products_for_sim: Optional[List[Dict]] = (
        [
            {
                "id": i,
                "label": p.get("name", f"producto_{i}"),
                "min_mm": float(p.get("min_mm", 0)),
                "max_mm": float(p.get("max_mm", 9999)),
            }
            for i, p in enumerate(products)
        ]
        if products
        else None
    )

    # ── Generar candidatos ────────────────────────────────────────────────────
    candidates: List[Dict] = []

    # A: mandíbula sola (solo para productos gruesos — jaw no puede producir <50mm útil)
    if finest_max >= _JAW_ONLY_MIN_MM:
        for jaw in top_jaws:
            n = _parallel_n(jaw["cap_max_tph"], tph_required)
            if n == 0:
                continue
            candidates.append({
                "label": "jaw_only",
                "nodes": [_make_jaw_node(jaw, p80_target)],
                "circuit": "open",
                "n_units": n,
                "cap_bottleneck_tph": jaw["cap_max_tph"],
            })

    # B: mandíbula + seleccionadora
    if finest_max >= _JAW_SCREEN_MIN_MM and top_screens:
        for jaw in top_jaws:
            for scr in top_screens:
                bn = _bottleneck_cap([jaw, scr])
                n = _parallel_n(bn, tph_required)
                if n == 0:
                    continue
                candidates.append({
                    "label": "jaw_screen",
                    "nodes": [
                        _make_jaw_node(jaw, jaw_target_p80),
                        _make_screen_node(scr, aperture_mm),
                    ],
                    "circuit": "closed",
                    "n_units": n,
                    "cap_bottleneck_tph": bn,
                })

    # C: mandíbula + cono + seleccionadora
    if top_cones and top_screens:
        for jaw in top_jaws:
            for cone in top_cones:
                for scr in top_screens:
                    bn = _bottleneck_cap([jaw, cone, scr])
                    n = _parallel_n(bn, tph_required)
                    if n == 0:
                        continue
                    candidates.append({
                        "label": "jaw_cone_screen",
                        "nodes": [
                            _make_jaw_node(jaw, jaw_target_p80),
                            _make_cone_node(cone, p80_target),
                            _make_screen_node(scr, aperture_mm),
                        ],
                        "circuit": "closed",
                        "n_units": n,
                        "cap_bottleneck_tph": bn,
                    })

    if not candidates:
        return []

    # ── Simular cada candidato ────────────────────────────────────────────────
    valid_rock = rock_type if rock_type in ROCK_DB else "desconocida"
    results: List[Dict] = []

    for cand in candidates:
        # Capacidad real por unidad = cuello de botella nominal × capR
        cap_per_unit = cand["cap_bottleneck_tph"] * capR
        try:
            sim = simulate(
                nodes=cand["nodes"],
                tph=cap_per_unit,
                f80=f80_mm,
                p80_target=p80_target,
                rock_type=valid_rock,
                humidity=0,
                circuit=cand["circuit"],
                hours_per_year=6000,
                products=products_for_sim,
            )
        except Exception:
            continue  # candidato inviable — saltar

        # production_factor = total_prod_tph / feed_tph = fracción real que se convierte en producto
        production_factor = sim.get("production_factor", 0.0)
        pf = round(production_factor * 100.0, 1)
        cc = sim.get("circ_load_pct", 0.0)
        # tph_efectivo total = producto por unidad × n_units
        tph_eff_per_unit = sim.get("total_product_tph") or round(cap_per_unit * production_factor, 1)
        tph_eff_total = round(tph_eff_per_unit * cand["n_units"], 1)

        cumple = (
            tph_eff_total * HOURS_PER_MONTH * duracion_meses
            >= tonelaje_mes * duracion_meses
        )

        results.append({
            "config": cand["label"],
            "equipos": [
                {
                    "etapa": node["type"],
                    "marca": node["equipment"]["brand"],
                    "modelo": node["equipment"]["model"],
                }
                for node in cand["nodes"]
            ],
            "n_units": cand["n_units"],
            "tph_efectivo": tph_eff_total,
            "product_fit_pct": round(float(pf), 1),
            "circ_load_pct": round(float(cc), 1),
            "cumple_plazo": cumple,
            "inchancables_recomendado": inchancables,
        })

    if not results:
        return []

    # ── Rankear: 1. menos equipos, 2. mayor product_fit_pct, 3. menor CC ──────
    results.sort(key=lambda r: (
        len(r["equipos"]),
        -r["product_fit_pct"],
        r["circ_load_pct"],
    ))

    # Devolver los 2 mejores de config distinta cuando sea posible
    top2: List[Dict] = []
    seen_configs: set = set()
    for r in results:
        if r["config"] not in seen_configs:
            top2.append(r)
            seen_configs.add(r["config"])
        if len(top2) >= 2:
            break

    # Si no hay 2 configs distintas, completar con los mejores restantes
    if len(top2) < 2:
        for r in results:
            if r not in top2:
                top2.append(r)
            if len(top2) >= 2:
                break

    return top2[:2]


# ── HELPERS PARA COMPARACIÓN DE CONFIGS ──────────────────────────────────────

def _find_equipment(etapa: str, marca: str, modelo: str) -> Optional[Dict]:
    """
    Busca un equipo en el catálogo _FALLBACK por tipo/marca/modelo.
    Retorna None si no se encuentra.
    """
    catalog = _FALLBACK.get(etapa, [])
    for eq in catalog:
        if (eq.get("brand", "").lower() == marca.lower() and
                eq.get("model", "").lower() == modelo.lower()):
            return eq
    return None


def build_nodes_from_config(
    equipos: List[Dict],
    f80_mm: float,
    products: List[Dict],
) -> List[Dict]:
    """
    Construye la lista de nodos para simulate() a partir de una config de equipos.

    equipos: [{etapa, marca, modelo}]
    Retorna lista de nodos o lanza ValueError si algún equipo no existe en catálogo.
    """
    if products:
        finest_max = min(float(p.get("max_mm", 9999)) for p in products)
        p80_target = finest_max * 0.85
    else:
        finest_max = max(f80_mm * 0.3, 10.0)
        p80_target = finest_max * 0.85

    has_secondary = any(
        e.get("etapa") in ("cone", "hsi", "vsi", "impactor")
        for e in equipos
    )
    jaw_target_p80 = max(p80_target * 3.0, f80_mm * 0.35) if has_secondary else p80_target

    nodes: List[Dict] = []
    for equipo in equipos:
        etapa = equipo.get("etapa", "").lower()
        marca = equipo.get("marca", "")
        modelo = equipo.get("modelo", "")

        eq = _find_equipment(etapa, marca, modelo)
        if eq is None:
            raise ValueError(
                f"Equipo no encontrado en catálogo: {etapa} / {marca} / {modelo}"
            )

        if etapa in ("jaw", "scalper"):
            nodes.append(_make_jaw_node(eq, jaw_target_p80))
        elif etapa in ("cone", "hsi", "vsi", "impactor"):
            nodes.append(_make_cone_node(eq, p80_target))
        elif etapa == "screen":
            nodes.append(_make_screen_node(eq, finest_max))
        else:
            raise ValueError(f"Tipo de etapa no soportado: {etapa}")

    return nodes


def run_config(
    equipos: List[Dict],
    f80_mm: float,
    products: List[Dict],
    tonelaje_mes: float,
    duracion_meses: int,
    rock_type: str,
    n_units: int,
    circuit: str,
    tarifa_arriendo_usd_mes: Optional[float] = None,
) -> Dict:
    """
    Corre el motor sobre una configuración de planta y devuelve sus métricas.

    Retorna un dict con:
      tph_efectivo, product_fit_pct, circ_load_pct,
      n_equipos_total, costo_arriendo_mes_usd, cumple_plazo
    O lanza ValueError/RuntimeError si la config es inválida.
    """
    tph_required = tonelaje_mes / HOURS_PER_MONTH
    valid_rock = rock_type if rock_type in ROCK_DB else "desconocida"

    if products:
        finest_max = min(float(p.get("max_mm", 9999)) for p in products)
        p80_target = finest_max * 0.85
    else:
        finest_max = max(f80_mm * 0.3, 10.0)
        p80_target = finest_max * 0.85

    nodes = build_nodes_from_config(equipos, f80_mm, products)

    # Capacidad real por unidad = cuello de botella del catálogo × capR
    equipos_catalog = [
        _find_equipment(e.get("etapa", ""), e.get("marca", ""), e.get("modelo", ""))
        for e in equipos
    ]
    bottleneck = _bottleneck_cap([eq for eq in equipos_catalog if eq])
    cap_per_unit = (bottleneck * capR) if bottleneck > 0 else tph_required

    products_for_sim: Optional[List[Dict]] = (
        [
            {
                "id": i,
                "label": p.get("name", f"producto_{i}"),
                "min_mm": float(p.get("min_mm", 0)),
                "max_mm": float(p.get("max_mm", 9999)),
            }
            for i, p in enumerate(products)
        ]
        if products
        else None
    )

    sim = simulate(
        nodes=nodes,
        tph=cap_per_unit,
        f80=f80_mm,
        p80_target=p80_target,
        rock_type=valid_rock,
        humidity=0,
        circuit=circuit,
        hours_per_year=6000,
        products=products_for_sim,
    )

    # production_factor = total_prod_tph / feed_tph = fracción real que se convierte en producto
    production_factor = sim.get("production_factor", 0.0)
    pf = round(production_factor * 100.0, 1)
    cc = sim.get("circ_load_pct", 0.0)
    # total_product_tph de simulate() es por unidad; multiplicamos por n_units
    tph_eff_per_unit = sim.get("total_product_tph") or round(cap_per_unit * production_factor, 1)
    tph_eff_total = round(tph_eff_per_unit * n_units, 1)

    costo_mes: Optional[float] = (
        round(tarifa_arriendo_usd_mes * n_units, 2)
        if tarifa_arriendo_usd_mes is not None
        else None
    )

    cumple = tph_eff_total * HOURS_PER_MONTH * duracion_meses >= tonelaje_mes * duracion_meses

    return {
        "tph_efectivo": tph_eff_total,
        "product_fit_pct": round(float(pf), 1),
        "circ_load_pct": round(float(cc), 1),
        "n_equipos_total": n_units * len(equipos),
        "costo_arriendo_mes_usd": costo_mes,
        "cumple_plazo": cumple,
    }
