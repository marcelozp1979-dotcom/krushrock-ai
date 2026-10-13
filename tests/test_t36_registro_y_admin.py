"""
Tests T-36: registro público cerrado, estado/vencimiento, endpoint de administración.

El conftest.py ya inyecta un usuario ficticio globalmente; aquí sólo importa
el comportamiento de auth (register, estado, vence_el) y del endpoint /admin/users.
"""
import sys
from pathlib import Path
from datetime import date, timedelta

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app, raise_server_exceptions=False)

_ADMIN_TOKEN = "test-admin-token-t36"

# ── Registro público ──────────────────────────────────────────────────────────

class TestRegistroCerrado:
    def test_register_devuelve_403(self):
        r = client.post("/api/v1/auth/register", json={
            "email": "nuevo@example.com",
            "password": "pass123",
            "full_name": "Nuevo Usuario",
        })
        assert r.status_code == 403, f"Se esperaba 403, obtuvo {r.status_code}: {r.text[:200]}"

    def test_register_menciona_administrador(self):
        r = client.post("/api/v1/auth/register", json={
            "email": "nuevo@example.com",
            "password": "pass123",
            "full_name": "Nuevo Usuario",
        })
        assert "administrador" in r.text.lower(), (
            f"El mensaje de error debe mencionar al administrador. Obtuvo: {r.text[:200]}"
        )


# ── Estado y vencimiento en login ─────────────────────────────────────────────

class TestLoginEstadoVencimiento:
    """
    Prueba _check_estado_vencimiento llamando al endpoint /login.
    Se mockea Supabase para devolver usuarios con distintos estados.
    """

    def _mock_user(self, **overrides):
        base = {
            "id": "user-t36-test",
            "email": "test@t36.com",
            "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX.6TiGX6Ti",  # hash ficticio
            "full_name": "Test T36",
            "company": "T36 Co",
            "plan": "pro",
            "sim_count_month": 0,
            "created_at": "2026-01-01T00:00:00",
            "estado": "activo",
            "vence_el": None,
        }
        base.update(overrides)
        return base

    def _mock_result(self, user_data):
        mock_result = MagicMock()
        mock_result.data = user_data
        return mock_result

    def _login_form(self):
        return {"username": "test@t36.com", "password": "pass"}

    def test_usuario_suspendido_403(self):
        user = self._mock_user(estado="suspendido")
        mock_resp = self._mock_result(user)
        with patch("app.routers.auth.get_supabase") as mock_sb:
            mock_sb.return_value.table.return_value.select.return_value \
                .eq.return_value.single.return_value.execute.return_value = mock_resp
            with patch("app.routers.auth.verify_password", return_value=True):
                r = client.post("/api/v1/auth/login", data=self._login_form())
        assert r.status_code == 403, f"Suspendido debe dar 403. Obtuvo {r.status_code}: {r.text[:200]}"
        assert "suspendida" in r.text.lower(), f"Mensaje debe mencionar 'suspendida'. Obtuvo: {r.text[:200]}"

    def test_usuario_vencido_403(self):
        ayer = (date.today() - timedelta(days=1)).isoformat()
        user = self._mock_user(vence_el=ayer)
        mock_resp = self._mock_result(user)
        with patch("app.routers.auth.get_supabase") as mock_sb:
            mock_sb.return_value.table.return_value.select.return_value \
                .eq.return_value.single.return_value.execute.return_value = mock_resp
            with patch("app.routers.auth.verify_password", return_value=True):
                r = client.post("/api/v1/auth/login", data=self._login_form())
        assert r.status_code == 403, f"Vencido debe dar 403. Obtuvo {r.status_code}: {r.text[:200]}"
        assert "vencida" in r.text.lower(), f"Mensaje debe mencionar 'vencida'. Obtuvo: {r.text[:200]}"

    def test_usuario_activo_no_bloqueado(self):
        manana = (date.today() + timedelta(days=1)).isoformat()
        user = self._mock_user(estado="activo", vence_el=manana)
        mock_resp = self._mock_result(user)
        with patch("app.routers.auth.get_supabase") as mock_sb:
            mock_sb.return_value.table.return_value.select.return_value \
                .eq.return_value.single.return_value.execute.return_value = mock_resp
            with patch("app.routers.auth.verify_password", return_value=True):
                r = client.post("/api/v1/auth/login", data=self._login_form())
        # No debe bloquear (puede fallar por token/supabase, pero no por estado)
        assert r.status_code != 403, (
            f"Usuario activo con licencia vigente no debe dar 403. Obtuvo {r.status_code}: {r.text[:200]}"
        )


# ── Endpoint de administración ────────────────────────────────────────────────

class TestAdminEndpoint:

    def _headers(self, token=_ADMIN_TOKEN):
        return {"x-admin-token": token}

    def test_sin_admin_token_401(self):
        r = client.post("/api/v1/admin/users", json={
            "email": "x@x.com", "password": "pass", "full_name": "X", "vence_el": "2027-01-01",
        })
        assert r.status_code in (401, 403, 422), (
            f"Sin X-Admin-Token debe rechazar. Obtuvo {r.status_code}: {r.text[:200]}"
        )

    def test_token_incorrecto_401(self):
        from app.core.config import settings
        original = settings.ADMIN_TOKEN
        settings.ADMIN_TOKEN = _ADMIN_TOKEN
        try:
            r = client.post("/api/v1/admin/users",
                headers={"x-admin-token": "token-incorrecto"},
                json={"email": "x@x.com", "password": "pass", "full_name": "X", "vence_el": "2027-01-01"},
            )
            assert r.status_code == 401, f"Token incorrecto debe dar 401. Obtuvo {r.status_code}: {r.text[:200]}"
        finally:
            settings.ADMIN_TOKEN = original

    def test_fecha_invalida_400(self):
        from app.core.config import settings
        original = settings.ADMIN_TOKEN
        settings.ADMIN_TOKEN = _ADMIN_TOKEN
        try:
            r = client.post("/api/v1/admin/users",
                headers=self._headers(),
                json={"email": "x@x.com", "password": "pass", "full_name": "X", "vence_el": "31/12/2027"},
            )
            assert r.status_code == 400, f"Fecha inválida debe dar 400. Obtuvo {r.status_code}: {r.text[:200]}"
        finally:
            settings.ADMIN_TOKEN = original

    def test_crear_usuario_ok(self):
        from app.core.config import settings
        original = settings.ADMIN_TOKEN
        settings.ADMIN_TOKEN = _ADMIN_TOKEN
        try:
            nuevo_user = {
                "id": "new-user-001",
                "email": "cliente@empresa.com",
                "full_name": "Cliente Test",
                "company": "Minera Test",
                "plan": "pro",
                "estado": "activo",
                "vence_el": "2027-12-31",
            }
            mock_check = MagicMock()
            mock_check.data = []  # email no existe
            mock_insert = MagicMock()
            mock_insert.data = [nuevo_user]
            with patch("app.routers.admin.get_supabase") as mock_sb:
                sb = mock_sb.return_value
                # Primera llamada: verificar email existente
                sb.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_check
                # Segunda llamada: insertar
                sb.table.return_value.insert.return_value.execute.return_value = mock_insert
                r = client.post("/api/v1/admin/users",
                    headers=self._headers(),
                    json={
                        "email": "cliente@empresa.com",
                        "password": "secret123",
                        "full_name": "Cliente Test",
                        "company": "Minera Test",
                        "plan": "pro",
                        "vence_el": "2027-12-31",
                    },
                )
            assert r.status_code == 201, f"Crear usuario debe dar 201. Obtuvo {r.status_code}: {r.text[:200]}"
            body = r.json()
            assert body.get("creado") is True
            assert body.get("email") == "cliente@empresa.com"
        finally:
            settings.ADMIN_TOKEN = original

    def test_admin_sin_token_configurado_503(self):
        from app.core.config import settings
        original = settings.ADMIN_TOKEN
        settings.ADMIN_TOKEN = ""  # sin configurar
        try:
            r = client.post("/api/v1/admin/users",
                headers={"x-admin-token": "cualquier-token"},
                json={"email": "x@x.com", "password": "pass", "full_name": "X", "vence_el": "2027-01-01"},
            )
            assert r.status_code == 503, (
                f"Sin ADMIN_TOKEN configurado debe dar 503. Obtuvo {r.status_code}: {r.text[:200]}"
            )
        finally:
            settings.ADMIN_TOKEN = original
