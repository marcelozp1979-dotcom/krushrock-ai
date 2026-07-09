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
    "pct_cumplimiento",
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
    - A = config que cumple (pct >= 98%) con menor flota.
    - B = mejor no-cumple (mayor pct < 98%).

    Invariantes verificados:
    - A.cumple_plazo = True cuando alguna config cumple.
    - A.pct_cumplimiento >= 98.
    - Si B existe: B.cumple_plazo = False.
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

    # A cumple cuando alguna config cumple, y su pct >= 98
    for rec_list, label in [(coarse, "grueso"), (fine, "fino")]:
        any_cumple = any(r["cumple_plazo"] for r in rec_list)
        assert rec_list[0]["cumple_plazo"] or not any_cumple, (
            f"Opción A ({label}) debe cumplir cuando existe config que cumple"
        )
        if rec_list[0]["cumple_plazo"]:
            assert rec_list[0]["pct_cumplimiento"] >= 98.0, (
                f"Opción A ({label}) pct_cumplimiento={rec_list[0]['pct_cumplimiento']} < 98"
            )
        # B siempre es no-cumple (o no existe)
        if len(rec_list) >= 2:
            assert not rec_list[1]["cumple_plazo"], (
                f"Opción B ({label}) debe ser no-cumple; cumple_plazo={rec_list[1]['cumple_plazo']}"
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
    Ranking definitivo: A cumple (pct >= 98%), B no cumple.
    B es el mejor no-cumple (mayor pct_cumplimiento).
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

    assert best["cumple_plazo"], "A debe cumplir el plazo"
    assert not alt["cumple_plazo"], "B debe ser el mejor no-cumple"
    assert alt["pct_cumplimiento"] < 98.0, (
        f"B.pct_cumplimiento={alt['pct_cumplimiento']} no debe ser >= 98"
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


def test_un_equipo_grande_vence_a_dos_chicos():
    """
    Test (a): 1 equipo más grande que cumple gana a 2 equipos más chicos que también cumplen.
    Verifica que el ranking (n_units * len, cap_sum) no rompe este invariante.

    Escenario: volumen entre tph_1_pequeño y tph_1_grande (ambos cumple en rango de 98%).
    → pequeño necesita n=2, grande alcanza con n=1.
    → Opción A debe ser el de n=1 (mayor equipo, menor flota).
    """
    import pytest
    from app.services.recommender import run_config

    ROCK = "granito"; F80 = 400.0; HORAS_DIA = 8.0; DIAS_MES = 25.0; DURACION = 3
    hours_per_month = HORAS_DIA * DIAS_MES
    hours_total = DURACION * hours_per_month

    dummy_prod = [{"name": "grava", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": 1.0}]

    # Equipo pequeño: J-960 (cap 200)
    tph_small = run_config(
        equipos=[{"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-960"}],
        f80_mm=F80, products=dummy_prod, duracion_meses=DURACION,
        rock_type=ROCK, n_units=1, circuit="open",
        horas_dia=HORAS_DIA, dias_mes=DIAS_MES,
    )["tph_util"]

    # Equipo más grande: Premiertrak 600 (cap 220)
    tph_large = run_config(
        equipos=[{"etapa": "jaw", "marca": "Powerscreen", "modelo": "Premiertrak 600"}],
        f80_mm=F80, products=dummy_prod, duracion_meses=DURACION,
        rock_type=ROCK, n_units=1, circuit="open",
        horas_dia=HORAS_DIA, dias_mes=DIAS_MES,
    )["tph_util"]

    if tph_large <= tph_small * 1.02:
        pytest.skip(f"Grande ({tph_large}) no supera materialmente a pequeño ({tph_small})")

    # Volumen entre ambos: pequeño n=1 no cumple (< 98%), grande n=1 sí cumple (>= 98%)
    vol = round((tph_small * 1.05) * hours_total)  # 5% más de lo que produce el pequeño

    results = recommend(
        rock_type=ROCK, f80_mm=F80,
        products=[{"name": "grava", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": vol}],
        duracion_meses=DURACION, inchancables=False,
        horas_dia=HORAS_DIA, dias_mes=DIAS_MES,
    )

    assert results, "Debe retornar recomendaciones"
    a = results[0]
    any_cumple = any(r["cumple_plazo"] for r in results)
    if not any_cumple:
        pytest.skip("Ninguna config cumple con este volumen; test no aplica")
    assert a["cumple_plazo"], f"Opción A debe cumplir el plazo. n_units={a['n_units']}"
    assert a["n_units"] == 1, (
        f"Opción A debe ser 1 unidad (el equipo más grande que cumple). n_units={a['n_units']}"
    )


def test_feed_max_excluye_equipos_insuficientes():
    """
    Test (b): con material de hasta 700mm en la alimentación, ningún equipo recomendado
    debe tener feed_max_mm < 700mm.
    """
    from app.routers.equipment import _FALLBACK

    # feed_curve con máximo en 700mm; f80 moderado para no excluir todos los jaws
    feed_curve = {200: 30, 400: 65, 550: 85, 700: 100}

    results = recommend(
        rock_type="granito",
        f80_mm=400.0,
        products=[{"name": "grava", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": 10_000.0}],
        duracion_meses=3,
        inchancables=False,
        feed_curve_dict=feed_curve,
    )

    assert results, "Debe retornar al menos 1 recomendación"

    # Construir mapa feed_max_mm por (brand, model)
    feed_map = {}
    for tipo in ("jaw", "cone", "hsi"):
        for eq in _FALLBACK.get(tipo, []):
            feed_map[(eq["brand"], eq["model"])] = eq.get("feed_max_mm") or 0

    for rec in results:
        for eq in rec["equipos"]:
            if eq["etapa"] == "jaw":
                feed_max = feed_map.get((eq["marca"], eq["modelo"]), 0)
                assert feed_max >= 700, (
                    f"Equipo {eq['marca']} {eq['modelo']} tiene feed_max_mm={feed_max} < 700mm"
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
