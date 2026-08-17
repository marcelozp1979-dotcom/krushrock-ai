"""
T-07: Horas de operación como dato de entrada.

hours_per_month_input se pasa directamente; el sistema lo usa en lugar de la constante.
El plazo calculado debe escalar en proporción inversa a las horas/mes.
"""
import pytest
from app.services.recommender import recommend, run_config

_CASO = {
    "rock_type": "granito",
    "f80_mm": 150.0,
    "products": [{"name": "grava", "min_mm": 0, "max_mm": 50, "volumen_ton": 500_000}],
    "duracion_meses": 12,
    "inchancables": False,
}


def test_campo_hours_per_month_used_presente():
    """El campo hours_per_month_used aparece en todos los resultados."""
    results = recommend(**_CASO, _return_all=True)
    assert results
    for r in results:
        assert "hours_per_month_used" in r, f"Falta campo en config={r['config']}"
        assert r["hours_per_month_used"] > 0


def test_default_500_cuando_no_se_pasa():
    """Sin hours_per_month_input, el sistema usa el valor por defecto (500 h/mes)."""
    results = recommend(**_CASO)
    for r in results:
        assert r["hours_per_month_used"] == 500.0


def test_plazo_escala_inversamente_con_horas():
    """
    Con menos horas disponibles por mes, el mismo volumen requiere más meses.
    meses(400h) = meses(500h) × (500/400) de forma exacta para el MISMO equipo.

    Usamos run_config() con equipo fijo (n_units=1) para aislar el efecto de horas:
    la simulación es idéntica; solo cambia la división final del plazo.
    """
    from app.services.recommender import run_config

    equipos = [
        {"etapa": "jaw",    "marca": "Terex Finlay", "modelo": "J-1170"},
        {"etapa": "screen", "marca": "Terex Finlay", "modelo": "683"},
    ]
    kwargs = dict(
        equipos=equipos,
        f80_mm=150.0,
        products=[{"name": "g", "min_mm": 0, "max_mm": 50, "volumen_ton": 500_000}],
        duracion_meses=12,
        rock_type="granito",
        n_units=1,
        circuit="open",
    )

    r500 = run_config(**kwargs, hours_per_month_input=500.0)
    r400 = run_config(**kwargs, hours_per_month_input=400.0)

    assert r500["hours_per_month_used"] == 500.0
    assert r400["hours_per_month_used"] == 400.0

    mr500 = r500.get("meses_requeridos")
    mr400 = r400.get("meses_requeridos")
    if mr500 is None or mr400 is None or mr500 == 0:
        pytest.skip("Caso inalcanzable")

    # meses ∝ 1/hours_per_month para mismo tph_total — tolerancia 2% por redondeo
    ratio_real = mr400 / mr500
    ratio_esp  = 500.0 / 400.0
    assert abs(ratio_real - ratio_esp) / ratio_esp < 0.02, (
        f"Plazo no escaló: meses(500h)={mr500}, meses(400h)={mr400}, "
        f"ratio={ratio_real:.4f}, esperado={ratio_esp:.4f}"
    )


def test_hours_per_month_used_refleja_valor_pasado():
    """El campo hours_per_month_used devuelve exactamente el valor ingresado."""
    results = recommend(**_CASO, hours_per_month_input=420.0)
    for r in results:
        assert r["hours_per_month_used"] == 420.0


def test_hours_per_month_input_prioridad_sobre_horas_dia_dias_mes():
    """hours_per_month_input tiene prioridad sobre horas_dia × dias_mes."""
    # 10 h/día × 25 días = 250 h/mes, pero hours_per_month_input = 400
    results = recommend(**_CASO, horas_dia=10.0, dias_mes=25.0, hours_per_month_input=400.0)
    for r in results:
        assert r["hours_per_month_used"] == 400.0
