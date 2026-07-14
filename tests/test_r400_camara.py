"""
KrushRock — Tests de equivalencia de cámara Powerscreen Premiertrak R400 / Finlay J-1170.
Fuente: Powerscreen Premiertrak 400X Technical Specification Rev 6, 01/10/2023 +
        Manual Terex J-1170 Rev 6.5 p.3-19 (equivalencia de cámara aprobada).
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from app.routers.equipment import _FALLBACK
from app.services.recommender import _make_jaw_node, recommend


def _get(model: str):
    for eq in _FALLBACK["jaw"]:
        if eq["model"] == model:
            return eq
    raise AssertionError(f"{model} no encontrado en _FALLBACK['jaw']")


def _interp(css_val: float, eq: dict) -> float:
    css_pts = eq["curves"]["css"]
    tph_pts = eq["curves"]["tph"]
    if css_val <= css_pts[0]:
        return tph_pts[0]
    if css_val >= css_pts[-1]:
        return tph_pts[-1]
    for i in range(len(css_pts) - 1):
        if css_pts[i] <= css_val <= css_pts[i + 1]:
            t = (css_val - css_pts[i]) / (css_pts[i + 1] - css_pts[i])
            return tph_pts[i] + t * (tph_pts[i + 1] - tph_pts[i])


# ── Tests de datos del catálogo ────────────────────────────────────────────────

def test_r400_tiene_curves_no_vacio():
    r400 = _get("Premiertrak R400")
    assert r400.get("curves"), "R400 debe tener curves no vacío"
    assert "css" in r400["curves"] and "tph" in r400["curves"]


def test_r400_curves_igual_a_j1170():
    r400 = _get("Premiertrak R400")
    j1170 = _get("J-1170")
    assert r400["curves"] == j1170["curves"], \
        "Las curves de R400 deben ser idénticas a las de J-1170 (misma cámara)"


def test_r400_interpolacion_css100_exacto():
    r400 = _get("Premiertrak R400")
    tph = _interp(100.0, r400)
    assert tph == pytest.approx(200.0, abs=0.1), \
        f"R400 a CSS 100 debe dar 200 tph, obtenido {tph}"


def test_r400_product_curve_igual_a_j1170():
    from app.services.equipment_models import resolve_product_curve
    r400 = _get("Premiertrak R400")
    j1170 = _get("J-1170")
    assert resolve_product_curve(r400, "jaw") == resolve_product_curve(j1170, "jaw"), \
        "product_curve de R400 debe ser idéntica a la de J-1170"


def test_r400_data_quality_equivalencia_camara():
    r400 = _get("Premiertrak R400")
    assert r400.get("data_quality") == "equivalencia_camara"


# ── Test de simulación comparativa: J-1175 > R400 a CSS similar ───────────────

def test_j1175_mayor_capacidad_simulada_que_r400():
    """
    La J-1175 (cap_max_tph=452, curva manual) debe producir mayor cap_nominal
    que la R400 (cap_max_tph=290, curva J-1170) en el motor a CSS comparable.
    Verificado vía recommend() observando cap_bottleneck_tph del nodo generado.
    """
    from app.services.simulation_engine import simulate

    j1175 = _get("J-1175")
    r400 = _get("Premiertrak R400")

    node_j1175 = _make_jaw_node(j1175, 100.0)
    node_r400 = _make_jaw_node(r400, 100.0)

    # CSS ~100 mm en ambos para comparar en condiciones equivalentes
    node_j1175["css_mm"] = 100.0
    node_r400["css_mm"] = 100.0

    res_j1175 = simulate(
        nodes=[node_j1175], tph=200.0, f80=400.0, p80_target=100.0,
        rock_type="granito", humidity=0, circuit="open",
    )
    res_r400 = simulate(
        nodes=[node_r400], tph=200.0, f80=400.0, p80_target=100.0,
        rock_type="granito", humidity=0, circuit="open",
    )

    cap_j1175 = res_j1175["node_results"][node_j1175["id"]]["cap_nominal"]
    cap_r400 = res_r400["node_results"][node_r400["id"]]["cap_nominal"]

    assert cap_j1175 > cap_r400, (
        f"J-1175 debe tener mayor cap_nominal que R400 a CSS 100: "
        f"J-1175={cap_j1175}, R400={cap_r400}"
    )
