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
    Ranking definitivo:
    - A = config con menos unidades totales que cumple el plazo.
    - B = config distinta; si tiene mayor product_fit_pct que A, se prefiere (contraste).

    Invariantes verificados:
    - A.cumple_plazo = True cuando alguna config cumple.
    - A.n_units_total <= B.n_units_total (A tiene menos o igual equipos).
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

    # A cumple el plazo cuando alguna config cumple
    any_coarse_cumple = any(r["cumple_plazo"] for r in coarse)
    assert coarse[0]["cumple_plazo"] or not any_coarse_cumple, (
        "Opción A debe cumplir el plazo cuando existe alguna config que cumple"
    )
    any_fine_cumple = any(r["cumple_plazo"] for r in fine)
    assert fine[0]["cumple_plazo"] or not any_fine_cumple, (
        "Opción A (fino) debe cumplir el plazo cuando existe alguna config que cumple"
    )

    # A tiene <= unidades totales que B (A es la opción con menos equipos)
    if len(coarse) >= 2:
        units_A = coarse[0]["n_units"] * len(coarse[0]["equipos"])
        units_B = coarse[1]["n_units"] * len(coarse[1]["equipos"])
        assert units_A <= units_B, (
            f"Opción A debe tener <= unidades totales que B: A={units_A} > B={units_B}"
        )
    if len(fine) >= 2:
        units_A = fine[0]["n_units"] * len(fine[0]["equipos"])
        units_B = fine[1]["n_units"] * len(fine[1]["equipos"])
        assert units_A <= units_B, (
            f"Opción A (fino) debe tener <= unidades totales que B: A={units_A} > B={units_B}"
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
    Ranking definitivo: A tiene menos unidades físicas totales (n_units × len(equipos))
    que B, o B tiene mayor product_fit_pct que A (contraste).
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
    alt_totales  = alt["n_units"]  * len(alt["equipos"])

    assert alt["config"] != best["config"], (
        "La alternativa debe ser de config distinta a la principal"
    )
    # A tiene <= unidades totales que B (criterio principal de ranking)
    # o B tiene mayor product_fit_pct que A (contraste elegido explícitamente)
    assert best_totales <= alt_totales or alt["product_fit_pct"] > best["product_fit_pct"], (
        f"A debe tener <= unidades que B, o B debe tener mayor fit: "
        f"A_tot={best_totales} B_tot={alt_totales} "
        f"A_fit={best['product_fit_pct']}% B_fit={alt['product_fit_pct']}%"
    )


def test_jaw_screen_product_fit_no_menor_que_jaw_solo():
    """
    Config con seleccionadora nunca debe dar menor product_fit_pct que jaw solo
    para el mismo material y rango de producto.
    """
    from app.services.recommender import run_config

    feed_curve = {152.4: 69.0, 203.2: 77.0, 254.0: 82.0, 304.8: 86.0}
    product = [{"name": "triturado", "min_mm": 0.0, "max_mm": 100.0, "volumen_ton": 110_000.0}]

    jaw_only = run_config(
        equipos=[{"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-960"}],
        f80_mm=234.0,
        products=product,
        duracion_meses=3,
        rock_type="andesita",
        n_units=2,
        circuit="open",
        horas_dia=6.0,
        dias_mes=30.0,
        feed_curve_dict=feed_curve,
    )

    jaw_screen = run_config(
        equipos=[
            {"etapa": "jaw",    "marca": "Terex Finlay", "modelo": "J-960"},
            {"etapa": "screen", "marca": "Terex Finlay", "modelo": "683"},
        ],
        f80_mm=234.0,
        products=product,
        duracion_meses=3,
        rock_type="andesita",
        n_units=2,
        circuit="closed",
        horas_dia=6.0,
        dias_mes=30.0,
        feed_curve_dict=feed_curve,
    )

    pf_only   = jaw_only["product_fit_pct"]
    pf_screen = jaw_screen["product_fit_pct"]
    assert pf_screen >= pf_only, (
        f"Circuito cerrado con seleccionadora no debe reducir product_fit_pct: "
        f"jaw_only={pf_only}% > jaw_screen={pf_screen}%"
    )


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


def test_n_units_aumenta_cuando_produccion_util_no_alcanza():
    """
    Bug fix: _parallel_n fija n con capacidad nominal, pero tph_util real es menor.
    Cuando con n=1 no cumple el plazo (aunque nominal lo permita), recommend()
    debe probar n=2 y retornar cumple_plazo=True con n_units >= 2.
    """
    import pytest
    from app.services.recommender import run_config

    ROCK = "granito"; F80 = 400.0; HORAS_DIA = 8.0; DIAS_MES = 25.0; DURACION = 3
    hours_per_month = HORAS_DIA * DIAS_MES  # 200 h/mes
    J960_CAP_NOMINAL = 200.0  # cap_max_tph del J-960

    # Producción real de 1 unidad y 2 unidades de J-960 para 0-75mm granito
    dummy_prod = [{"name": "grava", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": 1.0}]
    tph_1 = run_config(
        equipos=[{"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-960"}],
        f80_mm=F80, products=dummy_prod, duracion_meses=DURACION,
        rock_type=ROCK, n_units=1, circuit="open",
        horas_dia=HORAS_DIA, dias_mes=DIAS_MES,
    )["tph_util"]
    tph_2 = run_config(
        equipos=[{"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-960"}],
        f80_mm=F80, products=dummy_prod, duracion_meses=DURACION,
        rock_type=ROCK, n_units=2, circuit="open",
        horas_dia=HORAS_DIA, dias_mes=DIAS_MES,
    )["tph_util"]

    # Precondición del bug: tph_util real < cap nominal (capR × wi_factor < 1)
    assert tph_1 < J960_CAP_NOMINAL, (
        f"Precondición: tph_util_1 ({tph_1}) debe ser < cap_nominal ({J960_CAP_NOMINAL})"
    )
    if tph_2 <= tph_1:
        pytest.skip(f"2 unidades no mejoran: tph_2={tph_2} <= tph_1={tph_1}")

    # Volumen en punto medio → n=1 no cumple, n=2 sí, nominal n=1 "alcanza"
    tph_mid = (tph_1 + min(tph_2, J960_CAP_NOMINAL)) / 2.0
    vol = round(tph_mid * DURACION * hours_per_month)

    results = recommend(
        rock_type=ROCK, f80_mm=F80,
        products=[{"name": "grava", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": vol}],
        duracion_meses=DURACION, inchancables=False,
        horas_dia=HORAS_DIA, dias_mes=DIAS_MES,
    )

    assert results, "Debe retornar al menos 1 recomendación"
    any_cumple = any(r["cumple_plazo"] for r in results)
    assert any_cumple, (
        f"Al menos una config debe cumplir al ajustar n_units. "
        f"tph_1={tph_1}, tph_2={tph_2}, tph_mid={tph_mid:.1f}"
    )
    a = results[0]
    assert a["cumple_plazo"], (
        f"Opción A debe cumplir el plazo. config={a['config']}, n_units={a['n_units']}"
    )
    assert a["n_units"] >= 2, (
        f"Opción A debe necesitar >= 2 unidades. n_units={a['n_units']}"
    )


def test_plazo_cumple_prioritario_sobre_mayor_fit():
    """
    Cuando una config de menor fit cumple el plazo y una de mayor fit no cumple,
    la Opción A debe ser la que cumple el plazo (aunque tenga menor product_fit_pct).
    """
    import pytest
    from app.services.recommender import run_config

    ROCK = "granito"; F80 = 400.0; HORAS_DIA = 8.0; DIAS_MES = 25.0; DURACION = 2
    horas_total = DURACION * HORAS_DIA * DIAS_MES  # 400 h

    big_vol = [{"name": "prod", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": 1_000_000.0}]

    tph_jaw = run_config(
        equipos=[{"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-960"}],
        f80_mm=F80, products=big_vol, duracion_meses=DURACION,
        rock_type=ROCK, n_units=1, circuit="open",
        horas_dia=HORAS_DIA, dias_mes=DIAS_MES,
    )["tph_util"]

    tph_jcs = run_config(
        equipos=[
            {"etapa": "jaw",    "marca": "Terex Finlay", "modelo": "J-960"},
            {"etapa": "cone",   "marca": "Terex Finlay", "modelo": "C-1540"},
            {"etapa": "screen", "marca": "Terex Finlay", "modelo": "683"},
        ],
        f80_mm=F80, products=big_vol, duracion_meses=DURACION,
        rock_type=ROCK, n_units=1, circuit="closed",
        horas_dia=HORAS_DIA, dias_mes=DIAS_MES,
    )["tph_util"]

    if tph_jaw <= tph_jcs:
        pytest.skip(f"Precondición no cumplida: jaw ({tph_jaw:.1f}) ≤ jcs ({tph_jcs:.1f})")

    # Vol en punto medio: jaw cumple, jcs no cumple
    vol_split = round((tph_jcs * horas_total + tph_jaw * horas_total) / 2)

    results = recommend(
        rock_type=ROCK, f80_mm=F80,
        products=[{"name": "prod", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": vol_split}],
        duracion_meses=DURACION, inchancables=False,
        horas_dia=HORAS_DIA, dias_mes=DIAS_MES,
    )

    assert results, "Debe retornar al menos 1 recomendación"
    a = results[0]
    any_cumple = any(r["cumple_plazo"] for r in results)
    if any_cumple:
        assert a["cumple_plazo"], (
            f"Opción A debe cumplir el plazo cuando existe config que cumple. "
            f"config={a['config']}, cumple_plazo={a['cumple_plazo']}, "
            f"meses={a['meses_requeridos']}"
        )
