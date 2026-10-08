"""
Tests T-19 — Curva de producto real del C-1540.

Verifica que:
1. El catálogo tiene product_curve con los puntos digitalizados.
2. La curva es monótonamente creciente (condición física).
3. resolve_product_curve() devuelve la curva propia del C-1540, no la genérica.
4. El P80 del producto a CSS=19 mm es coherente con el manual (~18–19 mm).
5. El C-1540 produce granulometría diferente de un cono genérico con mismo CSS.

Fuente: Manual Terex Finlay C-1540 Rev 2.7, Tabla 3.5, digitalizado ±3 puntos.
"""
import pytest

from app.routers.equipment import _FALLBACK
from app.services.equipment_models import crusher, resolve_product_curve, CONE_PRODUCT_NORMALIZED
from app.services.granulometry import Stream


# ── Acceso al C-1540 en el catálogo ──────────────────────────────────────────

def _c1540() -> dict:
    for eq in _FALLBACK["cone"]:
        if eq.get("model") == "C-1540":
            return eq
    raise AssertionError("C-1540 no encontrado en el catálogo")


# Alimentación ROM gruesa: casi todo el material sobre 300 mm.
# Garantiza que el output de la chancadora está determinado enteramente
# por la curva de producto (sin influencia de finos pre-existentes).
_FEED_GRUESA = Stream(100.0, {300: 0, 500: 30, 700: 70, 1000: 100})


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_c1540_tiene_product_curve():
    """T-19: el C-1540 en el catálogo declara product_curve con ≥ 5 puntos."""
    eq = _c1540()
    pc = eq.get("product_curve")
    assert pc is not None, "C-1540 no tiene el campo 'product_curve'"
    assert len(pc) >= 5, f"product_curve tiene {len(pc)} puntos, se esperan ≥ 5"


def test_c1540_tiene_product_curve_source():
    """T-19: el campo product_curve_source documenta la fuente."""
    eq = _c1540()
    src = eq.get("product_curve_source", "")
    assert "C-1540" in src, "product_curve_source debe mencionar el modelo"
    assert "Tabla 3.5" in src, "product_curve_source debe citar la tabla del manual"


def test_c1540_product_curve_monotona():
    """La curva de producto del C-1540 es monótonamente creciente en d/CSS."""
    eq = _c1540()
    pc = eq.get("product_curve", {})
    pares = sorted((float(k), float(v)) for k, v in pc.items())
    for i in range(1, len(pares)):
        assert pares[i][1] >= pares[i - 1][1], (
            f"Curva no monótona: en d/CSS={pares[i][0]:.4f} "
            f"({pares[i][1]}%) ≤ d/CSS={pares[i-1][0]:.4f} ({pares[i-1][1]}%)"
        )


def test_resolve_product_curve_devuelve_curva_propia():
    """resolve_product_curve debe retornar la curva del C-1540, no la genérica."""
    eq = _c1540()
    curva = resolve_product_curve(eq, "cone")
    curva_generica = CONE_PRODUCT_NORMALIZED
    # Si la curva retornada es idéntica a la genérica, algo está mal
    assert curva != curva_generica, (
        "resolve_product_curve retornó CONE_PRODUCT_NORMALIZED en vez de la curva propia del C-1540"
    )
    # Verificar que tiene los puntos del C-1540 (d/CSS ≈ 1.4737 → 100%)
    keys_float = {round(float(k), 3) for k in curva}
    assert any(abs(k - 1.474) < 0.01 for k in keys_float), (
        f"No se encontró d/CSS ≈ 1.4737 (28 mm / 19 mm) en la curva. Claves: {keys_float}"
    )


def test_c1540_p80_css19_coherente_con_manual():
    """
    A CSS=19 mm, el P80 del producto del C-1540 debe ser ≈ 18–19 mm.
    Manual reporta P80/CSS ≈ 0,98 → P80 ≈ 18,6 mm (±3 puntos → ±3 mm tolerancia adicional).
    """
    eq = _c1540()
    curva = resolve_product_curve(eq, "cone")
    out = crusher(_FEED_GRUESA, css_mm=19.0, product_curve=curva)
    p80 = out.pXX(80)
    assert 14.0 <= p80 <= 23.0, (
        f"P80 del C-1540 a CSS=19 mm = {p80:.1f} mm. "
        "Se esperaba entre 14 y 23 mm (manual: ~18,6 mm, tolerancia ±3 puntos)."
    )


def test_c1540_mas_grueso_que_cono_generico_en_finos():
    """
    T-19: el C-1540 produce granulometría diferente a la del cono genérico.
    El manual muestra que el C-1540 pasa menos finos (es más grueso en la fracción baja).
    """
    eq = _c1540()
    curva_c1540 = resolve_product_curve(eq, "cone")
    out_c1540 = crusher(_FEED_GRUESA, css_mm=19.0, product_curve=curva_c1540)
    out_generico = crusher(_FEED_GRUESA, css_mm=19.0, product_curve=CONE_PRODUCT_NORMALIZED)

    # A 10 mm (d/CSS ≈ 0.526): C-1540 → 54%, genérico → ~58%
    pct_c1540 = out_c1540.passing(10.0)
    pct_generico = out_generico.passing(10.0)
    assert abs(pct_c1540 - pct_generico) > 1.0, (
        f"C-1540 ({pct_c1540:.1f}%) y cono genérico ({pct_generico:.1f}%) "
        "son prácticamente idénticos a 10 mm — la curva propia no está teniendo efecto"
    )
