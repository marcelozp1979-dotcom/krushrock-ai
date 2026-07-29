import { useState } from "react";
import { ROCK_DB, ROCK_CATS, CAT_LABELS } from "../catalogo.js";
import {
  G, GCSS, API_BASE,
  EXTRACTION_LABELS, EXTRACTION_UNITS, STANDARD_INCH_VALUES,
  parsePositiveNumber, extractJsonFromText, normalizeExtractionResult,
  toMm, fromMm, unitLabel, parseMeasureToMm, formatInches,
} from "../shared.js";
import { SectionTitle, B } from "./BaseComponents.jsx";

const DEF_PRODS = [
  { id: 1, active: true, label: "", minMm: 76.2, maxMm: 9999, targetTon: 0 },
  { id: 2, active: true, label: "", minMm: 50.8, maxMm: 76.2, targetTon: 0 },
  { id: 3, active: true, label: "", minMm: 25.4, maxMm: 50.8, targetTon: 0 },
  { id: 4, active: true, label: "", minMm: 0, maxMm: 25.4, targetTon: 0 },
];

// ── CURVA GRANULOMÉTRICA — 11 puntos ──────────────────────────────────────
const CURVE_LEVELS = [
  { label: "F95", pct: 95 },
  { label: "F90", pct: 90 },
  { label: "F80", pct: 80 },
  { label: "F70", pct: 70 },
  { label: "F63", pct: 63 },
  { label: "F60", pct: 60 },
  { label: "F50", pct: 50 },
  { label: "F40", pct: 40 },
  { label: "F30", pct: 30 },
  { label: "F25", pct: 25 },
  { label: "F20", pct: 20 },
  { label: "F15", pct: 15 },
  { label: "F10", pct: 10 },
  { label: "F5",  pct: 5  },
  { label: "F3",  pct: 3  },
  { label: "F2",  pct: 2  },
  { label: "F1",  pct: 1  },
];

// ── ONBOARDING ─────────────────────────────────────────────────────────────
export default function Onboarding({
  onDone,
  savedSims = [],
  onDeleteSim,
  initialInp = null,
  initialStep = 0,
  cancelEdit = null,
  eqCatalog = null,
}) {
  const init = initialInp || {};
  const [step, setStep] = useState(initialStep || 0);
  const [unit, setUnit] = useState(init.unit || "mm");
  const [rockKey, setRockKey] = useState(init.rockKey || "");
  const [rockCat, setRockCat] = useState(init.rockCat || null);
  const [cName, setCName] = useState(init.customName || "");
  const [cWi, setCWi] = useState(init.customWi || 13);
  const [cDen, setCDen] = useState(init.customDen || 2.7);
  const [cAb, setCAb] = useState(init.customAb || 0.2);
  const [f80, setF80] = useState(init.f80 || 400);
  const [prods, setProds] = useState(init.products || DEF_PRODS);
  const [humidity, setHum] = useState(
    init.humidity === undefined ? null : init.humidity,
  );
  const [altitude, setAlt] = useState(init.altitude || 0);
  const [altitudeOmit, setAltOmit] = useState(init.altitudeOmit || false);
  const [curveType, setCurve] = useState(init.curveType || "f80only");
  const [f50, setF50] = useState(init.f50 || 200);
  const [curvePoints, setCurvePoints] = useState(
    init.curvePoints || CURVE_LEVELS.map((l) => ({ ...l, sizeMm: 0 })),
  );
  const [conePerfil, setConePerfil] = useState(init.conePerfil || "M");
  const [manConeCSS, setManConeCSS] = useState(init.manConeCSS || null);
  const [sugPerfil, setSugPerfil] = useState(init.sugPerfil || null);
  const [plazoMeses, setPlazoMeses] = useState(init.plazoMeses || 1);
  const [riesgoInchancable, setRiesgoInchancable] = useState(init.riesgoInchancable || false);
  const [started, setStarted] = useState(
    Boolean(initialInp || initialStep > 0),
  );
  const [circPath, setCircPath] = useState(init.circPath || null);
  const [manualEq, setManualEq] = useState(
    init.manualEq || {
      jaw: true,
      cone: true,
      hsi: false,
      screen3d: false,
      screen2d: true,
      screen1d: false,
      screen_hf: false,
      scalper: false,
      recirculation: true,
    },
  );
  const [manBrand, setManBrand] = useState(
    init.manBrand || {
      jaw: "",
      cone: "",
      hsi: "",
      screen3d: "",
      screen2d: "",
      screen1d: "",
      screen_hf: "",
      scalper: "",
    },
  );
  const [manModel, setManModel] = useState(
    init.manModel || {
      jaw: "",
      cone: "",
      hsi: "",
      screen3d: "",
      screen2d: "",
      screen1d: "",
      screen_hf: "",
      scalper: "",
    },
  );
  const [availEquip, setAvail] = useState(
    init.availEquip || [{ id: 1, type: "jaw", brand: "", model: "" }],
  );
  const [measureErrors, setMeasureErrors] = useState({});
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [panelValues, setPanelValues] = useState(null);
  const [panelEdited, setPanelEdited] = useState({});
  const [panelFieldErrors, setPanelFieldErrors] = useState({});
  const [showAssumptions, setShowAssumptions] = useState(true);
  const [overrideTph, setOverrideTph] = useState(null);
  const [aiPrefilled, setAiPrefilled] = useState({});

  // Catálogo de equipos indexado por tipo — siempre viene del backend vía prop
  const _EQ = eqCatalog || {};
  const EQ_BY_CAT = {
    jaw:       _EQ.jaw       || [],
    cone:      _EQ.cone      || [],
    hsi:       _EQ.hsi       || [],
    screen3d:  (_EQ.screen   || []).filter((e) => e.decks === 3),
    screen2d:  (_EQ.screen   || []).filter((e) => e.decks === 2),
    screen1d:  _EQ.screen_1d || [],
    screen_hf: _EQ.screen_hf || [],
  };

  const STEP_ITEMS = [
    { id: 0, label: "Tipo de roca" },
    { id: 1, label: "Curva granulométrica" },
    { id: 2, label: "Productos" },
    { id: 3, label: "Condiciones" },
    { id: 4, label: "Circuito" },
  ];

  const TOTAL = 5;
  const pct = (step / TOTAL) * 100;
  const next = () => setStep((s) => Math.min(s + 1, TOTAL - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const ul = unitLabel(unit);
  const disp = (mm) => fromMm(mm, unit);
  const toMmU = (v) => parseMeasureToMm(v, unit).mm;
  const setMeasureError = (key, msg) =>
    setMeasureErrors((prev) => ({ ...prev, [key]: msg }));
  const clearMeasureError = (key) =>
    setMeasureErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  const measureHint = (mm) => {
    if (unit !== "in") return null;
    return `≈ ${formatInches(mm)}${unitLabel(unit)} = ${mm.toFixed(1)} mm`;
  };
  const inchQuickButtons = (onPick) =>
    unit === "in" ? (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {STANDARD_INCH_VALUES.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => onPick(label)}
            style={{
              padding: "4px 8px",
              fontSize: 12,
              borderRadius: 4,
              border: `1px solid ${G.border}`,
              background: G.card,
              cursor: "pointer",
            }}
          >
            {label}"
          </button>
        ))}
      </div>
    ) : null;

  const upProd = (id, field, raw) => {
    if (field === "label") {
      setProds((ps) => ps.map((p) => (p.id === id ? { ...p, label: raw } : p)));
      return;
    }
    if (field === "targetTon") {
      setProds((ps) =>
        ps.map((p) =>
          p.id === id ? { ...p, targetTon: Math.max(0, Number(raw) || 0) } : p,
        ),
      );
      return;
    }
    if (raw === "∞") {
      clearMeasureError(`${id}-${field}`);
      setProds((ps) =>
        ps.map((p) => (p.id === id ? { ...p, [field]: 9999 } : p)),
      );
      return;
    }
    const parsed = parseMeasureToMm(raw, unit);
    if (parsed.error) {
      setMeasureError(`${id}-${field}`, parsed.error);
      return;
    }
    clearMeasureError(`${id}-${field}`);
    setProds((ps) =>
      ps.map((p) => (p.id === id ? { ...p, [field]: parsed.mm } : p)),
    );
  };
  const togProd = (id) =>
    setProds((ps) =>
      ps.map((p) => (p.id === id ? { ...p, active: !p.active } : p)),
    );

  const updCurvePoint = (label, raw) => {
    const parsed = parseMeasureToMm(raw, unit);
    if (parsed.error) {
      setMeasureError(`curve-${label}`, parsed.error);
      return;
    }
    clearMeasureError(`curve-${label}`);
    setCurvePoints((pts) =>
      pts.map((p) => (p.label === label ? { ...p, sizeMm: parsed.mm } : p)),
    );
  };

  const setPanelField = (key, value) => {
    setPanelValues((prev) => ({ ...prev, [key]: value }));
    setPanelEdited((prev) => ({ ...prev, [key]: true }));
  };

  const validatePanel = (values) => {
    const errors = {};
    const v = values || panelValues || {};
    const positive = (k, min = 0, max = Infinity) => {
      const n = parsePositiveNumber(v[k]);
      if (n === null) return null;
      if (n < min || n > max) errors[k] = true;
      return n;
    };
    const work = positive("work_index", 0);
    const fmax = positive("f_max_mm", 0);
    const pmax = positive("p_max_mm", 0);
    const cap = positive("capacidad_tph", 10, 5000);
    const den = positive("densidad_tm3", 0.8, 4.0);
    positive("css_primario_mm", 5, 300);
    positive("css_secundario_mm", 5, 300);
    if (fmax !== null && pmax !== null && fmax <= pmax) {
      errors.p_max_mm = true;
      errors.f_max_mm = true;
    }
    setPanelFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearExtraction = () => {
    setExtractError("");
    setPanelValues(null);
    setPanelEdited({});
    setPanelFieldErrors({});
    setShowAssumptions(true);
  };

  const openPasteModal = () => {
    clearExtraction();
    setPasteText("");
    setPasteModalOpen(true);
  };

  const closePasteModal = () => {
    setPasteModalOpen(false);
    setExtracting(false);
    setExtractError("");
  };

  const confirmPanel = () => {
    if (!panelValues) return;
    if (!validatePanel(panelValues)) {
      setExtractError("Corrige los valores marcados en rojo antes de confirmar.");
      return;
    }

    // Aplicar valores de roca
    const tipoKey = panelValues.tipo_roca_key || "desconocida";
    const hasRock = tipoKey !== "desconocida" || panelValues.tipo_roca;
    if (tipoKey === "desconocida") {
      setRockKey("personalizada");
      setRockCat("manual");
      setCName(panelValues.tipo_roca || "Material personalizado");
    } else {
      setRockKey(tipoKey);
      const category = Object.entries(ROCK_CATS).find(([, keys]) => keys.includes(tipoKey));
      setRockCat(category ? category[0] : null);
      setCName(ROCK_DB[tipoKey]?.name || panelValues.tipo_roca || "");
    }
    if (panelValues.work_index !== null) setCWi(panelValues.work_index);
    if (panelValues.densidad_tm3 !== null) setCDen(panelValues.densidad_tm3);

    // Aplicar horizonte de producción
    if (panelValues.plazo_meses !== null && panelValues.plazo_meses >= 1) {
      setPlazoMeses(Math.round(panelValues.plazo_meses));
    }

    // Aplicar valores de granulometría
    // Si no hay F80 pero sí F_max, estimarlo como 75% del F_max (distribución ROM típica)
    const hasF80 = panelValues.f80_mm !== null;
    const hasFmax = panelValues.f_max_mm !== null;
    let f80Estimated = false;
    if (hasF80) {
      setF80(panelValues.f80_mm);
    } else if (hasFmax) {
      const estimado = Math.round(panelValues.f_max_mm * 0.75);
      setF80(Math.max(50, estimado));
      f80Estimated = true;
    }
    if (panelValues.capacidad_tph !== null) setOverrideTph(panelValues.capacidad_tph);

    // Aplicar producto extraído: si hay p_max_mm, crear un solo producto activo
    if (panelValues.p_max_mm !== null && panelValues.p_max_mm > 0) {
      setProds([
        { id: 1, active: true, label: "", minMm: 0, maxMm: panelValues.p_max_mm, targetTon: 0 },
        { id: 2, active: false, label: "", minMm: 0, maxMm: 9999, targetTon: 0 },
        { id: 3, active: false, label: "", minMm: 0, maxMm: 9999, targetTon: 0 },
        { id: 4, active: false, label: "", minMm: 0, maxMm: 9999, targetTon: 0 },
      ]);
    }

    // Registrar qué se pre-llenó para mostrar banners
    const filled = {};
    if (hasRock) filled.rock = true;
    if (hasF80 || f80Estimated) filled.f80 = true;
    if (f80Estimated) filled.f80Estimated = true;
    if (hasFmax) filled.fmax = true;
    if (panelValues.capacidad_tph !== null) filled.tph = true;
    if (panelValues.work_index !== null) filled.wi = true;
    if (panelValues.densidad_tm3 !== null) filled.den = true;
    if (panelValues.plazo_meses !== null) filled.plazo = true;
    if (panelValues.p_max_mm !== null) filled.producto = true;
    setAiPrefilled(filled);

    // Avanzar al primer paso que aún necesita input del usuario:
    //   Roca + F80 (real o estimado) → saltar a Step 2 (Productos)
    //   Solo roca conocida           → saltar a Step 1 (Granulometría)
    //   Ninguno                      → quedar en Step 0
    if (hasRock && (hasF80 || f80Estimated)) {
      setStep(2);
    } else if (hasRock) {
      setStep(1);
    }
    // si no hay nada útil, quedamos en step 0

    setPasteModalOpen(false);
    setExtractError("");
  };

  const runExtraction = async () => {
    if (pasteText.trim().length < 20) {
      setExtractError("El texto es muy corto para extraer datos.");
      return;
    }
    setExtractError("");
    setExtracting(true);
    try {
      const response = await fetch(`${API_BASE}/ai/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(`API ${response.status}: ${errBody?.detail || response.statusText}`);
      }
      const data = await response.json();
      const content = data.content || "";
      const payload = extractJsonFromText(content);
      const normalized = normalizeExtractionResult(payload);
      const technicalKeys = [
        "tipo_roca",
        "work_index",
        "f_max_mm",
        "f80_mm",
        "capacidad_tph",
        "densidad_tm3",
        "p_max_mm",
        "p80_mm",
        "css_primario_mm",
        "css_secundario_mm",
      ];
      const hasTechnical = technicalKeys.some((key) => normalized[key] !== null);
      if (!hasTechnical) {
        setExtractError(
          "⚠️ No se encontraron datos técnicos en el texto. ¿Incluye información sobre tamaños de roca, capacidad o tipo de material?",
        );
        setPanelValues(null);
        return;
      }
      setPanelValues(normalized);
      setPanelEdited({});
      setPanelFieldErrors({});
      setShowAssumptions(true);
    } catch (err) {
      if (err.message === "No JSON found" || err instanceof SyntaxError) {
        setExtractError(
          "⚠️ No se pudo interpretar la respuesta. Intenta con un texto más detallado.",
        );
      } else {
        setExtractError(
          "⚠️ No se pudo conectar con el servicio de extracción. Intenta nuevamente o ingresa los datos manualmente.",
        );
      }
      setPanelValues(null);
    } finally {
      setExtracting(false);
    }
  };

  const getFieldAppearance = (key) => {
    const missing = panelValues?.[key] === null;
    const edited = Boolean(panelEdited[key]);
    const border = edited
      ? G.blue
      : missing
      ? "#F59E0B"
      : "#10B981";
    const background = edited
      ? "rgba(59,130,246,0.12)"
      : missing
      ? "rgba(254,243,199,0.12)"
      : "rgba(16,185,129,0.12)";
    return { border, background };
  };

  const getRockSelectLabel = (key) => {
    if (!key || key === "desconocida") return "Otro material (no listado)";
    return ROCK_DB[key]?.name || "Otro material";
  };

  const setRockKeyFromPanel = (key) => {
    setPanelValues((prev) => {
      const label = key === "desconocida" ? prev.tipo_roca : ROCK_DB[key]?.name;
      return {
        ...prev,
        tipo_roca_key: key,
        tipo_roca: label || prev.tipo_roca,
      };
    });
    setPanelEdited((prev) => ({ ...prev, tipo_roca: true }));
  };

  const displayPanelField = (key) => {
    const value = panelValues?.[key];
    if (value === null) return "";
    return String(value);
  };

  const PBtn = ({ label, onClick, disabled }) => (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "11px 24px",
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? G.border : G.accent,
        border: "none",
        fontFamily: G.fontD,
        fontWeight: 700,
        fontSize: 14,
        color: "#000",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
  const SBtn = ({ label, onClick }) => (
    <button
      onClick={onClick}
      style={{
        padding: "11px 18px",
        borderRadius: 8,
        cursor: "pointer",
        background: "transparent",
        border: `1px solid ${G.border}`,
        fontFamily: G.font,
        fontSize: 13,
        color: G.muted,
      }}
    >
      {label}
    </button>
  );
  const QBubble = ({ q, hint }) => (
    <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          flexShrink: 0,
          background: `linear-gradient(135deg,${G.accent},#d97706)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 17,
        }}
      >
        ◈
      </div>
      <div
        style={{
          background: G.card,
          border: `1px solid ${G.border}`,
          borderRadius: "4px 12px 12px 12px",
          padding: "13px 16px",
          flex: 1,
        }}
      >
        <div
          style={{
            fontFamily: G.fontD,
            fontWeight: 600,
            fontSize: 15,
            color: G.accent,
            marginBottom: 4,
          }}
        >
          {q}
        </div>
        <div style={{ fontSize: 12, color: G.muted }}>{hint}</div>
      </div>
    </div>
  );
  const OptBtn = ({ val, label, sub, active, color, onClick }) => (
    <button
      onClick={onClick}
      style={{
        background: active ? `${G.accentDim}33` : G.card,
        border: `1px solid ${active ? color || G.accent : G.border}`,
        borderRadius: 8,
        padding: "12px 16px",
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        transition: "all .15s",
      }}
    >
      <div>
        <div
          style={{ fontSize: 14, color: active ? color || G.accent : G.text }}
        >
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
      {active && <span style={{ color: color || G.accent }}>✓</span>}
    </button>
  );

  const finish = () => {
    let ef80 = f80;
    if (curveType === "full") {
      const pt = curvePoints.find((p) => p.label === "F80");
      if (pt && pt.sizeMm > 0) ef80 = pt.sizeMm;
    }
    // Derive TPH from product ton targets (8h × 2turnos × 5días × 4.33sem × 80% × 85% ≈ 236h/mes efectivas)
    const totalTargetTon = prods
      .filter((p) => p.active)
      .reduce((s, p) => s + (Number(p.targetTon) || 0), 0);
    const effHrsPerMonth = 8 * 2 * 5 * 4.33 * 0.8 * 0.85;
    const derivedTph = overrideTph ||
      (totalTargetTon > 0
        ? Math.max(
            10,
            Math.min(
              1000,
              Math.round(totalTargetTon / (plazoMeses * effHrsPerMonth)),
            ),
          )
        : 0);
    const activeProds = prods.filter((p) => p.active);
    const recDecks =
      activeProds.length >= 3 ? 3 : activeProds.length >= 2 ? 2 : 1;
    onDone({
      rockKey,
      customName: cName,
      customWi: cWi,
      customDen: cDen,
      customAb: cAb,
      unit,
      tph: derivedTph,
      tphOmit: totalTargetTon === 0,
      f80: ef80,
      products: prods,
      humidity,
      altitude,
      altitudeOmit,
      curveType,
      f50,
      curvePoints,
      circPath,
      manualEq,
      manBrand,
      manModel,
      availEquip,
      conePerfil,
      manConeCSS,
      meshDecks: { 1: 0, 2: 0, 3: 0 },
      screenDecks: recDecks,
      plazoMeses,
      riesgoInchancable,
      circuit: circPath === "ai" ? "ai" : "cerrado",
    });
  };

  const validateSimulationInputs = () => {
    const missing = [];
    const add = (text, stepId) => missing.push({ text, step: stepId });
    if (!rockKey) add("Selecciona un tipo de roca.", 0);
    if (rockKey === "personalizada") {
      if (!cWi || cWi <= 0)
        add("Ingresa Wi válido para material personalizado.", 0);
      if (!cDen || cDen <= 0)
        add("Ingresa densidad válida para material personalizado.", 0);
      if (cAb === null || cAb === undefined || cAb < 0)
        add("Ingresa abrasividad (Ab) válida para material personalizado.", 0);
    }
    if (!f80 || f80 <= 0) add("Ingresa un valor F80 válido.", 1);
    const totalTargetTonVal = prods.filter((p) => p.active).reduce((s, p) => s + (Number(p.targetTon) || 0), 0);
    if (!overrideTph && !totalTargetTonVal) {
      add("Ingresa la capacidad en tph (paso Curva granulométrica) o una meta de tonelaje en algún producto (paso Productos) — sin eso la simulación no tiene datos de producción.", 1);
    }
    if (curveType === "full") {
      const validCurvePts = curvePoints.filter((p) => p.sizeMm > 0).length;
      if (validCurvePts < 2)
        add("Ingresa al menos 2 puntos válidos en la curva granulométrica.", 1);
    }
    if (!circPath) add("Elige una configuración de circuito.", 4);
    const activeProds = prods.filter((p) => p.active);
    if (activeProds.length === 0)
      add("Activa al menos un producto para simular.", 2);
    activeProds.forEach((p, index) => {
      if (p.minMm === null || p.minMm === undefined || Number.isNaN(p.minMm))
        add(`Producto ${index + 1}: falta tamaño mínimo.`, 2);
      if (p.maxMm === null || p.maxMm === undefined || Number.isNaN(p.maxMm))
        add(`Producto ${index + 1}: falta tamaño máximo.`, 2);
      if (p.minMm > p.maxMm)
        add(
          `Producto ${index + 1}: el mínimo debe ser menor o igual al máximo.`,
          2,
        );
    });
    if (Object.keys(measureErrors).length > 0) {
      Object.entries(measureErrors).forEach(([key, error]) => {
        if (key.startsWith("curve-")) add(error, 1);
        else if (key.startsWith("f80") || key.startsWith("f50")) add(error, 1);
        else if (key.includes("-min") || key.includes("-max")) add(error, 2);
        else add(error, 3);
      });
    }
    if (circPath === "available") {
      const invalidModel = availEquip.some(
        (e) => !e.brand.trim() || !e.model.trim(),
      );
      if (invalidModel)
        add("Completa marca y modelo de todos los equipos disponibles.", 4);
    }
    return missing;
  };

  const simValidationMessages = validateSimulationInputs();
  const simDisabled = simValidationMessages.length > 0;

  const SimulateNotice = () => {
    if (!simDisabled) return null;
    return (
      <div
        style={{
          background: G.faint,
          border: `1px solid ${G.border}`,
          borderRadius: 8,
          padding: 14,
          color: G.text,
          fontSize: 12,
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          Completa estos datos antes de simular:
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          {simValidationMessages.map((msg, i) => (
            <li
              key={i}
              onClick={() => setStep(msg.step)}
              style={{
                cursor: "pointer",
                color: G.accent,
                textDecoration: "underline",
                marginBottom: 6,
              }}
            >
              <strong>{`Paso ${msg.step + 1}`}</strong> — {msg.text}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const QUES = [
    "¿Qué tipo de roca o mineral vas a procesar?",
    "¿Cuentas con la curva granulométrica de ingreso?",
    "¿Qué productos necesitas obtener?",
    "Condiciones de operación",
    "¿Cómo configuras el circuito?",
  ];
  const HINTS = [
    "Determina el índice de trabajo (Wi) y abrasividad",
    "Mientras más datos ingreses, menor será el error estimado",
    "Define fracciones y tonelaje objetivo — el TPH se calculará automáticamente",
    "Altitud y humedad afectan el rendimiento real de equipos",
    "3 opciones: IA automática, selección manual o equipos disponibles",
  ];

  const rockEntries = [
    ...Object.entries(ROCK_DB),
    [
      "personalizada",
      {
        name: "Material personalizado",
        desc: "Ingreso manual de Wi y densidad",
      },
    ],
  ];
  const actP = prods.filter((p) => p.active);
  const fineP80s = actP
    .filter((p) => p.maxMm > 0 && p.maxMm < 9999)
    .map((p) => p.maxMm);
  const p80Prev = fineP80s.length > 0 ? Math.min(...fineP80s, f80) : f80;
  const totalTargetTonPreview = actP.reduce(
    (s, p) => s + (Number(p.targetTon) || 0),
    0,
  );
  const derivedTphPreview =
    totalTargetTonPreview > 0
      ? Math.max(
          10,
          Math.min(
            1000,
            Math.round(
              totalTargetTonPreview /
                (plazoMeses * 8 * 2 * 5 * 4.33 * 0.8 * 0.85),
            ),
          ),
        )
      : null;
  const suggestConePerfil = () => {
    const wi =
      rockKey === "personalizada"
        ? Number(cWi) || 13
        : ROCK_DB[rockKey]?.wi || 13;
    const finest = p80Prev < 9999 ? p80Prev : 50;
    const profiles = ["EF", "F", "M", "C", "EC"];
    let idx =
      finest <= 20
        ? 0
        : finest <= 32
          ? 1
          : finest <= 50
            ? 2
            : finest <= 80
              ? 3
              : 4;
    if (wi > 16) idx = Math.min(4, idx + 1);
    else if (wi < 10) idx = Math.max(0, idx - 1);
    setConePerfil(profiles[idx]);
    setSugPerfil(profiles[idx]);
  };

  const validCurvePts = (curvePoints || []).filter((p) => p.sizeMm > 0).length;

  if (!started) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: G.bg,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <style>{GCSS}</style>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${G.border}`,
            background: G.surface,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `linear-gradient(135deg,${G.accent},#d97706)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: G.fontD,
              fontWeight: 800,
              fontSize: 15,
              color: "#000",
            }}
          >
            KR
          </div>
          <div>
            <div
              style={{
                fontFamily: G.fontD,
                fontWeight: 700,
                fontSize: 16,
                color: G.accent,
              }}
            >
              KrushRock
            </div>
            <div
              style={{ fontSize: 10, color: G.muted, letterSpacing: "0.1em" }}
            >
              SIMULADOR DE CHANCADO Y SELECCIÓN
            </div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 11, color: G.muted, marginRight: 4 }}>
              Unidad:
            </span>
            {["mm", "cm", "in"].map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                style={{
                  padding: "4px 11px",
                  borderRadius: 5,
                  cursor: "pointer",
                  fontFamily: G.font,
                  fontSize: 12,
                  border: `1px solid ${unit === u ? G.accent : G.border}`,
                  background: unit === u ? `${G.accentDim}44` : G.card,
                  color: unit === u ? G.accent : G.muted,
                }}
              >
                {u === "in" ? '"' : u}
              </button>
            ))}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px 20px",
          }}
        >
          <div style={{ maxWidth: 560, width: "100%" }} className="fi">
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div
                style={{
                  fontFamily: G.fontD,
                  fontWeight: 800,
                  fontSize: 32,
                  color: G.accent,
                  letterSpacing: "-0.02em",
                  marginBottom: 6,
                }}
              >
                KrushRock
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: G.muted,
                  letterSpacing: "0.08em",
                  marginBottom: 12,
                }}
              >
                SIMULADOR DE PLANTAS DE CHANCADO MÓVIL
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: G.text,
                  lineHeight: 1.7,
                  maxWidth: 420,
                  margin: "0 auto",
                }}
              >
                Motor de simulación Bond + Whiten + OPEX. Ingresa los parámetros
                de tu material y operación — el sistema calcula el circuito
                óptimo.
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {[
                {
                  n: "01",
                  label: "Tipo de roca",
                  sub: "Wi Bond · abrasividad · densidad",
                  color: G.accent,
                },
                {
                  n: "02",
                  label: "Curva granulom.",
                  sub: "F80 · distribución de tamaños",
                  color: G.blue,
                },
                {
                  n: "03",
                  label: "Productos",
                  sub: "Fracciones · tonelaje objetivo",
                  color: G.purple,
                },
                {
                  n: "04",
                  label: "Condiciones",
                  sub: "Altitud · humedad",
                  color: G.cyan,
                },
                {
                  n: "05",
                  label: "Circuito",
                  sub: "Equipos · topología · marca",
                  color: G.green,
                },
              ].map((item) => (
                <div
                  key={item.n}
                  style={{
                    background: G.card,
                    border: `1px solid ${G.border}`,
                    borderRadius: 8,
                    padding: "8px 12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: item.color,
                      letterSpacing: "0.1em",
                      marginBottom: 4,
                    }}
                  >
                    {item.n}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: G.text,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: 10, color: G.muted }}>{item.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => setStarted(true)}
                style={{
                  padding: "10px 32px",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: `linear-gradient(135deg,${G.accent},#d97706)`,
                  border: "none",
                  fontFamily: G.fontD,
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#000",
                  letterSpacing: "0.02em",
                }}
              >
                Comenzar simulación →
              </button>
              <div style={{ marginTop: 8, fontSize: 11, color: G.muted }}>
                5 pasos · sin datos obligatorios · resultados instantáneos
              </div>
            </div>

            {savedSims.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: G.accent,
                    letterSpacing: "0.1em",
                    marginBottom: 12,
                    fontFamily: G.font,
                    borderLeft: `3px solid ${G.accent}`,
                    paddingLeft: 8,
                  }}
                >
                  ◈ SIMULACIONES GUARDADAS — {savedSims.length}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {savedSims.map((s) => {
                    const fecha = new Date(s.fecha).toLocaleDateString(
                      "es-CL",
                      { day: "2-digit", month: "2-digit", year: "2-digit" },
                    );
                    const scoreColor =
                      s.score >= 75
                        ? G.green
                        : s.score >= 55
                          ? G.accent
                          : G.red;
                    return (
                      <div
                        key={s.id}
                        style={{
                          background: G.card,
                          border: `1px solid ${G.border}`,
                          borderRadius: 8,
                          padding: "11px 14px",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "baseline",
                              flexWrap: "wrap",
                              marginBottom: 2,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                color: G.accent,
                                fontWeight: 600,
                              }}
                            >
                              {s.cliente || "Sin cliente"}
                            </span>
                            {s.proyecto && (
                              <span style={{ fontSize: 11, color: G.muted }}>
                                · {s.proyecto}
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: 10,
                                color: G.muted,
                                marginLeft: "auto",
                              }}
                            >
                              {fecha}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: G.muted }}>
                            {s.rockName} · {s.tph} tph · P80 {s.p80}mm
                            <span style={{ color: scoreColor, marginLeft: 8 }}>
                              Score {s.score}/100
                            </span>
                            <span style={{ marginLeft: 6 }}>
                              · ±{s.errPct}%
                            </span>
                          </div>
                          {s.notas && (
                            <div
                              style={{
                                fontSize: 10,
                                color: G.muted,
                                marginTop: 2,
                                fontStyle: "italic",
                              }}
                            >
                              {s.notas}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => onDeleteSim && onDeleteSim(s.id)}
                          style={{
                            background: "none",
                            border: `1px solid ${G.border}`,
                            color: G.muted,
                            cursor: "pointer",
                            fontSize: 12,
                            padding: "4px 9px",
                            borderRadius: 5,
                            fontFamily: G.font,
                            flexShrink: 0,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: G.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{GCSS}</style>
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${G.border}`,
          background: G.surface,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: `linear-gradient(135deg,${G.accent},#d97706)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: G.fontD,
            fontWeight: 800,
            fontSize: 15,
            color: "#000",
          }}
        >
          KR
        </div>
        <div>
          <div
            style={{
              fontFamily: G.fontD,
              fontWeight: 700,
              fontSize: 16,
              color: G.accent,
            }}
          >
            KrushRock
          </div>
          <div style={{ fontSize: 10, color: G.muted, letterSpacing: "0.1em" }}>
            SIMULADOR DE CHANCADO Y SELECCIÓN
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          {cancelEdit && (
            <button
              onClick={cancelEdit}
              style={{
                background: "none",
                border: `1px solid ${G.border}`,
                borderRadius: 6,
                padding: "5px 11px",
                color: G.muted,
                cursor: "pointer",
                fontSize: 11,
                fontFamily: G.font,
              }}
            >
              ← Volver a resultados
            </button>
          )}
          <span style={{ fontSize: 11, color: G.muted }}>
            Unidad: <strong style={{ color: G.accent }}>{unit === "in" ? '"' : unit}</strong>
          </span>
        </div>
      </div>
      <div style={{ height: 3, background: G.border }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: G.accent,
            transition: "width .4s ease",
          }}
        />
      </div>
      {started && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
            marginTop: 16,
            marginBottom: 14,
            maxWidth: 840,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {STEP_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setStep(item.id);
                setStarted(true);
              }}
              style={{
                padding: "9px 12px",
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: G.font,
                fontSize: 11,
                border: `1px solid ${step === item.id ? G.accent : G.border}`,
                background: step === item.id ? `${G.accentDim}33` : G.card,
                color: step === item.id ? G.accent : G.muted,
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", padding: "22px 16px" }}>
        <div
          className="fi"
          key={step}
          style={{ maxWidth: 640, margin: "0 auto" }}
        >
          <QBubble q={QUES[step]} hint={HINTS[step]} />

          {/* STEP 0 — ROCA (2 niveles) */}
          {step === 0 && (
            <div style={{ display: "grid", gap: 8 }}>
              {aiPrefilled.rock && (
                <div style={{ display: "flex", alignItems: "center", gap: 8,
                  background: `${G.green}18`, border: `1px solid ${G.green}`,
                  borderRadius: 8, padding: "10px 14px", fontSize: 12, color: G.green }}>
                  <span style={{ fontSize: 16 }}>✦</span>
                  <span>Tipo de roca pre-llenado por IA
                    {aiPrefilled.wi ? ` · Wi ${cWi} kWh/t` : ""}
                    {aiPrefilled.den ? ` · Den ${cDen} t/m³` : ""}
                    {" — "}puedes confirmar o cambiar abajo.
                  </span>
                </div>
              )}
              {/* Nivel 0 — botón siempre visible */}
              <button
                onClick={() => {
                  setRockKey("desconocida");
                  setRockCat(null);
                  setTimeout(next, 150);
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  textAlign: "left",
                  background: `${G.accentDim}22`,
                  border: `1px dashed ${G.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <span style={{ fontSize: 13, color: G.muted }}>
                  Usar valores promedio (no sé)
                </span>
                <span style={{ fontSize: 10, color: G.muted }}>
                  Wi 13 · ab 0.20 · den 2.65 →
                </span>
              </button>

              <button
                onClick={openPasteModal}
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  textAlign: "left",
                  background: G.card,
                  border: `1px solid ${G.accent}`,
                  color: G.text,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  width: "100%",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  📋 Pegar información del cliente
                </span>
                <span style={{ fontSize: 12, color: G.muted }}>
                  Extrae parámetros automáticamente
                </span>
              </button>

              {/* Nivel 1 — categorías */}
              {!rockCat && (
                <div style={{ display: "grid", gap: 7 }}>
                  {[
                    {
                      k: "aridos",
                      icon: "🏗",
                      label: "Áridos y construcción",
                      sub: "Huevillo, grava, bolones",
                    },
                    {
                      k: "mineria",
                      icon: "⛏",
                      label: "Minería metálica",
                      sub: "Pórfido, cobre, magnetita",
                    },
                    {
                      k: "roca_dura",
                      icon: "🪨",
                      label: "Roca dura (tronadura)",
                      sub: "Andesita, granito, basalto",
                    },
                    {
                      k: "roca_blanda",
                      icon: "🧱",
                      label: "Roca blanda / industrial",
                      sub: "Caliza, caliche, arenisca",
                    },
                    {
                      k: "manual",
                      icon: "⚙️",
                      label: "Ingresar manualmente",
                      sub: "Wi + abrasión + densidad",
                    },
                  ].map((cat) => (
                    <button
                      key={cat.k}
                      onClick={() => setRockCat(cat.k)}
                      style={{
                        background: G.card,
                        border: `1px solid ${G.border}`,
                        borderRadius: 8,
                        padding: "12px 16px",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        width: "100%",
                        transition: "all .15s",
                      }}
                    >
                      <span style={{ fontSize: 22, lineHeight: 1 }}>
                        {cat.icon}
                      </span>
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            color: G.text,
                            fontWeight: 600,
                          }}
                        >
                          {cat.label}
                        </div>
                        <div
                          style={{ fontSize: 11, color: G.muted, marginTop: 2 }}
                        >
                          {cat.sub}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Nivel 2 — sub-opciones por categoría */}
              {rockCat && rockCat !== "manual" && (
                <div style={{ display: "grid", gap: 7 }}>
                  <button
                    onClick={() => setRockCat(null)}
                    style={{
                      background: "none",
                      border: "none",
                      color: G.muted,
                      cursor: "pointer",
                      fontSize: 12,
                      fontFamily: G.font,
                      textAlign: "left",
                      padding: "4px 0",
                      marginBottom: 2,
                    }}
                  >
                    ← Cambiar categoría
                  </button>
                  {ROCK_CATS[rockCat].map((key) => {
                    const rock = ROCK_DB[key];
                    if (!rock) return null;
                    return (
                      <OptBtn
                        key={key}
                        val={key}
                        label={rock.name}
                        sub={`Wi ${rock.wi} · ab ${rock.ab} · den ${rock.den}`}
                        active={rockKey === key}
                        onClick={() => {
                          setRockKey(key);
                          setTimeout(next, 200);
                        }}
                      />
                    );
                  })}
                </div>
              )}

              {/* Nivel 2 — ingreso manual */}
              {rockCat === "manual" && (
                <div
                  style={{
                    background: G.card,
                    border: `1px solid ${G.accent}`,
                    borderRadius: 8,
                    padding: 16,
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <button
                    onClick={() => setRockCat(null)}
                    style={{
                      background: "none",
                      border: "none",
                      color: G.muted,
                      cursor: "pointer",
                      fontSize: 12,
                      fontFamily: G.font,
                      textAlign: "left",
                      padding: 0,
                    }}
                  >
                    ← Cambiar categoría
                  </button>

                  <div>
                    <div
                      style={{ fontSize: 11, color: G.muted, marginBottom: 5 }}
                    >
                      Nombre del material (opcional)
                    </div>
                    <input
                      type="text"
                      value={cName}
                      onChange={(e) => setCName(e.target.value)}
                      placeholder="Ej: Pórfido Proyecto Norte"
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: G.muted,
                          marginBottom: 5,
                        }}
                      >
                        Wi Bond (kWh/t)
                      </div>
                      <input
                        type="number"
                        value={cWi}
                        min={1}
                        max={60}
                        step={0.5}
                        onChange={(e) => setCWi(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: G.muted,
                          marginBottom: 5,
                        }}
                      >
                        Densidad (t/m³)
                      </div>
                      <input
                        type="number"
                        value={cDen}
                        min={1}
                        max={7}
                        step={0.05}
                        onChange={(e) => setCDen(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 11, color: G.muted, marginBottom: 5 }}
                    >
                      Abrasividad Bond —{" "}
                      <strong style={{ color: G.accent }}>
                        {cAb.toFixed(2)}
                      </strong>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={0.6}
                      step={0.01}
                      value={cAb}
                      onChange={(e) => setCAb(Number(e.target.value))}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 10,
                        color: G.muted,
                        marginTop: 3,
                      }}
                    >
                      <span>0.00 — muy blanda</span>
                      <span>0.60 — muy abrasiva</span>
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: G.muted,
                        marginTop: 4,
                        lineHeight: 1.5,
                      }}
                    >
                      Ref: caliza 0.12 · andesita 0.32 · basalto 0.35 · cuarcita
                      0.45
                    </div>
                  </div>
                  <PBtn
                    label="Confirmar → Siguiente"
                    onClick={() => {
                      setRockKey("personalizada");
                      next();
                    }}
                  />
                </div>
              )}

              {/* Riesgo inchancables — visible en todas las subcategorías del paso Tipo de roca */}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: G.card, border: `1px solid ${G.border}`, borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
                <input
                  type="checkbox"
                  id="riesgoInch"
                  checked={riesgoInchancable}
                  onChange={e => setRiesgoInchancable(e.target.checked)}
                  style={{ marginTop: 2, cursor: "pointer", flexShrink: 0 }}
                />
                <label htmlFor="riesgoInch" style={{ fontSize: 12, color: G.text, cursor: "pointer", lineHeight: 1.5 }}>
                  La alimentación viene de un circuito SAG/pebbles o puede traer objetos metálicos (chatarra, fragmentos de bolas de molienda)
                </label>
              </div>
              {riesgoInchancable && (
                <div style={{ background: "rgba(245,158,11,0.1)", border: `1px solid ${G.accent}`, borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 13, color: G.accent, fontWeight: 600, marginBottom: 8 }}>
                    ⚠ Riesgo de inchancables/metal en la alimentación. Mecanismos de protección recomendados:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 5 }}>
                    <li style={{ fontSize: 12, color: G.text }}>
                      <strong>Parrilla</strong> — separación mecánica de objetos sobredimensionados antes del chancador primario.
                    </li>
                    <li style={{ fontSize: 12, color: G.text }}>
                      <strong>Separador magnético / detector de metales</strong> — remueve fragmentos de bolas de molienda y chatarra antes de que entren al circuito.
                    </li>
                    <li style={{ fontSize: 12, color: G.text }}>
                      <strong>Descarga lateral (bypass)</strong> — desvía el material no triturable fuera de línea para manejo separado.
                    </li>
                  </ul>
                </div>
              )}

              {/* Volver a bienvenida (solo visible en nivel 1, sin categoría seleccionada) */}
              {!rockCat && (
                <button
                  onClick={() => setStarted(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: G.muted,
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: G.font,
                    textAlign: "left",
                    padding: "4px 0",
                    marginTop: 4,
                  }}
                >
                  ← Volver al inicio
                </button>
              )}
            </div>
          )}

          {pasteModalOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.75)",
                zIndex: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <div
                style={{
                  width: "min(100%, 600px)",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  background: G.surface,
                  border: `1px solid ${G.border}`,
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 0 40px rgba(0,0,0,0.45)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 18,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: G.text,
                        marginBottom: 4,
                      }}
                    >
                      📋 Pegar información del cliente
                    </div>
                    <div style={{ fontSize: 12, color: G.muted }}>
                      Copia el correo, resumen técnico o notas y extrae los
                      parámetros automáticamente.
                    </div>
                  </div>
                  <button
                    onClick={closePasteModal}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: G.muted,
                      fontSize: 20,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
                {!panelValues ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    <textarea
                      rows={8}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder={`Pega aquí el correo, resumen técnico o notas del cliente...\nEjemplo: alimentación 10-15 pulgadas, producto 1.5 pulgadas, capacidad 150 ton/hora, roca caliza`}
                      style={{
                        width: "100%",
                        minHeight: 220,
                        resize: "vertical",
                        borderRadius: 12,
                        border: `1px solid ${G.border}`,
                        background: G.card2,
                        color: G.text,
                        padding: 14,
                        fontFamily: G.font,
                        fontSize: 13,
                      }}
                    />
                    {extractError ? (
                      <div
                        style={{
                          background: "rgba(239,68,68,0.12)",
                          border: `1px solid ${G.red}`,
                          borderRadius: 10,
                          padding: 12,
                          color: G.red,
                          fontSize: 13,
                        }}
                      >
                        {extractError}
                      </div>
                    ) : null}
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={closePasteModal}
                        style={{
                          padding: "10px 16px",
                          borderRadius: 10,
                          border: `1px solid ${G.border}`,
                          background: "transparent",
                          color: G.muted,
                          cursor: "pointer",
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={runExtraction}
                        disabled={pasteText.trim().length < 20 || extracting}
                        title={
                          pasteText.trim().length < 20
                            ? "El texto es muy corto para extraer datos"
                            : ""
                        }
                        style={{
                          padding: "10px 18px",
                          borderRadius: 10,
                          border: "none",
                          background: extracting ? G.border : G.green,
                          color: "#000",
                          cursor:
                            extracting || pasteText.trim().length < 20
                              ? "not-allowed"
                              : "pointer",
                          opacity: extracting || pasteText.trim().length < 20 ? 0.65 : 1,
                        }}
                      >
                        {extracting
                          ? "Analizando información del cliente..."
                          : "🔍 Extraer datos"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 16 }}>
                    <div
                      style={{
                        display: "grid",
                        gap: 14,
                        background: G.card2,
                        border: `1px solid ${G.border}`,
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          color: G.accent,
                          fontWeight: 700,
                        }}
                      >
                        ✅ Datos encontrados
                      </div>
                      {[
                        "tipo_roca",
                        "work_index",
                        "f_max_mm",
                        "f80_mm",
                        "capacidad_tph",
                        "densidad_tm3",
                        "p_max_mm",
                        "p80_mm",
                        "css_primario_mm",
                        "css_secundario_mm",
                        "notas_adicionales",
                      ].map((key) => {
                        const isNote = key === "notas_adicionales";
                        const missing = panelValues[key] === null;
                        const appearance = getFieldAppearance(key);
                        if (missing && key !== "notas_adicionales") return null;
                        return (
                          <div
                            key={key}
                            style={{
                              display: "grid",
                              gap: 6,
                              padding: 12,
                              borderRadius: 12,
                              border: `1px solid ${appearance.border}`,
                              background: appearance.background,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                color: G.muted,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span>{EXTRACTION_LABELS[key]}</span>
                              {panelEdited[key] ? <span>✏️</span> : null}
                            </div>
                            {key === "tipo_roca" ? (
                              <select
                                value={panelValues.tipo_roca_key}
                                onChange={(e) =>
                                  setRockKeyFromPanel(e.target.value)
                                }
                                style={{ width: "100%" }}
                              >
                                <option value="desconocida">
                                  Otro material — {panelValues.tipo_roca || "no listado"}
                                </option>
                                {Object.entries(ROCK_DB).map(([key, rock]) => (
                                  <option key={key} value={key}>
                                    {rock.name}
                                  </option>
                                ))}
                              </select>
                            ) : key === "notas_adicionales" ? (
                              <textarea
                                rows={3}
                                value={displayPanelField(key)}
                                onChange={(e) =>
                                  setPanelField(key, e.target.value)
                                }
                                style={{ width: "100%", borderRadius: 10 }}
                                placeholder="Notas adicionales del cliente"
                              />
                            ) : (
                              <input
                                type="number"
                                value={displayPanelField(key)}
                                onChange={(e) =>
                                  setPanelField(
                                    key,
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
                                  )
                                }
                                style={{ width: "100%" }}
                              />
                            )}
                            <div
                              style={{
                                fontSize: 11,
                                color: G.muted,
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span>{EXTRACTION_UNITS[key]}</span>
                              {panelFieldErrors[key] ? (
                                <span style={{ color: G.red }}>
                                  Valor inválido
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gap: 12,
                        background: "rgba(254,243,199,0.1)",
                        border: `1px solid #F59E0B`,
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          color: "#92400e",
                          fontWeight: 700,
                        }}
                      >
                        ⚠️ Datos no encontrados (completar manualmente)
                      </div>
                      {[
                        "tipo_roca",
                        "work_index",
                        "f_max_mm",
                        "f80_mm",
                        "capacidad_tph",
                        "densidad_tm3",
                        "p_max_mm",
                        "p80_mm",
                        "css_primario_mm",
                        "css_secundario_mm",
                      ]
                        .filter((key) => panelValues[key] === null)
                        .map((key) => (
                          <div
                            key={key}
                            style={{
                              display: "grid",
                              gap: 6,
                              padding: 12,
                              borderRadius: 12,
                              border: `1px solid ${G.accent}`,
                              background: "rgba(254,243,199,0.2)",
                            }}
                          >
                            <div
                              style={{ fontSize: 12, color: G.muted }}
                            >
                              {EXTRACTION_LABELS[key]}
                            </div>
                            <input
                              type={key === "tipo_roca" ? "text" : "number"}
                              value={displayPanelField(key)}
                              onChange={(e) =>
                                setPanelField(
                                  key,
                                  e.target.value === "" ? null : e.target.value,
                                )
                              }
                              placeholder={`Ingresa ${EXTRACTION_LABELS[key].toLowerCase()}`}
                              style={{
                                width: "100%",
                                borderRadius: 10,
                                border: `1px solid #F59E0B`,
                                background: "rgba(254,243,199,0.15)",
                              }}
                            />
                            <div
                              style={{
                                fontSize: 11,
                                color: G.muted,
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span>{EXTRACTION_UNITS[key]}</span>
                              {panelFieldErrors[key] ? (
                                <span style={{ color: G.red }}>
                                  Valor inválido
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                    </div>
                    {panelValues.supuestos.length > 0 && (
                      <div
                        style={{
                          background: "rgba(59,130,246,0.08)",
                          border: `1px solid ${G.blue}`,
                          borderRadius: 12,
                          padding: 14,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setShowAssumptions((prev) => !prev)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: G.text,
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                            padding: 0,
                            marginBottom: 12,
                            fontSize: 13,
                          }}
                        >
                          <span>
                            ℹ️ Supuestos y conversiones aplicadas
                            (hacer clic para ver)
                          </span>
                          <span>{showAssumptions ? "▼" : "►"}</span>
                        </button>
                        {showAssumptions && (
                          <ul style={{ marginTop: 0, paddingLeft: 18 }}>
                            {panelValues.supuestos.map((item, index) => (
                              <li
                                key={index}
                                style={{ fontSize: 12, color: G.muted, marginBottom: 6 }}
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {extractError ? (
                      <div
                        style={{
                          background: "rgba(239,68,68,0.12)",
                          border: `1px solid ${G.red}`,
                          borderRadius: 10,
                          padding: 12,
                          color: G.red,
                          fontSize: 13,
                        }}
                      >
                        {extractError}
                      </div>
                    ) : null}
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => {
                          clearExtraction();
                          setPasteText("");
                        }}
                        style={{
                          padding: "10px 16px",
                          borderRadius: 10,
                          border: `1px solid ${G.border}`,
                          background: "transparent",
                          color: G.muted,
                          cursor: "pointer",
                        }}
                      >
                        🔄 Volver a pegar texto
                      </button>
                      <button
                        onClick={confirmPanel}
                        style={{
                          padding: "10px 18px",
                          borderRadius: 10,
                          border: "none",
                          background: G.green,
                          color: "#000",
                          cursor: "pointer",
                        }}
                      >
                        ✅ Confirmar y continuar
                      </button>
                      <button
                        onClick={closePasteModal}
                        style={{
                          padding: "10px 16px",
                          borderRadius: 10,
                          border: `1px solid ${G.border}`,
                          background: "transparent",
                          color: G.muted,
                          cursor: "pointer",
                        }}
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 1 — CURVA GRANULOMÉTRICA DE INGRESO */}
          {step === 1 && (
            <div style={{ display: "grid", gap: 8 }}>
              {aiPrefilled.f80 && !aiPrefilled.f80Estimated && (
                <div style={{ display: "flex", alignItems: "center", gap: 8,
                  background: `${G.green}18`, border: `1px solid ${G.green}`,
                  borderRadius: 8, padding: "10px 14px", fontSize: 12, color: G.green }}>
                  <span style={{ fontSize: 16 }}>✦</span>
                  <span>F80 extraído del texto: <strong>{f80} mm</strong>
                    {aiPrefilled.tph ? ` · Tonelaje: ${overrideTph} tph` : ""}
                    {" — "}confirma o ajusta abajo, luego continúa.
                  </span>
                </div>
              )}
              {aiPrefilled.f80Estimated && (
                <div style={{ display: "flex", alignItems: "center", gap: 8,
                  background: `${G.accent}18`, border: `1px solid ${G.accent}`,
                  borderRadius: 8, padding: "10px 14px", fontSize: 12, color: G.accent }}>
                  <span style={{ fontSize: 16 }}>⚠</span>
                  <span>F80 no indicado en el texto — estimado como <strong>75% del F máximo ({aiPrefilled.fmax ? Math.round(f80 / 0.75) : "?"} mm) → {f80} mm</strong>.
                    Esto es una aproximación conservadora para material ROM. Ajusta si tienes datos reales.
                  </span>
                </div>
              )}
              {[
                {
                  v: "full",
                  label: "Tengo puntos de la curva",
                  sub: "Error estimado ±4-9% — mayor precisión",
                },
                {
                  v: "partial",
                  label: "Tengo F80 y F50",
                  sub: "Error estimado ±10-12%",
                },
                {
                  v: "f80only",
                  label: "Solo tengo F80",
                  sub: "Sin datos de distribución — error ±20-25%",
                },
              ].map((o) => (
                <OptBtn
                  key={o.v}
                  val={o.v}
                  label={o.label}
                  sub={o.sub}
                  active={curveType === o.v}
                  onClick={() => setCurve(o.v)}
                />
              ))}

              {curveType === "f80only" && (
                <div
                  style={{
                    background: G.card,
                    border: `1px solid ${G.accent}`,
                    borderRadius: 8,
                    padding: 16,
                    display: "grid",
                    gap: 10,
                    marginTop: 4,
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: 11, color: G.muted, marginBottom: 5 }}
                    >
                      F80 — tamaño por el que pasa el 80% de la alimentación (
                      {ul})
                    </div>
                    <div style={{ textAlign: "center", marginBottom: 8 }}>
                      <span
                        style={{
                          fontFamily: G.fontD,
                          fontWeight: 700,
                          fontSize: 42,
                          color: G.accent,
                        }}
                      >
                        {disp(f80)}
                      </span>
                      <span
                        style={{ fontSize: 14, color: G.muted, marginLeft: 6 }}
                      >
                        {ul}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={1000}
                      step={1}
                      value={f80}
                      onChange={(e) => setF80(Number(e.target.value))}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 10,
                        color: G.muted,
                        marginTop: 4,
                        marginBottom: 8,
                      }}
                    >
                      <span>50 mm</span>
                      <span>1000 mm</span>
                    </div>
                    <div
                      style={{ display: "flex", gap: 10, alignItems: "center" }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: G.muted,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Directo ({ul}):
                      </span>
                      <input
                        type="text"
                        value={disp(f80)}
                        key={`f80only-${unit}`}
                        onChange={(e) => {
                          const v = toMmU(e.target.value);
                          if (v >= 50 && v <= 1000) setF80(v);
                        }}
                        style={{ width: 110 }}
                      />
                    </div>
                    {unit === "in" && (
                      <div
                        style={{ color: G.muted, fontSize: 12, marginTop: 6 }}
                      >
                        {measureHint(f80)}
                      </div>
                    )}
                  </div>
                  <PBtn label="Confirmar → Siguiente" onClick={next} />
                </div>
              )}

              {curveType === "partial" && (
                <div
                  style={{
                    background: G.card,
                    border: `1px solid ${G.accent}`,
                    borderRadius: 8,
                    padding: 16,
                    display: "grid",
                    gap: 10,
                    marginTop: 4,
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: 11, color: G.muted, marginBottom: 5 }}
                    >
                      F80 — tamaño por el que pasa el 80% de la alimentación (
                      {ul})
                    </div>
                    <input
                      type="text"
                      defaultValue={disp(f80)}
                      key={`f80p-${unit}`}
                      onBlur={(e) => {
                        const parsed = parseMeasureToMm(e.target.value, unit);
                        if (parsed.error) {
                          setMeasureError("f80", parsed.error);
                          return;
                        }
                        if (parsed.mm >= 50 && parsed.mm <= 1000) {
                          clearMeasureError("f80");
                          setF80(parsed.mm);
                        } else {
                          setMeasureError(
                            "f80",
                            "F80 debe estar entre 50 mm y 1000 mm.",
                          );
                        }
                      }}
                    />
                    {measureErrors.f80 && (
                      <div
                        style={{ color: "#c00", fontSize: 12, marginTop: 4 }}
                      >
                        {measureErrors.f80}
                      </div>
                    )}
                    {unit === "in" && (
                      <div
                        style={{ color: G.muted, fontSize: 12, marginTop: 4 }}
                      >
                        {measureHint(f80)}
                      </div>
                    )}
                    {inchQuickButtons((value) => {
                      const parsed = parseMeasureToMm(value, "in");
                      if (!parsed.error) {
                        clearMeasureError("f80");
                        setF80(parsed.mm);
                      }
                    })}
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 11, color: G.muted, marginBottom: 5 }}
                    >
                      F50 — tamaño por el que pasa el 50% ({ul})
                    </div>
                    <input
                      type="text"
                      defaultValue={disp(f50)}
                      key={`f50p-${unit}`}
                      onBlur={(e) => {
                        const parsed = parseMeasureToMm(e.target.value, unit);
                        if (parsed.error) {
                          setMeasureError("f50", parsed.error);
                          return;
                        }
                        if (parsed.mm > 0 && parsed.mm < f80) {
                          clearMeasureError("f50");
                          setF50(parsed.mm);
                        } else {
                          setMeasureError(
                            "f50",
                            "F50 debe ser mayor que 0 y menor que F80.",
                          );
                        }
                      }}
                    />
                    {measureErrors.f50 && (
                      <div
                        style={{ color: "#c00", fontSize: 12, marginTop: 4 }}
                      >
                        {measureErrors.f50}
                      </div>
                    )}
                    {unit === "in" && (
                      <div
                        style={{ color: G.muted, fontSize: 12, marginTop: 4 }}
                      >
                        {measureHint(f50)}
                      </div>
                    )}
                    {inchQuickButtons((value) => {
                      const parsed = parseMeasureToMm(value, "in");
                      if (!parsed.error) {
                        clearMeasureError("f50");
                        setF50(parsed.mm);
                      }
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: G.muted }}>
                    F80: {disp(f80)} {ul} · F50: {disp(f50)} {ul}
                  </div>
                  <PBtn label="Confirmar → Siguiente" onClick={next} />
                </div>
              )}

              {curveType === "full" && (
                <div
                  style={{
                    background: G.card,
                    border: `1px solid ${G.accent}`,
                    borderRadius: 8,
                    padding: 16,
                    marginTop: 4,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: G.accent,
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    Ingresa los puntos que tengas disponibles
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: G.muted,
                      marginBottom: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    Ingresa solo los puntos que conozcas — deja en blanco los
                    que no tengas. El sistema ajustará la curva con los datos
                    disponibles. Decimal: usa punto{" "}
                    <strong style={{ color: G.text }}>.</strong> o coma{" "}
                    <strong style={{ color: G.text }}>,</strong>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    {curvePoints.map((pt) => (
                      <div key={pt.label}>
                        <div
                          style={{
                            fontSize: 10,
                            color: G.muted,
                            marginBottom: 4,
                          }}
                        >
                          {pt.label}{" "}
                          <span style={{ color: G.muted }}>
                            ({pt.pct}% pasante)
                          </span>
                        </div>
                        <input
                          type="text"
                          defaultValue={
                            pt.sizeMm > 0 ? fromMm(pt.sizeMm, unit) : ""
                          }
                          key={`${pt.label}-${unit}`}
                          onBlur={(e) => {
                            const parsed = parseMeasureToMm(
                              e.target.value,
                              unit,
                            );
                            if (parsed.error) {
                              setMeasureError(
                                `curve-${pt.label}`,
                                parsed.error,
                              );
                              return;
                            }
                            clearMeasureError(`curve-${pt.label}`);
                            updCurvePoint(pt.label, e.target.value);
                          }}
                          placeholder={`tamaño en ${ul}`}
                        />
                        {measureErrors[`curve-${pt.label}`] && (
                          <div
                            style={{
                              color: "#c00",
                              fontSize: 12,
                              marginTop: 4,
                            }}
                          >
                            {measureErrors[`curve-${pt.label}`]}
                          </div>
                        )}
                        {unit === "in" && pt.sizeMm > 0 && (
                          <>
                            <div
                              style={{
                                color: G.muted,
                                fontSize: 12,
                                marginTop: 4,
                              }}
                            >
                              {measureHint(pt.sizeMm)}
                            </div>
                            {inchQuickButtons((value) => {
                              const parsed = parseMeasureToMm(value, "in");
                              if (!parsed.error) {
                                clearMeasureError(`curve-${pt.label}`);
                                updCurvePoint(pt.label, value);
                              }
                            })}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  {validCurvePts > 0 && (
                    <div
                      style={{ fontSize: 11, color: G.green, marginBottom: 10 }}
                    >
                      ✓ {validCurvePts} punto(s) ingresado(s) — error estimado ±
                      {validCurvePts >= 6
                        ? 4
                        : validCurvePts >= 4
                          ? 6
                          : validCurvePts >= 2
                            ? 9
                            : 14}
                      %
                    </div>
                  )}
                  <PBtn label="Confirmar → Siguiente" onClick={next} />
                </div>
              )}
              {/* Tonelaje de alimentación — compartido por los tres modos de curva */}
              <div
                style={{
                  background: G.card,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  padding: 16,
                  display: "grid",
                  gap: 10,
                  marginTop: 4,
                }}
              >
                <div style={{ fontSize: 12, color: G.accent, fontWeight: 600 }}>
                  Tonelaje de alimentación
                </div>
                <div style={{ fontSize: 11, color: G.muted }}>
                  Toneladas por hora (tph) que entra al circuito. Si no lo
                  conoces, déjalo vacío — el sistema lo derivará de las metas
                  de producción en el paso Productos.
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    step={10}
                    value={overrideTph ?? ""}
                    placeholder="ej. 200"
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setOverrideTph(v > 0 ? v : null);
                    }}
                    style={{ width: 120 }}
                  />
                  <span style={{ fontSize: 13, color: G.muted }}>tph</span>
                  {overrideTph && (
                    <button
                      type="button"
                      onClick={() => setOverrideTph(null)}
                      style={{
                        fontSize: 11,
                        color: G.muted,
                        background: "none",
                        border: `1px solid ${G.border}`,
                        borderRadius: 4,
                        padding: "3px 8px",
                        cursor: "pointer",
                      }}
                    >
                      limpiar
                    </button>
                  )}
                </div>
                {overrideTph && (
                  <div style={{ fontSize: 11, color: G.green }}>
                    ✓ Alimentación fijada en {overrideTph} tph
                  </div>
                )}
              </div>

              <SBtn label="← Anterior" onClick={back} />
            </div>
          )}

          {/* STEP 2 — PRODUCTOS */}
          {step === 2 && (
            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  background: G.card,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  padding: 14,
                }}
              >
                <SectionTitle>HORIZONTE DE PRODUCCIÓN</SectionTitle>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => setPlazoMeses(1)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontFamily: G.font,
                      fontSize: 12,
                      border: `1px solid ${plazoMeses === 1 ? G.accent : G.border}`,
                      background:
                        plazoMeses === 1 ? `${G.accentDim}33` : G.card,
                      color: plazoMeses === 1 ? G.accent : G.muted,
                    }}
                  >
                    Mensual (1 mes)
                  </button>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={plazoMeses}
                      onChange={(e) =>
                        setPlazoMeses(Math.max(1, Number(e.target.value)))
                      }
                      style={{ width: 70 }}
                    />
                    <span style={{ fontSize: 12, color: G.muted }}>
                      mes(es)
                    </span>
                  </div>
                </div>
                {aiPrefilled.plazo && (
                  <div style={{ fontSize: 11, color: G.green, marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
                    <span>✦</span>
                    <span>Horizonte extraído del texto: <strong>{plazoMeses} mes{plazoMeses !== 1 ? "es" : ""}</strong> — ajusta si es necesario.</span>
                  </div>
                )}
                <div style={{ fontSize: 10, color: G.muted, marginTop: 4 }}>
                  Define el horizonte para calcular tonelajes totales y
                  planificación de campaña
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: G.muted,
                  padding: "8px 12px",
                  background: G.faint,
                  borderRadius: 6,
                  borderLeft: `3px solid ${G.border}`,
                }}
              >
                Decimal aceptado: punto{" "}
                <strong style={{ color: G.text }}>.</strong> o coma{" "}
                <strong style={{ color: G.text }}>,</strong> — ej: 25.4 o 25,4 ·
                Máximo sin límite: dejar vacío o escribir ∞
              </div>
              {prods.map((p, idx) => (
                <div
                  key={p.id}
                  style={{
                    background: G.card,
                    border: `1px solid ${p.active ? G.accent : G.border}`,
                    borderRadius: 8,
                    padding: 13,
                    opacity: p.active ? 1 : 0.55,
                    transition: "all .2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      marginBottom: p.active ? 11 : 0,
                    }}
                  >
                    <button
                      onClick={() => togProd(p.id)}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        flexShrink: 0,
                        border: `1px solid ${p.active ? G.accent : G.border}`,
                        background: p.active ? G.accent : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {p.active && (
                        <span
                          style={{
                            color: "#000",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                    <input
                      type="text"
                      value={p.label}
                      onChange={(e) => upProd(p.id, "label", e.target.value)}
                      placeholder={`Producto ${idx + 1} (nombre opcional)`}
                      style={{ flex: 1, fontSize: 13 }}
                    />
                  </div>
                  {p.active && (
                    <div style={{ display: "grid", gap: 8 }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 10,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              color: G.muted,
                              marginBottom: 4,
                            }}
                          >
                            Mínimo ({ul})
                          </div>
                          <input
                            type="text"
                            defaultValue={
                              p.minMm === 0 ? "0" : fromMm(p.minMm, unit)
                            }
                            key={`${p.id}-min-${unit}`}
                            onBlur={(e) =>
                              upProd(p.id, "minMm", e.target.value)
                            }
                            placeholder="0 = sin límite inferior"
                          />
                          {measureErrors[`${p.id}-minMm`] && (
                            <div
                              style={{
                                color: "#c00",
                                fontSize: 12,
                                marginTop: 4,
                              }}
                            >
                              {measureErrors[`${p.id}-minMm`]}
                            </div>
                          )}
                          {unit === "in" && p.minMm > 0 && (
                            <div
                              style={{
                                color: G.muted,
                                fontSize: 12,
                                marginTop: 4,
                              }}
                            >
                              {measureHint(p.minMm)}
                            </div>
                          )}
                          {inchQuickButtons((value) => {
                            const parsed = parseMeasureToMm(value, "in");
                            if (!parsed.error) {
                              clearMeasureError(`${p.id}-minMm`);
                              upProd(p.id, "minMm", value);
                            }
                          })}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              color: G.muted,
                              marginBottom: 4,
                            }}
                          >
                            Máximo ({ul})
                          </div>
                          <input
                            type="text"
                            defaultValue={
                              p.maxMm >= 9999 ? "∞" : fromMm(p.maxMm, unit)
                            }
                            key={`${p.id}-max-${unit}`}
                            onBlur={(e) =>
                              upProd(p.id, "maxMm", e.target.value)
                            }
                            placeholder="∞ = sin límite superior"
                          />
                          {measureErrors[`${p.id}-maxMm`] && (
                            <div
                              style={{
                                color: "#c00",
                                fontSize: 12,
                                marginTop: 4,
                              }}
                            >
                              {measureErrors[`${p.id}-maxMm`]}
                            </div>
                          )}
                          {unit === "in" && p.maxMm < 9999 && (
                            <div
                              style={{
                                color: G.muted,
                                fontSize: 12,
                                marginTop: 4,
                              }}
                            >
                              {measureHint(p.maxMm)}
                            </div>
                          )}
                          {inchQuickButtons((value) => {
                            const parsed = parseMeasureToMm(value, "in");
                            if (!parsed.error) {
                              clearMeasureError(`${p.id}-maxMm`);
                              upProd(p.id, "maxMm", value);
                            }
                          })}
                        </div>
                      </div>
                      {p.maxMm < 9999 && p.maxMm >= f80 && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#b25",
                            background: "#fff2f0",
                            padding: "8px 10px",
                            borderRadius: 6,
                          }}
                        >
                          El máximo del producto no puede ser mayor o igual a
                          F80.
                        </div>
                      )}
                      {p.minMm > 0 && p.maxMm < 9999 && p.minMm >= p.maxMm && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#b25",
                            background: "#fff2f0",
                            padding: "8px 10px",
                            borderRadius: 6,
                          }}
                        >
                          El mínimo debe ser menor que el máximo para este
                          producto.
                        </div>
                      )}
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            color: G.muted,
                            marginBottom: 4,
                          }}
                        >
                          Tonelaje objetivo (
                          {plazoMeses === 1
                            ? "ton/mes"
                            : `ton total en ${plazoMeses} meses`}
                          ) — opcional
                        </div>
                        <input
                          type="number"
                          value={p.targetTon || ""}
                          min={0}
                          step={100}
                          placeholder="0 = sin objetivo"
                          onChange={(e) =>
                            upProd(p.id, "targetTon", e.target.value)
                          }
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {derivedTphPreview && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: `${G.green}11`,
                    borderRadius: 8,
                    border: `1px solid ${G.green}44`,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: G.green, fontWeight: 600 }}>
                    TPH estimado: {derivedTphPreview} tph
                  </span>
                  <span style={{ color: G.muted, marginLeft: 8 }}>
                    — basado en {totalTargetTonPreview.toLocaleString()} ton en{" "}
                    {plazoMeses} {plazoMeses === 1 ? "mes" : "meses"}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "space-between",
                }}
              >
                <SBtn label="← Anterior" onClick={back} />
                <PBtn label="Confirmar → Siguiente" onClick={next} />
              </div>
            </div>
          )}

          {/* STEP 3 — HUMEDAD + ALTITUD */}
          {step === 3 && (
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  background: G.card,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <SectionTitle>HUMEDAD / ARCILLAS</SectionTitle>
                <div style={{ display: "grid", gap: 7 }}>
                  {[
                    { v: null, l: "Sin humedad / No aplica", s: "< 2%" },
                    {
                      v: "unknown",
                      l: "Desconocida",
                      s: "No tengo información",
                    },
                    { v: 1, l: "Baja", s: "2–5% — sin arcillas" },
                    { v: 2, l: "Media", s: "5–10% — arcillas leves" },
                    { v: 3, l: "Alta", s: ">10% — arcillas significativas" },
                  ].map((o) => (
                    <OptBtn
                      key={String(o.v)}
                      val={o.v}
                      label={o.l}
                      sub={o.s}
                      active={humidity === o.v}
                      onClick={() => setHum(o.v)}
                    />
                  ))}
                </div>
              </div>
              <div
                style={{
                  background: G.card,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <SectionTitle>ALTITUD DE TRABAJO</SectionTitle>
                <div style={{ marginBottom: 10 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      color: altitudeOmit ? G.accent : G.text,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={altitudeOmit}
                      onChange={(e) => setAltOmit(e.target.checked)}
                      style={{
                        width: 16,
                        height: 16,
                        accentColor: G.accent,
                        cursor: "pointer",
                      }}
                    />
                    Omitir altitud (no aplica — bajo 1.500 m.s.n.m.)
                  </label>
                  <div
                    style={{
                      fontSize: 11,
                      color: G.muted,
                      marginTop: 4,
                      marginLeft: 24,
                    }}
                  >
                    Bajo 1.500 m.s.n.m. la corrección de altitud normalmente no
                    es relevante.
                  </div>
                </div>
                {!altitudeOmit && (
                  <>
                    <div
                      style={{ fontSize: 12, color: G.muted, marginBottom: 10 }}
                    >
                      Sobre 1.500 m.s.n.m.: motores pierden ~1% de potencia cada
                      100m. Factor mínimo: 60% a ~5.500m.
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <input
                        type="number"
                        value={altitude}
                        min={0}
                        max={5500}
                        step={50}
                        onChange={(e) => setAlt(Number(e.target.value))}
                        style={{ width: 120 }}
                      />
                      <span style={{ fontSize: 13, color: G.muted }}>
                        m.s.n.m.
                      </span>
                    </div>
                    {altitude > 1500 && (
                      <div
                        style={{ fontSize: 11, color: G.accent, marginTop: 4 }}
                      >
                        ⚡ Factor de potencia:{" "}
                        {(
                          Math.max(0.6, 1 - (altitude - 1500) * 0.0001) * 100
                        ).toFixed(0)}
                        %
                        {altitude > 3700 && (
                          <span style={{ color: G.red }}>
                            {" "}
                            — zona altiplano
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "space-between",
                }}
              >
                <SBtn label="← Anterior" onClick={back} />
                <PBtn label="Confirmar → Siguiente" onClick={next} />
              </div>
            </div>
          )}

          {/* STEP 4 — CIRCUITO */}
          {step === 4 && (
            <div style={{ display: "grid", gap: 10 }}>
              {!circPath && (
                <>
                  {[
                    {
                      v: "ai",
                      label: "Que la IA decida",
                      sub: "Configuración automática óptima según parámetros",
                      color: G.accent,
                    },
                    {
                      v: "manual",
                      label: "Selecciono mis equipos",
                      sub: "Defines tipos, marcas y configuración del circuito",
                    },
                    {
                      v: "available",
                      label: "Ingreso mis equipos disponibles",
                      sub: "El sistema evalúa si cumplen y qué falta",
                    },
                  ].map((o) => (
                    <OptBtn
                      key={o.v}
                      val={o.v}
                      label={o.label}
                      sub={o.sub}
                      active={circPath === o.v}
                      color={o.color}
                      onClick={() => setCircPath(o.v)}
                    />
                  ))}
                  <SBtn label="← Anterior" onClick={back} />
                </>
              )}

              {circPath === "ai" && (
                <div
                  style={{
                    background: G.card,
                    border: `1px solid ${G.accent}`,
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <div
                    style={{ fontSize: 13, color: G.green, marginBottom: 12 }}
                  >
                    ✓ La IA diseñará el circuito óptimo para tu material y
                    tonelaje.
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}
                    >
                      Perfil de manto del cono (afecta la relación P80/CSS)
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5,1fr)",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      {[
                        { v: "EF", l: "EF", s: "Extra fino" },
                        { v: "F", l: "F", s: "Fino" },
                        { v: "M", l: "M", s: "Medio" },
                        { v: "C", l: "C", s: "Grueso" },
                        { v: "EC", l: "EC", s: "Extra grueso" },
                      ].map((o) => (
                        <OptBtn
                          key={o.v}
                          val={o.v}
                          label={o.l}
                          sub={o.s}
                          active={conePerfil === o.v}
                          onClick={() => {
                            setConePerfil(o.v);
                            setSugPerfil(null);
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={suggestConePerfil}
                      style={{
                        background: `${G.accentDim}22`,
                        border: `1px dashed ${G.accent}`,
                        borderRadius: 6,
                        padding: "7px 14px",
                        cursor: "pointer",
                        fontSize: 12,
                        color: G.accent,
                        fontFamily: G.font,
                        width: "100%",
                      }}
                    >
                      ◈ Sugerir perfil automáticamente según mis productos
                    </button>
                    {sugPerfil && (
                      <div
                        style={{ fontSize: 11, color: G.green, marginTop: 6 }}
                      >
                        ✓ Perfil <strong>{sugPerfil}</strong> sugerido — P80 más
                        fino objetivo:{" "}
                        {p80Prev < 9999 ? p80Prev + "mm" : "no definido"} · Wi:{" "}
                        {ROCK_DB[rockKey]?.wi || cWi || 13} kWh/t
                      </div>
                    )}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>
                      CSS del cono — apertura lado cerrado (opcional, sobreescribe el calculado)
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="number"
                        min={5}
                        max={70}
                        step={1}
                        value={manConeCSS ?? ""}
                        placeholder="ej. 20"
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setManConeCSS(v > 0 ? v : null);
                        }}
                        style={{ width: 100 }}
                      />
                      <span style={{ fontSize: 13, color: G.muted }}>mm</span>
                      {manConeCSS && (
                        <button
                          type="button"
                          onClick={() => setManConeCSS(null)}
                          style={{ fontSize: 11, color: G.muted, background: "none",
                            border: `1px solid ${G.border}`, borderRadius: 4,
                            padding: "3px 8px", cursor: "pointer" }}
                        >
                          limpiar
                        </button>
                      )}
                    </div>
                    {manConeCSS && (
                      <div style={{ fontSize: 11, color: G.accent, marginTop: 4 }}>
                        CSS fijado en {manConeCSS} mm (valor calculado ignorado)
                      </div>
                    )}
                  </div>
                  <SimulateNotice />
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      justifyContent: "space-between",
                    }}
                  >
                    <SBtn
                      label="← Cambiar opción"
                      onClick={() => setCircPath(null)}
                    />
                    <PBtn
                      label="◈ Simular"
                      onClick={finish}
                      disabled={simDisabled}
                    />
                  </div>
                </div>
              )}

              {circPath === "manual" && (
                <div
                  style={{
                    background: G.card,
                    border: `1px solid ${G.border}`,
                    borderRadius: 8,
                    padding: 16,
                    display: "grid",
                    gap: 14,
                  }}
                >
                  <SectionTitle>EQUIPOS A INCLUIR</SectionTitle>
                  <div style={{ display: "grid", gap: 7 }}>
                    {/* Equipos principales — chancadores destacados */}
                    {[
                      { k: "jaw", label: "⚙ Chancador Mandíbula", sub: "Primario — obligatorio en circuito típico", primary: true },
                      { k: "cone", label: "⚙ Chancador Cono", sub: "Secundario / Terciario — reduce a tamaño final", primary: true },
                      { k: "hsi", label: "Chancador HSI", sub: "Impacto horizontal — Primario o Secundario" },
                      { k: "screen3d", label: "Seleccionadora 3 Deck", sub: null },
                      { k: "screen2d", label: "Seleccionadora 2 Deck", sub: null },
                      { k: "screen1d", label: "Seleccionadora 1 Deck", sub: null },
                      { k: "screen_hf", label: "Seleccionadora Alta Frecuencia", sub: null },
                      { k: "scalper", label: "Scalper", sub: "Pre-primario — elimina finos antes de chancado" },
                    ].map((eq) => (
                      <label
                        key={eq.k}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          cursor: "pointer",
                          padding: eq.primary ? "10px 12px" : "6px 10px",
                          borderRadius: 7,
                          background: eq.primary && manualEq[eq.k] ? `${G.accent}18` : eq.primary ? `${G.faint}` : "transparent",
                          border: eq.primary ? `1px solid ${manualEq[eq.k] ? G.accent : G.border}` : "none",
                          transition: "all .15s",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!manualEq[eq.k]}
                          onChange={(e) =>
                            setManualEq((m) => ({
                              ...m,
                              [eq.k]: e.target.checked,
                            }))
                          }
                          style={{
                            width: 17,
                            height: 17,
                            accentColor: G.accent,
                            cursor: "pointer",
                            marginTop: 2,
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontSize: eq.primary ? 14 : 13, color: eq.primary ? G.text : G.muted, fontWeight: eq.primary ? 600 : 400 }}>{eq.label}</div>
                          {eq.sub && <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>{eq.sub}</div>}
                        </div>
                      </label>
                    ))}
                    <div
                      style={{
                        borderTop: `1px solid ${G.border}`,
                        paddingTop: 10,
                        marginTop: 3,
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          cursor: "pointer",
                          fontSize: 13,
                          color: G.cyan,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!manualEq.recirculation}
                          onChange={(e) =>
                            setManualEq((m) => ({
                              ...m,
                              recirculation: e.target.checked,
                            }))
                          }
                          style={{
                            width: 16,
                            height: 16,
                            accentColor: G.cyan,
                            cursor: "pointer",
                          }}
                        />
                        ↺ Con recirculación de sobre-tamaño
                      </label>
                      <div
                        style={{
                          fontSize: 10,
                          color: G.muted,
                          marginTop: 4,
                          marginLeft: 26,
                        }}
                      >
                        Condición de circuito, no un equipo adicional.
                      </div>
                    </div>
                  </div>

                  <SectionTitle>
                    MARCA / MODELO POR EQUIPO (opcional)
                  </SectionTitle>
                  {[
                    "jaw",
                    "cone",
                    "hsi",
                    "screen3d",
                    "screen2d",
                    "screen1d",
                    "screen_hf",
                  ]
                    .filter((k) => manualEq[k])
                    .map((k) => {
                      const catalog = EQ_BY_CAT[k] || [];
                      const brands = [...new Set(catalog.map((e) => e.brand))];
                      const models = catalog
                        .filter((e) => !manBrand[k] || e.brand === manBrand[k])
                        .map((e) => e.model);
                      return (
                        <div
                          key={k}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 8,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 10,
                                color: G.muted,
                                marginBottom: 4,
                              }}
                            >
                              Marca — {CAT_LABELS[k]}
                            </div>
                            <select
                              value={manBrand[k] || ""}
                              onChange={(e) =>
                                setManBrand((b) => ({
                                  ...b,
                                  [k]: e.target.value,
                                }))
                              }
                            >
                              <option value="">Cualquier marca</option>
                              {brands.map((b) => (
                                <option key={b} value={b}>
                                  {b}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 10,
                                color: G.muted,
                                marginBottom: 4,
                              }}
                            >
                              Modelo
                            </div>
                            <select
                              value={manModel[k] || ""}
                              onChange={(e) =>
                                setManModel((m) => ({
                                  ...m,
                                  [k]: e.target.value,
                                }))
                              }
                            >
                              <option value="">Cualquier modelo</option>
                              {models.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  {manualEq.scalper && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            color: G.muted,
                            marginBottom: 4,
                          }}
                        >
                          Marca — Scalper
                        </div>
                        <input
                          type="text"
                          value={manBrand.scalper || ""}
                          placeholder="Ej: Terex Finlay"
                          onChange={(e) =>
                            setManBrand((b) => ({
                              ...b,
                              scalper: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            color: G.muted,
                            marginBottom: 4,
                          }}
                        >
                          Modelo
                        </div>
                        <input
                          type="text"
                          value={manModel.scalper || ""}
                          placeholder="Ej: 883 Scalper"
                          onChange={(e) =>
                            setManModel((m) => ({
                              ...m,
                              scalper: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: 4 }}>
                    <div
                      style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}
                    >
                      Perfil de manto del cono (afecta la relación P80/CSS)
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5,1fr)",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      {[
                        { v: "EF", l: "EF", s: "Extra fino" },
                        { v: "F", l: "F", s: "Fino" },
                        { v: "M", l: "M", s: "Medio" },
                        { v: "C", l: "C", s: "Grueso" },
                        { v: "EC", l: "EC", s: "Extra grueso" },
                      ].map((o) => (
                        <OptBtn
                          key={o.v}
                          val={o.v}
                          label={o.l}
                          sub={o.s}
                          active={conePerfil === o.v}
                          onClick={() => {
                            setConePerfil(o.v);
                            setSugPerfil(null);
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={suggestConePerfil}
                      style={{
                        background: `${G.accentDim}22`,
                        border: `1px dashed ${G.accent}`,
                        borderRadius: 6,
                        padding: "7px 14px",
                        cursor: "pointer",
                        fontSize: 12,
                        color: G.accent,
                        fontFamily: G.font,
                        width: "100%",
                      }}
                    >
                      ◈ Sugerir perfil automáticamente según mis productos
                    </button>
                    {sugPerfil && (
                      <div
                        style={{ fontSize: 11, color: G.green, marginTop: 6 }}
                      >
                        ✓ Perfil <strong>{sugPerfil}</strong> sugerido — P80 más
                        fino objetivo:{" "}
                        {p80Prev < 9999 ? p80Prev + "mm" : "no definido"} · Wi:{" "}
                        {ROCK_DB[rockKey]?.wi || cWi || 13} kWh/t
                      </div>
                    )}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>
                      CSS del cono — apertura lado cerrado (opcional, sobreescribe el calculado)
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="number"
                        min={5}
                        max={70}
                        step={1}
                        value={manConeCSS ?? ""}
                        placeholder="ej. 20"
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setManConeCSS(v > 0 ? v : null);
                        }}
                        style={{ width: 100 }}
                      />
                      <span style={{ fontSize: 13, color: G.muted }}>mm</span>
                      {manConeCSS && (
                        <button
                          type="button"
                          onClick={() => setManConeCSS(null)}
                          style={{ fontSize: 11, color: G.muted, background: "none",
                            border: `1px solid ${G.border}`, borderRadius: 4,
                            padding: "3px 8px", cursor: "pointer" }}
                        >
                          limpiar
                        </button>
                      )}
                    </div>
                    {manConeCSS && (
                      <div style={{ fontSize: 11, color: G.accent, marginTop: 4 }}>
                        CSS fijado en {manConeCSS} mm (valor calculado ignorado)
                      </div>
                    )}
                  </div>
                  <SimulateNotice />
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      justifyContent: "space-between",
                    }}
                  >
                    <SBtn
                      label="← Cambiar opción"
                      onClick={() => setCircPath(null)}
                    />
                    <PBtn
                      label="◈ Simular"
                      onClick={finish}
                      disabled={simDisabled}
                    />
                  </div>
                </div>
              )}

              {circPath === "available" && (
                <div
                  style={{
                    background: G.card,
                    border: `1px solid ${G.border}`,
                    borderRadius: 8,
                    padding: 16,
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <SectionTitle>MIS EQUIPOS DISPONIBLES</SectionTitle>
                  <div
                    style={{ fontSize: 12, color: G.muted, marginBottom: 4 }}
                  >
                    El sistema evaluará si cumplen el objetivo e indicará qué
                    falta.
                  </div>
                  {availEquip.map((eq, i) => {
                    const catalog = EQ_BY_CAT[eq.type] || [];
                    const brands = [...new Set(catalog.map((e) => e.brand))];
                    const models = catalog
                      .filter((e) => !eq.brand || e.brand === eq.brand)
                      .map((e) => e.model);
                    const hasCat = catalog.length > 0;
                    return (
                      <div
                        key={eq.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr auto",
                          gap: 8,
                          alignItems: "end",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              color: G.muted,
                              marginBottom: 4,
                            }}
                          >
                            Tipo
                          </div>
                          <select
                            value={eq.type}
                            onChange={(e) =>
                              setAvail((a) =>
                                a.map((x) =>
                                  x.id === eq.id
                                    ? {
                                        ...x,
                                        type: e.target.value,
                                        brand: "",
                                        model: "",
                                      }
                                    : x,
                                ),
                              )
                            }
                          >
                            <option value="jaw">Mandíbula</option>
                            <option value="cone">Cono</option>
                            <option value="hsi">HSI</option>
                            <option value="screen3d">Selec. 3 deck</option>
                            <option value="screen2d">Selec. 2 deck</option>
                            <option value="screen1d">Selec. 1 deck</option>
                            <option value="scalper">Scalper</option>
                          </select>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              color: G.muted,
                              marginBottom: 4,
                            }}
                          >
                            Marca
                          </div>
                          {hasCat ? (
                            <select
                              value={eq.brand}
                              onChange={(e) =>
                                setAvail((a) =>
                                  a.map((x) =>
                                    x.id === eq.id
                                      ? {
                                          ...x,
                                          brand: e.target.value,
                                          model: "",
                                        }
                                      : x,
                                  ),
                                )
                              }
                            >
                              <option value="">Cualquier marca</option>
                              {brands.map((b) => (
                                <option key={b} value={b}>
                                  {b}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={eq.brand}
                              placeholder="Ej: Terex Finlay"
                              onChange={(e) =>
                                setAvail((a) =>
                                  a.map((x) =>
                                    x.id === eq.id
                                      ? { ...x, brand: e.target.value }
                                      : x,
                                  ),
                                )
                              }
                            />
                          )}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              color: G.muted,
                              marginBottom: 4,
                            }}
                          >
                            Modelo
                          </div>
                          {hasCat ? (
                            <select
                              value={eq.model}
                              onChange={(e) =>
                                setAvail((a) =>
                                  a.map((x) =>
                                    x.id === eq.id
                                      ? { ...x, model: e.target.value }
                                      : x,
                                  ),
                                )
                              }
                            >
                              <option value="">Cualquier modelo</option>
                              {models.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={eq.model}
                              placeholder="Ej: J-1175"
                              onChange={(e) =>
                                setAvail((a) =>
                                  a.map((x) =>
                                    x.id === eq.id
                                      ? { ...x, model: e.target.value }
                                      : x,
                                  ),
                                )
                              }
                            />
                          )}
                        </div>
                        <button
                          onClick={() =>
                            setAvail((a) => a.filter((x) => x.id !== eq.id))
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: G.red,
                            cursor: "pointer",
                            fontSize: 16,
                            paddingBottom: 6,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                  <button
                    onClick={() =>
                      setAvail((a) => [
                        ...a,
                        { id: Date.now(), type: "jaw", brand: "", model: "" },
                      ])
                    }
                    style={{
                      background: "none",
                      border: `1px dashed ${G.border}`,
                      borderRadius: 6,
                      padding: "8px",
                      color: G.muted,
                      cursor: "pointer",
                      fontSize: 12,
                      fontFamily: G.font,
                    }}
                  >
                    + Agregar equipo
                  </button>
                  <SimulateNotice />
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      justifyContent: "space-between",
                    }}
                  >
                    <SBtn
                      label="← Cambiar opción"
                      onClick={() => setCircPath(null)}
                    />
                    <PBtn
                      label="◈ Simular"
                      onClick={finish}
                      disabled={simDisabled}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
