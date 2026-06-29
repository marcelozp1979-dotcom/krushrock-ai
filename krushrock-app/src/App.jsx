import { useState, useEffect } from "react";

const G = {
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

const GCSS = `
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

// ── BASE DE DATOS DE ROCAS ─────────────────────────────────────────────────
const ROCK_DB = {
  huevillo_fino: {
    wi: 10.5,
    ab: 0.18,
    den: 2.55,
    rrN: 0.92,
    name: "Huevillo fino (< 50mm)",
    desc: "Wi ≈ 10.5 | Canto rodado, áridos construcción",
  },
  huevillo_grueso: {
    wi: 12.0,
    ab: 0.22,
    den: 2.65,
    rrN: 0.88,
    name: "Huevillo grueso (50–200mm)",
    desc: "Wi ≈ 12.0 | Rodado, mezcla mineralógica",
  },
  grava_aluvial: {
    wi: 11.0,
    ab: 0.15,
    den: 2.5,
    rrN: 0.95,
    name: "Grava aluvial mixta",
    desc: "Wi ≈ 11.0 | Alto % finos naturales, humedad frecuente",
  },
  bolones_rio: {
    wi: 13.5,
    ab: 0.28,
    den: 2.7,
    rrN: 0.85,
    name: "Bolones de río (> 200mm)",
    desc: "Wi ≈ 13.5 | Requiere scalper o mandíbula grande",
  },
  andesita: {
    wi: 16.0,
    ab: 0.32,
    den: 2.65,
    rrN: 0.78,
    name: "Andesita",
    desc: "Wi ≈ 16.0 | Abrasión media-alta",
  },
  granito: {
    wi: 15.5,
    ab: 0.28,
    den: 2.7,
    rrN: 0.8,
    name: "Granito",
    desc: "Wi ≈ 15.5 | Abrasión media",
  },
  basalto: {
    wi: 17.0,
    ab: 0.35,
    den: 2.9,
    rrN: 0.75,
    name: "Basalto",
    desc: "Wi ≈ 17.0 | Abrasión alta",
  },
  diorita: {
    wi: 15.0,
    ab: 0.3,
    den: 2.8,
    rrN: 0.79,
    name: "Diorita",
    desc: "Wi ≈ 15.0 | Abrasión media",
  },
  gabro: {
    wi: 13.0,
    ab: 0.25,
    den: 2.95,
    rrN: 0.81,
    name: "Gabro",
    desc: "Wi ≈ 13.0 | Abrasión media",
  },
  caliza: {
    wi: 11.2,
    ab: 0.12,
    den: 2.6,
    rrN: 1.05,
    name: "Caliza",
    desc: "Wi ≈ 11.2 | Baja abrasión",
  },
  arenisca: {
    wi: 9.5,
    ab: 0.08,
    den: 2.3,
    rrN: 1.15,
    name: "Arenisca",
    desc: "Wi ≈ 9.5  | Muy baja abrasión",
  },
  dolomita: {
    wi: 11.5,
    ab: 0.14,
    den: 2.85,
    rrN: 1.02,
    name: "Dolomita",
    desc: "Wi ≈ 11.5 | Baja abrasión",
  },
  cuarcita: {
    wi: 19.5,
    ab: 0.45,
    den: 2.65,
    rrN: 0.7,
    name: "Cuarcita",
    desc: "Wi ≈ 19.5 | Muy alta abrasión",
  },
  porfido: {
    wi: 16.0,
    ab: 0.3,
    den: 2.72,
    rrN: 0.82,
    name: "Pórfido cuprífero",
    desc: "Wi ≈ 16.0 | Abrasión media",
  },
  cobre_ox: {
    wi: 10.5,
    ab: 0.15,
    den: 2.5,
    rrN: 0.95,
    name: "Mineral oxidado cobre",
    desc: "Wi ≈ 10.5 | Baja abrasión",
  },
  magnetita: {
    wi: 10.0,
    ab: 0.2,
    den: 4.9,
    rrN: 0.88,
    name: "Magnetita",
    desc: "Wi ≈ 10.0 | Alta densidad",
  },
  hematita: {
    wi: 12.5,
    ab: 0.25,
    den: 4.8,
    rrN: 0.85,
    name: "Hematita",
    desc: "Wi ≈ 12.5 | Alta densidad",
  },
  oro_cuarzo: {
    wi: 15.0,
    ab: 0.4,
    den: 2.8,
    rrN: 0.77,
    name: "Oro en cuarzo",
    desc: "Wi ≈ 15.0 | Abrasión alta",
  },
  caliche: {
    wi: 7.0,
    ab: 0.05,
    den: 2.1,
    rrN: 1.2,
    name: "Caliche",
    desc: "Wi ≈ 7.0  | Muy blanda",
  },
  desconocida: {
    wi: 13.0,
    ab: 0.2,
    den: 2.7,
    rrN: 0.85,
    name: "Roca desconocida",
    desc: "Valores promedio estimados",
  },
};

const ROCK_CATS = {
  aridos: ["huevillo_fino", "huevillo_grueso", "grava_aluvial", "bolones_rio"],
  mineria: ["porfido", "cobre_ox", "magnetita", "oro_cuarzo"],
  roca_dura: ["andesita", "granito", "basalto", "cuarcita"],
  roca_blanda: ["caliza", "caliche", "arenisca", "dolomita"],
};

// ── CATÁLOGO DE EQUIPOS (FALLBACK LOCAL) ──────────────────────────────────
// TODO: eliminar cuando el endpoint /equipment esté estable en producción.
// El componente App lo sobreescribe con datos de Supabase al montarse.
const EQ_LOCAL = {
  jaw: [
    {
      brand: "Terex Finlay",
      model: "J-960",
      palanca: "doble",
      rpm: 320,
      feedMm: 580,
      cssR: [40, 140],
      capR: [80, 200],
      notes: "Compacta, orugas",
    },
    {
      brand: "Terex Finlay",
      model: "J-1160",
      palanca: "doble",
      rpm: 300,
      feedMm: 780,
      cssR: [45, 160],
      capR: [150, 280],
      notes: "Orugas, C9.3 ACERT",
    },
    {
      brand: "Terex Finlay",
      model: "J-1175",
      palanca: "doble",
      rpm: 290,
      feedMm: 790,
      cssR: [50, 175],
      capR: [200, 350],
      notes: "Orugas, C13 ACERT",
    },
    {
      brand: "Terex Finlay",
      model: "J-1280",
      palanca: "doble",
      rpm: 270,
      feedMm: 1070,
      cssR: [75, 175],
      capR: [250, 400],
      notes: "Orugas, alta capacidad",
    },
    {
      brand: "Terex Finlay",
      model: "J-1480",
      palanca: "simple",
      rpm: 250,
      feedMm: 1400,
      cssR: [100, 200],
      capR: [400, 600],
      notes: "Orugas, gran formato",
    },
    {
      brand: "Powerscreen",
      model: "Premiertrak 600",
      palanca: "doble",
      rpm: 310,
      feedMm: 600,
      cssR: [40, 150],
      capR: [100, 220],
      notes: "Compacta, orugas",
    },
    {
      brand: "Powerscreen",
      model: "Premiertrak 1180",
      palanca: "doble",
      rpm: 275,
      feedMm: 1070,
      cssR: [75, 175],
      capR: [200, 400],
      notes: "Accionamiento directo",
    },
    {
      brand: "Powerscreen",
      model: "Premiertrak 1300",
      palanca: "simple",
      rpm: 260,
      feedMm: 1100,
      cssR: [75, 175],
      capR: [250, 450],
      notes: "Alta capacidad",
    },
    {
      brand: "Kleemann",
      model: "MC 100 Ri EVO",
      palanca: "doble",
      rpm: 305,
      feedMm: 760,
      cssR: [50, 150],
      capR: [150, 280],
      notes: "Diesel-eléctrico",
    },
    {
      brand: "Kleemann",
      model: "MC 110 Ri EVO",
      palanca: "doble",
      rpm: 290,
      feedMm: 950,
      cssR: [60, 160],
      capR: [200, 380],
      notes: "Diesel-eléctrico",
    },
    {
      brand: "Kleemann",
      model: "MC 120 Zi EVO",
      palanca: "simple",
      rpm: 265,
      feedMm: 1200,
      cssR: [80, 180],
      capR: [300, 500],
      notes: "Diesel-eléctrico",
    },
    {
      brand: "Sandvik",
      model: "UJ310",
      palanca: "doble",
      rpm: 300,
      feedMm: 820,
      cssR: [50, 160],
      capR: [150, 280],
      notes: "Orugas",
    },
    {
      brand: "Sandvik",
      model: "UJ440i",
      palanca: "simple",
      rpm: 265,
      feedMm: 1100,
      cssR: [65, 200],
      capR: [200, 450],
      notes: "Radio remoto incluido",
    },
    {
      brand: "Metso Outotec",
      model: "LT106",
      palanca: "doble",
      rpm: 290,
      feedMm: 900,
      cssR: [55, 160],
      capR: [150, 300],
      notes: "Orugas sobre chasis",
    },
    {
      brand: "Metso Outotec",
      model: "LT120",
      palanca: "doble",
      rpm: 275,
      feedMm: 1100,
      cssR: [65, 180],
      capR: [200, 400],
      notes: "Orugas, alta producción",
    },
    {
      brand: "Metso Outotec",
      model: "LT130E",
      palanca: "simple",
      rpm: 255,
      feedMm: 1200,
      cssR: [75, 200],
      capR: [250, 500],
      notes: "Eléctrico, gran capacidad",
    },
    {
      brand: "Astec",
      model: "GT125",
      palanca: "doble",
      rpm: 310,
      feedMm: 760,
      cssR: [45, 150],
      capR: [120, 250],
      notes: "Orugas, compacta",
    },
    {
      brand: "Astec",
      model: "GT165",
      palanca: "doble",
      rpm: 285,
      feedMm: 1050,
      cssR: [65, 175],
      capR: [200, 380],
      notes: "Orugas, estándar",
    },
  ],
  cone: [
    {
      brand: "Terex Finlay",
      model: "C-1540",
      rpm: 280,
      feedMm: 215,
      cssR: [10, 44],
      capR: [150, 300],
      notes: "Cono secundario estándar",
    },
    {
      brand: "Terex Finlay",
      model: "C-1545",
      rpm: 285,
      feedMm: 240,
      cssR: [10, 48],
      capR: [160, 320],
      notes: "Cono alta eficiencia",
    },
    {
      brand: "Terex Finlay",
      model: "C-1550",
      rpm: 290,
      feedMm: 280,
      cssR: [10, 50],
      capR: [180, 370],
      notes: "Alta capacidad, orugas",
    },
    {
      brand: "Terex Finlay",
      model: "C-1554",
      rpm: 295,
      feedMm: 280,
      cssR: [8, 50],
      capR: [200, 400],
      notes: "Recorrido largo, alto rendimiento",
    },
    {
      brand: "Powerscreen",
      model: "Maxtrak 1000",
      rpm: 300,
      feedMm: 130,
      cssR: [8, 38],
      capR: [80, 200],
      notes: "Compacto, orugas",
    },
    {
      brand: "Powerscreen",
      model: "Maxtrak 1150",
      rpm: 285,
      feedMm: 185,
      cssR: [10, 44],
      capR: [130, 280],
      notes: "Autónomo sobre orugas",
    },
    {
      brand: "Powerscreen",
      model: "Maxtrak 1300",
      rpm: 278,
      feedMm: 220,
      cssR: [10, 48],
      capR: [180, 380],
      notes: "Alta capacidad",
    },
    {
      brand: "Sandvik",
      model: "QH331",
      rpm: 310,
      feedMm: 185,
      cssR: [6, 38],
      capR: [100, 240],
      notes: "CH430 Hydrocone",
    },
    {
      brand: "Sandvik",
      model: "QH332",
      rpm: 310,
      feedMm: 185,
      cssR: [6, 38],
      capR: [120, 260],
      notes: "CH430 Hydrocone",
    },
    {
      brand: "Sandvik",
      model: "QH441",
      rpm: 290,
      feedMm: 275,
      cssR: [8, 45],
      capR: [180, 400],
      notes: "CH660 Hydrocone",
    },
    {
      brand: "Kleemann",
      model: "MCO 9i S EVO",
      rpm: 315,
      feedMm: 150,
      cssR: [8, 32],
      capR: [90, 200],
      notes: "Diesel-eléctrico",
    },
    {
      brand: "Kleemann",
      model: "MCO 11i EVO",
      rpm: 298,
      feedMm: 185,
      cssR: [8, 44],
      capR: [130, 300],
      notes: "Diesel-eléctrico",
    },
    {
      brand: "Kleemann",
      model: "MCO 13i EVO",
      rpm: 285,
      feedMm: 225,
      cssR: [10, 48],
      capR: [180, 400],
      notes: "",
    },
    {
      brand: "Metso Outotec",
      model: "LT200HPS",
      rpm: 280,
      feedMm: 215,
      cssR: [8, 44],
      capR: [140, 300],
      notes: "Orugas, cono HP",
    },
    {
      brand: "Metso Outotec",
      model: "LT300HPS",
      rpm: 270,
      feedMm: 270,
      cssR: [10, 50],
      capR: [200, 450],
      notes: "Orugas, gran capacidad",
    },
    {
      brand: "Astec",
      model: "GT440",
      rpm: 290,
      feedMm: 190,
      cssR: [8, 44],
      capR: [130, 280],
      notes: "Orugas",
    },
    {
      brand: "Astec",
      model: "GT550",
      rpm: 278,
      feedMm: 230,
      cssR: [10, 50],
      capR: [180, 380],
      notes: "Orugas, alta capacidad",
    },
  ],
  hsi: [
    {
      brand: "Terex Finlay",
      model: "I-110RS",
      feedMm: 750,
      capR: [130, 250],
      notes: "Primario/secundario, orugas",
    },
    {
      brand: "Terex Finlay",
      model: "I-120RS",
      feedMm: 850,
      capR: [160, 300],
      notes: "Con seleccionadora integrada",
    },
    {
      brand: "Terex Finlay",
      model: "I-140RS",
      feedMm: 900,
      capR: [250, 400],
      notes: "Alta capacidad, orugas",
    },
    {
      brand: "Terex Finlay",
      model: "I-1312RS",
      feedMm: 1100,
      capR: [300, 500],
      notes: "Primario, roca blanda-media",
    },
    {
      brand: "Powerscreen",
      model: "Trakpactor 260",
      feedMm: 800,
      capR: [150, 280],
      notes: "Orugas",
    },
    {
      brand: "Powerscreen",
      model: "Trakpactor 320",
      feedMm: 900,
      capR: [200, 350],
      notes: "Orugas",
    },
    {
      brand: "Powerscreen",
      model: "Trakpactor 550SR",
      feedMm: 1100,
      capR: [300, 500],
      notes: "Con seleccionadora integrada",
    },
    {
      brand: "Kleemann",
      model: "MR 110i EVO2",
      feedMm: 1100,
      capR: [200, 380],
      notes: "Diesel-eléctrico",
    },
    {
      brand: "Kleemann",
      model: "MR 130i EVO2",
      feedMm: 1300,
      capR: [300, 500],
      notes: "Diesel-eléctrico",
    },
    {
      brand: "Metso Outotec",
      model: "LT1213S",
      feedMm: 1000,
      capR: [200, 400],
      notes: "Con seleccionadora integrada",
    },
    {
      brand: "Metso Outotec",
      model: "LT1415",
      feedMm: 1100,
      capR: [250, 450],
      notes: "",
    },
    {
      brand: "Sandvik",
      model: "QI341",
      feedMm: 850,
      capR: [160, 300],
      notes: "HSI primario/secundario",
    },
    {
      brand: "Sandvik",
      model: "QI442",
      feedMm: 1000,
      capR: [250, 450],
      notes: "HSI alta capacidad",
    },
    {
      brand: "Astec",
      model: "GT2310",
      feedMm: 900,
      capR: [150, 300],
      notes: "Orugas",
    },
    {
      brand: "Astec",
      model: "GT4250",
      feedMm: 1100,
      capR: [250, 450],
      notes: "Orugas",
    },
  ],
  screen: [
    {
      brand: "Terex Finlay",
      model: "683",
      decks: 2,
      capR: [100, 250],
      notes: "2 deck — versátil, orugas",
    },
    {
      brand: "Terex Finlay",
      model: "684 2-deck",
      decks: 2,
      capR: [120, 280],
      notes: "2 deck — alta producción",
    },
    {
      brand: "Terex Finlay",
      model: "684 3-deck",
      decks: 3,
      capR: [150, 300],
      notes: "3 deck — alta clasificación",
    },
    {
      brand: "Terex Finlay",
      model: "694+",
      decks: 3,
      capR: [150, 350],
      notes: "3 deck — orugas, 3 fracciones",
    },
    {
      brand: "Terex Finlay",
      model: "696 3-deck",
      decks: 3,
      capR: [180, 400],
      notes: "3 deck — gran capacidad",
    },
    {
      brand: "Powerscreen",
      model: "Warrior 1800",
      decks: 2,
      capR: [100, 280],
      notes: "2 deck",
    },
    {
      brand: "Powerscreen",
      model: "Chieftain 1700",
      decks: 2,
      capR: [120, 300],
      notes: "2 deck — fácil cambio de mallas",
    },
    {
      brand: "Powerscreen",
      model: "Chieftain 2100X",
      decks: 3,
      capR: [150, 380],
      notes: "3 deck — alta capacidad",
    },
    {
      brand: "Kleemann",
      model: "MS 703i",
      decks: 2,
      capR: [100, 250],
      notes: "2 deck — eléctrico, compacto",
    },
    {
      brand: "Kleemann",
      model: "MS 953i EVO",
      decks: 3,
      capR: [150, 350],
      notes: "3 deck — diesel-eléctrico",
    },
    {
      brand: "Sandvik",
      model: "QA330",
      decks: 2,
      capR: [120, 280],
      notes: "2 deck",
    },
    {
      brand: "Sandvik",
      model: "QA335",
      decks: 3,
      capR: [150, 300],
      notes: "3 deck — plantas áridos",
    },
    {
      brand: "Metso Outotec",
      model: "ST2.4",
      decks: 2,
      capR: [100, 250],
      notes: "2 deck",
    },
    {
      brand: "Metso Outotec",
      model: "ST3.5",
      decks: 3,
      capR: [150, 350],
      notes: "3 deck",
    },
    {
      brand: "Astec",
      model: "M6x20-3D",
      decks: 3,
      capR: [150, 300],
      notes: "3 deck",
    },
  ],
  screen_1d: [
    {
      brand: "Terex Finlay",
      model: "Rinser 873",
      decks: 1,
      capR: [80, 200],
      notes: "1 deck lavado/descascarado",
    },
    {
      brand: "Powerscreen",
      model: "Warrior 600",
      decks: 1,
      capR: [60, 150],
      notes: "1 deck, compacta",
    },
    {
      brand: "Kleemann",
      model: "MS 402i",
      decks: 1,
      capR: [70, 180],
      notes: "1 deck eléctrico",
    },
    {
      brand: "Metso Outotec",
      model: "ST1.5",
      decks: 1,
      capR: [80, 180],
      notes: "1 deck",
    },
    {
      brand: "Sandvik",
      model: "QA141",
      decks: 1,
      capR: [80, 200],
      notes: "1 deck",
    },
  ],
  screen_hf: [
    {
      brand: "Terex Finlay",
      model: "883 HF",
      decks: 2,
      capR: [80, 200],
      notes: "Alta frecuencia 2 deck, finos",
    },
    {
      brand: "Terex Finlay",
      model: "884 HF",
      decks: 2,
      capR: [100, 240],
      notes: "Alta frecuencia 2 deck",
    },
    {
      brand: "Powerscreen",
      model: "Warrior 2100",
      decks: 2,
      capR: [100, 250],
      notes: "Alta frecuencia, fino seco",
    },
    {
      brand: "Kleemann",
      model: "MOBISCREEN HF",
      decks: 2,
      capR: [80, 200],
      notes: "Alta frecuencia",
    },
    {
      brand: "Metso Outotec",
      model: "SF Series HF",
      decks: 2,
      capR: [90, 220],
      notes: "Alta frecuencia",
    },
  ],
};

// EQ_BY_CAT se define dentro del componente App (accede al catálogo remoto vía estado).
// Esta constante local solo se usa como fallback si el componente no ha cargado aún.
const EQ_BY_CAT_LOCAL = {
  jaw: EQ_LOCAL.jaw,
  cone: EQ_LOCAL.cone,
  hsi: EQ_LOCAL.hsi,
  screen3d: EQ_LOCAL.screen.filter((e) => e.decks === 3),
  screen2d: EQ_LOCAL.screen.filter((e) => e.decks === 2),
  screen1d: EQ_LOCAL.screen_1d,
  screen_hf: EQ_LOCAL.screen_hf,
};

const CAT_LABELS = {
  jaw: "Mandíbula",
  cone: "Cono",
  hsi: "HSI",
  screen3d: "Selec. 3D",
  screen2d: "Selec. 2D",
  screen1d: "Selec. 1D",
  screen_hf: "Selec. AF",
};

// ── UNIDADES ───────────────────────────────────────────────────────────────
const STANDARD_INCH_DENOMINATORS = [2, 4, 8, 16];
const STANDARD_INCH_VALUES = [
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
function formatInches(mm) {
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
function parseMeasureToMm(raw, u) {
  const value = String(raw || "").trim();
  if (!value) return { mm: 0, error: null };
  const cleaned = value.replace(/['"”]/g, "").trim();
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
function toMm(val, u) {
  return parseMeasureToMm(val, u).mm;
}
function fromMm(mm, u) {
  if (mm <= 0) return "0";
  if (mm >= 9999) return "∞";
  if (u === "cm") return (mm / 10).toFixed(1);
  if (u === "in") return formatInches(mm);
  return mm.toFixed(0);
}
function unitLabel(u) {
  return u === "cm" ? "cm" : u === "in" ? '"' : "mm";
}

const EXTRACTION_LABELS = {
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
const EXTRACTION_UNITS = {
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
function normalizeText(raw) {
  if (!raw) return "";
  return String(raw)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[ -]/g, (c) => c)
    .replace(/\p{Diacritic}/gu, "")
    .replace(/["'’‘`]/g, "")
    .replace(/\s+/g, " ");
}
function findRockKeyByName(raw) {
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
function parsePositiveNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}
function extractJsonFromText(raw) {
  const text = String(raw || "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON found");
  }
  const candidate = text.slice(start, end + 1);
  return JSON.parse(candidate);
}
function normalizeExtractionResult(data) {
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
function fitRR(points) {
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
const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1").replace(/^\ufeff/, "").trim();

// ── MOTOR DE SIMULACIÓN v2 — llama al backend con curvas reales ────────────
async function runSimulation(inp) {
  // Catálogo de equipos: usa el del componente (remoto) o el fallback local
  const EQ = inp.eqCatalog || EQ_LOCAL;

  const {
    rockKey, customName, customWi, customDen, customAb,
    tph, f80, products, humidity, circPath, manualEq, manModel,
    altitude, altitudeOmit, curveType, f50, curvePoints, manConeCSS,
  } = inp;

  let rock = { ...(ROCK_DB[rockKey] || ROCK_DB.desconocida) };
  if (rockKey === "personalizada") {
    rock.wi = Number(customWi) || 13;
    rock.den = Number(customDen) || 2.7;
    rock.ab = Number(customAb) || 0.2;
    rock.name = customName || "Material personalizado";
  } else {
    if (customWi > 0) rock.wi = Number(customWi);
    if (customDen > 0) rock.den = Number(customDen);
    if (customAb !== null && customAb !== undefined) rock.ab = Number(customAb);
  }

  const actP = products.filter((p) => p.active);
  const fineTargets = actP.filter((p) => p.maxMm > 0 && p.maxMm < 9999).map((p) => p.maxMm);
  const p80T = fineTargets.length > 0 ? Math.min(...fineTargets, f80) : f80;
  const humN = humidity === null || humidity === "unknown" ? 0 : Number(humidity);
  const altM = altitudeOmit ? 0 : Number(altitude) || 0;
  const altC = altM > 1500 ? Math.max(0.6, 1 - (altM - 1500) * 0.0001) : 1.0;

  const jawModel = manModel?.jaw || "";
  const coneModel = manModel?.cone || "";
  const jawEq = jawModel ? EQ.jaw.find((e) => e.model === jawModel) : null;
  const coneEq = coneModel ? EQ.cone.find((e) => e.model === coneModel) : null;
  const jaw_palanca = jawEq?.palanca || "doble";
  const jaw_rpm = jawEq?.rpm || (f80 > 800 ? 255 : f80 > 600 ? 275 : 300);
  const cone_rpm = coneEq?.rpm || 285;
  const cone_perfil = inp.conePerfil || "M";

  // Targets P80 por etapa — el backend resuelve el CSS con bisección sobre curvas normalizadas.
  // No se usan jawFactor/coneFactor: Wi y humedad afectan energía Bond y eficiencia de harnero,
  // no la curva de producto normalizada (supuesto físicamente correcto).
  const needsT = p80T < 18;
  const jawTargetP80  = Math.max(60, p80T * 2.5);            // primario: ~2.5× el objetivo final
  const coneTargetP80 = needsT ? p80T * 2.0 : p80T;         // secundario
  const vsiTargetP80  = p80T;                                 // terciario = objetivo final

  // Estimación de CSS primario solo para validar compatibilidad con F80 de alimentación
  const roughJawCss = Math.max(50, Math.min(185, jawTargetP80 / 1.7));
  const feedOk = f80 <= roughJawCss * 3.2;

  const hasScreen = manualEq && (manualEq.screen3d || manualEq.screen2d || manualEq.screen1d || manualEq.screen_hf);
  const isOpen = circPath === "manual" && !hasScreen;
  const autoMesh = Math.round(p80T * 0.9);
  const md = inp.meshDecks || {};
  const meshMm = md[1] > 0 ? md[1] : autoMesh;
  const nDecks = inp.screenDecks || 1;

  let circActual = "cerrado";
  if (circPath === "ai") {
    circActual = humN >= 2 ? "con_scalper" : actP.length >= 3 ? "cerrado_doble" : "cerrado";
  } else if (circPath === "manual") {
    circActual = manualEq?.screen3d ? "cerrado_doble" : hasScreen ? "cerrado" : "abierto";
  }

  // Recomendaciones de equipo filtradas por capacidad (CSS lo calcula el backend)
  const is3d = actP.length >= 3 || needsT;
  const screenSrc = is3d ? EQ.screen.filter((e) => e.decks === 3) : EQ.screen.filter((e) => e.decks === 2);
  const jawFit    = EQ.jaw.filter((e) => tph <= e.capR[1]).slice(0, 3);
  const coneFit   = EQ.cone.filter((e) => tph <= e.capR[1]).slice(0, 3);
  const screenFit = screenSrc.filter((e) => tph <= e.capR[1]).slice(0, 3);
  const hsiFit    = EQ.hsi.filter((e) => tph <= e.capR[1]).slice(0, 3);
  const eqRec = {
    jaw:    jawFit.length    ? jawFit    : EQ.jaw.slice(0, 2),
    cone:   coneFit.length   ? coneFit   : EQ.cone.slice(0, 3),
    screen: screenFit.length ? screenFit : screenSrc.slice(0, 2),
    hsi:    hsiFit.length    ? hsiFit    : EQ.hsi.slice(0, 2),
    // true cuando ningún equipo del catálogo alcanza el tph pedido (fallback activo)
    capacidadExcedida: {
      jaw:    !jawFit.length    && EQ.jaw.length    > 0,
      cone:   !coneFit.length   && EQ.cone.length   > 0,
      screen: !screenFit.length && screenSrc.length > 0,
      hsi:    !hsiFit.length    && EQ.hsi.length    > 0,
    },
    is3d,
  };

  const meshCandidates = [...new Set(actP.filter((p) => p.active && p.maxMm > 0 && p.maxMm < 9999).map((p) => p.maxMm))].sort((a, b) => b - a);
  const recommendedDecks = Math.max(1, Math.min(3, meshCandidates.length || 1));
  const recommendedMesh = {
    deck1: meshCandidates[0] || autoMesh,
    deck2: meshCandidates[1] || Math.round((meshCandidates[0] || autoMesh) * 0.9),
    deck3: meshCandidates[2] || Math.round((meshCandidates[1] || meshCandidates[0] || autoMesh * 0.6) * 0.75),
  };

  let errPct = 22;
  if (curveType === "partial") errPct = 12;
  if (curveType === "full") {
    const nPts = (curvePoints || []).filter((p) => p.sizeMm > 0).length;
    errPct = nPts >= 6 ? 4 : nPts >= 4 ? 6 : nPts >= 2 ? 9 : 14;
  }
  if (rockKey === "desconocida") errPct += 8;
  if (rockKey === "personalizada") errPct += 3;
  if (humidity === "unknown") errPct += 4;
  if (altM > 3500) errPct += 3;
  if (!inp.conePerfil || inp.conePerfil === "M") errPct += 3;
  if (!(inp.meshDecks?.[1] > 0)) errPct += 4;
  if ((inp.screenDecks || 1) >= 2) errPct -= 2;
  errPct = Math.min(errPct, 32);
  const errColor = errPct <= 7 ? G.green : errPct <= 14 ? G.accent : G.red;

  const apiNodes = [];
  apiNodes.push({
    id: "jaw_1", type: "jaw", target_p80_mm: jawTargetP80,
    equipment: { id: "jaw_1", brand: "", model: manModel?.jaw || "Jaw", type: "jaw", specs: {}, curves: {}, capex_usd: 600000 },
  });
  if (!isOpen) {
    apiNodes.push({
      id: "screen_1", type: "screen", aperture_mm: meshMm,
      equipment: { id: "screen_1", brand: "", model: "Screen", type: "screen", specs: {}, curves: {}, capex_usd: 250000 },
    });
  }
  apiNodes.push({
    id: "cone_1", type: "cone",
    ...(manConeCSS > 0 ? { css_mm: Number(manConeCSS) } : { target_p80_mm: coneTargetP80 }),
    equipment: { id: "cone_1", brand: "", model: manModel?.cone || "Cone", type: "cone", specs: {}, curves: {}, capex_usd: 800000 },
  });
  if (needsT) {
    apiNodes.push({
      id: "vsi_1", type: "vsi", target_p80_mm: vsiTargetP80,
      equipment: { id: "vsi_1", brand: "", model: "VSI", type: "vsi", specs: {}, curves: {}, capex_usd: 500000 },
    });
  }

  let feedCurve = null;
  let f50ApiVal = null;
  if (curveType === "full" && curvePoints?.length > 0) {
    const vp = curvePoints.filter((p) => p.sizeMm > 0);
    if (vp.length > 0) {
      feedCurve = {};
      vp.forEach((p) => { feedCurve[String(p.sizeMm)] = p.pct; });
    }
  } else if (curveType === "partial" && f50 > 0) {
    f50ApiVal = f50;
  }

  const apiProducts = actP.map((p) => ({ id: String(p.id), label: p.label || "", min_mm: p.minMm || 0, max_mm: p.maxMm || 9999 }));

  let apiResult = null;
  let apiErrorStatus = 0;
  let apiErrorBody = "";
  try {
    const apiUrl = API_BASE + "/simulations/calculate";
    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tph: Number(tph),
        f80: Number(f80),
        p80_target: p80T,
        rock_type: rockKey === "personalizada" ? "desconocida" : (rockKey || "desconocida"),
        humidity: humN,
        circuit: isOpen ? "open" : "closed",
        hours_per_year: Number(inp.hoursPerYear || 6000),
        nodes: apiNodes,
        f50: f50ApiVal,
        feed_curve: feedCurve,
        products: apiProducts,
        save: false,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      apiResult = data.result;
    } else {
      apiErrorStatus = resp.status;
      try { apiErrorBody = await resp.text(); } catch {}
      console.error("KrushRock API error:", resp.status, apiErrorBody);
    }
  } catch (err) {
    throw new Error(
      `El servidor KrushRock no está disponible (${API_BASE}). Verifica tu conexión o vuelve a intentar.\n\nDetalle: ${err.message}`
    );
  }

  if (!apiResult) {
    throw new Error(
      apiErrorStatus
        ? `Error del servidor (HTTP ${apiErrorStatus}): ${apiErrorBody.slice(0, 500) || "sin detalle"}`
        : "El servidor respondió pero no devolvió resultados válidos. Revisa los logs del backend."
    );
  }

  const sq = (x) => Math.sqrt(Math.max(x, 0.01));
  const toUm = (mm) => mm * 1000;

  let primaryP80, secondaryP80, tertP80;
  let primaryCss = 0, secondaryCss = 0, tertiaryCss = 0;
  let screenEffVal, screenOverVal, ccLoadVal, finalP80;
  let ePerTVal, eTotKwVal, scoreVal;
  let products_display, bottlenecks_display, productAlerts;

  if (apiResult) {
    const jawRes    = apiResult.node_results?.jaw_1    || {};
    const coneRes   = apiResult.node_results?.cone_1   || {};
    const screenRes = apiResult.node_results?.screen_1 || {};
    const vsiRes    = apiResult.node_results?.vsi_1    || {};

    // CSS calculado por el backend (bisección sobre curvas normalizadas)
    primaryCss   = jawRes.css_mm    ?? 0;
    secondaryCss = coneRes.css_mm   ?? 0;
    tertiaryCss  = vsiRes.css_mm    ?? 0;

    primaryP80   = jawRes.p80_out_mm    ?? jawTargetP80;
    secondaryP80 = coneRes.p80_out_mm   ?? coneTargetP80;
    tertP80      = vsiRes.p80_out_mm    ?? vsiTargetP80;
    screenEffVal = screenRes.efficiency_pct ?? 85;
    screenOverVal= screenRes.oversize_tph   ?? 0;
    ccLoadVal    = apiResult.circ_load_pct  ?? 0;
    finalP80     = apiResult.final_p80_mm   ?? secondaryP80;
    ePerTVal     = apiResult.total_energy_kwh_t ?? 0;
    eTotKwVal    = ePerTVal * Number(tph);
    scoreVal     = apiResult.eff_score ?? 0;

    products_display = actP.map((p) => {
      const ap = apiResult.product_yields?.find((x) => String(x.id) === String(p.id));
      return { ...p, yldPct: ap ? ap.yld_pct.toFixed(1) : "0.0", tphOut: ap ? ap.tph_out.toFixed(0) : "0" };
    });

    const totalProdTph = products_display.reduce((s, p) => s + Number(p.tphOut || 0), 0);
    productAlerts = [];
    if (totalProdTph <= 0 && actP.length > 0) {
      productAlerts.push({ level: "error", text: "Ningun producto genera tonelaje util: revisa los rangos de tamano o la alimentacion." });
    }

    bottlenecks_display = [...(apiResult.bottlenecks || [])];
    if (!feedOk) bottlenecks_display.unshift("F80 (" + f80 + "mm) puede exceder apertura efectiva del chancador primario");
    if (altM > 3000) bottlenecks_display.push("Altitud " + altM + "m: motores al " + (altC * 100).toFixed(0) + "% de potencia nominal");
    if (humN >= 2 && !isOpen) bottlenecks_display.push("Humedad afecta eficiencia de seleccionadora");
  }

  const ePrimShow = Math.max(0, 10 * rock.wi * (1 / sq(toUm(primaryP80))   - 1 / sq(toUm(f80)))) / altC;
  const eSecShow  = Math.max(0, 10 * rock.wi * (1 / sq(toUm(secondaryP80)) - 1 / sq(toUm(primaryP80)))) / altC;
  const eTShow    = needsT ? Math.max(0, 10 * rock.wi * (1 / sq(toUm(tertP80)) - 1 / sq(toUm(secondaryP80)))) / altC : 0;

  return {
    rock, inp, p80T, needsT, circActual, feedOk, altC, altM, errPct, errColor, eqRec,
    alerts: productAlerts,
    jawPalanca: jaw_palanca, jawRpm: jaw_rpm, coneRpm: cone_rpm, conePerfil: cone_perfil, meshMm,
    recommendedDecks, recommendedMesh,
    primary:   { css: primaryCss.toFixed(0),   p80: (primaryP80   ?? 0).toFixed(0), energy: ePrimShow.toFixed(2) },
    secondary: { css: secondaryCss.toFixed(0), p80: (secondaryP80 ?? 0).toFixed(0), energy: eSecShow.toFixed(2)  },
    tertiary: needsT ? { css: tertiaryCss.toFixed(0), p80: (tertP80 ?? 0).toFixed(0), energy: eTShow.toFixed(2) } : null,
    screening: { eff: (screenEffVal ?? 0).toFixed(1), over: (screenOverVal ?? 0).toFixed(1), ccLoad: (ccLoadVal ?? 0).toFixed(1) },
    final: {
      p80:   (finalP80  ?? 0).toFixed(1),
      ePerT: (ePerTVal  ?? 0).toFixed(2),
      eTot:  (eTotKwVal ?? 0).toFixed(0),
      score: (scoreVal  ?? 0).toFixed(0),
    },
    products: products_display,
    bottlenecks: bottlenecks_display,
    apiResult,
  };
}

// ── ANÁLISIS POR REGLAS ────────────────────────────────────────────────────
function buildAnalysis(r) {
  const score = Number(r.final.score),
    cc = Number(r.screening.ccLoad);
  const p80f = Number(r.final.p80),
    gap = (Math.abs(p80f - r.p80T) / Math.max(r.p80T, 1)) * 100;
  const humN =
    r.inp.humidity === null || r.inp.humidity === "unknown"
      ? 0
      : Number(r.inp.humidity);
  const altM = r.altM;

  const diag =
    score >= 78
      ? `Circuito con rendimiento **óptimo** (índice ${score}/100). Diseño que cumple P80 objetivo con carga circulante aceptable.`
      : score >= 58
        ? `Circuito **funcional** (índice ${score}/100). Hay margen de optimización en CSS y configuración de clasificación.`
        : `Circuito con **limitaciones técnicas** (índice ${score}/100). Se requieren ajustes antes de seleccionar equipos definitivos.`;

  const obs = [];
  if (!r.feedOk)
    obs.push(
      `● **Advertencia de feedabilidad**: F80 (${r.inp.f80}mm) puede superar la apertura efectiva del chancador primario. Considerar gape mayor o scalper previo.`,
    );
  if (r.rock.wi > 16)
    obs.push(
      `● **Roca dura** (Wi=${r.rock.wi}): consumo energético y desgaste elevados. Programar reemplazo de liners cada 600–800 h.`,
    );
  else if (r.rock.wi < 10)
    obs.push(
      `● **Roca blanda** (Wi=${r.rock.wi}): capacidad efectiva mayor a la nominal. Verificar que tonelaje no supere equipos.`,
    );
  if (r.rock.ab > 0.35)
    obs.push(
      `● **Abrasividad alta** (${r.rock.ab}): usar mantos y mandíbulas de alto cromo. Intervalo de desgaste reducido.`,
    );
  if (cc > 30)
    obs.push(
      `● Carga circulante **${cc}%** supera límite recomendado (25%). Evaluar mayor apertura de mallas.`,
    );
  if (gap > 15)
    obs.push(
      `● P80 circuito (${p80f}mm) difiere **${gap.toFixed(0)}%** del objetivo (${r.p80T}mm). Ajustar CSS del cono${r.needsT ? " y terciario" : ""}.`,
    );
  if (humN >= 2)
    obs.push(
      `● Humedad ${humN >= 3 ? "alta" : "media"}: eficiencia de seleccionadora reducida. Evaluar scalper o material seco.`,
    );
  if (altM > 2000)
    obs.push(
      `● Altitud ${altM}m: motores a ${(r.altC * 100).toFixed(0)}% de potencia nominal. Dimensionar con motor sobredimensionado.`,
    );
  if (obs.length === 0)
    obs.push(
      "● Sin observaciones críticas. Parámetros dentro de rangos normales de operación.",
    );

  const recs = [];
  if (r.circActual === "con_scalper")
    recs.push(
      `→ Scalper recomendado por humedad: reduce finos pegajosos antes del primario.`,
    );
  else if (r.circActual === "cerrado_doble")
    recs.push(
      `→ Doble deck para ${r.inp.products?.filter((p) => p.active).length || 2} fracciones simultáneas. Dimensionar para ${(Number(r.inp.tph) + Number(r.screening.over)).toFixed(0)} tph totales.`,
    );
  else if (r.circActual !== "abierto")
    recs.push(
      `→ Circuito cerrado: seleccionadora debe manejar ${(Number(r.inp.tph) + Number(r.screening.over)).toFixed(0)} tph (alimentación + retorno).`,
    );
  if (r.inp.rockKey === "desconocida")
    recs.push(
      `→ **Roca no identificada**: obtener Wi Bond en laboratorio. Error estimado actual: ±${r.errPct}%.`,
    );
  if (Number(r.inp.tph) > 350)
    recs.push(
      `→ Tonelaje alto: considerar layout paralelo o equipos de mayor capacidad.`,
    );
  if (r.rock.den > 3.5)
    recs.push(
      `→ Alta densidad (${r.rock.den} t/m³): verificar capacidad volumétrica de correas y estructura.`,
    );

  const variant =
    cc > 30
      ? "Variante sugerida: scalper antes del primario para reducir carga circulante."
      : r.needsT
        ? "Variante sugerida: cono/VSI terciario mejora cubicidad del producto fino."
        : score >= 75
          ? "Configuración técnicamente adecuada para los requerimientos indicados."
          : "Revisar CSS de etapas para acercarse al P80 objetivo.";

  return { diag, obs: obs.slice(0, 4), recs: recs.slice(0, 3), variant };
}

// ── MÓDULO CAMPAÑA — funciones auxiliares ─────────────────────────────────
// coneFactor: usado SOLO para modelar variación de P80 por desgaste de manto en campaña.
// NO usar para cálculo de CSS de circuito — eso vive en el backend (css_selection.py).
function coneFactor(perfil, wi, rpm) {
  const bases = { EF: 1.4, F: 1.52, M: 1.62, C: 1.75, EC: 1.9 };
  const F_base = bases[perfil] || 1.62;
  const k_wi = 1 + (wi - 13) * 0.01;
  const k_rpm = 1 - (rpm - 285) * 0.0005;
  return Math.max(1.25, Math.min(2.1, F_base * k_wi * k_rpm));
}

function calcYieldsForCSS(cssMm, products, rrN, FCONE) {
  const p80 = cssMm * FCONE;
  const d63 = p80 / Math.pow(-Math.log(0.2), 1 / Math.max(rrN, 0.1));
  return products.map((p) => {
    const pP = (x) =>
      x >= 9999
        ? 100
        : 100 * (1 - Math.exp(-Math.pow(Math.max(x, 0.01) / d63, rrN)));
    const hi = pP(p.maxMm),
      lo = p.minMm > 0 ? pP(p.minMm) : 0;
    return { ...p, yldPct: Math.max(0, hi - lo).toFixed(1) };
  });
}

function computeCampaign(
  allProds,
  targets,
  tphNom,
  factorEf,
  cssInit,
  rrN,
  FCONE,
  needsT,
  p80TertVal,
) {
  if (!tphNom || !factorEf) return [];
  let rem = {};
  allProds.forEach((p) => {
    rem[p.id] = Number(targets[p.id]) > 0 ? Number(targets[p.id]) : 0;
  });
  if (!Object.values(rem).some((v) => v > 0.5)) return [];

  const phases = [];
  let accHours = 0;
  let currentCSS = Number(cssInit);
  const CSS_MIN = 8,
    CSS_MAX = 55;

  for (let iter = 0; iter < 12; iter++) {
    const activeProds = allProds.filter((p) => rem[p.id] > 0.5);
    if (activeProds.length === 0) break;

    const curYields = calcYieldsForCSS(currentCSS, allProds, rrN, FCONE);
    const rates = activeProds.map((p) => {
      const yld = Number(curYields.find((y) => y.id === p.id)?.yldPct || 0);
      const rate = (tphNom * factorEf * yld) / 100;
      return {
        ...p,
        rate,
        yld,
        horas: rate > 0.01 ? rem[p.id] / rate : Infinity,
      };
    });

    const valid = rates.filter((r) => isFinite(r.horas) && r.horas > 0);
    if (valid.length === 0) break;
    valid.sort((a, b) => a.horas - b.horas);

    const phaseHours = valid[0].horas;
    const completing = valid
      .filter((r) => r.horas <= phaseHours * 1.001)
      .map((r) => ({
        id: r.id,
        minMm: r.minMm,
        maxMm: r.maxMm,
        label: r.label,
      }));

    rates.forEach((r) => {
      if (isFinite(r.rate))
        rem[r.id] = Math.max(0, rem[r.id] - r.rate * phaseHours);
    });
    accHours += phaseHours;

    const nextActive = allProds.filter((p) => rem[p.id] > 0.5);
    let nextCSS = currentCSS,
      optMaxTime = Infinity,
      baseMaxTime = 0;

    if (nextActive.length > 0) {
      const baseY = calcYieldsForCSS(currentCSS, allProds, rrN, FCONE);
      nextActive.forEach((p) => {
        const yld = Number(baseY.find((y) => y.id === p.id)?.yldPct || 0);
        const rate = (tphNom * factorEf * yld) / 100;
        if (rate > 0.01) baseMaxTime = Math.max(baseMaxTime, rem[p.id] / rate);
        else baseMaxTime = Infinity;
      });

      const maxAllowedCss = (() => {
        const finiteProducts = nextActive.filter((p) => p.maxMm < 9999);
        if (finiteProducts.length === 0) return CSS_MAX;
        return Math.max(
          CSS_MIN,
          Math.min(...finiteProducts.map((p) => p.maxMm / FCONE)),
        );
      })();

      for (let delta = -20; delta <= 20; delta += 5) {
        const testCSS = Math.max(
          CSS_MIN,
          Math.min(CSS_MAX, currentCSS + delta),
        );
        if (testCSS > maxAllowedCss && finiteProducts.length > 0) continue;
        const testY = calcYieldsForCSS(testCSS, allProds, rrN, FCONE);
        let maxT = 0,
          ok = true;
        nextActive.forEach((p) => {
          const yld = Number(testY.find((y) => y.id === p.id)?.yldPct || 0);
          const rate = (tphNom * factorEf * yld) / 100;
          if (rate > 0.01) maxT = Math.max(maxT, rem[p.id] / rate);
          else ok = false;
        });
        if (ok && maxT < optMaxTime) {
          optMaxTime = maxT;
          nextCSS = testCSS;
        }
      }
    }

    const cssImp =
      baseMaxTime > 0 && isFinite(baseMaxTime) && isFinite(optMaxTime)
        ? Math.max(0, ((baseMaxTime - optMaxTime) / baseMaxTime) * 100)
        : 0;

    // Sugerencia de eliminar etapa terciaria
    let removeTertSuggestion = null;
    if (needsT && p80TertVal > 0 && nextActive.length > 0) {
      const fineProds = allProds.filter((p) => p.maxMm <= p80TertVal * 1.1);
      const allFineCompleted =
        fineProds.length > 0 && fineProds.every((p) => rem[p.id] <= 0.5);
      if (allFineCompleted) {
        const noTertY = calcYieldsForCSS(nextCSS, allProds, rrN, FCONE);
        let noTertMaxT = 0;
        nextActive.forEach((p) => {
          const yld = Number(noTertY.find((y) => y.id === p.id)?.yldPct || 0);
          const rate = (tphNom * factorEf * yld) / 100;
          if (rate > 0.01) noTertMaxT = Math.max(noTertMaxT, rem[p.id] / rate);
        });
        const tBenefit = isFinite(optMaxTime)
          ? Math.max(
              0,
              ((optMaxTime - noTertMaxT) / Math.max(optMaxTime, 1)) * 100,
            )
          : 0;
        removeTertSuggestion = {
          benefitPct: tBenefit,
          horasSaving: Math.max(0, optMaxTime - noTertMaxT),
        };
      }
    }

    phases.push({
      phaseNum: phases.length + 1,
      phaseHours,
      accHours,
      completing,
      cssUsed: currentCSS,
      nextCSS: nextActive.length > 0 ? nextCSS : null,
      cssImprovement: cssImp,
      removeTertSuggestion,
    });

    if (nextActive.length > 0) currentCSS = nextCSS;
  }
  return phases;
}

function campaignUnoptTime(
  allProds,
  targets,
  tphNom,
  factorEf,
  cssInit,
  rrN,
  FCONE,
) {
  let rem = {};
  allProds.forEach((p) => {
    rem[p.id] = Number(targets[p.id]) > 0 ? Number(targets[p.id]) : 0;
  });
  if (!Object.values(rem).some((v) => v > 0.5)) return 0;
  const curY = calcYieldsForCSS(Number(cssInit), allProds, rrN, FCONE);
  let accHours = 0;
  for (let iter = 0; iter < 12; iter++) {
    const active = allProds.filter((p) => rem[p.id] > 0.5);
    if (active.length === 0) break;
    const rates = active
      .map((p) => {
        const yld = Number(curY.find((y) => y.id === p.id)?.yldPct || 0);
        const rate = (tphNom * factorEf * yld) / 100;
        return {
          id: p.id,
          rate,
          horas: rate > 0.01 ? rem[p.id] / rate : Infinity,
        };
      })
      .filter((r) => isFinite(r.horas) && r.horas > 0);
    if (rates.length === 0) break;
    const minH = Math.min(...rates.map((r) => r.horas));
    rates.forEach((r) => {
      rem[r.id] = Math.max(0, rem[r.id] - r.rate * minH);
    });
    accHours += minH;
  }
  return accHours;
}

// ── COMPONENTES BASE ───────────────────────────────────────────────────────
function Badge({ color, children }) {
  const c = {
    amber: { bg: "#78350f", tx: "#fcd34d", bd: "#92400e" },
    green: { bg: "#064e3b", tx: "#6ee7b7", bd: "#065f46" },
    red: { bg: "#7f1d1d", tx: "#fca5a5", bd: "#991b1b" },
    blue: { bg: "#1e3a5f", tx: "#93c5fd", bd: "#1d4ed8" },
    gray: { bg: "#1f2937", tx: "#9ca3af", bd: "#374151" },
  }[color] || { bg: "#1f2937", tx: "#9ca3af", bd: "#374151" };
  return (
    <span
      style={{
        background: c.bg,
        color: c.tx,
        border: `1px solid ${c.bd}`,
        padding: "2px 10px",
        borderRadius: 4,
        fontSize: 11,
        fontFamily: G.font,
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Kpi({ label, value, unit, sub, color, icon }) {
  return (
    <div
      style={{
        background: G.card,
        border: `1px solid ${G.border}`,
        borderRadius: 8,
        padding: "14px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 3,
          height: "100%",
          background: color || G.accent,
        }}
      />
      <div
        style={{
          fontSize: 10,
          color: G.muted,
          letterSpacing: "0.08em",
          marginBottom: 4,
        }}
      >
        {icon} {label}
      </div>
      <div
        style={{
          fontSize: 25,
          fontFamily: G.fontD,
          fontWeight: 700,
          color: color || G.accent,
          lineHeight: 1,
        }}
      >
        {value}
        <span style={{ fontSize: 12, color: G.muted, marginLeft: 4 }}>
          {unit}
        </span>
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: G.muted, marginTop: 3 }}>{sub}</div>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        color: G.accent,
        letterSpacing: "0.1em",
        marginBottom: 11,
        fontFamily: G.font,
        borderLeft: `3px solid ${G.accent}`,
        paddingLeft: 8,
      }}
    >
      ◈ {children}
    </div>
  );
}

function B({ t }) {
  const html = String(t).replace(
    /\*\*(.*?)\*\*/g,
    `<strong style="color:${G.accent}">$1</strong>`,
  );
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function Info({ text }) {
  return (
    <span
      title={text}
      style={{ marginLeft: 4, cursor: "help", color: G.muted, fontSize: "0.85em", userSelect: "none" }}
    >
      ⓘ
    </span>
  );
}

// ── DIAGRAMA ───────────────────────────────────────────────────────────────
function Diagram({ r, unit }) {
  const {
    circActual,
    primary: pr,
    secondary: sc,
    tertiary: te,
    screening: sr,
    final: fi,
    inp,
    needsT,
  } = r;
  const W = needsT ? 820 : 690;
  const ns = { rx: 6, fill: G.card, stroke: G.border, strokeWidth: 1.5 };
  const ts = {
    fill: G.text,
    fontSize: 10,
    fontFamily: G.font,
    textAnchor: "middle",
  };
  const ss = {
    fill: G.muted,
    fontSize: 8.5,
    fontFamily: G.font,
    textAnchor: "middle",
  };
  const fl = {
    stroke: G.accent,
    strokeWidth: 1.5,
    fill: "none",
    strokeDasharray: "5 3",
  };
  const sl = { stroke: G.accent, strokeWidth: 1.5, fill: "none" };
  const u = unit || "mm",
    ul = unitLabel(u);
  const sz = (mm) => fromMm(Number(mm), u) + ul;
  const cn =
    {
      abierto: "CIRCUITO ABIERTO",
      cerrado: "CIRCUITO CERRADO",
      cerrado_doble: "DOBLE DECK",
      con_scalper: "CON SCALPER",
      ai: "RECOMENDADO IA",
    }[circActual] || "CIRCUITO";
  const xF = 8,
    xJ = 115,
    xC = 245,
    xC2 = needsT ? 375 : null,
    xS = needsT ? 505 : 375,
    xPr = xS + 95;

  return (
    <div
      style={{
        background: G.surface,
        border: `1px solid ${G.border}`,
        borderRadius: 8,
        padding: 16,
        overflowX: "auto",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: G.muted,
          marginBottom: 12,
          letterSpacing: "0.08em",
        }}
      >
        ◈ DIAGRAMA — {cn}
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${W} 290`}
        style={{ minWidth: Math.min(W, 440) }}
      >
        <defs>
          <marker
            id="ar"
            markerWidth="7"
            markerHeight="7"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L7,3z" fill={G.accent} />
          </marker>
          <marker
            id="ag"
            markerWidth="7"
            markerHeight="7"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L7,3z" fill={G.green} />
          </marker>
        </defs>
        <rect x={xF} y={108} width={90} height={52} {...ns} stroke={G.green} />
        <text x={xF + 45} y={126} {...ts} fill={G.green}>
          ALIMENT.
        </text>
        <text x={xF + 45} y={138} {...ss}>
          F80 {sz(inp.f80)}
        </text>
        <text x={xF + 45} y={149} {...ss}>
          {inp.tph} tph
        </text>
        <line
          x1={xF + 90}
          y1={134}
          x2={xJ}
          y2={134}
          {...fl}
          className="flow"
          markerEnd="url(#ar)"
        />
        <rect x={xJ} y={96} width={95} height={75} {...ns} stroke={G.accent} />
        <text x={xJ + 47} y={114} {...ts} fill={G.accent}>
          MANDÍBULA
        </text>
        <text x={xJ + 47} y={126} {...ss}>
          CSS {sz(pr.css)}
        </text>
        <text x={xJ + 47} y={137} {...ss}>
          P80: {sz(pr.p80)}
        </text>
        <text x={xJ + 47} y={148} {...ss}>
          ⚡{pr.energy} kWh/t
        </text>
        <line
          x1={xJ + 95}
          y1={134}
          x2={xC}
          y2={134}
          {...fl}
          className="flow"
          markerEnd="url(#ar)"
        />
        <rect x={xC} y={96} width={95} height={75} {...ns} stroke={G.purple} />
        <text x={xC + 47} y={114} {...ts} fill={G.purple}>
          CONO
        </text>
        <text x={xC + 47} y={126} {...ss}>
          CSS {sz(sc.css)}
        </text>
        <text x={xC + 47} y={137} {...ss}>
          P80: {sz(sc.p80)}
        </text>
        <text x={xC + 47} y={148} {...ss}>
          ⚡{sc.energy} kWh/t
        </text>
        {needsT ? (
          <>
            <line
              x1={xC + 95}
              y1={134}
              x2={xC2}
              y2={134}
              {...fl}
              className="flow"
              markerEnd="url(#ar)"
            />
            <rect
              x={xC2}
              y={96}
              width={95}
              height={75}
              {...ns}
              stroke={G.cyan}
            />
            <text x={xC2 + 47} y={114} {...ts} fill={G.cyan}>
              CONO / VSI
            </text>
            <text x={xC2 + 47} y={126} {...ss}>
              CSS {sz(te.css)}
            </text>
            <text x={xC2 + 47} y={137} {...ss}>
              P80: {sz(te.p80)}
            </text>
            <text x={xC2 + 47} y={148} {...ss}>
              ⚡{te.energy} kWh/t
            </text>
            <line
              x1={xC2 + 95}
              y1={134}
              x2={xS}
              y2={134}
              {...fl}
              className="flow"
              markerEnd="url(#ar)"
            />
          </>
        ) : (
          <line
            x1={xC + 95}
            y1={134}
            x2={xS}
            y2={134}
            {...fl}
            className="flow"
            markerEnd="url(#ar)"
          />
        )}
        <rect x={xS} y={96} width={95} height={75} {...ns} stroke={G.green} />
        <text x={xS + 47} y={114} {...ts} fill={G.green}>
          SELECT.
        </text>
        <text x={xS + 47} y={125} {...ss}>
          {circActual === "cerrado_doble" ? "Doble deck" : "Simple"}
        </text>
        <text x={xS + 47} y={136} {...ss}>
          Efic. {sr.eff}%
        </text>
        <text x={xS + 47} y={147} {...ss}>
          CC: {sr.ccLoad}%
        </text>
        <line
          x1={xS + 95}
          y1={120}
          x2={xPr}
          y2={120}
          {...sl}
          markerEnd="url(#ag)"
        />
        <rect x={xPr} y={108} width={14} height={26} fill={G.green} rx={3} />
        <text x={xPr + 7} y={146} {...ss} fill={G.green}>
          P80
        </text>
        <text x={xPr + 7} y={156} {...ss} fill={G.green}>
          {sz(fi.p80)}
        </text>
        {circActual !== "abierto" &&
          (() => {
            const xT = needsT ? xC2 + 47 : xC + 47;
            return (
              <>
                <line x1={xS + 47} y1={171} x2={xS + 47} y2={232} {...sl} />
                <line x1={xS + 47} y1={232} x2={xT} y2={232} {...sl} />
                <line
                  x1={xT}
                  y1={232}
                  x2={xT}
                  y2={171}
                  {...sl}
                  markerEnd="url(#ar)"
                />
                <text x={(xS + 47 + xT) / 2} y={248} {...ss} fill={G.muted}>
                  ↺ retorno {sr.over} tph
                </text>
              </>
            );
          })()}
      </svg>
      <div
        style={{
          fontSize: 10,
          color: G.muted,
          marginTop: 10,
          padding: "8px 12px",
          background: G.faint,
          borderRadius: 6,
          borderLeft: `3px solid ${G.border}`,
        }}
      >
        Nota técnica: P80 del producto es mayor que el CSS porque el CSS es la
        apertura mínima del equipo, pero el producto tiene distribución de
        tamaños. Para mandíbulas P80 ≈ CSS × 1.75 y para conos P80 ≈ CSS × 1.60
        — esto es correcto y esperado.
      </div>
    </div>
  );
}

// ── PRODUCTOS DEFAULT — sin etiquetas predefinidas ─────────────────────────
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
function Onboarding({
  onDone,
  savedSims = [],
  onDeleteSim,
  initialInp = null,
  initialStep = 0,
  cancelEdit = null,
  eqCatalog = EQ_LOCAL,
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

  // Catálogo de equipos indexado por tipo — usa el prop remoto con fallback local
  const _EQ = eqCatalog || EQ_LOCAL;
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

// ── RESULTADOS ─────────────────────────────────────────────────────────────
function Results({ res, unit: initUnit, onReset, onSave, onEdit, eqCatalog = EQ_LOCAL }) {
  const [tab, setTab] = useState("equipos");
  const [unit, setUnit] = useState(initUnit || "mm");
  const [showSave, setShowSave] = useState(false);
  const [saveCliente, setSaveCliente] = useState("");
  const [saveProyecto, setSaveProyecto] = useState("");
  const [saveNotas, setSaveNotas] = useState("");
  const [savedConfirm, setSavedConfirm] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  // ── MÓDULO PRODUCCIÓN ─────────────────────────────────────────────────
  const [prodMode, setProdMode] = useState("produccion");
  const [horasTurno, setHorasTurno] = useState(8);
  const [turnosDia, setTurnosDia] = useState(2);
  const [diasSemana, setDiasSemana] = useState(5);
  const [dispMec, setDispMec] = useState(80);
  const [utilOp, setUtilOp] = useState(85);
  const [horizMes, setHorizMes] = useState(6);
  const [deadlineTon, setDeadlineTon] = useState(50000);
  const [deadlineMes, setDeadlineMes] = useState(6);
  const [prodTargets, setProdTargets] = useState(() => {
    const init = {};
    (res.products || []).forEach((p) => {
      if ((p.targetTon || 0) > 0) init[p.id] = p.targetTon;
    });
    return init;
  });
  // ── VALIDACIÓN VS. REFERENCIA DEL CLIENTE ─────────────────────────────────
  const [refModelo, setRefModelo] = useState(res.inp.refModelo || "");
  const [refTph, setRefTph] = useState(res.inp.refTph ? String(res.inp.refTph) : "");

  // ── MÓDULO COMERCIAL ──────────────────────────────────────────────────────
  const [arrOpen, setArrOpen] = useState(true);
  const [arrUnit, setArrUnit] = useState("hora");
  const [arrTarifa, setArrTarifa] = useState("");
  const [arrCantidad, setArrCantidad] = useState("");
  const [arrMin, setArrMin] = useState("");
  const [arrIncl, setArrIncl] = useState({
    combustible:   { active: false, valor: "" },
    operador:      { active: false, valor: "" },
    movilizacion:  { active: false, valor: "" },
    mantenimiento: { active: false, valor: "" },
    inchancable:   { active: false, valor: "" },
  });
  const [ventaOpen, setVentaOpen] = useState(true);
  const [ventaPrecios, setVentaPrecios] = useState({});
  const [ventaCond, setVentaCond] = useState("");
  const [lemOpen, setLemOpen] = useState(true);
  const [lemUnit, setLemUnit] = useState("$/ton");
  const [lemTarifa, setLemTarifa] = useState("");
  const [lemIncl, setLemIncl] = useState({
    combustible:   { active: false, valor: "" },
    operador:      { active: false, valor: "" },
    movilizacion:  { active: false, valor: "" },
    mantenimiento: { active: false, valor: "" },
    inchancable:   { active: false, valor: "" },
  });
  // Tipo de cambio USD→CLP para convertir OPEX del motor (que sale en USD/t) a CLP
  const [tcUsdClp, setTcUsdClp] = useState(950);
  const EQ = eqCatalog || EQ_LOCAL;
  const analysis = buildAnalysis(res);
  const score = Number(res.final.score),
    cc = Number(res.screening.ccLoad);
  const effColor = score >= 75 ? G.green : score >= 55 ? G.accent : G.red;
  const effLabel =
    score >= 75 ? "ÓPTIMO" : score >= 55 ? "MEJORABLE" : "CRÍTICO";
  const ul = unitLabel(unit);
  const sz = (mm) => fromMm(Number(mm), unit) + ul;
  const humTxt =
    res.inp.humidity === null
      ? "Sin humedad"
      : res.inp.humidity === "unknown"
        ? "Desconocida"
        : ["Sin humedad", "Baja (2-5%)", "Media (5-10%)", "Alta (>10%)"][
            res.inp.humidity
          ] || "";
  const cnName =
    {
      abierto: "Circuito abierto",
      cerrado: "Circuito cerrado",
      cerrado_doble: "Doble deck",
      con_scalper: "Con Scalper",
      ai: "IA",
    }[res.circActual] || res.circActual;

  // ── CÁLCULOS PRODUCCIÓN ────────────────────────────────────────────────
  const tphNominal = Number(res.inp.tph);
  const factorEf = (dispMec / 100) * (utilOp / 100);
  const tphEfectivo = tphNominal * factorEf;
  const horasDia = horasTurno * turnosDia;
  const diasPorMes = diasSemana * 4.33;
  const horasPorMes = diasPorMes * horasDia;
  const tonPorDia = tphEfectivo * horasDia;
  const tonPorSemana = tonPorDia * diasSemana;
  const tonPorMes = tphEfectivo * horasPorMes;
  const horasHorizonte = horizMes * horasPorMes;
  const tonHorizonte = tphEfectivo * horasHorizonte;
  const horasDeadline = deadlineMes * horasPorMes;
  const tphEfReq = horasDeadline > 0 ? deadlineTon / horasDeadline : 0;
  const tphNomReq = factorEf > 0 ? tphEfReq / factorEf : Infinity;
  const cumple = tphNomReq > 0 && tphNominal >= tphNomReq;
  const pctCap =
    tphNomReq > 0 ? Math.min(999, (tphNominal / tphNomReq) * 100) : 0;
  const mesesParaMeta = tonPorMes > 0 ? deadlineTon / tonPorMes : 999;
  const prodsEf = res.products.map((p) => {
    const tphEfP = Number(p.tphOut) * factorEf;
    return {
      ...p,
      tphEf: tphEfP.toFixed(1),
      tonMes: Math.round(tphEfP * horasPorMes),
      tonHor: Math.round(tphEfP * horasHorizonte),
      tonDL: Math.round(tphEfP * horasDeadline),
    };
  });
  const fmtTon = (n) =>
    n >= 1000000
      ? (n / 1000000).toFixed(2) + " Mt"
      : n >= 1000
        ? Math.round(n / 1000) + "k ton"
        : Math.round(n) + " ton";

  // ── CAMPAÑA ──────────────────────────────────────────────────────────────
  const F_CONE_DYN_res = coneFactor(
    res.conePerfil || "M",
    res.rock.wi,
    res.coneRpm || 285,
  );
  const cssConeVal = Number(res.secondary.css);
  const rrN_res = res.rock.rrN || 0.85;
  const hasTargets = Object.values(prodTargets).some((t) => Number(t) > 0);
  const campaignPhases =
    prodMode === "campana" && hasTargets
      ? computeCampaign(
          prodsEf,
          prodTargets,
          tphNominal,
          factorEf,
          cssConeVal,
          rrN_res,
          F_CONE_DYN_res,
          res.needsT,
          Number(res.tertiary?.p80 || 0),
        )
      : null;
  const campaignTotalHours = campaignPhases
    ? campaignPhases[campaignPhases.length - 1]?.accHours || 0
    : 0;
  const campaignUnoptH =
    prodMode === "campana" && hasTargets
      ? campaignUnoptTime(
          prodsEf,
          prodTargets,
          tphNominal,
          factorEf,
          cssConeVal,
          rrN_res,
          F_CONE_DYN_res,
        )
      : 0;

  // ── Cálculos módulo comercial (usan horasHorizonte, horizMes, etc.) ────────
  const INCL_LABELS = [
    { key: "combustible",   label: "Combustible" },
    { key: "operador",      label: "Operador" },
    { key: "movilizacion",  label: "Movilización" },
    { key: "mantenimiento", label: "Mantenimiento" },
  ];
  const arrCantSugerida =
    arrUnit === "hora"  ? Math.round(horasHorizonte) :
    arrUnit === "turno" ? Math.round(horizMes * (diasSemana * 4.33) * turnosDia) :
    horizMes;
  const sumIncl = (incl) =>
    Object.values(incl).reduce((s, i) => s + (i.active ? (Number(i.valor) || 0) : 0), 0);
  const arrBase     = (Number(arrTarifa) || 0) * (Number(arrCantidad) || 0);
  const arrMinVal   = Number(arrMin) || 0;
  const arrMinAplica = arrMinVal > 0 && arrMinVal > arrBase;
  const arrTotal    = Math.max(arrBase, arrMinVal) + sumIncl(arrIncl);
  const circEqs = [
    { id: "jaw",      label: "Chancador primario (mandíbula)",  eq: (res.eqRec?.jaw    || [])[0] },
    { id: "cone",     label: "Chancador secundario (cono)",     eq: (res.eqRec?.cone   || [])[0] },
    // Para el terciario no existe eqRec separado — se muestra como ítem a definir,
    // con nota explícita para que no parezca duplicado del secundario
    ...(res.needsT ? [{ id: "tertiary", label: "Cono/VSI terciario — equipo a definir (no el mismo que el secundario)", eq: null }] : []),
    { id: "screen",   label: "Seleccionadora",                  eq: (res.eqRec?.screen || [])[0] },
  ];
  const ventaTotal  = circEqs.reduce((s, e) => s + (Number(ventaPrecios[e.id]) || 0), 0);
  const rockDensity = res.rock?.density || 2.7;
  const lemProdTon  = Math.round(tonHorizonte);
  const lemProdM3   = Math.round(tonHorizonte / rockDensity);
  const lemProd     = lemUnit === "$/ton" ? lemProdTon : lemProdM3;
  const lemTotal    = (Number(lemTarifa) || 0) * lemProd + sumIncl(lemIncl);
  // Referencia interna: OPEX del motor en USD/t × TC → CLP — NO mostrar al cliente en reporte exportable
  // res.opex.total_usd_t viene en USD/t del motor Python; lemTarifa es en CLP → necesita conversión
  const opexRefTotal = res.opex?.total_usd_t
    ? Math.round(res.opex.total_usd_t * lemProdTon * tcUsdClp)
    : null;

  // Textos de tooltips para términos técnicos — usados en pestañas Detalle y Diagrama
  const TT = {
    wi:   "Qué tan dura es la roca de chancar. Más alto = el chancador gasta más energía y rinde menos toneladas por hora.",
    css:  "La abertura de salida del chancador. Más cerrado = piedra más fina pero más lento. Más abierto = piedra más gruesa pero más rápido.",
    f80:  "El tamaño donde el 80% del material que ENTRA al chancador (la alimentación) es más chico que ese número. Describe qué tan grande viene la roca antes de chancarse.",
    p80:  "El tamaño donde el 80% del material que SALE del chancador (el producto) es más chico que ese número. Describe qué tan fino quedó después de chancarse.",
    cc:   "Porcentaje de material que no pasó la malla y vuelve a chancarse de nuevo. Si es muy alta, el circuito está sobrecargado.",
    eff:  "Qué tan bien la malla separa lo fino de lo grueso. Si es baja, se mezcla material que no debería.",
    ener: "Cuánta energía se necesita para chancar una tonelada. Sirve para estimar el gasto de combustible/electricidad.",
  };

  const TABS = [
    { id: "equipos",      label: "Equipos" },
    { id: "resumen",      label: "Resumen" },
    { id: "diagrama",     label: "Diagrama" },
    { id: "productos",    label: "Productos" },
    { id: "detalle",      label: "Detalle" },
    { id: "produccion",   label: "Operación" },
    { id: "proyecciones", label: "Proyecciones" },
    { id: "comercial",    label: "Comercial" },
  ];

  const showHSI = res.inp.circPath === "manual" && res.inp.manualEq?.hsi;
  const BRAND_PRIORITY = [
    "Terex Finlay",
    "Powerscreen",
    "Kleemann",
    "Sandvik",
    "Metso",
    "Astec",
  ];
  const brandOrder = (brand) => {
    const idx = BRAND_PRIORITY.indexOf(brand);
    return idx === -1 ? BRAND_PRIORITY.length : idx;
  };
  const findEquivalents = (eq, category) => {
    const pool = category === "screen" ? EQ.screen : EQ[category] || [];
    return pool
      .filter((item) => {
        if (item.model === eq.model || item.brand === eq.brand) return false;
        if (category === "jaw" || category === "cone") {
          return (
            item.cssR &&
            eq.cssR &&
            item.cssR[0] <= eq.cssR[1] &&
            item.cssR[1] >= eq.cssR[0]
          );
        }
        if (item.capR && eq.capR) {
          return item.capR[0] <= eq.capR[1] && item.capR[1] >= eq.capR[0];
        }
        return true;
      })
      .sort((a, b) => brandOrder(a.brand) - brandOrder(b.brand))
      .slice(0, 2);
  };

  const availEval = () => {
    if (res.inp.circPath !== "available" || !res.inp.availEquip?.length)
      return null;
    const avail = res.inp.availEquip;
    const hasJaw = avail.some((e) => e.type === "jaw");
    const hasCone = avail.some((e) => e.type === "cone" || e.type === "hsi");
    const hasScreen = avail.some(
      (e) =>
        e.type === "screen3d" || e.type === "screen2d" || e.type === "screen1d",
    );
    const missing = [],
      excess = [];
    if (!hasJaw) missing.push("Chancador primario (mandíbula o HSI primario)");
    if (!hasCone) missing.push("Chancador secundario (cono o HSI)");
    if (!hasScreen) missing.push("Seleccionadora (cualquier configuración)");
    if (res.needsT && !avail.some((e) => e.type === "cone"))
      missing.push("Cono/VSI terciario para P80 < 18mm");
    if (avail.filter((e) => e.type === "jaw").length > 1)
      excess.push("Mandíbula duplicada — evaluar si necesaria");
    return { missing, excess, sufficient: missing.length === 0 };
  };
  const evalResult = availEval();

  return (
    <div style={{ minHeight: "100vh", background: G.bg, fontFamily: G.font }}>
      <style>{GCSS}</style>
      <div
        style={{
          padding: "13px 20px",
          borderBottom: `1px solid ${G.border}`,
          background: G.surface,
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `linear-gradient(135deg,${G.accent},#d97706)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: G.fontD,
            fontWeight: 800,
            fontSize: 14,
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
              color: G.accent,
              fontSize: 15,
            }}
          >
            KrushRock
          </div>
          <div style={{ fontSize: 10, color: G.muted }}>
            {res.rock.name} · {res.inp.tph} tph · {cnName}
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 6,
            alignItems: "center",
            position: "relative",
          }}
        >
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowEditMenu((v) => !v)}
              style={{
                background: "none",
                border: `1px solid ${G.border}`,
                color: G.muted,
                padding: "5px 11px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 11,
                fontFamily: G.font,
              }}
            >
              Modificar parámetros
            </button>
            {showEditMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "110%",
                  width: 220,
                  background: G.surface,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  padding: 8,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                  zIndex: 20,
                }}
              >
                {[
                  "Tipo de roca",
                  "Curva granulométrica",
                  "Productos",
                  "Condiciones",
                  "Circuito",
                ].map((label, index) => (
                  <button
                    key={label}
                    onClick={() => {
                      onEdit(index);
                      setShowEditMenu(false);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 6,
                      background: "none",
                      border: "none",
                      color: G.text,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {["mm", "cm", "in"].map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              style={{
                padding: "3px 9px",
                borderRadius: 5,
                cursor: "pointer",
                fontFamily: G.font,
                fontSize: 11,
                border: `1px solid ${unit === u ? G.accent : G.border}`,
                background: unit === u ? `${G.accentDim}44` : G.card,
                color: unit === u ? G.accent : G.muted,
              }}
            >
              {u === "in" ? '"' : u}
            </button>
          ))}
          <Badge color={score >= 75 ? "green" : score >= 55 ? "amber" : "red"}>
            {effLabel}
          </Badge>
          {savedConfirm ? (
            <span style={{ color: G.green, fontSize: 11 }}>✓ Guardada</span>
          ) : (
            <button
              onClick={() => setShowSave((s) => !s)}
              style={{
                background: showSave ? `${G.accentDim}44` : "none",
                border: `1px solid ${showSave ? G.accent : G.border}`,
                color: showSave ? G.accent : G.muted,
                padding: "5px 11px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 11,
                fontFamily: G.font,
              }}
            >
              {showSave ? "✕ Cancelar" : "Guardar"}
            </button>
          )}
          <button
            onClick={() => {
              if (confirmReset) {
                setConfirmReset(false);
                onReset();
              } else setConfirmReset(true);
            }}
            style={{
              background: confirmReset ? G.red : `none`,
              border: `1px solid ${confirmReset ? G.red : G.border}`,
              color: confirmReset ? "#000" : G.muted,
              padding: "5px 11px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 11,
              fontFamily: G.font,
            }}
          >
            {confirmReset ? "Confirmar nueva" : "+ Nueva"}
          </button>
          {confirmReset && (
            <button
              onClick={() => setConfirmReset(false)}
              style={{
                background: "none",
                border: `1px solid ${G.border}`,
                color: G.muted,
                padding: "5px 11px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 11,
                fontFamily: G.font,
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Formulario guardar simulación */}
      {showSave && !savedConfirm && (
        <div
          style={{
            background: G.card,
            borderBottom: `1px solid ${G.border}`,
            padding: "14px 20px",
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 160px" }}>
            <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>
              Cliente
            </div>
            <input
              type="text"
              placeholder="Ej: Minera Los Andes"
              value={saveCliente}
              onChange={(e) => setSaveCliente(e.target.value)}
            />
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>
              Proyecto / Licitación
            </div>
            <input
              type="text"
              placeholder="Ej: Contrato áridos ruta 5"
              value={saveProyecto}
              onChange={(e) => setSaveProyecto(e.target.value)}
            />
          </div>
          <div style={{ flex: "2 1 220px" }}>
            <div style={{ fontSize: 10, color: G.muted, marginBottom: 4 }}>
              Notas (opcional)
            </div>
            <input
              type="text"
              placeholder="Observaciones del terreno, etc."
              value={saveNotas}
              onChange={(e) => setSaveNotas(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              if (!saveCliente.trim() && !saveProyecto.trim()) return;
              onSave &&
                onSave(
                  saveCliente.trim() || "Sin nombre",
                  saveProyecto.trim() || "Sin proyecto",
                  saveNotas.trim(),
                );
              setShowSave(false);
              setSavedConfirm(true);
              setTimeout(() => setSavedConfirm(false), 3000);
            }}
            style={{
              background: G.accent,
              color: "#000",
              border: "none",
              borderRadius: 6,
              padding: "8px 18px",
              cursor: "pointer",
              fontFamily: G.font,
              fontWeight: 600,
              fontSize: 12,
              whiteSpace: "nowrap",
            }}
          >
            Guardar
          </button>
        </div>
      )}

      {/* Score banner */}
      <div
        style={{
          background: G.surface,
          borderBottom: `1px solid ${G.border}`,
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 9, color: G.muted, letterSpacing: "0.1em" }}>
            ÍNDICE DE EFICIENCIA DEL CIRCUITO
          </div>
          <div
            style={{
              fontFamily: G.fontD,
              fontSize: 42,
              fontWeight: 800,
              color: effColor,
              lineHeight: 1,
            }}
          >
            {score}
            <span style={{ fontSize: 16 }}>/100</span>
          </div>
          <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>
            cumplimiento P80 · carga circulante · dureza
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: 8,
              background: G.border,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${score}%`,
                background: effColor,
                borderRadius: 4,
                transition: "width 1s ease",
              }}
            />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: G.muted }}>
            {res.bottlenecks.length > 0
              ? `⚠ ${res.bottlenecks[0]}`
              : "✓ Sin bottlenecks detectados"}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: res.errColor }}>
            Error estimado: <strong>±{res.errPct}%</strong>
            {res.inp.curveType === "f80only" || res.inp.curveType === "omit"
              ? " — ingresar curva granulométrica reduce el error"
              : res.inp.curveType === "partial"
                ? " — curva parcial (F80+F50)"
                : ` — curva con ${(res.inp.curvePoints || []).filter((p) => p.sizeMm > 0).length} puntos`}
          </div>
        </div>
      </div>
      {res.alerts?.length > 0 && (
        <div style={{ padding: "16px 20px", maxWidth: 840, margin: "0 auto" }}>
          {res.alerts.map((alert, i) => (
            <div
              key={i}
              style={{
                background: alert.level === "error" ? "#fee2e2" : "#fffbeb",
                border: `1px solid ${
                  alert.level === "error" ? "#fca5a5" : "#fcd34d"
                }`,
                color: alert.level === "error" ? "#991b1b" : "#92400e",
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 10,
                fontSize: 12,
              }}
            >
              {alert.text}
            </div>
          ))}
        </div>
      )}

      {/* Banner en lenguaje simple — visible en todas las pestañas */}
      {(() => {
        const ccNum = Number(cc);
        const [ccMsg, ccColor] = ccNum <= 20
          ? ["La configuración funciona bien: el material circula sin atascos importantes.", G.green]
          : ccNum <= 30
            ? ["Funciona, pero hay más material volviendo a chancarse de lo ideal — conviene ajustar la malla para mejorar el rendimiento.", G.accent]
            : ["Ojo: una parte importante del material está volviendo a chancarse en vez de salir como producto. Esto baja la producción real — revisa la abertura de la malla o el tamaño del equipo.", G.red];
        return (
          <div style={{ padding: "12px 16px", background: G.card, borderBottom: `1px solid ${G.border}` }}>
            <div style={{ fontSize: 14, color: G.text, fontWeight: 600, marginBottom: 5 }}>
              Tu planta puede procesar <span style={{ color: G.accent }}>{res.inp.tph} toneladas por hora</span> de {res.rock.name}.
            </div>
            <div style={{ fontSize: 12, color: ccColor, lineHeight: 1.5 }}>
              {ccMsg}
            </div>
          </div>
        );
      })()}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${G.border}`,
          background: G.surface,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: "10px 6px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === t.id ? G.accent : "transparent"}`,
              color: tab === t.id ? G.accent : G.muted,
              fontSize: 11,
              cursor: "pointer",
              fontFamily: G.font,
              letterSpacing: "0.03em",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16, maxWidth: 840, margin: "0 auto" }}>
        {/* ── TAB EQUIPOS ── */}
        {tab === "equipos" && (
          <div style={{ display: "grid", gap: 14 }}>
            {/* Advertencias de capacidad excedida — se muestran cuando el catálogo no tiene
                ningún equipo que alcance el tph pedido y se activó el fallback */}
            {res.eqRec?.capacidadExcedida && [
              { key: "jaw",    label: "mandíbula" },
              { key: "cone",   label: "cono" },
              { key: "screen", label: "zaranda" },
              { key: "hsi",    label: "HSI" },
            ].filter(({ key }) => res.eqRec.capacidadExcedida[key]).map(({ key, label }) => (
              <div
                key={key}
                style={{
                  background: "rgba(245,158,11,0.1)",
                  border: `1px solid ${G.accent}`,
                  borderRadius: 8,
                  padding: "12px 14px",
                  fontSize: 12,
                  color: G.accent,
                  lineHeight: 1.6,
                }}
              >
                ⚠️ Ningún <strong>{label}</strong> de tu catálogo alcanza el tonelaje solicitado ({res.inp.tph} tph). El equipo mostrado abajo está sub-dimensionado para esta capacidad — considera dividir en más de una unidad en paralelo, o revisar el tonelaje de alimentación.
              </div>
            ))}
            {evalResult && (
              <div
                style={{
                  background: G.card,
                  border: `1px solid ${evalResult.sufficient ? G.green : G.red}`,
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <SectionTitle>
                  {evalResult.sufficient
                    ? "EQUIPOS SUFICIENTES"
                    : "EVALUACIÓN DE TU PARQUE DE EQUIPOS"}
                </SectionTitle>
                {evalResult.missing.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div
                      style={{ fontSize: 11, color: G.red, marginBottom: 6 }}
                    >
                      FALTAN:
                    </div>
                    {evalResult.missing.map((m, i) => (
                      <div
                        key={i}
                        style={{ fontSize: 12, color: G.text, marginBottom: 4 }}
                      >
                        ✕ {m}
                      </div>
                    ))}
                  </div>
                )}
                {evalResult.excess.length > 0 && (
                  <div>
                    <div
                      style={{ fontSize: 11, color: G.accent, marginBottom: 6 }}
                    >
                      REVISAR:
                    </div>
                    {evalResult.excess.map((e, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 12,
                          color: G.muted,
                          marginBottom: 4,
                        }}
                      >
                        ⚠ {e}
                      </div>
                    ))}
                  </div>
                )}
                {evalResult.sufficient && (
                  <div style={{ fontSize: 12, color: G.green }}>
                    ✓ Los equipos declarados son suficientes para el objetivo.
                  </div>
                )}
              </div>
            )}

            {[
              {
                title: "CHANCADOR PRIMARIO — MANDÍBULA",
                category: "jaw",
                list: res.eqRec.jaw,
                color: G.accent,
                note: `CSS requerido: ${sz(res.primary.css)} · P80 salida: ${sz(res.primary.p80)}`,
              },
              {
                title: "CONO SECUNDARIO",
                category: "cone",
                list: res.eqRec.cone,
                color: G.purple,
                note: `CSS requerido: ${sz(res.secondary.css)} · P80 salida: ${sz(res.secondary.p80)}`,
              },
              ...(res.needsT
                ? [
                    {
                      title: "CONO / VSI TERCIARIO",
                      list:
                        EQ.cone
                          .filter(
                            (e) =>
                              Number(res.tertiary.css) >= e.cssR[0] &&
                              Number(res.tertiary.css) <= e.cssR[1],
                          )
                          .slice(0, 3) || EQ.cone.slice(0, 2),
                      color: G.cyan,
                      note: `CSS requerido: ${sz(res.tertiary.css)} · P80 salida: ${sz(res.tertiary.p80)}`,
                    },
                  ]
                : []),
              ...(showHSI
                ? [
                    {
                      title: "HSI — CHANCADOR DE IMPACTO",
                      list: res.eqRec.hsi,
                      color: G.blue,
                      note: `Capacidad requerida: ${res.inp.tph} tph`,
                    },
                  ]
                : []),
              {
                title: `SELECCIONADORA — ${res.eqRec.is3d ? "3 DECK" : "2 DECK"}`,
                list: res.eqRec.screen,
                color: G.green,
                note: `Carga total: ${(Number(res.inp.tph) + Number(res.screening.over)).toFixed(0)} tph · CC: ${res.screening.ccLoad}%`,
              },
            ].map((sec) => (
              <div
                key={sec.title}
                style={{
                  background: G.card,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  padding: 14,
                }}
              >
                <SectionTitle>{sec.title}</SectionTitle>
                <div style={{ fontSize: 11, color: G.muted, marginBottom: 10 }}>
                  Parámetros: {sec.note}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {sec.list.map((eq, i) => (
                    <div
                      key={eq.model}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        padding: "12px 14px",
                        background: i === 0 ? `${G.accentDim}22` : G.faint,
                        borderRadius: 8,
                        border: `1px solid ${i === 0 ? sec.color : G.border}`,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            color: i === 0 ? sec.color : G.text,
                            fontWeight: i === 0 ? 700 : 500,
                            lineHeight: 1.2,
                          }}
                        >
                          {eq.brand} {eq.model} {i === 0 && "• recomendado"}
                        </div>
                        <div
                          style={{ fontSize: 11, color: G.muted, marginTop: 4 }}
                        >
                          {eq.notes}
                        </div>
                        {i === 0 && sec.category && (
                          <div
                            style={{
                              marginTop: 8,
                              padding: "6px 8px",
                              background: G.accentDim,
                              borderRadius: 6,
                              fontSize: 10,
                              color: sec.color,
                              display: "inline-flex",
                            }}
                          >
                            Equipo sugerido para {sec.category}
                          </div>
                        )}
                        {i === 0 && sec.category && (
                          <div style={{ marginTop: 8 }}>
                            {findEquivalents(eq, sec.category).map((alt) => (
                              <div
                                key={alt.model}
                                style={{
                                  fontSize: 11,
                                  color: G.text,
                                  marginTop: 4,
                                }}
                              >
                                ✓ Equivalente: {alt.brand} {alt.model}
                                {alt.cssR
                                  ? ` · CSS ${alt.cssR[0]}–${alt.cssR[1]}mm`
                                  : ""}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          textAlign: "right",
                          fontSize: 10,
                          color: G.muted,
                          flexShrink: 0,
                          marginLeft: 12,
                        }}
                      >
                        {eq.cssR && (
                          <div>
                            CSS {eq.cssR[0]}–{eq.cssR[1]}mm
                          </div>
                        )}
                        {eq.capR && (
                          <div>
                            {eq.capR[0]}–{eq.capR[1]} tph
                          </div>
                        )}
                        {eq.decks && <div>{eq.decks} decks</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* ── Validar vs. equipo de referencia del cliente ───────────── */}
            {(() => {
              const refTphVal = Number(refTph) || 0;
              const delta = tphEfectivo - refTphVal;
              const pctDelta = refTphVal > 0 ? (delta / refTphVal) * 100 : 0;
              const cumple = delta >= 0;
              const mostrarIndicador = refTph !== "" && refTphVal > 0;
              return (
                <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 8, padding: 14 }}>
                  <SectionTitle>VALIDAR VS. EQUIPO DE REFERENCIA DEL CLIENTE</SectionTitle>
                  <div style={{ display: "grid", gap: 10, marginBottom: mostrarIndicador ? 12 : 0 }}>
                    <div>
                      <label style={{ fontSize: 11, color: G.muted, display: "block", marginBottom: 4 }}>
                        Modelo citado por el cliente
                      </label>
                      <input
                        type="text"
                        value={refModelo}
                        onChange={e => setRefModelo(e.target.value)}
                        placeholder="ej. Sandvik QJ241"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, background: G.surface, border: `1px solid ${G.border}`, color: G.text, fontSize: 13, fontFamily: G.font, boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, color: G.muted, display: "block", marginBottom: 4 }}>
                          Capacidad citada (tph)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={refTph}
                          onChange={e => setRefTph(e.target.value)}
                          placeholder="ej. 150"
                          style={{ width: "100%", padding: "7px 10px", borderRadius: 6, background: G.surface, border: `1px solid ${G.border}`, color: G.text, fontSize: 13, fontFamily: G.font, boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: G.muted, display: "block", marginBottom: 4 }}>
                          Capacidad calculada (este circuito)
                        </label>
                        <div style={{ padding: "7px 10px", borderRadius: 6, background: G.faint, border: `1px solid ${G.border}`, fontSize: 13, color: G.text, fontFamily: G.fontD, fontWeight: 700 }}>
                          {tphEfectivo.toFixed(1)} tph
                        </div>
                      </div>
                    </div>
                  </div>
                  {mostrarIndicador && (
                    <div style={{ padding: "10px 14px", borderRadius: 6, background: cumple ? `${G.green}18` : "rgba(239,68,68,0.12)", border: `1px solid ${cumple ? G.green : G.red}`, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{cumple ? "✓" : "✗"}</span>
                      <span style={{ fontSize: 13, color: cumple ? G.green : G.red, fontWeight: 600 }}>
                        {cumple
                          ? `Cumple — capacidad igual o mayor (+${delta.toFixed(1)} tph, +${pctDelta.toFixed(1)}%)`
                          : `No cumple — faltan ${Math.abs(delta).toFixed(1)} tph (${Math.abs(pctDelta).toFixed(1)}%) para igualar la referencia`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div
              style={{
                background: G.card,
                border: `1px solid ${G.green}44`,
                borderRadius: 8,
                padding: 14,
              }}
            >
              <SectionTitle>MALLAS SELECCIONADORA RECOMENDADAS</SectionTitle>
              <div style={{ fontSize: 11, color: G.muted, marginBottom: 10 }}>
                Determinadas según P80 objetivo de los productos (
                {res.recommendedDecks || 1} deck
                {(res.recommendedDecks || 1) > 1 ? "s" : ""} recomendados)
              </div>
              {[1, 2, 3].slice(0, res.recommendedDecks || 1).map((d) => (
                <div
                  key={d}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: G.faint,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 12, color: G.muted }}>Deck {d}</span>
                  <span
                    style={{
                      fontSize: 15,
                      color: G.green,
                      fontWeight: 700,
                      fontFamily: G.fontD,
                    }}
                  >
                    {d === 1
                      ? res.recommendedMesh?.deck1
                      : d === 2
                        ? res.recommendedMesh?.deck2
                        : res.recommendedMesh?.deck3}{" "}
                    mm
                  </span>
                </div>
              ))}
              <div
                style={{
                  fontSize: 10,
                  color: G.muted,
                  marginTop: 8,
                  borderTop: `1px solid ${G.border}`,
                  paddingTop: 8,
                }}
              >
                Las aperturas de malla se calculan automáticamente para
                maximizar eficiencia según el P80 objetivo definido en los
                productos.
              </div>
            </div>

            {(res.inp.circPath === "manual" ||
              res.inp.circPath === "available") && (
              <div
                style={{
                  background: G.card,
                  border: `1px solid ${G.accentDim}`,
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <SectionTitle>SUGERENCIAS DE MEJORA AL CIRCUITO</SectionTitle>
                <div style={{ fontSize: 12, color: G.text, lineHeight: 1.7 }}>
                  <B t={analysis.variant} />
                </div>
                {analysis.recs.slice(0, 2).map((r, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      color: G.text,
                      marginTop: 8,
                      lineHeight: 1.6,
                    }}
                  >
                    <B t={r} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB RESUMEN ── */}
        {tab === "resumen" && (
          <div style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <Kpi
                label={<>ENERGÍA ESPECÍFICA <Info text={TT.ener}/></>}
                value={res.final.ePerT}
                unit="kWh/t"
                sub={`Total: ${res.final.eTot} kWh · ${res.inp.tph} tph`}
                color={G.blue}
                icon="⚡"
              />
              <Kpi
                label={<>CARGA CIRCULANTE <Info text={TT.cc}/></>}
                value={res.screening.ccLoad}
                unit="%"
                sub={`${res.screening.over} tph retornadas`}
                color={cc > 30 ? G.red : cc > 20 ? G.accent : G.green}
                icon="↺"
              />
              <Kpi
                label="ERROR ESTIMADO"
                value={`±${res.errPct}`}
                unit="%"
                sub={
                  res.inp.curveType === "f80only" ||
                  res.inp.curveType === "omit"
                    ? "Solo F80 ingresado"
                    : res.inp.curveType === "partial"
                      ? "F80 + F50"
                      : `${(res.inp.curvePoints || []).filter((p) => p.sizeMm > 0).length} puntos de curva`
                }
                color={res.errColor}
                icon="◎"
              />
              <Kpi
                label="ETAPAS DE CHANCADO"
                value={res.needsT ? "3" : "2"}
                unit="etapas"
                sub={
                  res.needsT
                    ? "Mandíbula → Cono → Cono/VSI"
                    : "Mandíbula → Cono"
                }
                color={G.accent}
                icon="⊞"
              />
            </div>
            <div
              style={{
                background: `linear-gradient(135deg,${G.card} 0%,${G.card2} 100%)`,
                border: `1px solid ${G.accentDim}`,
                borderRadius: 8,
                padding: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg,${G.accent},#d97706)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  ◈
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: G.fontD,
                      fontWeight: 700,
                      fontSize: 14,
                      color: G.accent,
                    }}
                  >
                    KrushRock — Análisis técnico
                  </div>
                  <div style={{ fontSize: 10, color: G.muted }}>
                    Motor de análisis por reglas · sin API externa · error ±
                    {res.errPct}%
                  </div>
                </div>
              </div>
              <div className="fi" style={{ display: "grid", gap: 12 }}>
                <div style={{ fontSize: 13, color: G.text, lineHeight: 1.75 }}>
                  <B t={analysis.diag} />
                </div>
                <div
                  style={{ borderTop: `1px solid ${G.border}`, paddingTop: 10 }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: G.accent,
                      letterSpacing: "0.08em",
                      marginBottom: 8,
                    }}
                  >
                    OBSERVACIONES
                  </div>
                  {analysis.obs.map((o, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 12,
                        color: G.text,
                        lineHeight: 1.65,
                        marginBottom: 5,
                      }}
                    >
                      <B t={o} />
                    </div>
                  ))}
                </div>
                <div
                  style={{ borderTop: `1px solid ${G.border}`, paddingTop: 10 }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: G.accent,
                      letterSpacing: "0.08em",
                      marginBottom: 8,
                    }}
                  >
                    RECOMENDACIONES
                  </div>
                  {analysis.recs.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 12,
                        color: G.text,
                        lineHeight: 1.65,
                        marginBottom: 5,
                      }}
                    >
                      <B t={r} />
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    background: G.faint,
                    borderRadius: 6,
                    padding: "9px 13px",
                    fontSize: 12,
                    color: G.muted,
                    borderLeft: `3px solid ${G.accent}`,
                  }}
                >
                  {analysis.variant}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB DIAGRAMA ── */}
        {tab === "diagrama" && (
          <div style={{ display: "grid", gap: 14 }}>
            <Diagram r={res} unit={unit} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: res.needsT ? "1fr 1fr 1fr" : "1fr 1fr",
                gap: 10,
              }}
            >
              {[
                {
                  t: "MANDÍBULA (PRIMARIO)",
                  c: G.accent,
                  items: [
                    ["CSS", sz(res.primary.css), TT.css],
                    ["P80 salida", sz(res.primary.p80), TT.p80],
                    ["Energía", res.primary.energy + " kWh/t", TT.ener],
                  ],
                },
                {
                  t: "CONO (SECUNDARIO)",
                  c: G.purple,
                  items: [
                    ["CSS", sz(res.secondary.css), TT.css],
                    ["P80 salida", sz(res.secondary.p80), TT.p80],
                    ["Energía", res.secondary.energy + " kWh/t", TT.ener],
                  ],
                },
                ...(res.needsT
                  ? [
                      {
                        t: "CONO / VSI (TERCIARIO)",
                        c: G.cyan,
                        items: [
                          ["CSS", sz(res.tertiary.css), TT.css],
                          ["P80 salida", sz(res.tertiary.p80), TT.p80],
                          ["Energía", res.tertiary.energy + " kWh/t", TT.ener],
                        ],
                      },
                    ]
                  : []),
              ].map((s) => (
                <div
                  key={s.t}
                  style={{
                    background: G.card,
                    border: `1px solid ${G.border}`,
                    borderRadius: 8,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: s.c,
                      letterSpacing: "0.08em",
                      marginBottom: 10,
                    }}
                  >
                    ● {s.t}
                  </div>
                  {s.items.map(([k, v, tip]) => (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ color: G.muted }}>{k}{tip && <Info text={tip}/>}</span>
                      <span style={{ color: s.c }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB PRODUCTOS ── */}
        {tab === "productos" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                background: G.card,
                border: `1px solid ${G.border}`,
                borderRadius: 8,
                padding: 16,
              }}
            >
              <SectionTitle>DISTRIBUCIÓN DE PRODUCTOS</SectionTitle>
              <div style={{ fontSize: 12, color: G.muted, marginBottom: 14 }}>
                Alimentación: {res.inp.tph} tph
                {(res.inp.curveType === "f80only" ||
                  res.inp.curveType === "omit") && (
                  <span style={{ color: G.accent }}>
                    {" "}
                    · ⚠ distribución estimada (error ±{res.errPct}%)
                  </span>
                )}
                {res.inp.curveType === "partial" && (
                  <span style={{ color: G.accent }}>
                    {" "}
                    · curva parcial (error ±{res.errPct}%)
                  </span>
                )}
                {res.inp.curveType === "full" && (
                  <span style={{ color: G.green }}>
                    {" "}
                    · curva ingresada (error ±{res.errPct}%)
                  </span>
                )}
              </div>
              {res.products.map((p, i) => {
                const pct = Number(p.yldPct);
                const cols = [G.accent, G.cyan, G.purple, G.green];
                const c = cols[i % cols.length];
                const pLabel =
                  p.label || (p.minMm === 0 && p.maxMm >= 9999)
                    ? "Todo"
                    : p.label || `Producto ${i + 1}`;
                return (
                  <div key={p.id} style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        marginBottom: 5,
                      }}
                    >
                      <span style={{ color: G.text }}>{pLabel}</span>
                      <span style={{ color: c, fontWeight: 600 }}>
                        {p.tphOut} tph · {pct}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        background: G.border,
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(pct, 100)}%`,
                          background: c,
                          borderRadius: 4,
                          transition: "width .8s ease",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 10, color: G.muted, marginTop: 3 }}>
                      {fromMm(p.minMm, unit)} – {fromMm(p.maxMm, unit)} {ul}
                    </div>
                  </div>
                );
              })}
            </div>
            {res.bottlenecks.length > 0 && (
              <div
                style={{
                  background: G.card,
                  border: `1px solid ${G.redDim || "#7f1d1d"}`,
                  borderRadius: 8,
                  padding: 14,
                }}
              >
                <SectionTitle>BOTTLENECKS</SectionTitle>
                {res.bottlenecks.map((b, i) => (
                  <div
                    key={i}
                    style={{ fontSize: 12, color: G.text, marginBottom: 5 }}
                  >
                    ⚠ {b}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB DETALLE ── */}
        {tab === "detalle" && (
          <div style={{ display: "grid", gap: 12 }}>
            {[
              {
                title: "DATOS DE ENTRADA",
                items: [
                  ["Tipo de roca", res.rock.name],
                  ["Wi Bond", res.rock.wi + " kWh/t", TT.wi],
                  ["Abrasividad", res.rock.ab],
                  ["Densidad", res.rock.den + " t/m³"],
                  ["Tonelaje", res.inp.tph + " tph"],
                  ["F80 alimentación", sz(res.inp.f80), TT.f80],
                  ["Humedad", humTxt],
                  [
                    "Altitud",
                    res.inp.altitudeOmit
                      ? "Omitida"
                      : res.inp.altitude > 0
                        ? res.inp.altitude + " m.s.n.m."
                        : "No especificada",
                  ],
                  [
                    "Curva granulométrica",
                    {
                      f80only: "Solo F80",
                      omit: "Solo F80",
                      partial: "Parcial (F80+F50)",
                      full: `Completa (${(res.inp.curvePoints || []).filter((p) => p.sizeMm > 0).length} puntos)`,
                    }[res.inp.curveType] || "Solo F80",
                  ],
                  ["Error estimado", "±" + res.errPct + "%"],
                  ["Circuito", cnName],
                ],
              },
              {
                title: "BALANCE DE MASAS",
                items: [
                  ["Alimentación fresca", res.inp.tph + " tph"],
                  ["Sobre-tamaño retornado", res.screening.over + " tph"],
                  [
                    "Carga total seleccionadora",
                    (Number(res.inp.tph) + Number(res.screening.over)).toFixed(
                      0,
                    ) + " tph",
                  ],
                  ["Carga circulante", res.screening.ccLoad + " %", TT.cc],
                  [
                    "Eficiencia seleccionadora (estimada)",
                    res.screening.eff + " %",
                    TT.eff,
                  ],
                ],
              },
              {
                title: "ENERGÍA DEL CIRCUITO",
                items: [
                  ["Etapa primaria (mandíbula)", res.primary.energy + " kWh/t"],
                  ["Etapa secundaria (cono)", res.secondary.energy + " kWh/t"],
                  ...(res.needsT
                    ? [
                        [
                          "Etapa terciaria (cono/VSI)",
                          res.tertiary.energy + " kWh/t",
                        ],
                      ]
                    : []),
                  ["Energía específica total", res.final.ePerT + " kWh/t", TT.ener],
                  ["Energía total por hora", res.final.eTot + " kWh"],
                  [
                    "Factor de potencia altitud",
                    (res.altC * 100).toFixed(0) +
                      "%" +
                      (res.altM > 1500 ? ` (${res.altM}m)` : ""),
                  ],
                ],
              },
              {
                title: "CSS / P80 POR ETAPA",
                items: [
                  ["Mandíbula CSS", sz(res.primary.css), TT.css],
                  ["Mandíbula P80 salida", sz(res.primary.p80), TT.p80],
                  ["Cono CSS", sz(res.secondary.css), TT.css],
                  ["Cono P80 salida", sz(res.secondary.p80), TT.p80],
                  ...(res.needsT
                    ? [
                        ["Cono/VSI terciario CSS", sz(res.tertiary.css), TT.css],
                        ["Cono/VSI P80 salida", sz(res.tertiary.p80), TT.p80],
                      ]
                    : []),
                ],
              },
              {
                title: "CONFIGURACIÓN DE EQUIPOS",
                items: [
                  ["Perfil manto cono", res.conePerfil || "M (por defecto)"],
                  [
                    "Decks seleccionadora recomendados",
                    `${res.recommendedDecks || 1}`,
                  ],
                  [
                    "Malla deck 1 recomendada",
                    `${res.recommendedMesh?.deck1 || res.meshMm} mm`,
                  ],
                  ...((res.recommendedDecks || 1) >= 2
                    ? [
                        [
                          "Malla deck 2 recomendada",
                          `${res.recommendedMesh?.deck2 || "-"} mm`,
                        ],
                      ]
                    : []),
                  ...((res.recommendedDecks || 1) >= 3
                    ? [
                        [
                          "Malla deck 3 recomendada",
                          `${res.recommendedMesh?.deck3 || "-"} mm`,
                        ],
                      ]
                    : []),
                  ["Palanca mandíbula", res.jawPalanca || "doble (estimado)"],
                  ["RPM mandíbula", `${res.jawRpm} RPM`],
                  ["RPM cono", `${res.coneRpm} RPM`],
                ],
              },
            ].map((sec) => (
              <div
                key={sec.title}
                style={{
                  background: G.card,
                  border: `1px solid ${G.border}`,
                  borderRadius: 8,
                  padding: 14,
                }}
              >
                <SectionTitle>{sec.title}</SectionTitle>
                {sec.items.map(([k, v, tip]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      marginBottom: 8,
                      gap: 8,
                    }}
                  >
                    <span style={{ color: G.muted, flexShrink: 0 }}>{k}{tip && <Info text={tip}/>}</span>
                    <span style={{ color: G.text, textAlign: "right" }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── TAB OPERACIÓN (solo parámetros operacionales) ── */}
        {tab === "produccion" && (
          <div style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                padding: "10px 14px",
                background: G.faint,
                borderRadius: 8,
                fontSize: 12,
                color: G.muted,
                borderLeft: `3px solid ${G.accent}`,
              }}
            >
              Configura aquí los parámetros de operación de la planta. Las
              proyecciones de producción se encuentran en la pestaña{" "}
              <strong style={{ color: G.accent }}>Proyecciones</strong>.
            </div>

            {/* Parámetros operacionales */}
            <div
              style={{
                background: G.card,
                border: `1px solid ${G.border}`,
                borderRadius: 8,
                padding: 16,
              }}
            >
              <SectionTitle>PARÁMETROS OPERACIONALES</SectionTitle>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}
                  >
                    Horas por turno
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[8, 10, 12].map((h) => (
                      <button
                        key={h}
                        onClick={() => setHorasTurno(h)}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          borderRadius: 6,
                          cursor: "pointer",
                          border: `1px solid ${horasTurno === h ? G.accent : G.border}`,
                          background:
                            horasTurno === h ? `${G.accentDim}33` : G.faint,
                          color: horasTurno === h ? G.accent : G.muted,
                          fontSize: 13,
                          fontFamily: G.font,
                        }}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div
                    style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}
                  >
                    Turnos por día
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1, 2, 3].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTurnosDia(t)}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          borderRadius: 6,
                          cursor: "pointer",
                          border: `1px solid ${turnosDia === t ? G.accent : G.border}`,
                          background:
                            turnosDia === t ? `${G.accentDim}33` : G.faint,
                          color: turnosDia === t ? G.accent : G.muted,
                          fontSize: 13,
                          fontFamily: G.font,
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div
                    style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}
                  >
                    Días operativos / semana
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[5, 6, 7].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDiasSemana(d)}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          borderRadius: 6,
                          cursor: "pointer",
                          border: `1px solid ${diasSemana === d ? G.accent : G.border}`,
                          background:
                            diasSemana === d ? `${G.accentDim}33` : G.faint,
                          color: diasSemana === d ? G.accent : G.muted,
                          fontSize: 13,
                          fontFamily: G.font,
                        }}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ fontSize: 11, color: G.muted }}>
                    Horas operativas / día
                  </div>
                  <div
                    style={{
                      fontFamily: G.fontD,
                      fontWeight: 700,
                      fontSize: 24,
                      color: G.accent,
                      lineHeight: 1.2,
                    }}
                  >
                    {horasDia}h
                  </div>
                  <div style={{ fontSize: 10, color: G.muted }}>
                    {horasTurno}h × {turnosDia} turno(s)
                  </div>
                </div>
                <div>
                  <div
                    style={{ fontSize: 11, color: G.muted, marginBottom: 5 }}
                  >
                    Disponibilidad mecánica:{" "}
                    <strong style={{ color: G.accent }}>{dispMec}%</strong>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    step={1}
                    value={dispMec}
                    onChange={(e) => setDispMec(Number(e.target.value))}
                  />
                  <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>
                    Tiempo mecánico disponible (paradas programadas y fallas)
                  </div>
                </div>
                <div>
                  <div
                    style={{ fontSize: 11, color: G.muted, marginBottom: 5 }}
                  >
                    Utilización operacional:{" "}
                    <strong style={{ color: G.accent }}>{utilOp}%</strong>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    step={1}
                    value={utilOp}
                    onChange={(e) => setUtilOp(Number(e.target.value))}
                  />
                  <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>
                    Fracción de tiempo disponible en que se produce
                    efectivamente
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  background: G.faint,
                  borderRadius: 6,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 20,
                  fontSize: 12,
                }}
              >
                <span style={{ color: G.muted }}>
                  Factor efectivo:{" "}
                  <strong style={{ color: G.accent }}>
                    {(factorEf * 100).toFixed(0)}%
                  </strong>
                </span>
                <span style={{ color: G.muted }}>
                  TPH nominal:{" "}
                  <strong style={{ color: G.text }}>{tphNominal} tph</strong>
                </span>
                <span style={{ color: G.muted }}>
                  TPH efectivo:{" "}
                  <strong style={{ color: G.green }}>
                    {tphEfectivo.toFixed(1)} tph
                  </strong>
                </span>
                <span style={{ color: G.muted }}>
                  ~{Math.round(diasPorMes)} días operativos/mes
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB PROYECCIONES ── */}
        {tab === "proyecciones" && (
          <div style={{ display: "grid", gap: 14 }}>
            {/* Selector de modo */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
              }}
            >
              {[
                {
                  v: "produccion",
                  l: "Producción",
                  s: "¿Cuánto voy a producir?",
                },
                { v: "deadline", l: "Deadline", s: "¿Puedo cumplir una meta?" },
                { v: "campana", l: "Campaña", s: "Optimizar por producto" },
              ].map((m) => (
                <button
                  key={m.v}
                  onClick={() => setProdMode(m.v)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    textAlign: "left",
                    background: prodMode === m.v ? `${G.accentDim}33` : G.card,
                    border: `1px solid ${prodMode === m.v ? G.accent : G.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: prodMode === m.v ? G.accent : G.text,
                      fontWeight: 600,
                    }}
                  >
                    {m.l}
                  </div>
                  <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>
                    {m.s}
                  </div>
                </button>
              ))}
            </div>

            {/* ─── MODO PRODUCCIÓN ─── */}
            {prodMode === "produccion" && (
              <>
                <div
                  style={{
                    background: G.card,
                    border: `1px solid ${G.border}`,
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <SectionTitle>HORIZONTE DE SIMULACIÓN</SectionTitle>
                  <div style={{ textAlign: "center", marginBottom: 10 }}>
                    <span
                      style={{
                        fontFamily: G.fontD,
                        fontWeight: 800,
                        fontSize: 48,
                        color: G.accent,
                      }}
                    >
                      {horizMes}
                    </span>
                    <span
                      style={{ fontSize: 18, color: G.muted, marginLeft: 10 }}
                    >
                      meses
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    step={1}
                    value={horizMes}
                    onChange={(e) => setHorizMes(Number(e.target.value))}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 10,
                      color: G.muted,
                      marginTop: 4,
                      marginBottom: 12,
                    }}
                  >
                    <span>1</span>
                    <span>6</span>
                    <span>12</span>
                    <span>18</span>
                    <span>24 meses</span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(6,1fr)",
                      gap: 5,
                    }}
                  >
                    {[1, 2, 3, 6, 12, 24].map((m) => (
                      <button
                        key={m}
                        onClick={() => setHorizMes(m)}
                        style={{
                          padding: "6px 4px",
                          borderRadius: 6,
                          cursor: "pointer",
                          border: `1px solid ${horizMes === m ? G.accent : G.border}`,
                          background:
                            horizMes === m ? `${G.accentDim}33` : G.faint,
                          color: horizMes === m ? G.accent : G.muted,
                          fontSize: 11,
                          fontFamily: G.font,
                        }}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* KPIs producción */}
                <div
                  style={{
                    background: `linear-gradient(135deg,${G.card},${G.card2})`,
                    border: `2px solid ${G.green}`,
                    borderRadius: 10,
                    padding: 20,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: G.muted,
                      letterSpacing: "0.1em",
                      marginBottom: 6,
                    }}
                  >
                    PRODUCCIÓN TOTAL EN {horizMes}{" "}
                    {horizMes === 1 ? "MES" : "MESES"}
                  </div>
                  <div
                    style={{
                      fontFamily: G.fontD,
                      fontWeight: 800,
                      fontSize: 52,
                      color: G.green,
                      lineHeight: 1,
                    }}
                  >
                    {fmtTon(tonHorizonte)}
                  </div>
                  <div style={{ fontSize: 12, color: G.muted, marginTop: 6 }}>
                    {Math.round(tonHorizonte).toLocaleString()} toneladas
                    totales
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <Kpi
                    label="TON / MES"
                    value={fmtTon(tonPorMes)}
                    unit=""
                    sub={`${Math.round(diasPorMes)} días op. × ${horasDia}h × ${tphEfectivo.toFixed(1)} tph`}
                    color={G.accent}
                    icon="◈"
                  />
                  <Kpi
                    label="TON / SEMANA"
                    value={fmtTon(tonPorSemana)}
                    unit=""
                    sub={`${diasSemana} días operativos`}
                    color={G.purple}
                    icon="⊞"
                  />
                  <Kpi
                    label="TON / DÍA"
                    value={fmtTon(tonPorDia)}
                    unit=""
                    sub={`${horasDia}h efectivas`}
                    color={G.blue}
                    icon="◆"
                  />
                  <Kpi
                    label="TPH EFECTIVO"
                    value={tphEfectivo.toFixed(1)}
                    unit="tph"
                    sub={`${tphNominal} nominal × ${(factorEf * 100).toFixed(0)}%`}
                    color={G.green}
                    icon="⚡"
                  />
                </div>

                {/* Tabla por fracción */}
                <div
                  style={{
                    background: G.card,
                    border: `1px solid ${G.border}`,
                    borderRadius: 8,
                    padding: 14,
                  }}
                >
                  <SectionTitle>
                    DESGLOSE POR FRACCIÓN — {horizMes}{" "}
                    {horizMes === 1 ? "MES" : "MESES"}
                  </SectionTitle>
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 12,
                      }}
                    >
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${G.border}` }}>
                          <th
                            style={{
                              color: G.muted,
                              padding: "6px 8px",
                              textAlign: "left",
                              fontSize: 10,
                              letterSpacing: "0.06em",
                            }}
                          >
                            FRACCIÓN
                          </th>
                          <th
                            style={{
                              color: G.muted,
                              padding: "6px 8px",
                              textAlign: "right",
                              fontSize: 10,
                            }}
                          >
                            TPH ef.
                          </th>
                          <th
                            style={{
                              color: G.muted,
                              padding: "6px 8px",
                              textAlign: "right",
                              fontSize: 10,
                            }}
                          >
                            TON/MES
                          </th>
                          <th
                            style={{
                              color: G.muted,
                              padding: "6px 8px",
                              textAlign: "right",
                              fontSize: 10,
                            }}
                          >
                            TOTAL {horizMes}M
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {prodsEf.map((p, i) => {
                          const cols = [G.accent, G.cyan, G.purple, G.green];
                          const c = cols[i % cols.length];
                          const pLabel =
                            p.label ||
                            (p.minMm === 0 && p.maxMm >= 9999
                              ? "Todo"
                              : `Producto ${i + 1}`);
                          return (
                            <tr
                              key={p.id}
                              style={{
                                borderBottom: `1px solid ${G.border}22`,
                              }}
                            >
                              <td style={{ padding: "8px", color: c }}>
                                {pLabel}
                                <div style={{ fontSize: 9, color: G.muted }}>
                                  {fromMm(p.minMm, unit)}–
                                  {fromMm(p.maxMm, unit)} {ul} · {p.yldPct}%
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "8px",
                                  textAlign: "right",
                                  color: G.text,
                                }}
                              >
                                {p.tphEf}
                              </td>
                              <td
                                style={{
                                  padding: "8px",
                                  textAlign: "right",
                                  color: G.text,
                                }}
                              >
                                {p.tonMes.toLocaleString()}
                              </td>
                              <td
                                style={{
                                  padding: "8px",
                                  textAlign: "right",
                                  fontWeight: 600,
                                  color: c,
                                }}
                              >
                                {p.tonHor.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                        <tr
                          style={{
                            borderTop: `1px solid ${G.border}`,
                            background: G.faint,
                          }}
                        >
                          <td
                            style={{
                              padding: "8px",
                              color: G.accent,
                              fontWeight: 600,
                              fontSize: 12,
                            }}
                          >
                            TOTAL PLANTA
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              textAlign: "right",
                              color: G.accent,
                              fontWeight: 600,
                            }}
                          >
                            {tphEfectivo.toFixed(1)}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              textAlign: "right",
                              color: G.accent,
                              fontWeight: 600,
                            }}
                          >
                            {Math.round(tonPorMes).toLocaleString()}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              textAlign: "right",
                              fontWeight: 700,
                              color: G.green,
                              fontSize: 14,
                            }}
                          >
                            {Math.round(tonHorizonte).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ─── MODO DEADLINE ─── */}
            {prodMode === "deadline" && (
              <>
                <div
                  style={{
                    background: G.card,
                    border: `1px solid ${G.border}`,
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <SectionTitle>META DE PRODUCCIÓN</SectionTitle>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 14,
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
                        Toneladas objetivo (total planta)
                      </div>
                      <input
                        type="number"
                        value={deadlineTon}
                        min={1000}
                        step={1000}
                        onChange={(e) =>
                          setDeadlineTon(Math.max(1000, Number(e.target.value)))
                        }
                      />
                      <div
                        style={{ fontSize: 10, color: G.muted, marginTop: 4 }}
                      >
                        {(deadlineTon / 1000).toFixed(0)}k ton totales
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: G.muted,
                          marginBottom: 5,
                        }}
                      >
                        Plazo máximo (meses)
                      </div>
                      <input
                        type="number"
                        value={deadlineMes}
                        min={1}
                        max={60}
                        step={1}
                        onChange={(e) =>
                          setDeadlineMes(Math.max(1, Number(e.target.value)))
                        }
                      />
                      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                        {[1, 3, 6, 12].map((m) => (
                          <button
                            key={m}
                            onClick={() => setDeadlineMes(m)}
                            style={{
                              flex: 1,
                              padding: "5px 2px",
                              borderRadius: 5,
                              cursor: "pointer",
                              border: `1px solid ${deadlineMes === m ? G.accent : G.border}`,
                              background:
                                deadlineMes === m
                                  ? `${G.accentDim}33`
                                  : G.faint,
                              color: deadlineMes === m ? G.accent : G.muted,
                              fontSize: 11,
                              fontFamily: G.font,
                            }}
                          >
                            {m}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resultado cumplimiento */}
                <div
                  style={{
                    background: cumple ? `${G.green}11` : `${G.redDim}33`,
                    border: `2px solid ${cumple ? G.green : G.red}`,
                    borderRadius: 10,
                    padding: 22,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: G.fontD,
                      fontWeight: 800,
                      fontSize: 38,
                      color: cumple ? G.green : G.red,
                      marginBottom: 6,
                    }}
                  >
                    {cumple ? "✓ CUMPLE" : "✕ NO CUMPLE"}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: G.muted,
                      maxWidth: 480,
                      margin: "0 auto",
                    }}
                  >
                    {cumple
                      ? `La planta producirá ${fmtTon(tphEfectivo * horasDeadline)} en ${deadlineMes} meses — ${(pctCap - 100).toFixed(0)}% sobre la meta. Tiempo real estimado: ${mesesParaMeta.toFixed(1)} meses.`
                      : `Necesitas ${tphNomReq.toFixed(0)} tph nominales, dispones de ${tphNominal} tph. Déficit: ${(tphNomReq - tphNominal).toFixed(0)} tph.`}
                  </div>
                </div>

                {/* KPIs deadline */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <Kpi
                    label="TPH REQUERIDO (nominal)"
                    value={tphNomReq.toFixed(0)}
                    unit="tph"
                    sub={`efectivo necesario: ${tphEfReq.toFixed(1)} tph`}
                    color={cumple ? G.green : G.red}
                    icon="⚡"
                  />
                  <Kpi
                    label="CAPACIDAD DISPONIBLE"
                    value={pctCap.toFixed(0)}
                    unit="%"
                    sub={cumple ? "Margen positivo" : "Capacidad insuficiente"}
                    color={cumple ? G.green : G.red}
                    icon="◎"
                  />
                  <Kpi
                    label="TIEMPO REAL ESTIMADO"
                    value={mesesParaMeta.toFixed(1)}
                    unit="meses"
                    sub={
                      mesesParaMeta <= deadlineMes
                        ? "Dentro del plazo"
                        : "Supera el plazo"
                    }
                    color={mesesParaMeta <= deadlineMes ? G.green : G.red}
                    icon="→"
                  />
                  <Kpi
                    label="PRODUCCIÓN EN PLAZO"
                    value={fmtTon(tphEfectivo * horasDeadline)}
                    unit=""
                    sub={`de ${(deadlineTon / 1000).toFixed(0)}k ton objetivo`}
                    color={cumple ? G.green : G.accent}
                    icon="⊞"
                  />
                </div>

                {/* Análisis de brecha si no cumple */}
                {!cumple && (
                  <div
                    style={{
                      background: G.card,
                      border: `1px solid ${G.red}`,
                      borderRadius: 8,
                      padding: 16,
                    }}
                  >
                    <SectionTitle>ANÁLISIS DE BRECHA</SectionTitle>
                    <div
                      style={{
                        display: "grid",
                        gap: 8,
                        fontSize: 12,
                        color: G.text,
                        lineHeight: 1.7,
                      }}
                    >
                      <div>
                        ⚠ Déficit de capacidad:{" "}
                        <strong style={{ color: G.red }}>
                          {(tphNomReq - tphNominal).toFixed(0)} tph nominales
                        </strong>{" "}
                        ({((tphNomReq / tphNominal - 1) * 100).toFixed(0)}% más
                        de lo disponible)
                      </div>
                      <div>
                        → Para cumplir la meta en {deadlineMes} meses con el
                        equipo actual, necesitas{" "}
                        {((tphNomReq / tphNominal) * 100 - 100).toFixed(0)}% más
                        de capacidad instalada.
                      </div>
                      <div>
                        → Alternativa A: extender el plazo a{" "}
                        <strong style={{ color: G.accent }}>
                          {mesesParaMeta.toFixed(1)} meses
                        </strong>{" "}
                        con la planta actual.
                      </div>
                      <div>
                        → Alternativa B: aumentar disponibilidad mecánica o
                        utilización (factor actual:{" "}
                        {(factorEf * 100).toFixed(0)}%).
                      </div>
                      <div>
                        → Alternativa C: incorporar un segundo equipo o circuito
                        paralelo.
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabla por fracción en plazo */}
                <div
                  style={{
                    background: G.card,
                    border: `1px solid ${G.border}`,
                    borderRadius: 8,
                    padding: 14,
                  }}
                >
                  <SectionTitle>
                    DESGLOSE POR FRACCIÓN — {deadlineMes}{" "}
                    {deadlineMes === 1 ? "MES" : "MESES"}
                  </SectionTitle>
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 12,
                      }}
                    >
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${G.border}` }}>
                          <th
                            style={{
                              color: G.muted,
                              padding: "6px 8px",
                              textAlign: "left",
                              fontSize: 10,
                              letterSpacing: "0.06em",
                            }}
                          >
                            FRACCIÓN
                          </th>
                          <th
                            style={{
                              color: G.muted,
                              padding: "6px 8px",
                              textAlign: "right",
                              fontSize: 10,
                            }}
                          >
                            TPH ef.
                          </th>
                          <th
                            style={{
                              color: G.muted,
                              padding: "6px 8px",
                              textAlign: "right",
                              fontSize: 10,
                            }}
                          >
                            TON/MES
                          </th>
                          <th
                            style={{
                              color: G.muted,
                              padding: "6px 8px",
                              textAlign: "right",
                              fontSize: 10,
                            }}
                          >
                            TOTAL {deadlineMes}M
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {prodsEf.map((p, i) => {
                          const cols = [G.accent, G.cyan, G.purple, G.green];
                          const c = cols[i % cols.length];
                          const pLabel =
                            p.label ||
                            (p.minMm === 0 && p.maxMm >= 9999
                              ? "Todo"
                              : `Producto ${i + 1}`);
                          return (
                            <tr
                              key={p.id}
                              style={{
                                borderBottom: `1px solid ${G.border}22`,
                              }}
                            >
                              <td style={{ padding: "8px", color: c }}>
                                {pLabel}
                                <div style={{ fontSize: 9, color: G.muted }}>
                                  {fromMm(p.minMm, unit)}–
                                  {fromMm(p.maxMm, unit)} {ul} · {p.yldPct}%
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "8px",
                                  textAlign: "right",
                                  color: G.text,
                                }}
                              >
                                {p.tphEf}
                              </td>
                              <td
                                style={{
                                  padding: "8px",
                                  textAlign: "right",
                                  color: G.text,
                                }}
                              >
                                {p.tonMes.toLocaleString()}
                              </td>
                              <td
                                style={{
                                  padding: "8px",
                                  textAlign: "right",
                                  fontWeight: 600,
                                  color: c,
                                }}
                              >
                                {p.tonDL.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                        <tr
                          style={{
                            borderTop: `1px solid ${G.border}`,
                            background: G.faint,
                          }}
                        >
                          <td
                            style={{
                              padding: "8px",
                              color: cumple ? G.green : G.red,
                              fontWeight: 600,
                              fontSize: 12,
                            }}
                          >
                            TOTAL PLANTA
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              textAlign: "right",
                              color: G.accent,
                              fontWeight: 600,
                            }}
                          >
                            {tphEfectivo.toFixed(1)}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              textAlign: "right",
                              color: G.accent,
                              fontWeight: 600,
                            }}
                          >
                            {Math.round(tonPorMes).toLocaleString()}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              textAlign: "right",
                              fontWeight: 700,
                              color: cumple ? G.green : G.red,
                              fontSize: 14,
                            }}
                          >
                            {Math.round(
                              tphEfectivo * horasDeadline,
                            ).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 11,
                      color: G.muted,
                      textAlign: "right",
                    }}
                  >
                    Meta: {deadlineTon.toLocaleString()} ton · Diferencia:{" "}
                    <strong style={{ color: cumple ? G.green : G.red }}>
                      {cumple ? "+" : ""}
                      {Math.round(
                        tphEfectivo * horasDeadline - deadlineTon,
                      ).toLocaleString()}{" "}
                      ton
                    </strong>
                  </div>
                </div>
              </>
            )}

            {/* ─── MODO CAMPAÑA ─── */}
            {prodMode === "campana" && (
              <>
                {/* Inputs por producto */}
                <div
                  style={{
                    background: G.card,
                    border: `1px solid ${G.border}`,
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <SectionTitle>
                    OBJETIVO DE TONELADAS POR PRODUCTO
                  </SectionTitle>
                  <div
                    style={{ fontSize: 11, color: G.muted, marginBottom: 12 }}
                  >
                    Ingresa la meta de toneladas para cada fracción. Deja en 0
                    las que no tienen meta.
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {prodsEf.map((p, i) => {
                      const cols = [G.accent, G.cyan, G.purple, G.green];
                      const c = cols[i % cols.length];
                      const pLabel =
                        p.label ||
                        (p.minMm === 0 && p.maxMm >= 9999
                          ? "Todo"
                          : `${fromMm(p.minMm, unit)}–${fromMm(p.maxMm, unit)} ${ul}`);
                      const target = Number(prodTargets[p.id] || 0);
                      const mesesEst =
                        target > 0 && Number(p.tphEf) > 0
                          ? target / (Number(p.tphEf) * horasPorMes)
                          : 0;
                      return (
                        <div
                          key={p.id}
                          style={{
                            background: G.faint,
                            border: `1px solid ${target > 0 ? c : G.border}`,
                            borderRadius: 8,
                            padding: 12,
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                color: c,
                                fontWeight: 600,
                              }}
                            >
                              {pLabel}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: G.muted,
                                marginTop: 2,
                              }}
                            >
                              {p.yldPct}% del feed · {p.tphEf} tph ef. ·{" "}
                              {fmtTon(p.tonMes)}/mes
                              {target > 0 && mesesEst > 0 && (
                                <span style={{ color: G.accent }}>
                                  {" "}
                                  · estimado sin optimizar:{" "}
                                  {mesesEst.toFixed(1)} meses
                                </span>
                              )}
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <input
                              type="number"
                              value={target || ""}
                              min={0}
                              step={1000}
                              placeholder="ton"
                              onChange={(e) =>
                                setProdTargets((pt) => ({
                                  ...pt,
                                  [p.id]: Math.max(0, Number(e.target.value)),
                                }))
                              }
                              style={{ width: 100, textAlign: "right" }}
                            />
                            <span style={{ fontSize: 11, color: G.muted }}>
                              ton
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sin targets */}
                {!hasTargets && (
                  <div
                    style={{
                      background: G.card,
                      border: `1px solid ${G.border}`,
                      borderRadius: 8,
                      padding: 28,
                      textAlign: "center",
                      color: G.muted,
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 10 }}>◈</div>
                    <div style={{ fontSize: 13 }}>
                      Ingresa al menos un objetivo de toneladas para calcular la
                      campaña
                    </div>
                  </div>
                )}

                {/* Resultados de campaña */}
                {campaignPhases &&
                  campaignPhases.length > 0 &&
                  (() => {
                    const totalMeses = campaignTotalHours / horasPorMes;
                    const unoptMeses = campaignUnoptH / horasPorMes;
                    const ahorroMeses = Math.max(0, unoptMeses - totalMeses);
                    const hayCSSChanges = campaignPhases.some(
                      (ph) =>
                        ph.nextCSS !== null &&
                        Math.abs(ph.nextCSS - ph.cssUsed) > 0.1,
                    );
                    return (
                      <>
                        {/* Banner resumen */}
                        <div
                          style={{
                            background: `linear-gradient(135deg,${G.card},${G.card2})`,
                            border: `2px solid ${G.green}`,
                            borderRadius: 10,
                            padding: 20,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              color: G.muted,
                              letterSpacing: "0.08em",
                              marginBottom: 6,
                            }}
                          >
                            DURACIÓN TOTAL DE CAMPAÑA
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: 16,
                              flexWrap: "wrap",
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  fontFamily: G.fontD,
                                  fontWeight: 800,
                                  fontSize: 44,
                                  color: G.green,
                                }}
                              >
                                {totalMeses.toFixed(1)}
                              </span>
                              <span
                                style={{
                                  fontSize: 16,
                                  color: G.muted,
                                  marginLeft: 8,
                                }}
                              >
                                meses con optimización
                              </span>
                            </div>
                            {ahorroMeses > 0.05 && (
                              <div style={{ fontSize: 12, color: G.muted }}>
                                Sin optimizar:{" "}
                                <strong style={{ color: G.accent }}>
                                  {unoptMeses.toFixed(1)} meses
                                </strong>
                                <span style={{ color: G.green, marginLeft: 8 }}>
                                  → Ahorro:{" "}
                                  <strong>
                                    {ahorroMeses.toFixed(1)} meses
                                  </strong>
                                </span>
                              </div>
                            )}
                          </div>
                          {hayCSSChanges && (
                            <div
                              style={{
                                fontSize: 11,
                                color: G.muted,
                                marginTop: 8,
                                borderTop: `1px solid ${G.border}`,
                                paddingTop: 8,
                              }}
                            >
                              La optimización incluye cambios de CSS en el cono
                              entre fases para maximizar el rendimiento de los
                              productos pendientes.
                            </div>
                          )}
                        </div>

                        {/* Timeline de fases */}
                        <div
                          style={{
                            background: G.card,
                            border: `1px solid ${G.border}`,
                            borderRadius: 8,
                            padding: 16,
                          }}
                        >
                          <SectionTitle>
                            LÍNEA DE TIEMPO — PLAN DE CAMPAÑA
                          </SectionTitle>
                          <div style={{ display: "grid", gap: 0 }}>
                            {campaignPhases.map((ph, i) => {
                              const phaseMeses = ph.phaseHours / horasPorMes;
                              const accMeses = ph.accHours / horasPorMes;
                              const hasCSSChange =
                                ph.nextCSS !== null &&
                                Math.abs(ph.nextCSS - ph.cssUsed) > 0.1;
                              const hasTertSugg =
                                ph.removeTertSuggestion !== null &&
                                ph.removeTertSuggestion?.benefitPct > 2;
                              const completingP = ph.completing
                                .map((c) => prodsEf.find((p) => p.id === c.id))
                                .filter(Boolean);
                              const isLast = i === campaignPhases.length - 1;

                              return (
                                <div key={ph.phaseNum}>
                                  {/* Tarjeta de fase */}
                                  <div
                                    style={{
                                      background: G.faint,
                                      border: `1px solid ${G.border}`,
                                      borderRadius:
                                        hasCSSChange || hasTertSugg
                                          ? "8px 8px 0 0"
                                          : "8px",
                                      padding: 14,
                                      marginBottom:
                                        hasCSSChange || hasTertSugg ? 0 : 10,
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        flexWrap: "wrap",
                                        gap: 8,
                                      }}
                                    >
                                      <div style={{ flex: 1 }}>
                                        <div
                                          style={{
                                            fontSize: 12,
                                            color: G.accent,
                                            fontWeight: 600,
                                            marginBottom: 6,
                                          }}
                                        >
                                          Fase {ph.phaseNum} — CSS Cono:{" "}
                                          {ph.cssUsed}mm
                                        </div>
                                        {completingP.map((p, j) => {
                                          const cols = [
                                            G.accent,
                                            G.cyan,
                                            G.purple,
                                            G.green,
                                          ];
                                          const c =
                                            cols[
                                              prodsEf.indexOf(p) % cols.length
                                            ];
                                          const pLbl =
                                            p.label ||
                                            (p.minMm === 0 && p.maxMm >= 9999
                                              ? "Todo"
                                              : p.maxMm >= 9999
                                                ? `≥${fromMm(p.minMm, unit)}${ul}`
                                                : `${fromMm(p.minMm, unit)}–${fromMm(p.maxMm, unit)} ${ul}`);
                                          return (
                                            <div
                                              key={j}
                                              style={{
                                                fontSize: 12,
                                                color: c,
                                                marginBottom: 2,
                                              }}
                                            >
                                              ✓ <strong>{pLbl}</strong> — meta
                                              lograda:{" "}
                                              {(
                                                prodTargets[p.id] || 0
                                              ).toLocaleString()}{" "}
                                              ton
                                            </div>
                                          );
                                        })}
                                      </div>
                                      <div
                                        style={{
                                          textAlign: "right",
                                          flexShrink: 0,
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontFamily: G.fontD,
                                            fontWeight: 700,
                                            fontSize: 22,
                                            color: G.text,
                                          }}
                                        >
                                          {phaseMeses.toFixed(2)} meses
                                        </div>
                                        <div
                                          style={{
                                            fontSize: 10,
                                            color: G.muted,
                                          }}
                                        >
                                          Acumulado: {accMeses.toFixed(2)} meses
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Bloque de optimización */}
                                  {(hasCSSChange || hasTertSugg) && !isLast && (
                                    <div
                                      style={{
                                        background: `${G.accent}0e`,
                                        border: `1px dashed ${G.accent}`,
                                        borderRadius: "0 0 8px 8px",
                                        padding: "10px 14px",
                                        marginBottom: 10,
                                      }}
                                    >
                                      {hasCSSChange && (
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            marginBottom: hasTertSugg ? 8 : 0,
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: 20,
                                              color: G.accent,
                                            }}
                                          >
                                            ↓
                                          </span>
                                          <div
                                            style={{
                                              fontSize: 12,
                                              color: G.text,
                                            }}
                                          >
                                            <strong style={{ color: G.accent }}>
                                              Ajuste recomendado:
                                            </strong>{" "}
                                            Cambiar CSS cono de{" "}
                                            <strong>{ph.cssUsed}mm</strong> →{" "}
                                            <strong style={{ color: G.green }}>
                                              {ph.nextCSS}mm
                                            </strong>
                                            {ph.cssImprovement > 2 && (
                                              <span style={{ color: G.green }}>
                                                {" — "}ahorro ~
                                                {ph.cssImprovement.toFixed(0)}%
                                                en siguiente fase
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      {hasTertSugg && (
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: 20,
                                              color: G.cyan,
                                            }}
                                          >
                                            ✂
                                          </span>
                                          <div
                                            style={{
                                              fontSize: 12,
                                              color: G.text,
                                            }}
                                          >
                                            <strong style={{ color: G.cyan }}>
                                              Eliminar etapa terciaria:
                                            </strong>{" "}
                                            Los productos finos ya alcanzaron su
                                            meta. Retirar VSI/cono terciario
                                            libera capacidad
                                            {ph.removeTertSuggestion
                                              .benefitPct > 2 && (
                                              <span style={{ color: G.cyan }}>
                                                {" — "}mejora estimada: ~
                                                {ph.removeTertSuggestion.benefitPct.toFixed(
                                                  0,
                                                )}
                                                % más rápido en fase siguiente
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {/* Línea final */}
                            <div
                              style={{
                                background: `${G.green}15`,
                                border: `1px solid ${G.green}`,
                                borderRadius: 8,
                                padding: 14,
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 13,
                                  color: G.green,
                                  fontWeight: 600,
                                }}
                              >
                                ✓ Todos los objetivos cumplidos en{" "}
                                {(campaignTotalHours / horasPorMes).toFixed(1)}{" "}
                                meses
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tabla resumen */}
                        <div
                          style={{
                            background: G.card,
                            border: `1px solid ${G.border}`,
                            borderRadius: 8,
                            padding: 14,
                          }}
                        >
                          <SectionTitle>TABLA RESUMEN DE CAMPAÑA</SectionTitle>
                          <div style={{ overflowX: "auto" }}>
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: 12,
                              }}
                            >
                              <thead>
                                <tr
                                  style={{
                                    borderBottom: `1px solid ${G.border}`,
                                  }}
                                >
                                  <th
                                    style={{
                                      color: G.muted,
                                      padding: "5px 8px",
                                      textAlign: "left",
                                      fontSize: 10,
                                    }}
                                  >
                                    FASE
                                  </th>
                                  <th
                                    style={{
                                      color: G.muted,
                                      padding: "5px 8px",
                                      textAlign: "right",
                                      fontSize: 10,
                                    }}
                                  >
                                    CSS
                                  </th>
                                  <th
                                    style={{
                                      color: G.muted,
                                      padding: "5px 8px",
                                      textAlign: "right",
                                      fontSize: 10,
                                    }}
                                  >
                                    DURACIÓN
                                  </th>
                                  <th
                                    style={{
                                      color: G.muted,
                                      padding: "5px 8px",
                                      textAlign: "right",
                                      fontSize: 10,
                                    }}
                                  >
                                    ACUMULADO
                                  </th>
                                  <th
                                    style={{
                                      color: G.muted,
                                      padding: "5px 8px",
                                      textAlign: "left",
                                      fontSize: 10,
                                    }}
                                  >
                                    PRODUCTO COMPLETADO
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {campaignPhases.map((ph) => {
                                  const cpProds = ph.completing
                                    .map((c) =>
                                      prodsEf.find((p) => p.id === c.id),
                                    )
                                    .filter(Boolean);
                                  return (
                                    <tr
                                      key={ph.phaseNum}
                                      style={{
                                        borderBottom: `1px solid ${G.border}22`,
                                      }}
                                    >
                                      <td
                                        style={{
                                          padding: "7px 8px",
                                          color: G.accent,
                                          fontWeight: 600,
                                        }}
                                      >
                                        Fase {ph.phaseNum}
                                      </td>
                                      <td
                                        style={{
                                          padding: "7px 8px",
                                          textAlign: "right",
                                          color: G.text,
                                        }}
                                      >
                                        {ph.cssUsed}mm
                                      </td>
                                      <td
                                        style={{
                                          padding: "7px 8px",
                                          textAlign: "right",
                                          color: G.text,
                                        }}
                                      >
                                        {(ph.phaseHours / horasPorMes).toFixed(
                                          2,
                                        )}{" "}
                                        m
                                      </td>
                                      <td
                                        style={{
                                          padding: "7px 8px",
                                          textAlign: "right",
                                          color: G.green,
                                          fontWeight: 600,
                                        }}
                                      >
                                        {(ph.accHours / horasPorMes).toFixed(2)}{" "}
                                        m
                                      </td>
                                      <td
                                        style={{
                                          padding: "7px 8px",
                                          color: G.muted,
                                          fontSize: 11,
                                        }}
                                      >
                                        {cpProds.map((p, j) => {
                                          const pLbl =
                                            p.label ||
                                            (p.minMm === 0 && p.maxMm >= 9999
                                              ? "Todo"
                                              : `${fromMm(p.minMm, unit)}–${fromMm(p.maxMm, unit)} ${ul}`);
                                          return (
                                            <span key={j}>
                                              {j > 0 ? ", " : ""}
                                              {pLbl}
                                            </span>
                                          );
                                        })}
                                        {ph.nextCSS !== null &&
                                          Math.abs(ph.nextCSS - ph.cssUsed) >
                                            0.1 && (
                                            <span style={{ color: G.accent }}>
                                              {" "}
                                              → CSS {ph.nextCSS}mm
                                            </span>
                                          )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    );
                  })()}
              </>
            )}
          </div>
        )}

        {/* ── TAB COMERCIAL ─────────────────────────────────────────────────── */}
        {tab === "comercial" && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ padding: "10px 14px", background: G.faint, borderRadius: 8, fontSize: 12, color: G.muted, borderLeft: `3px solid ${G.accent}` }}>
              Define las condiciones de la propuesta. Las tres modalidades se calculan en paralelo — no hay que elegir una sola.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>

              {/* ── ARRIENDO ── */}
              <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 10, overflow: "hidden" }}>
                <button onClick={() => setArrOpen(v => !v)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: G.faint, padding: "13px 16px", border: "none", cursor: "pointer" }}>
                  <span style={{ fontFamily: G.fontD, fontWeight: 700, fontSize: 13, color: G.accent }}>ARRIENDO</span>
                  <span style={{ color: G.muted, fontSize: 11 }}>{arrOpen ? "▲" : "▼"}</span>
                </button>
                {arrOpen && (
                  <div style={{ padding: 16, display: "grid", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Unidad</div>
                      <div style={{ display: "flex", gap: 5 }}>
                        {["hora","turno","mes"].map(u => (
                          <button key={u} onClick={() => setArrUnit(u)} style={{ flex:1, padding:"7px 4px", borderRadius:6, cursor:"pointer", border:`1px solid ${arrUnit===u?G.accent:G.border}`, background: arrUnit===u?`${G.accentDim}33`:G.faint, color: arrUnit===u?G.accent:G.muted, fontSize:12, fontFamily:G.font }}>
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Tarifa $ / {arrUnit}</div>
                      <input type="number" min={0} step={1000} value={arrTarifa} onChange={e => setArrTarifa(e.target.value)} placeholder="ej. 25.000" style={{ width: "100%" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Cantidad ({arrUnit}s)</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input type="number" min={0} value={arrCantidad} onChange={e => setArrCantidad(e.target.value)} placeholder={String(arrCantSugerida)} style={{ flex: 1 }} />
                        <button onClick={() => setArrCantidad(String(arrCantSugerida))} style={{ padding:"6px 10px", borderRadius:6, border:`1px solid ${G.border}`, background:G.faint, color:G.muted, cursor:"pointer", fontSize:11, fontFamily:G.font, whiteSpace:"nowrap" }}>
                          ← {arrCantSugerida}
                        </button>
                      </div>
                      <div style={{ fontSize: 10, color: G.muted, marginTop: 3 }}>
                        Sugerido: {horizMes} mes{horizMes>1?"es":""} · {turnosDia} turnos/día · {horasTurno}h
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Mínimo garantizado $ — opcional</div>
                      <input type="number" min={0} value={arrMin} onChange={e => setArrMin(e.target.value)} placeholder="sin mínimo" style={{ width: "100%" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: G.muted, marginBottom: 8 }}>Inclusiones adicionales</div>
                      {[...INCL_LABELS, ...(res.inp.riesgoInchancable ? [{ key: "inchancable", label: "Sistema de protección contra inchancables (detector de metal + separador magnético)" }] : [])].map(({key, label}) => (
                        <div key={key} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:7 }}>
                          <input type="checkbox" checked={arrIncl[key].active} onChange={e => setArrIncl(prev => ({...prev, [key]: {...prev[key], active: e.target.checked}}))} style={{ cursor:"pointer" }} />
                          <span style={{ fontSize:12, color: arrIncl[key].active?G.text:G.muted, flex:1 }}>{label}</span>
                          {arrIncl[key].active && (
                            <input type="number" min={0} value={arrIncl[key].valor} onChange={e => setArrIncl(prev => ({...prev, [key]: {...prev[key], valor: e.target.value}}))} placeholder="$" style={{ width:90 }} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 12, display: "grid", gap: 4 }}>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:12, color:G.muted }}>Subtotal</span>
                        <span style={{ fontSize:12, color:G.text }}>${arrBase.toLocaleString("es-CL")}</span>
                      </div>
                      {arrMinAplica && (
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <span style={{ fontSize:11, color:G.accent }}>Mínimo garantizado aplicado</span>
                          <span style={{ fontSize:11, color:G.accent }}>${arrMinVal.toLocaleString("es-CL")}</span>
                        </div>
                      )}
                      {sumIncl(arrIncl) > 0 && (
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <span style={{ fontSize:11, color:G.muted }}>+ Inclusiones</span>
                          <span style={{ fontSize:11, color:G.text }}>${sumIncl(arrIncl).toLocaleString("es-CL")}</span>
                        </div>
                      )}
                      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                        <span style={{ fontSize:13, color:G.text, fontWeight:600 }}>TOTAL</span>
                        <span style={{ fontSize:18, color:G.green, fontWeight:700 }}>${arrTotal.toLocaleString("es-CL")}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── VENTA ── */}
              <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 10, overflow: "hidden" }}>
                <button onClick={() => setVentaOpen(v => !v)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: G.faint, padding: "13px 16px", border: "none", cursor: "pointer" }}>
                  <span style={{ fontFamily: G.fontD, fontWeight: 700, fontSize: 13, color: G.blue }}>VENTA</span>
                  <span style={{ color: G.muted, fontSize: 11 }}>{ventaOpen ? "▲" : "▼"}</span>
                </button>
                {ventaOpen && (
                  <div style={{ padding: 16, display: "grid", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: G.muted, marginBottom: 8 }}>Precio por equipo del circuito recomendado</div>
                      {circEqs.map(e => (
                        <div key={e.id} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, color: G.muted, marginBottom: 3 }}>
                            {e.label}{e.eq ? ` — ${e.eq.brand} ${e.eq.model}` : ""}
                          </div>
                          <input type="number" min={0} step={1000000} value={ventaPrecios[e.id] ?? ""} onChange={ev => setVentaPrecios(prev => ({...prev, [e.id]: ev.target.value}))} placeholder="$ precio" style={{ width: "100%" }} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Condiciones de financiamiento / garantía</div>
                      <textarea value={ventaCond} onChange={e => setVentaCond(e.target.value)} placeholder="ej. 30% anticipo, saldo en 6 cuotas. Garantía 12 meses piezas." rows={3} style={{ width:"100%", background:G.faint, color:G.text, border:`1px solid ${G.border}`, borderRadius:6, padding:"8px 10px", fontFamily:G.font, fontSize:12, resize:"vertical", boxSizing:"border-box" }} />
                    </div>
                    <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:13, color:G.text, fontWeight:600 }}>TOTAL</span>
                        <span style={{ fontSize:18, color:G.blue, fontWeight:700 }}>${ventaTotal.toLocaleString("es-CL")}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── LLAVE EN MANO ── */}
              <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 10, overflow: "hidden" }}>
                <button onClick={() => setLemOpen(v => !v)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: G.faint, padding: "13px 16px", border: "none", cursor: "pointer" }}>
                  <span style={{ fontFamily: G.fontD, fontWeight: 700, fontSize: 13, color: G.purple }}>LLAVE EN MANO</span>
                  <span style={{ color: G.muted, fontSize: 11 }}>{lemOpen ? "▲" : "▼"}</span>
                </button>
                {lemOpen && (
                  <div style={{ padding: 16, display: "grid", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Unidad de tarifa</div>
                      <div style={{ display: "flex", gap: 5 }}>
                        {["$/ton","$/m³"].map(u => (
                          <button key={u} onClick={() => setLemUnit(u)} style={{ flex:1, padding:"7px 4px", borderRadius:6, cursor:"pointer", border:`1px solid ${lemUnit===u?G.purple:G.border}`, background: lemUnit===u?`${G.purple}22`:G.faint, color: lemUnit===u?G.purple:G.muted, fontSize:12, fontFamily:G.font }}>
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Tarifa ({lemUnit})</div>
                      <input type="number" min={0} step={0.1} value={lemTarifa} onChange={e => setLemTarifa(e.target.value)} placeholder="ej. 4.50" style={{ width: "100%" }} />
                    </div>
                    <div style={{ background: G.faint, borderRadius: 6, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, color: G.muted, marginBottom: 4 }}>Producción estimada del proyecto</div>
                      <div style={{ fontSize: 14, color: G.text, fontWeight: 600 }}>
                        {lemUnit === "$/ton"
                          ? `${lemProdTon.toLocaleString("es-CL")} ton`
                          : `${lemProdM3.toLocaleString("es-CL")} m³`}
                      </div>
                      <div style={{ fontSize: 10, color: G.muted, marginTop: 3 }}>
                        {lemUnit === "$/ton"
                          ? `${tphEfectivo.toFixed(0)} tph ef. × ${Math.round(horasHorizonte).toLocaleString()} h (${horizMes} mes${horizMes>1?"es":""})`
                          : `${lemProdTon.toLocaleString("es-CL")} ton ÷ ${rockDensity} t/m³`}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: G.muted, marginBottom: 8 }}>Inclusiones adicionales</div>
                      {[...INCL_LABELS, ...(res.inp.riesgoInchancable ? [{ key: "inchancable", label: "Sistema de protección contra inchancables (detector de metal + separador magnético)" }] : [])].map(({key, label}) => (
                        <div key={key} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:7 }}>
                          <input type="checkbox" checked={lemIncl[key].active} onChange={e => setLemIncl(prev => ({...prev, [key]: {...prev[key], active: e.target.checked}}))} style={{ cursor:"pointer" }} />
                          <span style={{ fontSize:12, color: lemIncl[key].active?G.text:G.muted, flex:1 }}>{label}</span>
                          {lemIncl[key].active && (
                            <input type="number" min={0} value={lemIncl[key].valor} onChange={e => setLemIncl(prev => ({...prev, [key]: {...prev[key], valor: e.target.value}}))} placeholder="$" style={{ width:90 }} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 12, display: "grid", gap: 4 }}>
                      {lemTarifa && (
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <span style={{ fontSize:11, color:G.muted }}>
                            {lemTarifa} {lemUnit} × {lemProd.toLocaleString("es-CL")} {lemUnit==="$/ton"?"ton":"m³"}
                          </span>
                        </div>
                      )}
                      {sumIncl(lemIncl) > 0 && (
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <span style={{ fontSize:11, color:G.muted }}>+ Inclusiones</span>
                          <span style={{ fontSize:11, color:G.text }}>${sumIncl(lemIncl).toLocaleString("es-CL")}</span>
                        </div>
                      )}
                      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                        <span style={{ fontSize:13, color:G.text, fontWeight:600 }}>TOTAL</span>
                        <span style={{ fontSize:18, color:G.purple, fontWeight:700 }}>${lemTotal.toLocaleString("es-CL")}</span>
                      </div>
                      {/* Tipo de cambio para conversión OPEX USD→CLP — referencia interna */}
                      {res.opex?.total_usd_t && (
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:6 }}>
                          <span style={{ fontSize:10, color:G.muted, whiteSpace:"nowrap" }}>TC USD/CLP</span>
                          <input type="number" min={1} step={10} value={tcUsdClp} onChange={e => setTcUsdClp(Number(e.target.value) || 950)} style={{ width:80, fontSize:11 }} />
                        </div>
                      )}
                      {/* Referencia interna para Marcelo — NO incluir en reporte exportable al cliente */}
                      {opexRefTotal !== null && (
                        <div style={{ marginTop: 6, padding: "8px 10px", background: G.faint, borderRadius: 6, borderLeft: `3px solid ${G.border}` }}>
                          <div style={{ fontSize: 10, color: G.muted }}>
                            (referencia interna) OPEX motor:{" "}
                            <strong style={{ color: G.text }}>${opexRefTotal.toLocaleString("es-CL")}</strong>
                            {" "}· {res.opex.total_usd_t} USD/t × {lemProdTon.toLocaleString("es-CL")} ton × {tcUsdClp} TC
                          </div>
                          {lemTotal > 0 && opexRefTotal > 0 && (
                            <div style={{ fontSize: 10, color: lemTotal > opexRefTotal ? G.green : G.red, marginTop: 3 }}>
                              Margen bruto estimado: ${(lemTotal - opexRefTotal).toLocaleString("es-CL")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── APP ────────────────────────────────────────────────────────────────────
export default function App() {
  const [res, setRes] = useState(null);
  const [unit, setUnit] = useState("mm");
  const [currentInp, setCurrentInp] = useState(null);
  const [editStep, setEditStep] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState(null);

  // Catálogo de equipos remoto (Supabase vía backend). Fallback: EQ_LOCAL.
  const [eqCatalog, setEqCatalog] = useState(EQ_LOCAL);
  useEffect(() => {
    fetch(`${API_BASE}/equipment`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.equipment && typeof data.equipment === "object") {
          setEqCatalog(data.equipment);
        }
      })
      .catch(() => {});
  }, []);

  // Alias para usar el catálogo en JSX y funciones dentro del componente
  const EQ = eqCatalog;
  const EQ_BY_CAT = {
    jaw:      EQ.jaw,
    cone:     EQ.cone,
    hsi:      EQ.hsi,
    screen3d: EQ.screen.filter((e) => e.decks === 3),
    screen2d: EQ.screen.filter((e) => e.decks === 2),
    screen1d: EQ.screen_1d,
    screen_hf: EQ.screen_hf,
  };

  // Historial en localStorage — máx 50 simulaciones
  const [savedSims, setSavedSims] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("krushrock_sims") || "[]");
    } catch {
      return [];
    }
  });

  const saveSim = (cliente, proyecto, notas) => {
    if (!res) return;
    const entry = {
      id: Date.now().toString(),
      fecha: new Date().toISOString(),
      cliente,
      proyecto,
      notas,
      // resumen para mostrar en historial
      rockName: res.rock.name,
      tph: res.inp.tph,
      score: Number(res.final.score),
      errPct: res.errPct,
      p80: res.final.p80,
      p80T: res.p80T,
      circActual: res.circActual,
      plazoMeses: res.inp.plazoMeses || 1,
      // datos completos para referencia
      inp: res.inp,
      primary: res.primary,
      secondary: res.secondary,
      tertiary: res.tertiary,
      screening: res.screening,
      final: res.final,
      products: res.products,
      bottlenecks: res.bottlenecks,
      errColor: res.errColor,
      needsT: res.needsT,
      feedOk: res.feedOk,
      recommendedMesh: res.recommendedMesh,
      recommendedDecks: res.recommendedDecks,
    };
    const updated = [entry, ...savedSims].slice(0, 50);
    setSavedSims(updated);
    try {
      localStorage.setItem("krushrock_sims", JSON.stringify(updated));
    } catch {}
  };

  const deleteSim = (id) => {
    const updated = savedSims.filter((s) => s.id !== id);
    setSavedSims(updated);
    try {
      localStorage.setItem("krushrock_sims", JSON.stringify(updated));
    } catch {}
  };

  const handleDone = async (inp) => {
    setUnit(inp.unit || "mm");
    setCurrentInp(inp);
    setSimLoading(true);
    setSimError(null);
    try {
      const result = await runSimulation({ ...inp, eqCatalog });
      setRes(result);
    } catch (err) {
      setSimError(err.message);
    } finally {
      setSimLoading(false);
    }
    setEditStep(null);
  };

  const handleEdit = (step) => {
    if (!res) return;
    setCurrentInp(res.inp);
    setEditStep(step);
  };

  const handleCancelEdit = () => setEditStep(null);

  const handleReset = () => {
    setRes(null);
    setCurrentInp(null);
    setEditStep(null);
    setUnit("mm");
  };

  if (editStep !== null)
    return (
      <Onboarding
        onDone={handleDone}
        initialInp={currentInp}
        initialStep={editStep}
        cancelEdit={handleCancelEdit}
        eqCatalog={eqCatalog}
      />
    );

  if (simLoading)
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        minHeight:"100vh",background:G.bg,color:G.text,gap:16,fontFamily:G.font}}>
        <div style={{fontSize:32,fontWeight:700,color:G.accent}}>KrushRock</div>
        <div style={{fontSize:15,color:G.muted}}>Calculando curvas granulometricas...</div>
        <div style={{width:200,height:4,background:G.border,borderRadius:2,overflow:"hidden"}}>
          <div style={{width:"60%",height:4,background:G.accent,borderRadius:2,
            animation:"flowDash 1s linear infinite"}}/>
        </div>
      </div>
    );

  if (simError)
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        minHeight:"100vh",background:G.bg,color:G.text,gap:20,fontFamily:G.font,padding:32}}>
        <div style={{fontSize:32,fontWeight:700,color:G.accent}}>KrushRock</div>
        <div style={{background:"#1a0a0a",border:`1px solid ${G.red}`,borderRadius:12,
          padding:28,maxWidth:520,width:"100%",display:"grid",gap:14}}>
          <div style={{fontSize:18,fontWeight:700,color:G.red}}>Error al simular</div>
          <div style={{fontSize:13,color:G.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{simError}</div>
          <button
            onClick={() => { setSimError(null); }}
            style={{marginTop:8,padding:"10px 24px",background:G.accent,color:"#000",
              border:"none",borderRadius:6,fontWeight:700,fontSize:14,cursor:"pointer"}}>
            Volver e intentar de nuevo
          </button>
        </div>
      </div>
    );

  if (!res)
    return (
      <Onboarding
        onDone={handleDone}
        savedSims={savedSims}
        onDeleteSim={deleteSim}
        initialInp={currentInp}
        eqCatalog={eqCatalog}
      />
    );
  return (
    <Results
      res={res}
      unit={unit}
      onReset={handleReset}
      onEdit={handleEdit}
      onSave={saveSim}
      eqCatalog={eqCatalog}
    />
  );
}
