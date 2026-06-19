"""
KrushRock — Backend Principal (FastAPI)
Fase 5: API REST completa con autenticación, proyectos, simulación y PDF
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from app.routers import auth, projects, simulations, equipment, reports, opex
from app.core.config import settings

app = FastAPI(
    title="KrushRock API",
    description="API REST para simulación inteligente de chancado y selección",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── MIDDLEWARE: latencia ──────────────────────────────────────────────────────
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{(time.time()-start)*1000:.1f}ms"
    return response

# ── ROUTERS ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,        prefix="/api/v1/auth",        tags=["Auth"])
app.include_router(projects.router,    prefix="/api/v1/projects",    tags=["Proyectos"])
app.include_router(simulations.router, prefix="/api/v1/simulations", tags=["Simulaciones"])
app.include_router(equipment.router,   prefix="/api/v1/equipment",   tags=["Equipos"])
app.include_router(reports.router,     prefix="/api/v1/reports",     tags=["Reportes"])
app.include_router(opex.router,        prefix="/api/v1/opex",        tags=["OPEX"])

# ── HEALTH ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Sistema"])
async def health():
    return {
        "status": "ok",
        "version": "2.0.1",
        "app": "KrushRock",
        "key_loaded": bool(settings.ANTHROPIC_API_KEY),
    }

@app.get("/", tags=["Sistema"])
async def root():
    return {"message": "KrushRock API v2.0", "docs": "/docs"}
