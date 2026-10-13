"""
conftest.py — fixture global de autenticación para tests.

Desde T-35, los endpoints de cálculo/recomendación/PDF exigen login.
Este fixture inyecta un usuario ficticio en TODOS los tests para que
los tests existentes no necesiten credenciales reales.

El override se aplica solo durante cada test y se limpia después.
"""
import pytest
from app.main import app
from app.routers.auth import get_current_user

_FAKE_USER = {
    "id": "00000000-0000-0000-0000-000000000001",
    "email": "test@krushrock.test",
    "full_name": "Test User",
    "company": "KrushRock Tests",
    "plan": "pro",
    "sim_count_month": 0,
    "created_at": "2026-01-01T00:00:00",
}


@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user] = lambda: _FAKE_USER
    yield
    app.dependency_overrides.pop(get_current_user, None)
