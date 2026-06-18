"""
KrushRock — Configuración central
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "KrushRock"
    API_VERSION: str = "2.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "cambia-esto-en-produccion-usa-openssl-rand-hex-32"

    # JWT
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 horas
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""           # anon key (público)
    SUPABASE_SERVICE_KEY: str = ""   # service_role key (privado, solo backend)

    # Anthropic
    ANTHROPIC_API_KEY: str = ""

    # CORS — en producción pon tu dominio exacto
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://krushrock.app",      # tu dominio
    ]

    # Storage PDF
    PDF_OUTPUT_DIR: str = "/tmp/krushrock_reports"

    # Planes de licencia
    PLAN_FREE_SIM_LIMIT: int = 5     # simulaciones/mes plan free
    PLAN_PRO_SIM_LIMIT: int = 500
    PLAN_ENTERPRISE_SIM_LIMIT: int = 99999

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Crear directorio PDF si no existe
os.makedirs(settings.PDF_OUTPUT_DIR, exist_ok=True)
