"""
KrushRock — Validación contra casos reales (AggFlow)

Lee tests/casos_validacion_reales.json y verifica que run_config() produce
resultados dentro de ±15% de los valores esperados.

Los valores del JSON son la FUENTE DE VERDAD: si el test falla, se corrige
el motor, nunca el JSON.

Nota sobre horas_dia/dias_mes: cada caso define estos valores (ej. 6×30=180).
Se pasan directamente a run_config() para calcular meses_requeridos con las
horas reales del caso (no las 500 h/mes estándar).
"""
import sys
import json
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from app.services.recommender import run_config
from app.routers.equipment import _FALLBACK

# ── Resolución de equipos ─────────────────────────────────────────────────────

# Nombres completos que no se pueden parsear con rsplit(" ", 1) porque la marca
# tiene varias palabras (ej. "Minyu MS 4230" → marca="Minyu MS", modelo="4230").
# Mapeados al sustituto equivalente del catálogo.
_FULL_NAME_ALIASES: dict = {
    "Minyu MS 4230":   ("jaw",    "Terex Finlay", "J-1175"),
    "Minyu MSP 300 F": ("cone",   "Terex Finlay", "C-1540"),
    "Minyu MOP2460D":  ("cone",   "Sandvik",      "QH332"),
    "MEKA 90/2000 ROS":("screen", "Kleemann",     "MS 703i"),
}

# Modelos reales no presentes en catálogo → sustituto de misma capacidad y tipo.
# La seleccionadora 883+ (3-deck, ~350 tph) se mapea a 694+ que tiene las mismas
# características relevantes; con la mandíbula J-1175 como cuello de botella
# el TPH del circuito no cambia.
_MODEL_ALIASES = {
    "883+":    ("screen", "Terex Finlay", "694+"),
    "MS 703i": ("screen", "Kleemann",     "MS 703i"),
}


def _resolve_equipo(nombre_completo: str) -> dict:
    """
    'Terex Finlay J-1175' → {etapa, marca, modelo} buscando en catálogo.
    Si no se encuentra exacto, intenta _FULL_NAME_ALIASES, _MODEL_ALIASES;
    luego infiere por tipo.
    """
    # Alias de nombre completo (marcas multi-palabra que rsplit no puede parsear)
    if nombre_completo in _FULL_NAME_ALIASES:
        etapa, marca_cat, modelo_cat = _FULL_NAME_ALIASES[nombre_completo]
        return {"etapa": etapa, "marca": marca_cat, "modelo": modelo_cat}

    partes = nombre_completo.rsplit(" ", 1)
    if len(partes) != 2:
        raise ValueError(f"No se puede parsear equipo: {nombre_completo!r}")
    marca, modelo = partes

    # Búsqueda exacta en catálogo
    for etapa, equipos in _FALLBACK.items():
        for eq in equipos:
            if eq.get("model", "") == modelo and eq.get("brand", "") == marca:
                return {"etapa": etapa, "marca": eq["brand"], "modelo": eq["model"]}

    # Alias documentados para modelos no en catálogo
    if modelo in _MODEL_ALIASES:
        etapa, marca_cat, modelo_cat = _MODEL_ALIASES[modelo]
        return {"etapa": etapa, "marca": marca_cat, "modelo": modelo_cat}

    # Inferencia por convención de nombres
    if modelo.startswith("J-"):
        tipo = "jaw"
    elif modelo.startswith("C-"):
        tipo = "cone"
    elif modelo.startswith("I-"):
        tipo = "hsi"
    else:
        tipo = "screen"

    candidatos = [eq for eq in _FALLBACK.get(tipo, []) if eq.get("brand", "") == marca]
    if candidatos:
        mejor = max(candidatos, key=lambda e: e.get("cap_max_tph", 0))
        return {"etapa": tipo, "marca": mejor["brand"], "modelo": mejor["model"]}

    raise ValueError(f"Equipo no resuelto en catálogo ni en aliases: {nombre_completo!r}")


# ── Carga de casos ────────────────────────────────────────────────────────────

_CASOS_PATH = Path(__file__).parent / "casos_validacion_reales.json"


def _load_casos():
    with open(_CASOS_PATH, encoding="utf-8") as f:
        return json.load(f)["casos"]


# ── Test parametrizado ────────────────────────────────────────────────────────

@pytest.mark.parametrize("caso", _load_casos(), ids=lambda c: c["nombre"])
def test_caso_real(caso, request):
    """
    Verifica que run_config() produce resultados dentro de ±15% del caso real.
    - aggflow_verificado: fallo = error real (strict).
    - referencia: fallo = xfail (advertencia, no bloquea la suite).
    """
    if caso.get("certificacion") == "referencia":
        request.applymarker(
            pytest.mark.xfail(
                strict=False,
                reason="caso de referencia sin reporte AggFlow verificado",
            )
        )

    duracion = caso["plazo_meses"]
    esperado = caso["esperado"]

    equipos = [_resolve_equipo(nombre) for nombre in caso["equipos"]]
    products = [
        {
            "name": caso["producto_objetivo"].get("name", "producto"),
            "min_mm": float(caso["producto_objetivo"]["min_mm"]),
            "max_mm": float(caso["producto_objetivo"]["max_mm"]),
            "volumen_ton": float(caso["producto_objetivo"]["volumen_ton"]),
        }
    ]

    # Construir feed_curve_dict si el caso lo tiene
    feed_curve_dict: Optional[dict] = None
    if "feed_curve" in caso:
        feed_curve_dict = {
            float(p["size_mm"]): float(p["passing_pct"])
            for p in caso["feed_curve"]
        }

    # Ejecutar con las horas reales del caso (no las 500 h/mes estándar)
    result = run_config(
        equipos=equipos,
        f80_mm=float(caso["f80_mm"]),
        products=products,
        duracion_meses=int(duracion),
        rock_type=caso.get("rock_type", "granito"),
        n_units=1,
        circuit=caso.get("circuito", "open"),
        horas_dia=float(caso["horas_dia"]),
        dias_mes=float(caso["dias_mes"]),
        feed_curve_dict=feed_curve_dict,
    )

    def _dentro_de_15(campo: str, obtenido: float, esp: float) -> None:
        tolerancia = abs(esp) * 0.15
        diferencia = abs(obtenido - esp)
        assert diferencia <= tolerancia, (
            f"\n[{caso['nombre']}] {campo} fuera de tolerancia ±15%:\n"
            f"  esperado  = {esp}\n"
            f"  obtenido  = {obtenido:.2f}\n"
            f"  diferencia= {diferencia:.2f}  (tolerancia={tolerancia:.2f})"
        )

    _dentro_de_15("tph_util", result["tph_util"], esperado["tph_util"])
    if "product_fit_pct" in esperado:
        _dentro_de_15("product_fit_pct", result["product_fit_pct"], esperado["product_fit_pct"])

    meses_obt = result["meses_requeridos"]
    assert meses_obt is not None, (
        f"[{caso['nombre']}] meses_requeridos es None "
        f"(hay productos inalcanzables en products_detail)"
    )
    _dentro_de_15("meses_requeridos", meses_obt, esperado["meses_requeridos"])

    assert result["cumple_plazo"] == esperado["cumple_plazo"], (
        f"\n[{caso['nombre']}] cumple_plazo incorrecto:\n"
        f"  esperado        = {esperado['cumple_plazo']}\n"
        f"  obtenido        = {result['cumple_plazo']}\n"
        f"  meses_requeridos= {meses_obt}\n"
        f"  duracion_meses  = {duracion}"
    )
