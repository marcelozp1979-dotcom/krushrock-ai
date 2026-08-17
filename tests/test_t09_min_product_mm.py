"""
T-09: Umbral de mandíbula sola por modelo (min_product_mm).

Verifica que cada mandíbula usa su propio umbral de producto mínimo
(D-14) en vez de la constante global _JAW_ONLY_MIN_MM.
"""
import pytest

from app.services.recommender import recommend

# Parámetros base: feed fino (120 mm P80), producto 0-60 mm, volumen pequeño
_F80 = 120.0
_PRODUCTOS_60MM = [{"min_mm": 0, "max_mm": 60, "volumen_ton": 100}]
_ROCK = "limestone"
_MESES = 1


def _jaw_only_models(results):
    """Devuelve el set de modelos de mandíbula que aparecen en resultados jaw_only."""
    modelos = set()
    for r in results:
        if r.get("config") == "jaw_only":
            for eq in r.get("equipos", []):
                if eq.get("etapa") == "jaw":
                    modelos.add(eq.get("modelo", ""))
    return modelos


def test_j1480_no_propuesto_jaw_only_para_60mm():
    """J-1480 tiene min_product_mm=100. No debe aparecer en jaw_only para producto de 60 mm."""
    results = recommend(
        rock_type=_ROCK, f80_mm=_F80, products=_PRODUCTOS_60MM,
        duracion_meses=_MESES, inchancables=False, _return_all=True,
    )
    jaw_models = _jaw_only_models(results)
    assert "J-1480" not in jaw_models, (
        f"J-1480 apareció en jaw_only para producto de 60 mm (min_product_mm=100). "
        f"Modelos encontrados: {jaw_models}"
    )


def test_j960_propuesto_jaw_only_para_60mm():
    """J-960 tiene min_product_mm=50. Debe aparecer en jaw_only para producto de 60 mm."""
    results = recommend(
        rock_type=_ROCK, f80_mm=_F80, products=_PRODUCTOS_60MM,
        duracion_meses=_MESES, inchancables=False, _return_all=True,
    )
    jaw_models = _jaw_only_models(results)
    assert "J-960" in jaw_models, (
        f"J-960 no apareció en jaw_only para producto de 60 mm (min_product_mm=50). "
        f"Modelos encontrados: {jaw_models}"
    )



def test_catalogo_min_product_mm_desde_modulo():
    """Verifica min_product_mm directamente del módulo de catálogo (sin HTTP)."""
    from app.routers.equipment import _FALLBACK
    jaws = {eq["model"]: eq for eq in _FALLBACK.get("jaw", [])}
    esperados = {
        "J-960": 50, "J-1160": 50, "J-1170": 75,
        "J-1175": 75, "J-1280": 75, "J-1480": 100,
    }
    for modelo, valor in esperados.items():
        assert modelo in jaws, f"Modelo {modelo} no encontrado en EQ_CATALOG"
        actual = jaws[modelo].get("min_product_mm")
        assert actual == valor, (
            f"{modelo}: min_product_mm esperado {valor}, encontrado {actual}"
        )


def test_j1170_no_jaw_only_para_60mm():
    """J-1170 tiene min_product_mm=75 > 60 mm. No debe aparecer en jaw_only para 60 mm."""
    results = recommend(
        rock_type=_ROCK, f80_mm=_F80, products=_PRODUCTOS_60MM,
        duracion_meses=_MESES, inchancables=False, _return_all=True,
    )
    jaw_models = _jaw_only_models(results)
    assert "J-1170" not in jaw_models, (
        f"J-1170 apareció en jaw_only para 60 mm (min_product_mm=75). "
        f"Modelos: {jaw_models}"
    )
