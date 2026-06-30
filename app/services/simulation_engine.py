"""
KrushRock — Motor de Simulación v2
Arquitectura: Stream (tph + curva granulométrica completa) por todo el circuito.
Cada corriente se propaga con crusher() / screen() reales — sin escalares P80.
"""
from typing import List, Dict, Optional, Any, Tuple
import math

from app.services.granulometry import Stream, SIEVES, merge_streams
from app.services.equipment_models import (
    crusher,
    screen,
    CONE_PRODUCT_NORMALIZED,
    JAW_PRODUCT_NORMALIZED,
    IMPACTOR_PRODUCT_NORMALIZED,
)
from app.services.css_selection import solve_css, CSS_RANGES

# ── BASE DE DATOS DE ROCAS ────────────────────────────────────────────────────
ROCK_DB: Dict[str, Dict] = {
    "granito":        {"wi": 15.5, "ab": 0.28, "den": 2.70, "rrN": 0.85, "name": "Granito"},
    "caliza":         {"wi": 11.2, "ab": 0.12, "den": 2.60, "rrN": 0.90, "name": "Caliza"},
    "cobre":          {"wi": 14.0, "ab": 0.22, "den": 2.75, "rrN": 0.82, "name": "Mineral de Cobre"},
    "basalto":        {"wi": 17.0, "ab": 0.35, "den": 2.90, "rrN": 0.80, "name": "Basalto"},
    "cuarcita":       {"wi": 19.5, "ab": 0.45, "den": 2.65, "rrN": 0.78, "name": "Cuarcita"},
    "arenisca":       {"wi":  9.5, "ab": 0.08, "den": 2.30, "rrN": 0.95, "name": "Arenisca"},
    "porfido":        {"wi": 16.0, "ab": 0.30, "den": 2.72, "rrN": 0.83, "name": "Pórfido Cuprífero"},
    "andesita":       {"wi": 14.5, "ab": 0.25, "den": 2.68, "rrN": 0.84, "name": "Andesita"},
    "meta_andesita":  {"wi": 15.0, "ab": 0.26, "den": 2.70, "rrN": 0.84, "name": "Meta-andesita"},
    "desconocida":    {"wi": 13.0, "ab": 0.20, "den": 2.65, "rrN": 0.85, "name": "Roca desconocida"},
}

# ── COSTOS REFERENCIALES CHILE 2024-2025 ─────────────────────────────────────
COST_DB = {
    "fuel_usd_l":       1.15,
    "electric_usd_kwh": 0.12,
    "operator_usd_h":   18.0,
    "mechanic_usd_h":   35.0,
    "hours_per_year":   6000,
    "price_ton_usd":    8.0,
    "wear_usd_t": {
        "granito":       {"jaw": 0.18, "cone": 0.22, "screen": 0.06},
        "caliza":        {"jaw": 0.08, "cone": 0.10, "screen": 0.03},
        "cobre":         {"jaw": 0.15, "cone": 0.18, "screen": 0.05},
        "basalto":       {"jaw": 0.22, "cone": 0.28, "screen": 0.07},
        "cuarcita":      {"jaw": 0.30, "cone": 0.38, "screen": 0.09},
        "arenisca":      {"jaw": 0.06, "cone": 0.07, "screen": 0.02},
        "porfido":       {"jaw": 0.20, "cone": 0.25, "screen": 0.07},
        "andesita":      {"jaw": 0.16, "cone": 0.20, "screen": 0.05},
        "meta_andesita": {"jaw": 0.17, "cone": 0.21, "screen": 0.05},
        "desconocida":   {"jaw": 0.18, "cone": 0.22, "screen": 0.06},
    },
    "maint_pct": {"jaw": 0.08, "cone": 0.10, "screen": 0.05, "scalper": 0.04},
}

# ── CURVAS NORMALIZADAS POR TIPO DE CHANCADOR ─────────────────────────────────
_NORM_CURVES: Dict[str, Dict[float, float]] = {
    "jaw":      JAW_PRODUCT_NORMALIZED,
    "scalper":  JAW_PRODUCT_NORMALIZED,
    "cone":     CONE_PRODUCT_NORMALIZED,
    "impactor": IMPACTOR_PRODUCT_NORMALIZED,
    "hsi":      IMPACTOR_PRODUCT_NORMALIZED,
    "vsi":      IMPACTOR_PRODUCT_NORMALIZED,
}

# Tamaños de exportación para la tabla de gráfica (mm), orden ascendente
_EXPORT_SIEVES = [
    0.075, 0.15, 0.3, 0.425, 0.6, 0.85, 1.18, 1.7, 2.0, 2.36, 3.35, 4.75,
    6.3, 9.5, 12.5, 19.0, 25.0, 37.5, 50.0, 75.0, 100.0, 150.0,
]


# ── HELPERS INTERNOS ──────────────────────────────────────────────────────────

def lerp(xs: List[float], ys: List[float], x: float) -> float:
    """Interpolación lineal simple (para curvas de capacidad de equipos)."""
    if not xs or len(xs) < 2:
        return ys[0] if ys else 0.0
    if x <= xs[0]:
        return ys[0]
    if x >= xs[-1]:
        return ys[-1]
    for i in range(len(xs) - 1):
        if xs[i] <= x <= xs[i + 1]:
            t = (x - xs[i]) / (xs[i + 1] - xs[i])
            return ys[i] + t * (ys[i + 1] - ys[i])
    return ys[-1]


def _rosin_rammler_curve(f80_mm: float, f50_mm: Optional[float] = None) -> Dict[float, float]:
    """
    Genera una curva de alimentación completa vía Rosin-Rammler.
    Usada cuando el usuario solo entrega F80 (y opcionalmente F50).
    """
    if f50_mm and f80_mm > f50_mm > 0:
        n = math.log(math.log(5) / math.log(2)) / math.log(f80_mm / f50_mm)
        n = max(0.3, min(4.0, n))
    else:
        n = 0.85
    # d63: tamaño al que pasa el 63.2% (parámetro de escala RR)
    d63 = f80_mm / math.pow(-math.log(0.20), 1.0 / n)

    curve: Dict[float, float] = {}
    for s in SIEVES + _EXPORT_SIEVES:
        if d63 > 0:
            passing = 100.0 * (1.0 - math.exp(-math.pow(max(s, 1e-6) / d63, n)))
        else:
            passing = 0.0
        curve[s] = max(0.0, min(100.0, passing))

    # Ancla en F80 y punto 100% en tamaño grande
    curve[f80_mm] = 80.0
    curve[f80_mm * 4.0] = 100.0
    return curve


def _stream_to_table(stream: Stream) -> List[Dict[str, float]]:
    """Serializa un Stream como lista [{size_mm, pct}] para la API."""
    return [
        {"size_mm": s, "pct": round(stream.passing(s), 1)}
        for s in _EXPORT_SIEVES
    ]


def _bond_energy_kwh_t(wi: float, p80_out_mm: float, p80_in_mm: float) -> float:
    """
    Fórmula Bond correcta: F80 y P80 en µm.
    E = 10 · Wi · (1/√P80_µm − 1/√F80_µm)  [kWh/t]
    """
    p_um = p80_out_mm * 1000.0
    f_um = p80_in_mm * 1000.0
    if p_um <= 0 or f_um <= 0 or p_um >= f_um:
        return 0.0
    return max(0.0, 10.0 * wi * (1.0 / math.sqrt(p_um) - 1.0 / math.sqrt(f_um)))


def _get_crusher_css(
    node: Dict,
    p80_target: float,
    feed_stream: Optional[Stream] = None,
) -> float:
    """
    Resuelve el CSS para un nodo chancador.

    Prioridad:
    1. css_mm explícito en el nodo (frontend o usuario lo fijó)
    2. target_p80_mm en el nodo + bisección sobre curvas normalizadas (NUEVO)
    3. p80_target global + bisección (cuando el nodo no trae su propio target)
    4. Factor lineal de respaldo (solo si no hay feed_stream disponible)
    """
    # Prioridad 1: CSS fijo explícito
    if node.get("css_mm") and float(node["css_mm"]) > 0:
        return float(node["css_mm"])

    node_type = node.get("type", "jaw")
    eq = node.get("equipment", {})
    specs = eq.get("specs", {})
    css_range_spec = specs.get("cssRange")
    css_min, css_max = (
        (float(css_range_spec[0]), float(css_range_spec[1]))
        if css_range_spec and len(css_range_spec) == 2
        else CSS_RANGES.get(node_type, (6.0, 200.0))
    )

    # Prioridad 2 y 3: bisección sobre curvas normalizadas
    if feed_stream is not None:
        target = node.get("target_p80_mm")
        target = float(target) if target and float(target) > 0 else p80_target
        norm_curve = _NORM_CURVES.get(node_type, JAW_PRODUCT_NORMALIZED)
        css_solved, _, _ = solve_css(feed_stream, target, norm_curve, css_min, css_max)
        return css_solved

    # Prioridad 4: factor lineal de respaldo (sin corriente disponible)
    factor = 1.65 if node_type in ("jaw", "scalper") else 1.0
    target = node.get("target_p80_mm") or p80_target
    return max(css_min, min(css_max, float(target) / factor))


def _get_screen_params(node: Dict, p80_target: float, humidity: int) -> Tuple[float, float]:
    """Retorna (aperture_mm, efficiency) para un nodo harnero."""
    # aperture: explícita o 90% del P80 objetivo
    if node.get("aperture_mm") and float(node["aperture_mm"]) > 0:
        aperture = float(node["aperture_mm"])
    else:
        eq = node.get("equipment", {})
        specs = eq.get("specs", {})
        aperture = float(specs.get("aperture_mm", p80_target * 0.9))

    # efficiency: explícita o desde curvas del equipo
    if node.get("efficiency") and 0 < float(node["efficiency"]) <= 1.0:
        efficiency = float(node["efficiency"])
    else:
        eq = node.get("equipment", {})
        curves = eq.get("curves", {})
        ap_curve = curves.get("apertures", [10, 20, 40, 80])
        eff_curve = curves.get("efficiency", [90, 88, 86, 84])
        base_eff = lerp(ap_curve, eff_curve, aperture) / 100.0
        hum_penalty = humidity * 0.015
        efficiency = max(0.70, base_eff - hum_penalty)

    return aperture, efficiency


def _serialize_stream(stream: Stream) -> Dict[str, Any]:
    """Serializa un Stream para la respuesta JSON de la API."""
    return {
        "tph": round(stream.tph, 1),
        "p80_mm": round(stream.pXX(80), 1),
        "p50_mm": round(stream.pXX(50), 1),
        "table": _stream_to_table(stream),
    }


# ── MOTOR PRINCIPAL ───────────────────────────────────────────────────────────

def simulate(
    nodes: List[Dict],
    tph: float,
    f80: float,
    p80_target: float,
    rock_type: str,
    humidity: int,
    circuit: str,
    hours_per_year: int = 6000,
    f50: Optional[float] = None,
    feed_curve_dict: Optional[Dict] = None,
    products: Optional[List[Dict]] = None,
) -> Dict[str, Any]:
    """
    Motor de simulación v2: propaga corrientes completas (Stream) por el circuito.

    Grafo dirigido implementado como lista ordenada de nodos con bifurcación
    explícita en harneros:
      - Chancadores: 1 entrada → 1 salida (misma tph, curva transformada)
      - Harneros: 1 entrada → undersize (producto) + oversize (→ siguiente chancador)

    Circuito cerrado: oversize del harnero alimenta al siguiente chancador (cono).
    Circuito abierto: el harnero no recircula; su undersize es el producto final.
    """
    rock = ROCK_DB.get(rock_type, ROCK_DB["desconocida"])

    # ── 1. CORRIENTE DE ALIMENTACIÓN ─────────────────────────────────────────
    if feed_curve_dict:
        # Curva explícita del usuario (puntos de sondaje o laboratorio)
        curve = {float(k): float(v) for k, v in feed_curve_dict.items()}
    else:
        # Generar curva desde F80 (y F50 si disponible) vía Rosin-Rammler
        curve = _rosin_rammler_curve(f80, f50)

    feed_stream = Stream(tph, curve)
    streams: Dict[str, Any] = {"feed": _serialize_stream(feed_stream)}

    # ── 2. ORDENAR NODOS POR FLUJO ────────────────────────────────────────────
    flow_order = ["scalper", "jaw", "screen", "cone", "impactor", "hsi", "vsi"]
    sorted_nodes = sorted(
        nodes,
        key=lambda n: flow_order.index(n.get("type", "jaw"))
        if n.get("type") in flow_order else 99
    )

    # ── 3. PROPAGAR CORRIENTES ────────────────────────────────────────────────
    current_stream = feed_stream
    node_results: Dict[str, Dict] = {}
    total_energy_kwh_t = 0.0

    # Estado del harnero (bifurcación)
    screen_undersize: Optional[Stream] = None
    screen_oversize: Optional[Stream] = None
    screen_node_id: Optional[str] = None
    is_open_circuit = (circuit in ("open", "abierto")) or \
                      not any(n.get("type") == "screen" for n in sorted_nodes)

    for node in sorted_nodes:
        node_id = node["id"]
        node_type = node.get("type", "jaw")
        p80_in = current_stream.pXX(80)

        if node_type in ("jaw", "cone", "scalper", "impactor", "hsi", "vsi"):
            css = _get_crusher_css(node, p80_target, feed_stream=current_stream)
            norm_curve = _NORM_CURVES.get(node_type, JAW_PRODUCT_NORMALIZED)

            out_stream = crusher(current_stream, css, norm_curve)
            p80_out = out_stream.pXX(80)

            # Bond en µm — fórmula correcta
            energy = _bond_energy_kwh_t(rock["wi"], p80_out, p80_in)
            total_energy_kwh_t += energy

            # Capacidad del equipo (de las curvas del equipo, si disponible)
            eq = node.get("equipment", {})
            curves_eq = eq.get("curves", {})
            css_curve = curves_eq.get("css", [css])
            tph_curve_eq = curves_eq.get("tph", [current_stream.tph])
            cap_nominal = lerp(css_curve, tph_curve_eq, css)
            if cap_nominal <= 0:
                cap_nominal = current_stream.tph  # sin datos de equipo
            utilization = min(100.0, (current_stream.tph / max(cap_nominal, 0.1)) * 100.0)

            node_results[node_id] = {
                "type":             node_type,
                "css_mm":           round(css, 1),
                "cap_nominal":      round(cap_nominal, 0),
                "cap_real":         round(min(current_stream.tph, cap_nominal), 0),
                "p80_in_mm":        round(p80_in, 1),
                "p80_out_mm":       round(p80_out, 1),
                "tph":              round(out_stream.tph, 1),
                "energy_kwh_t":     round(energy, 3),
                "energy_kw_total":  round(energy * out_stream.tph, 1),
                "utilization_pct":  round(utilization, 1),
                "ratio_reduction":  round(p80_in / max(p80_out, 0.1), 2),
                "status": (
                    "overload" if utilization > 95
                    else "ok" if utilization > 60
                    else "underload"
                ),
            }
            streams[f"{node_id}_out"] = _serialize_stream(out_stream)
            current_stream = out_stream

        elif node_type == "screen":
            aperture, efficiency = _get_screen_params(node, p80_target, humidity)
            fines, coarse = screen(current_stream, aperture, efficiency)

            screen_undersize = fines
            screen_oversize = coarse
            screen_node_id = node_id

            circ_load = (coarse.tph / max(current_stream.tph, 0.1)) * 100.0

            node_results[node_id] = {
                "type":             "screen",
                "aperture_mm":      round(aperture, 1),
                "efficiency_pct":   round(efficiency * 100.0, 1),
                "undersize_tph":    round(fines.tph, 1),
                "oversize_tph":     round(coarse.tph, 1),
                "p80_undersize_mm": round(fines.pXX(80), 1),
                "p80_oversize_mm":  round(coarse.pXX(80), 1),
                "circ_load_pct":    round(circ_load, 1),
                "status": (
                    "overload" if circ_load > 35
                    else "warn" if circ_load > 20
                    else "ok"
                ),
            }
            streams[f"{node_id}_undersize"] = _serialize_stream(fines)
            streams[f"{node_id}_oversize"] = _serialize_stream(coarse)

            # En circuito cerrado el oversize alimenta el siguiente chancador
            if not is_open_circuit:
                current_stream = coarse
            else:
                current_stream = fines

    # ── 4. CORRIENTE FINAL (PRODUCTO) ─────────────────────────────────────────
    # Circuito cerrado: undersize del harnero es el producto fino de la planta
    # Circuito abierto o sin harnero: última corriente procesada
    if screen_undersize is not None and not is_open_circuit:
        final_stream = screen_undersize
    else:
        final_stream = current_stream

    streams["product"] = _serialize_stream(final_stream)
    final_p80 = final_stream.pXX(80)

    # ── 5. RENDIMIENTO POR FRACCIÓN DE PRODUCTO ───────────────────────────────
    products_out: List[Dict] = []
    if products:
        for prod in products:
            # Acepta tanto claves camelCase (frontend) como snake_case (API)
            min_mm = float(prod.get("min_mm") or prod.get("minMm") or 0)
            max_mm = float(prod.get("max_mm") or prod.get("maxMm") or 9999)
            hi = final_stream.passing(max_mm) if max_mm < 9999 else 100.0
            lo = final_stream.passing(min_mm) if min_mm > 0 else 0.0
            pct = max(0.0, hi - lo)
            products_out.append({
                "id":      prod.get("id", ""),
                "label":   prod.get("label", ""),
                "min_mm":  min_mm,
                "max_mm":  max_mm,
                "yld_pct": round(pct, 1),
                "tph_out": round(final_stream.tph * pct / 100.0, 1),
            })

    total_prod_tph = sum(p["tph_out"] for p in products_out)

    # ── 6. MÉTRICAS SEPARADAS (sin score combinado) ───────────────────────────
    last_screen_res = node_results.get(screen_node_id, {}) if screen_node_id else {}
    circ_load_pct = last_screen_res.get("circ_load_pct", 0.0)
    production_factor = total_prod_tph / max(tph, 1.0) if products_out else 1.0
    # % tonelaje del producto final que cae dentro de CUALQUIERA de los rangos definidos
    product_fit_pct = round(sum(p["yld_pct"] for p in products_out), 1) if products_out else None

    bottlenecks = [
        node.get("equipment", {}).get("model", node.get("type", "?"))
        for node in sorted_nodes
        if node_results.get(node["id"], {}).get("status") == "overload"
    ]

    # ── 7. OPEX ───────────────────────────────────────────────────────────────
    opex = _calc_opex(sorted_nodes, node_results, tph, rock_type,
                      total_energy_kwh_t, hours_per_year)

    return {
        "node_results":        node_results,
        "streams":             streams,
        "product_yields":      products_out,
        "total_product_tph":   round(total_prod_tph, 1),
        "production_factor":   round(production_factor, 3),
        "final_p80_mm":        round(final_p80, 1),
        "circ_load_pct":       round(circ_load_pct, 1),
        "product_fit_pct":     product_fit_pct,
        "bottlenecks":         bottlenecks,
        "rock":                rock,
        "tph":                 tph,
        "p80_target_mm":       p80_target,
        "total_energy_kwh_t":  round(total_energy_kwh_t, 3),
        "opex":                opex,
    }


# ── OPEX ──────────────────────────────────────────────────────────────────────

def _calc_opex(
    nodes: List[Dict],
    node_results: Dict,
    tph: float,
    rock_type: str,
    energy_kwh_t: float,
    hours_year: int,
) -> Dict[str, float]:
    wear_db = COST_DB["wear_usd_t"].get(rock_type, COST_DB["wear_usd_t"]["granito"])
    total_wear = 0.0
    total_maint_yr = 0.0
    total_capex = 0.0

    for node in nodes:
        eq = node.get("equipment", {})
        t = node.get("type", "")
        capex_ref = float(eq.get("capex_usd", 600_000))
        total_capex += capex_ref
        maint_pct = COST_DB["maint_pct"].get(t, 0.07)
        total_maint_yr += capex_ref * maint_pct
        w = wear_db.get(
            "jaw" if t in ("jaw", "scalper") else
            "cone" if t in ("cone", "impactor", "hsi", "vsi") else
            "screen",
            0.10
        )
        total_wear += w

    energy_cost_t = energy_kwh_t * COST_DB["electric_usd_kwh"]
    labor_cost_t  = (COST_DB["operator_usd_h"] * 1.5) / max(tph, 1.0)
    maint_cost_t  = total_maint_yr / max(hours_year * tph, 1.0)
    wear_cost_t   = total_wear
    total_cost_t  = energy_cost_t + labor_cost_t + maint_cost_t + wear_cost_t

    ton_year      = tph * hours_year
    revenue_yr    = ton_year * COST_DB["price_ton_usd"]
    total_cost_yr = total_cost_t * ton_year
    ebitda_yr     = revenue_yr - total_cost_yr
    ebitda_pct    = (ebitda_yr / max(revenue_yr, 1.0)) * 100.0
    payback_years = total_capex / max(ebitda_yr, 1.0) if ebitda_yr > 0 else 99.0

    return {
        "energy_usd_t":    round(energy_cost_t, 4),
        "labor_usd_t":     round(labor_cost_t,  4),
        "maint_usd_t":     round(maint_cost_t,  4),
        "wear_usd_t":      round(wear_cost_t,   4),
        "total_usd_t":     round(total_cost_t,  3),
        "energy_kwh_t":    round(energy_kwh_t,  3),
        "ton_year_k":      round(ton_year / 1000.0, 1),
        "total_cost_yr_k": round(total_cost_yr / 1000.0, 0),
        "capex_m_usd":     round(total_capex / 1_000_000.0, 2),
        "maint_yr_k_usd":  round(total_maint_yr / 1000.0, 0),
        "ebitda_yr_k":     round(ebitda_yr / 1000.0, 0),
        "ebitda_pct":      round(ebitda_pct, 1),
        "payback_years":   round(min(payback_years, 99.0), 1),
    }
