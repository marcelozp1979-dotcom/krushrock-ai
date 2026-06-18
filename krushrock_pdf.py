"""
KrushRock — Generador de Reporte PDF (Fase 3)
Uso: python3 krushrock_pdf.py datos.json reporte.pdf
"""

import sys, json, math
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.graphics.shapes import Drawing, Rect, Line, String, Circle
from reportlab.graphics import renderPDF

# ── PALETA ────────────────────────────────────────────────────────────────
C_BG       = colors.HexColor("#08090f")
C_SURFACE  = colors.HexColor("#0e1118")
C_CARD     = colors.HexColor("#141924")
C_BORDER   = colors.HexColor("#232d42")
C_AMBER    = colors.HexColor("#f59e0b")
C_GREEN    = colors.HexColor("#10b981")
C_RED      = colors.HexColor("#ef4444")
C_BLUE     = colors.HexColor("#3b82f6")
C_PURPLE   = colors.HexColor("#8b5cf6")
C_CYAN     = colors.HexColor("#06b6d4")
C_TEXT     = colors.HexColor("#dde3f0")
C_MUTED    = colors.HexColor("#56647a")
C_WHITE    = colors.white
C_BLACK    = colors.black

PAGE_W, PAGE_H = A4

# ── ESTILOS ───────────────────────────────────────────────────────────────
def make_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("title",
            fontName="Helvetica-Bold", fontSize=22, textColor=C_AMBER,
            spaceAfter=4, leading=26),
        "subtitle": ParagraphStyle("subtitle",
            fontName="Helvetica", fontSize=10, textColor=C_MUTED,
            spaceAfter=12, leading=13),
        "section": ParagraphStyle("section",
            fontName="Helvetica-Bold", fontSize=11, textColor=C_AMBER,
            spaceBefore=14, spaceAfter=6, leading=14),
        "body": ParagraphStyle("body",
            fontName="Helvetica", fontSize=9, textColor=C_TEXT,
            spaceAfter=4, leading=13),
        "kpi_val": ParagraphStyle("kpi_val",
            fontName="Helvetica-Bold", fontSize=20, textColor=C_AMBER,
            leading=22),
        "kpi_lbl": ParagraphStyle("kpi_lbl",
            fontName="Helvetica", fontSize=7, textColor=C_MUTED,
            leading=9, spaceAfter=1),
        "kpi_sub": ParagraphStyle("kpi_sub",
            fontName="Helvetica", fontSize=7, textColor=C_MUTED,
            leading=9),
        "table_hdr": ParagraphStyle("table_hdr",
            fontName="Helvetica-Bold", fontSize=8, textColor=C_AMBER,
            alignment=TA_CENTER),
        "table_cell": ParagraphStyle("table_cell",
            fontName="Helvetica", fontSize=8, textColor=C_TEXT,
            alignment=TA_LEFT),
        "table_cell_c": ParagraphStyle("table_cell_c",
            fontName="Helvetica", fontSize=8, textColor=C_TEXT,
            alignment=TA_CENTER),
        "note": ParagraphStyle("note",
            fontName="Helvetica-Oblique", fontSize=8, textColor=C_MUTED,
            spaceAfter=4, leading=11),
        "ai_body": ParagraphStyle("ai_body",
            fontName="Helvetica", fontSize=9, textColor=C_TEXT,
            spaceAfter=3, leading=13, leftIndent=8),
    }

# ── CANVAS CALLBACK (header/footer) ───────────────────────────────────────
class NumberedCanvas(rl_canvas.Canvas):
    def __init__(self, *args, **kwargs):
        self._company = kwargs.pop("company", "KrushRock")
        self._project = kwargs.pop("project", "Simulacion")
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_chrome(num_pages)
            super().showPage()
        super().save()

    def _draw_chrome(self, total):
        w, h = PAGE_W, PAGE_H
        # Header bar
        self.setFillColor(C_CARD)
        self.rect(0, h - 28*mm, w, 28*mm, fill=1, stroke=0)
        self.setFillColor(C_AMBER)
        self.rect(0, h - 28*mm, 3, 28*mm, fill=1, stroke=0)

        # Logo box
        self.setFillColor(C_AMBER)
        self.roundRect(12*mm, h - 22*mm, 14*mm, 14*mm, 2*mm, fill=1, stroke=0)
        self.setFillColor(C_BLACK)
        self.setFont("Helvetica-Bold", 10)
        self.drawCentredString(19*mm, h - 17*mm, "CS")

        # Title in header
        self.setFillColor(C_AMBER)
        self.setFont("Helvetica-Bold", 13)
        self.drawString(30*mm, h - 14*mm, "KrushRock")
        self.setFillColor(C_MUTED)
        self.setFont("Helvetica", 7.5)
        self.drawString(30*mm, h - 21*mm, "SIMULADOR INTELIGENTE DE CHANCADO Y SELECCION")

        # Project info right
        self.setFillColor(C_TEXT)
        self.setFont("Helvetica-Bold", 8)
        self.drawRightString(w - 12*mm, h - 13*mm, self._project)
        self.setFillColor(C_MUTED)
        self.setFont("Helvetica", 7)
        self.drawRightString(w - 12*mm, h - 20*mm,
            datetime.now().strftime("%d/%m/%Y %H:%M"))

        # Footer
        self.setFillColor(C_CARD)
        self.rect(0, 0, w, 12*mm, fill=1, stroke=0)
        self.setFillColor(C_AMBER)
        self.rect(0, 12*mm, w, 0.4, fill=1, stroke=0)
        self.setFillColor(C_MUTED)
        self.setFont("Helvetica", 7)
        self.drawString(12*mm, 4.5*mm,
            "Generado por KrushRock  |  Datos de simulacion con fines de ingenieria. Verificar con fabricante.")
        self.setFillColor(C_AMBER)
        self.setFont("Helvetica-Bold", 7)
        pg = self._pageNumber
        self.drawRightString(w - 12*mm, 4.5*mm, f"Pag {pg} / {total}")

# ── HELPER: tabla dark ─────────────────────────────────────────────────────
def dark_table(data, col_widths, hdr_color=C_AMBER, alt=True):
    style = [
        ("BACKGROUND", (0,0), (-1,0), C_CARD),
        ("TEXTCOLOR",  (0,0), (-1,0), hdr_color),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",   (0,0), (-1,0), 8),
        ("ALIGN",      (0,0), (-1,0), "CENTER"),
        ("BOTTOMPADDING",(0,0),(-1,0), 5),
        ("TOPPADDING",   (0,0),(-1,0), 5),
        ("LINEBELOW",  (0,0), (-1,0), 0.5, hdr_color),
        ("FONTNAME",   (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE",   (0,1), (-1,-1), 8),
        ("TEXTCOLOR",  (0,1), (-1,-1), C_TEXT),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [C_SURFACE, C_CARD] if alt else [C_SURFACE]),
        ("GRID",       (0,0), (-1,-1), 0.3, C_BORDER),
        ("TOPPADDING", (0,1),(-1,-1), 4),
        ("BOTTOMPADDING",(0,1),(-1,-1), 4),
        ("LEFTPADDING",(0,0),(-1,-1), 6),
        ("RIGHTPADDING",(0,0),(-1,-1), 6),
    ]
    return Table(data, colWidths=col_widths,
                 style=TableStyle(style), repeatRows=1)

# ── DIAGRAMA DE FLUJO SVG-like con reportlab Drawing ──────────────────────
def make_circuit_diagram(circuit_data, width=160*mm):
    """Dibuja diagrama de flujo del circuito con equipos reales."""
    h = 72*mm
    d = Drawing(width, h)
    nodes = circuit_data.get("nodes", [])
    circuit_type = circuit_data.get("circuitType", "closed")

    # Fondo
    d.add(Rect(0, 0, width, h, fillColor=C_CARD, strokeColor=C_BORDER, strokeWidth=0.5))

    # Definir posiciones según cantidad de nodos
    positions = {
        "scalper": (0.08, 0.55),
        "jaw":     (0.28, 0.55),
        "cone":    (0.55, 0.55),
        "screen":  (0.78, 0.55),
    }
    type_colors = {
        "scalper": C_CYAN, "jaw": C_AMBER,
        "cone": C_PURPLE, "screen": C_GREEN,
    }
    type_labels = {
        "scalper":"SCALPER","jaw":"MANDIBULA",
        "cone":"CONO","screen":"CRIBA"
    }
    type_icons = {"scalper":"[S]","jaw":"[J]","cone":"[C]","screen":"[X]"}

    # Alimentación
    ax, ay = int(0.02*width), int(0.55*h)
    d.add(Rect(ax, ay-10, 22, 20, fillColor=C_SURFACE,
               strokeColor=C_GREEN, strokeWidth=1, rx=2))
    d.add(String(ax+11, ay-4, "FEED", fontName="Helvetica-Bold",
                 fontSize=5, fillColor=C_GREEN, textAnchor="middle"))

    prev_x = ax + 22
    drawn = []
    for node in nodes:
        t = node.get("type","jaw")
        if t not in positions: continue
        rx = int(positions[t][0] * width)
        ry = int(positions[t][1] * h)
        col = type_colors.get(t, C_AMBER)
        # Flecha desde anterior
        d.add(Line(prev_x, ay, rx, ry,
                   strokeColor=C_AMBER, strokeWidth=1,
                   strokeDashArray=[3,2]))
        # Caja nodo
        d.add(Rect(rx, ry-14, 38, 28, fillColor=C_CARD,
                   strokeColor=col, strokeWidth=1.2, rx=3))
        model = node.get("model","")[:12]
        d.add(String(rx+19, ry+9, type_labels.get(t,""), fontName="Helvetica-Bold",
                     fontSize=5, fillColor=col, textAnchor="middle"))
        d.add(String(rx+19, ry+1, model, fontName="Helvetica",
                     fontSize=4.5, fillColor=C_TEXT, textAnchor="middle"))
        # KPI
        kpi = node.get("kpi","")
        d.add(String(rx+19, ry-9, kpi, fontName="Helvetica",
                     fontSize=4, fillColor=C_MUTED, textAnchor="middle"))
        prev_x = rx + 38
        drawn.append((rx+19, ry))

    # Producto final
    px = int(0.96*width)
    d.add(Rect(px-8, ay-10, 16, 20, fillColor=C_GREEN,
               strokeColor=C_GREEN, strokeWidth=0.5, rx=2))
    d.add(String(px, ay-4, "PROD", fontName="Helvetica-Bold",
                 fontSize=4.5, fillColor=C_WHITE, textAnchor="middle"))
    if prev_x < px:
        d.add(Line(prev_x, ay, px-8, ay,
                   strokeColor=C_AMBER, strokeWidth=1, strokeDashArray=[3,2]))

    # Recirculación (arco abajo)
    screen_nodes = [n for n in nodes if n.get("type")=="screen"]
    cone_nodes   = [n for n in nodes if n.get("type")=="cone"]
    if screen_nodes and cone_nodes:
        sx = int(positions["screen"][0]*width) + 19
        cx = int(positions["cone"][0]*width) + 19
        sy = int(0.55*h) - 14
        # Línea abajo
        d.add(Line(sx, sy, sx, 8, strokeColor=C_MUTED, strokeWidth=0.7, strokeDashArray=[2,2]))
        d.add(Line(sx, 8, cx, 8, strokeColor=C_MUTED, strokeWidth=0.7, strokeDashArray=[2,2]))
        d.add(Line(cx, 8, cx, sy, strokeColor=C_MUTED, strokeWidth=0.7, strokeDashArray=[2,2]))
        d.add(String((sx+cx)//2, 3, "recirculacion", fontName="Helvetica",
                     fontSize=4, fillColor=C_MUTED, textAnchor="middle"))

    # Label circuito
    label_map = {
        "closed":"Circuito cerrado estandar",
        "scalper":"Circuito con Scalper",
        "mid":"Seleccion al medio",
    }
    d.add(String(width-4, 3, label_map.get(circuit_type,""),
                 fontName="Helvetica-Oblique", fontSize=4.5,
                 fillColor=C_MUTED, textAnchor="end"))
    return d

# ── SECCIÓN KPI cards ──────────────────────────────────────────────────────
def kpi_row(st, kpis):
    """Genera fila de KPI cards en tabla 4 columnas."""
    cells = []
    for k in kpis:
        val_color = k.get("color", C_AMBER)
        inner = [
            Paragraph(k["label"], st["kpi_lbl"]),
            Paragraph(f'<font color="#{val_color.hexval()[2:]}">{k["value"]}</font>'
                      f'<font size="9" color="#56647a"> {k["unit"]}</font>',
                      st["kpi_val"]),
        ]
        if k.get("sub"):
            inner.append(Paragraph(k["sub"], st["kpi_sub"]))
        cells.append(inner)

    tbl = Table([cells], colWidths=[43*mm]*4)
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), C_CARD),
        ("BOX",        (0,0), (-1,-1), 0.3, C_BORDER),
        ("INNERGRID",  (0,0), (-1,-1), 0.3, C_BORDER),
        ("VALIGN",     (0,0), (-1,-1), "TOP"),
        ("TOPPADDING", (0,0), (-1,-1), 8),
        ("BOTTOMPADDING",(0,0),(-1,-1), 8),
        ("LEFTPADDING",(0,0),(-1,-1), 8),
        ("RIGHTPADDING",(0,0),(-1,-1), 8),
    ]))
    return tbl

# ── CONSTRUIR PDF ──────────────────────────────────────────────────────────
def build_pdf(data: dict, out_path: str):
    st = make_styles()
    project_name = data.get("projectName", "Simulacion KrushRock")
    company      = data.get("company", "")
    rock         = data.get("rock", {})
    inputs       = data.get("inputs", {})
    results      = data.get("results", {})
    node_results = results.get("nodeResults", {})
    nodes        = data.get("nodes", [])
    ai_analysis  = data.get("aiAnalysis", "")

    eff_score = float(results.get("effScore", 0))
    eff_color = C_GREEN if eff_score >= 75 else (C_AMBER if eff_score >= 50 else C_RED)
    final_p80 = results.get("finalP80", "—")
    circ_load = results.get("circLoad", "—")
    tph       = inputs.get("tph", "—")
    p80_target= inputs.get("p80Target", "—")
    bottlenecks = results.get("bottlenecks", [])

    circuit_type_map = {
        "closed":"Circuito cerrado estandar",
        "scalper":"Con Scalper (pre-clasificacion)",
        "mid":"Seleccion al medio",
        "ai":"Recomendado por IA",
    }
    humidity_map = ["Sin humedad (<2%)", "Humedad baja (2-5%)",
                    "Humedad media (5-10%)", "Humedad alta (>10%)"]
    hum_idx = int(inputs.get("humidity", 0))
    humidity_str = humidity_map[hum_idx] if 0 <= hum_idx < 4 else "—"

    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=12*mm, rightMargin=12*mm,
        topMargin=32*mm, bottomMargin=16*mm,
        title=f"KrushRock - {project_name}",
        author="KrushRock",
    )

    story = []

    # ── PORTADA / ENCABEZADO ──────────────────────────────────────────────
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(project_name, st["title"]))
    story.append(Paragraph(
        f"Reporte de Simulacion de Chancado y Seleccion  |  {datetime.now().strftime('%d de %B de %Y')}",
        st["subtitle"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_AMBER, spaceAfter=8))

    # ── SCORE GLOBAL ──────────────────────────────────────────────────────
    story.append(Paragraph("RESULTADO GLOBAL", st["section"]))

    eff_hex = eff_color.hexval()[2:]
    score_data = [[
        [Paragraph("SCORE EFICIENCIA", st["kpi_lbl"]),
         Paragraph(f'<font color="#{eff_hex}" size="32"><b>{int(eff_score)}</b></font>'
                   f'<font color="#56647a" size="14"> /100</font>', st["kpi_val"])],
        [Paragraph("P80 FINAL", st["kpi_lbl"]),
         Paragraph(f'<font color="#f59e0b" size="24"><b>{final_p80}</b></font>'
                   f'<font color="#56647a" size="10"> mm</font>', st["kpi_val"]),
         Paragraph(f"Objetivo: {p80_target} mm", st["kpi_sub"])],
        [Paragraph("CARGA CIRCULANTE", st["kpi_lbl"]),
         Paragraph(f'<font color="#{("ef4444" if float(str(circ_load).replace("—","0"))>30 else "10b981")}" size="24"><b>{circ_load}</b></font>'
                   f'<font color="#56647a" size="10"> %</font>', st["kpi_val"])],
        [Paragraph("ALIMENTACION", st["kpi_lbl"]),
         Paragraph(f'<font color="#3b82f6" size="24"><b>{tph}</b></font>'
                   f'<font color="#56647a" size="10"> tph</font>', st["kpi_val"])],
    ]]
    score_tbl = Table(score_data, colWidths=[43*mm]*4)
    score_tbl.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1), C_CARD),
        ("BOX",(0,0),(-1,-1),0.3,C_BORDER),
        ("INNERGRID",(0,0),(-1,-1),0.3,C_BORDER),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
        ("TOPPADDING",(0,0),(-1,-1),10),
        ("BOTTOMPADDING",(0,0),(-1,-1),10),
        ("LEFTPADDING",(0,0),(-1,-1),10),
        ("RIGHTPADDING",(0,0),(-1,-1),6),
    ]))
    story.append(score_tbl)

    # Bottleneck
    if bottlenecks:
        story.append(Spacer(1, 3*mm))
        story.append(Paragraph(
            f"<font color='#ef4444'><b>Bottleneck detectado:</b></font> "
            f"<font color='#dde3f0'>{', '.join(bottlenecks)}</font>",
            st["body"]))
    else:
        story.append(Spacer(1, 3*mm))
        story.append(Paragraph(
            "<font color='#10b981'>&#10003; Sin bottlenecks detectados en el circuito</font>",
            st["body"]))

    story.append(Spacer(1, 4*mm))

    # ── DATOS DE ENTRADA ──────────────────────────────────────────────────
    story.append(Paragraph("PARAMETROS DE ENTRADA", st["section"]))
    input_data = [
        ["Parametro", "Valor", "Parametro", "Valor"],
        ["Tipo de roca", rock.get("name","—"), "Indice de trabajo Wi", f"{rock.get('wi','—')} kWh/t"],
        ["Abrasividad", str(rock.get("ab","—")), "Densidad", f"{rock.get('den','—')} t/m3"],
        ["Tonelaje (TPH)", f"{tph} tph", "F80 alimentacion", f"{inputs.get('f80','—')} mm"],
        ["P80 objetivo", f"{p80_target} mm", "Humedad/arcillas", humidity_str],
        ["Configuracion circuito", circuit_type_map.get(inputs.get("circuit","closed"),"—"), "", ""],
    ]
    story.append(dark_table(input_data, [42*mm,42*mm,42*mm,42*mm]))
    story.append(Spacer(1, 4*mm))

    # ── DIAGRAMA DE FLUJO ─────────────────────────────────────────────────
    story.append(Paragraph("DIAGRAMA DE FLUJO DEL CIRCUITO", st["section"]))
    circuit_data = {
        "circuitType": inputs.get("circuit","closed"),
        "nodes": [
            {
                "type": n.get("type"),
                "model": (n.get("equipment") or {}).get("model",""),
                "kpi": _node_kpi_str(n, node_results)
            }
            for n in nodes
        ]
    }
    diag = make_circuit_diagram(circuit_data, width=174*mm)
    story.append(diag)
    story.append(Spacer(1, 4*mm))

    # ── EQUIPOS DEL CIRCUITO ──────────────────────────────────────────────
    story.append(Paragraph("EQUIPOS SELECCIONADOS", st["section"]))
    eq_rows = [["Tipo", "Marca", "Modelo", "CSS/Apertura", "Resultado Clave", "Estado"]]
    for node in nodes:
        eq  = node.get("equipment") or {}
        res = node_results.get(node.get("id",""), {})
        ntype = node.get("type","")
        if ntype in ("jaw","cone"):
            kpi  = f"P80: {res.get('p80out','—')} mm"
            css  = f"{res.get('css','—')} mm"
            stat = res.get("status","—")
        else:
            kpi  = f"Efic: {res.get('efficiency','—')}%  CC: {res.get('circLoad','—')}%"
            css  = f"{res.get('aperture','—')} mm"
            stat = res.get("status","—")
        stat_color = "#10b981" if stat=="ok" else ("#ef4444" if stat=="overload" else "#56647a")
        type_labels= {"jaw":"Mandibula","cone":"Cono","screen":"Criba","scalper":"Scalper"}
        eq_rows.append([
            type_labels.get(ntype,ntype),
            eq.get("brand","—"),
            eq.get("model","—"),
            css,
            kpi,
            Paragraph(f'<font color="{stat_color}"><b>{stat.upper()}</b></font>', st["table_cell_c"]),
        ])
    story.append(dark_table(eq_rows, [22*mm,26*mm,42*mm,22*mm,48*mm,18*mm]))
    story.append(Spacer(1, 4*mm))

    # ── BALANCE DE MASAS ──────────────────────────────────────────────────
    story.append(Paragraph("BALANCE DE MASAS", st["section"]))
    bm_rows = [["Parametro", "Valor", "Unidad", "Descripcion"]]
    bm_rows += [
        ["Alimentacion fresca",   str(tph),      "tph", "Material nuevo al circuito"],
        ["Producto final",        str(tph),      "tph", "Producto a stockpile"],
        ["P80 producto",          str(final_p80),"mm",  "Granulometria producto"],
        ["Carga circulante",      str(circ_load),"%",   "% de recirculacion al cono"],
    ]
    # Agregar resultados por nodo
    for node in nodes:
        res = node_results.get(node.get("id",""), {})
        eq  = node.get("equipment") or {}
        ntype = node.get("type","")
        if ntype in ("jaw","cone"):
            bm_rows.append([
                f"Energia {ntype}",
                str(res.get("energy","—")),
                "kWh/t",
                f"{eq.get('brand','')} {eq.get('model','')} — Util: {res.get('utilization','—')}%"
            ])
        if ntype == "screen":
            bm_rows.append([
                "Sobresize criba",
                str(res.get("oversize","—")),
                "tph",
                f"Material que recircula al cono"
            ])
    story.append(dark_table(bm_rows, [46*mm,22*mm,18*mm,92*mm]))
    story.append(Spacer(1, 4*mm))

    # ── DETALLE POR EQUIPO ────────────────────────────────────────────────
    story.append(Paragraph("DETALLE DE RESULTADOS POR EQUIPO", st["section"]))
    for node in nodes:
        eq  = node.get("equipment") or {}
        res = node_results.get(node.get("id",""), {})
        ntype = node.get("type","")
        type_labels = {"jaw":"Mandibula","cone":"Cono","screen":"Criba","scalper":"Scalper"}
        brand_color_hex = {
            "Powerscreen":"f59e0b","Kleemann":"06b6d4","Finlay":"10b981",
            "Sandvik":"3b82f6","Metso":"ef4444","Astec":"8b5cf6"
        }.get(eq.get("brand",""),"f59e0b")

        hdr = [Paragraph(
            f'<font color="#{brand_color_hex}"><b>{eq.get("brand","")} {eq.get("model","")}</b></font>'
            f'  <font color="#56647a">— {type_labels.get(ntype,ntype)}</font>',
            st["body"])]

        if ntype in ("jaw","cone"):
            detail_rows = [
                ["Parametro","Valor","Parametro","Valor"],
                ["CSS calculado", f"{res.get('css','—')} mm",
                 "P80 entrada",   f"{res.get('p80in','—')} mm"],
                ["P80 salida",    f"{res.get('p80out','—')} mm",
                 "Ratio reduccion",f"{res.get('rr','—')}"],
                ["Capacidad nominal",f"{res.get('capNominal','—')} tph",
                 "Capacidad real", f"{res.get('capReal','—')} tph"],
                ["Energia especifica",f"{res.get('energy','—')} kWh/t",
                 "Utilizacion",    f"{res.get('utilization','—')} %"],
            ]
        else:
            detail_rows = [
                ["Parametro","Valor","Parametro","Valor"],
                ["Apertura calc.",f"{res.get('aperture','—')} mm",
                 "Eficiencia",     f"{res.get('efficiency','—')} %"],
                ["Sobresize",      f"{res.get('oversize','—')} tph",
                 "Carga circulante",f"{res.get('circLoad','—')} %"],
            ]
        story.append(KeepTogether([
            *hdr,
            dark_table(detail_rows, [46*mm,30*mm,46*mm,56*mm]),
            Spacer(1, 3*mm),
        ]))

    # ── ANÁLISIS IA ───────────────────────────────────────────────────────
    if ai_analysis:
        story.append(PageBreak())
        story.append(Paragraph("ANALISIS INTELIGENTE — KrushRock", st["section"]))

        ai_box_data = [[
            Paragraph(
                '<font color="#f59e0b"><b>◈ KrushRock</b></font>  '
                '<font color="#56647a" size="7">Analisis automatico del circuito simulado</font>',
                st["body"]),
            Paragraph(ai_analysis.replace("\n","<br/>"), st["ai_body"]),
        ]]
        ai_tbl = Table([[ai_analysis.replace("\n","\n")]], colWidths=[174*mm])
        ai_tbl.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,-1), C_CARD),
            ("BOX",(0,0),(-1,-1), 0.5, C_AMBER),
            ("LEFTPADDING",(0,0),(-1,-1),12),
            ("RIGHTPADDING",(0,0),(-1,-1),12),
            ("TOPPADDING",(0,0),(-1,-1),10),
            ("BOTTOMPADDING",(0,0),(-1,-1),10),
            ("FONTNAME",(0,0),(-1,-1),"Helvetica"),
            ("FONTSIZE",(0,0),(-1,-1),9),
            ("TEXTCOLOR",(0,0),(-1,-1),C_TEXT),
        ]))
        story.append(ai_tbl)
        story.append(Spacer(1,4*mm))

    # ── DISCLAIMER ────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.3, color=C_BORDER, spaceAfter=4))
    story.append(Paragraph(
        "Este reporte ha sido generado por KrushRock con fines de ingenieria y referencia tecnica. "
        "Los resultados son estimaciones basadas en modelos Bond/Whiten y curvas publicadas por fabricantes. "
        "Verificar siempre con el fabricante del equipo antes de tomar decisiones de compra o diseno de planta.",
        st["note"]))

    # ── BUILD ─────────────────────────────────────────────────────────────
    doc.build(
        story,
        canvasmaker=lambda *a, **kw: NumberedCanvas(
            *a, company=company, project=project_name, **kw
        )
    )
    print(f"PDF generado: {out_path}")


def _node_kpi_str(node, node_results):
    res = node_results.get(node.get("id",""), {})
    t = node.get("type","")
    if t in ("jaw","cone"):
        return f"P80:{res.get('p80out','?')}mm"
    elif t in ("screen","scalper"):
        return f"CC:{res.get('circLoad','?')}%"
    return ""


# ── MAIN ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) < 3:
        # Demo con datos de ejemplo
        demo = {
            "projectName": "Proyecto Demo - Cantera Norte",
            "company": "Áridos del Pacífico S.A.",
            "rock": {"name":"Granito","wi":15.5,"ab":0.28,"den":2.70},
            "inputs": {"tph":300,"f80":600,"p80Target":25,"humidity":1,"circuit":"closed"},
            "results": {
                "effScore":"72","finalP80":"27","circLoad":"22.5",
                "bottlenecks":[],
                "nodeResults":{
                    "node_1":{"css":"108","p80in":"600","p80out":"370","energy":"1.85",
                              "capNominal":"380","capReal":"300","utilization":"79","rr":"1.6","status":"ok"},
                    "node_2":{"css":"22","p80in":"370","p80out":"78","energy":"3.21",
                              "capNominal":"350","capReal":"300","utilization":"86","rr":"4.7","status":"ok"},
                    "node_3":{"aperture":"22","efficiency":"87.5","oversize":"67","circLoad":"22.5","status":"ok"},
                }
            },
            "nodes": [
                {"id":"node_1","type":"jaw",
                 "equipment":{"brand":"Finlay","model":"J-1280","color":"#10b981"}},
                {"id":"node_2","type":"cone",
                 "equipment":{"brand":"Finlay","model":"C-1545","color":"#10b981"}},
                {"id":"node_3","type":"screen",
                 "equipment":{"brand":"Finlay","model":"694 — 3 deck","color":"#10b981"}},
            ],
            "aiAnalysis": (
                "Diagnostico: El circuito presenta un diseno adecuado para el tonelaje objetivo. "
                "La combinacion J-1280 + C-1545 + criba 694 es compatible y bien dimensionada.\n\n"
                "Puntos criticos:\n"
                "● La utilizacion del cono al 86% es optima, con margen para picos de alimentacion.\n"
                "● La carga circulante del 22.5% esta dentro del rango aceptable (objetivo <30%).\n"
                "● El P80 final de 27mm esta levemente sobre el objetivo de 25mm.\n\n"
                "Recomendaciones:\n"
                "→ Reducir CSS del cono de 22mm a 19mm para acercarse al P80 objetivo.\n"
                "→ Verificar eficiencia de malla de criba para material con Wi>15.\n"
                "→ Considerar pre-criba 683 si hay presencia de finos arcillosos."
            )
        }
        out = "/mnt/user-data/outputs/krushrock_reporte_demo.pdf"
        build_pdf(demo, out)
    else:
        with open(sys.argv[1]) as f:
            data = json.load(f)
        build_pdf(data, sys.argv[2])
