"""
KrushRock — Clases de equipo para el modo simple (D-23, D-25, T-26)

Una clase es una especificación por tamaño físico, no una marca ni un modelo.
Cada clase tiene una máquina de referencia que ancla sus datos de cálculo,
pero esa referencia NO se expone al cliente (D-25).

Diez clases completas (con curva de capacidad verificada contra manual):
  Mandíbulas : J-960 · J-1170 · J-1175
  Conos      : C-1540 · C-1550+
  Seleccionadoras: 683 · 684 2-deck · 684 3-deck · 694+ · 696 3-deck
"""
import copy
from typing import Dict, List, Optional


# ── MAPAS DE CLASE POR TIPO Y MODELO DE REFERENCIA ───────────────────────────
# Solo modelos con curva de capacidad verificada contra manual oficial.

_JAW_CLASS: Dict[str, str] = {
    "J-960":  "Mandíbula 900×600 mm",
    "J-1170": "Mandíbula 1100×700 mm",
    "J-1175": "Mandíbula 1070×762 mm",
}

_CONE_CLASS: Dict[str, str] = {
    "C-1540":  "Cono de 3 pies (1000 mm)",
    "C-1550+": "Cono de 4¼ pies (1300 mm)",
}

_SCREEN_CLASS: Dict[str, str] = {
    "683":        "Seleccionadora 3,65×1,5 m · 2 decks",
    "684 2-deck": "Seleccionadora 4,3×1,7 m · 2 decks",
    "684 3-deck": "Seleccionadora 4,3×1,7 m · 3 decks",
    "694+":       "Seleccionadora 6,1×1,52 m · 3 decks",
    "696 3-deck": "Seleccionadora 6,1×1,70 m · 3 decks",
}

# Mapa unificado tipo_catálogo → {modelo: nombre_clase}
_CLASS_MAP: Dict[str, Dict[str, str]] = {
    "jaw":    _JAW_CLASS,
    "cone":   _CONE_CLASS,
    "screen": _SCREEN_CLASS,
}

# Descripción técnica de cada clase para mostrar al cliente
_CLASS_DETAIL: Dict[str, str] = {
    "Mandíbula 900×600 mm":              "Boca 900×600 mm · CSS 40–125 mm · 65–160 tph",
    "Mandíbula 1100×700 mm":             "Boca 1100×700 mm · CSS 50–150 mm · 90–290 tph",
    "Mandíbula 1070×762 mm":             "Boca 1070×762 mm · CSS 50–175 mm · 113–452 tph",
    "Cono de 3 pies (1000 mm)":          "Diámetro 1000 mm · CSS 19–32 mm · 125–220 tph",
    "Cono de 4¼ pies (1300 mm)":         "Diámetro 1300 mm · CSS 22–50 mm · 250–589 tph",
    "Seleccionadora 3,65×1,5 m · 2 decks": "3,65×1,5 m · 2 decks · 5,48 m²/deck",
    "Seleccionadora 4,3×1,7 m · 2 decks":  "4,3×1,7 m · 2 decks · 7,31 m²/deck",
    "Seleccionadora 4,3×1,7 m · 3 decks":  "4,3×1,7 m · 3 decks · 7,31 m²/deck",
    "Seleccionadora 6,1×1,52 m · 3 decks": "6,1×1,524 m · 3 decks · 9,29 m²/deck",
    "Seleccionadora 6,1×1,70 m · 3 decks": "6,1×1,70 m · 3 decks · 10,37 m²/deck",
}


def _normalize_type(etapa: str) -> str:
    """Normaliza el tipo de etapa a la clave del catálogo."""
    if etapa in ("jaw", "scalper"):
        return "jaw"
    if etapa == "cone":
        return "cone"
    if etapa in ("screen", "screen_1d", "screen_hf"):
        return "screen"
    return etapa


def get_class_name(equip_type: str, model: str) -> Optional[str]:
    """
    Retorna el nombre de clase para un tipo y modelo de equipo.
    Retorna None si el modelo no pertenece a las diez clases completas.
    """
    tipo_normalizado = _normalize_type(equip_type)
    return _CLASS_MAP.get(tipo_normalizado, {}).get(model)


def get_class_detail(class_name: str) -> Optional[str]:
    """Descripción técnica de la clase para mostrar al cliente."""
    return _CLASS_DETAIL.get(class_name)


def apply_equipment_classes(results: List[Dict]) -> List[Dict]:
    """
    Transforma la lista de resultados de recommend() al formato de clases (D-23, D-25).

    - Reemplaza 'marca' y 'modelo' por 'clase' en cada equipo.
    - Actualiza 'tipo_legible' con el nombre de la clase.
    - Agrega 'clase_detalle' con los rangos técnicos.
    - Filtra resultados que incluyan equipos sin clase asignada
      (equipos fuera de las diez clases completas no aparecen en modo simple).

    La máquina de referencia nunca viaja en la respuesta (D-25).
    """
    filtered = []
    for result in results:
        equipos = result.get("equipos", [])
        equipos_clase = []
        valido = True

        for eq in equipos:
            etapa = eq.get("etapa", "")
            modelo = eq.get("modelo", "")
            tipo = _normalize_type(etapa)
            clase = get_class_name(tipo, modelo)

            if clase is None:
                valido = False
                break

            eq_clase = {k: v for k, v in eq.items() if k not in ("marca", "modelo")}
            eq_clase["clase"] = clase
            eq_clase["clase_detalle"] = _CLASS_DETAIL.get(clase, "")
            eq_clase["tipo_legible"] = clase
            equipos_clase.append(eq_clase)

        if not valido:
            continue

        resultado_simple = copy.copy(result)
        resultado_simple["equipos"] = equipos_clase
        filtered.append(resultado_simple)

    return filtered
