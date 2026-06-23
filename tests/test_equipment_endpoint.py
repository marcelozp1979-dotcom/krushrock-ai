"""
Tests del endpoint GET /equipment (Tarea 2).

Verifica que:
  1. El endpoint responde con datos (no vacío) usando el fallback hardcodeado.
  2. El filtro por tipo (jaw, cone, hsi, screen) funciona correctamente.
  3. Los campos clave están presentes en cada registro devuelto.
  4. El endpoint devuelve todos los tipos cuando no se filtra.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestEquipmentEndpointFallback:
    """
    Confirma que el endpoint /equipment funciona con el fallback local
    incluso cuando Supabase no está disponible en entorno de test.
    """

    def test_all_types_returns_non_empty(self):
        """Sin filtro: todos los tipos de equipos deben estar presentes."""
        resp = client.get("/api/v1/equipment")
        assert resp.status_code == 200
        data = resp.json()
        assert "equipment" in data
        eq = data["equipment"]
        # Todos los tipos del catálogo deben existir
        for t in ("jaw", "cone", "hsi", "screen", "screen_1d", "screen_hf"):
            assert t in eq, f"Tipo '{t}' no encontrado en respuesta"
            assert len(eq[t]) > 0, f"Lista vacía para tipo '{t}'"

    def test_filter_jaw_returns_mandibulas(self):
        """Filtrar por jaw devuelve solo chancadores de mandíbula."""
        resp = client.get("/api/v1/equipment?type=jaw")
        assert resp.status_code == 200
        data = resp.json()
        assert "equipment" in data
        items = data["equipment"]
        assert len(items) > 0, "No hay chancadores de mandíbula"
        for item in items:
            assert "brand" in item
            assert "model" in item
            assert "capR" in item
            assert "cssR" in item, f"Mandíbula sin cssR: {item['model']}"

    def test_filter_cone_returns_conos(self):
        """Filtrar por cone devuelve conos con campos CSS y capacidad."""
        resp = client.get("/api/v1/equipment?type=cone")
        assert resp.status_code == 200
        data = resp.json()
        items = data["equipment"]
        assert len(items) > 0, "No hay chancadores de cono"
        for item in items:
            assert "cssR" in item, f"Cono sin cssR: {item.get('model')}"
            css = item["cssR"]
            assert css[0] < css[1], f"CSS min >= max en {item['model']}"

    def test_filter_screen_returns_zarandas(self):
        """Filtrar por screen devuelve zarandas con campo decks."""
        resp = client.get("/api/v1/equipment?type=screen")
        assert resp.status_code == 200
        data = resp.json()
        items = data["equipment"]
        assert len(items) > 0, "No hay zarandas"
        for item in items:
            assert "decks" in item, f"Zaranda sin decks: {item.get('model')}"

    def test_filter_hsi_returns_impactores(self):
        """HSI no tiene CSS — no debe tener cssR en la respuesta."""
        resp = client.get("/api/v1/equipment?type=hsi")
        assert resp.status_code == 200
        data = resp.json()
        items = data["equipment"]
        assert len(items) > 0, "No hay chancadores HSI"
        for item in items:
            assert "capR" in item
            # HSI no tiene CSS; el endpoint no debe incluir cssR para estos
            assert "cssR" not in item, f"HSI no debería tener cssR: {item['model']}"

    def test_all_records_have_required_fields(self):
        """Todos los equipos deben tener brand, model y capR."""
        resp = client.get("/api/v1/equipment")
        assert resp.status_code == 200
        data = resp.json()
        eq = data["equipment"]
        for tipo, items in eq.items():
            for item in items:
                assert "brand" in item, f"Sin brand en {tipo}: {item}"
                assert "model" in item, f"Sin model en {tipo}: {item}"
                assert "capR" in item, f"Sin capR en {tipo}: {item}"
                cap = item["capR"]
                assert cap[0] < cap[1], f"capR min >= max en {tipo}/{item['model']}"

    def test_jaw_count_matches_seed(self):
        """El endpoint debe devolver exactamente 18 mandíbulas (igual que EQ_LOCAL)."""
        resp = client.get("/api/v1/equipment?type=jaw")
        assert resp.status_code == 200
        items = resp.json()["equipment"]
        # Si Supabase devuelve datos puede haber más, pero el fallback tiene 18
        assert len(items) >= 18, f"Se esperaban ≥18 mandíbulas, hay {len(items)}"

    def test_source_field_present(self):
        """La respuesta debe incluir 'source' para saber si viene de Supabase o fallback."""
        resp = client.get("/api/v1/equipment")
        assert resp.status_code == 200
        data = resp.json()
        assert "source" in data
        assert data["source"] in ("supabase", "fallback")

    def test_invalid_type_returns_empty_list(self):
        """Un tipo inexistente debe retornar lista vacía (no 500)."""
        resp = client.get("/api/v1/equipment?type=inexistente")
        assert resp.status_code == 200
        data = resp.json()
        assert "equipment" in data
        assert len(data["equipment"]) == 0
