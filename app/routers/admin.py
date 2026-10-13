"""
KrushRock — Router de administración de usuarios (T-36).

Permite a Marcelo crear, listar y suspender clientes sin entrar a Supabase.
Todos los endpoints requieren el header X-Admin-Token con el valor de ADMIN_TOKEN del .env.
"""
from datetime import datetime, date
from typing import Optional

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.supabase import get_supabase
from app.routers.auth import hash_password

router = APIRouter()

_MIGRATION_HINT = (
    "Faltan columnas en la tabla 'users'. Ejecuta esto en el SQL Editor de Supabase "
    "(Dashboard → SQL Editor → New query → pega y ejecuta):\n\n"
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'activo';\n"
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS vence_el date;\n"
)


def _check_admin(x_admin_token: str):
    if not settings.ADMIN_TOKEN:
        raise HTTPException(
            status_code=503,
            detail=(
                "Endpoint de administrador no configurado. "
                "Agrega ADMIN_TOKEN=<secreto> en el archivo .env del servidor y reinicia."
            ),
        )
    if x_admin_token != settings.ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Token de administrador incorrecto.")


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company: Optional[str] = None
    plan: str = "pro"
    vence_el: str  # YYYY-MM-DD — fecha hasta la que el cliente tiene acceso


class UpdateUserRequest(BaseModel):
    estado: Optional[str] = None      # "activo" | "suspendido"
    vence_el: Optional[str] = None    # YYYY-MM-DD o null para eliminar vencimiento
    plan: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/users", status_code=201)
async def create_user(
    data: CreateUserRequest,
    x_admin_token: str = Header(..., alias="x-admin-token"),
):
    """Crea un nuevo cliente. Requiere X-Admin-Token."""
    _check_admin(x_admin_token)

    # Validar formato de fecha
    try:
        date.fromisoformat(data.vence_el)
    except ValueError:
        raise HTTPException(400, f"Formato de fecha inválido: '{data.vence_el}'. Usa YYYY-MM-DD (ej. 2026-12-31).")

    sb = get_supabase()
    existing = sb.table("users").select("id").eq("email", data.email).execute()
    if existing.data:
        raise HTTPException(400, f"Ya existe un usuario con el correo {data.email}.")

    hashed = hash_password(data.password)
    user_data = {
        "email": data.email,
        "password_hash": hashed,
        "full_name": data.full_name,
        "company": data.company,
        "plan": data.plan,
        "sim_count_month": 0,
        "created_at": datetime.utcnow().isoformat(),
        "estado": "activo",
        "vence_el": data.vence_el,
    }
    try:
        result = sb.table("users").insert(user_data).execute()
    except Exception as exc:
        msg = str(exc)
        if "estado" in msg.lower() or "vence_el" in msg.lower() or "column" in msg.lower():
            raise HTTPException(500, _MIGRATION_HINT)
        raise HTTPException(500, f"Error al crear usuario: {msg}")

    user = result.data[0]
    return {
        "id":        user["id"],
        "email":     user["email"],
        "full_name": user["full_name"],
        "company":   user.get("company"),
        "plan":      user["plan"],
        "estado":    user.get("estado", "activo"),
        "vence_el":  user.get("vence_el"),
        "creado":    True,
    }


@router.get("/users")
async def list_users(
    x_admin_token: str = Header(..., alias="x-admin-token"),
):
    """Lista todos los usuarios (sin password_hash). Requiere X-Admin-Token."""
    _check_admin(x_admin_token)
    sb = get_supabase()
    result = sb.table("users").select(
        "id, email, full_name, company, plan, estado, vence_el, sim_count_month, created_at"
    ).order("created_at", desc=True).execute()
    return {"users": result.data or []}


@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    data: UpdateUserRequest,
    x_admin_token: str = Header(..., alias="x-admin-token"),
):
    """Actualiza estado, vencimiento o plan de un usuario. Requiere X-Admin-Token."""
    _check_admin(x_admin_token)

    update = {}
    if data.estado is not None:
        if data.estado not in ("activo", "suspendido"):
            raise HTTPException(400, "estado debe ser 'activo' o 'suspendido'.")
        update["estado"] = data.estado
    if data.vence_el is not None:
        try:
            date.fromisoformat(data.vence_el)
        except ValueError:
            raise HTTPException(400, f"Formato de fecha inválido: '{data.vence_el}'. Usa YYYY-MM-DD.")
        update["vence_el"] = data.vence_el
    if data.plan is not None:
        update["plan"] = data.plan

    if not update:
        raise HTTPException(400, "No se proporcionaron campos para actualizar.")

    sb = get_supabase()
    result = sb.table("users").update(update).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(404, f"Usuario {user_id} no encontrado.")
    return {"actualizado": True, "user": result.data[0]}
