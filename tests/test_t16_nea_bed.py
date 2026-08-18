"""
Tests T-16 — Factores NEA y BED para capacidad de seleccionadoras (VSMA T-JCI-201).

NEA: penalización por material de tamaño cercano (±25% de la abertura).
BED: penalización por espesor de cama (stub — requiere datos de pantalla).
"""
import pytest
from app.services.screen_capacity import (
    factor_NEA,
    factor_BED,
    nominal_tph,
    nominal_tph_with_feed,
)
from app.services.granulometry import Stream


# ── FACTOR NEA ────────────────────────────────────────────────────────────────

def test_nea_es_uno_sin_near_size():
    """Sin material de tamaño cercano (0%), NEA = 1.00."""
    assert factor_NEA(0.0) == pytest.approx(1.00)


def test_nea_decrece_monotonamente():
    """Más material cercano → menor NEA (monotónico)."""
    values = [factor_NEA(pct) for pct in (0.0, 20.0, 40.0, 60.0, 80.0, 100.0)]
    for i in range(1, len(values)):
        assert values[i] < values[i - 1], (
            f"NEA no es decreciente: NEA({(i-1)*20}%)={values[i-1]:.3f} "
            f"≥ NEA({i*20}%)={values[i]:.3f}"
        )


def test_nea_rango_valido():
    """NEA siempre está entre 0 y 1 para cualquier entrada."""
    for pct in (-10.0, 0.0, 25.0, 50.0, 75.0, 100.0, 150.0):
        nea = factor_NEA(pct)
        assert 0.0 < nea <= 1.0, f"NEA fuera de rango para pct={pct}: {nea}"


def test_nea_consistente_con_paper():
    """
    El paper T-JCI-201 muestra NEA ≈ 0.59 cuando el near-size es significativo.
    En circuito cerrado, el piso inferior recibe alto % de near-size; el factor
    resultante debe caer en el rango [0.50, 0.70].
    """
    nea_40 = factor_NEA(40.0)
    nea_50 = factor_NEA(50.0)
    assert 0.50 <= nea_40 <= 0.75, f"NEA al 40% = {nea_40:.3f}; se esperaba entre 0.50 y 0.75"
    assert 0.45 <= nea_50 <= 0.70, f"NEA al 50% = {nea_50:.3f}; se esperaba entre 0.45 y 0.70"


# ── FACTOR BED ────────────────────────────────────────────────────────────────

def test_bed_uno_cuando_no_hay_datos():
    """BED = 1.0 cuando dm_inches = 0 (datos de ancho/velocidad no disponibles)."""
    assert factor_BED(0.0, 50.0) == pytest.approx(1.0)
    assert factor_BED(0.0, 25.4) == pytest.approx(1.0)


def test_bed_sin_penalizacion_cama_baja():
    """Cama baja (ratio dm/aperture ≤ 4): BED = 1.0."""
    # aperture = 25.4 mm = 1 inch; dm = 3 inches → ratio = 3 < 4
    assert factor_BED(3.0, 25.4) == pytest.approx(1.0)


def test_bed_penaliza_cama_alta():
    """Cama muy alta (ratio ≥ 8): BED ≤ 0.50."""
    # aperture = 25.4 mm = 1 inch; dm = 9 inches → ratio = 9 > 8
    assert factor_BED(9.0, 25.4) == pytest.approx(0.5)


# ── NOMINAL TPH WITH FEED ─────────────────────────────────────────────────────

_SCREEN = {
    "model": "SCREEN-Test",
    "decks": 2,
    "area_m2_per_deck": 7.344,
}


def test_nominal_tph_with_feed_sin_near_size():
    """
    Feed sin material cercano a la malla → nominal_tph_with_feed ≈ nominal_tph.
    La curva del feed tiene todo el material muy por encima de la abertura.
    """
    aperture = 25.4  # 1 inch
    # Feed muy grueso: casi todo > 100 mm → nada cerca de 25 mm
    feed_coarse = Stream(300.0, {50: 2, 100: 5, 200: 20, 400: 60, 800: 100})
    tph_with = nominal_tph_with_feed(_SCREEN, aperture, feed_coarse)
    tph_base = nominal_tph(_SCREEN, aperture)
    # Con casi 0% near-size, la penalización NEA es mínima (NEA ≈ 1.0)
    assert tph_with == pytest.approx(tph_base, rel=0.05), (
        f"Con feed sin near-size: tph_with={tph_with:.1f} debería ≈ tph_base={tph_base:.1f}"
    )


def test_nominal_tph_with_feed_reduce_con_near_size():
    """
    Feed con material concentrado en ±25% de la abertura → NEA < 1 → capacidad reducida.
    """
    aperture = 50.0  # 50 mm
    # Feed mayoritariamente near-size (37.5–62.5 mm): alta concentración alrededor de 50 mm
    feed_near = Stream(300.0, {
        20:  0,
        37.5: 5,   # 0.75 × 50 = 37.5 mm
        50:  50,
        62.5: 90,  # 1.25 × 50 = 62.5 mm
        100: 100,
    })
    # Feed sin near-size (todo muy fino < 10 mm)
    feed_fine = Stream(300.0, {1: 10, 5: 60, 10: 100})

    tph_near = nominal_tph_with_feed(_SCREEN, aperture, feed_near)
    tph_fine = nominal_tph_with_feed(_SCREEN, aperture, feed_fine)

    assert tph_near < tph_fine, (
        f"Feed near-size ({tph_near:.1f} tph) debería dar menor capacidad "
        f"que feed fino ({tph_fine:.1f} tph)"
    )
