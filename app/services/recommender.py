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

# Wi de referencia: roca media genérica del catálogo de fabricantes
_WI_REF: float = 13.0


def _wi_capacity_factor(rock_type: str) -> float:
    """
    Factor de capacidad basado en el Work Index de Bond.
    Rocas blandas (Wi bajo) producen más TPH en el mismo equipo.
    Rango acotado [0.80, 1.20] para evitar extrapolaciones fuera del catálogo.
    """
    wi = ROCK_DB.get(rock_type, ROCK_DB["desconocida"])["wi"]
    factor = (_WI_REF / wi) ** 0.5
    return max(0.80, min(1.20, factor))

# Umbrales para filtrar configuraciones por producto más fino
_JAW_ONLY_MIN_MM: float = 50.0     # mandíbula sola solo viable si finest_max >= 50mm
_JAW_SCREEN_MIN_MM: float = 20.0   # mandíbula + seleccionadora para finest_max >= 20mm

# Máximo de equipos a considerar por tipo (limita el nº de simulaciones)
_PICK: int = 2

# Nombres legibles por tipo de equipo
_TIPO_LEGIBLE_MAP: Dict[str, str] = {
    "jaw":      "Chancador de mandíbula",
    "scalper":  "Scalper",
    "cone":     "Chancador de cono",
    "hsi":      "Impactor",
    "vsi":      "Impactor",
    "impactor": "Impactor",
}


def _build_equipo_dict(node: Dict, node_res: Dict) -> Dict:
    """Construye el dict de equipo con tipo legible y parámetros reales de simulación."""
    ntype = node["type"]
    eq = node["equipment"]
    if ntype == "screen":
        decks = eq.get("decks") or 2
        return {
            "etapa": ntype,
            "marca": eq["brand"],
            "modelo": eq["model"],
            "tipo_legible": f"Seleccionadora de {decks} decks",
            "css_mm": None,
            "abertura_mm": node_res.get("aperture_mm") or node.get("aperture_mm"),
            "decks": decks,
        }
    return {
        "etapa": ntype,
        "marca": eq["brand"],
        "modelo": eq["model"],
        "tipo_legible": _TIPO_LEGIBLE_MAP.get(ntype, ntype),
        "css_mm": node_res.get("css_mm"),
        "abertura_mm": None,
        "decks": None,
    }


# ── VALIDACIONES FÍSICAS ─────────────────────────────────────────────────────

# Multiplicador P100_producto / CSS por tipo (curvas normalizadas): jaw≈2.5, cone≈1.9→usamos 1.6 según spec
_P100_FACTOR: Dict[str, float] = {
    "jaw": 2.5, "scalper": 2.5,
    "cone": 1.6,
    "hsi": 2.0, "vsi": 2.0, "impactor": 2.0,
}
# Límite de razón de reducción por etapa aprobado por el usuario
_MAX_RATIO: Dict[str, float] = {
    "jaw": 6.0, "scalper": 6.0,
    "cone": 5.0,
    "hsi": 8.0, "vsi": 8.0, "impactor": 8.0,
}


def _reduction_ratio_ok(crusher_type: str, feed_max_mm: float, css_mm: float) -> bool:
    """
    True si la razón de reducción feed_max / (css × factor) ≤ límite por tipo.
    Usado para descartar configuraciones físicamente inviables.
    """
    factor = _P100_FACTOR.get(crusher_type, 2.5)
    limit  = _MAX_RATIO.get(crusher_type, 6.0)
    if css_mm <= 0:
        return False
    return (feed_max_mm / (css_mm * factor)) <= limit


# ── FILTROS DE CATÁLOGO ───────────────────────────────────────────────────────

def _viable_jaws(feed_max_material_mm: float) -> List[Dict]:
    """Mandíbulas cuyo feed_max_mm acepta el tamaño máximo real de partícula."""
    return sorted(
        [e for e in _FALLBACK["jaw"]
         if (e.get("feed_max_mm") or 0) >= feed_max_material_mm],
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
            "cap_max_tph": eq.get("cap_max_tph", 0),
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
            "cap_max_tph": eq.get("cap_max_tph", 0),
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
            "cap_max_tph": eq.get("cap_max_tph", 0),
            "decks": eq.get("decks") or 2,
            "specs": {},
            "curves": {},
            "capex_usd": 400_000,
            "color": "#10b981",
        },
    }


# ── DETALLE POR PRODUCTO ──────────────────────────────────────────────────────

def _per_product_detail(
    products: List[Dict],
    product_yields: List[Dict],
    n_units: int,
    duracion_meses: int,
    hours_per_month: float = HOURS_PER_MONTH,
) -> tuple:
    """
    Calcula producción y plazo por cada producto a partir del balance de masa.
    Retorna (detail_list, meses_requeridos, cumple_plazo).
    """
    detail = []
    for i, prod in enumerate(products):
        yld = product_yields[i] if i < len(product_yields) else {}
        volumen = float(prod.get("volumen_ton") or 0)
        tph_unit = float(yld.get("tph_out", 0))
        tph_total = round(tph_unit * n_units, 1)

        if tph_total <= 0:
            detail.append({
                "name": prod.get("name", ""),
                "min_mm": prod.get("min_mm", 0),
                "max_mm": prod.get("max_mm", 9999),
                "volumen_ton": volumen,
                "tph_out": 0.0,
                "meses": None,
                "cumple": False,
                "inalcanzable": True,
            })
        else:
            meses = round(volumen / (tph_total * hours_per_month), 1) if volumen > 0 else 0.0
            detail.append({
                "name": prod.get("name", ""),
                "min_mm": prod.get("min_mm", 0),
                "max_mm": prod.get("max_mm", 9999),
                "volumen_ton": volumen,
                "tph_out": tph_total,
                "meses": meses,
                "cumple": meses <= duracion_meses,
                "inalcanzable": False,
            })

    has_inalcanzable = any(d["inalcanzable"] for d in detail)
    meses_vals = [d["meses"] for d in detail if d["meses"] is not None]

    if has_inalcanzable:
        meses_req: Optional[float] = None
        cumple = False
    elif meses_vals:
        meses_req = round(max(meses_vals), 1)
        cumple = meses_req <= duracion_meses
    else:
        meses_req = 0.0
        cumple = True

    return detail, meses_req, cumple


# ── FUNCIÓN PRINCIPAL ─────────────────────────────────────────────────────────

def recommend(
    rock_type: str,
    f80_mm: float,
    products: List[Dict],
    duracion_meses: int,
    inchancables: bool,
    feed_curve_dict: Optional[Dict] = None,
    horas_dia: Optional[float] = None,
    dias_mes: Optional[float] = None,
) -> List[Dict]:
    """
    Genera las 2 mejores configuraciones de equipo para un proyecto de chancado.

    Parámetros
    ----------
    rock_type      : clave en ROCK_DB ("granito", "caliza", etc.)
    f80_mm         : F80 de alimentación en mm
    products       : lista de {name, min_mm, max_mm, volumen_ton} por fracción objetivo
    duracion_meses : duración total del proyecto en meses
    inchancables   : hay riesgo de metal / material inchancable en la alimentación

    Retorna
    -------
    Lista de hasta 2 dicts con:
      config, equipos, n_units, tph_efectivo,
      product_fit_pct, circ_load_pct, cumple_plazo, inchancables_recomendado,
      products_detail
    """
    hours_per_month = horas_dia * dias_mes if (horas_dia and dias_mes) else HOURS_PER_MONTH
    total_volumen = sum(float(p.get("volumen_ton") or 0) for p in products)
    tph_required = total_volumen / max(duracion_meses, 1) / hours_per_month

    # Tamaño máximo real de partícula: desde la curva si existe, sino f80/0.8
    if feed_curve_dict:
        feed_max_material_mm = max(float(k) for k in feed_curve_dict.keys())
    else:
        feed_max_material_mm = f80_mm / 0.8

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

    # Filtros de catálogo — jaws filtradas por tamaño real de partícula
    jaws = _viable_jaws(feed_max_material_mm)
    # Partícula máxima a la salida de la mandíbula ≈ P80/0.8 (P80 es percentil 80, no máximo)
    cones = _viable_cones(jaw_target_p80 / 0.8)
    screens = _viable_screens(len(products))

    if not jaws:
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

    # ── Generar candidatos con validaciones físicas ───────────────────────────
    candidates: List[Dict] = []
    rejected_reasons: List[str] = []     # mensajes de configs descartadas

    # Candidatos siempre parten con n=1; el escalamiento a n=2..4
    # se hace en el bucle de simulación si la producción real no cumple.
    # Así 1 equipo grande siempre gana a 2 equipos chicos en el ranking.

    # A: mandíbula sola (solo para productos gruesos — jaw no puede producir <50mm útil)
    if finest_max >= _JAW_ONLY_MIN_MM:
        for jaw in jaws:
            css_min_jaw = jaw.get("css_min_mm") or 0
            css_jaw_est = max(p80_target, css_min_jaw)

            # Regla d: P100_min de mandíbula = css_min × 2.5; debe ser ≤ finest_max
            p100_min_jaw = css_min_jaw * _P100_FACTOR["jaw"]
            if p100_min_jaw > finest_max:
                rejected_reasons.append(
                    f"{jaw['model']} jaw_only: P100 mín {p100_min_jaw:.0f} mm > producto {finest_max:.0f} mm"
                )
                continue

            # Regla a: razón de reducción ≤ 6:1
            if not _reduction_ratio_ok("jaw", feed_max_material_mm, css_jaw_est):
                ratio = feed_max_material_mm / (css_jaw_est * _P100_FACTOR["jaw"])
                rejected_reasons.append(
                    f"{jaw['model']} jaw_only: razón {ratio:.1f}:1 > 6:1"
                )
                continue

            # Regla c: css_min_recomendado_mm (cuando exista)
            css_min_rec = jaw.get("css_min_recomendado_mm")
            if css_min_rec and css_jaw_est < css_min_rec:
                rejected_reasons.append(
                    f"{jaw['model']} jaw_only: CSS objetivo {css_jaw_est:.0f} mm < recomendado {css_min_rec} mm"
                )
                continue

            # Regla c: producto_min_p80_mm (cuando exista)
            prod_min = jaw.get("producto_min_p80_mm")
            if prod_min and p80_target < prod_min:
                rejected_reasons.append(
                    f"{jaw['model']}: no puede producir P80 {p80_target:.0f} mm (mín {prod_min} mm)"
                )
                continue

            candidates.append({
                "label": "jaw_only",
                "nodes": [_make_jaw_node(jaw, p80_target)],
                "circuit": "open",
                "n_units": 1,
                "cap_bottleneck_tph": jaw["cap_max_tph"],
            })

    # B: mandíbula + seleccionadora
    if finest_max >= _JAW_SCREEN_MIN_MM and screens:
        for jaw in jaws:
            css_min_jaw = jaw.get("css_min_mm") or 0
            css_jaw_est = max(p80_target, css_min_jaw)

            # Regla a: razón de reducción mandíbula ≤ 6:1 (jaw_screen usa p80_target como target jaw)
            if not _reduction_ratio_ok("jaw", feed_max_material_mm, css_jaw_est):
                ratio = feed_max_material_mm / (css_jaw_est * _P100_FACTOR["jaw"])
                rejected_reasons.append(
                    f"{jaw['model']} jaw_screen: razón {ratio:.1f}:1 > 6:1"
                )
                continue

            for scr in screens:
                bn = _bottleneck_cap([jaw, scr])
                candidates.append({
                    "label": "jaw_screen",
                    "nodes": [
                        _make_jaw_node(jaw, p80_target),
                        _make_screen_node(scr, aperture_mm),
                    ],
                    "circuit": "closed",
                    "n_units": 1,
                    "cap_bottleneck_tph": bn,
                })

    # C: mandíbula + cono + seleccionadora
    if cones and screens:
        for jaw in jaws:
            css_min_jaw = jaw.get("css_min_mm") or 0
            css_jaw_est_jcs = max(jaw_target_p80, css_min_jaw)

            # Regla a: mandíbula en jaw_cone_screen usa jaw_target_p80 (más fácil de conseguir)
            if not _reduction_ratio_ok("jaw", feed_max_material_mm, css_jaw_est_jcs):
                ratio = feed_max_material_mm / (css_jaw_est_jcs * _P100_FACTOR["jaw"])
                rejected_reasons.append(
                    f"{jaw['model']} jaw_cone_screen: razón jaw {ratio:.1f}:1 > 6:1"
                )
                continue

            for cone in cones:
                css_min_cone = cone.get("css_min_mm") or 0
                css_cone_est = max(p80_target, css_min_cone)
                # Partícula máxima que llega al cono ≈ jaw_target_p80 / 0.8
                cone_feed_max = jaw_target_p80 / 0.8

                # Regla a: razón de reducción cono ≤ 5:1
                if not _reduction_ratio_ok("cone", cone_feed_max, css_cone_est):
                    ratio = cone_feed_max / (css_cone_est * _P100_FACTOR["cone"])
                    rejected_reasons.append(
                        f"{cone['model']} cone: razón {ratio:.1f}:1 > 5:1"
                    )
                    continue

                for scr in screens:
                    bn = _bottleneck_cap([jaw, cone, scr])
                    candidates.append({
                        "label": "jaw_cone_screen",
                        "nodes": [
                            _make_jaw_node(jaw, jaw_target_p80),
                            _make_cone_node(cone, p80_target),
                            _make_screen_node(scr, aperture_mm),
                        ],
                        "circuit": "closed",
                        "n_units": 1,
                        "cap_bottleneck_tph": bn,
                    })

    if not candidates:
        # Calcular razón de reducción requerida para el mensaje informativo
        css_ref = max(p80_target, 40.0)  # referencia conservadora
        ratio_req = round(feed_max_material_mm / (css_ref * _P100_FACTOR["jaw"]), 1)
        msg = (
            f"El producto pedido requiere una razón de reducción de {ratio_req}:1; "
            "se necesita una etapa adicional de chancado."
        )
        return [{
            "config": "infeasible",
            "error_message": msg,
            "equipos": [], "n_units": 0,
            "tph_efectivo": 0.0, "tph_util": 0.0,
            "product_fit_pct": 0.0, "descarte_pct": 100.0,
            "circ_load_pct": 0.0, "pct_cumplimiento": 0.0,
            "meses_requeridos": None, "cumple_plazo": False,
            "horas_adicionales_mes": None,
            "inchancables_recomendado": inchancables,
            "products_detail": [],
        }]

    # ── Simular con corte temprano por tipo de configuración ──────────────────
    # Fase 1: para cada tipo, probar n=1 en orden ascending de cap.
    #         Cortar al primer equipo que cumple con n=1 (los más grandes no aportan).
    # Fase 2: si ningún n=1 cumplió, escalar n=2..4 usando las sims cacheadas.
    valid_rock = rock_type if rock_type in ROCK_DB else "desconocida"
    results: List[Dict] = []

    wi_factor = _wi_capacity_factor(valid_rock)

    def _pct_cumpl(meses_r: Optional[float]) -> float:
        if meses_r is None:
            return 0.0
        if meses_r <= 0:
            return 100.0
        return min(100.0, round(duracion_meses / meses_r * 100.0, 1))

    # Agrupar por tipo y ordenar ascending por cap (el más chico primero)
    by_type: Dict[str, List[Dict]] = {}
    for cand in candidates:
        by_type.setdefault(cand["label"], []).append(cand)
    for lst in by_type.values():
        lst.sort(key=lambda c: c["cap_bottleneck_tph"])

    for type_cands in by_type.values():
        cached: list = []  # (cand, cap_per_unit, pf, cc, tph_eff_per_unit, product_yields, descarte_pct)
        n1_cumple_found = False

        for cand in type_cands:
            if n1_cumple_found:
                break
            cap_per_unit = cand["cap_bottleneck_tph"] * capR * wi_factor
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
                    feed_curve_dict=feed_curve_dict,
                )
            except Exception:
                continue

            production_factor = sim.get("production_factor", 0.0)
            gran_yield = sim.get("granulometric_yield")
            pf = round(gran_yield if gran_yield is not None else production_factor * 100.0, 1)
            cc = sim.get("circ_load_pct", 0.0)
            tph_eff_per_unit = sim.get("total_product_tph") or round(cap_per_unit * production_factor, 1)
            product_yields = sim.get("product_yields") or []
            descarte_pct = round(100.0 - pf, 1)
            sim_node_results = sim.get("node_results", {})

            cached.append((cand, cap_per_unit, pf, cc, tph_eff_per_unit, product_yields, descarte_pct, sim_node_results))

            # Verificar si n=1 cumple para aplicar corte temprano
            _, meses_req_1, _ = _per_product_detail(
                products, product_yields, 1, duracion_meses, hours_per_month
            )
            if _pct_cumpl(meses_req_1) >= 98.0:
                n1_cumple_found = True

        # Construir resultados desde cache; escalar n=2..4 solo si ningún n=1 cumplió
        for cand, cap_per_unit, pf, cc, tph_eff_per_unit, product_yields, descarte_pct, sim_node_results in cached:
            n_units = 1
            prods_detail, meses_req, _ = _per_product_detail(
                products, product_yields, n_units, duracion_meses, hours_per_month
            )
            pct_cumpl = _pct_cumpl(meses_req)
            cumple = pct_cumpl >= 98.0

            if not n1_cumple_found:
                while not cumple and n_units < 4 and meses_req is not None:
                    n_units += 1
                    prods_detail, meses_req, _ = _per_product_detail(
                        products, product_yields, n_units, duracion_meses, hours_per_month
                    )
                    pct_cumpl = _pct_cumpl(meses_req)
                    cumple = pct_cumpl >= 98.0

            tph_util = round(tph_eff_per_unit * n_units, 1)

            if not cumple and tph_util > 0 and meses_req is not None:
                horas_adicionales_mes = max(
                    0.0,
                    round(total_volumen / (tph_util * duracion_meses) - hours_per_month, 1),
                )
            else:
                horas_adicionales_mes = None

            results.append({
                "config": cand["label"],
                "equipos": [
                    _build_equipo_dict(node, sim_node_results.get(node["id"], {}))
                    for node in cand["nodes"]
                ],
                "n_units": n_units,
                "tph_efectivo": tph_util,
                "tph_util": tph_util,
                "product_fit_pct": pf,
                "descarte_pct": descarte_pct,
                "circ_load_pct": round(float(cc), 1),
                "pct_cumplimiento": pct_cumpl,
                "meses_requeridos": meses_req,
                "cumple_plazo": cumple,
                "horas_adicionales_mes": horas_adicionales_mes,
                "inchancables_recomendado": inchancables,
                "products_detail": prods_detail,
                "_cap_sum_tph": sum(
                    node["equipment"].get("cap_max_tph", 0) for node in cand["nodes"]
                ),
            })

    if not results:
        return []

    # ── Ranking definitivo por criterio de negocio ────────────────────────────
    # A: entre configs que cumplen (pct >= 98%), la de menor flota.
    # B: la config que NO cumple pero más se acerca por abajo (mayor pct < 98%).
    cumplen = [r for r in results if r["cumple_plazo"]]

    def _rank_key(r: Dict) -> tuple:
        return (r["n_units"] * len(r["equipos"]), r["_cap_sum_tph"])

    if cumplen:
        cumplen.sort(key=_rank_key)
        best = cumplen[0]

        # B: mejor no-cumple (mayor pct_cumplimiento), desempatando por menor flota
        no_cumplen = [r for r in results if not r["cumple_plazo"]]
        alt = (
            max(
                no_cumplen,
                key=lambda r: (
                    r["pct_cumplimiento"],
                    -(r["n_units"] * len(r["equipos"])),
                    -r["_cap_sum_tph"],
                ),
            )
            if no_cumplen
            else None
        )
    else:
        # Fallback: ninguna cumple → A = mayor pct_cumplimiento
        results_sorted = sorted(results, key=lambda r: -r["pct_cumplimiento"])
        best = results_sorted[0]
        alt = next(
            (r for r in results_sorted if r["config"] != best["config"]),
            None,
        )

    # Eliminar campo interno antes de retornar
    top2 = [best] + ([alt] if alt else [])
    for r in top2:
        r.pop("_cap_sum_tph", None)
    return top2


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
    duracion_meses: int,
    rock_type: str,
    n_units: int,
    circuit: str,
    tarifa_arriendo_usd_mes: Optional[float] = None,
    feed_curve_dict: Optional[Dict] = None,
    horas_dia: Optional[float] = None,
    dias_mes: Optional[float] = None,
    alimentacion_tph: Optional[float] = None,
) -> Dict:
    """
    Corre el motor sobre una configuración de planta y devuelve sus métricas.

    Retorna un dict con:
      tph_efectivo, product_fit_pct, circ_load_pct,
      n_equipos_total, costo_arriendo_mes_usd, cumple_plazo, products_detail
    O lanza ValueError/RuntimeError si la config es inválida.
    """
    hours_per_month = horas_dia * dias_mes if (horas_dia and dias_mes) else HOURS_PER_MONTH
    total_volumen = sum(float(p.get("volumen_ton") or 0) for p in products)
    tph_required = total_volumen / max(duracion_meses, 1) / hours_per_month
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
    wi_factor = _wi_capacity_factor(valid_rock)
    cap_per_unit = (bottleneck * capR * wi_factor) if bottleneck > 0 else tph_required

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

    def _run_sim(tph_total: float) -> Dict:
        return simulate(
            nodes=nodes,
            tph=tph_total,
            f80=f80_mm,
            p80_target=p80_target,
            rock_type=valid_rock,
            humidity=0,
            circuit=circuit,
            hours_per_year=6000,
            products=products_for_sim,
            feed_curve_dict=feed_curve_dict,
        )

    sim = _run_sim(cap_per_unit)

    # Si se especifica alimentacion_tph (alimentación fresca real), reescalar:
    # tph en simulate() es la carga total del chancador (fresca + recirculante).
    # total_product_tph = carga_total × ratio → para obtener la producción deseada
    # debemos ajustar la carga total proporcionalmente.
    if alimentacion_tph is not None:
        max_prod = sim.get("total_product_tph") or (cap_per_unit * sim.get("production_factor", 1.0))
        target_prod = min(float(alimentacion_tph), max_prod)
        if max_prod > 0 and target_prod < max_prod:
            ratio = max_prod / cap_per_unit
            tph_scaled = target_prod / ratio if ratio > 0 else cap_per_unit
            sim = _run_sim(tph_scaled)

    # product_fit_pct: rendimiento granulométrico (fracción de la salida del chancador
    # que cae en los rangos del producto, antes de pérdidas por eficiencia de clasificación).
    # Coincide con la definición de AggFlow. Si no hay seleccionadora, se usa production_factor.
    production_factor = sim.get("production_factor", 0.0)
    gran_yield = sim.get("granulometric_yield")
    pf = round(gran_yield if gran_yield is not None else production_factor * 100.0, 1)
    cc = sim.get("circ_load_pct", 0.0)
    # total_product_tph de simulate() es por unidad; multiplicamos por n_units
    tph_eff_per_unit = sim.get("total_product_tph") or round(cap_per_unit * production_factor, 1)
    tph_util = round(tph_eff_per_unit * n_units, 1)
    descarte_pct = round(100.0 - pf, 1)

    # plazo y detalle por producto usando balance de masa
    product_yields = sim.get("product_yields") or []
    prods_detail, meses_req, cumple = _per_product_detail(
        products, product_yields, n_units, duracion_meses, hours_per_month
    )

    costo_mes: Optional[float] = (
        round(tarifa_arriendo_usd_mes * n_units, 2)
        if tarifa_arriendo_usd_mes is not None
        else None
    )

    return {
        "tph_efectivo": tph_util,
        "tph_util": tph_util,
        "product_fit_pct": pf,
        "descarte_pct": descarte_pct,
        "circ_load_pct": round(float(cc), 1),
        "n_equipos_total": n_units * len(equipos),
        "costo_arriendo_mes_usd": costo_mes,
        "meses_requeridos": meses_req,
        "cumple_plazo": cumple,
        "products_detail": prods_detail,
    }
