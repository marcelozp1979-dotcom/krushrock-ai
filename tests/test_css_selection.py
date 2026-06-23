"""
Tests de validación para css_selection.py (Tarea 1).

Prueba principal: round-trip (ida y vuelta)
  - Resolver CSS tal que crusher(feed, css, curve).pXX(80) ≈ target_p80
  - Verificar que el P80 resultante está dentro de ±5% del objetivo

Casos cubiertos:
  - Mandíbula con curva JAW_PRODUCT_NORMALIZED
  - Cono con curva CONE_PRODUCT_NORMALIZED
  - CSS clamped (target fuera del rango → reporta status correcto)
  - Alimentaciones con distintos F80 (ROM grueso, material intermedio)
"""
import sys
import math
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.granulometry import Stream
from app.services.equipment_models import (
    crusher,
    CONE_PRODUCT_NORMALIZED,
    JAW_PRODUCT_NORMALIZED,
    IMPACTOR_PRODUCT_NORMALIZED,
)
from app.services.css_selection import solve_css, CSS_RANGES


# ── FIXTURES ──────────────────────────────────────────────────────────────────

def make_rosin_rammler_stream(f80_mm: float, tph: float = 200.0) -> Stream:
    """Genera una corriente de alimentación típica ROM via Rosin-Rammler (n=0.85)."""
    n = 0.85
    d63 = f80_mm / math.pow(-math.log(0.20), 1.0 / n)
    sieves = [
        406.4, 304.8, 203.2, 152.4, 101.6, 76.2, 50.8, 38.1, 25.4,
        19.05, 12.7, 9.53, 6.35, 4.76, 3.35, 2.38, 1.18, 0.6, 0.3,
    ]
    curve = {}
    for s in sieves:
        curve[s] = 100.0 * (1.0 - math.exp(-math.pow(max(s, 1e-6) / d63, n)))
    curve[f80_mm] = 80.0
    curve[f80_mm * 4.0] = 100.0
    return Stream(tph, curve)


# ── TESTS ROUND-TRIP ──────────────────────────────────────────────────────────

class TestRoundTripCone:
    """CSS cono → P80 → CSS: el CSS resuelto debe producir el P80 solicitado."""

    def test_cone_target_p80_25mm(self):
        """Objetivo típico de producto fino (25 mm)."""
        feed = make_rosin_rammler_stream(f80_mm=80.0)
        target = 25.0
        css_min, css_max = CSS_RANGES["cone"]

        css_solved, p80_achieved, status = solve_css(
            feed, target, CONE_PRODUCT_NORMALIZED, css_min, css_max
        )

        assert status == "solved", f"Esperaba 'solved', obtuvo '{status}'"
        error_pct = abs(p80_achieved - target) / target * 100
        assert error_pct <= 5.0, (
            f"P80 obtenido {p80_achieved:.2f}mm difiere más del 5% del objetivo {target}mm "
            f"(error={error_pct:.1f}%)"
        )

    def test_cone_target_p80_40mm(self):
        """Objetivo intermedio (40 mm)."""
        feed = make_rosin_rammler_stream(f80_mm=120.0)
        target = 40.0
        css_min, css_max = CSS_RANGES["cone"]

        css_solved, p80_achieved, status = solve_css(
            feed, target, CONE_PRODUCT_NORMALIZED, css_min, css_max
        )

        assert status == "solved"
        error_pct = abs(p80_achieved - target) / target * 100
        assert error_pct <= 5.0, (
            f"P80={p80_achieved:.2f}mm vs target={target}mm (error={error_pct:.1f}%)"
        )

    def test_cone_verifica_round_trip(self):
        """
        Round-trip: tomar el CSS resuelto, pasarlo por crusher(),
        verificar que P80 resultado está dentro de ±5% del objetivo.
        Esta es la validación más importante de Tarea 1.
        """
        feed = make_rosin_rammler_stream(f80_mm=100.0)
        targets = [15.0, 25.0, 35.0, 50.0]

        for target in targets:
            css_min, css_max = CSS_RANGES["cone"]
            css_solved, _, status = solve_css(
                feed, target, CONE_PRODUCT_NORMALIZED, css_min, css_max
            )
            if status == "clamped_min" or status == "clamped_max":
                continue  # fuera de rango, ignorar

            # Volver a pasar por crusher con el CSS resuelto
            product_stream = crusher(feed, css_solved, CONE_PRODUCT_NORMALIZED)
            p80_verify = product_stream.pXX(80)

            error_pct = abs(p80_verify - target) / target * 100
            assert error_pct <= 5.0, (
                f"Round-trip falla: target={target}mm, CSS={css_solved:.1f}mm, "
                f"P80_verify={p80_verify:.2f}mm (error={error_pct:.1f}%)"
            )


class TestRoundTripJaw:
    """CSS mandíbula → P80 → CSS: validación round-trip."""

    def test_jaw_target_p80_100mm(self):
        """Objetivo intermedio típico de mandíbula (100 mm)."""
        feed = make_rosin_rammler_stream(f80_mm=350.0)
        target = 100.0
        css_min, css_max = CSS_RANGES["jaw"]

        css_solved, p80_achieved, status = solve_css(
            feed, target, JAW_PRODUCT_NORMALIZED, css_min, css_max
        )

        assert status == "solved"
        error_pct = abs(p80_achieved - target) / target * 100
        assert error_pct <= 5.0, (
            f"P80={p80_achieved:.2f}mm vs target={target}mm (error={error_pct:.1f}%)"
        )

    def test_jaw_round_trip_varios_targets(self):
        """Round-trip para varios objetivos de mandíbula."""
        feed = make_rosin_rammler_stream(f80_mm=400.0)
        targets = [60.0, 80.0, 100.0, 130.0]

        for target in targets:
            css_min, css_max = CSS_RANGES["jaw"]
            css_solved, _, status = solve_css(
                feed, target, JAW_PRODUCT_NORMALIZED, css_min, css_max
            )
            if status != "solved":
                continue

            product_stream = crusher(feed, css_solved, JAW_PRODUCT_NORMALIZED)
            p80_verify = product_stream.pXX(80)

            error_pct = abs(p80_verify - target) / target * 100
            assert error_pct <= 5.0, (
                f"Round-trip jaw: target={target}mm, CSS={css_solved:.1f}mm, "
                f"P80={p80_verify:.2f}mm (error={error_pct:.1f}%)"
            )


class TestCSSRangeClamping:
    """Verifica comportamiento cuando el target cae fuera del rango físico del equipo."""

    def test_target_demasiado_fino_retorna_clamped_min(self):
        """Un P80 imposiblemente fino debe retornar css_min y status clamped_min."""
        feed = make_rosin_rammler_stream(f80_mm=100.0)
        target = 0.1  # imposible para un cono
        css_min, css_max = CSS_RANGES["cone"]

        css_solved, p80_achieved, status = solve_css(
            feed, target, CONE_PRODUCT_NORMALIZED, css_min, css_max
        )

        assert status == "clamped_min"
        assert css_solved == css_min

    def test_target_demasiado_grueso_retorna_clamped_max(self):
        """Un P80 mayor que el máximo del equipo debe retornar css_max y status clamped_max."""
        feed = make_rosin_rammler_stream(f80_mm=50.0)
        target = 10000.0  # imposible
        css_min, css_max = CSS_RANGES["cone"]

        css_solved, p80_achieved, status = solve_css(
            feed, target, CONE_PRODUCT_NORMALIZED, css_min, css_max
        )

        assert status == "clamped_max"
        assert css_solved == css_max

    def test_css_solved_dentro_del_rango_fisico(self):
        """El CSS resuelto siempre debe estar dentro de [css_min, css_max]."""
        feed = make_rosin_rammler_stream(f80_mm=100.0)
        targets = [10.0, 25.0, 45.0, 60.0]
        css_min, css_max = CSS_RANGES["cone"]

        for target in targets:
            css_solved, _, _ = solve_css(
                feed, target, CONE_PRODUCT_NORMALIZED, css_min, css_max
            )
            assert css_min <= css_solved <= css_max, (
                f"CSS={css_solved:.1f}mm fuera de [{css_min}, {css_max}] para target={target}mm"
            )
