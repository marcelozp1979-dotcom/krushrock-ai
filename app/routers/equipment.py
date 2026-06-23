"""KrushRock — Router de Equipos (catálogo desde Supabase con fallback hardcodeado)"""
from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any

router = APIRouter()

# ── CATÁLOGO DE FALLBACK ──────────────────────────────────────────────────────
# Usado cuando Supabase no está disponible o la tabla está vacía.
# Esta es la misma fuente de verdad que EQ en App.jsx.
# ELIMINAR cuando el seed de Supabase sea estable en producción.
_FALLBACK: Dict[str, List[Dict[str, Any]]] = {
    "jaw": [
        {"brand": "Terex Finlay",  "model": "J-960",            "type": "jaw", "css_min_mm": 40,  "css_max_mm": 140, "cap_min_tph": 80,  "cap_max_tph": 200,  "feed_max_mm": 580,  "decks": None, "extra_specs": {"palanca": "doble",  "rpm": 320}, "notes": "Compacta, orugas"},
        {"brand": "Terex Finlay",  "model": "J-1160",           "type": "jaw", "css_min_mm": 45,  "css_max_mm": 160, "cap_min_tph": 150, "cap_max_tph": 280,  "feed_max_mm": 780,  "decks": None, "extra_specs": {"palanca": "doble",  "rpm": 300}, "notes": "Orugas, C9.3 ACERT"},
        {"brand": "Terex Finlay",  "model": "J-1175",           "type": "jaw", "css_min_mm": 50,  "css_max_mm": 175, "cap_min_tph": 200, "cap_max_tph": 350,  "feed_max_mm": 790,  "decks": None, "extra_specs": {"palanca": "doble",  "rpm": 290}, "notes": "Orugas, C13 ACERT"},
        {"brand": "Terex Finlay",  "model": "J-1280",           "type": "jaw", "css_min_mm": 75,  "css_max_mm": 175, "cap_min_tph": 250, "cap_max_tph": 400,  "feed_max_mm": 1070, "decks": None, "extra_specs": {"palanca": "doble",  "rpm": 270}, "notes": "Orugas, alta capacidad"},
        {"brand": "Terex Finlay",  "model": "J-1480",           "type": "jaw", "css_min_mm": 100, "css_max_mm": 200, "cap_min_tph": 400, "cap_max_tph": 600,  "feed_max_mm": 1400, "decks": None, "extra_specs": {"palanca": "simple", "rpm": 250}, "notes": "Orugas, gran formato"},
        {"brand": "Powerscreen",   "model": "Premiertrak 600",  "type": "jaw", "css_min_mm": 40,  "css_max_mm": 150, "cap_min_tph": 100, "cap_max_tph": 220,  "feed_max_mm": 600,  "decks": None, "extra_specs": {"palanca": "doble",  "rpm": 310}, "notes": "Compacta, orugas"},
        {"brand": "Powerscreen",   "model": "Premiertrak 1180", "type": "jaw", "css_min_mm": 75,  "css_max_mm": 175, "cap_min_tph": 200, "cap_max_tph": 400,  "feed_max_mm": 1070, "decks": None, "extra_specs": {"palanca": "doble",  "rpm": 275}, "notes": "Accionamiento directo"},
        {"brand": "Powerscreen",   "model": "Premiertrak 1300", "type": "jaw", "css_min_mm": 75,  "css_max_mm": 175, "cap_min_tph": 250, "cap_max_tph": 450,  "feed_max_mm": 1100, "decks": None, "extra_specs": {"palanca": "simple", "rpm": 260}, "notes": "Alta capacidad"},
        {"brand": "Kleemann",      "model": "MC 100 Ri EVO",    "type": "jaw", "css_min_mm": 50,  "css_max_mm": 150, "cap_min_tph": 150, "cap_max_tph": 280,  "feed_max_mm": 760,  "decks": None, "extra_specs": {"palanca": "doble",  "rpm": 305}, "notes": "Diesel-eléctrico"},
        {"brand": "Kleemann",      "model": "MC 110 Ri EVO",    "type": "jaw", "css_min_mm": 60,  "css_max_mm": 160, "cap_min_tph": 200, "cap_max_tph": 380,  "feed_max_mm": 950,  "decks": None, "extra_specs": {"palanca": "doble",  "rpm": 290}, "notes": "Diesel-eléctrico"},
        {"brand": "Kleemann",      "model": "MC 120 Zi EVO",    "type": "jaw", "css_min_mm": 80,  "css_max_mm": 180, "cap_min_tph": 300, "cap_max_tph": 500,  "feed_max_mm": 1200, "decks": None, "extra_specs": {"palanca": "simple", "rpm": 265}, "notes": "Diesel-eléctrico"},
        {"brand": "Sandvik",       "model": "UJ310",            "type": "jaw", "css_min_mm": 50,  "css_max_mm": 160, "cap_min_tph": 150, "cap_max_tph": 280,  "feed_max_mm": 820,  "decks": None, "extra_specs": {"palanca": "doble",  "rpm": 300}, "notes": "Orugas"},
        {"brand": "Sandvik",       "model": "UJ440i",           "type": "jaw", "css_min_mm": 65,  "css_max_mm": 200, "cap_min_tph": 200, "cap_max_tph": 450,  "feed_max_mm": 1100, "decks": None, "extra_specs": {"palanca": "simple", "rpm": 265}, "notes": "Radio remoto incluido"},
        {"brand": "Metso Outotec", "model": "LT106",            "type": "jaw", "css_min_mm": 55,  "css_max_mm": 160, "cap_min_tph": 150, "cap_max_tph": 300,  "feed_max_mm": 900,  "decks": None, "extra_specs": {"palanca": "doble",  "rpm": 290}, "notes": "Orugas sobre chasis"},
        {"brand": "Metso Outotec", "model": "LT120",            "type": "jaw", "css_min_mm": 65,  "css_max_mm": 180, "cap_min_tph": 200, "cap_max_tph": 400,  "feed_max_mm": 1100, "decks": None, "extra_specs": {"palanca": "doble",  "rpm": 275}, "notes": "Orugas, alta producción"},
        {"brand": "Metso Outotec", "model": "LT130E",           "type": "jaw", "css_min_mm": 75,  "css_max_mm": 200, "cap_min_tph": 250, "cap_max_tph": 500,  "feed_max_mm": 1200, "decks": None, "extra_specs": {"palanca": "simple", "rpm": 255}, "notes": "Eléctrico, gran capacidad"},
        {"brand": "Astec",         "model": "GT125",            "type": "jaw", "css_min_mm": 45,  "css_max_mm": 150, "cap_min_tph": 120, "cap_max_tph": 250,  "feed_max_mm": 760,  "decks": None, "extra_specs": {"palanca": "doble",  "rpm": 310}, "notes": "Orugas, compacta"},
        {"brand": "Astec",         "model": "GT165",            "type": "jaw", "css_min_mm": 65,  "css_max_mm": 175, "cap_min_tph": 200, "cap_max_tph": 380,  "feed_max_mm": 1050, "decks": None, "extra_specs": {"palanca": "doble",  "rpm": 285}, "notes": "Orugas, estándar"},
    ],
    "cone": [
        {"brand": "Terex Finlay",  "model": "C-1540",      "type": "cone", "css_min_mm": 10, "css_max_mm": 44, "cap_min_tph": 150, "cap_max_tph": 300, "feed_max_mm": 215, "decks": None, "extra_specs": {"rpm": 280}, "notes": "Cono secundario estándar"},
        {"brand": "Terex Finlay",  "model": "C-1545",      "type": "cone", "css_min_mm": 10, "css_max_mm": 48, "cap_min_tph": 160, "cap_max_tph": 320, "feed_max_mm": 240, "decks": None, "extra_specs": {"rpm": 285}, "notes": "Cono alta eficiencia"},
        {"brand": "Terex Finlay",  "model": "C-1550",      "type": "cone", "css_min_mm": 10, "css_max_mm": 50, "cap_min_tph": 180, "cap_max_tph": 370, "feed_max_mm": 280, "decks": None, "extra_specs": {"rpm": 290}, "notes": "Alta capacidad, orugas"},
        {"brand": "Terex Finlay",  "model": "C-1554",      "type": "cone", "css_min_mm": 8,  "css_max_mm": 50, "cap_min_tph": 200, "cap_max_tph": 400, "feed_max_mm": 280, "decks": None, "extra_specs": {"rpm": 295}, "notes": "Recorrido largo, alto rendimiento"},
        {"brand": "Powerscreen",   "model": "Maxtrak 1000","type": "cone", "css_min_mm": 8,  "css_max_mm": 38, "cap_min_tph": 80,  "cap_max_tph": 200, "feed_max_mm": 130, "decks": None, "extra_specs": {"rpm": 300}, "notes": "Compacto, orugas"},
        {"brand": "Powerscreen",   "model": "Maxtrak 1150","type": "cone", "css_min_mm": 10, "css_max_mm": 44, "cap_min_tph": 130, "cap_max_tph": 280, "feed_max_mm": 185, "decks": None, "extra_specs": {"rpm": 285}, "notes": "Autónomo sobre orugas"},
        {"brand": "Powerscreen",   "model": "Maxtrak 1300","type": "cone", "css_min_mm": 10, "css_max_mm": 48, "cap_min_tph": 180, "cap_max_tph": 380, "feed_max_mm": 220, "decks": None, "extra_specs": {"rpm": 278}, "notes": "Alta capacidad"},
        {"brand": "Sandvik",       "model": "QH331",       "type": "cone", "css_min_mm": 6,  "css_max_mm": 38, "cap_min_tph": 100, "cap_max_tph": 240, "feed_max_mm": 185, "decks": None, "extra_specs": {"rpm": 310}, "notes": "CH430 Hydrocone"},
        {"brand": "Sandvik",       "model": "QH332",       "type": "cone", "css_min_mm": 6,  "css_max_mm": 38, "cap_min_tph": 120, "cap_max_tph": 260, "feed_max_mm": 185, "decks": None, "extra_specs": {"rpm": 310}, "notes": "CH430 Hydrocone"},
        {"brand": "Sandvik",       "model": "QH441",       "type": "cone", "css_min_mm": 8,  "css_max_mm": 45, "cap_min_tph": 180, "cap_max_tph": 400, "feed_max_mm": 275, "decks": None, "extra_specs": {"rpm": 290}, "notes": "CH660 Hydrocone"},
        {"brand": "Kleemann",      "model": "MCO 9i S EVO","type": "cone", "css_min_mm": 8,  "css_max_mm": 32, "cap_min_tph": 90,  "cap_max_tph": 200, "feed_max_mm": 150, "decks": None, "extra_specs": {"rpm": 315}, "notes": "Diesel-eléctrico Tier 4"},
        {"brand": "Kleemann",      "model": "MCO 11i EVO", "type": "cone", "css_min_mm": 8,  "css_max_mm": 44, "cap_min_tph": 130, "cap_max_tph": 300, "feed_max_mm": 185, "decks": None, "extra_specs": {"rpm": 298}, "notes": "Diesel-eléctrico"},
        {"brand": "Kleemann",      "model": "MCO 13i EVO", "type": "cone", "css_min_mm": 10, "css_max_mm": 48, "cap_min_tph": 180, "cap_max_tph": 400, "feed_max_mm": 225, "decks": None, "extra_specs": {"rpm": 285}, "notes": ""},
        {"brand": "Metso Outotec", "model": "LT200HPS",    "type": "cone", "css_min_mm": 8,  "css_max_mm": 44, "cap_min_tph": 140, "cap_max_tph": 300, "feed_max_mm": 215, "decks": None, "extra_specs": {"rpm": 280}, "notes": "Orugas, cono HP"},
        {"brand": "Metso Outotec", "model": "LT300HPS",    "type": "cone", "css_min_mm": 10, "css_max_mm": 50, "cap_min_tph": 200, "cap_max_tph": 450, "feed_max_mm": 270, "decks": None, "extra_specs": {"rpm": 270}, "notes": "Orugas, gran capacidad"},
        {"brand": "Astec",         "model": "GT440",       "type": "cone", "css_min_mm": 8,  "css_max_mm": 44, "cap_min_tph": 130, "cap_max_tph": 280, "feed_max_mm": 190, "decks": None, "extra_specs": {"rpm": 290}, "notes": "Orugas"},
        {"brand": "Astec",         "model": "GT550",       "type": "cone", "css_min_mm": 10, "css_max_mm": 50, "cap_min_tph": 180, "cap_max_tph": 380, "feed_max_mm": 230, "decks": None, "extra_specs": {"rpm": 278}, "notes": "Orugas, alta capacidad"},
    ],
    "hsi": [
        {"brand": "Terex Finlay",  "model": "I-110RS",       "type": "hsi", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 130, "cap_max_tph": 250, "feed_max_mm": 750,  "decks": None, "extra_specs": {}, "notes": "Primario/secundario, orugas"},
        {"brand": "Terex Finlay",  "model": "I-120RS",       "type": "hsi", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 160, "cap_max_tph": 300, "feed_max_mm": 850,  "decks": None, "extra_specs": {}, "notes": "Con seleccionadora integrada"},
        {"brand": "Terex Finlay",  "model": "I-140RS",       "type": "hsi", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 250, "cap_max_tph": 400, "feed_max_mm": 900,  "decks": None, "extra_specs": {}, "notes": "Alta capacidad, orugas"},
        {"brand": "Terex Finlay",  "model": "I-1312RS",      "type": "hsi", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 300, "cap_max_tph": 500, "feed_max_mm": 1100, "decks": None, "extra_specs": {}, "notes": "Primario, roca blanda-media"},
        {"brand": "Powerscreen",   "model": "Trakpactor 260","type": "hsi", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 150, "cap_max_tph": 280, "feed_max_mm": 800,  "decks": None, "extra_specs": {}, "notes": "Orugas"},
        {"brand": "Powerscreen",   "model": "Trakpactor 320","type": "hsi", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 200, "cap_max_tph": 350, "feed_max_mm": 900,  "decks": None, "extra_specs": {}, "notes": "Orugas"},
        {"brand": "Powerscreen",   "model": "Trakpactor 550SR","type":"hsi","css_min_mm": None, "css_max_mm": None, "cap_min_tph": 300, "cap_max_tph": 500, "feed_max_mm": 1100, "decks": None, "extra_specs": {}, "notes": "Con seleccionadora integrada"},
        {"brand": "Kleemann",      "model": "MR 110i EVO2",  "type": "hsi", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 200, "cap_max_tph": 380, "feed_max_mm": 1100, "decks": None, "extra_specs": {}, "notes": "Diesel-eléctrico"},
        {"brand": "Kleemann",      "model": "MR 130i EVO2",  "type": "hsi", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 300, "cap_max_tph": 500, "feed_max_mm": 1300, "decks": None, "extra_specs": {}, "notes": "Diesel-eléctrico"},
        {"brand": "Metso Outotec", "model": "LT1213S",       "type": "hsi", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 200, "cap_max_tph": 400, "feed_max_mm": 1000, "decks": None, "extra_specs": {}, "notes": "Con seleccionadora integrada"},
        {"brand": "Metso Outotec", "model": "LT1415",        "type": "hsi", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 250, "cap_max_tph": 450, "feed_max_mm": 1100, "decks": None, "extra_specs": {}, "notes": ""},
        {"brand": "Sandvik",       "model": "QI341",          "type": "hsi", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 160, "cap_max_tph": 300, "feed_max_mm": 850,  "decks": None, "extra_specs": {}, "notes": "HSI primario/secundario"},
        {"brand": "Sandvik",       "model": "QI442",          "type": "hsi", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 250, "cap_max_tph": 450, "feed_max_mm": 1000, "decks": None, "extra_specs": {}, "notes": "HSI alta capacidad"},
        {"brand": "Astec",         "model": "GT2310",         "type": "hsi", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 150, "cap_max_tph": 300, "feed_max_mm": 900,  "decks": None, "extra_specs": {}, "notes": "Orugas"},
        {"brand": "Astec",         "model": "GT4250",         "type": "hsi", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 250, "cap_max_tph": 450, "feed_max_mm": 1100, "decks": None, "extra_specs": {}, "notes": "Orugas"},
    ],
    "screen": [
        {"brand": "Terex Finlay",  "model": "683",             "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 100, "cap_max_tph": 250, "feed_max_mm": None, "decks": 2, "extra_specs": {}, "notes": "2 deck — versátil, orugas"},
        {"brand": "Terex Finlay",  "model": "684 2-deck",      "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 120, "cap_max_tph": 280, "feed_max_mm": None, "decks": 2, "extra_specs": {}, "notes": "2 deck — alta producción"},
        {"brand": "Terex Finlay",  "model": "684 3-deck",      "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 150, "cap_max_tph": 300, "feed_max_mm": None, "decks": 3, "extra_specs": {}, "notes": "3 deck — alta clasificación"},
        {"brand": "Terex Finlay",  "model": "694+",            "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 150, "cap_max_tph": 350, "feed_max_mm": None, "decks": 3, "extra_specs": {}, "notes": "3 deck — orugas, 3 fracciones"},
        {"brand": "Terex Finlay",  "model": "696 3-deck",      "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 180, "cap_max_tph": 400, "feed_max_mm": None, "decks": 3, "extra_specs": {}, "notes": "3 deck — gran capacidad"},
        {"brand": "Powerscreen",   "model": "Warrior 1800",    "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 100, "cap_max_tph": 280, "feed_max_mm": None, "decks": 2, "extra_specs": {}, "notes": "2 deck"},
        {"brand": "Powerscreen",   "model": "Chieftain 1700",  "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 120, "cap_max_tph": 300, "feed_max_mm": None, "decks": 2, "extra_specs": {}, "notes": "2 deck — fácil cambio de mallas"},
        {"brand": "Powerscreen",   "model": "Chieftain 2100X", "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 150, "cap_max_tph": 380, "feed_max_mm": None, "decks": 3, "extra_specs": {}, "notes": "3 deck — alta capacidad"},
        {"brand": "Kleemann",      "model": "MS 703i",         "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 100, "cap_max_tph": 250, "feed_max_mm": None, "decks": 2, "extra_specs": {}, "notes": "2 deck — eléctrico, compacto"},
        {"brand": "Kleemann",      "model": "MS 953i EVO",     "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 150, "cap_max_tph": 350, "feed_max_mm": None, "decks": 3, "extra_specs": {}, "notes": "3 deck — diesel-eléctrico"},
        {"brand": "Sandvik",       "model": "QA330",           "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 120, "cap_max_tph": 280, "feed_max_mm": None, "decks": 2, "extra_specs": {}, "notes": "2 deck"},
        {"brand": "Sandvik",       "model": "QA335",           "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 150, "cap_max_tph": 300, "feed_max_mm": None, "decks": 3, "extra_specs": {}, "notes": "3 deck — plantas áridos"},
        {"brand": "Metso Outotec", "model": "ST2.4",           "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 100, "cap_max_tph": 250, "feed_max_mm": None, "decks": 2, "extra_specs": {}, "notes": "2 deck"},
        {"brand": "Metso Outotec", "model": "ST3.5",           "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 150, "cap_max_tph": 350, "feed_max_mm": None, "decks": 3, "extra_specs": {}, "notes": "3 deck"},
        {"brand": "Astec",         "model": "M6x20-3D",        "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 150, "cap_max_tph": 300, "feed_max_mm": None, "decks": 3, "extra_specs": {}, "notes": "3 deck"},
    ],
    "screen_1d": [
        {"brand": "Terex Finlay",  "model": "Rinser 873", "type": "screen_1d", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 80, "cap_max_tph": 200, "feed_max_mm": None, "decks": 1, "extra_specs": {}, "notes": "1 deck lavado/descascarado"},
        {"brand": "Powerscreen",   "model": "Warrior 600","type": "screen_1d", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 60, "cap_max_tph": 150, "feed_max_mm": None, "decks": 1, "extra_specs": {}, "notes": "1 deck, compacta"},
        {"brand": "Kleemann",      "model": "MS 402i",    "type": "screen_1d", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 70, "cap_max_tph": 180, "feed_max_mm": None, "decks": 1, "extra_specs": {}, "notes": "1 deck eléctrico"},
        {"brand": "Metso Outotec", "model": "ST1.5",      "type": "screen_1d", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 80, "cap_max_tph": 180, "feed_max_mm": None, "decks": 1, "extra_specs": {}, "notes": "1 deck"},
        {"brand": "Sandvik",       "model": "QA141",      "type": "screen_1d", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 80, "cap_max_tph": 200, "feed_max_mm": None, "decks": 1, "extra_specs": {}, "notes": "1 deck"},
    ],
    "screen_hf": [
        {"brand": "Terex Finlay",  "model": "883 HF",        "type": "screen_hf", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 80,  "cap_max_tph": 200, "feed_max_mm": None, "decks": 2, "extra_specs": {}, "notes": "Alta frecuencia 2 deck, finos"},
        {"brand": "Terex Finlay",  "model": "884 HF",        "type": "screen_hf", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 100, "cap_max_tph": 240, "feed_max_mm": None, "decks": 2, "extra_specs": {}, "notes": "Alta frecuencia 2 deck"},
        {"brand": "Powerscreen",   "model": "Warrior 2100",  "type": "screen_hf", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 100, "cap_max_tph": 250, "feed_max_mm": None, "decks": 2, "extra_specs": {}, "notes": "Alta frecuencia, fino seco"},
        {"brand": "Kleemann",      "model": "MOBISCREEN HF", "type": "screen_hf", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 80,  "cap_max_tph": 200, "feed_max_mm": None, "decks": 2, "extra_specs": {}, "notes": "Alta frecuencia"},
        {"brand": "Metso Outotec", "model": "SF Series HF",  "type": "screen_hf", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 90,  "cap_max_tph": 220, "feed_max_mm": None, "decks": 2, "extra_specs": {}, "notes": "Alta frecuencia"},
    ],
}

_ALL_TYPES = list(_FALLBACK.keys())


def _to_frontend(item: Dict[str, Any]) -> Dict[str, Any]:
    """Convierte un registro de Supabase al formato que espera el frontend (igual a EQ)."""
    specs = item.get("extra_specs") or {}
    result = {
        "brand":   item["brand"],
        "model":   item["model"],
        "capR":    [item["cap_min_tph"], item["cap_max_tph"]],
        "notes":   item.get("notes", ""),
    }
    if item.get("css_min_mm") is not None:
        result["cssR"] = [item["css_min_mm"], item["css_max_mm"]]
    if item.get("feed_max_mm") is not None:
        result["feedMm"] = item["feed_max_mm"]
    if item.get("decks") is not None:
        result["decks"] = item["decks"]
    if specs.get("palanca"):
        result["palanca"] = specs["palanca"]
    if specs.get("rpm"):
        result["rpm"] = specs["rpm"]
    return result


@router.get("")
async def get_equipment(
    type: Optional[str] = Query(None, description="Tipo: jaw, cone, hsi, screen, screen_1d, screen_hf"),
):
    """
    Devuelve el catálogo de equipos desde Supabase.
    Si Supabase no está disponible o la tabla está vacía, usa el fallback hardcodeado.
    """
    types_requested = [type] if type else _ALL_TYPES

    try:
        from app.core.supabase import get_supabase
        sb = get_supabase()
        q = sb.table("equipment").select("*").eq("is_active", True)
        if type:
            q = q.eq("type", type)
        result = q.order("brand").order("model").execute()

        if result.data:
            by_type: Dict[str, List[Dict]] = {}
            for row in result.data:
                t = row["type"]
                if t not in by_type:
                    by_type[t] = []
                by_type[t].append(_to_frontend(row))

            if type:
                return {"type": type, "equipment": by_type.get(type, []), "source": "supabase"}
            return {"equipment": by_type, "source": "supabase"}

    except Exception:
        pass  # Supabase no disponible → usar fallback

    # Fallback: datos hardcodeados (misma fuente que EQ en App.jsx)
    if type:
        items = _FALLBACK.get(type, [])
        return {"type": type, "equipment": [_to_frontend(i) for i in items], "source": "fallback"}
    return {
        "equipment": {t: [_to_frontend(i) for i in _FALLBACK[t]] for t in _ALL_TYPES},
        "source": "fallback",
    }


@router.get("/rocks")
async def get_rocks():
    from app.services.simulation_engine import ROCK_DB
    return [{"key": k, **v} for k, v in ROCK_DB.items()]


@router.get("/brands")
async def get_brands():
    return [
        {"name": "Finlay",      "color": "#10b981", "country": "Irlanda",   "distributor_cl": "Finning Chile"},
        {"name": "Powerscreen", "color": "#f59e0b", "country": "Irlanda",   "distributor_cl": "Powerscreen Chile"},
        {"name": "Kleemann",    "color": "#06b6d4", "country": "Alemania",  "distributor_cl": "Wirtgen Chile"},
        {"name": "Sandvik",     "color": "#3b82f6", "country": "Suecia",    "distributor_cl": "Sandvik Chile"},
        {"name": "Metso",       "color": "#ef4444", "country": "Finlandia", "distributor_cl": "Metso Chile"},
        {"name": "Astec",       "color": "#8b5cf6", "country": "EE.UU.",    "distributor_cl": "Astec Chile"},
    ]


@router.get("/cost-references")
async def get_cost_references():
    from app.services.simulation_engine import COST_DB
    return COST_DB["wear_usd_t"]
