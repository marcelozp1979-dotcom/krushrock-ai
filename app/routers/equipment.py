"""KrushRock — Router de Equipos (catálogo desde Supabase con fallback hardcodeado)"""
from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any

router = APIRouter()

# ── CATÁLOGO DE FALLBACK ──────────────────────────────────────────────────────
# Usado cuando Supabase no está disponible o la tabla está vacía.
# Esta es la misma fuente de verdad que EQ en App.jsx.
# ELIMINAR cuando el seed de Supabase sea estable en producción.
#
# Campos opcionales (None = sin dato; el usuario los carga desde fichas de fabricante):
#   Chancadores (jaw / cone / hsi):
#     feed_max_recomendado_mm   — límite operativo recomendado de alimentación
#     css_min_recomendado_mm    — CSS mínimo recomendado (operativo, no mecánico)
#     css_max_recomendado_mm    — CSS máximo recomendado
#     producto_min_p80_mm       — P80 mínimo que el equipo puede producir confiablemente
#     camara                    — tipo de cámara del cono (str, ej. "EC", "M", "C", "F", "EF")
#   Seleccionadoras (screen):
#     area_util_m2              — área útil de malla (m²)
#     malla_min_mm              — apertura mínima de malla instalable (mm)
#     malla_max_mm              — apertura máxima de malla instalable (mm)
#     carga_max_tph_m2          — capacidad máxima por m² de área (tph/m²)
#   Scalpers (dentro de tipo jaw con scalper=True o tipo propio):
#     separacion_grizzly_min_mm — separación mínima de grizzly (mm)
#     separacion_grizzly_max_mm — separación máxima de grizzly (mm)
#
# PROHIBIDO inventar valores — dejar None hasta tener ficha de fabricante verificada.
_FALLBACK: Dict[str, List[Dict[str, Any]]] = {
    "jaw": [
        {
            "brand": "Terex Finlay", "model": "J-960", "type": "jaw",
            "css_min_mm": 40, "css_max_mm": 140,
            "cap_min_tph": 60, "cap_max_tph": 175,
            "feed_max_mm": 580, "decks": None,
            "extra_specs": {"palanca": "doble", "rpm": 320},
            "notes": "Compacta, orugas",
            "curves": {
                "css": [40, 50, 63, 75, 100, 125],
                "tph": [65.0, 80.0, 97.5, 102.5, 130.0, 160.0],
            },
            "capacity_source": "Manual Terex J-960 Rev 4.9 p.3-14, punto medio de rangos",
        },
        {
            "brand": "Terex Finlay", "model": "J-1160", "type": "jaw",
            "css_min_mm": 40, "css_max_mm": 145,
            "cap_min_tph": 150, "cap_max_tph": 280,
            "feed_max_mm": 600, "decks": None,
            "extra_specs": {"palanca": "simple", "rpm": 260},
            "notes": "Orugas, hidrostático, boca 1000x600; rpm 220-300",
            "specs_source": "Manual Terex J-1160 Rev 4.2, datos técnicos",
            # Tablas de granulometría idénticas a J-1175 (misma familia de cámara JW3042)
            "product_curve": {
                0.08: 3.2, 0.10: 3.3, 0.125: 3.6, 0.15: 4.3, 0.175: 4.9,
                0.20: 5.6, 0.225: 6.2, 0.25: 6.9, 0.30: 8.2, 0.35: 9.7,
                0.40: 11.4, 0.45: 13.4, 0.50: 15.8, 0.55: 18.6, 0.60: 21.9,
                0.65: 25.7, 0.70: 29.9, 0.75: 34.7, 0.80: 39.6, 0.85: 45.0,
                0.90: 51.0, 0.95: 57.5, 1.00: 64.0, 1.10: 75.2, 1.20: 83.7,
                1.40: 93.5, 1.60: 98.5, 1.80: 100.0,
            },
            "product_curve_source": "Manual Terex J-1160 Rev 4.8 p.3-15 roca dura (tablas idénticas a J-1175)",
            "product_curve_soft_rock": {
                0.08: 3.4, 0.10: 3.5, 0.125: 3.9, 0.15: 4.5, 0.175: 5.2,
                0.20: 5.9, 0.225: 6.5, 0.25: 7.3, 0.30: 8.9, 0.35: 10.6,
                0.40: 12.5, 0.45: 14.9, 0.50: 17.5, 0.55: 20.6, 0.60: 24.1,
                0.65: 28.1, 0.70: 32.5, 0.75: 37.6, 0.80: 43.2, 0.85: 49.5,
                0.90: 56.1, 0.95: 62.7, 1.00: 69.0, 1.10: 79.3, 1.20: 86.9,
                1.40: 95.3, 1.60: 99.1, 1.80: 100.0,
            },
        },
        {
            "brand": "Terex Finlay", "model": "J-1170", "type": "jaw",
            "css_min_mm": 50, "css_max_mm": 150,
            "cap_min_tph": 90, "cap_max_tph": 290,
            "feed_max_mm": 700, "decks": None,
            "extra_specs": {"palanca": "simple"},
            "notes": "Orugas, hidrostático, boca 1100x700; CSS mín 75 en cantera",
            "curves": {
                "css": [50, 64, 75, 90, 100, 125],
                "tph": [115.0, 130.0, 160.0, 180.0, 200.0, 235.0],
            },
            "capacity_source": "Manual Terex J-1170 Rev 6.5 p.3-19, punto medio min-max",
            "product_curve": {
                0.08: 4.8, 0.10: 5.6, 0.125: 7.5, 0.15: 9.5, 0.175: 11.4,
                0.20: 13.1, 0.225: 15.1, 0.25: 17.1, 0.30: 21.3, 0.35: 25.6,
                0.40: 30.0, 0.45: 34.4, 0.50: 38.9, 0.55: 43.3, 0.60: 47.9,
                0.65: 52.5, 0.70: 57.1, 0.75: 61.8, 0.80: 66.3, 0.85: 70.3,
                0.90: 74.1, 0.95: 77.9, 1.00: 81.7, 1.10: 86.8, 1.20: 91.1,
                1.40: 97.1, 1.60: 99.7, 1.80: 100.0,
            },
            "product_curve_source": "Manual Terex J-1170 Rev 6.5 p.3-19, todos los tipos de roca",
        },
        {
            "brand": "Terex Finlay", "model": "J-1175", "type": "jaw",
            "css_min_mm": 50, "css_max_mm": 175,
            "cap_min_tph": 200, "cap_max_tph": 452,
            "feed_max_mm": 790, "decks": None,
            "extra_specs": {"palanca": "doble", "rpm": 290},
            "notes": "Orugas, C13 ACERT",
            # Curva de capacidad — Manual Terex Finlay J-1175 Rev 8.8 p.3-10
            "curves": {
                "css": [50, 60, 75, 90, 100, 115, 125, 140, 150, 165, 175],
                "tph": [122.5, 147.5, 176.0, 207.5, 238.5, 276.5, 301.5, 345.5, 364.5, 402.0, 427.0],
            },
            "capacity_source": "Manual Terex Finlay J-1175 Rev 8.8 p.3-10, caliza 1600 kg/m3, punto medio de rangos",
            # Curva de producto normalizada (d/CSS → % pasante) — promedio de 10 columnas CSS, roca dura
            "product_curve": {
                0.08: 3.2, 0.10: 3.3, 0.125: 3.6, 0.15: 4.3, 0.175: 4.9,
                0.20: 5.6, 0.225: 6.2, 0.25: 6.9, 0.30: 8.2, 0.35: 9.7,
                0.40: 11.4, 0.45: 13.4, 0.50: 15.8, 0.55: 18.6, 0.60: 21.9,
                0.65: 25.7, 0.70: 29.9, 0.75: 34.7, 0.80: 39.6, 0.85: 45.0,
                0.90: 51.0, 0.95: 57.5, 1.00: 64.0, 1.10: 75.2, 1.20: 83.7,
                1.40: 93.5, 1.60: 98.5, 1.80: 100.0,
            },
            "product_curve_source": "Manual Terex Finlay J-1175 Rev 8.8 p.3-11, JW3042 roca dura",
            # Curva de producto roca blanda — sin uso activo, referencia futura
            "product_curve_soft_rock": {
                0.08: 3.4, 0.10: 3.5, 0.125: 3.9, 0.15: 4.5, 0.175: 5.2,
                0.20: 5.9, 0.225: 6.5, 0.25: 7.3, 0.30: 8.9, 0.35: 10.6,
                0.40: 12.5, 0.45: 14.9, 0.50: 17.5, 0.55: 20.6, 0.60: 24.1,
                0.65: 28.1, 0.70: 32.5, 0.75: 37.6, 0.80: 43.2, 0.85: 49.5,
                0.90: 56.1, 0.95: 62.7, 1.00: 69.0, 1.10: 79.3, 1.20: 86.9,
                1.40: 95.3, 1.60: 99.1, 1.80: 100.0,
            },
        },
        {
            "brand": "Terex Finlay", "model": "J-1280", "type": "jaw",
            "css_min_mm": 64, "css_max_mm": 200,
            "cap_min_tph": 115, "cap_max_tph": 460,
            "feed_max_mm": 1070, "decks": None,
            "extra_specs": {"palanca": "doble", "rpm": 270},
            "notes": "Orugas, alta capacidad",
            "curves": {
                "css": [64, 75, 90, 100, 125, 150, 175, 200],
                "tph": [142.5, 175.0, 200.0, 220.0, 245.0, 290.0, 330.0, 377.5],
            },
            "capacity_source": "Manual Terex J-1280 Hybrid Rev 2.2 p.3-16, punto medio min-max",
            "product_curve": {
                0.08: 4.3, 0.10: 5.2, 0.125: 6.9, 0.15: 8.9, 0.175: 10.6,
                0.20: 12.3, 0.225: 14.2, 0.25: 16.2, 0.30: 20.5, 0.35: 25.0,
                0.40: 29.4, 0.45: 34.0, 0.50: 38.5, 0.55: 43.1, 0.60: 47.9,
                0.65: 52.7, 0.70: 57.4, 0.75: 62.2, 0.80: 66.8, 0.85: 71.0,
                0.90: 74.9, 0.95: 78.6, 1.00: 82.2, 1.10: 87.3, 1.20: 91.6,
                1.40: 97.3, 1.60: 99.7, 1.80: 100.0,
            },
            "product_curve_source": "Manual Terex J-1280 Hybrid Rev 2.2 p.3-16, gradación típica",
        },
        {
            "brand": "Terex Finlay", "model": "J-1480", "type": "jaw",
            "css_min_mm": 100, "css_max_mm": 200,
            "cap_min_tph": 400, "cap_max_tph": 600,
            "feed_max_mm": 1400, "decks": None,
            "extra_specs": {"palanca": "simple", "rpm": 250},
            "notes": "Orugas, gran formato",
            "product_curve": {
                0.08: 5.0, 0.10: 6.1, 0.125: 7.3, 0.15: 8.7, 0.175: 10.1,
                0.20: 11.4, 0.225: 12.8, 0.25: 14.1, 0.30: 16.5, 0.35: 19.5,
                0.40: 22.8, 0.45: 25.6, 0.50: 27.9, 0.55: 30.2, 0.60: 33.7,
                0.65: 37.8, 0.70: 42.7, 0.75: 47.6, 0.80: 52.5, 0.85: 57.0,
                0.90: 60.5, 0.95: 64.0, 1.00: 67.5, 1.10: 74.5, 1.20: 81.4,
                1.40: 90.4, 1.60: 95.0, 1.80: 97.1, 2.00: 99.2, 2.50: 99.6,
            },
            "product_curve_source": "Manual Terex J-1480 Rev 1.9 p.3-10, caliza, 3 CSS",
        },
        {
            "brand": "Powerscreen", "model": "Premiertrak R400", "type": "jaw",
            "css_min_mm": 50, "css_max_mm": 140,
            "cap_min_tph": 90, "cap_max_tph": 290,
            "feed_max_mm": 700, "decks": None,
            "extra_specs": {"palanca": "simple"},
            "notes": "Cámara Terex 1100x700 (idéntica a J-1170); CSS mín 75 en cantera; hasta 400 tph según marketing, tabla de cámara llega a 290",
            "specs_source": "Powerscreen Premiertrak 400X Technical Specification Rev 6, 01/10/2023",
            # Curvas copiadas de J-1170 por equivalencia de cámara aprobada
            "curves": {
                "css": [50, 64, 75, 90, 100, 125],
                "tph": [115.0, 130.0, 160.0, 180.0, 200.0, 235.0],
            },
            "capacity_source": "Cámara Terex 1100x700 — Manual Finlay J-1170 Rev 6.5 p.3-19 (cámara idéntica, equivalencia aprobada)",
            "product_curve": {
                0.08: 4.8, 0.10: 5.6, 0.125: 7.5, 0.15: 9.5, 0.175: 11.4,
                0.20: 13.1, 0.225: 15.1, 0.25: 17.1, 0.30: 21.3, 0.35: 25.6,
                0.40: 30.0, 0.45: 34.4, 0.50: 38.9, 0.55: 43.3, 0.60: 47.9,
                0.65: 52.5, 0.70: 57.1, 0.75: 61.8, 0.80: 66.3, 0.85: 70.3,
                0.90: 74.1, 0.95: 77.9, 1.00: 81.7, 1.10: 86.8, 1.20: 91.1,
                1.40: 97.1, 1.60: 99.7, 1.80: 100.0,
            },
            "product_curve_source": "Cámara Terex 1100x700 — Manual Finlay J-1170 Rev 6.5 p.3-19 (cámara idéntica, equivalencia aprobada)",
            "data_quality": "equivalencia_camara",
        },
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
        {"brand": "Kleemann",      "model": "MCO 9i S EVO","type": "cone", "css_min_mm": 8,  "css_max_mm": 32, "cap_min_tph": 90,  "cap_max_tph": 200, "feed_max_mm": 150, "decks": None, "extra_specs": {"rpm": 315}, "notes": "Diesel-eléctrico"},
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
        {"brand": "Powerscreen",   "model": "XH320SR",       "type": "hsi", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 200, "cap_max_tph": 320, "feed_max_mm": 820,  "decks": None, "extra_specs": {}, "notes": "Impactor horizontal con seleccionadora integrada de recirculación"},
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
        {"brand": "Terex Finlay",  "model": "683",             "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 100, "cap_max_tph": 250, "feed_max_mm": None, "decks": 2, "area_m2": 10.1, "extra_specs": {}, "notes": "2 deck — versátil, orugas"},
        {"brand": "Terex Finlay",  "model": "684 2-deck",      "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 120, "cap_max_tph": 280, "feed_max_mm": None, "decks": 2, "area_m2": 14.6, "extra_specs": {}, "notes": "2 deck — alta producción"},
        {"brand": "Terex Finlay",  "model": "684 3-deck",      "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 150, "cap_max_tph": 300, "feed_max_mm": None, "decks": 3, "area_m2": 21.9, "extra_specs": {}, "notes": "3 deck — alta clasificación"},
        {"brand": "Terex Finlay",  "model": "694+",            "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 150, "cap_max_tph": 350, "feed_max_mm": None, "decks": 3, "area_m2": 28.0, "extra_specs": {}, "notes": "3 deck — orugas, 3 fracciones"},
        {"brand": "Terex Finlay",  "model": "696 3-deck",      "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 180, "cap_max_tph": 400, "feed_max_mm": None, "decks": 3, "area_m2": 31.1, "extra_specs": {}, "notes": "3 deck — gran capacidad"},
        {"brand": "Powerscreen",   "model": "XH320SR Screen",  "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 80,  "cap_max_tph": 200, "feed_max_mm": None, "decks": 1, "area_m2": 4.0,  "extra_specs": {"apertura_tipica_mm": 19}, "notes": "Criba vibratoria integrada de recirculación del XH320SR SR; 1 deck"},
        {"brand": "Powerscreen",   "model": "Warrior 1800",    "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 100, "cap_max_tph": 480, "feed_max_mm": None, "decks": 2, "area_m2": 14.6, "extra_specs": {}, "notes": "2 deck"},
        {"brand": "Powerscreen",   "model": "Chieftain 1700",  "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 120, "cap_max_tph": 400, "feed_max_mm": None, "decks": 2, "area_m2": 14.4, "extra_specs": {}, "notes": "2 deck — fácil cambio de mallas"},
        {"brand": "Powerscreen",   "model": "Chieftain 2100X", "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 150, "cap_max_tph": 480, "feed_max_mm": None, "decks": 3, "area_m2": 28.4, "extra_specs": {}, "notes": "3 deck — alta capacidad"},
        {"brand": "Kleemann",      "model": "MS 703i",         "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 100, "cap_max_tph": 309, "feed_max_mm": None, "decks": 3, "area_m2": 21.0, "extra_specs": {}, "notes": "3 deck — eléctrico, compacto"},
        {"brand": "Kleemann",      "model": "MS 953i EVO",     "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 150, "cap_max_tph": 441, "feed_max_mm": None, "decks": 3, "area_m2": 28.5, "extra_specs": {}, "notes": "3 deck — diesel-eléctrico"},
        {"brand": "Sandvik",       "model": "QA331",           "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 120, "cap_max_tph": 280, "feed_max_mm": None, "decks": 2, "area_m2": 13.0, "extra_specs": {}, "notes": "2 deck — sucesor de QA330 (descontinuado)"},
        {"brand": "Sandvik",       "model": "QA335",           "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 150, "cap_max_tph": 320, "feed_max_mm": None, "decks": 2, "area_m2": 24.0, "extra_specs": {}, "notes": "plantas áridos — Doublescreen, 2 cajas de 2 decks en serie"},
        {"brand": "Metso Outotec", "model": "ST2.4",           "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 100, "cap_max_tph": 250, "feed_max_mm": None, "decks": 2, "area_m2": 10.8, "extra_specs": {}, "notes": "2 deck"},
        {"brand": "Metso Outotec", "model": "ST3.5",           "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 150, "cap_max_tph": 350, "feed_max_mm": None, "decks": 2, "area_m2": 11.0, "extra_specs": {}, "notes": "capacidad por verificar, sin fuente oficial de marketing confirmada"},
        {"brand": "Astec",         "model": "M6x20-3D",        "type": "screen", "css_min_mm": None, "css_max_mm": None, "cap_min_tph": 150, "cap_max_tph": 300, "feed_max_mm": None, "decks": 3, "area_m2": None, "extra_specs": {}, "notes": "3 deck"},
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
    if item.get("area_m2") is not None:
        result["area_m2"] = item["area_m2"]
    if specs.get("palanca"):
        result["palanca"] = specs["palanca"]
    if specs.get("rpm"):
        result["rpm"] = specs["rpm"]
    # Campos opcionales de validación física (None si no hay datos del fabricante)
    for opt in (
        "feed_max_recomendado_mm", "css_min_recomendado_mm", "css_max_recomendado_mm",
        "producto_min_p80_mm", "camara",
        "area_util_m2", "malla_min_mm", "malla_max_mm", "carga_max_tph_m2",
        "separacion_grizzly_min_mm", "separacion_grizzly_max_mm",
    ):
        if item.get(opt) is not None:
            result[opt] = item[opt]
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
