"""
KrushRock — Router IA
Proxy seguro hacia Claude: la API key nunca sale del servidor.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import anthropic

from app.core.config import settings

router = APIRouter()

SYSTEM_PROMPT = (
    "Eres un asistente experto en plantas de chancado y zarandeo minero.\n"
    "Tu única tarea es extraer parámetros técnicos de un texto libre y devolver SOLO un objeto JSON válido, "
    "sin texto adicional, sin backticks, sin explicaciones.\n\n"
    "El JSON debe tener EXACTAMENTE esta estructura: {\n"
    '  "tipo_roca": string o null,\n'
    '  "work_index": number o null,\n'
    '  "f_max_mm": number o null,\n'
    '  "f80_mm": number o null,\n'
    '  "capacidad_tph": number o null,\n'
    '  "densidad_tm3": number o null,\n'
    '  "p_max_mm": number o null,\n'
    '  "p80_mm": number o null,\n'
    '  "css_primario_mm": number o null,\n'
    '  "css_secundario_mm": number o null,\n'
    '  "plazo_meses": number o null,\n'
    '  "notas_adicionales": string o null,\n'
    '  "supuestos": array de strings\n'
    "}\n\n"
    "Reglas de extracción:\n"
    "- Convierte siempre pulgadas a mm (1 pulgada = 25.4 mm)\n"
    "- Si el texto dice \"10-15 pulgadas\", usar el promedio: 317.5 mm para f_max\n"
    "- Si menciona m³/día, convertir a tph usando densidad si está disponible, si no, asumir 1.6 t/m³ y registrarlo en supuestos\n"
    "- plazo_meses: extraer si menciona duración del proyecto, horizonte, plazo, \"X meses\", \"X semanas\" (convertir a meses)\n"
    "- Si un dato no está en el texto, dejarlo en null (NO inventar valores)\n"
    "- En el array \"supuestos\" listar CADA conversión o inferencia realizada\n"
    "- tipo_roca debe ser una de: caliza, granito, basalto, cuarcita, arenisca, pórfido de cobre, mineral de hierro, dolomita, mármol, esquisto. "
    "Si no coincide exactamente, poner el nombre tal como aparece en el texto.\n"
    "- Si el texto menciona \"mineral\" sin especificar tipo y el contexto es minería en Chile o Sudamérica, "
    "usar \"mineral\" como tipo_roca (el sistema lo inferirá)."
)


class ExtractRequest(BaseModel):
    text: str


@router.post("/extract")
async def extract_parameters(req: ExtractRequest):
    """
    Recibe texto libre del frontend y extrae parámetros técnicos usando Claude.
    La API key de Anthropic nunca llega al browser — vive solo en el backend.
    """
    if len(req.text.strip()) < 20:
        raise HTTPException(status_code=400, detail="El texto es muy corto para extraer datos.")

    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="Servicio de IA no configurado en el servidor.")

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": req.text}],
        )
        return {"content": msg.content[0].text}
    except anthropic.APIStatusError as e:
        raise HTTPException(status_code=502, detail=f"Error en API de IA: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extrayendo parámetros: {str(e)}")
