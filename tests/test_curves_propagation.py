"""
KrushRock — Tests de propagación de curvas reales del catálogo al motor.

Verifica que las curvas cargadas en _FALLBACK llegan correctamente
a simulate() a través de _make_jaw_node y de /calculate.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.routers.equipment import _FALLBACK
from app.services.recommender import _make_jaw_node
from app.services.simulation_engine import simulate

client = TestClient(app)


def _get_j1175():
    for eq in _FALLBACK["jaw"]:
        if eq["model"] == "J-1175":
            return eq
    raise AssertionError("J-1175 no encontrado en _FALLBACK")


# ── Test 1: _make_jaw_node propaga curves y product_curve ─────────────────────

def test_make_jaw_node_j1175_lleva_curves_y_product_curve():
    j1175 = _get_j1175()
    node = _make_jaw_node(j1175, 100.0)
    eq = node["equipment"]

    assert eq.get("curves"), "curves debe ser no vacío en el nodo generado"
    assert "css" in eq["curves"] and "tph" in eq["curves"], \
        "curves debe contener claves 'css' y 'tph'"
    assert len(eq["curves"]["css"]) > 1, "curva debe tener más de un punto"

    assert "product_curve" in eq, "product_curve debe estar en el nodo generado"
    assert eq["product_curve"], "product_curve no debe ser vacío"
    assert 1.00 in eq["product_curve"], "product_curve debe tener punto en d/CSS=1.0"


# ── Test 2: simulate con J-1175 reporta cap_nominal desde curva real ──────────

def test_simulate_j1175_usa_cap_nominal_de_curva_en_css100():
    """
    Con CSS forzado a 100 mm, cap_nominal debe ser ~238.5 tph (curva del manual),
    no 452×0.8 (valor que sale de usar cap_max_tph con curvas vacías).
    """
    j1175 = _get_j1175()
    node = _make_jaw_node(j1175, 100.0)
    node["css_mm"] = 100.0  # forzar CSS exacto para que lerp dé el punto del manual

    result = simulate(
        nodes=[node],
        tph=200.0,
        f80=400.0,
        p80_target=100.0,
        rock_type="granito",
        humidity=0,
        circuit="open",
    )
    node_id = node["id"]
    jaw_res = result["node_results"][node_id]

    cap_nominal = jaw_res["cap_nominal"]
    # El manual indica 238.5 tph a CSS 100 (punto medio del rango).
    # Tolerancia de ±5 tph por redondeo en lerp.
    assert abs(cap_nominal - 238.5) <= 5.0, (
        f"cap_nominal esperado ~238.5, obtenido {cap_nominal}. "
        "Revisa que la curva del catálogo llegue al motor."
    )


# ── Test 3: /calculate enriquece nodo con curves vacío desde catálogo ─────────

def test_calculate_enriquece_nodo_j1175_con_curves_vacias():
    """
    Al enviar un nodo J-1175 con curves={}, /calculate debe completarlo
    con la curva del catálogo y reportar cap_nominal ~238.5 a CSS 100.
    """
    payload = {
        "tph": 200.0,
        "f80": 400.0,
        "p80_target": 100.0,
        "rock_type": "granito",
        "circuit": "open",
        "nodes": [
            {
                "id": "jaw_test",
                "type": "jaw",
                "css_mm": 100.0,
                "equipment": {
                    "id": "jaw_J-1175",
                    "brand": "Terex Finlay",
                    "model": "J-1175",
                    "type": "jaw",
                    "specs": {"feedMm": 790, "cssRange": [50, 175]},
                    "curves": {},  # vacío — debe ser completado
                },
            }
        ],
    }
    resp = client.post("/api/v1/simulations/calculate", json=payload)
    assert resp.status_code == 200, f"Error {resp.status_code}: {resp.text[:300]}"

    jaw_res = resp.json()["result"]["node_results"]["jaw_test"]
    cap_nominal = jaw_res["cap_nominal"]
    assert abs(cap_nominal - 238.5) <= 5.0, (
        f"cap_nominal esperado ~238.5 tras enriquecimiento, obtenido {cap_nominal}"
    )
