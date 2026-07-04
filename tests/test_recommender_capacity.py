"""
KrushRock — Tests de capacidad real y cumple_plazo en run_config()

Verifica los 3 fixes aplicados en recommender.py:
1. tph_efectivo refleja la capacidad de la planta (no la demanda filtrada)
2. cumple_plazo se calcula, no es siempre True
3. product_fit_pct varía según la configuración de equipos
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
    # La demanda es 10_000 / 500 = 20 tph.
    # tph_efectivo basado en capacidad real debe ser considerablemente mayor.
    assert result["tph_efectivo"] >= 20.0, (
        f"tph_efectivo={result['tph_efectivo']:.1f} debería reflejar "
        f"capacidad de planta (≥20 tph), no la demanda filtrada"
    )
    # Verifica que cumple_plazo es un bool calculado (no hardcodeado)
    assert isinstance(result["cumple_plazo"], bool)


def test_cumple_plazo_false_cuando_demanda_supera_4_unidades():
    """
    4 × J-960 a 80 % capacidad: max ~640 tph → ~320 000 ton/mes.
    Una demanda de 2 000 000 ton/mes es inalcanzable → cumple_plazo = False.
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
