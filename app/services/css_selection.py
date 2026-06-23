"""
Resolución de CSS a partir de P80 objetivo (operación inversa de crusher()).

Supuesto de diseño: Wi y humedad no modifican la curva de producto normalizada.
  - Wi → afecta energía Bond (calculada en _bond_energy_kwh_t)
  - Humedad → afecta eficiencia de harnero (_get_screen_params)
  - La curva de producto normalizada solo depende de CSS y geometría del equipo.

Esto es consistente con la literatura (Metso/Sandvik) y con los casos AggFlow validados.
"""
from typing import Dict, Tuple

from app.services.granulometry import Stream
from app.services.equipment_models import crusher


# CSS operativos por tipo de equipo (mm) — basados en rangos de fabricantes
CSS_RANGES: Dict[str, Tuple[float, float]] = {
    "jaw":      (25.0, 200.0),
    "scalper":  (50.0, 200.0),
    "cone":     (6.0,  60.0),
    "impactor": (10.0, 60.0),
    "hsi":      (10.0, 60.0),
    "vsi":      (5.0,  25.0),
}


def solve_css(
    feed_stream: Stream,
    target_p80_mm: float,
    product_curve: Dict[float, float],
    css_min: float = 5.0,
    css_max: float = 300.0,
    tol_mm: float = 0.5,
) -> Tuple[float, float, str]:
    """
    Resuelve el CSS necesario para que crusher() produzca un P80 igual a target_p80_mm.

    Usa bisección: P80_producto(CSS) es monótona creciente con CSS, por lo que
    la bisección converge siempre dentro del rango físico del equipo.

    Args:
        feed_stream:    corriente de alimentación al chancador
        target_p80_mm:  P80 objetivo de salida (mm)
        product_curve:  curva normalizada {d/CSS: % pasante} del equipo
        css_min:        límite inferior del rango de CSS (mm)
        css_max:        límite superior del rango de CSS (mm)
        tol_mm:         tolerancia de convergencia (mm)

    Returns:
        (css_solved_mm, p80_achieved_mm, status)
        status: "solved" | "clamped_min" | "clamped_max"
    """
    p80_at_min = crusher(feed_stream, css_min, product_curve).pXX(80)
    p80_at_max = crusher(feed_stream, css_max, product_curve).pXX(80)

    # Si el target está fuera del rango alcanzable, recortar al límite más cercano
    if target_p80_mm <= p80_at_min:
        return css_min, p80_at_min, "clamped_min"
    if target_p80_mm >= p80_at_max:
        return css_max, p80_at_max, "clamped_max"

    lo, hi = css_min, css_max
    for _ in range(60):
        mid = (lo + hi) / 2.0
        p80_mid = crusher(feed_stream, mid, product_curve).pXX(80)
        if p80_mid < target_p80_mm:
            lo = mid
        else:
            hi = mid
        if (hi - lo) < tol_mm:
            break

    css_solved = (lo + hi) / 2.0
    p80_result = crusher(feed_stream, css_solved, product_curve).pXX(80)
    return css_solved, p80_result, "solved"
