"""
KrushRock — Tests de curvas reales del Terex Finlay J-1175
Fuente: Manual Terex Finlay J-1175 Rev 8.8, 16-04-2025, páginas 3-10 a 3-12
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from app.routers.equipment import _FALLBACK
from app.services.equipment_models import resolve_product_curve


def _get_j1175():
    for eq in _FALLBACK["jaw"]:
        if eq["model"] == "J-1175":
            return eq
    raise AssertionError("J-1175 no encontrado en _FALLBACK")


def _interp_capacity(css_mm, eq):
    """Interpolación lineal en la curva css/tph del equipo."""
    css_pts = eq["curves"]["css"]
    tph_pts = eq["curves"]["tph"]
    if css_mm <= css_pts[0]:
        return tph_pts[0]
    if css_mm >= css_pts[-1]:
        return tph_pts[-1]
    for i in range(len(css_pts) - 1):
        if css_pts[i] <= css_mm <= css_pts[i + 1]:
            t = (css_mm - css_pts[i]) / (css_pts[i + 1] - css_pts[i])
            return tph_pts[i] + t * (tph_pts[i + 1] - tph_pts[i])


def test_j1175_capacidad_css100_exacta():
    """A CSS 100 mm la curva debe devolver exactamente 238.5 tph (punto medio del manual)."""
    eq = _get_j1175()
    tph = _interp_capacity(100.0, eq)
    assert tph == pytest.approx(238.5, abs=0.1), f"Esperado 238.5 tph, obtenido {tph}"


def test_j1175_capacidad_css110_entre_rangos():
    """A CSS 110 mm la interpolación debe quedar entre 238.5 y 276.5 tph."""
    eq = _get_j1175()
    tph = _interp_capacity(110.0, eq)
    assert 238.5 < tph < 276.5, f"CSS 110 debería estar en (238.5, 276.5), obtenido {tph}"


def test_j1175_curva_capacidad_estrictamente_creciente():
    """La curva css/tph debe ser estrictamente creciente."""
    eq = _get_j1175()
    tph_pts = eq["curves"]["tph"]
    for i in range(1, len(tph_pts)):
        assert tph_pts[i] > tph_pts[i - 1], (
            f"Curva no creciente en posición {i}: {tph_pts[i-1]} → {tph_pts[i]}"
        )


def test_j1175_product_curve_pct_en_d_css_1():
    """% pasante en d/CSS=1.0 debe estar entre 60 y 70 (manual: ~65% consistente)."""
    eq = _get_j1175()
    curve = resolve_product_curve(eq, "jaw")
    pct_at_1 = curve.get(1.0) or curve.get(1.00)
    assert pct_at_1 is not None, "product_curve no contiene d/CSS=1.0"
    assert 60.0 <= pct_at_1 <= 70.0, f"% pasante en d/CSS=1.0 = {pct_at_1}, esperado [60, 70]"


def test_j1175_product_curve_monotona():
    """La curva de producto normalizada debe ser monótona creciente en d/CSS."""
    eq = _get_j1175()
    curve = resolve_product_curve(eq, "jaw")
    pts = sorted(curve.items())
    for i in range(1, len(pts)):
        assert pts[i][1] >= pts[i - 1][1], (
            f"Curva no monótona en d/CSS={pts[i][0]}: {pts[i-1][1]} → {pts[i][1]}"
        )


def test_j1175_cap_max_tph_actualizado():
    """cap_max_tph del J-1175 debe ser 452 (máximo del manual a CSS 175)."""
    eq = _get_j1175()
    assert eq["cap_max_tph"] == 452, f"cap_max_tph={eq['cap_max_tph']}, esperado 452"


def test_j1175_tiene_campos_de_fuente():
    """El J-1175 debe tener capacity_source y product_curve_source."""
    eq = _get_j1175()
    assert "capacity_source" in eq and eq["capacity_source"]
    assert "product_curve_source" in eq and eq["product_curve_source"]
