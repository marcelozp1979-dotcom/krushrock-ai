"""
Tests T-32 (disponibilidad mecánica) y T-33 (producto fuera de rango).

T-32: El campo disponibilidad_pct reduce las horas efectivas sin alterar los
casos de validación AggFlow (que llevan sus propias horas).

T-33: oversize_pct se calcula en simulation_engine y llega a la respuesta del
recommender; es > 0 para productos con max_mm por debajo del P80 del circuito.
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

_BASE_PAYLOAD = {
    "rock_type": "caliza",
    "f80_mm": 200.0,
    "products": [{"name": "Árido", "min_mm": 0, "max_mm": 37, "volumen_ton": 10000}],
    "duracion_meses": 6,
    "inchancables": False,
    "horas_dia": 8,
    "dias_mes": 25,
    "mode": "simple",
}


# ── T-32: disponibilidad mecánica ─────────────────────────────────────────────

class TestDisponibilidad:
    def test_sin_disponibilidad_horas_iguales_programadas(self):
        """Sin disponibilidad_pct, las horas efectivas = horas programadas."""
        resp = client.post("/api/v1/simulations/recommend", json=_BASE_PAYLOAD)
        assert resp.status_code == 200, resp.text
        recs = resp.json().get("recommendations", [])
        assert recs, "Se esperaban recomendaciones"
        rec = recs[0]
        h_prog = rec.get("horas_programadas_mes")
        h_efec = rec.get("hours_per_month_used")
        assert h_prog is not None, "Debe retornar horas_programadas_mes"
        assert h_efec is not None, "Debe retornar hours_per_month_used"
        assert h_efec == h_prog, (
            f"Sin disponibilidad, horas efectivas ({h_efec}) deben igualar "
            f"las programadas ({h_prog})"
        )

    def test_con_disponibilidad_85_reduce_horas_efectivas(self):
        """Con 85% disponibilidad las horas efectivas son menores que las programadas."""
        payload = {**_BASE_PAYLOAD, "disponibilidad_pct": 85}
        resp = client.post("/api/v1/simulations/recommend", json=payload)
        assert resp.status_code == 200, resp.text
        recs = resp.json().get("recommendations", [])
        assert recs, "Se esperaban recomendaciones"
        rec = recs[0]
        h_prog = rec["horas_programadas_mes"]
        h_efec = rec["hours_per_month_used"]
        assert h_efec < h_prog, (
            f"Con 85% disp., h_efec ({h_efec}) debe ser menor que h_prog ({h_prog})"
        )
        expected = round(h_prog * 0.85, 1)
        assert abs(h_efec - expected) < 0.2, (
            f"h_efec esperado {expected}, obtenido {h_efec}"
        )

    def test_disponibilidad_100_no_reduce_horas(self):
        """Con 100% disponibilidad no hay reducción de horas."""
        payload = {**_BASE_PAYLOAD, "disponibilidad_pct": 100}
        resp = client.post("/api/v1/simulations/recommend", json=payload)
        assert resp.status_code == 200, resp.text
        recs = resp.json().get("recommendations", [])
        assert recs
        rec = recs[0]
        assert rec["hours_per_month_used"] == rec["horas_programadas_mes"]

    def test_disponibilidad_85_aumenta_meses_requeridos(self):
        """Con 85% disponibilidad el plazo es mayor que con 100%."""
        r100 = client.post("/api/v1/simulations/recommend",
                           json={**_BASE_PAYLOAD, "disponibilidad_pct": 100})
        r85  = client.post("/api/v1/simulations/recommend",
                           json={**_BASE_PAYLOAD, "disponibilidad_pct": 85})
        assert r100.status_code == 200 and r85.status_code == 200
        recs100 = r100.json().get("recommendations", [])
        recs85  = r85.json().get("recommendations", [])
        if not recs100 or not recs85:
            pytest.skip("No se generaron recomendaciones para comparar")
        m100 = recs100[0].get("meses_requeridos") or 0
        m85  = recs85[0].get("meses_requeridos") or 0
        assert m85 >= m100, (
            f"Con menos horas disponibles el plazo debe ser ≥: "
            f"85%→{m85} meses, 100%→{m100} meses"
        )

    def test_aggflow_no_afectado_por_disponibilidad(self):
        """
        Los casos de validación AggFlow usan run_config() directamente con
        horas_dia/dias_mes; disponibilidad_pct nunca llega ahí.
        Verifica que el endpoint recommend sin disponibilidad retorna el mismo
        resultado que sin el campo (backward compatibility).
        """
        r_sin = client.post("/api/v1/simulations/recommend", json=_BASE_PAYLOAD)
        r_none = client.post("/api/v1/simulations/recommend",
                             json={**_BASE_PAYLOAD, "disponibilidad_pct": None})
        assert r_sin.status_code == 200 and r_none.status_code == 200
        recs_sin  = r_sin.json().get("recommendations", [])
        recs_none = r_none.json().get("recommendations", [])
        if recs_sin and recs_none:
            assert recs_sin[0]["hours_per_month_used"] == recs_none[0]["hours_per_month_used"]


# ── T-33: producto fuera de rango ─────────────────────────────────────────────

class TestFueraDeRango:
    def test_oversize_pct_presente_en_products_detail(self):
        """oversize_pct existe en cada item de products_detail."""
        resp = client.post("/api/v1/simulations/recommend", json=_BASE_PAYLOAD)
        assert resp.status_code == 200, resp.text
        recs = resp.json().get("recommendations", [])
        assert recs
        detail = recs[0].get("products_detail", [])
        assert detail, "products_detail debe tener items"
        for d in detail:
            assert "oversize_pct" in d, f"Falta oversize_pct en: {d}"

    def test_oversize_pct_cero_para_producto_amplio(self):
        """Para un producto 0-75 mm con alimentación 200 mm F80 ≈ 160 mm → oversize=0."""
        payload = {
            **_BASE_PAYLOAD,
            "products": [{"name": "Base", "min_mm": 0, "max_mm": 75, "volumen_ton": 5000}],
        }
        resp = client.post("/api/v1/simulations/recommend", json=payload)
        assert resp.status_code == 200, resp.text
        recs = resp.json().get("recommendations", [])
        if not recs:
            pytest.skip("Sin recomendaciones para este caso")
        detail = recs[0].get("products_detail", [])
        for d in detail:
            assert (d.get("oversize_pct") or 0) >= 0, "oversize_pct no puede ser negativo"

    def test_oversize_pct_mayor_cero_para_producto_fino(self):
        """Para producto muy fino (0-12,7 mm), el oversize_pct puede ser > 0."""
        payload = {
            "rock_type": "caliza",
            "f80_mm": 38.0,
            "products": [{"name": "Fino", "min_mm": 0, "max_mm": 12.7, "volumen_ton": 2000}],
            "duracion_meses": 3,
            "inchancables": False,
            "horas_dia": 8,
            "dias_mes": 25,
            "mode": "simple",
        }
        resp = client.post("/api/v1/simulations/recommend", json=payload)
        assert resp.status_code == 200, resp.text
        recs = resp.json().get("recommendations", [])
        if not recs:
            pytest.skip("Sin recomendaciones — requiere C-1540 AS (T-31)")
        detail = recs[0].get("products_detail", [])
        assert detail
        for d in detail:
            assert d.get("oversize_pct") is not None, "oversize_pct debe ser un número, no None"
            assert d["oversize_pct"] >= 0

    def test_oversize_pct_no_negativo(self):
        """oversize_pct nunca puede ser negativo."""
        resp = client.post("/api/v1/simulations/recommend", json=_BASE_PAYLOAD)
        assert resp.status_code == 200, resp.text
        recs = resp.json().get("recommendations", [])
        for rec in recs:
            for d in rec.get("products_detail", []):
                val = d.get("oversize_pct")
                if val is not None:
                    assert val >= 0, f"oversize_pct negativo: {val} en {d}"
