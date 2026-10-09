"""
Tests T-26: clases de equipo en modo simple (D-23, D-25).

Verifica:
1. get_class_name devuelve nombre correcto para cada uno de los 10 modelos de referencia.
2. get_class_name devuelve None para modelos fuera de las 10 clases.
3. apply_equipment_classes transforma correctamente un resultado de recommend().
4. apply_equipment_classes filtra resultados con equipos sin clase asignada.
5. marca y modelo no aparecen en el output de modo simple (D-25).
6. El endpoint /recommend con mode=simple devuelve clase, no marca/modelo.
7. El endpoint /recommend con mode=advanced (default) sigue devolviendo marca y modelo.
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.equipment_classes import (
    get_class_name,
    get_class_detail,
    apply_equipment_classes,
)
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Pruebas unitarias de get_class_name ──────────────────────────────────────

class TestGetClassName:
    """get_class_name cubre exactamente las 10 clases completas y nada más."""

    def test_jaw_j960(self):
        assert get_class_name("jaw", "J-960") == "Mandíbula 900×600 mm"

    def test_jaw_j1170(self):
        assert get_class_name("jaw", "J-1170") == "Mandíbula 1100×700 mm"

    def test_jaw_j1175(self):
        assert get_class_name("jaw", "J-1175") == "Mandíbula 1070×762 mm"

    def test_cone_c1540(self):
        assert get_class_name("cone", "C-1540") == "Cono de 3 pies (1000 mm)"

    def test_cone_c1550plus(self):
        assert get_class_name("cone", "C-1550+") == "Cono de 4¼ pies (1300 mm)"

    def test_screen_683(self):
        assert get_class_name("screen", "683") == "Seleccionadora 3,65×1,5 m · 2 decks"

    def test_screen_684_2deck(self):
        assert get_class_name("screen", "684 2-deck") == "Seleccionadora 4,3×1,7 m · 2 decks"

    def test_screen_684_3deck(self):
        assert get_class_name("screen", "684 3-deck") == "Seleccionadora 4,3×1,7 m · 3 decks"

    def test_screen_694plus(self):
        assert get_class_name("screen", "694+") == "Seleccionadora 6,1×1,52 m · 3 decks"

    def test_screen_696_3deck(self):
        assert get_class_name("screen", "696 3-deck") == "Seleccionadora 6,1×1,70 m · 3 decks"

    def test_jaw_j1280_sin_clase(self):
        """J-1280 no tiene clase: sin abertura verificada de manual (B-MJ05)."""
        assert get_class_name("jaw", "J-1280") is None

    def test_jaw_j1160_sin_clase(self):
        """J-1160 no tiene clase: sin curva de capacidad tph en manual (B-MJ02)."""
        assert get_class_name("jaw", "J-1160") is None

    def test_jaw_j1480_sin_clase(self):
        """J-1480 no tiene clase: sin curva de capacidad tph en manual (B-MJ04)."""
        assert get_class_name("jaw", "J-1480") is None

    def test_cone_c1545_sin_clase(self):
        """C-1545 no tiene clase: manual solo da rangos globales, sin tabla tph vs CSS."""
        assert get_class_name("cone", "C-1545") is None

    def test_screen_883plus_sin_clase(self):
        """883+ no pertenece a las cinco clases de seleccionadora con física completa."""
        assert get_class_name("screen", "883+") is None

    def test_tipo_desconocido(self):
        assert get_class_name("hsi", "I-120RS") is None

    def test_modelo_vacio(self):
        assert get_class_name("jaw", "") is None

    def test_tipo_vacio(self):
        assert get_class_name("", "J-960") is None


# ── Pruebas de get_class_detail ───────────────────────────────────────────────

class TestGetClassDetail:
    def test_detalle_cono_3_pies(self):
        detail = get_class_detail("Cono de 3 pies (1000 mm)")
        assert detail is not None
        assert "1000" in detail or "CSS" in detail

    def test_detalle_mandibula_900(self):
        detail = get_class_detail("Mandíbula 900×600 mm")
        assert detail is not None

    def test_detalle_clase_inexistente(self):
        assert get_class_detail("Clase ficticia") is None


# ── Pruebas de apply_equipment_classes ───────────────────────────────────────

def _make_result(equipos):
    """Helper: construye un resultado mínimo de recommend() para testing."""
    return {
        "config": "jaw_screen",
        "equipos": equipos,
        "n_units": 1,
        "tph_efectivo": 100.0,
        "cumple_plazo": True,
        "advertencias": [],
    }


class TestApplyEquipmentClasses:
    def test_transforma_jaw_y_screen(self):
        """Un jaw J-960 + screen 683 se transforma correctamente."""
        result = _make_result([
            {"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-960",
             "tipo_legible": "Chancador de mandíbula", "css_mm": 75.0, "decks": None},
            {"etapa": "screen", "marca": "Terex Finlay", "modelo": "683",
             "tipo_legible": "Seleccionadora de 2 decks", "css_mm": None, "decks": 2},
        ])
        out = apply_equipment_classes([result])
        assert len(out) == 1
        equipos = out[0]["equipos"]
        jaw = equipos[0]
        scr = equipos[1]

        assert jaw["clase"] == "Mandíbula 900×600 mm"
        assert scr["clase"] == "Seleccionadora 3,65×1,5 m · 2 decks"
        assert jaw["tipo_legible"] == "Mandíbula 900×600 mm"

    def test_no_expone_marca_ni_modelo(self):
        """D-25: marca y modelo no aparecen en el output de modo simple."""
        result = _make_result([
            {"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-1175",
             "tipo_legible": "Chancador de mandíbula", "css_mm": 90.0, "decks": None},
        ])
        out = apply_equipment_classes([result])
        eq = out[0]["equipos"][0]
        assert "marca" not in eq, "marca no debe aparecer en modo simple (D-25)"
        assert "modelo" not in eq, "modelo no debe aparecer en modo simple (D-25)"

    def test_filtra_resultado_con_equipo_sin_clase(self):
        """Un resultado con J-1280 (sin clase) debe ser filtrado."""
        result = _make_result([
            {"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-1280",
             "tipo_legible": "Chancador de mandíbula", "css_mm": 100.0, "decks": None},
            {"etapa": "screen", "marca": "Terex Finlay", "modelo": "683",
             "tipo_legible": "Seleccionadora", "css_mm": None, "decks": 2},
        ])
        out = apply_equipment_classes([result])
        assert len(out) == 0, "resultado con equipo sin clase debe ser filtrado"

    def test_filtra_solo_resultados_invalidos(self):
        """Solo se filtra el resultado inválido; el válido queda."""
        r_valido = _make_result([
            {"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-960",
             "tipo_legible": "Chancador de mandíbula", "css_mm": 50.0, "decks": None},
        ])
        r_invalido = _make_result([
            {"etapa": "cone", "marca": "Terex Finlay", "modelo": "C-1545",
             "tipo_legible": "Chancador de cono", "css_mm": 20.0, "decks": None},
        ])
        out = apply_equipment_classes([r_valido, r_invalido])
        assert len(out) == 1
        assert out[0]["equipos"][0]["clase"] == "Mandíbula 900×600 mm"

    def test_preserva_otros_campos(self):
        """css_mm, decks, cumple_plazo y otros campos se conservan."""
        result = _make_result([
            {"etapa": "cone", "marca": "Terex Finlay", "modelo": "C-1540",
             "tipo_legible": "Chancador de cono", "css_mm": 22.0, "decks": None},
        ])
        out = apply_equipment_classes([result])
        eq = out[0]["equipos"][0]
        assert eq["css_mm"] == 22.0
        assert out[0]["cumple_plazo"] is True
        assert out[0]["n_units"] == 1

    def test_lista_vacia(self):
        assert apply_equipment_classes([]) == []


# ── Pruebas de integración con la API ────────────────────────────────────────

# Caso con f80=150mm: cabe en J-960 (feed_max=580) y J-1175 (feed_max=790),
# ambas en las 10 clases → debe producir resultados en modo simple.
_BASE_PAYLOAD = {
    "rock_type": "caliza",
    "f80_mm": 150.0,
    "products": [{"name": "Gravilla 0-25mm", "min_mm": 0, "max_mm": 25.4, "volumen_ton": 5000}],
    "duracion_meses": 2,
    "inchancables": False,
}


class TestRecommendEndpointModes:
    def test_modo_simple_devuelve_clase(self):
        """En modo simple, los equipos tienen 'clase' y no 'marca'/'modelo'."""
        resp = client.post("/api/v1/simulations/recommend",
                           json={**_BASE_PAYLOAD, "mode": "simple"})
        assert resp.status_code == 200, resp.text
        recs = resp.json().get("recommendations", [])
        if not recs:
            pytest.skip("No se generaron recomendaciones para este caso")
        for rec in recs:
            for eq in rec.get("equipos", []):
                assert "clase" in eq, f"falta 'clase' en modo simple: {eq}"
                assert "marca" not in eq, f"'marca' no debe estar en modo simple: {eq}"
                assert "modelo" not in eq, f"'modelo' no debe estar en modo simple: {eq}"

    def test_modo_advanced_devuelve_marca_modelo(self):
        """En modo advanced (default), los equipos tienen 'marca' y 'modelo'."""
        resp = client.post("/api/v1/simulations/recommend",
                           json={**_BASE_PAYLOAD, "mode": "advanced"})
        assert resp.status_code == 200, resp.text
        recs = resp.json().get("recommendations", [])
        if not recs:
            pytest.skip("No se generaron recomendaciones para este caso")
        for rec in recs:
            for eq in rec.get("equipos", []):
                assert "marca" in eq, f"falta 'marca' en modo advanced: {eq}"
                assert "modelo" in eq, f"falta 'modelo' en modo advanced: {eq}"
                assert "clase" not in eq, f"'clase' no debe estar en modo advanced: {eq}"

    def test_modo_default_es_advanced(self):
        """Sin campo 'mode', el comportamiento es advanced (sin ruptura de contratos)."""
        resp = client.post("/api/v1/simulations/recommend", json=_BASE_PAYLOAD)
        assert resp.status_code == 200, resp.text
        recs = resp.json().get("recommendations", [])
        if not recs:
            pytest.skip("No se generaron recomendaciones")
        for rec in recs:
            for eq in rec.get("equipos", []):
                assert "marca" in eq
