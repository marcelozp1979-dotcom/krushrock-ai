"""
KrushRock — Tests del endpoint POST /compare-configs

Casos cubiertos:
1. run_config retorna todos los campos con tipos correctos
2. n_units=2 entrega el doble de tph_efectivo que n_units=1
3. tarifa_arriendo_usd_mes se multiplica por n_units; null cuando no se provee
4. Equipo inexistente en catálogo lanza ValueError
5. Endpoint completo devuelve tabla con 6 filas y claves correctas
"""
import sys
import pytest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.recommender import run_config, build_nodes_from_config, _find_equipment

# Equipo y faena comunes a la mayoría de tests
_EQUIPO_JAW = [{"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-960"}]
_EQUIPO_MULTI = [
    {"etapa": "jaw",    "marca": "Terex Finlay", "modelo": "J-960"},
    {"etapa": "screen", "marca": "Terex Finlay", "modelo": "683"},
]
_FAENA = dict(
    f80_mm=400.0,
    products=[{"name": "grava", "min_mm": 0.0, "max_mm": 75.0}],
    tonelaje_mes=5_000.0,
    duracion_meses=3,
    rock_type="granito",
)


def test_run_config_campos_y_tipos():
    """run_config retorna todos los campos esperados con tipos correctos."""
    result = run_config(
        equipos=_EQUIPO_JAW,
        circuit="open",
        n_units=1,
        tarifa_arriendo_usd_mes=None,
        **_FAENA,
    )
    campos = {
        "tph_efectivo", "tph_util", "product_fit_pct", "descarte_pct",
        "circ_load_pct", "n_equipos_total", "costo_arriendo_mes_usd",
        "meses_requeridos", "cumple_plazo",
    }
    assert campos == result.keys(), (
        f"Campos inesperados: {result.keys() - campos} | "
        f"Campos faltantes: {campos - result.keys()}"
    )

    assert isinstance(result["tph_efectivo"], float)
    assert isinstance(result["tph_util"], float)
    assert isinstance(result["product_fit_pct"], float)
    assert isinstance(result["descarte_pct"], float)
    assert isinstance(result["circ_load_pct"], float)
    assert result["n_equipos_total"] == 1       # 1 equipo × 1 unidad
    assert result["costo_arriendo_mes_usd"] is None
    assert isinstance(result["meses_requeridos"], float)
    assert isinstance(result["cumple_plazo"], bool)
    assert round(result["product_fit_pct"] + result["descarte_pct"], 1) == 100.0


def test_n_units_duplica_tph():
    """Con n_units=2 el tph_efectivo es el doble que con n_units=1."""
    r1 = run_config(equipos=_EQUIPO_JAW, circuit="open", n_units=1, **_FAENA)
    r2 = run_config(equipos=_EQUIPO_JAW, circuit="open", n_units=2, **_FAENA)

    assert r2["tph_efectivo"] > r1["tph_efectivo"]
    assert abs(r2["tph_efectivo"] - 2 * r1["tph_efectivo"]) < 0.5, (
        f"Esperado ~{2 * r1['tph_efectivo']:.1f}, obtenido {r2['tph_efectivo']:.1f}"
    )
    # n_equipos_total también se duplica
    assert r2["n_equipos_total"] == 2 * r1["n_equipos_total"]


def test_tarifa_arriendo_multiplicada_por_n_units():
    """costo_arriendo_mes_usd = tarifa * n_units cuando se proporciona."""
    tarifa = 15_000.0
    r = run_config(
        equipos=_EQUIPO_JAW,
        circuit="open",
        n_units=3,
        tarifa_arriendo_usd_mes=tarifa,
        **_FAENA,
    )
    assert r["costo_arriendo_mes_usd"] == pytest.approx(tarifa * 3, rel=1e-4)


def test_equipo_invalido_lanza_value_error():
    """Equipo inexistente en catálogo lanza ValueError con el nombre."""
    with pytest.raises(ValueError, match="no encontrado"):
        run_config(
            equipos=[{"etapa": "jaw", "marca": "Inexistente SA", "modelo": "X-9999"}],
            circuit="open",
            n_units=1,
            **_FAENA,
        )


def test_endpoint_compare_configs_tabla_completa():
    """Endpoint /compare-configs retorna tabla con 6 filas y claves correctas."""
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)

    payload = {
        "config_usuario": {
            "equipos": [{"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-960"}],
            "circuit": "open",
            "n_units": 1,
            "tarifa_arriendo_usd_mes": 12_000.0,
        },
        "config_sugerida": {
            "equipos": [
                {"etapa": "jaw",    "marca": "Terex Finlay", "modelo": "J-1175"},
                {"etapa": "screen", "marca": "Terex Finlay", "modelo": "683"},
            ],
            "circuit": "closed",
            "n_units": 1,
            "tarifa_arriendo_usd_mes": None,
        },
        "faena": {
            "rock_type": "granito",
            "f80_mm": 400.0,
            "products": [{"name": "grava", "min_mm": 0.0, "max_mm": 75.0}],
            "tonelaje_mes": 5_000.0,
            "duracion_meses": 3,
            "inchancables": False,
        },
    }

    resp = client.post("/api/v1/simulations/compare-configs", json=payload)
    assert resp.status_code == 200, f"HTTP {resp.status_code}: {resp.text}"

    data = resp.json()
    assert "tabla" in data
    tabla = data["tabla"]
    assert len(tabla) == 6, f"Se esperaban 6 filas, hay {len(tabla)}"

    indicadores = {row["indicador"] for row in tabla}
    esperados = {
        "tph_efectivo", "material_aprovechado", "carga_circulante",
        "n_equipos_total", "costo_arriendo_mes", "cumple_plazo",
    }
    assert esperados == indicadores

    # Tarifa provista para usuario → no null; sugerida sin tarifa → null
    for row in tabla:
        if row["indicador"] == "costo_arriendo_mes":
            assert row["usuario"] == pytest.approx(12_000.0, rel=1e-4)
            assert row["sugerida"] is None
