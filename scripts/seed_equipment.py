"""
KrushRock — Seed del catálogo de equipos en Supabase.

Extrae los datos del objeto EQ de App.jsx (fuente de verdad actual)
y los inserta en la tabla `equipment` de Supabase.

Requisitos:
  1. La tabla ya debe existir (ejecutar migrations/001_equipment_table.sql primero).
  2. Las variables de entorno SUPABASE_URL y SUPABASE_SERVICE_KEY deben estar disponibles.

Uso:
  cd KRUSHROCK
  python scripts/seed_equipment.py
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

# Carga las variables de entorno desde .env si existe
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from app.core.supabase import get_supabase

# ── DATOS EXTRAÍDOS PROGRAMÁTICAMENTE DEL OBJETO EQ EN App.jsx ───────────────
# Para añadir equipos: editar aquí Y actualizar EQ en App.jsx (hasta que Tarea 2
# esté completamente estable y el frontend deje de usar el fallback local).

EQ_SEED = {
    "jaw": [
        {"brand": "Terex Finlay",  "model": "J-960",            "palanca": "doble",  "rpm": 320, "feedMm": 580,  "cssR": [40, 140],  "capR": [80, 200],   "notes": "Compacta, orugas"},
        {"brand": "Terex Finlay",  "model": "J-1160",           "palanca": "doble",  "rpm": 300, "feedMm": 780,  "cssR": [45, 160],  "capR": [150, 280],  "notes": "Orugas, C9.3 ACERT"},
        {"brand": "Terex Finlay",  "model": "J-1175",           "palanca": "doble",  "rpm": 290, "feedMm": 790,  "cssR": [50, 175],  "capR": [200, 350],  "notes": "Orugas, C13 ACERT"},
        {"brand": "Terex Finlay",  "model": "J-1280",           "palanca": "doble",  "rpm": 270, "feedMm": 1070, "cssR": [75, 175],  "capR": [250, 400],  "notes": "Orugas, alta capacidad"},
        {"brand": "Terex Finlay",  "model": "J-1480",           "palanca": "simple", "rpm": 250, "feedMm": 1400, "cssR": [100, 200], "capR": [400, 600],  "notes": "Orugas, gran formato"},
        {"brand": "Powerscreen",   "model": "Premiertrak 600",  "palanca": "doble",  "rpm": 310, "feedMm": 600,  "cssR": [40, 150],  "capR": [100, 220],  "notes": "Compacta, orugas"},
        {"brand": "Powerscreen",   "model": "Premiertrak 1180", "palanca": "doble",  "rpm": 275, "feedMm": 1070, "cssR": [75, 175],  "capR": [200, 400],  "notes": "Accionamiento directo"},
        {"brand": "Powerscreen",   "model": "Premiertrak 1300", "palanca": "simple", "rpm": 260, "feedMm": 1100, "cssR": [75, 175],  "capR": [250, 450],  "notes": "Alta capacidad"},
        {"brand": "Kleemann",      "model": "MC 100 Ri EVO",    "palanca": "doble",  "rpm": 305, "feedMm": 760,  "cssR": [50, 150],  "capR": [150, 280],  "notes": "Diesel-eléctrico"},
        {"brand": "Kleemann",      "model": "MC 110 Ri EVO",    "palanca": "doble",  "rpm": 290, "feedMm": 950,  "cssR": [60, 160],  "capR": [200, 380],  "notes": "Diesel-eléctrico"},
        {"brand": "Kleemann",      "model": "MC 120 Zi EVO",    "palanca": "simple", "rpm": 265, "feedMm": 1200, "cssR": [80, 180],  "capR": [300, 500],  "notes": "Diesel-eléctrico"},
        {"brand": "Sandvik",       "model": "UJ310",            "palanca": "doble",  "rpm": 300, "feedMm": 820,  "cssR": [50, 160],  "capR": [150, 280],  "notes": "Orugas"},
        {"brand": "Sandvik",       "model": "UJ440i",           "palanca": "simple", "rpm": 265, "feedMm": 1100, "cssR": [65, 200],  "capR": [200, 450],  "notes": "Radio remoto incluido"},
        {"brand": "Metso Outotec", "model": "LT106",            "palanca": "doble",  "rpm": 290, "feedMm": 900,  "cssR": [55, 160],  "capR": [150, 300],  "notes": "Orugas sobre chasis"},
        {"brand": "Metso Outotec", "model": "LT120",            "palanca": "doble",  "rpm": 275, "feedMm": 1100, "cssR": [65, 180],  "capR": [200, 400],  "notes": "Orugas, alta producción"},
        {"brand": "Metso Outotec", "model": "LT130E",           "palanca": "simple", "rpm": 255, "feedMm": 1200, "cssR": [75, 200],  "capR": [250, 500],  "notes": "Eléctrico, gran capacidad"},
        {"brand": "Astec",         "model": "GT125",            "palanca": "doble",  "rpm": 310, "feedMm": 760,  "cssR": [45, 150],  "capR": [120, 250],  "notes": "Orugas, compacta"},
        {"brand": "Astec",         "model": "GT165",            "palanca": "doble",  "rpm": 285, "feedMm": 1050, "cssR": [65, 175],  "capR": [200, 380],  "notes": "Orugas, estándar"},
    ],
    "cone": [
        {"brand": "Terex Finlay",  "model": "C-1540",     "rpm": 280, "feedMm": 215, "cssR": [10, 44], "capR": [150, 300], "notes": "Cono secundario estándar"},
        {"brand": "Terex Finlay",  "model": "C-1545",     "rpm": 285, "feedMm": 240, "cssR": [10, 48], "capR": [160, 320], "notes": "Cono alta eficiencia"},
        {"brand": "Terex Finlay",  "model": "C-1550",     "rpm": 290, "feedMm": 280, "cssR": [10, 50], "capR": [180, 370], "notes": "Alta capacidad, orugas"},
        {"brand": "Terex Finlay",  "model": "C-1554",     "rpm": 295, "feedMm": 280, "cssR": [8,  50], "capR": [200, 400], "notes": "Recorrido largo, alto rendimiento"},
        {"brand": "Powerscreen",   "model": "Maxtrak 1000","rpm": 300, "feedMm": 130, "cssR": [8,  38], "capR": [80,  200], "notes": "Compacto, orugas"},
        {"brand": "Powerscreen",   "model": "Maxtrak 1150","rpm": 285, "feedMm": 185, "cssR": [10, 44], "capR": [130, 280], "notes": "Autónomo sobre orugas"},
        {"brand": "Powerscreen",   "model": "Maxtrak 1300","rpm": 278, "feedMm": 220, "cssR": [10, 48], "capR": [180, 380], "notes": "Alta capacidad"},
        {"brand": "Sandvik",       "model": "QH331",      "rpm": 310, "feedMm": 185, "cssR": [6,  38], "capR": [100, 240], "notes": "CH430 Hydrocone"},
        {"brand": "Sandvik",       "model": "QH332",      "rpm": 310, "feedMm": 185, "cssR": [6,  38], "capR": [120, 260], "notes": "CH430 Hydrocone"},
        {"brand": "Sandvik",       "model": "QH441",      "rpm": 290, "feedMm": 275, "cssR": [8,  45], "capR": [180, 400], "notes": "CH660 Hydrocone"},
        {"brand": "Kleemann",      "model": "MCO 9i S EVO","rpm": 315, "feedMm": 150, "cssR": [8,  32], "capR": [90,  200], "notes": "Diesel-eléctrico Tier 4"},
        {"brand": "Kleemann",      "model": "MCO 11i EVO","rpm": 298, "feedMm": 185, "cssR": [8,  44], "capR": [130, 300], "notes": "Diesel-eléctrico"},
        {"brand": "Kleemann",      "model": "MCO 13i EVO","rpm": 285, "feedMm": 225, "cssR": [10, 48], "capR": [180, 400], "notes": ""},
        {"brand": "Metso Outotec", "model": "LT200HPS",   "rpm": 280, "feedMm": 215, "cssR": [8,  44], "capR": [140, 300], "notes": "Orugas, cono HP"},
        {"brand": "Metso Outotec", "model": "LT300HPS",   "rpm": 270, "feedMm": 270, "cssR": [10, 50], "capR": [200, 450], "notes": "Orugas, gran capacidad"},
        {"brand": "Astec",         "model": "GT440",      "rpm": 290, "feedMm": 190, "cssR": [8,  44], "capR": [130, 280], "notes": "Orugas"},
        {"brand": "Astec",         "model": "GT550",      "rpm": 278, "feedMm": 230, "cssR": [10, 50], "capR": [180, 380], "notes": "Orugas, alta capacidad"},
    ],
    "hsi": [
        {"brand": "Terex Finlay",  "model": "I-110RS",      "feedMm": 750,  "capR": [130, 250], "notes": "Primario/secundario, orugas"},
        {"brand": "Terex Finlay",  "model": "I-120RS",      "feedMm": 850,  "capR": [160, 300], "notes": "Con seleccionadora integrada"},
        {"brand": "Terex Finlay",  "model": "I-140RS",      "feedMm": 900,  "capR": [250, 400], "notes": "Alta capacidad, orugas"},
        {"brand": "Terex Finlay",  "model": "I-1312RS",     "feedMm": 1100, "capR": [300, 500], "notes": "Primario, roca blanda-media"},
        {"brand": "Powerscreen",   "model": "Trakpactor 260","feedMm": 800, "capR": [150, 280], "notes": "Orugas"},
        {"brand": "Powerscreen",   "model": "Trakpactor 320","feedMm": 900, "capR": [200, 350], "notes": "Orugas"},
        {"brand": "Powerscreen",   "model": "Trakpactor 550SR","feedMm": 1100,"capR": [300, 500],"notes": "Con seleccionadora integrada"},
        {"brand": "Kleemann",      "model": "MR 110i EVO2", "feedMm": 1100, "capR": [200, 380], "notes": "Diesel-eléctrico"},
        {"brand": "Kleemann",      "model": "MR 130i EVO2", "feedMm": 1300, "capR": [300, 500], "notes": "Diesel-eléctrico"},
        {"brand": "Metso Outotec", "model": "LT1213S",      "feedMm": 1000, "capR": [200, 400], "notes": "Con seleccionadora integrada"},
        {"brand": "Metso Outotec", "model": "LT1415",       "feedMm": 1100, "capR": [250, 450], "notes": ""},
        {"brand": "Sandvik",       "model": "QI341",         "feedMm": 850,  "capR": [160, 300], "notes": "HSI primario/secundario"},
        {"brand": "Sandvik",       "model": "QI442",         "feedMm": 1000, "capR": [250, 450], "notes": "HSI alta capacidad"},
        {"brand": "Astec",         "model": "GT2310",        "feedMm": 900,  "capR": [150, 300], "notes": "Orugas"},
        {"brand": "Astec",         "model": "GT4250",        "feedMm": 1100, "capR": [250, 450], "notes": "Orugas"},
    ],
    "screen": [
        {"brand": "Terex Finlay",  "model": "683",             "decks": 2, "capR": [100, 250], "notes": "2 deck — versátil, orugas"},
        {"brand": "Terex Finlay",  "model": "684 2-deck",      "decks": 2, "capR": [120, 280], "notes": "2 deck — alta producción"},
        {"brand": "Terex Finlay",  "model": "684 3-deck",      "decks": 3, "capR": [150, 300], "notes": "3 deck — alta clasificación"},
        {"brand": "Terex Finlay",  "model": "694+",            "decks": 3, "capR": [150, 350], "notes": "3 deck — orugas, 3 fracciones"},
        {"brand": "Terex Finlay",  "model": "696 3-deck",      "decks": 3, "capR": [180, 400], "notes": "3 deck — gran capacidad"},
        {"brand": "Powerscreen",   "model": "Warrior 1800",    "decks": 2, "capR": [100, 280], "notes": "2 deck"},
        {"brand": "Powerscreen",   "model": "Chieftain 1700",  "decks": 2, "capR": [120, 300], "notes": "2 deck — fácil cambio de mallas"},
        {"brand": "Powerscreen",   "model": "Chieftain 2100X", "decks": 3, "capR": [150, 380], "notes": "3 deck — alta capacidad"},
        {"brand": "Kleemann",      "model": "MS 703i",         "decks": 2, "capR": [100, 250], "notes": "2 deck — eléctrico, compacto"},
        {"brand": "Kleemann",      "model": "MS 953i EVO",     "decks": 3, "capR": [150, 350], "notes": "3 deck — diesel-eléctrico"},
        {"brand": "Sandvik",       "model": "QA330",           "decks": 2, "capR": [120, 280], "notes": "2 deck"},
        {"brand": "Sandvik",       "model": "QA335",           "decks": 3, "capR": [150, 300], "notes": "3 deck — plantas áridos"},
        {"brand": "Metso Outotec", "model": "ST2.4",           "decks": 2, "capR": [100, 250], "notes": "2 deck"},
        {"brand": "Metso Outotec", "model": "ST3.5",           "decks": 3, "capR": [150, 350], "notes": "3 deck"},
        {"brand": "Astec",         "model": "M6x20-3D",        "decks": 3, "capR": [150, 300], "notes": "3 deck"},
    ],
    "screen_1d": [
        {"brand": "Terex Finlay",  "model": "Rinser 873", "decks": 1, "capR": [80, 200],  "notes": "1 deck lavado/descascarado"},
        {"brand": "Powerscreen",   "model": "Warrior 600","decks": 1, "capR": [60, 150],  "notes": "1 deck, compacta"},
        {"brand": "Kleemann",      "model": "MS 402i",    "decks": 1, "capR": [70, 180],  "notes": "1 deck eléctrico"},
        {"brand": "Metso Outotec", "model": "ST1.5",      "decks": 1, "capR": [80, 180],  "notes": "1 deck"},
        {"brand": "Sandvik",       "model": "QA141",      "decks": 1, "capR": [80, 200],  "notes": "1 deck"},
    ],
    "screen_hf": [
        {"brand": "Terex Finlay",  "model": "883 HF",        "decks": 2, "capR": [80, 200],  "notes": "Alta frecuencia 2 deck, finos"},
        {"brand": "Terex Finlay",  "model": "884 HF",        "decks": 2, "capR": [100, 240], "notes": "Alta frecuencia 2 deck"},
        {"brand": "Powerscreen",   "model": "Warrior 2100",  "decks": 2, "capR": [100, 250], "notes": "Alta frecuencia, fino seco"},
        {"brand": "Kleemann",      "model": "MOBISCREEN HF", "decks": 2, "capR": [80, 200],  "notes": "Alta frecuencia"},
        {"brand": "Metso Outotec", "model": "SF Series HF",  "decks": 2, "capR": [90, 220],  "notes": "Alta frecuencia"},
    ],
}


def build_records():
    """Convierte EQ_SEED al formato de la tabla equipment."""
    records = []
    for eq_type, items in EQ_SEED.items():
        for item in items:
            rec = {
                "brand":       item["brand"],
                "model":       item["model"],
                "type":        eq_type,
                "cap_min_tph": float(item["capR"][0]),
                "cap_max_tph": float(item["capR"][1]),
                "feed_max_mm": float(item.get("feedMm") or 0) or None,
                "decks":       item.get("decks"),
                "notes":       item.get("notes", ""),
                "extra_specs": {},
            }
            if "cssR" in item:
                rec["css_min_mm"] = float(item["cssR"][0])
                rec["css_max_mm"] = float(item["cssR"][1])
            if "palanca" in item:
                rec["extra_specs"]["palanca"] = item["palanca"]
            if "rpm" in item:
                rec["extra_specs"]["rpm"] = item["rpm"]
            records.append(rec)
    return records


def main():
    sb = get_supabase()
    records = build_records()
    print(f"Insertando {len(records)} equipos en Supabase...")

    try:
        result = sb.table("equipment").upsert(records, on_conflict="brand,model").execute()
        print(f"[OK] Seed completado. Registros procesados: {len(result.data)}")
    except Exception as e:
        print(f"[ERROR] {e}")
        print()
        print("Si la tabla no existe, ejecuta primero en el SQL Editor de Supabase:")
        print("  migrations/001_equipment_table.sql")
        sys.exit(1)


if __name__ == "__main__":
    main()
