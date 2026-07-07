import { ROCK_DB } from "./catalogo.js";

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────
export const G = {
  bg: "#0a0e1a",
  surface: "#111827",
  card: "#1a2235",
  card2: "#141e30",
  border: "#2a3550",
  accent: "#f59e0b",
  accentDim: "#92400e",
  green: "#10b981",
  red: "#ef4444",
  redDim: "#7f1d1d",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  text: "#e2e8f0",
  muted: "#64748b",
  faint: "#1e2d45",
  font: "'DM Mono','Fira Mono',monospace",
  fontD: "'Syne',sans-serif",
};

export const GCSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:${G.bg};color:${G.text};font-family:${G.font}}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:${G.surface}}
::-webkit-scrollbar-thumb{background:${G.border};border-radius:3px}
input[type=number],input[type=text]{background:${G.card};color:${G.text};border:1px solid ${G.border};
  border-radius:6px;padding:8px 12px;font-family:${G.font};font-size:14px;outline:none;width:100%}
input[type=number]:focus,input[type=text]:focus{border-color:${G.accent}}
input[type=range]{-webkit-appearance:none;width:100%;height:4px;background:${G.border};border-radius:2px;outline:none;cursor:pointer}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:${G.accent};cursor:pointer}
select{background:${G.card};color:${G.text};border:1px solid ${G.border};border-radius:6px;
  padding:8px 12px;font-family:${G.font};font-size:13px;outline:none;cursor:pointer;width:100%}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes flowDash{to{stroke-dashoffset:-16}}
.fi{animation:fadeIn .35s ease forwards}
.flow{stroke-dasharray:5 3;animation:flowDash .7s linear infinite}
`;

// ── UNIDADES ───────────────────────────────────────────────────────────────
export const STANDARD_INCH_DENOMINATORS = [2, 4, 8, 16];
export const STANDARD_INCH_VALUES = [
  "1/4",
  "3/8",
  "1/2",
  "5/8",
  "3/4",
  "1",
  "1 1/4",
  "1 1/2",
  "1 3/4",
  "2",
  "2 1/2",
  "3",
  "3 1/2",
  "4",
  "5",
  "6",
];
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}
export function formatInches(mm) {
  const inches = mm / 25.4;
  if (inches <= 0) return "0";
  const whole = Math.floor(inches);
  const frac = inches - whole;
  let bestMatch = { diff: Infinity, num: 0, den: 1 };
  STANDARD_INCH_DENOMINATORS.forEach((den) => {
    const num = Math.round(frac * den);
    const diff = Math.abs(frac - num / den);
    if (diff < bestMatch.diff) bestMatch = { diff, num, den };
  });
  if (bestMatch.num > 0 && bestMatch.diff <= 0.03) {
    const num = bestMatch.num;
    const den = bestMatch.den;
    if (num === den) return `${whole + 1}`;
    const div = gcd(num, den);
    const safeNum = num / div;
    const safeDen = den / div;
    return `${whole > 0 ? `${whole} ` : ""}${safeNum}/${safeDen}`;
  }
  return inches.toFixed(2);
}
export function parseMeasureToMm(raw, u) {
  const value = String(raw || "").trim();
  if (!value) return { mm: 0, error: null };
  const cleaned = value.replace(/['""]/g, "").trim();
  if (u === "in") {
    if (/\b(mm|cm)\b/i.test(cleaned)) {
      return {
        mm: 0,
        error:
          "Entrada de pulgadas no debe incluir mm/cm. Usa solo pulgadas estándar.",
      };
    }
    const mixed = cleaned.match(/^(\d+)\s*[ -]?\s*(\d+)\/(\d+)$/);
    const simple = cleaned.match(/^(\d+)\/(\d+)$/);
    const decimal = cleaned.match(/^(\d+(?:[.,]\d+)?)$/);
    const integer = cleaned.match(/^(\d+)$/);
    let inches = 0;
    if (mixed) {
      const whole = Number(mixed[1]);
      const num = Number(mixed[2]);
      const den = Number(mixed[3]);
      if (!STANDARD_INCH_DENOMINATORS.includes(den)) {
        return {
          mm: 0,
          error: `Denominador inválido: usa 2, 4, 8 o 16.`,
        };
      }
      inches = whole + num / den;
    } else if (simple) {
      const num = Number(simple[1]);
      const den = Number(simple[2]);
      if (!STANDARD_INCH_DENOMINATORS.includes(den)) {
        return {
          mm: 0,
          error: `Denominador inválido: usa 2, 4, 8 o 16.`,
        };
      }
      inches = num / den;
    } else if (decimal) {
      inches = Number(decimal[1].replace(",", "."));
    } else if (integer) {
      inches = Number(integer[1]);
    } else {
      return {
        mm: 0,
        error: "Ingrese pulgadas válidas: 3/4, 1 3/4 o 1.75",
      };
    }
    return { mm: Math.round(inches * 25.4), error: null };
  }
  if (/['"\/]/.test(value)) {
    return {
      mm: 0,
      error: `Entrada de ${u} no debe incluir fracciones en pulgadas.`,
    };
  }
  const n = parseFloat(value.replace(",", "."));
  if (isNaN(n)) {
    return { mm: 0, error: `Ingrese un número válido en ${u}.` };
  }
  if (u === "cm") return { mm: Math.round(n * 10), error: null };
  return { mm: Math.round(n), error: null };
}
export function toMm(val, u) {
  return parseMeasureToMm(val, u).mm;
}
export function fromMm(mm, u) {
  if (mm <= 0) return "0";
  if (mm >= 9999) return "∞";
  if (u === "cm") return (mm / 10).toFixed(1);
  if (u === "in") return formatInches(mm);
  return mm.toFixed(0);
}
export function unitLabel(u) {
  return u === "cm" ? "cm" : u === "in" ? '"' : "mm";
}

// ── EXTRACCIÓN IA ──────────────────────────────────────────────────────────
export const EXTRACTION_LABELS = {
  tipo_roca: "Tipo de roca",
  work_index: "Work Index (Wi)",
  f_max_mm: "Tamaño máximo alimentación",
  f80_mm: "F80 (80% pasa)",
  capacidad_tph: "Capacidad requerida",
  densidad_tm3: "Densidad aparente",
  p_max_mm: "Tamaño máximo producto",
  p80_mm: "P80 producto",
  css_primario_mm: "CSS chancador primario",
  css_secundario_mm: "CSS chancador secundario",
  notas_adicionales: "Notas",
};
export const EXTRACTION_UNITS = {
  tipo_roca: "",
  work_index: "kWh/t",
  f_max_mm: "mm",
  f80_mm: "mm",
  capacidad_tph: "tph",
  densidad_tm3: "t/m³",
  p_max_mm: "mm",
  p80_mm: "mm",
  css_primario_mm: "mm",
  css_secundario_mm: "mm",
  notas_adicionales: "",
};
export function normalizeText(raw) {
  if (!raw) return "";
  return String(raw)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[ -]/g, (c) => c)
    .replace(/\p{Diacritic}/gu, "")
    .replace(/["'''`]/g, "")
    .replace(/\s+/g, " ");
}
export function findRockKeyByName(raw) {
  const norm = normalizeText(raw);
  if (!norm) return null;
  const alias = {
    "pórfido de cobre": "porfido",
    "porfido de cobre": "porfido",
    "mineral de hierro": "magnetita",
    "mármol": "caliza",
    "marmol": "caliza",
  };
  if (alias[norm]) return alias[norm];
  for (const key of Object.keys(ROCK_DB)) {
    const entry = normalizeText(ROCK_DB[key].name);
    if (entry === norm) return key;
    if (entry.includes(norm) || norm.includes(entry)) return key;
  }
  return null;
}
export function parsePositiveNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}
export function extractJsonFromText(raw) {
  const text = String(raw || "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON found");
  }
  const candidate = text.slice(start, end + 1);
  return JSON.parse(candidate);
}
export function normalizeExtractionResult(data) {
  const base = {
    tipo_roca: null,
    tipo_roca_key: "desconocida",
    work_index: null,
    f_max_mm: null,
    f80_mm: null,
    capacidad_tph: null,
    densidad_tm3: null,
    p_max_mm: null,
    p80_mm: null,
    css_primario_mm: null,
    css_secundario_mm: null,
    plazo_meses: null,
    notas_adicionales: null,
    supuestos: [],
  };
  const result = { ...base, ...data };
  result.tipo_roca = result.tipo_roca || null;
  result.work_index = parsePositiveNumber(result.work_index);
  result.f_max_mm = parsePositiveNumber(result.f_max_mm);
  result.f80_mm = parsePositiveNumber(result.f80_mm);
  result.capacidad_tph = parsePositiveNumber(result.capacidad_tph);
  result.densidad_tm3 = parsePositiveNumber(result.densidad_tm3);
  result.p_max_mm = parsePositiveNumber(result.p_max_mm);
  result.p80_mm = parsePositiveNumber(result.p80_mm);
  result.css_primario_mm = parsePositiveNumber(result.css_primario_mm);
  result.css_secundario_mm = parsePositiveNumber(result.css_secundario_mm);
  result.plazo_meses = parsePositiveNumber(result.plazo_meses);
  result.notas_adicionales = result.notas_adicionales || null;
  result.supuestos = Array.isArray(result.supuestos)
    ? result.supuestos.filter((s) => Boolean(s))
    : [];
  // Si el tipo de roca es genérico ("mineral", "mineral cobre", etc.) y no hay clave específica,
  // asumir pórfido cuprífero (el más común en Chile y Sudamérica)
  let rockKey = findRockKeyByName(result.tipo_roca);
  if (!rockKey && result.tipo_roca) {
    const norm = normalizeText(result.tipo_roca);
    if (norm.includes("mineral") && !norm.includes("hierro") && !norm.includes("zinc") && !norm.includes("oro") && !norm.includes("plata")) {
      rockKey = "porfido";
      result.supuestos = [
        ...result.supuestos,
        "Tipo de roca 'mineral' sin especificar → asumido pórfido cuprífero (más común en Chile y Sudamérica)"
      ];
    }
  }
  result.tipo_roca_key = rockKey || "desconocida";
  return result;
}

// ── ROSIN-RAMMLER — FITTING DESDE MÚLTIPLES PUNTOS ────────────────────────
// Recibe [{x:mm, p:porcentaje_pasante}], devuelve {n, d63} o null
export function fitRR(points) {
  const valid = points.filter((pt) => pt.x > 0.5 && pt.p > 0.5 && pt.p < 99.5);
  if (valid.length < 2) return null;
  const pts = valid.map((pt) => ({
    X: Math.log(pt.x),
    Y: Math.log(-Math.log(1 - pt.p / 100)),
  }));
  const N = pts.length;
  const sX = pts.reduce((s, p) => s + p.X, 0),
    sY = pts.reduce((s, p) => s + p.Y, 0);
  const sXX = pts.reduce((s, p) => s + p.X * p.X, 0),
    sXY = pts.reduce((s, p) => s + p.X * p.Y, 0);
  const D = N * sXX - sX * sX;
  if (Math.abs(D) < 1e-10) return null;
  const n = (N * sXY - sX * sY) / D;
  const b = (sY - n * sX) / N;
  const d63 = Math.exp(-b / Math.max(n, 0.01));
  return { n: Math.max(0.3, Math.min(4.0, n)), d63: Math.max(0.1, d63) };
}

// .replace elimina BOM (U+FEFF) que Vercel puede inyectar al guardar el env var en su dashboard
export const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1").replace(/^﻿/, "").trim();
