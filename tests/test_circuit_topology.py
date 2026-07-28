"""
KrushRock — Tests de topología de circuitos (PARTE B)

Verifica reglas nuevas del recomendador:
1. jaw_screen siempre genera circuit="open"
2. Para granito F80=160mm producto 0-25.4mm: ninguna config jaw_screen closed
3. Mismo caso: al menos una config con cono terciario (jaw_cone_cone_screen o cone_cone_screen)
4. jaw_only (si aparece) no reporta product_fit_pct=100%
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from app.services.recommender import recommend

# Caso central: granito, F80 160mm, producto fino 0-25.4mm, 500000 t
# feed_max_material_mm se deriva internamente: 160/0.8 = 200mm
_GRANITO_FINO = {
    "rock_type": "granito",
    "f80_mm": 160.0,
    "products": [
        {"name": "arena_grava", "min_mm": 0.0, "max_mm": 25.4, "volumen_ton": 500_000.0}
    ],
    "duracion_meses": 12,
    "inchancables": False,
}


def _get_candidates(**kwargs):
    """Llama recommend() y devuelve lista de resultados."""
    return recommend(**kwargs)


def test_jaw_screen_siempre_open():
    """Toda config jaw_screen generada debe tener circuit='open'."""
    results = _get_candidates(**_GRANITO_FINO)
    jaw_screen_results = [r for r in results if r.get("config") == "jaw_screen"]
    for r in jaw_screen_results:
        assert r.get("circuit") == "open", (
            f"jaw_screen generó circuit='{r.get('circuit')}'; debe ser siempre 'open'"
        )


def test_no_jaw_screen_closed_granito_fino():
    """Con granito F80=160mm y producto 0-25.4mm no debe aparecer jaw_screen closed."""
    results = _get_candidates(**_GRANITO_FINO)
    violadores = [
        r for r in results
        if r.get("config") == "jaw_screen" and r.get("circuit") == "closed"
    ]
    assert violadores == [], (
        f"Se generaron {len(violadores)} config jaw_screen con circuit=closed: "
        f"{[v.get('equipos') for v in violadores]}"
    )


def test_hay_config_con_cono_terciario():
    """Con granito F80=160mm producto 0-25.4mm debe aparecer jaw_cone_cone_screen o cone_cone_screen."""
    results = _get_candidates(**_GRANITO_FINO)
    configs_terciario = [
        r for r in results
        if r.get("config") in ("jaw_cone_cone_screen", "cone_cone_screen")
    ]
    infeasibles = [r for r in results if r.get("config") == "infeasible"]
    if infeasibles and len(infeasibles) == len(results):
        pytest.skip("Catálogo sin equipos viables para este caso — infeasible esperado")

    assert len(configs_terciario) > 0, (
        f"Ninguna config con cono terciario en resultados. Configs encontradas: "
        f"{[r.get('config') for r in results]}"
    )


def test_jaw_only_no_es_100_pct():
    """jaw_only (si aparece) no puede reportar product_fit_pct=100%."""
    results = _get_candidates(**_GRANITO_FINO)
    jaw_only_results = [r for r in results if r.get("config") == "jaw_only"]
    for r in jaw_only_results:
        pct = r.get("product_fit_pct", 0)
        assert pct < 100.0, (
            f"jaw_only reportó product_fit_pct={pct}% (esperado < 100%)"
        )


def test_jaw_screen_open_circuito_producto_degradado():
    """
    jaw_screen en circuito abierto debe reportar product_fit_pct < 100% para producto fino.
    Verifica que el oversize se descarta honestamente.
    """
    results = _get_candidates(**_GRANITO_FINO)
    jaw_screen_results = [r for r in results if r.get("config") == "jaw_screen"]
    for r in jaw_screen_results:
        pct = r.get("product_fit_pct", 0)
        assert pct < 100.0, (
            f"jaw_screen open reportó product_fit_pct={pct}% — oversize no se está descartando"
        )
        assert pct < 90.0, (
            f"jaw_screen open reportó {pct}% — valor sospechosamente alto para producto fino 25.4mm"
        )
