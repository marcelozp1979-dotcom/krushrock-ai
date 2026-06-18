"""KrushRock — Router de Equipos (catálogo)"""
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter()

# El catálogo completo vive en el frontend (EQUIPMENT_DB)
# Este endpoint sirve para futuras versiones con equipos personalizados por cliente

@router.get("/rocks")
async def get_rocks():
    from app.services.simulation_engine import ROCK_DB
    return [{"key": k, **v} for k, v in ROCK_DB.items()]


@router.get("/brands")
async def get_brands():
    return [
        {"name": "Finlay",      "color": "#10b981", "country": "Irlanda",    "distributor_cl": "Finning Chile"},
        {"name": "Powerscreen", "color": "#f59e0b", "country": "Irlanda",    "distributor_cl": "Powerscreen Chile"},
        {"name": "Kleemann",    "color": "#06b6d4", "country": "Alemania",   "distributor_cl": "Wirtgen Chile"},
        {"name": "Sandvik",     "color": "#3b82f6", "country": "Suecia",     "distributor_cl": "Sandvik Chile"},
        {"name": "Metso",       "color": "#ef4444", "country": "Finlandia",  "distributor_cl": "Metso Chile"},
        {"name": "Astec",       "color": "#8b5cf6", "country": "EE.UU.",     "distributor_cl": "Astec Chile"},
    ]


@router.get("/cost-references")
async def get_cost_references():
    """Valores de referencia de equipos para cálculo OPEX."""
    from app.services.simulation_engine import COST_DB
    return COST_DB["wear_usd_t"]
