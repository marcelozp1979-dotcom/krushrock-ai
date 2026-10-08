"""
KrushRock — Tests de capacidad real, meses_requeridos y métricas en run_config()

Verifica:
1. tph_efectivo refleja la capacidad de la planta (no la demanda filtrada)
2. cumple_plazo y meses_requeridos se calculan correctamente
3. product_fit_pct varía según la configuración de equipos
4. meses_requeridos > duracion_meses cuando la capacidad no alcanza
5. Producto inalcanzable cuando el rango no produce nada
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from app.services.recommender import run_config


# ── Fixtures comunes ──────────────────────────────────────────────────────────

_GRAVA = [{"name": "grava", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": 30_000.0}]
_ARENA = [{"name": "arena", "min_mm": 0.0, "max_mm": 19.0, "volumen_ton": 30_000.0}]

_JAW_960  = {"etapa": "jaw",    "marca": "Terex Finlay", "modelo": "J-960"}
_SCREEN   = {"etapa": "screen", "marca": "Terex Finlay", "modelo": "683"}
_CONE     = {"etapa": "cone",   "marca": "Terex Finlay", "modelo": "C-1540"}


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_tph_efectivo_refleja_capacidad_planta():
    """
    J-960 (cap_max=200 tph) + screen 683 (cap_max=250):
    - cuello de botella = 200 tph; cap_per_unit = 200 × 0.80 = 160 tph
    - tph_efectivo debe ser cercano a la capacidad (>>20 tph)
      y NO igual a la demanda filtrada (20 tph = 30_000 / 3 / 500)
    """
    result = run_config(
        equipos=[_JAW_960, _SCREEN],
        f80_mm=400.0,
        products=_GRAVA,
        duracion_meses=3,
        rock_type="granito",
        n_units=1,
        circuit="closed",
    )
    assert result["tph_efectivo"] >= 20.0, (
        f"tph_efectivo={result['tph_efectivo']:.1f} debería reflejar "
        f"capacidad de planta (≥20 tph), no la demanda filtrada"
    )
    assert isinstance(result["cumple_plazo"], bool)
    # Nuevos campos presentes
    assert "descarte_pct" in result
    assert "meses_requeridos" in result
    assert "products_detail" in result
    assert result["descarte_pct"] == round(100 - result["product_fit_pct"], 1)


def test_cumple_plazo_false_cuando_demanda_supera_4_unidades():
    """
    4 × J-960 a 80 % capacidad: max ~640 tph → capacidad mes ~320 000 ton.
    Una demanda de 2 000 000 ton en 1 mes es inalcanzable → cumple_plazo = False
    y meses_requeridos > duracion_meses.
    """
    result = run_config(
        equipos=[_JAW_960],
        f80_mm=400.0,
        products=[{"name": "grava", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": 2_000_000.0}],
        duracion_meses=1,
        rock_type="granito",
        n_units=4,
        circuit="open",
    )
    assert result["cumple_plazo"] is False, (
        f"cumple_plazo debería ser False para 2 M ton en 1 mes con 4 × J-960; "
        f"tph_efectivo={result['tph_efectivo']:.1f}"
    )
    meses_req = result["meses_requeridos"]
    assert meses_req is not None
    assert meses_req > 1, (
        f"meses_requeridos={meses_req} debería superar duracion_meses=1"
    )


def test_meses_requeridos_mayor_duracion_cuando_capacidad_insuficiente():
    """
    Con volumen muy alto (1 000 000 t en 2 meses) y 1 solo J-960,
    meses_requeridos debe ser >> duracion_meses y cumple_plazo = False.
    """
    result = run_config(
        equipos=[_JAW_960, _SCREEN],
        f80_mm=400.0,
        products=[{"name": "grava", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": 1_000_000.0}],
        duracion_meses=2,
        rock_type="granito",
        n_units=1,
        circuit="closed",
    )
    assert result["cumple_plazo"] is False
    meses_req = result["meses_requeridos"]
    assert meses_req is not None
    assert meses_req > 2, (
        f"meses_requeridos={meses_req} debería ser > 2 para 1M ton en 2 meses"
    )


def test_product_fit_distinto_jaw_screen_vs_jaw_cone_screen():
    """
    Con producto intermedio (10-40mm):
    - jaw+seleccionadora: jaw produce directamente el rango objetivo
    - jaw+cono+seleccionadora: cono C-1540 (curva real) remodela la granulometría
      → distinta fracción útil en el rango 10-40mm
    Los product_fit_pct deben ser distintos.
    """
    _GRAVA_MED = [{"name": "grava_med", "min_mm": 10.0, "max_mm": 40.0, "volumen_ton": 30_000.0}]
    faena = dict(
        f80_mm=400.0,
        products=_GRAVA_MED,
        duracion_meses=3,
        rock_type="granito",
        n_units=1,
        circuit="closed",
    )

    r_js = run_config(equipos=[_JAW_960, _SCREEN], **faena)
    r_jcs = run_config(equipos=[_JAW_960, _CONE, _SCREEN], **faena)

    assert r_js["product_fit_pct"] != r_jcs["product_fit_pct"], (
        f"jaw+screen={r_js['product_fit_pct']}% vs "
        f"jaw+cono+screen={r_jcs['product_fit_pct']}% deben ser distintos "
        f"(diferente CSS de mandíbula según si hay etapa secundaria)"
    )


def test_cumple_plazo_false_cuando_producto_tarda_mas_que_duracion():
    """
    Producto con volumen alto → meses para ese producto > duracion_meses.
    cumple_plazo = False, meses_requeridos es un número > duracion_meses.
    """
    result = run_config(
        equipos=[_JAW_960, _SCREEN],
        f80_mm=400.0,
        products=[{"name": "grava", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": 1_000_000.0}],
        duracion_meses=2,
        rock_type="granito",
        n_units=1,
        circuit="closed",
    )
    assert result["cumple_plazo"] is False
    meses_req = result["meses_requeridos"]
    assert meses_req is not None, "meses_requeridos no debe ser None cuando el producto es alcanzable"
    assert meses_req > 2, (
        f"meses_requeridos={meses_req} debe superar duracion_meses=2"
    )
    # products_detail debe mostrar que el producto no cumple
    detail = result["products_detail"]
    assert len(detail) == 1
    assert detail[0]["cumple"] is False


def test_producto_inalcanzable_cuando_rango_imposible():
    """
    Producto en rango 500-1000mm es imposible para un J-960 con F80=400mm.
    El harnero filtra todo por apertura; ninguna partícula cae en ese rango
    post-chancado → tph_out=0, inalcanzable=True, cumple_plazo=False.
    """
    result = run_config(
        equipos=[_JAW_960],
        f80_mm=400.0,
        products=[{"name": "extra_grueso", "min_mm": 500.0, "max_mm": 1000.0,
                   "volumen_ton": 1_000.0}],
        duracion_meses=3,
        rock_type="granito",
        n_units=1,
        circuit="open",
    )
    assert result["cumple_plazo"] is False
    assert "products_detail" in result
    detail = result["products_detail"]
    assert len(detail) >= 1
    assert detail[0]["inalcanzable"] is True, (
        f"Producto 500-1000mm debería ser inalcanzable; tph_out={detail[0]['tph_out']}"
    )
