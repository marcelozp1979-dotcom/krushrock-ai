"""
Etapa 1 del Plan Maestro — Coherencia física del catálogo de equipos.

Verifica que los datos base del catálogo sean físicamente consistentes ANTES
de construir sobre ellos la optimización de CSS (Etapa 3). Si estos datos son
incoherentes, cualquier optimización encuentra óptimos falsos.

Requisitos cubiertos: RC-2 (coherencia física del catálogo), RF-10 (trazabilidad).
"""
from typing import Dict, List, Tuple

import pytest

from app.routers.equipment import _FALLBACK
from app.services.equipment_models import crusher, resolve_product_curve
from app.services.granulometry import Stream


# ── Utilidades ────────────────────────────────────────────────────────────────

def _all_equipment() -> List[Tuple[str, Dict]]:
    """Lista plana [(tipo_catalogo, equipo)] de todo el catálogo."""
    return [(tipo, eq) for tipo, lst in _FALLBACK.items() for eq in lst]


def _id(tipo: str, eq: Dict) -> str:
    return f"{tipo}/{eq.get('brand', '?')} {eq.get('model', '?')}"


def _con_curvas() -> List[Tuple[str, Dict]]:
    """Equipos que declaran curva real de capacidad (tph vs CSS)."""
    return [(t, e) for t, e in _all_equipment() if e.get("curves")]


# Alimentación de referencia para probar curvas de producto: 0–400 mm
_FEED_REF = Stream(100.0, {1: 5, 10: 20, 50: 45, 100: 62, 200: 85, 400: 100})


# Discrepancias conocidas y aceptadas entre la curva del manual y el rango
# declarado de capacidad. Sirven de "trinquete": el test falla si aparece una
# discrepancia NUEVA, no por las ya documentadas.
_DISCREPANCIAS_CONOCIDAS = {
    "jaw/Terex Finlay J-1175":
        "La curva del manual baja a 122.5 tph en el CSS mínimo, por debajo del "
        "cap_min_tph declarado (200). Revisar contra el manual: probablemente el "
        "rango comercial declarado no cubre el CSS más cerrado.",
}

# Nº de equipos con fuente de capacidad documentada al cerrar la Etapa 1.
# Este número solo puede subir. Si baja, se perdió trazabilidad.
_MIN_EQUIPOS_CON_FUENTE = 5

# Chancadores que hoy no declaran rango de CSS (todos impactores HSI).
# Este número solo puede bajar.
_MAX_CHANCADORES_SIN_CSS = 16


# ── RC-2 · Rangos coherentes ──────────────────────────────────────────────────

@pytest.mark.parametrize("tipo,eq", _all_equipment(), ids=lambda v: None)
def test_rangos_coherentes(tipo: str, eq: Dict) -> None:
    """CSS mínimo < máximo, capacidad mínima < máxima, boca mayor que CSS máximo."""
    nombre = _id(tipo, eq)

    css_min, css_max = eq.get("css_min_mm"), eq.get("css_max_mm")
    if css_min is not None and css_max is not None:
        assert css_min < css_max, f"{nombre}: css_min {css_min} >= css_max {css_max}"

    cap_min, cap_max = eq.get("cap_min_tph"), eq.get("cap_max_tph")
    if cap_min is not None and cap_max is not None:
        assert cap_min < cap_max, f"{nombre}: cap_min {cap_min} >= cap_max {cap_max}"

    feed_max = eq.get("feed_max_mm")
    if feed_max and css_max:
        assert feed_max > css_max, (
            f"{nombre}: boca de entrada {feed_max} mm no supera el CSS máximo {css_max} mm"
        )


# ── RC-2 · A mayor CSS, mayor producción ──────────────────────────────────────

@pytest.mark.parametrize("tipo,eq", _con_curvas(), ids=lambda v: None)
def test_capacidad_estrictamente_creciente_con_css(tipo: str, eq: Dict) -> None:
    """
    Requisito explícito: a mayor CSS, mayor tph. Nunca igual.

    Dos aberturas distintas no pueden entregar la misma producción: eso indica
    un dato mal transcrito del manual.
    """
    nombre = _id(tipo, eq)
    css: List[float] = eq["curves"]["css"]
    tph: List[float] = eq["curves"]["tph"]

    assert len(css) == len(tph), f"{nombre}: la curva tiene {len(css)} CSS y {len(tph)} tph"
    assert len(css) >= 2, f"{nombre}: la curva necesita al menos 2 puntos"

    for i in range(len(css) - 1):
        assert css[i] < css[i + 1], (
            f"{nombre}: los CSS de la curva no están en orden creciente "
            f"({css[i]} antes de {css[i + 1]})"
        )
        assert tph[i] < tph[i + 1], (
            f"{nombre}: con CSS {css[i + 1]} mm produce {tph[i + 1]} tph, "
            f"que no supera los {tph[i]} tph de CSS {css[i]} mm"
        )


@pytest.mark.parametrize("tipo,eq", _con_curvas(), ids=lambda v: None)
def test_curva_dentro_del_rango_declarado(tipo: str, eq: Dict) -> None:
    """La curva del manual debe caer dentro del rango de CSS y capacidad declarados."""
    nombre = _id(tipo, eq)
    css: List[float] = eq["curves"]["css"]
    tph: List[float] = eq["curves"]["tph"]

    assert css[0] >= eq["css_min_mm"], (
        f"{nombre}: la curva parte en CSS {css[0]} mm, bajo el mínimo declarado "
        f"{eq['css_min_mm']} mm"
    )
    assert css[-1] <= eq["css_max_mm"], (
        f"{nombre}: la curva llega a CSS {css[-1]} mm, sobre el máximo declarado "
        f"{eq['css_max_mm']} mm"
    )

    fuera_de_rango = (
        min(tph) < eq["cap_min_tph"] * 0.99 or max(tph) > eq["cap_max_tph"] * 1.01
    )
    if fuera_de_rango:
        assert nombre in _DISCREPANCIAS_CONOCIDAS, (
            f"{nombre}: la curva va de {min(tph)} a {max(tph)} tph, fuera del rango "
            f"declarado {eq['cap_min_tph']}–{eq['cap_max_tph']} tph. "
            f"Si es correcto, documentarlo en _DISCREPANCIAS_CONOCIDAS."
        )


# ── RC-2 · A mayor CSS, producto más grueso ───────────────────────────────────

_CHANCADORES = [
    (t, e)
    for t, e in _all_equipment()
    if t in ("jaw", "cone", "hsi")
    and e.get("css_min_mm") is not None
    and e.get("css_max_mm") is not None
]


@pytest.mark.parametrize("tipo,eq", _CHANCADORES, ids=lambda v: None)
def test_producto_mas_grueso_al_abrir_css(tipo: str, eq: Dict) -> None:
    """
    Abrir el CSS debe entregar un producto más grueso (P80 mayor).

    Se recorre el rango real de CSS del equipo con la curva de producto que
    efectivamente usaría el motor.
    """
    nombre = _id(tipo, eq)
    css_min, css_max = eq["css_min_mm"], eq["css_max_mm"]
    curva = resolve_product_curve(eq, tipo)

    pasos = [css_min + (css_max - css_min) * k / 4 for k in range(5)]
    p80s = [crusher(_FEED_REF, css, curva).pXX(80) for css in pasos]

    for i in range(len(pasos) - 1):
        assert p80s[i + 1] > p80s[i], (
            f"{nombre}: al abrir de CSS {pasos[i]:.1f} a {pasos[i + 1]:.1f} mm el "
            f"producto no se hizo más grueso (P80 {p80s[i]:.2f} → {p80s[i + 1]:.2f} mm)"
        )


# ── RF-10 · Trazabilidad ──────────────────────────────────────────────────────

def test_chancadores_sin_rango_de_css_no_aumentan() -> None:
    """
    Trinquete: hoy 16 impactores (HSI) no declaran rango de CSS, por lo que no
    se puede verificar su curva de producto ni optimizar su abertura.
    El número no debe crecer; debe bajar a medida que se carguen sus manuales.
    """
    sin_css = [
        _id(t, e)
        for t, e in _all_equipment()
        if t in ("jaw", "cone", "hsi")
        and (e.get("css_min_mm") is None or e.get("css_max_mm") is None)
    ]
    assert len(sin_css) <= _MAX_CHANCADORES_SIN_CSS, (
        f"Aumentaron los chancadores sin rango de CSS: {len(sin_css)} "
        f"(antes {_MAX_CHANCADORES_SIN_CSS}). Faltan: {', '.join(sin_css)}"
    )


def test_equipos_con_curva_tienen_fuente() -> None:
    """Todo equipo con curva de capacidad debe citar el manual del que salió."""
    sin_fuente = [
        _id(t, e) for t, e in _con_curvas() if not e.get("capacity_source")
    ]
    assert not sin_fuente, (
        "Equipos con curva de capacidad pero sin fuente documentada: "
        + ", ".join(sin_fuente)
    )


def test_cobertura_de_fuentes_no_retrocede() -> None:
    """
    Trinquete de trazabilidad: el número de equipos con datos de manual
    solo puede subir. Al 28-jul-2026 son 5 de 79.
    """
    con_fuente = [_id(t, e) for t, e in _all_equipment() if e.get("capacity_source")]
    assert len(con_fuente) >= _MIN_EQUIPOS_CON_FUENTE, (
        f"Se perdió trazabilidad: hay {len(con_fuente)} equipos con fuente "
        f"documentada, antes había {_MIN_EQUIPOS_CON_FUENTE}"
    )
