"""
T-02 — Mensaje claro cuando el volumen pedido es imposible.

Verifica que cuando ningún circuito puede cumplir el volumen en el plazo:
1. La respuesta nunca viene vacía.
2. Contiene tph_requerido (lo que se necesita).
3. Contiene tph_max_alcanzable (lo mejor que puede hacer el catálogo).
4. Contiene las salidas concretas: meses_extra, horas_adicionales_mes, unidades_extra.

Referencia: TASKS.md T-02, REQUISITOS.md RF-8.
"""
import pytest
from app.services.recommender import recommend

# Caso imposible: 50 millones de toneladas en 1 mes — ningún equipo llega ni cerca
_IMPOSIBLE = {
    "rock_type": "granito",
    "f80_mm": 300.0,
    "products": [{"name": "base", "min_mm": 0.0, "max_mm": 75.0,
                  "volumen_ton": 50_000_000.0}],
    "duracion_meses": 1,
    "inchancables": False,
}

# Caso normal que SÍ cumple — para verificar que los campos también están en resultados buenos
_NORMAL = {
    "rock_type": "caliza",
    "f80_mm": 300.0,
    "products": [{"name": "grava", "min_mm": 0.0, "max_mm": 75.0,
                  "volumen_ton": 5_000.0}],
    "duracion_meses": 3,
    "inchancables": False,
}

_CAMPOS_NUEVOS = {"tph_requerido", "tph_max_alcanzable", "meses_extra", "unidades_extra"}


def test_caso_imposible_nunca_devuelve_vacio():
    """La respuesta nunca debe ser lista vacía, incluso con volumen astronómico."""
    results = recommend(**_IMPOSIBLE)
    assert results, "recommend() no debe retornar lista vacía con volumen imposible"


def test_caso_imposible_trae_tph_requerido():
    """El primer resultado debe incluir tph_requerido con el valor correcto."""
    results = recommend(**_IMPOSIBLE)
    assert results, "Debe retornar al menos 1 resultado"
    a = results[0]
    assert "tph_requerido" in a, "Falta tph_requerido en el resultado"
    # 50_000_000 t / 1 mes / 500 h/mes = 100_000 tph
    assert a["tph_requerido"] > 1_000, (
        f"tph_requerido debería ser muy alto para caso imposible; "
        f"se obtuvo {a['tph_requerido']}"
    )


def test_caso_imposible_trae_tph_max_alcanzable():
    """El resultado debe incluir tph_max_alcanzable > 0 (hay equipos que producen algo)."""
    results = recommend(**_IMPOSIBLE)
    assert results
    a = results[0]
    assert "tph_max_alcanzable" in a, "Falta tph_max_alcanzable en el resultado"
    assert a["tph_max_alcanzable"] > 0, (
        f"tph_max_alcanzable debe ser > 0 cuando hay equipos en el catálogo; "
        f"se obtuvo {a['tph_max_alcanzable']}"
    )
    # Lo requerido debe ser mucho mayor que lo alcanzable
    assert a["tph_requerido"] > a["tph_max_alcanzable"], (
        "Para el caso imposible, tph_requerido debe superar tph_max_alcanzable"
    )


def test_caso_imposible_trae_salidas_concretas():
    """Los resultados deben incluir al menos una salida concreta distinta de None."""
    results = recommend(**_IMPOSIBLE)
    assert results
    a = results[0]
    # Al menos uno de los tres campos de salida debe tener valor
    salidas = {
        "meses_extra": a.get("meses_extra"),
        "horas_adicionales_mes": a.get("horas_adicionales_mes"),
        "unidades_extra": a.get("unidades_extra"),
    }
    tienen_valor = [k for k, v in salidas.items() if v is not None and v != 0]
    assert tienen_valor, (
        f"Para caso imposible, debe haber al menos una salida concreta con valor. "
        f"salidas={salidas}"
    )
    # meses_extra debe ser positivo para el caso imposible
    assert a.get("meses_extra") is None or a["meses_extra"] > 0, (
        f"meses_extra debe ser > 0 para caso imposible. meses_extra={a.get('meses_extra')}"
    )


def test_campos_nuevos_en_caso_normal_que_cumple():
    """Todos los campos nuevos están presentes también en un caso que sí cumple."""
    results = recommend(**_NORMAL)
    assert results
    a = results[0]
    for campo in _CAMPOS_NUEVOS:
        assert campo in a, f"Campo '{campo}' debe estar presente aunque el caso cumpla"
    if a["cumple_plazo"]:
        assert a["meses_extra"] == 0, "Si cumple, meses_extra debe ser 0"
        assert a["unidades_extra"] == 0, "Si cumple, unidades_extra debe ser 0"
