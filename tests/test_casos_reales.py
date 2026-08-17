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
#
# REGLA 9 de CLAUDE.md: nunca crear un alias, mapeo o sustituto que haga pasar
# un equipo por otro.
#
# Antes existían tres mecanismos de sustitución silenciosa que violaban esa regla:
#   1. _FULL_NAME_ALIASES mapeaba equipos Minyu y MEKA a equipos Terex/Sandvik/Kleemann.
#   2. _MODEL_ALIASES mapeaba la seleccionadora 883+ a una 694+.
#   3. Un fallback "por convención de nombres" elegía el equipo de mayor capacidad
#      de la marca cuando no encontraba el modelo.
#
# Con eso, un caso de validación podía pasar usando equipos que no eran los del
# reporte AggFlow original. El caso "Mina El Pleito" venía pasando por casualidad:
# los datos equivocados del C-1540 (300 tph en vez de 220) se parecían al cono
# Minyu real. Al corregir el catálogo con el manual oficial, la coincidencia se
# rompió — que es el resultado correcto.
#
# Hoy: si un equipo del caso no está en el catálogo con su marca y modelo reales,
# el caso NO se ejecuta. Se salta con un mensaje que dice qué falta.

# Marcas de varias palabras que rsplit(" ", 1) no puede separar.
# Cada entrada apunta al MISMO equipo, no a un sustituto: esto es solo parsing.
_PARSING_ONLY: dict = {
    "Powerscreen Premiertrak R400": ("jaw",    "Powerscreen", "Premiertrak R400"),
    "Powerscreen XH320SR":          ("hsi",    "Powerscreen", "XH320SR"),
    "Powerscreen XH320SR Screen":   ("screen", "Powerscreen", "XH320SR Screen"),
}


def _existe_en_catalogo(etapa: str, marca: str, modelo: str) -> bool:
    """True si el catálogo contiene exactamente esa marca y modelo en esa etapa."""
    return any(
        eq.get("brand") == marca and eq.get("model") == modelo
        for eq in _FALLBACK.get(etapa, [])
    )


def _resolve_equipo(nombre_completo: str) -> Optional[dict]:
    """
    'Terex Finlay J-1175' → {etapa, marca, modelo} si está en el catálogo.

    Devuelve None si el equipo real no existe en el catálogo. NO sustituye por
    otro equipo bajo ninguna circunstancia.
    """
    if nombre_completo in _PARSING_ONLY:
        etapa, marca, modelo = _PARSING_ONLY[nombre_completo]
        if _existe_en_catalogo(etapa, marca, modelo):
            return {"etapa": etapa, "marca": marca, "modelo": modelo}
        return None

    partes = nombre_completo.rsplit(" ", 1)
    if len(partes) != 2:
        return None
    marca, modelo = partes

    for etapa, equipos in _FALLBACK.items():
        for eq in equipos:
            if eq.get("model", "") == modelo and eq.get("brand", "") == marca:
                return {"etapa": etapa, "marca": eq["brand"], "modelo": eq["model"]}

    return None


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

    # Resolver equipos SIN sustituciones. Si falta alguno, el caso no se ejecuta.
    resueltos = [(n, _resolve_equipo(n)) for n in caso["equipos"]]
    faltantes = sorted({n for n, r in resueltos if r is None})
    if faltantes:
        pytest.skip(
            f"[{caso['nombre']}] no se ejecuta: estos equipos del reporte original "
            f"no están en el catálogo con sus especificaciones reales: "
            f"{', '.join(faltantes)}. "
            f"Cargar sus specs de fabricante para reactivar el caso. "
            f"NO sustituir por otros equipos (CLAUDE.md regla 9)."
        )

    equipos = [r for _, r in resueltos]
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
        alimentacion_tph=caso.get("alimentacion_tph"),
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


# ── Guardia contra la reintroducción de sustituciones ─────────────────────────

def test_no_existen_sustituciones_de_equipos():
    """
    CLAUDE.md regla 9: nunca hacer pasar un equipo por otro.

    Este test falla si alguien vuelve a agregar un mapeo que apunte a un equipo
    distinto del que nombra el caso de validación. Las entradas de _PARSING_ONLY
    solo existen para separar marcas de varias palabras y deben apuntar al mismo
    modelo que aparece en su clave.
    """
    for nombre_completo, (etapa, marca, modelo) in _PARSING_ONLY.items():
        assert nombre_completo == f"{marca} {modelo}", (
            f"Sustitución detectada: el caso nombra '{nombre_completo}' pero el "
            f"mapeo apunta a '{marca} {modelo}'. Un equipo no puede hacerse pasar "
            f"por otro. Si el equipo real no está en el catálogo, cargar sus "
            f"especificaciones de fabricante o dejar que el caso se salte."
        )


def test_resolver_equipo_inexistente_devuelve_none():
    """Un equipo que no está en el catálogo no debe resolverse a ningún sustituto."""
    assert _resolve_equipo("MarcaInventada Modelo-999") is None
    assert _resolve_equipo("Minyu MSP 300 F") is None
