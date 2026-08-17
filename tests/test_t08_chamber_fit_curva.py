"""
T-08: Criterio real de calce de cámara del cono (D-05).

check_cone_chamber_fit usa la curva granulométrica completa si está disponible,
y reporta explícitamente qué criterios no se pueden verificar por falta de datos.
"""
import pytest
from app.services.selection_rules import check_cone_chamber_fit

# Cono representativo del catálogo
_CONO = {
    "model": "C-1540",
    "feed_max_mm": 215.0,  # boca real del C-1540 según D-15
    "cap_max_tph": 220.0,
}

# Curva con material bien graduado: 95% pasa la boca (215 mm) — C1 OK
_CURVA_BIEN_GRADUADA = {
    50: 20.0, 100: 45.0, 150: 70.0, 200: 88.0,
    215: 95.0, 250: 100.0,
}

# Curva con material grueso: solo 70% pasa la boca — C1 ADVERTENCIA
_CURVA_GRUESA = {
    50: 5.0, 100: 20.0, 150: 40.0, 200: 60.0,
    215: 70.0, 300: 90.0, 400: 100.0,
}


# ── Tests con curva disponible ───────────────────────────────────────────────

def test_c1_ok_cuando_95pct_pasa_boca():
    """C1 se satisface cuando ≥90% del material pasa la boca."""
    ok, msg = check_cone_chamber_fit(_CONO, feed_p80_mm=150.0, feed_curve_dict=_CURVA_BIEN_GRADUADA)
    assert ok is True
    assert "ADVERTENCIA" not in msg
    assert "95" in msg or "C1 OK" in msg


def test_c1_advertencia_cuando_70pct_pasa_boca():
    """C1 genera advertencia cuando <90% del material pasa la boca."""
    ok, msg = check_cone_chamber_fit(_CONO, feed_p80_mm=200.0, feed_curve_dict=_CURVA_GRUESA)
    assert ok is True  # siempre True — es advertencia, no descarte
    assert "ADVERTENCIA" in msg


def test_c2_y_c3_no_verificables_por_falta_de_datos():
    """
    C2 (mitad de cámara) y C3 (CSS) no se pueden verificar.
    La función debe decirlo explícitamente en el mensaje.
    """
    _, msg = check_cone_chamber_fit(_CONO, feed_p80_mm=150.0, feed_curve_dict=_CURVA_BIEN_GRADUADA)
    assert "mid_chamber_mm" in msg or "C2" in msg
    assert "C3" in msg or "CSS" in msg


def test_retorna_ok_true_siempre_con_curva():
    """Con curva, ok=True en todos los casos (es advertencia, no descarte)."""
    for curva in (_CURVA_BIEN_GRADUADA, _CURVA_GRUESA):
        ok, _ = check_cone_chamber_fit(_CONO, feed_p80_mm=150.0, feed_curve_dict=curva)
        assert ok is True


# ── Tests sin curva (backward-compat) ────────────────────────────────────────

def test_sin_curva_usa_criterio_simplificado():
    """Sin curva, la función sigue funcionando con el P80 (criterio simplificado)."""
    ok, msg = check_cone_chamber_fit(_CONO, feed_p80_mm=100.0)  # 100/215 ≈ 46% — OK
    assert ok is True


def test_sin_curva_advertencia_sobredimensionada():
    """Sin curva: P80 muy pequeño relativo a boca genera advertencia."""
    ok, msg = check_cone_chamber_fit(_CONO, feed_p80_mm=30.0)  # 30/215 ≈ 14% — sobredimensionada
    assert ok is True
    assert "ADVERTENCIA" in msg


def test_cono_sin_datos_de_boca():
    """Sin feed_max_mm en el cono, la función no falla."""
    cono_sin_boca = {"model": "Desconocido", "cap_max_tph": 200.0}
    ok, msg = check_cone_chamber_fit(cono_sin_boca, feed_p80_mm=100.0)
    assert ok is True
    assert "sin datos" in msg.lower() or "no se verifica" in msg.lower()
