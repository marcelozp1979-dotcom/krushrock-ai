"""KrushRock — Router OPEX standalone"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict, Optional

from app.routers.auth import get_current_user
from app.services.simulation_engine import _calc_opex

router = APIRouter()


class OPEXRequest(BaseModel):
    nodes: List[Dict]
    tph: float
    rock_type: str
    energy_kwh_t: float
    hours_per_year: int = 6000


@router.post("/calculate")
async def calculate_opex(req: OPEXRequest, user=Depends(get_current_user)):
    """Calcula OPEX de forma independiente sin simular circuito completo."""
    result = _calc_opex(
        nodes=req.nodes,
        node_results={},
        tph=req.tph,
        rock_type=req.rock_type,
        energy_kwh_t=req.energy_kwh_t,
        hours_year=req.hours_per_year,
    )
    return result


@router.get("/reference-costs")
async def get_reference_costs():
    """Retorna costos referenciales Chile para transparencia del modelo."""
    from app.services.simulation_engine import COST_DB
    return {
        "source": "Estimaciones de mercado áridos/minería Chile 2024-2025",
        "currency": "USD",
        "fuel_usd_l": COST_DB["fuel_usd_l"],
        "electric_usd_kwh": COST_DB["electric_usd_kwh"],
        "operator_usd_h": COST_DB["operator_usd_h"],
        "mechanic_usd_h": COST_DB["mechanic_usd_h"],
        "price_ton_usd": COST_DB["price_ton_usd"],
        "note": "Valores referenciales. Ajustar según condiciones reales de cada proyecto.",
    }
