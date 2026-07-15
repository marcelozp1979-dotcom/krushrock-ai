"""
KrushRock — Generador de propuesta técnica en PDF.
Usa ReportLab (A4, español). Sin costos ni OPEX.
"""
from datetime import date
from io import BytesIO
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

# ── Paleta ────────────────────────────────────────────────────────────────────
_ACCENT   = colors.HexColor("#f59e0b")
_DARK     = colors.HexColor("#1a1a2e")
_MUTED    = colors.HexColor("#6b7280")
_BORDER   = colors.HexColor("#374151")
_BG_HEAD  = colors.HexColor("#1f2937")
_WHITE    = colors.white
_BLACK    = colors.HexColor("#111827")

PAGE_W, PAGE_H = A4
M = 18 * mm       # margen
COL = PAGE_W - 2 * M


def _styles() -> dict:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "kr_title",
            parent=base["Normal"],
            fontSize=16, fontName="Helvetica-Bold",
            textColor=_ACCENT, spaceAfter=2,
        ),
        "subtitle": ParagraphStyle(
            "kr_subtitle",
            parent=base["Normal"],
            fontSize=9, fontName="Helvetica",
            textColor=_MUTED, spaceAfter=6,
        ),
        "section": ParagraphStyle(
            "kr_section",
            parent=base["Normal"],
            fontSize=10, fontName="Helvetica-Bold",
            textColor=_ACCENT, spaceBefore=14, spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "kr_body",
            parent=base["Normal"],
            fontSize=9, fontName="Helvetica",
            textColor=_BLACK, leading=13,
        ),
        "small": ParagraphStyle(
            "kr_small",
            parent=base["Normal"],
            fontSize=8, fontName="Helvetica",
            textColor=_MUTED, leading=11, spaceAfter=2,
        ),
        "footer": ParagraphStyle(
            "kr_footer",
            parent=base["Normal"],
            fontSize=7.5, fontName="Helvetica",
            textColor=_MUTED, leading=10,
        ),
    }


def _th_style() -> TableStyle:
    return TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0), _BG_HEAD),
        ("TEXTCOLOR",    (0, 0), (-1, 0), _WHITE),
        ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, -1), 8.5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f9fafb"), colors.white]),
        ("GRID",         (0, 0), (-1, -1), 0.3, _BORDER),
        ("TOPPADDING",   (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
    ])


def _hr(story: list) -> None:
    story.append(HRFlowable(width=COL, thickness=0.4, color=_BORDER, spaceAfter=6))


def _safe(v: Any, suffix: str = "", decimals: int = 1) -> str:
    if v is None:
        return "—"
    if isinstance(v, bool):
        return "Sí" if v else "No"
    if isinstance(v, float):
        return f"{v:.{decimals}f}{suffix}"
    return f"{v}{suffix}"


# ── Función pública ───────────────────────────────────────────────────────────

def build_proposal_pdf(data: Dict) -> bytes:
    """
    Genera la propuesta técnica en PDF y retorna los bytes.

    Campos esperados en data:
      cliente, proyecto, empresa          — todos opcionales (str)
      faena: dict con rock_type, f80_mm, horas_dia, dias_mes,
             duracion_meses, inchancables, feed_curve (opcional)
      productos: list[dict] con name, min_mm, max_mm, volumen_ton
      config: dict con equipos (list[{marca,modelo,css_mm?,abertura_mm?,
              tipo_legible?}]), circuit, n_units
      resultado: dict con tph_efectivo, product_fit_pct, meses_requeridos,
                 products_detail (list[{name,min_mm,max_mm,tph_out,
                 meses,cumple,inalcanzable}])
    """
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=M, rightMargin=M,
        topMargin=16 * mm, bottomMargin=20 * mm,
        title="KrushRock — Propuesta técnica",
    )
    S = _styles()
    story: List = []

    faena     = data.get("faena", {})
    productos = data.get("productos", [])
    cfg       = data.get("config", {})
    res       = data.get("resultado", {})
    equipos   = cfg.get("equipos", [])
    circuit   = cfg.get("circuit", "")
    n_units   = int(cfg.get("n_units", 1))

    cliente  = data.get("cliente") or ""
    proyecto = data.get("proyecto") or ""
    empresa  = data.get("empresa") or ""

    hoy = date.today().strftime("%d de %B de %Y").replace(
        "January", "enero").replace("February", "febrero").replace(
        "March", "marzo").replace("April", "abril").replace(
        "May", "mayo").replace("June", "junio").replace(
        "July", "julio").replace("August", "agosto").replace(
        "September", "septiembre").replace("October", "octubre").replace(
        "November", "noviembre").replace("December", "diciembre")

    # ── Encabezado ────────────────────────────────────────────────────────────
    story.append(Paragraph("KrushRock — Propuesta técnica de chancado y selección", S["title"]))
    meta_lines = [f"Fecha: {hoy}"]
    if cliente:   meta_lines.append(f"Cliente: {cliente}")
    if proyecto:  meta_lines.append(f"Proyecto: {proyecto}")
    if empresa:   meta_lines.append(f"Emisor: {empresa}")
    story.append(Paragraph("  ·  ".join(meta_lines), S["subtitle"]))
    _hr(story)

    # ── Datos de la faena ─────────────────────────────────────────────────────
    story.append(Paragraph("Datos de la faena", S["section"]))

    rock_name = faena.get("rock_type", "—").capitalize()
    if faena.get("feed_curve"):
        f80_str = "Curva granulométrica adjunta por el cliente"
    else:
        f80_str = _safe(faena.get("f80_mm"), " mm", 0)

    horas_dia = faena.get("horas_dia")
    dias_mes  = faena.get("dias_mes")
    if horas_dia and dias_mes:
        jornada_str = f"{horas_dia} h/día · {dias_mes} días/mes"
    else:
        jornada_str = "—"

    faena_rows = [
        ["Tipo de roca",        rock_name],
        ["F80 de alimentación", f80_str],
        ["Jornada de trabajo",  jornada_str],
        ["Plazo del proyecto",  _safe(faena.get("duracion_meses"), " meses", 0)],
        ["Riesgo inchancables", "Sí — se recomienda detector" if faena.get("inchancables") else "No"],
    ]
    t_faena = Table([[Paragraph(r[0], S["small"]), Paragraph(r[1], S["body"])]
                     for r in faena_rows],
                    colWidths=[50 * mm, COL - 50 * mm])
    t_faena.setStyle(TableStyle([
        ("FONTSIZE",     (0, 0), (-1, -1), 8.5),
        ("TOPPADDING",   (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 3),
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW",    (0, 0), (-1, -2), 0.2, _BORDER),
    ]))
    story.append(t_faena)

    # ── Productos requeridos ──────────────────────────────────────────────────
    story.append(Paragraph("Productos requeridos", S["section"]))
    prod_data = [["Producto", "Rango (mm)", "Volumen total (t)"]]
    for p in productos:
        nombre = p.get("name") or f"{p.get('min_mm', 0)}–{p.get('max_mm', '?')} mm"
        rango  = f"{p.get('min_mm', 0)}–{p.get('max_mm', '?')}"
        vol    = f"{int(p['volumen_ton']):,}".replace(",", ".") if p.get("volumen_ton") else "—"
        prod_data.append([nombre, rango, vol])
    t_prod = Table(prod_data, colWidths=[COL * 0.50, COL * 0.25, COL * 0.25])
    t_prod.setStyle(_th_style())
    story.append(t_prod)

    # ── Configuración propuesta ───────────────────────────────────────────────
    story.append(Paragraph("Configuración propuesta", S["section"]))

    circuit_label = {
        "closed": "Circuito cerrado (el material sobredimensionado retorna al chancador)",
        "open":   "Circuito abierto (el material pasa una sola vez)",
    }.get(circuit, circuit)

    story.append(Paragraph(f"Tipo de circuito: {circuit_label}", S["body"]))
    if n_units > 1:
        story.append(Paragraph(f"Unidades en paralelo: {n_units}", S["body"]))
    story.append(Spacer(1, 4))

    eq_data = [["Equipo (marca y modelo)", "Parámetro operativo", "Unidades"]]
    for eq in equipos:
        nombre = f"{eq.get('marca', '')} {eq.get('modelo', '')} o equipo equivalente".strip()
        if eq.get("css_mm") is not None:
            param = f"CSS {eq['css_mm']} mm"
        elif eq.get("abertura_mm") is not None:
            param = f"Malla {eq['abertura_mm']} mm"
        else:
            param = "—"
        eq_data.append([nombre, param, str(n_units)])
    t_eq = Table(eq_data, colWidths=[COL * 0.55, COL * 0.30, COL * 0.15])
    t_eq.setStyle(_th_style())
    story.append(t_eq)

    # ── Resultados estimados ──────────────────────────────────────────────────
    story.append(Paragraph("Resultados estimados", S["section"]))

    res_rows = [
        ["Producción útil estimada",        _safe(res.get("tph_efectivo"), " tph", 1)],
        ["Material dentro del rango",       _safe(res.get("product_fit_pct"), "%", 1)],
        ["Tiempo total estimado",           _safe(res.get("meses_requeridos"), " meses", 1)],
    ]
    t_res = Table([[Paragraph(r[0], S["small"]), Paragraph(r[1], S["body"])]
                   for r in res_rows],
                  colWidths=[70 * mm, COL - 70 * mm])
    t_res.setStyle(TableStyle([
        ("FONTSIZE",     (0, 0), (-1, -1), 8.5),
        ("TOPPADDING",   (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 3),
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW",    (0, 0), (-1, -2), 0.2, _BORDER),
    ]))
    story.append(t_res)
    story.append(Spacer(1, 6))

    detail = res.get("products_detail", [])
    if detail:
        det_data = [["Producto", "Producción (tph)", "Tiempo (meses)", "Cumple plazo"]]
        for d in detail:
            nombre = d.get("name") or f"{d.get('min_mm', 0)}–{d.get('max_mm', '?')} mm"
            if d.get("inalcanzable"):
                det_data.append([nombre, "—", "∞", "No"])
            else:
                det_data.append([
                    nombre,
                    _safe(d.get("tph_out"), "", 1),
                    _safe(d.get("meses"), "", 1),
                    "Sí" if d.get("cumple") else "No",
                ])
        t_det = Table(det_data, colWidths=[COL * 0.40, COL * 0.20, COL * 0.20, COL * 0.20])
        t_det.setStyle(_th_style())
        story.append(t_det)

    # ── Pie ───────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 12))
    _hr(story)
    story.append(Paragraph(
        "Resultados basados en datos referenciales de fabricantes y simulación granulométrica. "
        "El rendimiento real depende del material y condiciones de faena. "
        "KrushRock no está afiliado ni respaldado por los fabricantes mencionados.",
        S["footer"],
    ))

    doc.build(story)
    return buf.getvalue()
