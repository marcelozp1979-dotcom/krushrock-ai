"""
KrushRock — Router de Autenticación
JWT + Supabase Auth
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, date
from typing import Optional
import jwt
import bcrypt

from app.core.config import settings
from app.core.supabase import get_supabase

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ── SCHEMAS ───────────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company: Optional[str] = None
    plan: str = "free"  # free | pro | enterprise


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    company: Optional[str]
    plan: str
    sim_count_month: int
    created_at: str


# ── HELPERS JWT ───────────────────────────────────────────────────────────────
def create_token(data: dict, expires_delta: timedelta) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + expires_delta
    payload["iat"] = datetime.utcnow()
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ── DEPENDENCY: usuario actual ────────────────────────────────────────────────
def _check_estado_vencimiento(user: dict):
    """Lanza 403 si el usuario está suspendido o con licencia vencida."""
    estado = user.get("estado", "activo")
    if estado == "suspendido":
        raise HTTPException(status_code=403, detail="Cuenta suspendida. Contacta al administrador.")

    vence_el = user.get("vence_el")
    if vence_el:
        try:
            vence_date = date.fromisoformat(str(vence_el)[:10])
            if vence_date < date.today():
                raise HTTPException(
                    status_code=403,
                    detail=f"Licencia vencida el {vence_date.isoformat()}. Contacta al administrador para renovar.",
                )
        except (ValueError, TypeError):
            pass  # fecha malformada: no bloquear


async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token sin usuario")

    sb = get_supabase()
    result = sb.table("users").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    _check_estado_vencimiento(result.data)
    return result.data


async def require_plan(min_plan: str, user=Depends(get_current_user)):
    plans = {"free": 0, "pro": 1, "enterprise": 2}
    if plans.get(user["plan"], 0) < plans.get(min_plan, 0):
        raise HTTPException(
            status_code=403,
            detail=f"Plan '{min_plan}' requerido. Tu plan actual: {user['plan']}"
        )
    return user


# ── ENDPOINTS ─────────────────────────────────────────────────────────────────
@router.post("/register", status_code=403)
async def register(data: UserRegister):
    """Registro público deshabilitado (T-36). Los clientes se crean mediante el endpoint de administración."""
    raise HTTPException(
        status_code=403,
        detail="El registro público está deshabilitado. Contacta al administrador para obtener acceso.",
    )


@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    sb = get_supabase()
    result = sb.table("users").select("*").eq("email", form.username).single().execute()
    user = result.data
    if not user or not verify_password(form.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    _check_estado_vencimiento(user)

    access  = create_token({"sub": user["id"], "email": user["email"], "plan": user["plan"]},
                            timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh = create_token({"sub": user["id"], "type": "refresh"},
                            timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
    return {"access_token": access, "refresh_token": refresh,
            "user": {k: user[k] for k in ("id","email","full_name","company","plan")}}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: dict):
    payload = decode_token(body.get("refresh_token", ""))
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token de refresh inválido")

    sb = get_supabase()
    result = sb.table("users").select("*").eq("id", payload["sub"]).single().execute()
    user = result.data
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    access  = create_token({"sub": user["id"], "email": user["email"], "plan": user["plan"]},
                            timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    new_ref = create_token({"sub": user["id"], "type": "refresh"},
                            timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
    return {"access_token": access, "refresh_token": new_ref,
            "user": {k: user[k] for k in ("id","email","full_name","company","plan")}}


@router.get("/me", response_model=UserProfile)
async def me(user=Depends(get_current_user)):
    return user


@router.put("/me")
async def update_profile(data: dict, user=Depends(get_current_user)):
    allowed = {"full_name", "company"}
    update = {k: v for k, v in data.items() if k in allowed}
    sb = get_supabase()
    result = sb.table("users").update(update).eq("id", user["id"]).execute()
    return result.data[0]
