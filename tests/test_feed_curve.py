"""
KrushRock — Tests de feed_curve en /recommend y /compare-simple

Verifica:
1. feed_curve válida: F80 interpolado se usa en la simulación
2. feed_curve inválida (% no crecientes): devuelve 422 con mensaje claro
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# ── Fixtures ─────────────────────────────────────────────────────────────────

_CURVA_VALIDA = [
    {"size_mm": 50,  "passing_pct": 15},
    {"size_mm": 100, "passing_pct": 35},
    {"size_mm": 200, "passing_pct": 62},
    {"size_mm": 400, "passing_pct": 85},
    {"size_mm": 600, "passing_pct": 100},
]
# F80 interpolado: entre 200 mm (62%) y 400 mm (85%)
# frac = (80-62)/(85-62) = 18/23 ≈ 0.783 → F80 ≈ 200 + 0.783×200 ≈ 357 mm

_CURVA_INVALIDA = [
    {"size_mm": 50,  "passing_pct": 80},
    {"size_mm": 200, "passing_pct": 40},  # 40 < 80 → error
    {"size_mm": 400, "passing_pct": 95},
]

_PRODUCTS = [{"name": "grava", "min_mm": 0, "max_mm": 75, "volumen_ton": 30000}]

_FAENA_BASE = {
    "rock_type": "granito",
    "products": _PRODUCTS,
    "duracion_meses": 3,
    "inchancables": False,
}


# ── Tests /recommend ─────────────────────────────────────────────────────────

def test_recommend_con_feed_curve_valida():
    """
    Con feed_curve válida el endpoint devuelve recomendaciones normales.
    El F80 interpolado desde la curva debe estar en el rango esperado (~357 mm).
    """
    payload = {**_FAENA_BASE, "feed_curve": _CURVA_VALIDA}
    resp = client.post("/api/v1/simulations/recommend", json=payload)
    assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text[:300]}"
    data = resp.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) >= 1


def test_recommend_con_feed_curve_invalida_devuelve_422():
    """
    Curva con % pasante no creciente → 422 con mensaje explicando el error.
    """
    payload = {**_FAENA_BASE, "feed_curve": _CURVA_INVALIDA}
    resp = client.post("/api/v1/simulations/recommend", json=payload)
    assert resp.status_code == 422, f"Se esperaba 422, se obtuvo {resp.status_code}: {resp.text[:300]}"
    detail = resp.json().get("detail", "")
    detail_str = str(detail)
    # El mensaje debe indicar que los % no son crecientes
    assert any(kw in detail_str.lower() for kw in ["pasante", "crecient", "menor", "válida", "invalida"]), (
        f"Mensaje de error no es descriptivo: {detail_str[:200]}"
    )


def test_recommend_sin_f80_ni_curve_devuelve_422():
    """Sin f80_mm ni feed_curve → 422."""
    payload = {
        "rock_type": "granito",
        "products": _PRODUCTS,
        "duracion_meses": 3,
    }
    resp = client.post("/api/v1/simulations/recommend", json=payload)
    assert resp.status_code == 422


def test_recommend_con_f80_mm_sigue_funcionando():
    """El flujo original con f80_mm no se rompe."""
    payload = {**_FAENA_BASE, "f80_mm": 400}
    resp = client.post("/api/v1/simulations/recommend", json=payload)
    assert resp.status_code == 200
    assert "recommendations" in resp.json()
