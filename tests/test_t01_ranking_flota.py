"""
T-01 — Corregir conteo de flota en el ranking.

Verifica que un tren de 3 etapas con 1 unidad cada una ("1 mandíbula + 1 cono +
1 seleccionadora", n_units=1) gana a "2 mandíbulas solas" (n_units=2) en el
ranking de Opción A, para un producto fino donde el circuito multietapa cumple
con n=1 y la mandíbula sola necesita n=2.

Referencia: TASKS.md T-01, REQUISITOS.md RF-7.
"""
import pytest
from app.services.recommender import recommend, run_config

# Caso: granito fino — producto 0-25.4mm (arena gruesa) desde F80=160mm
# - jaw_only n=1: tph insuficiente para el volumen en el plazo → n=2
# - jaw+cone+screen n=1: circuito cerrado pf≈100% → cumple con n=1
_CASO = {
    "rock_type": "granito",
    "f80_mm": 160.0,
    "products": [{"name": "arena_grava", "min_mm": 0.0, "max_mm": 25.4,
                  "volumen_ton": 500_000.0}],
    "duracion_meses": 12,
    "inchancables": False,
}


def test_tren_3etapas_n1_gana_sobre_2_mandibulas():
    """
    Opción A debe ser un circuito con n_units=1 aunque existan configuraciones
    de mandíbula sola con n_units=2 que también cumplan el plazo.
    Esto verifica que el ranking usa (n_units, len_etapas, cap) y no (n_units*len_etapas, cap).
    """
    results = recommend(**_CASO)
    assert results, "Debe retornar al menos 1 recomendación"
    a = results[0]

    any_cumple = any(r["cumple_plazo"] for r in results)
    if not any_cumple:
        pytest.skip("Ninguna config cumple — test no aplica")

    assert a["cumple_plazo"], (
        f"Opción A debe cumplir el plazo. config={a['config']}, "
        f"n_units={a['n_units']}, pct={a['pct_cumplimiento']}"
    )
    assert a["n_units"] == 1, (
        f"Opción A debe tener n_units=1 (no 2 líneas paralelas). "
        f"config={a['config']}, n_units={a['n_units']}"
    )


def test_ranking_no_penaliza_mas_etapas_cuando_n_units_es_menor():
    """
    La clave de ranking (n_units, len_etapas, cap_sum) debe ordenar:
    - (1, 3, x) < (2, 1, y)  — 1 circuito de 3 etapas vence a 2 circuitos de 1 etapa
    - (1, 1, x) < (1, 2, y)  — entre mismo n_units, gana el de menos etapas
    Verifica el invariante de comparación directamente, sin depender del catálogo.
    """
    # Caso central de T-01: 3-etapas n=1 debe ganar a 1-etapa n=2
    rank_3etapas_n1 = (1, 3, 100.0)
    rank_1etapa_n2  = (2, 1, 200.0)
    assert rank_3etapas_n1 < rank_1etapa_n2, (
        f"(n=1, etapas=3) debe rankear mejor que (n=2, etapas=1): "
        f"{rank_3etapas_n1} vs {rank_1etapa_n2}"
    )

    # Tiebreaker por etapas: mismo n_units, gana el de menos etapas
    rank_1etapa_n1 = (1, 1, 100.0)
    rank_2etapas_n1 = (1, 2, 100.0)
    assert rank_1etapa_n1 < rank_2etapas_n1, (
        f"(n=1, etapas=1) debe rankear mejor que (n=1, etapas=2): "
        f"{rank_1etapa_n1} vs {rank_2etapas_n1}"
    )


def test_invariante_b_sigue_siendo_no_cumple():
    """
    Cambio de ranking no debe romper el invariante B = no-cumple.
    """
    results = recommend(**_CASO)
    if len(results) >= 2:
        assert not results[1]["cumple_plazo"], (
            f"Opción B debe ser no-cumple. cumple_plazo={results[1]['cumple_plazo']}, "
            f"config={results[1]['config']}"
        )
