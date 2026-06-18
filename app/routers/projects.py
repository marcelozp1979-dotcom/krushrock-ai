"""
KrushRock — Router de Proyectos
CRUD completo: crear, listar, obtener, actualizar, eliminar
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from app.core.supabase import get_supabase
from app.routers.auth import get_current_user

router = APIRouter()


# ── SCHEMAS ───────────────────────────────────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    client_name: Optional[str] = None
    location: Optional[str] = None
    rock_type: Optional[str] = None
    tags: Optional[List[str]] = []


class ProjectUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    client_name: Optional[str]
    location: Optional[str]
    tags: Optional[List[str]]
    status: Optional[str]  # draft | active | archived


# ── ENDPOINTS ─────────────────────────────────────────────────────────────────
@router.post("/", status_code=201)
async def create_project(data: ProjectCreate, user=Depends(get_current_user)):
    sb = get_supabase()
    project = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": data.name,
        "description": data.description,
        "client_name": data.client_name,
        "location": data.location,
        "rock_type": data.rock_type,
        "tags": data.tags or [],
        "status": "draft",
        "sim_count": 0,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    result = sb.table("projects").insert(project).execute()
    return result.data[0]


@router.get("/")
async def list_projects(
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    user=Depends(get_current_user)
):
    sb = get_supabase()
    q = sb.table("projects").select(
        "id, name, description, client_name, location, rock_type, "
        "status, sim_count, tags, created_at, updated_at"
    ).eq("user_id", user["id"])

    if status:
        q = q.eq("status", status)

    result = q.order("updated_at", desc=True).range(offset, offset + limit - 1).execute()
    return {"projects": result.data, "total": len(result.data), "offset": offset}


@router.get("/{project_id}")
async def get_project(project_id: str, user=Depends(get_current_user)):
    sb = get_supabase()
    result = sb.table("projects").select("*").eq("id", project_id).eq("user_id", user["id"]).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return result.data


@router.put("/{project_id}")
async def update_project(project_id: str, data: ProjectUpdate, user=Depends(get_current_user)):
    sb = get_supabase()
    # Verificar propiedad
    existing = sb.table("projects").select("id").eq("id", project_id).eq("user_id", user["id"]).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    update = {k: v for k, v in data.dict().items() if v is not None}
    update["updated_at"] = datetime.utcnow().isoformat()
    result = sb.table("projects").update(update).eq("id", project_id).execute()
    return result.data[0]


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: str, user=Depends(get_current_user)):
    sb = get_supabase()
    existing = sb.table("projects").select("id").eq("id", project_id).eq("user_id", user["id"]).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    sb.table("simulations").delete().eq("project_id", project_id).execute()
    sb.table("projects").delete().eq("id", project_id).execute()
    return


@router.get("/{project_id}/simulations")
async def get_project_simulations(
    project_id: str,
    limit: int = 10,
    user=Depends(get_current_user)
):
    sb = get_supabase()
    existing = sb.table("projects").select("id").eq("id", project_id).eq("user_id", user["id"]).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    result = sb.table("simulations").select(
        "id, name, eff_score, final_p80, circ_load, tph, circuit_type, created_at"
    ).eq("project_id", project_id).order("created_at", desc=True).limit(limit).execute()
    return result.data
