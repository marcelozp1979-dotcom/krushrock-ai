"""
KrushRock — Router de Reportes
Genera PDFs profesionales desde simulaciones guardadas
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import os, uuid

from app.core.config import settings
from app.core.supabase import get_supabase
from app.routers.auth import get_current_user

router = APIRouter()


class ReportRequest(BaseModel):
    simulation_id: str
    project_name: Optional[str] = "Simulación KrushRock"
    company: Optional[str] = ""
    include_ai_analysis: bool = True
    logo_url: Optional[str] = None   # white-label: URL del logo del cliente


@router.post("/generate")
async def generate_report(req: ReportRequest, user=Depends(get_current_user)):
    """Genera un PDF del reporte de simulación."""
    sb = get_supabase()

    # Obtener simulación
    result = sb.table("simulations").select("*").eq(
        "id", req.simulation_id).eq("user_id", user["id"]).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Simulación no encontrada")

    sim = result.data
    out_path = os.path.join(settings.PDF_OUTPUT_DIR, f"krushrock_{uuid.uuid4().hex[:8]}.pdf")

    # Importar generador PDF
    try:
        from scripts.generate_pdf import build_pdf
        build_pdf(
            data={
                "projectName":  req.project_name,
                "company":      req.company or user.get("company", ""),
                "rock":         sim["result_json"].get("rock", {}),
                "inputs": {
                    "tph":       sim["tph"],
                    "f80":       sim["f80"],
                    "p80Target": sim["p80_target"],
                    "humidity":  sim["humidity"],
                    "circuit":   sim["circuit_type"],
                },
                "results":      sim["result_json"],
                "nodes":        sim["nodes_json"],
                "aiAnalysis":   sim.get("ai_analysis", ""),
            },
            out_path=out_path
        )
    except ImportError:
        # Fallback: retornar JSON si no está disponible reportlab en este entorno
        return {"error": "PDF generator not available in this environment",
                "data": sim["result_json"]}

    # Registrar reporte generado
    sb.table("reports").insert({
        "id": str(uuid.uuid4()),
        "user_id":       user["id"],
        "simulation_id": req.simulation_id,
        "project_name":  req.project_name,
        "pdf_path":      out_path,
        "generated_at":  __import__("datetime").datetime.utcnow().isoformat(),
    }).execute()

    filename = f"KrushRock_{req.project_name.replace(' ', '_')}.pdf"
    return FileResponse(
        path=out_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/history")
async def report_history(limit: int = 10, user=Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("reports").select(
        "id, project_name, simulation_id, generated_at"
    ).eq("user_id", user["id"]).order("generated_at", desc=True).limit(limit).execute()
    return result.data
