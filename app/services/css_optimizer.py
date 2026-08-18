"""
KrushRock — Optimizador de CSS (T-18).

Para un tren de equipos ya elegido, busca la combinación de CSS por etapa que
maximiza los tph de los productos pedidos.

Principio (D-06): el óptimo NO es cerrar todos los chancadores al mínimo.
Cerrar la mandíbula al mínimo hunde su caudal y crea cuello de botella
aunque el cono siguiente tenga capacidad de sobra.
"""
import itertools
from typing import Dict, List, Optional, Tuple

from app.services.granulometry import Stream
from app.services.equipment_models import crusher, screen, resolve_product_curve
from app.services.selection_rules import check_reduction_ratio


def _grid_css(css_min: float, css_max: float, max_steps: int = 10) -> List[float]:
    """Grilla de CSS dentro del rango del equipo. Paso mínimo 2 mm, máx max_steps puntos."""
    if css_min >= css_max:
        return [float(css_min)]
    raw_steps = int((css_max - css_min) / 2.0) + 1
    n = min(max_steps, max(2, raw_steps))
    step = (css_max - css_min) / (n - 1)
    return [round(css_min + i * step, 1) for i in range(n)]


def _interp(xs: List[float], ys: List[float], x: float) -> float:
    """Interpolación lineal simple entre pares (xs, ys)."""
    if len(xs) < 2:
        return float(ys[0]) if ys else 0.0
    if x <= xs[0]:
        return float(ys[0])
    if x >= xs[-1]:
        return float(ys[-1])
    for i in range(len(xs) - 1):
        if xs[i] <= x <= xs[i + 1]:
            t = (x - xs[i]) / (xs[i + 1] - xs[i])
            return float(ys[i]) + t * (float(ys[i + 1]) - float(ys[i]))
    return float(ys[-1])


def _capacity_at_css(eq: Dict, css: float) -> float:
    """
    Capacidad (tph) para un CSS dado, interpolada desde la curva del equipo.
    Fallback: interpolación lineal entre cap_min_tph en css_min y cap_max_tph en css_max.
    """
    curves = eq.get("curves")
    if curves:
        css_vals = [float(v) for v in curves.get("css", [])]
        tph_vals = [float(v) for v in curves.get("tph", [])]
        if css_vals and tph_vals:
            return _interp(css_vals, tph_vals, css)
    css_min = float(eq.get("css_min_mm") or 25.0)
    css_max = float(eq.get("css_max_mm") or 200.0)
    cap_min = float(eq.get("cap_min_tph") or 0.0)
    cap_max = float(eq.get("cap_max_tph") or 0.0)
    if css_max <= css_min or cap_max <= 0:
        return cap_max
    t = max(0.0, min(1.0, (css - css_min) / (css_max - css_min)))
    return cap_min + t * (cap_max - cap_min)


def _product_tph(stream: Stream, products: List[Dict]) -> float:
    """Suma de tph del stream que cae dentro de los rangos de producto."""
    total = 0.0
    for prod in products:
        max_mm = float(prod.get("max_mm") or prod.get("maxMm") or 9999)
        min_mm = float(prod.get("min_mm") or prod.get("minMm") or 0.0)
        hi = stream.passing(max_mm) if max_mm < 9999 else 100.0
        lo = stream.passing(min_mm) if min_mm > 0 else 0.0
        total += stream.tph * max(0.0, hi - lo) / 100.0
    return total


def _simulate_circuit(
    crushers_with_types: List[Tuple[str, Dict]],
    css_combo: Tuple[float, ...],
    feed_stream: Stream,
    aperture_mm: float,
    screen_efficiency: float = 0.85,
) -> Optional[Stream]:
    """
    Simula circuito abierto: chancadores en serie + harnero opcional.
    Retorna corriente de producto (undersize), o None si viola razón de reducción.
    """
    current = feed_stream
    for (ctype, eq), css in zip(crushers_with_types, css_combo):
        feed_max = current.pXX(99) if current.tph > 0 else current.xs[-1]
        ok, _ = check_reduction_ratio(ctype, feed_max, css)
        if not ok:
            return None
        norm = resolve_product_curve(eq, ctype)
        current = crusher(current, css, norm)
    if aperture_mm > 0:
        undersize, _ = screen(current, aperture_mm, screen_efficiency)
        return undersize
    return current


def _build_razon(
    crushers_with_types: List[Tuple[str, Dict]],
    best_combo: Tuple[float, ...],
    grids: List[List[float]],
    best_tph: float,
    min_tph: float,
    mejora_pct: float,
) -> str:
    _tipos_leg = {
        "jaw": "mandíbula", "scalper": "scalper",
        "cone": "cono", "hsi": "impactor", "vsi": "impactor", "impactor": "impactor",
    }
    partes = []
    for (ctype, eq), css, grid in zip(crushers_with_types, best_combo, grids):
        modelo = eq.get("model", ctype)
        tipo = _tipos_leg.get(ctype, ctype)
        if css <= grid[0] + 0.5:
            pos = "mínimo"
        elif css >= grid[-1] - 0.5:
            pos = "máximo"
        else:
            pos = f"{css:.0f} mm"
        partes.append(f"{modelo} ({tipo}) CSS {pos}")

    css_str = " · ".join(partes)
    resultado = f"CSS óptimo: {css_str}. Produce {best_tph:.0f} tph."
    if mejora_pct > 1.0:
        resultado += (
            f" Supera en {mejora_pct:.0f}% a cerrar todos al mínimo "
            f"({min_tph:.0f} tph): mayor abertura aumenta el caudal procesado "
            "y compensa el material fuera de rango."
        )
    return resultado


def optimize_css(
    crushers_with_types: List[Tuple[str, Dict]],
    screen_eq: Optional[Dict],
    feed_stream: Stream,
    products: List[Dict],
    circuit: str = "open",
    grid_steps: int = 10,
    capR: float = 0.80,
    wi_factor: float = 1.0,
    alimentacion_tph: Optional[float] = None,
) -> Dict:
    """
    Busca la combinación de CSS que maximiza los tph de los productos pedidos.

    Args:
        crushers_with_types: [(tipo, equipo_dict)] en orden de flujo (primario primero).
        screen_eq:           seleccionadora (dict catálogo) o None.
        feed_stream:         corriente de alimentación (tph y granulometría).
        products:            [{"min_mm": ..., "max_mm": ...}] fracciones de producto.
        circuit:             "open" — circuito cerrado en etapa futura.
        grid_steps:          puntos de CSS por equipo (≤10, paso mínimo 2 mm).
        capR:                factor de uso efectivo (default 0.80).
        wi_factor:           ajuste por dureza de roca (1.0 = roca media).
        alimentacion_tph:    límite externo de alimentación.

    Returns:
        Dict con best_css, best_tph, best_pct, alternatives, razon,
        n_combinaciones, mejora_vs_css_minimo_pct.
        O {"error": str} si no hay combinaciones válidas.
    """
    if not crushers_with_types:
        return {"error": "Sin chancadores en el tren"}
    if not products:
        return {"error": "Sin productos definidos"}

    # Apertura del harnero = max_mm más grande (si es finito)
    max_vals = [float(p.get("max_mm") or p.get("maxMm") or 9999) for p in products]
    finite_maxs = [v for v in max_vals if v < 9999]
    aperture_mm = max(finite_maxs) if finite_maxs else 0.0

    # Capacidad del harnero (pre-calculada para no importar dentro del loop)
    screen_cap = 0.0
    if screen_eq is not None and aperture_mm > 0:
        from app.services.screen_capacity import nominal_tph as _nominal_tph
        screen_cap = _nominal_tph(screen_eq, aperture_mm)

    # Grilla de CSS por equipo
    grids: List[List[float]] = []
    for _ctype, eq in crushers_with_types:
        css_min = float(eq.get("css_min_mm") or 6.0)
        css_max = float(eq.get("css_max_mm") or 200.0)
        grids.append(_grid_css(css_min, css_max, grid_steps))

    # Forma de la curva de alimentación (shape independiente del tph)
    feed_curve = dict(zip(feed_stream.xs, feed_stream.ys))

    # Evaluar todas las combinaciones
    all_results: List[Tuple[float, Tuple[float, ...]]] = []

    for css_combo in itertools.product(*grids):
        # Caudal al cuello de botella
        caps = [_capacity_at_css(eq, css) for (_, eq), css in zip(crushers_with_types, css_combo)]
        if screen_cap > 0:
            caps.append(screen_cap)
        bn_cap = min(caps) if caps else 0.0
        if bn_cap <= 0:
            continue

        tph_eff = bn_cap * capR * wi_factor
        tph_eff = min(tph_eff, feed_stream.tph)
        if alimentacion_tph is not None:
            tph_eff = min(tph_eff, float(alimentacion_tph))
        if tph_eff <= 0:
            continue

        sim_stream = Stream(tph_eff, feed_curve)
        out = _simulate_circuit(crushers_with_types, css_combo, sim_stream, aperture_mm)
        if out is None:
            continue

        prod_tph = _product_tph(out, products)
        all_results.append((prod_tph, css_combo))

    if not all_results:
        return {"error": "Ninguna combinación de CSS es válida con las reglas físicas"}

    all_results.sort(key=lambda x: -x[0])
    best_tph, best_combo = all_results[0]
    best_pct = best_tph / max(feed_stream.tph, 1.0) * 100.0

    # Comparar vs CSS mínimo (todos al mínimo de su rango)
    min_combo = tuple(g[0] for g in grids)
    min_entry = next((r for r in all_results if r[1] == min_combo), None)
    min_tph = min_entry[0] if min_entry else all_results[-1][0]
    mejora_pct = ((best_tph - min_tph) / max(min_tph, 1.0)) * 100.0 if min_tph > 0 else 0.0

    best_css = [
        {"tipo": ctype, "modelo": eq.get("model", ""), "css_mm": round(css, 1)}
        for (ctype, eq), css in zip(crushers_with_types, best_combo)
    ]

    alternativas = []
    for pt, combo in all_results[1:4]:
        alternativas.append({
            "css": [
                {"tipo": ctype, "modelo": eq.get("model", ""), "css_mm": round(css, 1)}
                for (ctype, eq), css in zip(crushers_with_types, combo)
            ],
            "tph": round(pt, 1),
        })

    razon = _build_razon(crushers_with_types, best_combo, grids, best_tph, min_tph, mejora_pct)

    return {
        "best_css": best_css,
        "best_tph": round(best_tph, 1),
        "best_pct": round(best_pct, 1),
        "alternatives": alternativas,
        "razon": razon,
        "n_combinaciones": len(all_results),
        "mejora_vs_css_minimo_pct": round(mejora_pct, 1),
    }
