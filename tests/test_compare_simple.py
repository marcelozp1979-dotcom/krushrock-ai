"""
KrushRock — Tests del endpoint POST /compare-simple

Verifica que /compare-simple:
1. Devuelve tabla con 6 filas y las claves requeridas
2. La tarifa de arriendo se multiplica por n_units; null si no se provee
3. Equipo inexistente en catálogo devuelve HTTP 422
4. Los resultados son idénticos a /compare-configs (misma lógica compartida)
"""
import sys
import pytest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# ── Fixtures compartidos ──────────────────────────────────────────────────────

FAENA = {
    "rock_type": "granito",
    "f80_mm": 400.0,
    "products": [{"name": "grava", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": 15_000.0}],
    "duracion_meses": 3,
    "inchancables": False,
}

CONFIG_A = {
    "equipos": [{"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-960"}],
    "circuit": "open",
    "n_units": 1,
    "tarifa_arriendo_usd_mes": None,
}

CONFIG_B = {
    "equipos": [
        {"etapa": "jaw",    "marca": "Terex Finlay", "modelo": "J-1175"},
        {"etapa": "screen", "marca": "Terex Finlay", "modelo": "683"},
    ],
    "circuit": "closed",
    "n_units": 1,
    "tarifa_arriendo_usd_mes": None,
}

INDICADORES_ESPERADOS = {
    "tph_efectivo", "material_aprovechado", "tiempo_requerido",
    "n_equipos_total", "cumple_plazo",
}

ORDEN_ESPERADO = [
    "tph_efectivo", "material_aprovechado", "tiempo_requerido",
    "n_equipos_total", "cumple_plazo",
]


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_compare_simple_tabla_estructura():
    """Respuesta tiene tabla con 5 filas, 5 indicadores correctos y claves requeridas."""
    resp = client.post("/api/v1/simulations/compare-simple", json={
        "config_usuario": CONFIG_A,
        "config_sugerida": CONFIG_B,
        "faena": FAENA,
    })
    assert resp.status_code == 200, f"HTTP {resp.status_code}: {resp.text}"

    data = resp.json()
    assert "tabla" in data
    tabla = data["tabla"]
    assert len(tabla) == 5, f"Se esperaban 5 filas, hay {len(tabla)}"

    indicadores = {row["indicador"] for row in tabla}
    assert indicadores == INDICADORES_ESPERADOS

    for row in tabla:
        assert "usuario"  in row
        assert "sugerida" in row
        assert "unidad"   in row


def test_compare_simple_tabla_orden():
    """Las 5 filas aparecen en el orden definido."""
    resp = client.post("/api/v1/simulations/compare-simple", json={
        "config_usuario": CONFIG_A,
        "config_sugerida": CONFIG_B,
        "faena": FAENA,
    })
    assert resp.status_code == 200, resp.text
    tabla = resp.json()["tabla"]
    assert [r["indicador"] for r in tabla] == ORDEN_ESPERADO


def test_compare_simple_tiempo_requerido_unidad_meses():
    """La fila tiempo_requerido trae unidad 'meses'."""
    resp = client.post("/api/v1/simulations/compare-simple", json={
        "config_usuario": CONFIG_A,
        "config_sugerida": CONFIG_B,
        "faena": FAENA,
    })
    assert resp.status_code == 200, resp.text
    tabla = resp.json()["tabla"]
    row = next(r for r in tabla if r["indicador"] == "tiempo_requerido")
    assert row["unidad"] == "meses"


def test_compare_simple_equipo_invalido_retorna_422():
    """Equipo inexistente en catálogo devuelve HTTP 422 con mensaje descriptivo."""
    config_inv = {
        "equipos": [{"etapa": "jaw", "marca": "FANTASMA SA", "modelo": "X-0000"}],
        "circuit": "open",
        "n_units": 1,
        "tarifa_arriendo_usd_mes": None,
    }
    resp = client.post("/api/v1/simulations/compare-simple", json={
        "config_usuario": config_inv,
        "config_sugerida": CONFIG_B,
        "faena": FAENA,
    })
    assert resp.status_code == 422
    assert "no encontrado" in resp.json()["detail"].lower()


def test_compare_simple_igual_que_compare_configs():
    """
    /compare-simple y /compare-configs devuelven resultados idénticos para
    el mismo payload — confirma que comparten la misma lógica de cálculo.
    """
    payload = {
        "config_usuario": CONFIG_A,
        "config_sugerida": CONFIG_B,
        "faena": FAENA,
    }
    r_simple  = client.post("/api/v1/simulations/compare-simple",  json=payload)
    r_configs = client.post("/api/v1/simulations/compare-configs", json=payload)

    assert r_simple.status_code  == 200, r_simple.text
    assert r_configs.status_code == 200, r_configs.text

    tabla_simple  = r_simple.json()["tabla"]
    tabla_configs = r_configs.json()["tabla"]

    assert len(tabla_simple) == len(tabla_configs)
    for rs, rc in zip(tabla_simple, tabla_configs):
        assert rs["indicador"] == rc["indicador"]
        assert rs["usuario"]   == rc["usuario"]
        assert rs["sugerida"]  == rc["sugerida"]
