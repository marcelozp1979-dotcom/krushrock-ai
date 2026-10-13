"""
Tests T-35: endpoints protegidos responden 401 sin credenciales.

El conftest.py inyecta un usuario ficticio globalmente (autouse=True).
Para testear el 401, cada test anula ese override temporalmente
usando app.dependency_overrides directamente, asegurando que el
override del conftest no interfiera.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.routers.auth import get_current_user
from fastapi import HTTPException

# ── Payloads mínimos ──────────────────────────────────────────────────────────

_CALCULATE_PAYLOAD = {
    "tph": 100,
    "f80": 200.0,
    "p80_target": 25.0,
    "rock_type": "caliza",
    "circuit": "open",
    "nodes": [
        {"id": "j1", "type": "jaw",  "css_mm": 60, "feed_max_mm": 500},
        {"id": "s1", "type": "screen", "apertura_mm": 25, "decks": 1},
    ],
}

_RECOMMEND_PAYLOAD = {
    "rock_type": "caliza",
    "f80_mm": 200.0,
    "products": [{"name": "Base", "min_mm": 0, "max_mm": 37, "volumen_ton": 5000}],
    "duracion_meses": 3,
    "inchancables": False,
    "mode": "simple",
}

_COMPARE_SIMPLE_PAYLOAD = {
    "config_usuario": {
        "equipos": [{"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-1280"}],
        "circuit": "open",
        "n_units": 1,
    },
    "config_sugerida": {
        "equipos": [{"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-1280"}],
        "circuit": "open",
        "n_units": 1,
    },
    "faena": {
        "rock_type": "caliza",
        "f80_mm": 200.0,
        "products": [{"name": "Base", "min_mm": 0, "max_mm": 37, "volumen_ton": 5000}],
        "duracion_meses": 3,
        "inchancables": False,
        "horas_dia": 8,
        "dias_mes": 25,
    },
}

_COMPARE_CONFIGS_PAYLOAD = _COMPARE_SIMPLE_PAYLOAD  # misma estructura

_PROPOSAL_PAYLOAD = {
    "faena": {
        "rock_type": "caliza",
        "f80_mm": 200.0,
        "products": [{"min_mm": 0, "max_mm": 37, "volumen_ton": 5000}],
        "duracion_meses": 3,
        "inchancables": False,
        "horas_dia": 8,
        "dias_mes": 25,
    },
    "config": {
        "equipos": [{"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-1280"}],
        "circuit": "open",
        "n_units": 1,
    },
}

_AI_EXTRACT_PAYLOAD = {"text": "Alimentación máxima 400 mm, capacidad 200 tph, caliza, css 50 mm"}


def _reject_auth():
    """Override que simula ausencia de credenciales (lanza 401)."""
    raise HTTPException(status_code=401, detail="No autenticado")


class TestEndpointsRequierenAuth:
    """
    Verifica que cada endpoint protegido responde 401 cuando no hay credenciales.
    Se anula el override de conftest para simular una petición sin token.
    """

    @pytest.fixture(autouse=True)
    def sin_auth(self):
        app.dependency_overrides[get_current_user] = _reject_auth
        yield
        app.dependency_overrides.pop(get_current_user, None)

    def _client(self):
        return TestClient(app, raise_server_exceptions=False)

    def test_calculate_sin_auth_401(self):
        r = self._client().post("/api/v1/simulations/calculate", json=_CALCULATE_PAYLOAD)
        assert r.status_code == 401, f"Se esperaba 401, obtuvo {r.status_code}"

    def test_recommend_sin_auth_401(self):
        r = self._client().post("/api/v1/simulations/recommend", json=_RECOMMEND_PAYLOAD)
        assert r.status_code == 401, f"Se esperaba 401, obtuvo {r.status_code}"

    def test_compare_simple_sin_auth_401(self):
        r = self._client().post("/api/v1/simulations/compare-simple", json=_COMPARE_SIMPLE_PAYLOAD)
        assert r.status_code == 401, f"Se esperaba 401, obtuvo {r.status_code}"

    def test_compare_configs_sin_auth_401(self):
        r = self._client().post("/api/v1/simulations/compare-configs", json=_COMPARE_CONFIGS_PAYLOAD)
        assert r.status_code == 401, f"Se esperaba 401, obtuvo {r.status_code}"

    def test_proposal_sin_auth_401(self):
        r = self._client().post("/api/v1/reports/proposal", json=_PROPOSAL_PAYLOAD)
        assert r.status_code == 401, f"Se esperaba 401, obtuvo {r.status_code}"

    def test_ai_extract_sin_auth_401(self):
        r = self._client().post("/api/v1/ai/extract", json=_AI_EXTRACT_PAYLOAD)
        assert r.status_code == 401, f"Se esperaba 401, obtuvo {r.status_code}"


class TestEquipmentEndpointAbierto:
    """
    GET /equipment debe seguir abierto (sin auth) para que la app cargue
    el catálogo antes del login.
    """

    @pytest.fixture(autouse=True)
    def sin_auth(self):
        app.dependency_overrides[get_current_user] = _reject_auth
        yield
        app.dependency_overrides.pop(get_current_user, None)

    def test_equipment_sin_auth_200(self):
        r = TestClient(app, raise_server_exceptions=False).get("/api/v1/equipment")
        assert r.status_code == 200, (
            f"GET /equipment debe ser público (200 sin auth). Obtuvo {r.status_code}. "
            "Si este test falla, la app no carga el catálogo antes del login."
        )


class TestEndpointsConAuth:
    """
    Con el override del conftest activo (usuario ficticio), los endpoints
    protegidos deben responder 200 o al menos no 401/403.
    """

    def test_recommend_con_auth_no_es_401(self):
        r = TestClient(app).post("/api/v1/simulations/recommend", json=_RECOMMEND_PAYLOAD)
        assert r.status_code != 401 and r.status_code != 403, (
            f"Con usuario autenticado no debe responder 401/403. Obtuvo {r.status_code}: {r.text[:200]}"
        )

    def test_calculate_con_auth_no_es_401(self):
        r = TestClient(app).post("/api/v1/simulations/calculate", json=_CALCULATE_PAYLOAD)
        assert r.status_code != 401 and r.status_code != 403, (
            f"Con usuario autenticado no debe responder 401/403. Obtuvo {r.status_code}: {r.text[:200]}"
        )
