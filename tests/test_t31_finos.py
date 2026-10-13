"""
Tests T-31: modo simple puede resolver productos bajo 19 mm (finos).

Verifica que la clase "Cono de 3 pies, cámara de finos" (C-1540 AS, CSS 13–19 mm)
permite al recomendador generar configuraciones para productos como 0–12,7 mm
cuando antes no era posible (css_min de conos disponibles era ≥ 19 mm).

Caso de referencia: alimentación f80=38 mm, producto 0–12,7 mm.
Ruta esperada: mandíbula reduce a ~32 mm P80 → cono AS con CSS 13 mm → producto P80 ≈ 12,7 mm.
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.equipment_classes import get_class_name, get_class_detail, get_ref_model
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Caso de prueba canónico T-31 ──────────────────────────────────────────────
_PAYLOAD_FINOS = {
    "rock_type": "caliza",
    "f80_mm": 38.0,
    "products": [{"name": "Arena 0-12.7mm", "min_mm": 0, "max_mm": 12.7, "volumen_ton": 3000}],
    "duracion_meses": 3,
    "inchancables": False,
}


class TestCasoFinos:
    def test_modo_simple_devuelve_recomendacion_para_finos(self):
        """
        Alimentación 38 mm + producto 0-12,7 mm en modo simple → debe devolver recomendación.
        Este caso fallaba antes de T-31 porque css_min de todos los conos era ≥ 19 mm.
        """
        resp = client.post(
            "/api/v1/simulations/recommend",
            json={**_PAYLOAD_FINOS, "mode": "simple"},
        )
        assert resp.status_code == 200, resp.text
        recs = resp.json().get("recommendations", [])
        assert len(recs) > 0, (
            "Debe existir al menos una recomendación para alimentación 38 mm y "
            "producto 0-12,7 mm. La clase 'Cono de 3 pies, cámara de finos' debe "
            "habilitar este caso."
        )

    def test_recomendacion_incluye_clase_cono_finos(self):
        """
        La configuración jaw+cone en modo simple debe incluir la clase de cono de finos.
        """
        resp = client.post(
            "/api/v1/simulations/recommend",
            json={**_PAYLOAD_FINOS, "mode": "simple"},
        )
        assert resp.status_code == 200, resp.text
        recs = resp.json().get("recommendations", [])
        if not recs:
            pytest.skip("No se generaron recomendaciones — revisar viabilidad del caso")

        # Buscar la clase de cono de finos en alguna configuración
        clases_cono = []
        for rec in recs:
            for eq in rec.get("equipos", []):
                if eq.get("clase") and "finos" in eq["clase"].lower():
                    clases_cono.append(eq["clase"])

        assert len(clases_cono) > 0, (
            f"Ninguna configuración usa 'Cono de 3 pies, cámara de finos'. "
            f"Clases encontradas: {[eq.get('clase') for r in recs for eq in r.get('equipos', [])]}"
        )

    def test_modo_simple_no_expone_marca_en_finos(self):
        """D-25: modo simple no debe exponer marca ni modelo para productos de finos."""
        resp = client.post(
            "/api/v1/simulations/recommend",
            json={**_PAYLOAD_FINOS, "mode": "simple"},
        )
        assert resp.status_code == 200, resp.text
        recs = resp.json().get("recommendations", [])
        if not recs:
            pytest.skip("No se generaron recomendaciones")
        for rec in recs:
            for eq in rec.get("equipos", []):
                assert "marca" not in eq, f"'marca' no debe estar en modo simple: {eq}"
                assert "modelo" not in eq, f"'modelo' no debe estar en modo simple: {eq}"


# ── Tests unitarios de la nueva clase ────────────────────────────────────────

class TestNuevaClaseFinos:
    def test_clase_existe_en_get_class_name(self):
        assert get_class_name("cone", "C-1540 AS") == "Cono de 3 pies, cámara de finos"

    def test_clase_tiene_detalle(self):
        detalle = get_class_detail("Cono de 3 pies, cámara de finos")
        assert detalle is not None
        assert "13" in detalle or "63" in detalle, \
            f"El detalle debe mencionar CSS 13 mm o feed 63 mm: {detalle}"

    def test_clase_tiene_inverso(self):
        assert get_ref_model("Cono de 3 pies, cámara de finos") == "C-1540 AS"

    def test_clase_cono_normal_no_afectada(self):
        """La clase de cono estándar sigue funcionando sin cambios."""
        assert get_class_name("cone", "C-1540") == "Cono de 3 pies (1000 mm)"
        assert get_ref_model("Cono de 3 pies (1000 mm)") == "C-1540"
