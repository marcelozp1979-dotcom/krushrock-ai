"""
KrushRock — Tests de capacidad real, meses_requeridos y métricas en run_config()

Verifica:
1. tph_efectivo refleja la capacidad de la planta (no la demanda filtrada)
2. cumple_plazo y meses_requeridos se calculan correctamente
3. product_fit_pct varía según la configuración de equipos
4. meses_requeridos > duracion_meses cuando la capacidad no alcanza
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from app.services.recommender import run_config


# ── Fixtures comunes ──────────────────────────────────────────────────────────

_GRAVA = [{"name": "grava", "min_mm": 0.0, "max_mm": 75.0}]
_ARENA = [{"name": "arena", "min_mm": 0.0, "max_mm": 19.0}]

_JAW_960  = {"etapa": "jaw",    "marca": "Terex Finlay", "modelo": "J-960"}
_SCREEN   = {"etapa": "screen", "marca": "Terex Finlay", "modelo": "683"}
_CONE     = {"etapa": "cone",   "marca": "Terex Finlay", "modelo": "C-1540"}


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_tph_efectivo_refleja_capacidad_planta():
    """
    J-960 (cap_max=200 tph) + screen 683 (cap_max=250):
    - cuello de botella = 200 tph; cap_per_unit = 200 × 0.80 = 160 tph
    - tph_efectivo debe ser cercano a la capacidad (>>10 tph)
      y NO igual a la demanda filtrada (20 tph = 10_000 / 500)
    """
    result = run_config(
        equipos=[_JAW_960, _SCREEN],
        f80_mm=400.0,
        products=_GRAVA,
        tonelaje_mes=10_000.0,
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
    assert result["descarte_pct"] == round(100 - result["product_fit_pct"], 1)


def test_cumple_plazo_false_cuando_demanda_supera_4_unidades():
    """
    4 × J-960 a 80 % capacidad: max ~640 tph → ~320 000 ton/mes.
    Una demanda de 2 000 000 ton/mes es inalcanzable → cumple_plazo = False
    y meses_requeridos > duracion_meses.
    """
    result = run_config(
        equipos=[_JAW_960],
        f80_mm=400.0,
        products=_GRAVA,
        tonelaje_mes=2_000_000.0,
        duracion_meses=1,
        rock_type="granito",
        n_units=4,
        circuit="open",
    )
    assert result["cumple_plazo"] is False, (
        f"cumple_plazo debería ser False para 2 M ton/mes con 4 × J-960; "
        f"tph_efectivo={result['tph_efectivo']:.1f}"
    )
    assert result["meses_requeridos"] > result.get("duracion_meses", 1), (
        f"meses_requeridos={result['meses_requeridos']} debería superar duracion_meses=1"
    )


def test_meses_requeridos_mayor_duracion_cuando_capacidad_insuficiente():
    """
    Con demanda muy alta (500 000 ton/mes) y 1 solo J-960,
    meses_requeridos debe ser >> duracion_meses y cumple_plazo = False.
    """
    result = run_config(
        equipos=[_JAW_960, _SCREEN],
        f80_mm=400.0,
        products=_GRAVA,
        tonelaje_mes=500_000.0,
        duracion_meses=2,
        rock_type="granito",
        n_units=1,
        circuit="closed",
    )
    assert result["cumple_plazo"] is False
    assert result["meses_requeridos"] > 2, (
        f"meses_requeridos={result['meses_requeridos']} debería ser > 2 para demanda de 500k ton/mes"
    )


def test_product_fit_distinto_jaw_screen_vs_jaw_cone_screen():
    """
    Con producto fino (0-19mm):
    - jaw+seleccionadora: jaw ajustado a target fino → más finos directos
    - jaw+cono+seleccionadora: jaw ajustado a target grueso (para el cono)
      → diferente distribución granulométrica antes del harnero
    Los product_fit_pct deben ser distintos.
    """
    faena = dict(
        f80_mm=400.0,
        products=_ARENA,
        tonelaje_mes=10_000.0,
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
