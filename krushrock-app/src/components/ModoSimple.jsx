import { useState } from "react";
import { ROCK_DB, ROCK_CATS, EQ_LOCAL } from "../catalogo.js";
import { G, GCSS, API_BASE } from "../shared.js";
import { Badge } from "./BaseComponents.jsx";

const SIMPLE_PRODUCTS = [
  { id: "base",     label: "Base compactada (todo el material < 37mm)", min_mm: 0,   max_mm: 37   },
  { id: "gravilla", label: 'Gravilla 3/4" — árido para hormigón',      min_mm: 19,  max_mm: 37   },
  { id: "grava",    label: "Grava gruesa (37–75mm)",                    min_mm: 37,  max_mm: 75   },
  { id: "arena",    label: "Arena fina (0–5mm)",                        min_mm: 0,   max_mm: 4.75 },
  { id: "balasto",  label: "Balasto ferroviario (37–63mm)",             min_mm: 37,  max_mm: 63   },
  { id: "hormigon", label: "Árido grueso para hormigón (0–25mm)",       min_mm: 0,   max_mm: 25   },
];

const CFG_LABELS = {
  jaw_only:        "Solo chancador de mandíbula",
  jaw_screen:      "Mandíbula + Seleccionadora",
  jaw_cone_screen: "Planta completa (mandíbula, cono y seleccionadora)",
};

const CMP_META = [
  { key: "tph_efectivo",        label: "Producción estimada"               },
  { key: "material_aprovechado", label: "Material dentro del rango deseado" },
  { key: "tiempo_requerido",    label: "Tiempo para lograr el volumen"     },
  { key: "n_equipos_total",     label: "Cantidad de equipos necesarios"    },
];

const ETAPA_OPTS = [
  { value: "jaw",    label: "Chancador de mandíbula" },
  { value: "cone",   label: "Chancador de cono"       },
  { value: "screen", label: "Seleccionadora"           },
  { value: "hsi",    label: "Chancador de impacto (HSI)" },
];

export function LandingScreen({ onSelect }) {
  return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24, fontFamily: G.font }}>
      <style>{GCSS}</style>
      <div style={{ marginBottom: 36, textAlign: "center" }}>
        <div style={{ fontFamily: G.fontD, fontSize: 42, fontWeight: 800, color: G.accent,
          letterSpacing: "-0.02em", lineHeight: 1 }}>KrushRock</div>
        <div style={{ color: G.muted, fontSize: 14, marginTop: 8 }}>
          Simulador de plantas de chancado
        </div>
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", maxWidth: 780 }}>
        <div
          onClick={() => onSelect("simple")}
          style={{ background: G.card, border: `2px solid ${G.accent}`, borderRadius: 16,
            padding: "32px 28px", width: 340, cursor: "pointer", display: "flex",
            flexDirection: "column", gap: 14, transition: "transform .15s, box-shadow .15s",
            animation: "fadeIn .35s ease forwards" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${G.accentDim}`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ fontSize: 38 }}>🤝</div>
          <div style={{ fontFamily: G.fontD, fontSize: 22, fontWeight: 700, color: G.accent }}>
            Dime qué necesitas
          </div>
          <div style={{ color: G.muted, fontSize: 14, lineHeight: 1.65 }}>
            Responde 4 preguntas simples y el sistema recomienda qué equipos usar y qué producción esperar.
            Sin necesidad de conocimientos técnicos.
          </div>
          <div style={{ marginTop: 6, color: G.accent, fontSize: 14, fontWeight: 700 }}>
            Empezar →
          </div>
        </div>
        <div
          onClick={() => onSelect("advanced")}
          style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16,
            padding: "32px 28px", width: 340, cursor: "pointer", display: "flex",
            flexDirection: "column", gap: 14, transition: "transform .15s, box-shadow .15s",
            animation: "fadeIn .45s ease forwards" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ fontSize: 38 }}>⚙️</div>
          <div style={{ fontFamily: G.fontD, fontSize: 22, fontWeight: 700, color: G.text }}>
            Modo avanzado
          </div>
          <div style={{ color: G.muted, fontSize: 14, lineHeight: 1.65 }}>
            Ingresa granulometría, humedad, altitud y equipos específicos.
            Para ingenieros de proceso y usuarios con datos técnicos detallados.
          </div>
          <div style={{ marginTop: 6, color: G.muted, fontSize: 14, fontWeight: 700 }}>
            Modo experto →
          </div>
        </div>
      </div>
    </div>
  );
}

export function SimpleMode({ eqCatalog, onBack }) {
  const EQ = eqCatalog || EQ_LOCAL;

  const [rockKey, setRockKey]       = useState("granito");
  const [products, setProducts]     = useState([
    { id: 1, name: "", minMm: "", maxMm: "", volumenTon: "" },
  ]);
  const [meses, setMeses]           = useState(3);
  const [horasDia, setHorasDia]     = useState(8);
  const [diasMes, setDiasMes]       = useState(25);
  const [inchancables, setInchancables] = useState(false);

  // ── Ingreso de tamaño de material (3 niveles) ─────────────────────────────
  const [feedLevel, setFeedLevel]   = useState(1);   // 1=max_mm, 2=f80, 3=curva
  const [feedMaxMm, setFeedMaxMm]   = useState(500); // Nivel 1: tamaño máximo
  const [feedF80, setFeedF80]       = useState("");  // Nivel 2: F80 directo
  const [feedCurveRows, setFeedCurveRows] = useState([
    { sizeMm: "", passingPct: "" },
    { sizeMm: "", passingPct: "" },
    { sizeMm: "", passingPct: "" },
    { sizeMm: "", passingPct: "" },
  ]);

  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError]     = useState(null);
  const [recs, setRecs]             = useState(null);

  const [pdfCliente, setPdfCliente] = useState("");
  const [pdfProyecto, setPdfProyecto] = useState("");

  const [showCmp, setShowCmp]       = useState(false);
  const [cmpEquipos, setCmpEquipos] = useState([{ etapa: "jaw", marca: "", modelo: "" }]);
  const [cmpCircuit, setCmpCircuit] = useState("open");
  const [cmpN, setCmpN]             = useState(1);
  const [cmpSugIdx, setCmpSugIdx]   = useState(0);
  const [cmpLoading, setCmpLoading] = useState(false);
  const [cmpError, setCmpError]     = useState(null);
  const [cmpResult, setCmpResult]   = useState(null);

  const addProduct = () => {
    if (products.length >= 5) return;
    setProducts(p => [...p, { id: Date.now(), name: "", minMm: "", maxMm: "", volumenTon: "" }]);
  };

  const removeProduct = (id) => setProducts(p => p.filter(r => r.id !== id));

  const updateProduct = (id, field, val) =>
    setProducts(p => p.map(r => r.id !== id ? r : { ...r, [field]: val }));

  const buildProductsPayload = () =>
    products.map(p => ({
      name: p.name || "",
      min_mm: Number(p.minMm) || 0,
      max_mm: Number(p.maxMm),
      volumen_ton: Number(p.volumenTon) || 0,
    }));

  const hasValidProducts = products.length >= 1 &&
    products.every(p => p.maxMm !== "" && p.volumenTon !== "");

  const buildFeedPayload = () => {
    if (feedLevel === 3) {
      const pts = feedCurveRows
        .filter(r => r.sizeMm !== "" && r.passingPct !== "")
        .map(r => ({ size_mm: Number(r.sizeMm), passing_pct: Number(r.passingPct) }));
      return { feed_curve: pts };
    }
    const f80 = feedLevel === 2 ? Number(feedF80) : Math.round(Number(feedMaxMm) * 0.8);
    return { f80_mm: f80 };
  };

  const handleRecommend = async () => {
    if (!products.length) { setRecError("Agrega al menos un producto."); return; }
    if (!hasValidProducts) { setRecError("Cada producto necesita tamaño máximo y volumen requerido."); return; }
    if (feedLevel === 2 && !feedF80) { setRecError("Ingresa el valor de F80."); return; }
    if (feedLevel === 3 && feedCurveRows.filter(r => r.sizeMm && r.passingPct).length < 2) {
      setRecError("Ingresa al menos 2 puntos de la curva granulométrica."); return;
    }
    setRecLoading(true); setRecError(null); setRecs(null); setShowCmp(false); setCmpResult(null);
    try {
      const resp = await fetch(`${API_BASE}/simulations/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rock_type: rockKey, ...buildFeedPayload(),
          products: buildProductsPayload(), duracion_meses: Number(meses), inchancables,
          horas_dia: Number(horasDia), dias_mes: Number(diasMes) }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`El servidor respondió con error ${resp.status}: ${t.slice(0, 200)}`);
      }
      const data = await resp.json();
      setRecs(data.recommendations || []);
    } catch (err) {
      setRecError(err.message);
    } finally {
      setRecLoading(false);
    }
  };

  const brandsByEtapa = (etapa) => {
    const pool = etapa === "screen" ? (EQ.screen || []) : (EQ[etapa] || []);
    return [...new Set(pool.map(e => e.brand))];
  };

  const modelsByEtapaBrand = (etapa, brand) => {
    const pool = etapa === "screen" ? (EQ.screen || []) : (EQ[etapa] || []);
    return pool.filter(e => e.brand === brand).map(e => e.model);
  };

  const updateEq = (i, field, val) => {
    setCmpEquipos(prev => prev.map((e, idx) => idx !== i ? e : {
      ...e, [field]: val,
      ...(field === "etapa" ? { marca: "", modelo: "" } : {}),
      ...(field === "marca" ? { modelo: "" } : {}),
    }));
  };

  const handleProposal = async (rec) => {
    const circuitRec = rec.config === "jaw_only" ? "open" : "closed";
    try {
      const resp = await fetch(`${API_BASE}/reports/proposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente:  pdfCliente || null,
          proyecto: pdfProyecto || null,
          faena: {
            rock_type: rockKey,
            ...buildFeedPayload(),
            products: buildProductsPayload(),
            duracion_meses: Number(meses),
            inchancables,
            horas_dia: Number(horasDia),
            dias_mes: Number(diasMes),
          },
          config: {
            equipos: rec.equipos.map(e => ({ etapa: e.etapa, marca: e.marca, modelo: e.modelo })),
            circuit: circuitRec,
            n_units: rec.n_units,
          },
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        setRecError(err.detail || "Error al generar el PDF.");
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const slug = (pdfProyecto || new Date().toISOString().slice(0, 10)).replace(/\s+/g, "_");
      a.href = url;
      a.download = `KrushRock_Propuesta_${slug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setRecError("No se pudo conectar con el servidor para generar el PDF.");
    }
  };

  const handleCompare = async () => {
    if (!recs?.length) return;
    if (cmpEquipos.some(e => !e.marca || !e.modelo)) {
      setCmpError("Selecciona marca y modelo de todos los equipos."); return;
    }
    setCmpLoading(true); setCmpError(null); setCmpResult(null);
    const sugerida = recs[Math.min(cmpSugIdx, recs.length - 1)];
    const sugeridaCircuit = sugerida.config === "jaw_only" ? "open" : "closed";
    try {
      const resp = await fetch(`${API_BASE}/simulations/compare-simple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config_usuario: {
            equipos: cmpEquipos.map(e => ({ etapa: e.etapa, marca: e.marca, modelo: e.modelo })),
            circuit: cmpCircuit,
            n_units: Number(cmpN),
            tarifa_arriendo_usd_mes: null,
          },
          config_sugerida: {
            equipos: sugerida.equipos,
            circuit: sugeridaCircuit,
            n_units: sugerida.n_units,
            tarifa_arriendo_usd_mes: null,
          },
          faena: { rock_type: rockKey, ...buildFeedPayload(),
            products: buildProductsPayload(), duracion_meses: Number(meses), inchancables,
            horas_dia: Number(horasDia), dias_mes: Number(diasMes) },
        }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Error ${resp.status}: ${t.slice(0, 200)}`);
      }
      const data = await resp.json();
      setCmpResult(data.tabla || []);
    } catch (err) {
      setCmpError(err.message);
    } finally {
      setCmpLoading(false);
    }
  };

  const fmtVal = (key, val) => {
    if (val === null || val === undefined) return "—";
    if (key === "cumple_plazo") return val ? "Sí ✓" : "No ✗";
    if (typeof val === "boolean") return val ? "Sí" : "No";
    if (typeof val === "number") return Number.isInteger(val) ? String(val) : val.toFixed(1);
    return String(val);
  };

  const fmtUnit = (key, unidad) => {
    if (!unidad || unidad === "bool") return "";
    return ` ${unidad}`;
  };

  const inp = { background: G.card, color: G.text, border: `1px solid ${G.border}`,
    borderRadius: 8, padding: "10px 14px", fontFamily: G.font, fontSize: 14, outline: "none", width: "100%" };
  const lbl = { fontSize: 13, color: G.muted, marginBottom: 6, display: "block" };
  const sec = { background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 24, marginBottom: 20 };

  return (
    <div style={{ minHeight: "100vh", background: G.bg, fontFamily: G.font }}>
      <style>{GCSS}</style>
      <div style={{ background: G.surface, borderBottom: `1px solid ${G.border}`,
        padding: "12px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onBack}
          style={{ background: "none", border: "none", color: G.muted, fontSize: 13,
            cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 5 }}>
          ← Inicio
        </button>
        <div style={{ fontFamily: G.fontD, fontSize: 18, fontWeight: 700, color: G.accent }}>KrushRock</div>
        <div style={{ color: G.muted, fontSize: 13 }}>— Dime qué necesitas</div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>

        {/* ── FORMULARIO ── */}
        <div style={sec} className="fi">
          <div style={{ fontFamily: G.fontD, fontSize: 18, fontWeight: 700,
            color: G.text, marginBottom: 22 }}>Cuéntanos sobre tu proyecto</div>

          <div style={{ marginBottom: 22 }}>
            <label style={lbl}>1. ¿Qué tipo de roca tienes?</label>
            <select value={rockKey} onChange={e => setRockKey(e.target.value)} style={inp}>
              {Object.entries(ROCK_CATS).map(([cat, keys]) => (
                <optgroup key={cat} label={{ aridos: "Áridos y ripio", mineria: "Minerales",
                  roca_dura: "Roca dura", roca_blanda: "Roca blanda" }[cat] || cat}>
                  {keys.map(k => <option key={k} value={k}>{ROCK_DB[k]?.name || k}</option>)}
                </optgroup>
              ))}
              <option value="desconocida">No sé / Roca desconocida</option>
            </select>
          </div>

          {/* ── NIVEL 1/2/3: tamaño de roca de entrada ── */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <label style={lbl}>2. Tamaño de la roca que entra</label>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setFeedLevel(2)} style={{ background: "none", border: "none",
                  color: feedLevel === 2 ? G.accent : G.muted, fontSize: 12, cursor: "pointer",
                  textDecoration: feedLevel === 2 ? "underline" : "none", padding: 0 }}>
                  Tengo el F80
                </button>
                <button onClick={() => setFeedLevel(3)} style={{ background: "none", border: "none",
                  color: feedLevel === 3 ? G.accent : G.muted, fontSize: 12, cursor: "pointer",
                  textDecoration: feedLevel === 3 ? "underline" : "none", padding: 0 }}>
                  Tengo la curva granulométrica
                </button>
                {feedLevel !== 1 && (
                  <button onClick={() => setFeedLevel(1)} style={{ background: "none", border: "none",
                    color: G.muted, fontSize: 12, cursor: "pointer", padding: 0 }}>
                    ← Volver
                  </button>
                )}
              </div>
            </div>

            {feedLevel === 1 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <input type="number" value={feedMaxMm} min={50} max={2000} step={10}
                    onChange={e => setFeedMaxMm(e.target.value)}
                    style={{ ...inp, maxWidth: 140 }} />
                  <span style={{ color: G.muted, fontSize: 13 }}>mm (tamaño máximo)</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[800, 500, 300, 150].map(v => (
                    <button key={v} onClick={() => setFeedMaxMm(v)}
                      style={{ padding: "6px 14px", background: Number(feedMaxMm) === v ? G.accent : G.card,
                        border: `1px solid ${Number(feedMaxMm) === v ? G.accent : G.border}`,
                        borderRadius: 6, color: Number(feedMaxMm) === v ? "#000" : G.text,
                        fontSize: 13, cursor: "pointer" }}>
                      {v} mm
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: G.muted, marginTop: 6 }}>
                  F80 estimado: {Math.round(Number(feedMaxMm) * 0.8)} mm
                </div>
              </>
            )}

            {feedLevel === 2 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" value={feedF80} min={10} max={2000}
                  onChange={e => setFeedF80(e.target.value)}
                  placeholder="ej. 350"
                  style={{ ...inp, maxWidth: 140 }} />
                <span style={{ color: G.muted, fontSize: 13 }}>mm (F80)</span>
              </div>
            )}

            {feedLevel === 3 && (
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 12, color: G.muted, flex: 1 }}>Tamaño (mm)</span>
                  <span style={{ fontSize: 12, color: G.muted, flex: 1 }}>% que pasa</span>
                </div>
                {feedCurveRows.map((row, i) => (
                  <div key={i} style={{ display: "flex", gap: 12 }}>
                    <input type="number" value={row.sizeMm} min={0}
                      onChange={e => setFeedCurveRows(prev => prev.map((r, j) => j !== i ? r : { ...r, sizeMm: e.target.value }))}
                      placeholder="mm"
                      style={{ ...inp, flex: 1, maxWidth: 120 }} />
                    <input type="number" value={row.passingPct} min={0} max={100}
                      onChange={e => setFeedCurveRows(prev => prev.map((r, j) => j !== i ? r : { ...r, passingPct: e.target.value }))}
                      placeholder="0–100"
                      style={{ ...inp, flex: 1, maxWidth: 120 }} />
                  </div>
                ))}
                <div style={{ fontSize: 11, color: G.muted }}>
                  Los % deben crecer con el tamaño (ej. 25% pasa 50 mm → 80% pasa 200 mm)
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={lbl}>3. ¿Qué material necesitas producir?</label>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 90px 90px 130px 28px",
                gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 11, color: G.muted }}>Nombre (opcional)</span>
                <span style={{ fontSize: 11, color: G.muted }}>Mín (mm)</span>
                <span style={{ fontSize: 11, color: G.muted }}>Máx (mm)*</span>
                <span style={{ fontSize: 11, color: G.muted }}>Volumen total (t)*</span>
                <span />
              </div>
              {products.map(p => (
                <div key={p.id} style={{ display: "grid",
                  gridTemplateColumns: "2fr 90px 90px 130px 28px", gap: 6, alignItems: "center" }}>
                  <input type="text" value={p.name} placeholder="ej. Grava"
                    onChange={e => updateProduct(p.id, "name", e.target.value)}
                    style={{ ...inp, padding: "8px 10px" }} />
                  <input type="number" value={p.minMm} min={0} placeholder="0"
                    onChange={e => updateProduct(p.id, "minMm", e.target.value)}
                    style={{ ...inp, padding: "8px 10px" }} />
                  <input type="number" value={p.maxMm} min={1} placeholder="mm"
                    onChange={e => updateProduct(p.id, "maxMm", e.target.value)}
                    style={{ ...inp, padding: "8px 10px",
                      borderColor: p.maxMm === "" ? G.border : G.accent }} />
                  <input type="number" value={p.volumenTon} min={1} placeholder="ton"
                    onChange={e => updateProduct(p.id, "volumenTon", e.target.value)}
                    style={{ ...inp, padding: "8px 10px",
                      borderColor: p.volumenTon === "" ? G.border : G.accent }} />
                  {products.length > 1 ? (
                    <button onClick={() => removeProduct(p.id)}
                      style={{ background: "none", border: "none", color: G.red,
                        cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
                  ) : <span />}
                </div>
              ))}
              {products.length < 5 && (
                <button onClick={addProduct}
                  style={{ fontSize: 13, color: G.accent, background: "none", border: "none",
                    cursor: "pointer", padding: "4px 0", textAlign: "left" }}>
                  + Agregar producto
                </button>
              )}
              <div style={{ fontSize: 11, color: G.muted }}>
                * Tamaño máximo y volumen total requeridos por cada producto
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
            <div style={{ flex: 0, minWidth: 180 }}>
              <label style={lbl}>4. ¿Cuántos meses dura la obra?</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" value={meses} min={1} max={60}
                  onChange={e => setMeses(e.target.value)} style={{ ...inp, maxWidth: 100 }} />
                <span style={{ color: G.muted, fontSize: 13 }}>meses</span>
              </div>
            </div>
            <div style={{ flex: 0, minWidth: 160 }}>
              <label style={lbl}>Horas de trabajo por día</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" value={horasDia} min={1} max={24}
                  onChange={e => setHorasDia(e.target.value)} style={{ ...inp, maxWidth: 90 }} />
                <span style={{ color: G.muted, fontSize: 13 }}>h/día</span>
              </div>
            </div>
            <div style={{ flex: 0, minWidth: 160 }}>
              <label style={lbl}>Días por mes</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" value={diasMes} min={1} max={31}
                  onChange={e => setDiasMes(e.target.value)} style={{ ...inp, maxWidth: 90 }} />
                <span style={{ color: G.muted, fontSize: 13 }}>días/mes</span>
              </div>
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer",
            background: inchancables ? G.faint : "transparent",
            border: `1px solid ${inchancables ? G.accent : G.border}`,
            borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
            <input type="checkbox" checked={inchancables}
              onChange={e => setInchancables(e.target.checked)}
              style={{ accentColor: G.accent, width: 16, height: 16, marginTop: 2, cursor: "pointer", flexShrink: 0 }} />
            <span>
              <span style={{ color: G.text, fontSize: 14, fontWeight: 600 }}>
                Hay riesgo de objetos metálicos o material muy duro en la roca
              </span>
              <br />
              <span style={{ color: G.muted, fontSize: 12 }}>
                pernos, barras de acero u otros materiales difíciles de chancar (inchancables)
              </span>
            </span>
          </label>

          {recError && (
            <div style={{ color: G.red, fontSize: 13, background: "#1a0a0a",
              border: `1px solid ${G.red}`, borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
              {recError}
            </div>
          )}

          <button onClick={handleRecommend} disabled={recLoading || !hasValidProducts}
            style={{ width: "100%", padding: "14px 20px", fontFamily: G.fontD, fontSize: 15,
              fontWeight: 700, border: "none", borderRadius: 8,
              cursor: hasValidProducts ? "pointer" : "not-allowed",
              background: hasValidProducts ? G.accent : G.border,
              color: hasValidProducts ? "#000" : G.muted }}>
            {recLoading ? "Calculando recomendación…" : "¿Qué equipo necesito? →"}
          </button>
        </div>

        {/* ── RECOMENDACIONES ── */}
        {recs !== null && (
          <div className="fi">
            {recs.length === 0 ? (
              <div style={{ ...sec, color: G.muted, textAlign: "center", padding: 40 }}>
                No se encontraron configuraciones para esos parámetros.
                Intenta aumentar el tonelaje mensual o cambiar el tipo de roca.
              </div>
            ) : (
              <>
                <div style={{ fontFamily: G.fontD, fontSize: 17, fontWeight: 700,
                  color: G.text, marginBottom: 16 }}>
                  {recs.length === 1 ? "Recomendación para tu proyecto" : "Recomendaciones para tu proyecto"}
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={lbl}>Cliente (opcional, para el PDF):</label>
                    <input type="text" value={pdfCliente} placeholder="Ej: Minera Ejemplo S.A."
                      onChange={e => setPdfCliente(e.target.value)} style={inp} />
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={lbl}>Nombre del proyecto (opcional):</label>
                    <input type="text" value={pdfProyecto} placeholder="Ej: Proyecto Áridos Norte"
                      onChange={e => setPdfProyecto(e.target.value)} style={inp} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                  {recs.map((rec, idx) => {
                    const pf = Number(rec.product_fit_pct);
                    const pfClr = pf >= 70 ? G.green : pf >= 45 ? G.accent : G.red;
                    const descartePct = rec.descarte_pct ?? (100 - pf);
                    const mesesReq = rec.meses_requeridos ?? 0;
                    const nUnitsTotal = rec.n_units * rec.equipos.length;
                    const nUnitsTotalA = recs[0].n_units * recs[0].equipos.length;
                    const horasMes = Number(horasDia) * Number(diasMes);
                    const optionLabel = idx === 0
                      ? "Opción A — Cumple tu producción con la menor flota"
                      : "Opción B — Alternativa más pequeña (requiere más horas)";
                    const detail = rec.products_detail || [];
                    const totalVolumen = detail.reduce((s, d) => s + (d.volumen_ton || 0), 0);

                    let implicancia;
                    let implicanciaColor = G.muted;
                    if (rec.meses_requeridos === null) {
                      implicancia = "Esta configuración no puede producir alguno de los productos requeridos.";
                      implicanciaColor = G.red;
                    } else if (idx === 0) {
                      implicancia = `Aprovecha ${pf}% del material. Requiere ${nUnitsTotal} unidad${nUnitsTotal !== 1 ? "es" : ""}. Termina en ${mesesReq} meses.`;
                    } else {
                      const pctCumpl = rec.pct_cumplimiento ?? 0;
                      const volLogrado = totalVolumen > 0
                        ? Math.round(pctCumpl / 100 * totalVolumen).toLocaleString()
                        : null;
                      const horasAdicionales = rec.horas_adicionales_mes;
                      implicancia = `Lograría ${pctCumpl}% del volumen en el plazo`;
                      if (volLogrado) implicancia += ` (${volLogrado} t)`;
                      implicancia += ".";
                      if (horasAdicionales && horasAdicionales > 0) {
                        implicancia += ` Agregando ${Math.ceil(horasAdicionales)} horas/mes se logra el volumen en el plazo.`;
                      }
                      implicanciaColor = G.accent;
                    }

                    return (
                      <div key={idx} style={{ background: G.card,
                        border: `1px solid ${G.border}`,
                        borderRadius: 12, padding: 24, display: "grid", gap: 16 }}>
                        <div style={{ fontFamily: G.fontD, fontSize: 16,
                          fontWeight: 700, color: G.text }}>{optionLabel}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {rec.equipos.map((eq, ei) => {
                            const opParam = eq.css_mm != null
                              ? `CSS ${eq.css_mm} mm`
                              : eq.abertura_mm != null
                                ? `malla ${eq.abertura_mm} mm`
                                : null;
                            const tipoLine = eq.tipo_legible || null;
                            const paramLine = [tipoLine, opParam].filter(Boolean).join(" · ");
                            return (
                              <div key={ei} style={{ background: G.surface,
                                border: `1px solid ${G.border}`, borderRadius: 6,
                                padding: "6px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ fontSize: 13, color: G.text, fontWeight: 600 }}>
                                  {eq.marca} {eq.modelo}
                                  <span style={{ fontWeight: 400, color: G.muted, fontSize: 12 }}> o equipo equivalente</span>
                                </span>
                                {paramLine && (
                                  <span style={{ fontSize: 11, color: G.muted }}>
                                    {paramLine}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          {rec.n_units > 1 && (
                            <span style={{ background: G.faint, border: `1px solid ${G.accent}`,
                              borderRadius: 6, padding: "4px 10px", fontSize: 12, color: G.accent,
                              alignSelf: "flex-start" }}>
                              × {rec.n_units} unidades en paralelo
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 14, color: implicanciaColor, lineHeight: 1.6,
                          background: G.surface, borderRadius: 8, padding: "12px 16px" }}>
                          {implicancia}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 28 }}>
                          <div>
                            <div style={{ fontSize: 9, color: G.muted,
                              letterSpacing: "0.1em", marginBottom: 2 }}>PRODUCCIÓN ÚTIL</div>
                            <div style={{ fontFamily: G.fontD, fontSize: 26,
                              fontWeight: 700, color: G.text, lineHeight: 1 }}>{rec.tph_util ?? rec.tph_efectivo} tph</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: G.muted,
                              letterSpacing: "0.1em", marginBottom: 2 }}>MATERIAL EN RANGO</div>
                            <div style={{ fontFamily: G.fontD, fontSize: 26,
                              fontWeight: 700, color: pfClr, lineHeight: 1 }}>{rec.product_fit_pct}%</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: G.muted,
                              letterSpacing: "0.1em", marginBottom: 2 }}>DESCARTADO</div>
                            <div style={{ fontFamily: G.fontD, fontSize: 26,
                              fontWeight: 700, color: descartePct > 35 ? G.red : G.muted, lineHeight: 1 }}>
                              {descartePct}%
                            </div>
                          </div>
                        </div>
                        {detail.length > 0 && (
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse",
                              fontSize: 12, color: G.text }}>
                              <thead>
                                <tr style={{ borderBottom: `1px solid ${G.border}` }}>
                                  <th style={{ textAlign: "left", padding: "4px 8px",
                                    color: G.muted, fontWeight: 600 }}>Producto</th>
                                  <th style={{ textAlign: "right", padding: "4px 8px",
                                    color: G.muted, fontWeight: 600 }}>Producción</th>
                                  <th style={{ textAlign: "right", padding: "4px 8px",
                                    color: G.muted, fontWeight: 600 }}>Vol. req.</th>
                                  <th style={{ textAlign: "right", padding: "4px 8px",
                                    color: G.muted, fontWeight: 600 }}>Meses</th>
                                  <th style={{ textAlign: "center", padding: "4px 8px",
                                    color: G.muted, fontWeight: 600 }}>Plazo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.map((d, di) => (
                                  <tr key={di} style={{ borderBottom: `1px solid ${G.border}20` }}>
                                    <td style={{ padding: "5px 8px" }}>
                                      {d.name || `${d.min_mm}–${d.max_mm} mm`}
                                    </td>
                                    <td style={{ padding: "5px 8px", textAlign: "right" }}>
                                      {d.inalcanzable ? "—" : `${d.tph_out} tph`}
                                    </td>
                                    <td style={{ padding: "5px 8px", textAlign: "right" }}>
                                      {d.volumen_ton ? d.volumen_ton.toLocaleString("es-CL") + " t" : "—"}
                                    </td>
                                    <td style={{ padding: "5px 8px", textAlign: "right" }}>
                                      {d.inalcanzable ? "∞" : d.meses ?? "—"}
                                    </td>
                                    <td style={{ padding: "5px 8px", textAlign: "center",
                                      color: d.inalcanzable ? G.red : d.cumple ? G.green : G.accent }}>
                                      {d.inalcanzable ? "✗ imposible" : d.cumple ? "✓" : "✗"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {rec.inchancables_recomendado && (
                          <div style={{ fontSize: 12, color: G.accent,
                            background: G.faint, borderRadius: 6, padding: "8px 12px" }}>
                            ⚠ Se detectó riesgo de inchancables — considerar separador magnético
                            o detector de metales antes del chancador
                          </div>
                        )}
                        <div style={{ textAlign: "right" }}>
                          <button
                            onClick={() => handleProposal(rec)}
                            style={{ padding: "8px 18px", background: "transparent",
                              border: `1px solid ${G.accent}`, borderRadius: 8,
                              color: G.accent, cursor: "pointer",
                              fontSize: 12, fontFamily: G.font }}>
                            ↓ Descargar propuesta (PDF)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {recs.length === 1 && (
                    <div style={{ fontSize: 13, color: G.muted, textAlign: "center",
                      padding: "8px 0", fontStyle: "italic" }}>
                      Con estos requisitos no hay una alternativa con menos equipos.
                    </div>
                  )}
                </div>

                <div style={{ textAlign: "center" }}>
                  <button
                    onClick={() => { setShowCmp(v => !v); setCmpResult(null); setCmpError(null); }}
                    style={{ padding: "10px 22px", background: G.card,
                      border: `1px solid ${showCmp ? G.accent : G.border}`,
                      borderRadius: 8, color: showCmp ? G.accent : G.text,
                      cursor: "pointer", fontSize: 13, fontFamily: G.font }}>
                    {showCmp ? "▲ Cerrar comparación" : "↕ Comparar con mi propia idea"}
                  </button>
                </div>

                {/* ── COMPARACIÓN ── */}
                {showCmp && (
                  <div style={{ ...sec, marginTop: 16 }} className="fi">
                    <div style={{ fontFamily: G.fontD, fontSize: 16, fontWeight: 700,
                      color: G.text, marginBottom: 18 }}>
                      Compara con tu configuración actual
                    </div>

                    {recs.length > 1 && (
                      <div style={{ marginBottom: 16 }}>
                        <label style={lbl}>Comparar contra:</label>
                        <select value={cmpSugIdx}
                          onChange={e => { setCmpSugIdx(Number(e.target.value)); setCmpResult(null); }}
                          style={inp}>
                          {recs.map((r, i) => (
                            <option key={i} value={i}>
                              {CFG_LABELS[r.config] || r.config} — {r.tph_efectivo} tph
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <label style={{ ...lbl, marginBottom: 10 }}>
                      Tus equipos (agrega uno por etapa):
                    </label>
                    {cmpEquipos.map((eq, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10,
                        flexWrap: "wrap", alignItems: "center" }}>
                        <select value={eq.etapa} onChange={e => updateEq(i, "etapa", e.target.value)}
                          style={{ ...inp, flex: "0 0 200px", width: "auto" }}>
                          {ETAPA_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <select value={eq.marca} onChange={e => updateEq(i, "marca", e.target.value)}
                          style={{ ...inp, flex: "0 0 165px", width: "auto" }}>
                          <option value="">— Marca —</option>
                          {brandsByEtapa(eq.etapa).map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <select value={eq.modelo} onChange={e => updateEq(i, "modelo", e.target.value)}
                          style={{ ...inp, flex: "0 0 150px", width: "auto" }} disabled={!eq.marca}>
                          <option value="">— Modelo —</option>
                          {modelsByEtapaBrand(eq.etapa, eq.marca).map(m =>
                            <option key={m} value={m}>{m}</option>)}
                        </select>
                        {cmpEquipos.length > 1 && (
                          <button onClick={() => setCmpEquipos(prev => prev.filter((_, idx) => idx !== i))}
                            style={{ background: "none", border: "none", color: G.red,
                              cursor: "pointer", fontSize: 20, padding: "0 4px", lineHeight: 1 }}>
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {cmpEquipos.length < 3 && (
                      <button
                        onClick={() => setCmpEquipos(prev => [...prev, { etapa: "screen", marca: "", modelo: "" }])}
                        style={{ fontSize: 12, color: G.accent, background: "none", border: "none",
                          cursor: "pointer", padding: "4px 0", marginBottom: 14 }}>
                        + Agregar equipo
                      </button>
                    )}

                    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <label style={lbl}>Tipo de circuito:</label>
                        <select value={cmpCircuit} onChange={e => setCmpCircuit(e.target.value)} style={inp}>
                          <option value="open">Circuito abierto — el material pasa una sola vez</option>
                          <option value="closed">Circuito cerrado — el material grueso recircula</option>
                        </select>
                      </div>
                      <div style={{ flex: 0, minWidth: 100 }}>
                        <label style={lbl}>Unidades:</label>
                        <input type="number" value={cmpN} min={1} max={4}
                          onChange={e => setCmpN(e.target.value)} style={inp} />
                      </div>
                    </div>

                    {cmpError && (
                      <div style={{ color: G.red, fontSize: 13, background: "#1a0a0a",
                        border: `1px solid ${G.red}`, borderRadius: 8,
                        padding: "10px 14px", marginBottom: 12 }}>
                        {cmpError}
                      </div>
                    )}

                    <button onClick={handleCompare} disabled={cmpLoading}
                      style={{ width: "100%", padding: "12px 20px", fontFamily: G.fontD,
                        fontSize: 14, fontWeight: 700, border: "none", borderRadius: 8,
                        cursor: cmpLoading ? "not-allowed" : "pointer",
                        background: G.accent, color: "#000" }}>
                      {cmpLoading ? "Comparando…" : "Comparar →"}
                    </button>

                    {cmpResult && (
                      <div style={{ marginTop: 22 }} className="fi">
                        <div style={{ fontFamily: G.fontD, fontSize: 15, fontWeight: 700,
                          color: G.text, marginBottom: 14 }}>Tabla comparativa</div>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ borderBottom: `2px solid ${G.border}` }}>
                                <th style={{ textAlign: "left", padding: "8px 12px",
                                  color: G.muted, fontWeight: 600, fontSize: 12 }}>Indicador</th>
                                <th style={{ textAlign: "center", padding: "8px 12px",
                                  color: G.text, fontWeight: 700 }}>
                                  Mi configuración
                                  <div style={{ fontSize: 11, fontWeight: 400, color: G.muted, marginTop: 2 }}>
                                    {cmpEquipos.map(e => e.modelo).filter(Boolean).join(" + ") || "—"}
                                  </div>
                                </th>
                                <th style={{ textAlign: "center", padding: "8px 12px",
                                  color: G.accent, fontWeight: 700 }}>
                                  Recomendación KrushRock
                                  <div style={{ fontSize: 11, fontWeight: 400, color: G.muted, marginTop: 2 }}>
                                    {recs[Math.min(cmpSugIdx, recs.length - 1)].equipos.map(e => e.modelo).join(" + ")}
                                  </div>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {CMP_META.map(meta => {
                                const row = cmpResult.find(r => r.indicador === meta.key);
                                if (!row) return null;
                                return (
                                  <tr key={meta.key}
                                    style={{ borderBottom: `1px solid ${G.faint}` }}>
                                    <td style={{ padding: "10px 12px", color: G.muted }}>
                                      {meta.label}
                                    </td>
                                    <td style={{ padding: "10px 12px", textAlign: "center",
                                      fontWeight: 700, color: G.text }}>
                                      {fmtVal(meta.key, row.usuario)}
                                      {row.usuario !== null && row.usuario !== undefined
                                        ? fmtUnit(meta.key, row.unidad) : ""}
                                    </td>
                                    <td style={{ padding: "10px 12px", textAlign: "center",
                                      fontWeight: 700, color: G.text }}>
                                      {fmtVal(meta.key, row.sugerida)}
                                      {row.sugerida !== null && row.sugerida !== undefined
                                        ? fmtUnit(meta.key, row.unidad) : ""}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
