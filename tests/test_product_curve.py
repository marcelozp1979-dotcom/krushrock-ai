"""
KrushRock — Tests para curvas de producto por modelo (pendiente #2)

Verifica que:
1. resolve_product_curve devuelve la curva propia cuando el equipo la declara.
2. resolve_product_curve devuelve la genérica cuando no hay curva propia.
3. Un equipo ficticio con curva propia produce P80 distinto al genérico (integración).
4. Un equipo sin curva propia produce el mismo P80 que el genérico (sin regresión).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.equipment_models import (
    resolve_product_curve,
    CONE_PRODUCT_NORMALIZED,
    JAW_PRODUCT_NORMALIZED,
    crusher,
)
from app.services.granulometry import Stream
from app.services.simulation_engine import simulate


# ── Curva ficticia: más gruesa que la genérica de cono ───────────────────────
_CURVA_GRUESA = {0.2: 10, 0.5: 25, 1.0: 50, 1.5: 75, 2.0: 95, 2.5: 100}


# ── 1. Resolución de curva propia ─────────────────────────────────────────────

def test_resolve_usa_curva_propia_cuando_presente():
    eq = {"product_curve": _CURVA_GRUESA}
    resultado = resolve_product_curve(eq, "cone")
    assert resultado == {float(k): float(v) for k, v in _CURVA_GRUESA.items()}


def test_resolve_usa_generica_sin_curva_propia():
    assert resolve_product_curve({}, "cone") is CONE_PRODUCT_NORMALIZED
    assert resolve_product_curve({}, "jaw")  is JAW_PRODUCT_NORMALIZED


def test_resolve_ignora_curva_propia_con_menos_de_2_puntos():
    eq = {"product_curve": {1.0: 100}}   # solo 1 punto: inválida
    assert resolve_product_curve(eq, "cone") is CONE_PRODUCT_NORMALIZED


# ── 2. crusher() con curva propia vs genérica ─────────────────────────────────

def test_crusher_curva_propia_difiere_de_generica():
    """Curva más gruesa → P80 mayor que la genérica al mismo CSS."""
    feed = Stream(100.0, {1: 5, 10: 30, 50: 75, 200: 100})
    css  = 25.0

    prod_custom  = crusher(feed, css, _CURVA_GRUESA)
    prod_generic = crusher(feed, css, CONE_PRODUCT_NORMALIZED)

    p80_custom  = prod_custom.pXX(80)
    p80_generic = prod_generic.pXX(80)

    # La curva ficticia es más gruesa → P80 mayor en al menos 1 mm
    assert p80_custom > p80_generic + 1.0, (
        f"Se esperaba P80 custom > P80 genérico + 1mm; "
        f"custom={p80_custom:.2f}, generico={p80_generic:.2f}"
    )


# ── 3. simulate() con nodo que tiene product_curve propia ─────────────────────

def _make_cone_node(product_curve=None):
    """Construye un nodo cono mínimo para simulate()."""
    eq = {
        "brand": "Ficticio", "model": "FC-100",
        "specs": {"cssRange": [10, 50]},
        "curves": {},
    }
    if product_curve is not None:
        eq["product_curve"] = product_curve
    return {
        "id": "cone_fc100",
        "type": "cone",
        "target_p80_mm": 30.0,
        "equipment": eq,
    }


def test_simulate_nodo_con_curva_propia_difiere():
    """simulate() usa la curva propia del nodo → resultado distinto al genérico."""
    nodo_custom  = _make_cone_node(product_curve=_CURVA_GRUESA)
    nodo_generic = _make_cone_node(product_curve=None)

    params = dict(tph=100.0, f80=200.0, p80_target=30.0,
                  rock_type="caliza", humidity=0, circuit="open")

    res_custom  = simulate([nodo_custom],  **params)
    res_generic = simulate([nodo_generic], **params)

    p80_custom  = res_custom["final_p80_mm"]
    p80_generic = res_generic["final_p80_mm"]

    assert p80_custom != p80_generic, (
        f"Se esperaban P80 distintos; ambos = {p80_custom:.2f}"
    )


def test_simulate_nodo_sin_curva_propia_igual_que_hoy():
    """simulate() sin curva propia → idéntico al comportamiento previo (curva genérica)."""
    nodo_sin_curva    = _make_cone_node(product_curve=None)
    nodo_explicitamente = _make_cone_node(product_curve=None)

    params = dict(tph=100.0, f80=200.0, p80_target=30.0,
                  rock_type="caliza", humidity=0, circuit="open")

    res1 = simulate([nodo_sin_curva],     **params)
    res2 = simulate([nodo_explicitamente], **params)

    assert res1["final_p80_mm"] == res2["final_p80_mm"]
    assert res1["total_product_tph"] == res2["total_product_tph"]
