"""
T-23 — El recomendador no debe forzar mandíbula cuando el material ya está pre-chancado.

Caso real que destapó el bug (07-oct-2026, modo simple):
  granito, 100% del material pasa 38 mm, producto 0–12,7 mm, 30 000 t en 2 meses.
  El sistema proponía J-960 con CSS 40 mm (mayor que todo el feed) → no chanca nada.

Criterios de aceptación:
  1. La opción A (mejor recomendación) NO incluye mandíbula.
  2. El aprovechamiento granulométrico de la opción A supera el 67,5% que daba
     el circuito incorrecto anterior (jaw_screen que solo harnea).
  3. Los 328 tests existentes siguen verdes (verificado por la suite completa).
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from app.services.recommender import recommend

# Curva de alimentación: material pre-chancado, 100% pasa 38 mm
FEED_CURVE_PRECRUSHED = {
    5.0:  10.0,
    10.0: 22.0,
    19.0: 48.0,
    25.0: 68.0,
    32.0: 88.0,
    38.0: 100.0,
}

PRODUCTOS_T23 = [
    {"name": "arena_grava", "min_mm": 0.0, "max_mm": 12.7, "volumen_ton": 30_000.0}
]


def test_t23_opcion_a_no_incluye_mandibula():
    """La mejor opción para feed pre-chancado no debe usar mandíbula."""
    results = recommend(
        rock_type="granito",
        f80_mm=30.0,
        products=PRODUCTOS_T23,
        duracion_meses=2,
        inchancables=False,
        feed_curve_dict=FEED_CURVE_PRECRUSHED,
    )
    assert len(results) >= 1, "Debe retornar al menos una recomendación"

    opcion_a = results[0]
    equipos = opcion_a.get("equipos", [])
    tipos = [eq.get("etapa") for eq in equipos]
    assert "jaw" not in tipos, (
        f"Opción A no debe incluir mandíbula para feed pre-chancado. "
        f"Config: {opcion_a['config']}, tipos: {tipos}"
    )


def test_t23_aprovechamiento_supera_caso_incorrecto():
    """
    El circuito correcto (cone_screen o hsi_screen) debe superar el 67,5%
    de aprovechamiento que daba el circuito incorrecto (jaw_screen que solo harnea).
    """
    results = recommend(
        rock_type="granito",
        f80_mm=30.0,
        products=PRODUCTOS_T23,
        duracion_meses=2,
        inchancables=False,
        feed_curve_dict=FEED_CURVE_PRECRUSHED,
    )
    assert len(results) >= 1

    opcion_a = results[0]
    pf = opcion_a.get("product_fit_pct", 0.0)
    assert pf > 67.5, (
        f"Aprovechamiento {pf:.1f}% debe superar el 67,5% del circuito incorrecto. "
        f"Config: {opcion_a['config']}"
    )


def test_t23_config_esperada_es_cone_o_hsi_screen():
    """La configuración de la opción A debe ser cone_screen o hsi_screen."""
    results = recommend(
        rock_type="granito",
        f80_mm=30.0,
        products=PRODUCTOS_T23,
        duracion_meses=2,
        inchancables=False,
        feed_curve_dict=FEED_CURVE_PRECRUSHED,
    )
    assert len(results) >= 1

    opcion_a = results[0]
    config = opcion_a.get("config")
    assert config in ("cone_screen", "hsi_screen", "cone_cone_screen"), (
        f"Config esperada: cone_screen o hsi_screen, obtuvo: {config}"
    )


def test_t23_mandibulas_descartadas_con_feed_pequeño():
    """
    Si el feed máximo es menor que el CSS mínimo de todas las mandíbulas (40 mm),
    el sistema no propone ninguna config con mandíbula.
    """
    results = recommend(
        rock_type="granito",
        f80_mm=30.0,
        products=PRODUCTOS_T23,
        duracion_meses=2,
        inchancables=False,
        feed_curve_dict=FEED_CURVE_PRECRUSHED,
        _return_all=True,
    )
    jaw_configs = [
        r for r in results
        if any(eq.get("etapa") == "jaw" for eq in r.get("equipos", []))
    ]
    assert len(jaw_configs) == 0, (
        f"No deben generarse configs con mandíbula para feed_max 38 mm. "
        f"Configs con jaw: {[r['config'] for r in jaw_configs]}"
    )


def test_t23_retorna_resultados_con_campos_esperados():
    """Los resultados de T-23 tienen todos los campos necesarios."""
    CAMPOS = {
        "config", "equipos", "n_units", "tph_efectivo",
        "product_fit_pct", "circ_load_pct", "cumple_plazo",
        "pct_cumplimiento", "inchancables_recomendado",
    }
    results = recommend(
        rock_type="granito",
        f80_mm=30.0,
        products=PRODUCTOS_T23,
        duracion_meses=2,
        inchancables=False,
        feed_curve_dict=FEED_CURVE_PRECRUSHED,
    )
    assert len(results) >= 1
    for r in results:
        missing = CAMPOS - r.keys()
        assert not missing, f"Faltan campos: {missing}"
