"""
T-15 — Verificación de la digitalización del paper T-JCI-201.

Reproduce el ejemplo "Comparison of screen sizing" (pp. 38-40 del paper):
  Piso superior: malla 1" (25.4 mm), 75 % área abierta, 15 % oversize,
                 69 % halfsize, eficiencia 95 %  →  13.16 tph/ft²
  Piso inferior: malla ½" (12.7 mm), 65 % área abierta, 18.8 % oversize,
                 35.3 % halfsize, eficiencia 95 %  →  3.97 tph/ft²
Tolerancia ±5 % en ambos pisos.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from app.services.screen_capacity import (
    factor_B, factor_D, factor_V, factor_H, factor_O, factor_F,
    calc_A, calc_tph_deck, nominal_tph,
    M2_TO_FT2,
)


# ── Anclas exactas declaradas en el texto del paper ───────────────────────────

def test_factor_B_ancla_media_pulgada():
    """½" (12.7 mm) → 3.80 tph/ft² (ancla de texto)."""
    assert abs(factor_B(12.7) - 3.80) < 0.01, f"B(½\")={factor_B(12.7):.4f}, esperado 3.80"


def test_factor_B_ancla_una_pulgada():
    """1" (25.4 mm) → 5.50 tph/ft² (ancla de texto)."""
    assert abs(factor_B(25.4) - 5.50) < 0.01, f"B(1\")={factor_B(25.4):.4f}, esperado 5.50"


def test_factor_D_valores_exactos():
    """D = 1.00 / 0.90 / 0.80 / 0.70 para pisos 1/2/3/4 (texto del paper)."""
    assert factor_D(1) == 1.00
    assert factor_D(2) == 0.90
    assert factor_D(3) == 0.80
    assert factor_D(4) == 0.70


def test_factor_V_ancla():
    """25 % oversize → V = 1.00 (ancla de texto)."""
    assert abs(factor_V(25.0) - 1.00) < 0.001


def test_factor_H_ancla():
    """40 % halfsize → H = 1.00 (ancla de texto)."""
    assert abs(factor_H(40.0) - 1.00) < 0.001


def test_factor_F_ancla_noventa():
    """90 % eficiencia → F = 1.00 (ancla de texto)."""
    assert abs(factor_F(90.0) - 1.00) < 0.001


def test_factor_F_ancla_noventa_y_cinco():
    """95 % eficiencia → F = 0.95 (punto de texto del paper)."""
    assert abs(factor_F(95.0) - 0.95) < 0.005, f"F(95%)={factor_F(95.0):.4f}, esperado 0.95"


def test_factor_F_ancla_setenta():
    """70 % eficiencia → F = 1.20 (punto de texto del paper)."""
    assert abs(factor_F(70.0) - 1.20) < 0.01, f"F(70%)={factor_F(70.0):.4f}, esperado 1.20"


# ── Ejemplo completo del paper (±5 %) ────────────────────────────────────────

def test_vsma_ejemplo_piso_superior():
    """
    Piso 1: malla 1" (25.4 mm), 75 % área abierta, 1er piso, 15 % oversize,
    69 % halfsize, 95 % eficiencia → 13.16 tph/ft².
    """
    A = calc_A(
        opening_mm=25.4,
        deck_position=1,
        pct_oversize=15.0,
        pct_halfsize=69.0,
        pct_open_area=75.0,
        efficiency_pct=95.0,
    )
    target = 13.16
    error_pct = abs(A - target) / target * 100
    assert error_pct <= 5.0, (
        f"Piso superior: A={A:.3f} tph/ft², esperado {target} (error {error_pct:.1f} %)"
    )


def test_vsma_ejemplo_piso_inferior():
    """
    Piso 2: malla ½" (12.7 mm), 65 % área abierta, 2do piso, 18.8 % oversize,
    35.3 % halfsize, 95 % eficiencia → 3.97 tph/ft².
    """
    A = calc_A(
        opening_mm=12.7,
        deck_position=2,
        pct_oversize=18.8,
        pct_halfsize=35.3,
        pct_open_area=65.0,
        efficiency_pct=95.0,
    )
    target = 3.97
    error_pct = abs(A - target) / target * 100
    assert error_pct <= 5.0, (
        f"Piso inferior: A={A:.3f} tph/ft², esperado {target} (error {error_pct:.1f} %)"
    )


# ── calc_tph_deck con área conocida ──────────────────────────────────────────

def test_calc_tph_deck_consistente_con_calc_A():
    """calc_tph_deck(area_m2, ...) = area_m2 × M2_TO_FT2 × calc_A(...)."""
    area_m2 = 11.15  # 120 ft² ≈ área del ejemplo del paper
    A = calc_A(25.4, deck_position=1, pct_oversize=15.0, pct_halfsize=69.0,
               pct_open_area=75.0, efficiency_pct=95.0)
    esperado = area_m2 * M2_TO_FT2 * A
    resultado = calc_tph_deck(area_m2, 25.4, deck_position=1,
                              pct_oversize=15.0, pct_halfsize=69.0,
                              pct_open_area=75.0, efficiency_pct=95.0)
    assert abs(resultado - esperado) < 0.01


# ── nominal_tph en catálogo real ─────────────────────────────────────────────

def test_nominal_tph_683_positivo():
    """Terex 683 (area_m2_per_deck=5.475, 2 pisos) a 25.4 mm debe ser > 0."""
    screen_683 = {"model": "683", "decks": 2, "area_m2_per_deck": 5.475}
    cap = nominal_tph(screen_683, aperture_mm=25.4)
    assert cap > 0, f"nominal_tph=0 para el 683 a 1\""


def test_nominal_tph_cero_sin_area():
    """Sin área definida, nominal_tph debe retornar 0."""
    screen_sin_area = {"model": "X", "decks": 2, "area_m2": 0.0}
    cap = nominal_tph(screen_sin_area, aperture_mm=25.4)
    assert cap == 0.0


def test_nominal_tph_crece_con_apertura():
    """A mayor apertura de malla, mayor capacidad nominal."""
    screen = {"model": "Test", "decks": 2, "area_m2_per_deck": 7.0}
    cap_fino = nominal_tph(screen, aperture_mm=12.7)
    cap_grueso = nominal_tph(screen, aperture_mm=25.4)
    assert cap_grueso > cap_fino, (
        f"nominal_tph debe crecer con apertura: {cap_fino:.1f} (½\") < {cap_grueso:.1f} (1\")"
    )
