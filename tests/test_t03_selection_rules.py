"""
T-03 — Módulo único de reglas de descarte.

Tests unitarios para app/services/selection_rules.py:
  - Un caso que pasa y uno que no por cada regla.
  - Reglas 4 y 5 siempre retornan ok=True (son advertencias).
  - Verificar que recommender.py importa y usa las funciones correctamente.

Referencia: TASKS.md T-03, REQUISITOS.md RF-5.
"""
import pytest
from app.services.selection_rules import (
    check_crusher_feed,
    check_reduction_ratio,
    check_screen_decks,
    check_cone_choke_feed,
    check_cone_chamber_fit,
    _P100_FACTOR,
    _MAX_RATIO,
)


# ── Regla 1: boca de entrada ──────────────────────────────────────────────────

def test_check_crusher_feed_pasa():
    """Mandíbula con boca 800 mm acepta material de 600 mm."""
    jaw = {"model": "J-1280", "feed_max_mm": 800}
    ok, motivo = check_crusher_feed(jaw, 600.0)
    assert ok is True
    assert "600" in motivo or "acepta" in motivo.lower()


def test_check_crusher_feed_falla():
    """Mandíbula con boca 500 mm no acepta material de 700 mm."""
    jaw = {"model": "J-960", "feed_max_mm": 500}
    ok, motivo = check_crusher_feed(jaw, 700.0)
    assert ok is False
    assert "descarta" in motivo.lower() or "insuficiente" in motivo.lower()


def test_check_crusher_feed_limite_exacto():
    """Boca exactamente igual al material → pasa."""
    eq = {"model": "X", "feed_max_mm": 300}
    ok, _ = check_crusher_feed(eq, 300.0)
    assert ok is True


# ── Regla 2: razón de reducción ───────────────────────────────────────────────

def test_check_reduction_ratio_pasa_jaw():
    """Mandíbula: feed 400 mm, CSS 80 mm → ratio = 400/(80×2.5)=2.0 < 6. Pasa."""
    ok, motivo = check_reduction_ratio("jaw", 400.0, 80.0)
    assert ok is True
    assert "2.0" in motivo


def test_check_reduction_ratio_falla_jaw():
    """Mandíbula: feed 400 mm, CSS 10 mm → ratio = 400/(10×2.5)=16 > 6. Falla."""
    ok, motivo = check_reduction_ratio("jaw", 400.0, 10.0)
    assert ok is False
    assert "supera" in motivo.lower() or "etapa adicional" in motivo.lower()


def test_check_reduction_ratio_pasa_cone():
    """Cono: feed 100 mm, CSS 20 mm → ratio = 100/(20×1.6)=3.125 < 5. Pasa."""
    ok, _ = check_reduction_ratio("cone", 100.0, 20.0)
    assert ok is True


def test_check_reduction_ratio_falla_cone():
    """Cono: feed 200 mm, CSS 10 mm → ratio = 200/(10×1.6)=12.5 > 5. Falla."""
    ok, motivo = check_reduction_ratio("cone", 200.0, 10.0)
    assert ok is False


def test_check_reduction_ratio_css_cero():
    """CSS=0 siempre falla."""
    ok, motivo = check_reduction_ratio("jaw", 400.0, 0.0)
    assert ok is False
    assert "inválido" in motivo.lower() or "0" in motivo


# ── Regla 3: decks de la seleccionadora ───────────────────────────────────────

def test_check_screen_decks_pasa_2productos():
    """2 productos → 2 decks basta."""
    screen = {"model": "683", "decks": 2}
    ok, motivo = check_screen_decks(screen, 2)
    assert ok is True


def test_check_screen_decks_falla_3productos():
    """3 productos → 2 decks no alcanzan, necesita 3."""
    screen = {"model": "683", "decks": 2}
    ok, motivo = check_screen_decks(screen, 3)
    assert ok is False
    assert "insuficientes" in motivo.lower() or "3" in motivo


def test_check_screen_decks_pasa_3productos():
    """3 productos → 3 decks pasa."""
    screen = {"model": "triple", "decks": 3}
    ok, _ = check_screen_decks(screen, 3)
    assert ok is True


# ── Regla 4: choke feed del cono (ADVERTENCIA) ────────────────────────────────

def test_check_cone_choke_feed_ok_siempre_retorna_true():
    """Regla 4 es advertencia: ok=True incluso con carga muy baja."""
    cone = {"model": "C-1540", "cap_max_tph": 200}
    ok, _ = check_cone_choke_feed(cone, 50.0)   # 25% — muy bajo
    assert ok is True


def test_check_cone_choke_feed_mensaje_advertencia_cuando_bajo():
    """Si la carga está por debajo del 80%, el motivo debe indicar advertencia."""
    cone = {"model": "C-1540", "cap_max_tph": 200}
    ok, motivo = check_cone_choke_feed(cone, 100.0)  # 50%
    assert ok is True
    assert "ADVERTENCIA" in motivo or "advertencia" in motivo.lower()


def test_check_cone_choke_feed_sin_advertencia_cuando_80pct():
    """Si la carga es ≥ 80%, no debe aparecer ADVERTENCIA en el motivo."""
    cone = {"model": "C-1540", "cap_max_tph": 200}
    ok, motivo = check_cone_choke_feed(cone, 170.0)  # 85%
    assert ok is True
    assert "ADVERTENCIA" not in motivo


# ── Regla 5: calce de cámara del cono (ADVERTENCIA) ──────────────────────────

def test_check_cone_chamber_fit_ok_siempre_retorna_true():
    """Regla 5 es advertencia: ok=True en todo caso."""
    cone = {"model": "C-1540", "feed_max_mm": 100}
    ok, _ = check_cone_chamber_fit(cone, 200.0)   # supera la boca
    assert ok is True


def test_check_cone_chamber_fit_calce_adecuado():
    """P80 entre 40% y 90% de la boca → calce adecuado, sin advertencia."""
    cone = {"model": "C-1540", "feed_max_mm": 200}
    ok, motivo = check_cone_chamber_fit(cone, 120.0)  # 60%
    assert ok is True
    assert "ADVERTENCIA" not in motivo


def test_check_cone_chamber_fit_sobredimensionada():
    """P80 por debajo del 40% → cámara sobredimensionada → advertencia."""
    cone = {"model": "C-1540", "feed_max_mm": 200}
    ok, motivo = check_cone_chamber_fit(cone, 50.0)   # 25%
    assert ok is True
    assert "ADVERTENCIA" in motivo


def test_check_cone_chamber_fit_limite_superior():
    """P80 por encima del 90% de la boca → advertencia de límite."""
    cone = {"model": "C-1540", "feed_max_mm": 200}
    ok, motivo = check_cone_chamber_fit(cone, 190.0)  # 95%
    assert ok is True
    assert "ADVERTENCIA" in motivo


# ── Constantes exportadas correctamente ──────────────────────────────────────

def test_constantes_exportadas():
    """_P100_FACTOR y _MAX_RATIO deben estar disponibles desde selection_rules."""
    assert _P100_FACTOR["jaw"] == 2.5
    assert _MAX_RATIO["jaw"] == 6.0
    assert _P100_FACTOR["cone"] == 1.6
    assert _MAX_RATIO["cone"] == 5.0
