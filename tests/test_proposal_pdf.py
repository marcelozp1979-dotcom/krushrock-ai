"""
KrushRock — Tests del generador de propuesta técnica PDF.
Verifica build_proposal_pdf y el endpoint POST /reports/proposal.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.proposal_pdf import build_proposal_pdf

client = TestClient(app)

# ── Fixtures ──────────────────────────────────────────────────────────────────

_DATA_MINIMA = {
    "faena": {
        "rock_type": "granito",
        "f80_mm": 400.0,
        "horas_dia": 8.0,
        "dias_mes": 25.0,
        "duracion_meses": 3,
        "inchancables": False,
    },
    "productos": [
        {"name": "grava", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": 15_000.0}
    ],
    "config": {
        "equipos": [
            {"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-960",
             "css_mm": 75, "abertura_mm": None},
        ],
        "circuit": "open",
        "n_units": 1,
    },
    "resultado": {
        "tph_efectivo": 120.5,
        "product_fit_pct": 72.3,
        "meses_requeridos": 2.8,
        "products_detail": [
            {"name": "grava", "min_mm": 0, "max_mm": 75, "tph_out": 86.6,
             "meses": 2.8, "cumple": True, "inalcanzable": False}
        ],
    },
}

_PAYLOAD_ENDPOINT = {
    "faena": {
        "rock_type": "granito",
        "f80_mm": 400.0,
        "products": [{"name": "grava", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": 15_000.0}],
        "duracion_meses": 3,
        "inchancables": False,
        "horas_dia": 8.0,
        "dias_mes": 25.0,
    },
    "config": {
        "equipos": [{"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-960"}],
        "circuit": "open",
        "n_units": 1,
    },
}


# ── Tests de build_proposal_pdf ───────────────────────────────────────────────

def test_build_proposal_pdf_retorna_bytes_pdf():
    """build_proposal_pdf con data mínima retorna bytes válidos de PDF (>2 KB)."""
    pdf = build_proposal_pdf(_DATA_MINIMA)
    assert isinstance(pdf, bytes), "Debe retornar bytes"
    assert pdf[:4] == b"%PDF", "Debe comenzar con la firma PDF (%PDF)"
    assert len(pdf) > 2_048, f"PDF muy pequeño: {len(pdf)} bytes"


def test_build_proposal_pdf_con_metadatos():
    """build_proposal_pdf acepta cliente, proyecto y empresa sin error."""
    data = dict(_DATA_MINIMA, cliente="Empresa X", proyecto="Proyecto Norte", empresa="KrushRock")
    pdf = build_proposal_pdf(data)
    assert pdf[:4] == b"%PDF"


def test_build_proposal_pdf_sin_detalle_productos():
    """build_proposal_pdf funciona aunque products_detail esté vacío."""
    data = {**_DATA_MINIMA, "resultado": {**_DATA_MINIMA["resultado"], "products_detail": []}}
    pdf = build_proposal_pdf(data)
    assert pdf[:4] == b"%PDF"


# ── Tests del endpoint /reports/proposal ─────────────────────────────────────

def test_endpoint_proposal_retorna_pdf():
    """POST /reports/proposal con payload válido → 200, content-type PDF, body %PDF."""
    resp = client.post("/api/v1/reports/proposal", json=_PAYLOAD_ENDPOINT)
    assert resp.status_code == 200, f"HTTP {resp.status_code}: {resp.text[:300]}"
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content[:4] == b"%PDF"


def test_endpoint_proposal_con_metadatos_opcionales():
    """El endpoint acepta cliente y proyecto opcionales."""
    payload = {**_PAYLOAD_ENDPOINT, "cliente": "Minera Demo", "proyecto": "Test PDF"}
    resp = client.post("/api/v1/reports/proposal", json=payload)
    assert resp.status_code == 200
    assert resp.content[:4] == b"%PDF"
    assert "KrushRock_Propuesta_Test_PDF.pdf" in resp.headers.get("content-disposition", "")


def test_endpoint_proposal_sin_f80_ni_curva_retorna_422():
    """Sin f80_mm ni feed_curve → 422."""
    payload = {
        "faena": {
            "rock_type": "granito",
            "products": [{"name": "grava", "min_mm": 0.0, "max_mm": 75.0, "volumen_ton": 15_000.0}],
            "duracion_meses": 3,
            "inchancables": False,
        },
        "config": {
            "equipos": [{"etapa": "jaw", "marca": "Terex Finlay", "modelo": "J-960"}],
            "circuit": "open",
            "n_units": 1,
        },
    }
    resp = client.post("/api/v1/reports/proposal", json=payload)
    assert resp.status_code == 422
