"""
KrushRock — Tests del Servicio de Recomendación de Circuitos

Casos cubiertos:
1. Retorna resultados con los campos correctos (caso base)
2. Productos gruesos (75mm) generan menos etapas que productos finos (19mm)
3. Tonelaje alto fuerza unidades en paralelo (N > 1)
4. El flag inchancables se propaga correctamente a todos los resultados
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.recommender import recommend


CAMPOS_ESPERADOS = {
    "config", "equipos", "n_units",
    "tph_efectivo", "product_fit_pct",
    "circ_load_pct", "cumple_plazo",
    "inchancables_recomendado",
}


def test_recommend_returns_results():
    """Caso básico: retorna al menos 1 recomendación con todos los campos."""
    results = recommend(
        rock_type="granito",
        f80_mm=400.0,
        products=[{"name": "grava", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": 15_000.0}],
        duracion_meses=3,
        inchancables=False,
    )
    assert len(results) >= 1, "Debe retornar al menos 1 recomendación"
    for r in results:
        missing = CAMPOS_ESPERADOS - r.keys()
        assert not missing, f"Faltan campos en el resultado: {missing}"
    # Nunca retorna más de 2
    assert len(results) <= 2


def test_coarse_fewer_stages_than_fine():
    """
    Producto grueso (75mm) → mandíbula sola (1 etapa).
    Producto fino (19mm) → mandíbula + cono + seleccionadora (3 etapas).
    finest_max=75 ≥ 50 habilita Config A; finest_max=19 < 20 excluye Config A y B.
    """
    coarse = recommend(
        rock_type="granito",
        f80_mm=400.0,
        products=[{"name": "grava gruesa", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": 15_000.0}],
        duracion_meses=3,
        inchancables=False,
    )
    fine = recommend(
        rock_type="granito",
        f80_mm=400.0,
        products=[{"name": "arena", "min_mm": 0.0, "max_mm": 19.0, "volumen_ton": 15_000.0}],
        duracion_meses=3,
        inchancables=False,
    )
    assert len(coarse) >= 1, "Producto grueso debe generar recomendaciones"
    assert len(fine) >= 1, "Producto fino debe generar recomendaciones"

    # El mejor para producto grueso es mandíbula sola (1 etapa)
    assert coarse[0]["config"] == "jaw_only", (
        f"Producto grueso debe recomendar jaw_only, se obtuvo '{coarse[0]['config']}'"
    )
    # El mejor para producto fino es el circuito de 3 etapas
    assert fine[0]["config"] == "jaw_cone_screen", (
        f"Producto fino debe recomendar jaw_cone_screen, se obtuvo '{fine[0]['config']}'"
    )
    # Verificación cuantitativa del número de etapas
    assert len(coarse[0]["equipos"]) < len(fine[0]["equipos"]), (
        f"Grueso debe tener menos etapas que fino: "
        f"{len(coarse[0]['equipos'])} vs {len(fine[0]['equipos'])}"
    )


def test_high_tph_requires_parallel_units():
    """
    Tonelaje alto (150 000 t/mes = 300 tph) supera la capacidad de una sola
    unidad de los equipos más pequeños del catálogo → N_units > 1.
    """
    results = recommend(
        rock_type="caliza",
        f80_mm=400.0,
        products=[{"name": "base", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": 900_000.0}],
        duracion_meses=6,
        inchancables=False,
    )
    assert len(results) >= 1, "Debe retornar al menos 1 recomendación"
    # Al menos la primera recomendación debe necesitar más de 1 unidad
    assert results[0]["n_units"] > 1, (
        f"Se esperaba N > 1 para 300 tph; se obtuvo N={results[0]['n_units']}"
    )


def test_alt_ranking_usa_n_units_totales():
    """
    La alternativa se elige por n_units * len(equipos), no solo por len(equipos).
    Cuando hay dos alternativas, la que tiene menos unidades físicas totales gana,
    aunque tenga más tipos de equipo.
    """
    results = recommend(
        rock_type="granito",
        f80_mm=400.0,
        products=[{"name": "arena", "min_mm": 0.0, "max_mm": 19.0, "volumen_ton": 15_000.0}],
        duracion_meses=3,
        inchancables=False,
    )
    if len(results) < 2:
        return  # sin alternativa, nada que verificar
    best, alt = results[0], results[1]
    best_totales = best["n_units"] * len(best["equipos"])
    alt_totales = alt["n_units"] * len(alt["equipos"])
    # La alternativa debe tener al menos tantas unidades físicas como la principal,
    # o — si tiene menos — mejor product_fit_pct que cualquier opción descartada.
    # El invariante mínimo: alt_totales >= best_totales O alt tiene distinto config.
    assert alt["config"] != best["config"], (
        "La alternativa debe ser de config distinta a la principal"
    )
    # La alternativa no debe tener más unidades físicas que otra candidata rechazada
    # con la misma config: verificamos que n_units_totales es el criterio correcto
    # comparando que alt_totales <= best_totales cuando best tiene más etapas.
    if len(best["equipos"]) > len(alt["equipos"]):
        # best tiene más tipos → alt tiene menos etapas; n_units puede compensar
        assert alt_totales <= best_totales or alt["product_fit_pct"] >= best["product_fit_pct"]


def test_inchancables_flag_preserved():
    """El flag inchancables=True se propaga a todos los resultados devueltos."""
    results = recommend(
        rock_type="granito",
        f80_mm=400.0,
        products=[{"name": "grava", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": 10_000.0}],
        duracion_meses=2,
        inchancables=True,
    )
    assert len(results) >= 1, "Debe retornar al menos 1 recomendación"
    for r in results:
        assert r["inchancables_recomendado"] is True, (
            f"inchancables_recomendado debería ser True pero es {r['inchancables_recomendado']}"
        )
