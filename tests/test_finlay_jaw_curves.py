"""
KrushRock — Tests de curvas reales de mandíbulas Terex Finlay
Fuentes: Manuales Terex oficiales Rev indicada en product_curve_source / capacity_source
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from app.routers.equipment import _FALLBACK
from app.services.equipment_models import resolve_product_curve


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


# ─── J-960 ────────────────────────────────────────────────────────────────────

def test_j960_capacidad_css63_exacta():
    eq = _get("J-960")
    assert _interp(63.0, eq) == pytest.approx(97.5, abs=0.1)


def test_j960_curva_capacidad_creciente():
    eq = _get("J-960")
    tph = eq["curves"]["tph"]
    for i in range(1, len(tph)):
        assert tph[i] > tph[i - 1]


# ─── J-1160 ───────────────────────────────────────────────────────────────────

def test_j1160_product_curve_igual_a_j1175():
    j1160 = _get("J-1160")
    j1175 = _get("J-1175")
    curve_60 = resolve_product_curve(j1160, "jaw")
    curve_75 = resolve_product_curve(j1175, "jaw")
    assert curve_60 == curve_75, "product_curve de J-1160 debe ser idéntica a la de J-1175"


# ─── J-1170 ───────────────────────────────────────────────────────────────────

def test_j1170_existe_en_fallback():
    _get("J-1170")  # AssertionError si no existe


def test_j1170_capacidad_css100_exacta():
    eq = _get("J-1170")
    assert _interp(100.0, eq) == pytest.approx(200.0, abs=0.1)


def test_j1170_curva_capacidad_creciente():
    eq = _get("J-1170")
    tph = eq["curves"]["tph"]
    for i in range(1, len(tph)):
        assert tph[i] > tph[i - 1]


def test_j1170_product_curve_monotona():
    eq = _get("J-1170")
    curve = resolve_product_curve(eq, "jaw")
    pts = sorted(curve.items())
    for i in range(1, len(pts)):
        assert pts[i][1] >= pts[i - 1][1], (
            f"J-1170 product_curve no monótona en d/CSS={pts[i][0]}"
        )


def test_j1170_product_curve_d_css_1_en_rango():
    eq = _get("J-1170")
    curve = resolve_product_curve(eq, "jaw")
    pct = curve[1.00]
    assert 72.0 <= pct <= 90.0, f"J-1170 d/CSS=1.0 = {pct}%, esperado [72, 90]"


# ─── J-1280 ───────────────────────────────────────────────────────────────────

def test_j1280_capacidad_css100_exacta():
    eq = _get("J-1280")
    assert _interp(100.0, eq) == pytest.approx(220.0, abs=0.1)


def test_j1280_curva_capacidad_creciente():
    eq = _get("J-1280")
    tph = eq["curves"]["tph"]
    for i in range(1, len(tph)):
        assert tph[i] > tph[i - 1]


def test_j1280_product_curve_monotona():
    eq = _get("J-1280")
    curve = resolve_product_curve(eq, "jaw")
    pts = sorted(curve.items())
    for i in range(1, len(pts)):
        assert pts[i][1] >= pts[i - 1][1], (
            f"J-1280 product_curve no monótona en d/CSS={pts[i][0]}"
        )


def test_j1280_product_curve_d_css_1_en_rango():
    eq = _get("J-1280")
    curve = resolve_product_curve(eq, "jaw")
    pct = curve[1.00]
    assert 72.0 <= pct <= 90.0, f"J-1280 d/CSS=1.0 = {pct}%, esperado [72, 90]"


# ─── J-1480 ───────────────────────────────────────────────────────────────────

def test_j1480_product_curve_monotona():
    eq = _get("J-1480")
    curve = resolve_product_curve(eq, "jaw")
    pts = sorted(curve.items())
    for i in range(1, len(pts)):
        assert pts[i][1] >= pts[i - 1][1], (
            f"J-1480 product_curve no monótona en d/CSS={pts[i][0]}"
        )
