"""
T-17 — Aprovechamiento real en vez de umbral fijo _JAW_SCREEN_MIN_MM.

Verifica que:
  1. jaw+seleccionadora con producto fino (<20 mm) ya NO se descarta.
  2. Si el aprovechamiento es < 70 %, la advertencia incluye el % real.
  3. El C2 ("mitad de cámara") ya no aparece en mensajes de check_cone_chamber_fit.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from app.services.recommender import recommend
from app.services.selection_rules import check_cone_chamber_fit


# ── 1. jaw+screen con producto fino no se descarta ────────────────────────────

def test_jaw_screen_fino_no_descartado():
    """
    Producto de 15 mm (antes bloqueado por _JAW_SCREEN_MIN_MM=20) debe
    generar al menos un candidato jaw_screen en los resultados.
    """
    results = recommend(
        rock_type="caliza",
        f80_mm=100.0,
        products=[{"name": "fino", "min_mm": 0, "max_mm": 15, "volumen_ton": 5000}],
        duracion_meses=3,
        inchancables=False,
        _return_all=True,
    )
    configs = [r["config"] for r in results]
    assert "jaw_screen" in configs, (
        f"jaw+screen debe generarse para producto de 15 mm; configs encontradas: {configs}"
    )


# ── 2. Advertencia con % real cuando aprovechamiento < 70 % ──────────────────

def test_advertencia_aprovechamiento_con_porcentaje_real():
    """
    Si product_fit_pct < 70 % en un resultado jaw_screen, la lista advertencias
    debe contener un mensaje con el porcentaje real (como número entero + '%').
    """
    results = recommend(
        rock_type="caliza",
        f80_mm=100.0,
        products=[{"name": "fino", "min_mm": 0, "max_mm": 15, "volumen_ton": 5000}],
        duracion_meses=3,
        inchancables=False,
        _return_all=True,
    )
    jaw_screen_results = [r for r in results if r["config"] == "jaw_screen"]
    assert jaw_screen_results, "No hay resultados jaw_screen — el test previo ya validó esto"

    for r in jaw_screen_results:
        pf = r["product_fit_pct"]
        if pf < 70.0:
            advertencias = r.get("advertencias", [])
            adv_aprov = [a for a in advertencias if "aprovechamiento" in a.lower()]
            assert adv_aprov, (
                f"Con aprovechamiento {pf:.0f}% < 70%, debe haber advertencia; "
                f"advertencias actuales: {advertencias}"
            )
            pf_str = f"{int(round(pf))}%"
            assert pf_str in adv_aprov[0], (
                f"La advertencia debe incluir el % real ({pf_str}); "
                f"advertencia: {adv_aprov[0]}"
            )


# ── 3. C2 ("mitad de cámara") eliminado de check_cone_chamber_fit ────────────

def test_c2_eliminado_de_check_cone_chamber_fit():
    """
    check_cone_chamber_fit ya no debe mencionar 'mitad de cámara' ni 'mid_chamber_mm'.
    """
    cone = {
        "model": "TestCono",
        "feed_max_mm": 200,
    }
    feed_curve = {200: 100, 100: 75, 50: 50, 25: 30, 10: 15}
    _, msg = check_cone_chamber_fit(cone, feed_p80_mm=100.0, feed_curve_dict=feed_curve)

    assert "mid_chamber_mm" not in msg, (
        f"C2 eliminado: 'mid_chamber_mm' no debe aparecer en el mensaje; msg: {msg}"
    )
    assert "C2" not in msg, (
        f"C2 eliminado: 'C2' no debe aparecer en el mensaje; msg: {msg}"
    )
