import { useState } from "react";

const G = {
  bg:"#0a0e1a", surface:"#111827", card:"#1a2235", card2:"#141e30",
  border:"#2a3550", accent:"#f59e0b", accentDim:"#92400e",
  green:"#10b981", red:"#ef4444", redDim:"#7f1d1d",
  blue:"#3b82f6", purple:"#8b5cf6", cyan:"#06b6d4",
  text:"#e2e8f0", muted:"#64748b", faint:"#1e2d45",
  font:"'DM Mono','Fira Mono',monospace", fontD:"'Syne',sans-serif",
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
  huevillo_fino:   {wi:10.5,ab:0.18,den:2.55,rrN:0.92,name:"Huevillo fino (< 50mm)",      desc:"Wi ≈ 10.5 | Canto rodado, áridos construcción"},
  huevillo_grueso: {wi:12.0,ab:0.22,den:2.65,rrN:0.88,name:"Huevillo grueso (50–200mm)",  desc:"Wi ≈ 12.0 | Rodado, mezcla mineralógica"},
  grava_aluvial:   {wi:11.0,ab:0.15,den:2.50,rrN:0.95,name:"Grava aluvial mixta",          desc:"Wi ≈ 11.0 | Alto % finos naturales, humedad frecuente"},
  bolones_rio:     {wi:13.5,ab:0.28,den:2.70,rrN:0.85,name:"Bolones de río (> 200mm)",    desc:"Wi ≈ 13.5 | Requiere scalper o mandíbula grande"},
  andesita:   {wi:16.0,ab:0.32,den:2.65,rrN:0.78,name:"Andesita",              desc:"Wi ≈ 16.0 | Abrasión media-alta"},
  granito:    {wi:15.5,ab:0.28,den:2.70,rrN:0.80,name:"Granito",               desc:"Wi ≈ 15.5 | Abrasión media"},
  basalto:    {wi:17.0,ab:0.35,den:2.90,rrN:0.75,name:"Basalto",               desc:"Wi ≈ 17.0 | Abrasión alta"},
  diorita:    {wi:15.0,ab:0.30,den:2.80,rrN:0.79,name:"Diorita",               desc:"Wi ≈ 15.0 | Abrasión media"},
  gabro:      {wi:13.0,ab:0.25,den:2.95,rrN:0.81,name:"Gabro",                 desc:"Wi ≈ 13.0 | Abrasión media"},
  caliza:     {wi:11.2,ab:0.12,den:2.60,rrN:1.05,name:"Caliza",                desc:"Wi ≈ 11.2 | Baja abrasión"},
  arenisca:   {wi: 9.5,ab:0.08,den:2.30,rrN:1.15,name:"Arenisca",              desc:"Wi ≈ 9.5  | Muy baja abrasión"},
  dolomita:   {wi:11.5,ab:0.14,den:2.85,rrN:1.02,name:"Dolomita",              desc:"Wi ≈ 11.5 | Baja abrasión"},
  cuarcita:   {wi:19.5,ab:0.45,den:2.65,rrN:0.70,name:"Cuarcita",              desc:"Wi ≈ 19.5 | Muy alta abrasión"},
  porfido:    {wi:16.0,ab:0.30,den:2.72,rrN:0.82,name:"Pórfido cuprífero",     desc:"Wi ≈ 16.0 | Abrasión media"},
  cobre_ox:   {wi:10.5,ab:0.15,den:2.50,rrN:0.95,name:"Mineral oxidado cobre", desc:"Wi ≈ 10.5 | Baja abrasión"},
  magnetita:  {wi:10.0,ab:0.20,den:4.90,rrN:0.88,name:"Magnetita",             desc:"Wi ≈ 10.0 | Alta densidad"},
  hematita:   {wi:12.5,ab:0.25,den:4.80,rrN:0.85,name:"Hematita",              desc:"Wi ≈ 12.5 | Alta densidad"},
  oro_cuarzo: {wi:15.0,ab:0.40,den:2.80,rrN:0.77,name:"Oro en cuarzo",         desc:"Wi ≈ 15.0 | Abrasión alta"},
  caliche:    {wi: 7.0,ab:0.05,den:2.10,rrN:1.20,name:"Caliche",               desc:"Wi ≈ 7.0  | Muy blanda"},
  desconocida:{wi:13.0,ab:0.20,den:2.70,rrN:0.85,name:"Roca desconocida",      desc:"Valores promedio estimados"},
};

const ROCK_CATS = {
  aridos:      ["huevillo_fino","huevillo_grueso","grava_aluvial","bolones_rio"],
  mineria:     ["porfido","cobre_ox","magnetita","oro_cuarzo"],
  roca_dura:   ["andesita","granito","basalto","cuarcita"],
  roca_blanda: ["caliza","caliche","arenisca","dolomita"],
};

// ── CATÁLOGO DE EQUIPOS ────────────────────────────────────────────────────
const EQ = {
  jaw:[
    {brand:"Terex Finlay",  model:"J-960",              palanca:"doble", rpm:320, feedMm:580,  cssR:[40,140], capR:[80, 200], notes:"Compacta, orugas"},
    {brand:"Terex Finlay",  model:"J-1160",             palanca:"doble", rpm:300, feedMm:780,  cssR:[45,160], capR:[150,280], notes:"Orugas, C9.3 ACERT"},
    {brand:"Terex Finlay",  model:"J-1175",             palanca:"doble", rpm:290, feedMm:790,  cssR:[50,175], capR:[200,350], notes:"Orugas, C13 ACERT"},
    {brand:"Terex Finlay",  model:"J-1280",             palanca:"doble", rpm:270, feedMm:1070, cssR:[75,175], capR:[250,400], notes:"Orugas, alta capacidad"},
    {brand:"Terex Finlay",  model:"J-1480",             palanca:"simple",rpm:250, feedMm:1400, cssR:[100,200],capR:[400,600], notes:"Orugas, gran formato"},
    {brand:"Powerscreen",   model:"Premiertrak 600",    palanca:"doble", rpm:310, feedMm:600,  cssR:[40,150], capR:[100,220], notes:"Compacta, orugas"},
    {brand:"Powerscreen",   model:"Premiertrak 1180",   palanca:"doble", rpm:275, feedMm:1070, cssR:[75,175], capR:[200,400], notes:"Accionamiento directo"},
    {brand:"Powerscreen",   model:"Premiertrak 1300",   palanca:"simple",rpm:260, feedMm:1100, cssR:[75,175], capR:[250,450], notes:"Alta capacidad"},
    {brand:"Kleemann",      model:"MC 100 Ri EVO",      palanca:"doble", rpm:305, feedMm:760,  cssR:[50,150], capR:[150,280], notes:"Diesel-eléctrico"},
    {brand:"Kleemann",      model:"MC 110 Ri EVO",      palanca:"doble", rpm:290, feedMm:950,  cssR:[60,160], capR:[200,380], notes:"Diesel-eléctrico"},
    {brand:"Kleemann",      model:"MC 120 Zi EVO",      palanca:"simple",rpm:265, feedMm:1200, cssR:[80,180], capR:[300,500], notes:"Diesel-eléctrico"},
    {brand:"Sandvik",       model:"UJ310",              palanca:"doble", rpm:300, feedMm:820,  cssR:[50,160], capR:[150,280], notes:"Orugas"},
    {brand:"Sandvik",       model:"UJ440i",             palanca:"simple",rpm:265, feedMm:1100, cssR:[65,200], capR:[200,450], notes:"Radio remoto incluido"},
    {brand:"Metso Outotec", model:"LT106",              palanca:"doble", rpm:290, feedMm:900,  cssR:[55,160], capR:[150,300], notes:"Orugas sobre chasis"},
    {brand:"Metso Outotec", model:"LT120",              palanca:"doble", rpm:275, feedMm:1100, cssR:[65,180], capR:[200,400], notes:"Orugas, alta producción"},
    {brand:"Metso Outotec", model:"LT130E",             palanca:"simple",rpm:255, feedMm:1200, cssR:[75,200], capR:[250,500], notes:"Eléctrico, gran capacidad"},
    {brand:"Astec",         model:"GT125",              palanca:"doble", rpm:310, feedMm:760,  cssR:[45,150], capR:[120,250], notes:"Orugas, compacta"},
    {brand:"Astec",         model:"GT165",              palanca:"doble", rpm:285, feedMm:1050, cssR:[65,175], capR:[200,380], notes:"Orugas, estándar"},
  ],
  cone:[
    {brand:"Terex Finlay",  model:"C-1540",       rpm:280, feedMm:215,  cssR:[10,44],  capR:[150,300], notes:"Cono secundario estándar"},
    {brand:"Terex Finlay",  model:"C-1545",       rpm:285, feedMm:240,  cssR:[10,48],  capR:[160,320], notes:"Cono alta eficiencia"},
    {brand:"Terex Finlay",  model:"C-1550",       rpm:290, feedMm:280,  cssR:[10,50],  capR:[180,370], notes:"Alta capacidad, orugas"},
    {brand:"Terex Finlay",  model:"C-1554",       rpm:295, feedMm:280,  cssR:[8,50],   capR:[200,400], notes:"Recorrido largo, alto rendimiento"},
    {brand:"Powerscreen",   model:"Maxtrak 1000", rpm:300, feedMm:130,  cssR:[8,38],   capR:[80, 200], notes:"Compacto, orugas"},
    {brand:"Powerscreen",   model:"Maxtrak 1150", rpm:285, feedMm:185,  cssR:[10,44],  capR:[130,280], notes:"Autónomo sobre orugas"},
    {brand:"Powerscreen",   model:"Maxtrak 1300", rpm:278, feedMm:220,  cssR:[10,48],  capR:[180,380], notes:"Alta capacidad"},
    {brand:"Sandvik",       model:"QH331",        rpm:310, feedMm:185,  cssR:[6,38],   capR:[100,240], notes:"CH430 Hydrocone"},
    {brand:"Sandvik",       model:"QH332",        rpm:310, feedMm:185,  cssR:[6,38],   capR:[120,260], notes:"CH430 Hydrocone"},
    {brand:"Sandvik",       model:"QH441",        rpm:290, feedMm:275,  cssR:[8,45],   capR:[180,400], notes:"CH660 Hydrocone"},
    {brand:"Kleemann",      model:"MCO 9i S EVO", rpm:315, feedMm:150,  cssR:[8,32],   capR:[90, 200], notes:"Diesel-eléctrico Tier 4"},
    {brand:"Kleemann",      model:"MCO 11i EVO",  rpm:298, feedMm:185,  cssR:[8,44],   capR:[130,300], notes:"Diesel-eléctrico"},
    {brand:"Kleemann",      model:"MCO 13i EVO",  rpm:285, feedMm:225,  cssR:[10,48],  capR:[180,400], notes:""},
    {brand:"Metso Outotec", model:"LT200HPS",     rpm:280, feedMm:215,  cssR:[8,44],   capR:[140,300], notes:"Orugas, cono HP"},
    {brand:"Metso Outotec", model:"LT300HPS",     rpm:270, feedMm:270,  cssR:[10,50],  capR:[200,450], notes:"Orugas, gran capacidad"},
    {brand:"Astec",         model:"GT440",        rpm:290, feedMm:190,  cssR:[8,44],   capR:[130,280], notes:"Orugas"},
    {brand:"Astec",         model:"GT550",        rpm:278, feedMm:230,  cssR:[10,50],  capR:[180,380], notes:"Orugas, alta capacidad"},
  ],
  hsi:[
    {brand:"Terex Finlay",  model:"I-110RS",            feedMm:750,  capR:[130,250], notes:"Primario/secundario, orugas"},
    {brand:"Terex Finlay",  model:"I-120RS",            feedMm:850,  capR:[160,300], notes:"Con seleccionadora integrada"},
    {brand:"Terex Finlay",  model:"I-140RS",            feedMm:900,  capR:[250,400], notes:"Alta capacidad, orugas"},
    {brand:"Terex Finlay",  model:"I-1312RS",           feedMm:1100, capR:[300,500], notes:"Primario, roca blanda-media"},
    {brand:"Powerscreen",   model:"Trakpactor 260",     feedMm:800,  capR:[150,280], notes:"Orugas"},
    {brand:"Powerscreen",   model:"Trakpactor 320",     feedMm:900,  capR:[200,350], notes:"Orugas"},
    {brand:"Powerscreen",   model:"Trakpactor 550SR",   feedMm:1100, capR:[300,500], notes:"Con seleccionadora integrada"},
    {brand:"Kleemann",      model:"MR 110i EVO2",       feedMm:1100, capR:[200,380], notes:"Diesel-eléctrico"},
    {brand:"Kleemann",      model:"MR 130i EVO2",       feedMm:1300, capR:[300,500], notes:"Diesel-eléctrico"},
    {brand:"Metso Outotec", model:"LT1213S",            feedMm:1000, capR:[200,400], notes:"Con seleccionadora integrada"},
    {brand:"Metso Outotec", model:"LT1415",             feedMm:1100, capR:[250,450], notes:""},
    {brand:"Sandvik",       model:"QI341",              feedMm:850,  capR:[160,300], notes:"HSI primario/secundario"},
    {brand:"Sandvik",       model:"QI442",              feedMm:1000, capR:[250,450], notes:"HSI alta capacidad"},
    {brand:"Astec",         model:"GT2310",             feedMm:900,  capR:[150,300], notes:"Orugas"},
    {brand:"Astec",         model:"GT4250",             feedMm:1100, capR:[250,450], notes:"Orugas"},
  ],
  screen:[
    {brand:"Terex Finlay",  model:"683",                decks:2, capR:[100,250], notes:"2 deck — versátil, orugas"},
    {brand:"Terex Finlay",  model:"684 2-deck",         decks:2, capR:[120,280], notes:"2 deck — alta producción"},
    {brand:"Terex Finlay",  model:"684 3-deck",         decks:3, capR:[150,300], notes:"3 deck — alta clasificación"},
    {brand:"Terex Finlay",  model:"694+",               decks:3, capR:[150,350], notes:"3 deck — orugas, 3 fracciones"},
    {brand:"Terex Finlay",  model:"696 3-deck",         decks:3, capR:[180,400], notes:"3 deck — gran capacidad"},
    {brand:"Powerscreen",   model:"Warrior 1800",       decks:2, capR:[100,280], notes:"2 deck"},
    {brand:"Powerscreen",   model:"Chieftain 1700",     decks:2, capR:[120,300], notes:"2 deck — fácil cambio de mallas"},
    {brand:"Powerscreen",   model:"Chieftain 2100X",    decks:3, capR:[150,380], notes:"3 deck — alta capacidad"},
    {brand:"Kleemann",      model:"MS 703i",            decks:2, capR:[100,250], notes:"2 deck — eléctrico, compacto"},
    {brand:"Kleemann",      model:"MS 953i EVO",        decks:3, capR:[150,350], notes:"3 deck — diesel-eléctrico"},
    {brand:"Sandvik",       model:"QA330",              decks:2, capR:[120,280], notes:"2 deck"},
    {brand:"Sandvik",       model:"QA335",              decks:3, capR:[150,300], notes:"3 deck — plantas áridos"},
    {brand:"Metso Outotec", model:"ST2.4",              decks:2, capR:[100,250], notes:"2 deck"},
    {brand:"Metso Outotec", model:"ST3.5",              decks:3, capR:[150,350], notes:"3 deck"},
    {brand:"Astec",         model:"M6x20-3D",           decks:3, capR:[150,300], notes:"3 deck"},
  ],
  screen_1d:[
    {brand:"Terex Finlay",  model:"Rinser 873",         decks:1, capR:[80, 200], notes:"1 deck lavado/descascarado"},
    {brand:"Powerscreen",   model:"Warrior 600",        decks:1, capR:[60, 150], notes:"1 deck, compacta"},
    {brand:"Kleemann",      model:"MS 402i",            decks:1, capR:[70, 180], notes:"1 deck eléctrico"},
    {brand:"Metso Outotec", model:"ST1.5",              decks:1, capR:[80, 180], notes:"1 deck"},
    {brand:"Sandvik",       model:"QA141",              decks:1, capR:[80, 200], notes:"1 deck"},
  ],
  screen_hf:[
    {brand:"Terex Finlay",  model:"883 HF",             decks:2, capR:[80, 200], notes:"Alta frecuencia 2 deck, finos"},
    {brand:"Terex Finlay",  model:"884 HF",             decks:2, capR:[100,240], notes:"Alta frecuencia 2 deck"},
    {brand:"Powerscreen",   model:"Warrior 2100",       decks:2, capR:[100,250], notes:"Alta frecuencia, fino seco"},
    {brand:"Kleemann",      model:"MOBISCREEN HF",      decks:2, capR:[80, 200], notes:"Alta frecuencia"},
    {brand:"Metso Outotec", model:"SF Series HF",       decks:2, capR:[90, 220], notes:"Alta frecuencia"},
  ],
};

const EQ_BY_CAT = {
  jaw:       EQ.jaw,
  cone:      EQ.cone,
  hsi:       EQ.hsi,
  screen3d:  EQ.screen.filter(e=>e.decks===3),
  screen2d:  EQ.screen.filter(e=>e.decks===2),
  screen1d:  EQ.screen_1d,
  screen_hf: EQ.screen_hf,
};

const CAT_LABELS = {
  jaw:"Mandíbula", cone:"Cono", hsi:"HSI",
  screen3d:"Selec. 3D", screen2d:"Selec. 2D",
  screen1d:"Selec. 1D", screen_hf:"Selec. AF",
};

// ── UNIDADES ───────────────────────────────────────────────────────────────
function toMm(val, u) {
  const n = parseFloat(String(val).replace(",",".").trim());
  if (isNaN(n)) return 0;
  if (u==="cm") return Math.round(n*10);
  if (u==="in") return Math.round(n*25.4);
  return Math.round(n);
}
function fromMm(mm, u) {
  if (mm<=0) return "0";
  if (mm>=9999) return "∞";
  if (u==="cm") return (mm/10).toFixed(1);
  if (u==="in") return (mm/25.4).toFixed(2);
  return mm.toFixed(0);
}
function unitLabel(u) { return u==="cm"?"cm":u==="in"?'"':"mm"; }

function validateFeedUnit(value, unit) {
  const n = Number(String(value).replace(",", "."));
  if (Number.isNaN(n) || n <= 0) return null;
  const mm = unit === "in" ? n * 25.4 : unit === "cm" ? n * 10 : n;
  const suggestion = unit === "in"
    ? `${Math.round(mm)} mm`
    : unit === "cm"
    ? `${Math.round(mm)} mm`
    : `${(n / 25.4).toFixed(1)} in`;

  if (unit === "in") {
    if (n >= 8) {
      return {level:"red", message:`Valor sospechoso: ${n}" parece demasiado alto para F80 en chancado primario. Si ingresaste mm por error, usa ${suggestion} o cambia la unidad a mm.`};
    }
    if (n <= 1.5) {
      return {level:"yellow", message:`Valor muy bajo para pulgadas: ${n}". Verifica si la unidad correcta debería ser mm o cm.`};
    }
  }
  if (unit === "cm") {
    if (n >= 25) {
      return {level:"red", message:`Valor sospechoso: ${n} cm parece demasiado alto para F80 en chancado primario. Si ingresaste mm por error, usa ${suggestion} o cambia la unidad a mm.`};
    }
    if (n <= 5) {
      return {level:"yellow", message:`Valor muy bajo para centímetros: ${n} cm. Verifica si la unidad correcta debería ser mm o pulgadas.`};
    }
  }
  if (unit === "mm") {
    if (n >= 1200) {
      return {level:"red", message:`Valor sospechoso: ${n} mm es muy alto para F80 en chancado primario. Si ingresaste cm por error, usa ${suggestion} o cambia la unidad a cm.`};
    }
    if (n <= 40) {
      return {level:"yellow", message:`Valor muy bajo para milímetros: ${n} mm. Verifica si la unidad correcta debería ser cm o pulgadas.`};
    }
  }
  return null;
}

// ── ROSIN-RAMMLER — FITTING DESDE MÚLTIPLES PUNTOS ────────────────────────
// Recibe [{x:mm, p:porcentaje_pasante}], devuelve {n, d63} o null
function fitRR(points) {
  const valid = points.filter(pt => pt.x>0.5 && pt.p>0.5 && pt.p<99.5);
  if (valid.length < 2) return null;
  const pts = valid.map(pt => ({X:Math.log(pt.x), Y:Math.log(-Math.log(1-pt.p/100))}));
  const N=pts.length;
  const sX=pts.reduce((s,p)=>s+p.X,0), sY=pts.reduce((s,p)=>s+p.Y,0);
  const sXX=pts.reduce((s,p)=>s+p.X*p.X,0), sXY=pts.reduce((s,p)=>s+p.X*p.Y,0);
  const D=N*sXX-sX*sX;
  if (Math.abs(D)<1e-10) return null;
  const n=(N*sXY-sX*sY)/D;
  const b=(sY-n*sX)/N;
  const d63=Math.exp(-b/Math.max(n,0.01));
  return {n:Math.max(0.3,Math.min(4.0,n)), d63:Math.max(0.1,d63)};
}

// ── MOTOR DE SIMULACIÓN ────────────────────────────────────────────────────

function jawFactor(palanca, wi, humN, rpm) {
  const F_base = palanca === "simple" ? 1.90 : 1.68;
  const k_wi   = 1 + (wi - 13) * 0.012;
  const k_hum  = 1 - humN * 0.025;
  const k_rpm  = 1 - (rpm - 280) * 0.0006;
  return Math.max(1.40, Math.min(2.20, F_base * k_wi * k_hum * k_rpm));
}

function coneFactor(perfil, wi, rpm) {
  const bases = { EF:1.40, F:1.52, M:1.62, C:1.75, EC:1.90 };
  const F_base = bases[perfil] || 1.62;
  const k_wi   = 1 + (wi - 13) * 0.010;
  const k_rpm  = 1 - (rpm - 285) * 0.0005;
  return Math.max(1.25, Math.min(2.10, F_base * k_wi * k_rpm));
}

function karraEff(aperturaM, p80Feed, humN, deck, rrN, d63) {
  const pct_pass = Math.min(0.98, 1 - Math.exp(-Math.pow(aperturaM / d63, rrN)));
  const pct_hi   = Math.min(0.98, 1 - Math.exp(-Math.pow(aperturaM * 1.25 / d63, rrN)));
  const pct_lo   = Math.min(0.98, 1 - Math.exp(-Math.pow(aperturaM * 0.75 / d63, rrN)));
  const near_pct = (pct_hi - pct_lo) / Math.max(pct_pass, 0.01);
  const k_near = Math.max(0.60, 1 - near_pct * 0.55);
  const k_hum  = humN === 0 ? 1.0 : humN === 1 ? 0.90 : humN === 2 ? 0.78 : 0.65;
  const k_deck = deck === 1 ? 1.0 : 0.90;
  const E_base = Math.min(0.97, 0.75 + pct_pass * 0.22);
  return Math.max(0.50, Math.min(0.97, E_base * k_near * k_hum * k_deck));
}

function simulate(inp) {
  const {rockKey,customName,customWi,customDen,customAb,tph,f80,products,humidity,circPath,
         manualEq,manModel,altitude,altitudeOmit,curveType,f50,curvePoints} = inp;

  let rock = {...(ROCK_DB[rockKey]||ROCK_DB.desconocida)};
  if (rockKey==="personalizada"){
    rock.wi=Number(customWi)||13; rock.den=Number(customDen)||2.70; rock.ab=Number(customAb)||0.20;
    rock.name=customName||"Material personalizado";
  }

  const actP  = products.filter(p=>p.active);
  const fineTargets = actP
    .filter((p) => p.maxMm > 0 && p.maxMm < 9999)
    .map((p) => p.maxMm);
  const p80T  = fineTargets.length>0?Math.min(...fineTargets,f80):f80;
  const humN  = (humidity===null||humidity==="unknown")?0:Number(humidity);
  const altM  = altitudeOmit?0:(Number(altitude)||0);
  // Corrección altitud: -1% cada 100m sobre 1500m, mínimo 60%
  const altC  = altM>1500?Math.max(0.60,1-(altM-1500)*0.0001):1.0;

  // ─── ETAPAS (cálculo inverso desde P80 objetivo) ──────────────────────
  const jawModel   = manModel?.jaw || "";
  const coneModel  = manModel?.cone || "";
  const jawEq      = jawModel ? EQ.jaw.find(e=>e.model===jawModel) : null;
  const coneEq     = coneModel ? EQ.cone.find(e=>e.model===coneModel) : null;
  const jaw_palanca = jawEq?.palanca || "doble";
  const jaw_rpm    = jawEq?.rpm || (f80 > 800 ? 255 : f80 > 600 ? 275 : 300);
  const cone_rpm   = coneEq?.rpm || 285;
  const cone_perfil = inp.conePerfil || "M";

  const F_JAW_DYN  = jawFactor(jaw_palanca, rock.wi, humN, jaw_rpm);
  const F_CONE_DYN = coneFactor(cone_perfil, rock.wi, cone_rpm);
  const F_VSI_DYN  = coneFactor("EF", rock.wi, 310);

  const needsT = p80T < 18;
  let cssT=0, p80Tert=0, eT=0;
  if (needsT){ cssT=Math.max(5,Math.min(20,p80T/F_VSI_DYN)); p80Tert=cssT*F_VSI_DYN; }
  const secTgt  = needsT ? cssT*3.8 : p80T;
  const cssS    = Math.max(10, Math.min(55, secTgt/F_CONE_DYN));
  const p80Sec  = cssS*F_CONE_DYN;
  const cssP    = Math.max(50, Math.min(185, (cssS*4.0)/F_JAW_DYN));
  const p80Prim = cssP*F_JAW_DYN;
  const feedOk  = f80 <= cssP*3.2;

  // ─── ENERGÍA Bond (fórmula correcta en µm) ────────────────────────────
  const sq = x => Math.sqrt(Math.max(x, 0.01));
  const toUm = mm => mm * 1000;
  const ePrim = Math.max(0, 10*rock.wi*(1/sq(toUm(p80Prim))-1/sq(toUm(f80))))/altC;
  const eSec  = Math.max(0, 10*rock.wi*(1/sq(toUm(p80Sec))-1/sq(toUm(p80Prim))))/altC;
  if (needsT) eT = Math.max(0, 10*rock.wi*(1/sq(toUm(p80Tert))-1/sq(toUm(p80Sec))))/altC;
  const ePerT=ePrim+eSec+eT, eTotKw=ePerT*tph;

  // ─── SELECCIONADORA (modelo Karra) ─────────────────────────────────────
  const hasScreen = manualEq && (manualEq.screen3d||manualEq.screen2d||manualEq.screen1d||manualEq.screen_hf);
  const isOpen    = circPath==="manual"&&!hasScreen;
  const p80Pre    = needsT ? p80Tert : p80Sec;
  const autoMesh  = Math.round(p80T * 0.90);
  const md        = inp.meshDecks || {};
  const meshMm    = (md[1] > 0) ? md[1] : autoMesh;
  const mesh2     = (md[2] > 0) ? md[2] : Math.round(meshMm * 0.60);
  const nDecks    = inp.screenDecks || 1;
  const rrNmat    = rock.rrN || 0.85;
  const d63_pre   = p80Pre / Math.pow(-Math.log(0.20), 1/rrNmat);
  const eff1      = karraEff(meshMm, p80Pre, humN, 1, rrNmat, d63_pre);
  const eff2      = nDecks >= 2 ? karraEff(mesh2, p80Pre, humN, 2, rrNmat, d63_pre) : 1.0;
  const eff       = isOpen ? 1.0 : Math.min(eff1, nDecks >= 2 ? eff2 : eff1);
  const fracOver  = isOpen ? 0 : Math.max(0, 1-Math.min(0.98,1-Math.exp(-Math.pow(meshMm/d63_pre,rrNmat))));
  const over      = isOpen ? 0 : tph * fracOver * (1-eff);
  const ccLoad    = (over/Math.max(tph,1))*100;
  const p80F      = isOpen ? p80Pre : p80Pre*(eff>0.88?0.88:eff>0.80?0.91:0.95);

  // ─── DISTRIBUCIÓN ROSIN-RAMMLER ────────────────────────────────────────
  let rrN = rock.rrN || 0.85, d63=null;
  if (curveType==="full" && curvePoints?.length>0){
    const vp=curvePoints.filter(p=>p.sizeMm>0).map(p=>({x:p.sizeMm,p:p.pct}));
    const fit=fitRR(vp);
    if(fit){rrN=fit.n; d63=fit.d63;}
  } else if(curveType==="partial"&&f50>0&&f80>f50){
    rrN=Math.max(0.5,Math.min(2.0,Math.log(Math.log(5)/Math.log(2))/Math.log(f80/f50)));
  }
  if(!d63) d63=p80F/Math.pow(-Math.log(0.20),1/rrN);
  const pPass=sz=>sz>=9999?100:Math.min(100,100*(1-Math.exp(-Math.pow(sz/d63,rrN))));
  const prodsOut=actP.map(p=>{
    const hi=pPass(p.maxMm), lo=p.minMm>0?pPass(p.minMm):0;
    const y=Math.max(0,hi-lo);
    return {...p,yldPct:y.toFixed(1),tphOut:(tph*y/100).toFixed(0)};
  });
  const totalProdTph = prodsOut.reduce((s,p)=>s+Number(p.tphOut),0);
  const productionFactor = Math.max(0,Math.min(1, totalProdTph / Math.max(1, tph)));

  // ─── BOTTLENECKS ───────────────────────────────────────────────────────
  const bots=[];
  if(!feedOk) bots.push(`F80 (${f80}mm) puede exceder apertura efectiva del chancador primario`);
  if(totalProdTph < 1 && actP.length>0) bots.push("No hay producción de las fracciones definidas. Revisa rangos de producto, unidad F80 y topología del circuito.");
  if(ccLoad>35) bots.push(`Carga circulante alta (${ccLoad.toFixed(1)}%) — revisar mallas o agregar etapa`);
  if(Math.abs(p80F-p80T)>p80T*0.15) bots.push(`P80 final difiere >15% del objetivo — ajustar CSS`);
  if(humN>=2&&!isOpen) bots.push("Humedad afecta eficiencia de seleccionadora");
  if(altM>3000) bots.push(`Altitud ${altM}m: motores al ${(altC*100).toFixed(0)}% de potencia nominal`);
  if(["huevillo_fino","huevillo_grueso","grava_aluvial","bolones_rio"].includes(rockKey)&&!inp.manualEq?.hsi)
    bots.push("Material redondeado de río: considerar HSI en lugar de mandíbula para mejor cubicidad");

  // ─── ERROR ESTIMADO ─────────────────────────────────────────────────────
  let errPct=22;
  if(curveType==="partial") errPct=12;
  if(curveType==="full"){
    const nPts=(curvePoints||[]).filter(p=>p.sizeMm>0).length;
    errPct=nPts>=6?4:nPts>=4?6:nPts>=2?9:14;
  }
  if(rockKey==="desconocida") errPct+=8;
  if(rockKey==="personalizada") errPct+=3;
  if(humidity==="unknown") errPct+=4;
  if(altM>3500) errPct+=3;
  if(!inp.conePerfil||inp.conePerfil==="M") errPct+=3;
  if(!(inp.meshDecks?.[1]>0)) errPct+=4;
  if((inp.screenDecks||1)>=2) errPct-=2;
  errPct=Math.min(errPct,32);
  const errColor=errPct<=7?G.green:errPct<=14?G.accent:G.red;

  // ─── SCORE ─────────────────────────────────────────────────────────────
  const gap=Math.abs(p80F-p80T)/Math.max(p80T,1);
  const rawScore = 100-ccLoad*0.7-gap*55-rock.ab*14-(needsT?4:0)-(!feedOk?10:0);
  const score=Math.max(0,Math.min(100, Math.round(rawScore * productionFactor)));

  // ─── CIRCUITO EFECTIVO ─────────────────────────────────────────────────
  let circActual="cerrado";
  if(circPath==="ai"){
    circActual=humN>=2?"con_scalper":actP.length>=3?"cerrado_doble":"cerrado";
  } else if(circPath==="manual"){
    circActual=manualEq?.screen3d?"cerrado_doble":hasScreen?"cerrado":"abierto";
  }

  // ─── RECOMENDACIÓN DE EQUIPOS ──────────────────────────────────────────
  const jawRec   =EQ.jaw.filter(e=>cssP>=e.cssR[0]&&cssP<=e.cssR[1]&&tph<=e.capR[1]).slice(0,3);
  const coneRec  =EQ.cone.filter(e=>cssS>=e.cssR[0]&&cssS<=e.cssR[1]).slice(0,3);
  const is3d     =actP.length>=3||needsT;
  const screenSrc=is3d?EQ.screen.filter(e=>e.decks===3):EQ.screen.filter(e=>e.decks===2);
  const screenRec=screenSrc.filter(e=>tph<=e.capR[1]).slice(0,3);
  const hsiRec   =EQ.hsi.filter(e=>tph<=e.capR[1]).slice(0,3);
  const eqRec={
    jaw:  jawRec.length?jawRec:EQ.jaw.slice(0,2),
    cone: coneRec.length?coneRec:EQ.cone.slice(0,2),
    screen:screenRec.length?screenRec:screenSrc.slice(0,2),
    hsi:  hsiRec.length?hsiRec:EQ.hsi.slice(0,2),
    is3d,
  };

  const recommendedDecks = actP.length>=3?3:actP.length>=2?2:1;
  const recommendedMesh  = {deck1:autoMesh, deck2:Math.round(autoMesh*0.60), deck3:Math.round(autoMesh*0.36)};

  return {
    rock,inp,p80T,needsT,circActual,feedOk,altC,altM,errPct,errColor,eqRec,
    jawPalanca:jaw_palanca, jawRpm:jaw_rpm, coneRpm:cone_rpm, conePerfil:cone_perfil, meshMm,
    recommendedDecks, recommendedMesh,
    primary:  {css:cssP.toFixed(0),p80:p80Prim.toFixed(0),energy:ePrim.toFixed(2)},
    secondary:{css:cssS.toFixed(0),p80:p80Sec.toFixed(0), energy:eSec.toFixed(2)},
    tertiary: needsT?{css:cssT.toFixed(0),p80:p80Tert.toFixed(0),energy:eT.toFixed(2)}:null,
    screening:{eff:(eff*100).toFixed(1),over:over.toFixed(1),ccLoad:ccLoad.toFixed(1)},
    final:    {p80:p80F.toFixed(1),ePerT:ePerT.toFixed(2),eTot:eTotKw.toFixed(0),score:score.toFixed(0)},
    products: prodsOut, bottlenecks:bots,
    totalProductTph: totalProdTph.toFixed(1), productionFactor: productionFactor.toFixed(2),
  };
}

// ── ANÁLISIS POR REGLAS ────────────────────────────────────────────────────
function buildAnalysis(r){
  const score=Number(r.final.score), cc=Number(r.screening.ccLoad);
  const totalProdTph = Number(r.totalProductTph||0);
  const p80f=Number(r.final.p80), gap=Math.abs(p80f-r.p80T)/Math.max(r.p80T,1)*100;
  const humN=(r.inp.humidity===null||r.inp.humidity==="unknown")?0:Number(r.inp.humidity);
  const altM=r.altM;

  const diag=score>=78
    ? `Circuito con rendimiento **óptimo** (índice ${score}/100). Diseño que cumple P80 objetivo con carga circulante aceptable.`
    : score>=58
    ? `Circuito **funcional** (índice ${score}/100). Hay margen de optimización en CSS y configuración de clasificación.`
    : `Circuito con **limitaciones técnicas** (índice ${score}/100). Se requieren ajustes antes de seleccionar equipos definitivos.`;

  const obs=[];
  if(!r.feedOk) obs.push(`● **Advertencia de feedabilidad**: F80 (${r.inp.f80}mm) puede superar la apertura efectiva del chancador primario. Considerar gape mayor o scalper previo.`);
  if(r.rock.wi>16) obs.push(`● **Roca dura** (Wi=${r.rock.wi}): consumo energético y desgaste elevados. Programar reemplazo de liners cada 600–800 h.`);
  else if(r.rock.wi<10) obs.push(`● **Roca blanda** (Wi=${r.rock.wi}): capacidad efectiva mayor a la nominal. Verificar que tonelaje no supere equipos.`);
  if(r.rock.ab>0.35) obs.push(`● **Abrasividad alta** (${r.rock.ab}): usar mantos y mandíbulas de alto cromo. Intervalo de desgaste reducido.`);
  if(totalProdTph < 1) obs.push(`● Producción final cero: las fracciones definidas no extraen material útil. Revisa los rangos de producto, la unidad F80 y la configuración del circuito.`);
  if(cc>30) obs.push(`● Carga circulante **${cc}%** supera límite recomendado (25%). Evaluar mayor apertura de mallas.`);
  if(gap>15) obs.push(`● P80 circuito (${p80f}mm) difiere **${gap.toFixed(0)}%** del objetivo (${r.p80T}mm). Ajustar CSS del cono${r.needsT?" y terciario":""}.`);
  if(humN>=2) obs.push(`● Humedad ${humN>=3?"alta":"media"}: eficiencia de seleccionadora reducida. Evaluar scalper o material seco.`);
  if(altM>2000) obs.push(`● Altitud ${altM}m: motores a ${(r.altC*100).toFixed(0)}% de potencia nominal. Dimensionar con motor sobredimensionado.`);
  if(obs.length===0) obs.push("● Sin observaciones críticas. Parámetros dentro de rangos normales de operación.");

  const recs=[];
  if(r.circActual==="con_scalper")
    recs.push(`→ Scalper recomendado por humedad: reduce finos pegajosos antes del primario.`);
  else if(r.circActual==="cerrado_doble")
    recs.push(`→ Doble deck para ${r.inp.products?.filter(p=>p.active).length||2} fracciones simultáneas. Dimensionar para ${(Number(r.inp.tph)+Number(r.screening.over)).toFixed(0)} tph totales.`);
  else if(r.circActual!=="abierto")
    recs.push(`→ Circuito cerrado: seleccionadora debe manejar ${(Number(r.inp.tph)+Number(r.screening.over)).toFixed(0)} tph (alimentación + retorno).`);
  if(r.inp.rockKey==="desconocida")
    recs.push(`→ **Roca no identificada**: obtener Wi Bond en laboratorio. Error estimado actual: ±${r.errPct}%.`);
  if(Number(r.inp.tph)>350)
    recs.push(`→ Tonelaje alto: considerar layout paralelo o equipos de mayor capacidad.`);
  if(r.rock.den>3.5)
    recs.push(`→ Alta densidad (${r.rock.den} t/m³): verificar capacidad volumétrica de correas y estructura.`);

  const variant=cc>30
    ? "Variante sugerida: scalper antes del primario para reducir carga circulante."
    : r.needsT
    ? "Variante sugerida: cono/VSI terciario mejora cubicidad del producto fino."
    : score>=75?"Configuración técnicamente adecuada para los requerimientos indicados."
    :"Revisar CSS de etapas para acercarse al P80 objetivo.";

  return {diag,obs:obs.slice(0,4),recs:recs.slice(0,3),variant};
}

// ── MÓDULO CAMPAÑA — funciones auxiliares ─────────────────────────────────

function calcYieldsForCSS(cssMm, products, rrN, FCONE) {
  const p80 = cssMm * FCONE;
  const d63 = p80 / Math.pow(-Math.log(0.20), 1 / Math.max(rrN, 0.1));
  return products.map(p => {
    const pP = x => x >= 9999 ? 100 : 100*(1-Math.exp(-Math.pow(Math.max(x,0.01)/d63, rrN)));
    const hi = pP(p.maxMm), lo = p.minMm > 0 ? pP(p.minMm) : 0;
    return {...p, yldPct: Math.max(0, hi-lo).toFixed(1)};
  });
}

function computeCampaign(allProds, targets, tphNom, factorEf, cssInit, rrN, FCONE, needsT, p80TertVal) {
  if (!tphNom || !factorEf) return [];
  let rem = {};
  allProds.forEach(p => { rem[p.id] = Number(targets[p.id]) > 0 ? Number(targets[p.id]) : 0; });
  if (!Object.values(rem).some(v => v > 0.5)) return [];

  const phases = [];
  let accHours = 0;
  let currentCSS = Number(cssInit);
  const CSS_MIN = 8, CSS_MAX = 55;

  for (let iter = 0; iter < 12; iter++) {
    const activeProds = allProds.filter(p => rem[p.id] > 0.5);
    if (activeProds.length === 0) break;

    const curYields = calcYieldsForCSS(currentCSS, allProds, rrN, FCONE);
    const rates = activeProds.map(p => {
      const yld = Number(curYields.find(y => y.id === p.id)?.yldPct || 0);
      const rate = tphNom * factorEf * yld / 100;
      return {...p, rate, yld, horas: rate > 0.01 ? rem[p.id] / rate : Infinity};
    });

    const valid = rates.filter(r => isFinite(r.horas) && r.horas > 0);
    if (valid.length === 0) break;
    valid.sort((a, b) => a.horas - b.horas);

    const phaseHours = valid[0].horas;
    const completing = valid.filter(r => r.horas <= phaseHours * 1.001)
      .map(r => ({id: r.id, minMm: r.minMm, maxMm: r.maxMm, label: r.label}));

    rates.forEach(r => { if (isFinite(r.rate)) rem[r.id] = Math.max(0, rem[r.id] - r.rate * phaseHours); });
    accHours += phaseHours;

    const nextActive = allProds.filter(p => rem[p.id] > 0.5);
    let nextCSS = currentCSS, optMaxTime = Infinity, baseMaxTime = 0;

    if (nextActive.length > 0) {
      const baseY = calcYieldsForCSS(currentCSS, allProds, rrN, FCONE);
      nextActive.forEach(p => {
        const yld = Number(baseY.find(y => y.id === p.id)?.yldPct || 0);
        const rate = tphNom * factorEf * yld / 100;
        if (rate > 0.01) baseMaxTime = Math.max(baseMaxTime, rem[p.id] / rate);
        else baseMaxTime = Infinity;
      });

      for (let delta = -20; delta <= 20; delta += 5) {
        const testCSS = Math.max(CSS_MIN, Math.min(CSS_MAX, currentCSS + delta));
        const testY = calcYieldsForCSS(testCSS, allProds, rrN, FCONE);
        let maxT = 0, ok = true;
        nextActive.forEach(p => {
          const yld = Number(testY.find(y => y.id === p.id)?.yldPct || 0);
          const rate = tphNom * factorEf * yld / 100;
          if (rate > 0.01) maxT = Math.max(maxT, rem[p.id] / rate);
          else ok = false;
        });
        if (ok && maxT < optMaxTime) { optMaxTime = maxT; nextCSS = testCSS; }
      }
    }

    const cssImp = baseMaxTime > 0 && isFinite(baseMaxTime) && isFinite(optMaxTime)
      ? Math.max(0, (baseMaxTime - optMaxTime) / baseMaxTime * 100) : 0;

    // Sugerencia de eliminar etapa terciaria
    let removeTertSuggestion = null;
    if (needsT && p80TertVal > 0 && nextActive.length > 0) {
      const fineProds = allProds.filter(p => p.maxMm <= p80TertVal * 1.1);
      const allFineCompleted = fineProds.length > 0 && fineProds.every(p => rem[p.id] <= 0.5);
      if (allFineCompleted) {
        const noTertY = calcYieldsForCSS(nextCSS, allProds, rrN, FCONE);
        let noTertMaxT = 0;
        nextActive.forEach(p => {
          const yld = Number(noTertY.find(y => y.id === p.id)?.yldPct || 0);
          const rate = tphNom * factorEf * yld / 100;
          if (rate > 0.01) noTertMaxT = Math.max(noTertMaxT, rem[p.id] / rate);
        });
        const tBenefit = isFinite(optMaxTime) ? Math.max(0,(optMaxTime-noTertMaxT)/Math.max(optMaxTime,1)*100) : 0;
        removeTertSuggestion = {benefitPct: tBenefit, horasSaving: Math.max(0, optMaxTime - noTertMaxT)};
      }
    }

    phases.push({
      phaseNum: phases.length + 1, phaseHours, accHours, completing,
      cssUsed: currentCSS,
      nextCSS: nextActive.length > 0 ? nextCSS : null,
      cssImprovement: cssImp,
      removeTertSuggestion,
    });

    if (nextActive.length > 0) currentCSS = nextCSS;
  }
  return phases;
}

function campaignUnoptTime(allProds, targets, tphNom, factorEf, cssInit, rrN, FCONE) {
  let rem = {};
  allProds.forEach(p => { rem[p.id] = Number(targets[p.id]) > 0 ? Number(targets[p.id]) : 0; });
  if (!Object.values(rem).some(v => v > 0.5)) return 0;
  const curY = calcYieldsForCSS(Number(cssInit), allProds, rrN, FCONE);
  let accHours = 0;
  for (let iter = 0; iter < 12; iter++) {
    const active = allProds.filter(p => rem[p.id] > 0.5);
    if (active.length === 0) break;
    const rates = active.map(p => {
      const yld = Number(curY.find(y => y.id === p.id)?.yldPct || 0);
      const rate = tphNom * factorEf * yld / 100;
      return {id: p.id, rate, horas: rate > 0.01 ? rem[p.id] / rate : Infinity};
    }).filter(r => isFinite(r.horas) && r.horas > 0);
    if (rates.length === 0) break;
    const minH = Math.min(...rates.map(r => r.horas));
    rates.forEach(r => { rem[r.id] = Math.max(0, rem[r.id] - r.rate * minH); });
    accHours += minH;
  }
  return accHours;
}

// ── COMPONENTES BASE ───────────────────────────────────────────────────────
function Badge({color,children}){
  const c={amber:{bg:"#78350f",tx:"#fcd34d",bd:"#92400e"},green:{bg:"#064e3b",tx:"#6ee7b7",bd:"#065f46"},
    red:{bg:"#7f1d1d",tx:"#fca5a5",bd:"#991b1b"},blue:{bg:"#1e3a5f",tx:"#93c5fd",bd:"#1d4ed8"},
    gray:{bg:"#1f2937",tx:"#9ca3af",bd:"#374151"}}[color]||{bg:"#1f2937",tx:"#9ca3af",bd:"#374151"};
  return <span style={{background:c.bg,color:c.tx,border:`1px solid ${c.bd}`,padding:"2px 10px",borderRadius:4,fontSize:11,fontFamily:G.font,letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{children}</span>;
}

function Kpi({label,value,unit,sub,color,icon}){
  return (
    <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:color||G.accent}}/>
      <div style={{fontSize:10,color:G.muted,letterSpacing:"0.08em",marginBottom:4}}>{icon} {label}</div>
      <div style={{fontSize:25,fontFamily:G.fontD,fontWeight:700,color:color||G.accent,lineHeight:1}}>
        {value}<span style={{fontSize:12,color:G.muted,marginLeft:4}}>{unit}</span>
      </div>
      {sub&&<div style={{fontSize:10,color:G.muted,marginTop:3}}>{sub}</div>}
    </div>
  );
}

function SectionTitle({children}){
  return <div style={{fontSize:10,color:G.accent,letterSpacing:"0.1em",marginBottom:11,fontFamily:G.font,borderLeft:`3px solid ${G.accent}`,paddingLeft:8}}>◈ {children}</div>;
}

function B({t}){
  const html=String(t).replace(/\*\*(.*?)\*\*/g,`<strong style="color:${G.accent}">$1</strong>`);
  return <span dangerouslySetInnerHTML={{__html:html}}/>;
}

// ── DIAGRAMA ───────────────────────────────────────────────────────────────
function Diagram({r,unit}){
  const {circActual,primary:pr,secondary:sc,tertiary:te,screening:sr,final:fi,inp,needsT}=r;
  const W=needsT?820:690;
  const ns={rx:6,fill:G.card,stroke:G.border,strokeWidth:1.5};
  const ts={fill:G.text,fontSize:10,fontFamily:G.font,textAnchor:"middle"};
  const ss={fill:G.muted,fontSize:8.5,fontFamily:G.font,textAnchor:"middle"};
  const fl={stroke:G.accent,strokeWidth:1.5,fill:"none",strokeDasharray:"5 3"};
  const sl={stroke:G.accent,strokeWidth:1.5,fill:"none"};
  const u=unit||"mm", ul=unitLabel(u);
  const sz=mm=>fromMm(Number(mm),u)+ul;
  const cn={abierto:"CIRCUITO ABIERTO",cerrado:"CIRCUITO CERRADO",cerrado_doble:"DOBLE DECK",con_scalper:"CON SCALPER",ai:"RECOMENDADO IA"}[circActual]||"CIRCUITO";
  const xF=8,xJ=115,xC=245,xC2=needsT?375:null,xS=needsT?505:375,xPr=xS+95;

  return (
    <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:8,padding:16,overflowX:"auto"}}>
      <div style={{fontSize:10,color:G.muted,marginBottom:12,letterSpacing:"0.08em"}}>◈ DIAGRAMA — {cn}</div>
      <svg width="100%" viewBox={`0 0 ${W} 290`} style={{minWidth:Math.min(W,440)}}>
        <defs>
          <marker id="ar" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3z" fill={G.accent}/></marker>
          <marker id="ag" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3z" fill={G.green}/></marker>
        </defs>
        <rect x={xF} y={108} width={90} height={52} {...ns} stroke={G.green}/>
        <text x={xF+45} y={126} {...ts} fill={G.green}>ALIMENT.</text>
        <text x={xF+45} y={138} {...ss}>F80 {sz(inp.f80)}</text>
        <text x={xF+45} y={149} {...ss}>{inp.tph} tph</text>
        <line x1={xF+90} y1={134} x2={xJ} y2={134} {...fl} className="flow" markerEnd="url(#ar)"/>
        <rect x={xJ} y={96} width={95} height={75} {...ns} stroke={G.accent}/>
        <text x={xJ+47} y={114} {...ts} fill={G.accent}>MANDÍBULA</text>
        <text x={xJ+47} y={126} {...ss}>CSS {sz(pr.css)}</text>
        <text x={xJ+47} y={137} {...ss}>P80: {sz(pr.p80)}</text>
        <text x={xJ+47} y={148} {...ss}>⚡{pr.energy} kWh/t</text>
        <line x1={xJ+95} y1={134} x2={xC} y2={134} {...fl} className="flow" markerEnd="url(#ar)"/>
        <rect x={xC} y={96} width={95} height={75} {...ns} stroke={G.purple}/>
        <text x={xC+47} y={114} {...ts} fill={G.purple}>CONO</text>
        <text x={xC+47} y={126} {...ss}>CSS {sz(sc.css)}</text>
        <text x={xC+47} y={137} {...ss}>P80: {sz(sc.p80)}</text>
        <text x={xC+47} y={148} {...ss}>⚡{sc.energy} kWh/t</text>
        {needsT?(
          <>
            <line x1={xC+95} y1={134} x2={xC2} y2={134} {...fl} className="flow" markerEnd="url(#ar)"/>
            <rect x={xC2} y={96} width={95} height={75} {...ns} stroke={G.cyan}/>
            <text x={xC2+47} y={114} {...ts} fill={G.cyan}>CONO / VSI</text>
            <text x={xC2+47} y={126} {...ss}>CSS {sz(te.css)}</text>
            <text x={xC2+47} y={137} {...ss}>P80: {sz(te.p80)}</text>
            <text x={xC2+47} y={148} {...ss}>⚡{te.energy} kWh/t</text>
            <line x1={xC2+95} y1={134} x2={xS} y2={134} {...fl} className="flow" markerEnd="url(#ar)"/>
          </>
        ):(
          <line x1={xC+95} y1={134} x2={xS} y2={134} {...fl} className="flow" markerEnd="url(#ar)"/>
        )}
        <rect x={xS} y={96} width={95} height={75} {...ns} stroke={G.green}/>
        <text x={xS+47} y={114} {...ts} fill={G.green}>SELECT.</text>
        <text x={xS+47} y={125} {...ss}>{circActual==="cerrado_doble"?"Doble deck":"Simple"}</text>
        <text x={xS+47} y={136} {...ss}>Efic. {sr.eff}%</text>
        <text x={xS+47} y={147} {...ss}>CC: {sr.ccLoad}%</text>
        <line x1={xS+95} y1={120} x2={xPr} y2={120} {...sl} markerEnd="url(#ag)"/>
        <rect x={xPr} y={108} width={14} height={26} fill={G.green} rx={3}/>
        <text x={xPr+7} y={146} {...ss} fill={G.green}>P80</text>
        <text x={xPr+7} y={156} {...ss} fill={G.green}>{sz(fi.p80)}</text>
        {circActual!=="abierto"&&(()=>{
          const xT=needsT?xC2+47:xC+47;
          return (<>
            <line x1={xS+47} y1={171} x2={xS+47} y2={232} {...sl}/>
            <line x1={xS+47} y1={232} x2={xT}     y2={232} {...sl}/>
            <line x1={xT}    y1={232} x2={xT}     y2={171} {...sl} markerEnd="url(#ar)"/>
            <text x={(xS+47+xT)/2} y={248} {...ss} fill={G.muted}>↺ retorno {sr.over} tph</text>
          </>);
        })()}
      </svg>
      <div style={{fontSize:10,color:G.muted,marginTop:10,padding:"8px 12px",background:G.faint,borderRadius:6,borderLeft:`3px solid ${G.border}`}}>
        Nota técnica: P80 del producto es mayor que el CSS porque el CSS es la apertura mínima del equipo, pero el producto tiene distribución de tamaños. Para mandíbulas P80 ≈ CSS × 1.75 y para conos P80 ≈ CSS × 1.60 — esto es correcto y esperado.
      </div>
    </div>
  );
}

// ── PRODUCTOS DEFAULT — sin etiquetas predefinidas ─────────────────────────
const DEF_PRODS=[
  {id:1,active:true, label:"", minMm:76.2, maxMm:9999, targetTon:0},
  {id:2,active:true, label:"", minMm:50.8, maxMm:76.2, targetTon:0},
  {id:3,active:true, label:"", minMm:25.4, maxMm:50.8, targetTon:0},
  {id:4,active:true, label:"", minMm:0,    maxMm:25.4, targetTon:0},
];

// ── CURVA GRANULOMÉTRICA — 11 puntos ──────────────────────────────────────
const CURVE_LEVELS=[
  {label:"F80",pct:80},{label:"F70",pct:70},{label:"F60",pct:60},
  {label:"F50",pct:50},{label:"F40",pct:40},{label:"F30",pct:30},
  {label:"F20",pct:20},{label:"F10",pct:10},{label:"F5", pct:5},
  {label:"F3", pct:3}, {label:"F2", pct:2},
];

// ── ONBOARDING ─────────────────────────────────────────────────────────────
function Onboarding({onDone, onReplay, savedSims=[], onDeleteSim}){
  const [step,setStep]       = useState(0);
  const [unit,setUnit]       = useState("mm");
  const [rockKey,setRockKey] = useState("");
  const [rockCat,setRockCat] = useState(null);
  const [cName,setCName]     = useState("");
  const [cWi,setCWi]         = useState(13);
  const [cDen,setCDen]       = useState(2.7);
  const [cAb,setCAb]         = useState(0.20);
  const [f80,setF80]         = useState(400);
  const [prods,setProds]     = useState(DEF_PRODS);
  const [humidity,setHum]    = useState(null);
  const [altitude,setAlt]    = useState(0);
  const [altitudeOmit,setAltOmit] = useState(false);
  const [curveType,setCurve] = useState("f80only");
  const [f50,setF50]         = useState(200);
  const [curvePoints,setCurvePoints] = useState(
    CURVE_LEVELS.map(l=>({...l,sizeMm:0}))
  );
  const [conePerfil,setConePerfil]     = useState("M");
  const [sugPerfil,setSugPerfil]       = useState(null);
  const [plazoMeses,setPlazoMeses]     = useState(1);
  const [started,setStarted]           = useState(false);
  const [circPath,setCircPath]= useState(null);
  const [manualEq,setManualEq]= useState({jaw:true,cone:true,hsi:false,screen3d:false,screen2d:true,screen1d:false,screen_hf:false,scalper:false,recirculation:true});
  const [manBrand,setManBrand]= useState({jaw:"",cone:"",hsi:"",screen3d:"",screen2d:"",screen1d:"",screen_hf:"",scalper:""});
  const [manModel,setManModel]= useState({jaw:"",cone:"",hsi:"",screen3d:"",screen2d:"",screen1d:"",screen_hf:"",scalper:""});
  const [availEquip,setAvail] = useState([{id:1,type:"jaw",brand:"",model:""}]);

  const TOTAL=5;
  const pct=(step/TOTAL)*100;
  const next=()=>setStep(s=>Math.min(s+1,TOTAL-1));
  const back=()=>setStep(s=>Math.max(s-1,0));
  const ul=unitLabel(unit);
  const disp=mm=>fromMm(mm,unit);
  const toMmU=v=>toMm(v,unit);
  const feedUnitAlert = validateFeedUnit(fromMm(f80,unit), unit);

  const upProd=(id,field,raw)=>{
    if(field==="label"){setProds(ps=>ps.map(p=>p.id===id?{...p,label:raw}:p));return;}
    if(field==="targetTon"){setProds(ps=>ps.map(p=>p.id===id?{...p,targetTon:Math.max(0,Number(raw)||0)}:p));return;}
    const v=raw==="∞"?9999:toMm(raw,unit);
    setProds(ps=>ps.map(p=>p.id===id?{...p,[field]:v}:p));
  };
  const togProd=id=>setProds(ps=>ps.map(p=>p.id===id?{...p,active:!p.active}:p));

  const updCurvePoint=(label,raw)=>{
    const sizeMm=toMmU(raw);
    setCurvePoints(pts=>pts.map(p=>p.label===label?{...p,sizeMm}:p));
  };

  const PBtn=({label,onClick,disabled})=>(
    <button disabled={disabled} onClick={onClick} style={{padding:"11px 24px",borderRadius:8,cursor:disabled?"not-allowed":"pointer",
      background:disabled?G.border:G.accent,border:"none",fontFamily:G.fontD,fontWeight:700,fontSize:14,color:"#000",opacity:disabled?0.5:1}}>
      {label}
    </button>
  );
  const SBtn=({label,onClick})=>(
    <button onClick={onClick} style={{padding:"11px 18px",borderRadius:8,cursor:"pointer",
      background:"transparent",border:`1px solid ${G.border}`,fontFamily:G.font,fontSize:13,color:G.muted}}>
      {label}
    </button>
  );
  const QBubble=({q,hint})=>(
    <div style={{display:"flex",gap:12,marginBottom:20}}>
      <div style={{width:38,height:38,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${G.accent},#d97706)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>◈</div>
      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:"4px 12px 12px 12px",padding:"13px 16px",flex:1}}>
        <div style={{fontFamily:G.fontD,fontWeight:600,fontSize:15,color:G.accent,marginBottom:4}}>{q}</div>
        <div style={{fontSize:12,color:G.muted}}>{hint}</div>
      </div>
    </div>
  );
  const OptBtn=({val,label,sub,active,color,onClick})=>(
    <button onClick={onClick} style={{background:active?`${G.accentDim}33`:G.card,
      border:`1px solid ${active?(color||G.accent):G.border}`,borderRadius:8,
      padding:"12px 16px",cursor:"pointer",textAlign:"left",display:"flex",
      justifyContent:"space-between",alignItems:"center",width:"100%",transition:"all .15s"}}>
      <div>
        <div style={{fontSize:14,color:active?(color||G.accent):G.text}}>{label}</div>
        {sub&&<div style={{fontSize:11,color:G.muted,marginTop:2}}>{sub}</div>}
      </div>
      {active&&<span style={{color:color||G.accent}}>✓</span>}
    </button>
  );

  const finish=()=>{
    let ef80=f80;
    if(curveType==="full"){
      const pt=curvePoints.find(p=>p.label==="F80");
      if(pt&&pt.sizeMm>0) ef80=pt.sizeMm;
    }
    // Derive TPH from product ton targets (8h × 2turnos × 5días × 4.33sem × 80% × 85% ≈ 236h/mes efectivas)
    const totalTargetTon=prods.filter(p=>p.active).reduce((s,p)=>s+(Number(p.targetTon)||0),0);
    const effHrsPerMonth=8*2*5*4.33*0.80*0.85;
    const derivedTph=totalTargetTon>0
      ? Math.max(10,Math.min(1000,Math.round(totalTargetTon/(plazoMeses*effHrsPerMonth))))
      : 200;
    const activeProds=prods.filter(p=>p.active);
    const recDecks=activeProds.length>=3?3:activeProds.length>=2?2:1;
    onDone({rockKey,customName:cName,customWi:cWi,customDen:cDen,customAb:cAb,
      tph:derivedTph,tphOmit:totalTargetTon===0,f80:ef80,products:prods,humidity,altitude,altitudeOmit,curveType,f50,curvePoints,
      unit,circPath,manualEq,manBrand,manModel,availEquip,conePerfil,meshDecks:{1:0,2:0,3:0},screenDecks:recDecks,plazoMeses,
      circuit:circPath==="ai"?"ai":"cerrado"});
  };

  const QUES=["¿Qué tipo de roca o mineral vas a procesar?","¿Cuentas con la curva granulométrica de ingreso?","¿Qué productos necesitas obtener?","Condiciones de operación","¿Cómo configuras el circuito?"];
  const HINTS=["Determina el índice de trabajo (Wi) y abrasividad","Mientras más datos ingreses, menor será el error estimado","Define fracciones y tonelaje objetivo — el TPH se calculará automáticamente","Altitud y humedad afectan el rendimiento real de equipos","3 opciones: IA automática, selección manual o equipos disponibles"];

  const rockEntries=[...Object.entries(ROCK_DB),["personalizada",{name:"Material personalizado",desc:"Ingreso manual de Wi y densidad"}]];
  const actP=prods.filter(p=>p.active);
  const p80Prev=Math.min(...actP.filter(p=>p.maxMm<9999).map(p=>p.maxMm),9999);
  const totalTargetTonPreview=actP.reduce((s,p)=>s+(Number(p.targetTon)||0),0);
  const derivedTphPreview=totalTargetTonPreview>0
    ? Math.max(10,Math.min(1000,Math.round(totalTargetTonPreview/(plazoMeses*8*2*5*4.33*0.80*0.85))))
    : null;
  const suggestConePerfil=()=>{
    const wi=rockKey==="personalizada"?(Number(cWi)||13):(ROCK_DB[rockKey]?.wi||13);
    const finest=p80Prev<9999?p80Prev:50;
    const profiles=["EF","F","M","C","EC"];
    let idx=finest<=20?0:finest<=32?1:finest<=50?2:finest<=80?3:4;
    if(wi>16) idx=Math.min(4,idx+1);
    else if(wi<10) idx=Math.max(0,idx-1);
    setConePerfil(profiles[idx]);
    setSugPerfil(profiles[idx]);
  };

  const ConePerfil = ({conePerfil, setConePerfil, sugPerfil, setSugPerfil, suggestConePerfil}) => (<>
    <div style={{fontSize:11,color:G.muted,marginBottom:6}}>Perfil de manto del cono (afecta la relación P80/CSS)</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:8}}>
      {[{v:"EF",l:"EF",s:"Extra fino"},{v:"F",l:"F",s:"Fino"},{v:"M",l:"M",s:"Medio"},{v:"C",l:"C",s:"Grueso"},{v:"EC",l:"EC",s:"Extra grueso"}].map(o=>(
        <OptBtn key={o.v} val={o.v} label={o.l} sub={o.s} active={conePerfil===o.v} onClick={()=>{setConePerfil(o.v);setSugPerfil(null);}}/>
      ))}
    </div>
    <button onClick={suggestConePerfil} style={{background:`${G.accentDim}22`,border:`1px dashed ${G.accent}`,
      borderRadius:6,padding:"7px 14px",cursor:"pointer",fontSize:12,color:G.accent,fontFamily:G.font,width:"100%"}}>
      ◈ Sugerir perfil automáticamente según mis productos
    </button>
    {sugPerfil&&(
      <div style={{fontSize:11,color:G.green,marginTop:6}}>
        ✓ Perfil <strong>{sugPerfil}</strong> sugerido — P80 más fino objetivo: {p80Prev<9999?p80Prev+"mm":"no definido"} · Wi: {ROCK_DB[rockKey]?.wi||cWi||13} kWh/t
      </div>
    )}
  </>);

  const validCurvePts=(curvePoints||[]).filter(p=>p.sizeMm>0).length;

  if(!started){
    return (
      <div style={{minHeight:"100vh",background:G.bg,display:"flex",flexDirection:"column"}}>
        <style>{GCSS}</style>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${G.border}`,background:G.surface,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:8,background:`linear-gradient(135deg,${G.accent},#d97706)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:G.fontD,fontWeight:800,fontSize:15,color:"#000"}}>KR</div>
          <div>
            <div style={{fontFamily:G.fontD,fontWeight:700,fontSize:16,color:G.accent}}>KrushRock</div>
            <div style={{fontSize:10,color:G.muted,letterSpacing:"0.1em"}}>SIMULADOR DE CHANCADO Y SELECCIÓN</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:11,color:G.muted,marginRight:4}}>Unidad:</span>
            {["mm","cm","in"].map(u=>(
              <button key={u} onClick={()=>setUnit(u)} style={{padding:"4px 11px",borderRadius:5,cursor:"pointer",fontFamily:G.font,fontSize:12,
                border:`1px solid ${unit===u?G.accent:G.border}`,background:unit===u?`${G.accentDim}44`:G.card,color:unit===u?G.accent:G.muted}}>
                {u==="in"?'"':u}
              </button>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px"}}>
          <div style={{maxWidth:560,width:"100%"}} className="fi">
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{fontFamily:G.fontD,fontWeight:800,fontSize:42,color:G.accent,letterSpacing:"-0.02em",marginBottom:6}}>KrushRock</div>
              <div style={{fontSize:13,color:G.muted,letterSpacing:"0.08em",marginBottom:12}}>SIMULADOR DE PLANTAS DE CHANCADO MÓVIL</div>
              <div style={{fontSize:13,color:G.text,lineHeight:1.7,maxWidth:420,margin:"0 auto"}}>Motor de simulación Bond + Whiten + OPEX. Ingresa los parámetros de tu material y operación — el sistema calcula el circuito óptimo.</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:28}}>
              {[
                {n:"01",label:"Tipo de roca",    sub:"Wi Bond · abrasividad · densidad",    color:G.accent},
                {n:"02",label:"Curva granulom.", sub:"F80 · distribución de tamaños",       color:G.blue},
                {n:"03",label:"Productos",        sub:"Fracciones · tonelaje objetivo",      color:G.purple},
                {n:"04",label:"Condiciones",      sub:"Altitud · humedad",                   color:G.cyan},
                {n:"05",label:"Circuito",         sub:"Equipos · topología · marca",         color:G.green},
              ].map(item=>(
                <div key={item.n} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:"12px 14px"}}>
                  <div style={{fontSize:10,color:item.color,letterSpacing:"0.1em",marginBottom:4}}>{item.n}</div>
                  <div style={{fontSize:13,color:G.text,fontWeight:600,marginBottom:2}}>{item.label}</div>
                  <div style={{fontSize:10,color:G.muted}}>{item.sub}</div>
                </div>
              ))}
            </div>
            <div style={{textAlign:"center"}}>
              <button onClick={()=>setStarted(true)} style={{padding:"14px 40px",borderRadius:8,cursor:"pointer",
                background:`linear-gradient(135deg,${G.accent},#d97706)`,border:"none",
                fontFamily:G.fontD,fontWeight:700,fontSize:16,color:"#000",letterSpacing:"0.02em"}}>
                Comenzar simulación →
              </button>
              <div style={{marginTop:12,fontSize:11,color:G.muted}}>5 pasos · sin datos obligatorios · resultados instantáneos</div>
            </div>

            {savedSims.length>0&&(
              <div style={{marginTop:32}}>
                <div style={{fontSize:10,color:G.accent,letterSpacing:"0.1em",marginBottom:12,fontFamily:G.font,
                  borderLeft:`3px solid ${G.accent}`,paddingLeft:8}}>
                  ◈ SIMULACIONES GUARDADAS — {savedSims.length}
                </div>
                <div style={{display:"grid",gap:8}}>
                  {savedSims.map(s=>{
                    const fecha=new Date(s.fecha).toLocaleDateString("es-CL",{day:"2-digit",month:"2-digit",year:"2-digit"});
                    const scoreColor=s.score>=75?G.green:s.score>=55?G.accent:G.red;
                    return (
                      <div key={s.id} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,
                        padding:"11px 14px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",gap:8,alignItems:"baseline",flexWrap:"wrap",marginBottom:2}}>
                            <span style={{fontSize:13,color:G.accent,fontWeight:600}}>{s.cliente||"Sin cliente"}</span>
                            {s.proyecto&&<span style={{fontSize:11,color:G.muted}}>· {s.proyecto}</span>}
                            <span style={{fontSize:10,color:G.muted,marginLeft:"auto"}}>{fecha}</span>
                          </div>
                          <div style={{fontSize:11,color:G.muted}}>
                            {s.rockName} · {s.tph} tph · P80 {s.p80}mm
                            <span style={{color:scoreColor,marginLeft:8}}>Score {s.score}/100</span>
                            <span style={{marginLeft:6}}>· ±{s.errPct}%</span>
                          </div>
                          {s.notas&&<div style={{fontSize:10,color:G.muted,marginTop:2,fontStyle:"italic"}}>{s.notas}</div>}
                        </div>
                        <button onClick={()=>onReplay&&onReplay(s)}
                          style={{background:"none",border:`1px solid ${G.accent}`,color:G.accent,
                            cursor:"pointer",fontSize:12,padding:"4px 9px",borderRadius:5,fontFamily:G.font,flexShrink:0}}>
                          Ver →
                        </button>
                        <button onClick={()=>onDeleteSim&&onDeleteSim(s.id)}
                          style={{background:"none",border:`1px solid ${G.border}`,color:G.muted,
                            cursor:"pointer",fontSize:12,padding:"4px 9px",borderRadius:5,fontFamily:G.font,flexShrink:0}}>
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
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",flexDirection:"column"}}>
      <style>{GCSS}</style>
      <div style={{padding:"16px 20px",borderBottom:`1px solid ${G.border}`,background:G.surface,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:36,height:36,borderRadius:8,background:`linear-gradient(135deg,${G.accent},#d97706)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:G.fontD,fontWeight:800,fontSize:15,color:"#000"}}>KR</div>
        <div>
          <div style={{fontFamily:G.fontD,fontWeight:700,fontSize:16,color:G.accent}}>KrushRock</div>
          <div style={{fontSize:10,color:G.muted,letterSpacing:"0.1em"}}>SIMULADOR DE CHANCADO Y SELECCIÓN</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:11,color:G.muted,marginRight:4}}>Unidad:</span>
          {["mm","cm","in"].map(u=>(
            <button key={u} onClick={()=>setUnit(u)} style={{padding:"4px 11px",borderRadius:5,cursor:"pointer",fontFamily:G.font,fontSize:12,
              border:`1px solid ${unit===u?G.accent:G.border}`,background:unit===u?`${G.accentDim}44`:G.card,color:unit===u?G.accent:G.muted}}>
              {u==="in"?'"':u}
            </button>
          ))}
        </div>
      </div>
      <div style={{height:3,background:G.border}}>
        <div style={{height:"100%",width:`${pct}%`,background:G.accent,transition:"width .4s ease"}}/>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"22px 16px"}}>
        <div className="fi" key={step} style={{maxWidth:640,margin:"0 auto"}}>
          <QBubble q={QUES[step]} hint={HINTS[step]}/>

          {/* STEP 0 — ROCA (2 niveles) */}
          {step===0&&(
            <div style={{display:"grid",gap:8}}>

              {/* Nivel 0 — botón siempre visible */}
              <button onClick={()=>{setRockKey("desconocida");setRockCat(null);setTimeout(next,150);}}
                style={{padding:"10px 16px",borderRadius:8,cursor:"pointer",textAlign:"left",
                  background:`${G.accentDim}22`,border:`1px dashed ${G.border}`,display:"flex",
                  justifyContent:"space-between",alignItems:"center",width:"100%"}}>
                <span style={{fontSize:13,color:G.muted}}>Usar valores promedio (no sé)</span>
                <span style={{fontSize:10,color:G.muted}}>Wi 13 · ab 0.20 · den 2.65 →</span>
              </button>

              {/* Nivel 1 — categorías */}
              {!rockCat&&(
                <div style={{display:"grid",gap:7}}>
                  {[
                    {k:"aridos",     icon:"🏗", label:"Áridos y construcción",    sub:"Huevillo, grava, bolones"},
                    {k:"mineria",    icon:"⛏", label:"Minería metálica",          sub:"Pórfido, cobre, magnetita"},
                    {k:"roca_dura",  icon:"🪨", label:"Roca dura (tronadura)",    sub:"Andesita, granito, basalto"},
                    {k:"roca_blanda",icon:"🧱", label:"Roca blanda / industrial", sub:"Caliza, caliche, arenisca"},
                    {k:"manual",     icon:"⚙️", label:"Ingresar manualmente",     sub:"Wi + abrasión + densidad"},
                  ].map(cat=>(
                    <button key={cat.k} onClick={()=>setRockCat(cat.k)}
                      style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,
                        padding:"12px 16px",cursor:"pointer",textAlign:"left",display:"flex",
                        alignItems:"center",gap:12,width:"100%",transition:"all .15s"}}>
                      <span style={{fontSize:22,lineHeight:1}}>{cat.icon}</span>
                      <div>
                        <div style={{fontSize:14,color:G.text,fontWeight:600}}>{cat.label}</div>
                        <div style={{fontSize:11,color:G.muted,marginTop:2}}>{cat.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Nivel 2 — sub-opciones por categoría */}
              {rockCat&&rockCat!=="manual"&&(
                <div style={{display:"grid",gap:7}}>
                  <button onClick={()=>setRockCat(null)}
                    style={{background:"none",border:"none",color:G.muted,cursor:"pointer",
                      fontSize:12,fontFamily:G.font,textAlign:"left",padding:"4px 0",marginBottom:2}}>
                    ← Cambiar categoría
                  </button>
                  {ROCK_CATS[rockCat].map(key=>{
                    const rock=ROCK_DB[key];
                    if(!rock) return null;
                    return (
                      <OptBtn key={key} val={key} label={rock.name} sub={`Wi ${rock.wi} · ab ${rock.ab} · den ${rock.den}`}
                        active={rockKey===key}
                        onClick={()=>{setRockKey(key);setTimeout(next,200);}}/>
                    );
                  })}
                </div>
              )}

              {/* Nivel 2 — ingreso manual */}
              {rockCat==="manual"&&(
                <div style={{background:G.card,border:`1px solid ${G.accent}`,borderRadius:8,padding:16,display:"grid",gap:12}}>
                  <button onClick={()=>setRockCat(null)}
                    style={{background:"none",border:"none",color:G.muted,cursor:"pointer",
                      fontSize:12,fontFamily:G.font,textAlign:"left",padding:0}}>
                    ← Cambiar categoría
                  </button>

                  <div>
                    <div style={{fontSize:11,color:G.muted,marginBottom:5}}>Nombre del material (opcional)</div>
                    <input type="text" value={cName} onChange={e=>setCName(e.target.value)} placeholder="Ej: Pórfido Proyecto Norte"/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <div style={{fontSize:11,color:G.muted,marginBottom:5}}>Wi Bond (kWh/t)</div>
                      <input type="number" value={cWi} min={1} max={60} step={0.5} onChange={e=>setCWi(Number(e.target.value))}/>
                    </div>
                    <div>
                      <div style={{fontSize:11,color:G.muted,marginBottom:5}}>Densidad (t/m³)</div>
                      <input type="number" value={cDen} min={1} max={7} step={0.05} onChange={e=>setCDen(Number(e.target.value))}/>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:G.muted,marginBottom:5}}>Abrasividad Bond — <strong style={{color:G.accent}}>{cAb.toFixed(2)}</strong></div>
                    <input type="range" min={0} max={0.60} step={0.01} value={cAb} onChange={e=>setCAb(Number(e.target.value))}/>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:G.muted,marginTop:3}}>
                      <span>0.00 — muy blanda</span><span>0.60 — muy abrasiva</span>
                    </div>
                    <div style={{fontSize:10,color:G.muted,marginTop:4,lineHeight:1.5}}>
                      Ref: caliza 0.12 · andesita 0.32 · basalto 0.35 · cuarcita 0.45
                    </div>
                  </div>
                  <PBtn label="Confirmar → Siguiente" onClick={()=>{setRockKey("personalizada");next();}}/>
                </div>
              )}

              {/* Volver a bienvenida (solo visible en nivel 1, sin categoría seleccionada) */}
              {!rockCat&&(
                <button onClick={()=>setStarted(false)}
                  style={{background:"none",border:"none",color:G.muted,cursor:"pointer",
                    fontSize:12,fontFamily:G.font,textAlign:"left",padding:"4px 0",marginTop:4}}>
                  ← Volver al inicio
                </button>
              )}
            </div>
          )}

          {/* STEP 1 — CURVA GRANULOMÉTRICA DE INGRESO */}
          {step===1&&(
            <div style={{display:"grid",gap:8}}>
              {[
                {v:"full",    label:"Tengo puntos de la curva",  sub:"Error estimado ±4-9% — mayor precisión"},
                {v:"partial", label:"Tengo F80 y F50",           sub:"Error estimado ±10-12%"},
                {v:"f80only", label:"Solo tengo F80",            sub:"Sin datos de distribución — error ±20-25%"},
              ].map(o=>(
                <OptBtn key={o.v} val={o.v} label={o.label} sub={o.sub} active={curveType===o.v}
                  onClick={()=>setCurve(o.v)}/>
              ))}

              {curveType==="f80only"&&(
                <div style={{background:G.card,border:`1px solid ${G.accent}`,borderRadius:8,padding:16,display:"grid",gap:10,marginTop:4}}>
                  <div>
                    <div style={{fontSize:11,color:G.muted,marginBottom:5}}>F80 — tamaño por el que pasa el 80% de la alimentación ({ul})</div>
                    <div style={{textAlign:"center",marginBottom:8}}>
                      <span style={{fontFamily:G.fontD,fontWeight:700,fontSize:42,color:G.accent}}>{disp(f80)}</span>
                      <span style={{fontSize:14,color:G.muted,marginLeft:6}}>{ul}</span>
                    </div>
                    <input type="range" min={50} max={1000} step={1} value={f80} onChange={e=>setF80(Number(e.target.value))}/>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:G.muted,marginTop:4,marginBottom:8}}>
                      <span>50 mm</span><span>1000 mm</span>
                    </div>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <span style={{fontSize:12,color:G.muted,whiteSpace:"nowrap"}}>Directo ({ul}):</span>
                      <input type="text" value={disp(f80)} key={`f80only-${unit}`}
                        onChange={e=>{const v=toMmU(e.target.value);if(v>=50&&v<=1000)setF80(v);}}
                        style={{width:110}}/>
                    </div>
                    {feedUnitAlert && (
                      <div style={{marginTop:8,padding:"10px 12px",borderRadius:8,
                        background:feedUnitAlert.level==="red"?`${G.red}22`:`${G.accent}22`,
                        border:`1px solid ${feedUnitAlert.level==="red"?G.red:G.accent}`,
                        color:feedUnitAlert.level==="red"?G.red:G.accent,fontSize:12,lineHeight:1.5}}>
                        {feedUnitAlert.message}
                      </div>
                    )}
                  </div>
                  <PBtn label="Confirmar → Siguiente" onClick={next}/>
                </div>
              )}

              {curveType==="partial"&&(
                <div style={{background:G.card,border:`1px solid ${G.accent}`,borderRadius:8,padding:16,display:"grid",gap:10,marginTop:4}}>
                  <div>
                    <div style={{fontSize:11,color:G.muted,marginBottom:5}}>F80 — tamaño por el que pasa el 80% de la alimentación ({ul})</div>
                    <input type="text" defaultValue={disp(f80)} key={`f80p-${unit}`}
                      onBlur={e=>{const v=toMmU(e.target.value);if(v>=50&&v<=1000)setF80(v);}}/>
                    {feedUnitAlert && (
                      <div style={{marginTop:8,padding:"10px 12px",borderRadius:8,
                        background:feedUnitAlert.level==="red"?`${G.red}22`:`${G.accent}22`,
                        border:`1px solid ${feedUnitAlert.level==="red"?G.red:G.accent}`,
                        color:feedUnitAlert.level==="red"?G.red:G.accent,fontSize:12,lineHeight:1.5}}>
                        {feedUnitAlert.message}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{fontSize:11,color:G.muted,marginBottom:5}}>F50 — tamaño por el que pasa el 50% ({ul})</div>
                    <input type="text" defaultValue={disp(f50)} key={`f50p-${unit}`}
                      onBlur={e=>{const v=toMmU(e.target.value);if(v>0)setF50(v);}}/>
                  </div>
                  <div style={{fontSize:11,color:G.muted}}>F80: {disp(f80)} {ul} · F50: {disp(f50)} {ul}</div>
                  <PBtn label="Confirmar → Siguiente" onClick={next}/>
                </div>
              )}

              {curveType==="full"&&(
                <div style={{background:G.card,border:`1px solid ${G.accent}`,borderRadius:8,padding:16,marginTop:4}}>
                  <div style={{fontSize:12,color:G.accent,marginBottom:6,fontWeight:600}}>Ingresa los puntos que tengas disponibles</div>
                  <div style={{fontSize:11,color:G.muted,marginBottom:14,lineHeight:1.6}}>
                    Ingresa solo los puntos que conozcas — deja en blanco los que no tengas. El sistema ajustará la curva con los datos disponibles. Decimal: usa punto <strong style={{color:G.text}}>.</strong> o coma <strong style={{color:G.text}}>,</strong>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                    {curvePoints.map(pt=>(
                      <div key={pt.label}>
                        <div style={{fontSize:10,color:G.muted,marginBottom:4}}>
                          {pt.label} <span style={{color:G.muted}}>({pt.pct}% pasante)</span>
                        </div>
                        <input type="text"
                          defaultValue={pt.sizeMm>0?fromMm(pt.sizeMm,unit):""}
                          key={`${pt.label}-${unit}`}
                          onBlur={e=>updCurvePoint(pt.label,e.target.value)}
                          placeholder={`tamaño en ${ul}`}/>
                      </div>
                    ))}
                  </div>
                  {validCurvePts>0&&(
                    <div style={{fontSize:11,color:G.green,marginBottom:10}}>
                      ✓ {validCurvePts} punto(s) ingresado(s) — error estimado ±{validCurvePts>=6?4:validCurvePts>=4?6:validCurvePts>=2?9:14}%
                    </div>
                  )}
                  <PBtn label="Confirmar → Siguiente" onClick={next}/>
                </div>
              )}
              <SBtn label="← Anterior" onClick={back}/>
            </div>
          )}

          {/* STEP 2 — PRODUCTOS */}
          {step===2&&(
            <div style={{display:"grid",gap:10}}>
              <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:14}}>
                <SectionTitle>HORIZONTE DE PRODUCCIÓN</SectionTitle>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <button onClick={()=>setPlazoMeses(1)} style={{padding:"7px 14px",borderRadius:6,cursor:"pointer",fontFamily:G.font,fontSize:12,
                    border:`1px solid ${plazoMeses===1?G.accent:G.border}`,background:plazoMeses===1?`${G.accentDim}33`:G.card,color:plazoMeses===1?G.accent:G.muted}}>
                    Mensual (1 mes)
                  </button>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <input type="number" min={1} max={60} value={plazoMeses}
                      onChange={e=>setPlazoMeses(Math.max(1,Number(e.target.value)))} style={{width:70}}/>
                    <span style={{fontSize:12,color:G.muted}}>mes(es)</span>
                  </div>
                </div>
                <div style={{fontSize:10,color:G.muted,marginTop:6}}>Define el horizonte para calcular tonelajes totales y planificación de campaña</div>
              </div>
              <div style={{fontSize:11,color:G.muted,padding:"8px 12px",background:G.faint,borderRadius:6,borderLeft:`3px solid ${G.border}`}}>
                Decimal aceptado: punto <strong style={{color:G.text}}>.</strong> o coma <strong style={{color:G.text}}>,</strong> — ej: 25.4 o 25,4 · Máximo sin límite: dejar vacío o escribir ∞
              </div>
              {prods.map((p,idx)=>(
                <div key={p.id} style={{background:G.card,border:`1px solid ${p.active?G.accent:G.border}`,borderRadius:8,padding:13,opacity:p.active?1:0.55,transition:"all .2s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:p.active?11:0}}>
                    <button onClick={()=>togProd(p.id)} style={{width:22,height:22,borderRadius:4,flexShrink:0,
                      border:`1px solid ${p.active?G.accent:G.border}`,
                      background:p.active?G.accent:"transparent",cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {p.active&&<span style={{color:"#000",fontSize:13,fontWeight:700}}>✓</span>}
                    </button>
                    <input type="text" value={p.label} onChange={e=>upProd(p.id,"label",e.target.value)}
                      placeholder={`Producto ${idx+1} (nombre opcional)`} style={{flex:1,fontSize:13}}/>
                  </div>
                  {p.active&&(
                    <div style={{display:"grid",gap:8}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                        <div>
                          <div style={{fontSize:10,color:G.muted,marginBottom:4}}>Mínimo ({ul})</div>
                          <input type="text"
                            defaultValue={p.minMm===0?"0":fromMm(p.minMm,unit)}
                            key={`${p.id}-min-${unit}`}
                            onBlur={e=>upProd(p.id,"minMm",e.target.value)}
                            placeholder="0 = sin límite inferior"/>
                        </div>
                        <div>
                          <div style={{fontSize:10,color:G.muted,marginBottom:4}}>Máximo ({ul})</div>
                          <input type="text"
                            defaultValue={p.maxMm>=9999?"∞":fromMm(p.maxMm,unit)}
                            key={`${p.id}-max-${unit}`}
                            onBlur={e=>upProd(p.id,"maxMm",e.target.value)}
                            placeholder="∞ = sin límite superior"/>
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:G.muted,marginBottom:4}}>
                          Tonelaje objetivo ({plazoMeses===1?"ton/mes":`ton total en ${plazoMeses} meses`}) — opcional
                        </div>
                        <input type="number" value={p.targetTon||""} min={0} step={100}
                          placeholder="0 = sin objetivo"
                          onChange={e=>upProd(p.id,"targetTon",e.target.value)}
                          style={{width:"100%"}}/>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {derivedTphPreview&&(
                <div style={{padding:"10px 14px",background:`${G.green}11`,borderRadius:8,border:`1px solid ${G.green}44`,fontSize:12}}>
                  <span style={{color:G.green,fontWeight:600}}>TPH estimado: {derivedTphPreview} tph</span>
                  <span style={{color:G.muted,marginLeft:8}}>
                    — basado en {totalTargetTonPreview.toLocaleString()} ton en {plazoMeses} {plazoMeses===1?"mes":"meses"}
                  </span>
                </div>
              )}
              <div style={{display:"flex",gap:10,justifyContent:"space-between"}}>
                <SBtn label="← Anterior" onClick={back}/>
                <PBtn label="Confirmar → Siguiente" onClick={next}/>
              </div>
            </div>
          )}

          {/* STEP 3 — HUMEDAD + ALTITUD */}
          {step===3&&(
            <div style={{display:"grid",gap:12}}>
              <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:16}}>
                <SectionTitle>HUMEDAD / ARCILLAS</SectionTitle>
                <div style={{display:"grid",gap:7}}>
                  {[{v:null,l:"Sin humedad / No aplica",s:"< 2%"},{v:"unknown",l:"Desconocida",s:"No tengo información"},
                    {v:1,l:"Baja",s:"2–5% — sin arcillas"},{v:2,l:"Media",s:"5–10% — arcillas leves"},{v:3,l:"Alta",s:">10% — arcillas significativas"}
                  ].map(o=>(
                    <OptBtn key={String(o.v)} val={o.v} label={o.l} sub={o.s} active={humidity===o.v} onClick={()=>setHum(o.v)}/>
                  ))}
                </div>
              </div>
              <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:16}}>
                <SectionTitle>ALTITUD DE TRABAJO</SectionTitle>
                <div style={{marginBottom:10}}>
                  <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:altitudeOmit?G.accent:G.text}}>
                    <input type="checkbox" checked={altitudeOmit} onChange={e=>setAltOmit(e.target.checked)}
                      style={{width:16,height:16,accentColor:G.accent,cursor:"pointer"}}/>
                    Omitir altitud (no aplica — bajo 1.500 m.s.n.m.)
                  </label>
                  <div style={{fontSize:11,color:G.muted,marginTop:4,marginLeft:24}}>
                    Bajo 1.500 m.s.n.m. la corrección de altitud normalmente no es relevante.
                  </div>
                </div>
                {!altitudeOmit&&(
                  <>
                    <div style={{fontSize:12,color:G.muted,marginBottom:10}}>
                      Sobre 1.500 m.s.n.m.: motores pierden ~1% de potencia cada 100m. Factor mínimo: 60% a ~5.500m.
                    </div>
                    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6}}>
                      <input type="number" value={altitude} min={0} max={5500} step={50}
                        onChange={e=>setAlt(Number(e.target.value))} style={{width:120}}/>
                      <span style={{fontSize:13,color:G.muted}}>m.s.n.m.</span>
                    </div>
                    {altitude>1500&&(
                      <div style={{fontSize:11,color:G.accent,marginTop:4}}>
                        ⚡ Factor de potencia: {(Math.max(0.60,1-(altitude-1500)*0.0001)*100).toFixed(0)}%
                        {altitude>3700&&<span style={{color:G.red}}> — zona altiplano</span>}
                      </div>
                    )}
                  </>
                )}
                <div style={{marginTop:12,padding:"10px 12px",background:G.faint,borderRadius:6,fontSize:11,color:G.muted,borderLeft:`3px solid ${G.border}`}}>
                  <strong style={{color:G.text}}>Nota Tier y año de equipo:</strong> los estándares de emisión Tier 3/4 no afectan la potencia de trituración. El año del equipo no modifica los parámetros de proceso (CSS, capacidad). No se incluyen en el modelo para evitar estimaciones sin base técnica sólida.
                </div>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"space-between"}}>
                <SBtn label="← Anterior" onClick={back}/>
                <PBtn label="Confirmar → Siguiente" onClick={next}/>
              </div>
            </div>
          )}

          {/* STEP 4 — CIRCUITO */}
          {step===4&&(
            <div style={{display:"grid",gap:10}}>
              {!circPath&&(
                <>
                  {[
                    {v:"ai",        label:"Que la IA decida",                   sub:"Configuración automática óptima según parámetros",color:G.accent},
                    {v:"manual",    label:"Selecciono mis equipos",             sub:"Defines tipos, marcas y configuración del circuito"},
                    {v:"available", label:"Ingreso mis equipos disponibles",    sub:"El sistema evalúa si cumplen y qué falta"},
                  ].map(o=>(
                    <OptBtn key={o.v} val={o.v} label={o.label} sub={o.sub} active={circPath===o.v} color={o.color} onClick={()=>setCircPath(o.v)}/>
                  ))}
                  <SBtn label="← Anterior" onClick={back}/>
                </>
              )}

              {circPath==="ai"&&(
                <div style={{background:G.card,border:`1px solid ${G.accent}`,borderRadius:8,padding:16}}>
                  <div style={{fontSize:13,color:G.green,marginBottom:12}}>✓ La IA diseñará el circuito óptimo para tu material y tonelaje.</div>
                  <div style={{marginBottom:14}}>
                    <ConePerfil conePerfil={conePerfil} setConePerfil={setConePerfil} sugPerfil={sugPerfil} setSugPerfil={setSugPerfil} suggestConePerfil={suggestConePerfil}/>
                  </div>
                  <div style={{display:"flex",gap:10,justifyContent:"space-between"}}>
                    <SBtn label="← Cambiar opción" onClick={()=>setCircPath(null)}/>
                    <PBtn label="◈ Simular" onClick={finish}/>
                  </div>
                </div>
              )}

              {circPath==="manual"&&(
                <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:16,display:"grid",gap:14}}>
                  <SectionTitle>EQUIPOS A INCLUIR</SectionTitle>
                  <div style={{display:"grid",gap:7}}>
                    {[
                      {k:"jaw",       label:"Chancador Mandíbula (Primario)"},
                      {k:"cone",      label:"Chancador Cono (Secundario / Terciario)"},
                      {k:"hsi",       label:"Chancador HSI (Primario / Secundario)"},
                      {k:"screen3d",  label:"Seleccionadora 3 Deck"},
                      {k:"screen2d",  label:"Seleccionadora 2 Deck"},
                      {k:"screen1d",  label:"Seleccionadora 1 Deck"},
                      {k:"screen_hf", label:"Seleccionadora Alta Frecuencia"},
                      {k:"scalper",   label:"Scalper (Pre-primario)"},
                    ].map(eq=>(
                      <label key={eq.k} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:13,color:G.text}}>
                        <input type="checkbox" checked={!!manualEq[eq.k]}
                          onChange={e=>setManualEq(m=>({...m,[eq.k]:e.target.checked}))}
                          style={{width:16,height:16,accentColor:G.accent,cursor:"pointer"}}/>
                        {eq.label}
                      </label>
                    ))}
                    <div style={{borderTop:`1px solid ${G.border}`,paddingTop:10,marginTop:3}}>
                      <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:13,color:G.cyan}}>
                        <input type="checkbox" checked={!!manualEq.recirculation}
                          onChange={e=>setManualEq(m=>({...m,recirculation:e.target.checked}))}
                          style={{width:16,height:16,accentColor:G.cyan,cursor:"pointer"}}/>
                        ↺ Con recirculación de sobre-tamaño
                      </label>
                      <div style={{fontSize:10,color:G.muted,marginTop:4,marginLeft:26}}>
                        Condición de circuito, no un equipo adicional.
                      </div>
                    </div>
                  </div>

                  <SectionTitle>MARCA / MODELO POR EQUIPO (opcional)</SectionTitle>
                  {["jaw","cone","hsi","screen3d","screen2d","screen1d","screen_hf"].filter(k=>manualEq[k]).map(k=>{
                    const catalog=EQ_BY_CAT[k]||[];
                    const brands=[...new Set(catalog.map(e=>e.brand))];
                    const models=catalog.filter(e=>!manBrand[k]||e.brand===manBrand[k]).map(e=>e.model);
                    return (
                      <div key={k} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        <div>
                          <div style={{fontSize:10,color:G.muted,marginBottom:4}}>Marca — {CAT_LABELS[k]}</div>
                          <select value={manBrand[k]||""} onChange={e=>setManBrand(b=>({...b,[k]:e.target.value}))}>
                            <option value="">Cualquier marca</option>
                            {brands.map(b=><option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{fontSize:10,color:G.muted,marginBottom:4}}>Modelo</div>
                          <select value={manModel[k]||""} onChange={e=>setManModel(m=>({...m,[k]:e.target.value}))}>
                            <option value="">Cualquier modelo</option>
                            {models.map(m=><option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                  {manualEq.scalper&&(
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div>
                        <div style={{fontSize:10,color:G.muted,marginBottom:4}}>Marca — Scalper</div>
                        <input type="text" value={manBrand.scalper||""} placeholder="Ej: Terex Finlay"
                          onChange={e=>setManBrand(b=>({...b,scalper:e.target.value}))}/>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:G.muted,marginBottom:4}}>Modelo</div>
                        <input type="text" value={manModel.scalper||""} placeholder="Ej: 883 Scalper"
                          onChange={e=>setManModel(m=>({...m,scalper:e.target.value}))}/>
                      </div>
                    </div>
                  )}
                  <div style={{marginTop:4}}>
                    <ConePerfil conePerfil={conePerfil} setConePerfil={setConePerfil} sugPerfil={sugPerfil} setSugPerfil={setSugPerfil} suggestConePerfil={suggestConePerfil}/>
                  </div>
                  <div style={{display:"flex",gap:10,justifyContent:"space-between"}}>
                    <SBtn label="← Cambiar opción" onClick={()=>setCircPath(null)}/>
                    <PBtn label="◈ Simular" onClick={finish}/>
                  </div>
                </div>
              )}

              {circPath==="available"&&(
                <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:16,display:"grid",gap:12}}>
                  <SectionTitle>MIS EQUIPOS DISPONIBLES</SectionTitle>
                  <div style={{fontSize:12,color:G.muted,marginBottom:4}}>El sistema evaluará si cumplen el objetivo e indicará qué falta.</div>
                  {availEquip.map((eq,i)=>{
                    const catalog=EQ_BY_CAT[eq.type]||[];
                    const brands=[...new Set(catalog.map(e=>e.brand))];
                    const models=catalog.filter(e=>!eq.brand||e.brand===eq.brand).map(e=>e.model);
                    const hasCat=catalog.length>0;
                    return (
                    <div key={eq.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:8,alignItems:"end"}}>
                      <div>
                        <div style={{fontSize:10,color:G.muted,marginBottom:4}}>Tipo</div>
                        <select value={eq.type} onChange={e=>setAvail(a=>a.map(x=>x.id===eq.id?{...x,type:e.target.value,brand:"",model:""}:x))}>
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
                        <div style={{fontSize:10,color:G.muted,marginBottom:4}}>Marca</div>
                        {hasCat?(
                          <select value={eq.brand} onChange={e=>setAvail(a=>a.map(x=>x.id===eq.id?{...x,brand:e.target.value,model:""}:x))}>
                            <option value="">Cualquier marca</option>
                            {brands.map(b=><option key={b} value={b}>{b}</option>)}
                          </select>
                        ):(
                          <input type="text" value={eq.brand} placeholder="Ej: Terex Finlay"
                            onChange={e=>setAvail(a=>a.map(x=>x.id===eq.id?{...x,brand:e.target.value}:x))}/>
                        )}
                      </div>
                      <div>
                        <div style={{fontSize:10,color:G.muted,marginBottom:4}}>Modelo</div>
                        {hasCat?(
                          <select value={eq.model} onChange={e=>setAvail(a=>a.map(x=>x.id===eq.id?{...x,model:e.target.value}:x))}>
                            <option value="">Cualquier modelo</option>
                            {models.map(m=><option key={m} value={m}>{m}</option>)}
                          </select>
                        ):(
                          <input type="text" value={eq.model} placeholder="Ej: J-1175"
                            onChange={e=>setAvail(a=>a.map(x=>x.id===eq.id?{...x,model:e.target.value}:x))}/>
                        )}
                      </div>
                      <button onClick={()=>setAvail(a=>a.filter(x=>x.id!==eq.id))} style={{background:"none",border:"none",color:G.red,cursor:"pointer",fontSize:16,paddingBottom:6}}>✕</button>
                    </div>
                    );
                  })}
                  <button onClick={()=>setAvail(a=>[...a,{id:Date.now(),type:"jaw",brand:"",model:""}])}
                    style={{background:"none",border:`1px dashed ${G.border}`,borderRadius:6,padding:"8px",color:G.muted,cursor:"pointer",fontSize:12,fontFamily:G.font}}>
                    + Agregar equipo
                  </button>
                  <div style={{display:"flex",gap:10,justifyContent:"space-between"}}>
                    <SBtn label="← Cambiar opción" onClick={()=>setCircPath(null)}/>
                    <PBtn label="◈ Simular" onClick={finish}/>
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
function Results({res,unit:initUnit,onReset,onSave}){
  const [tab,setTab]   = useState("equipos");
  const [unit,setUnit] = useState(initUnit||"mm");
  const [showSave,setShowSave]       = useState(false);
  const [saveCliente,setSaveCliente] = useState("");
  const [saveProyecto,setSaveProyecto] = useState("");
  const [saveNotas,setSaveNotas]     = useState("");
  const [savedConfirm,setSavedConfirm] = useState(false);
  // ── MÓDULO PRODUCCIÓN ─────────────────────────────────────────────────
  const [prodMode,setProdMode]   = useState("produccion");
  const [horasTurno,setHorasTurno] = useState(8);
  const [turnosDia,setTurnosDia]   = useState(2);
  const [diasSemana,setDiasSemana] = useState(5);
  const [dispMec,setDispMec]       = useState(80);
  const [utilOp,setUtilOp]         = useState(85);
  const [horizMes,setHorizMes]     = useState(res.inp.plazoMeses || 1);
  const [deadlineTon,setDeadlineTon] = useState(50000);
  const [deadlineMes,setDeadlineMes] = useState(6);
  const [prodTargets,setProdTargets] = useState(()=>{
    const init={};
    (res.products||[]).forEach(p=>{if((p.targetTon||0)>0) init[p.id]=p.targetTon;});
    return init;
  });
  const analysis = buildAnalysis(res);
  const score=Number(res.final.score), cc=Number(res.screening.ccLoad);
  const effColor=score>=75?G.green:score>=55?G.accent:G.red;
  const effLabel=score>=75?"ÓPTIMO":score>=55?"MEJORABLE":"CRÍTICO";
  const ul=unitLabel(unit);
  const sz=mm=>fromMm(Number(mm),unit)+ul;
  const humTxt=res.inp.humidity===null?"Sin humedad":res.inp.humidity==="unknown"?"Desconocida":
    ["Sin humedad","Baja (2-5%)","Media (5-10%)","Alta (>10%)"][res.inp.humidity]||"";
  const cnName={abierto:"Circuito abierto",cerrado:"Circuito cerrado",cerrado_doble:"Doble deck",con_scalper:"Con Scalper",ai:"IA"}[res.circActual]||res.circActual;

  // ── CÁLCULOS PRODUCCIÓN ────────────────────────────────────────────────
  const tphNominal   = Number(res.inp.tph);
  const factorEf     = (dispMec/100)*(utilOp/100);
  const tphEfectivo  = tphNominal*factorEf;
  const horasDia     = horasTurno*turnosDia;
  const diasPorMes   = diasSemana*4.33;
  const horasPorMes  = diasPorMes*horasDia;
  const tonPorDia    = tphEfectivo*horasDia;
  const tonPorSemana = tonPorDia*diasSemana;
  const tonPorMes    = tphEfectivo*horasPorMes;
  const horasHorizonte = horizMes*horasPorMes;
  const tonHorizonte = tphEfectivo*horasHorizonte;
  const horasDeadline  = deadlineMes*horasPorMes;
  const tphEfReq     = horasDeadline>0?deadlineTon/horasDeadline:0;
  const tphNomReq    = factorEf>0?tphEfReq/factorEf:Infinity;
  const cumple       = tphNomReq>0&&tphNominal>=tphNomReq;
  const pctCap       = tphNomReq>0?Math.min(999,(tphNominal/tphNomReq)*100):0;
  const mesesParaMeta= tonPorMes>0?deadlineTon/tonPorMes:999;
  const prodsEf      = res.products.map(p=>{
    const tphEfP=Number(p.tphOut)*factorEf;
    return {...p, tphEf:tphEfP.toFixed(1),
      tonMes:Math.round(tphEfP*horasPorMes),
      tonHor:Math.round(tphEfP*horasHorizonte),
      tonDL: Math.round(tphEfP*horasDeadline)};
  });
  const fmtTon=n=>n>=1000000?(n/1000000).toFixed(2)+" Mt":n>=1000?Math.round(n/1000)+"k ton":Math.round(n)+" ton";

  // ── CAMPAÑA ──────────────────────────────────────────────────────────────
  const F_CONE_DYN_res  = coneFactor(res.conePerfil||"M", res.rock.wi, res.coneRpm||285);
  const cssConeVal      = Number(res.secondary.css);
  const rrN_res         = res.rock.rrN||0.85;
  const hasTargets      = Object.values(prodTargets).some(t=>Number(t)>0);
  const campaignPhases  = (prodMode==="campana"&&hasTargets)
    ? computeCampaign(prodsEf, prodTargets, tphNominal, factorEf, cssConeVal, rrN_res, F_CONE_DYN_res,
        res.needsT, Number(res.tertiary?.p80||0))
    : null;
  const campaignTotalHours = campaignPhases ? (campaignPhases[campaignPhases.length-1]?.accHours||0) : 0;
  const campaignUnoptH  = (prodMode==="campana"&&hasTargets)
    ? campaignUnoptTime(prodsEf, prodTargets, tphNominal, factorEf, cssConeVal, rrN_res, F_CONE_DYN_res)
    : 0;

  const TABS=[{id:"equipos",label:"Equipos"},{id:"resumen",label:"Resumen"},{id:"circuito",label:"Circuito"},{id:"productos",label:"Productos"},{id:"produccion",label:"Producción"}];

  const showHSI = res.inp.circPath==="manual" && res.inp.manualEq?.hsi;

  const availEval=()=>{
    if(res.inp.circPath!=="available"||!res.inp.availEquip?.length) return null;
    const avail=res.inp.availEquip;
    const hasJaw=avail.some(e=>e.type==="jaw");
    const hasCone=avail.some(e=>e.type==="cone"||e.type==="hsi");
    const hasScreen=avail.some(e=>e.type==="screen3d"||e.type==="screen2d"||e.type==="screen1d");
    const missing=[], excess=[];
    if(!hasJaw) missing.push("Chancador primario (mandíbula o HSI primario)");
    if(!hasCone) missing.push("Chancador secundario (cono o HSI)");
    if(!hasScreen) missing.push("Seleccionadora (cualquier configuración)");
    if(res.needsT&&!avail.some(e=>e.type==="cone")) missing.push("Cono/VSI terciario para P80 < 18mm");
    if(avail.filter(e=>e.type==="jaw").length>1) excess.push("Mandíbula duplicada — evaluar si necesaria");
    return {missing,excess,sufficient:missing.length===0};
  };
  const evalResult=availEval();

  return (
    <div style={{minHeight:"100vh",background:G.bg,fontFamily:G.font}}>
      <style>{GCSS}</style>
      <div style={{padding:"13px 20px",borderBottom:`1px solid ${G.border}`,background:G.surface,display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${G.accent},#d97706)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:G.fontD,fontWeight:800,fontSize:14,color:"#000"}}>KR</div>
        <div>
          <div style={{fontFamily:G.fontD,fontWeight:700,color:G.accent,fontSize:15}}>KrushRock</div>
          <div style={{fontSize:10,color:G.muted}}>{res.rock.name} · {res.inp.tph} tph · {cnName}</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
          {["mm","cm","in"].map(u=>(
            <button key={u} onClick={()=>setUnit(u)} style={{padding:"3px 9px",borderRadius:5,cursor:"pointer",fontFamily:G.font,fontSize:11,
              border:`1px solid ${unit===u?G.accent:G.border}`,background:unit===u?`${G.accentDim}44`:G.card,color:unit===u?G.accent:G.muted}}>{u==="in"?'"':u}</button>
          ))}
          <Badge color={score>=75?"green":score>=55?"amber":"red"}>{effLabel}</Badge>
          {savedConfirm
            ? <span style={{color:G.green,fontSize:11}}>✓ Guardada</span>
            : <button onClick={()=>setShowSave(s=>!s)} style={{background:showSave?`${G.accentDim}44`:"none",border:`1px solid ${showSave?G.accent:G.border}`,color:showSave?G.accent:G.muted,padding:"5px 11px",borderRadius:6,cursor:"pointer",fontSize:11,fontFamily:G.font}}>
                {showSave?"✕ Cancelar":"Guardar"}
              </button>
          }
          <button onClick={onReset} style={{background:"none",border:`1px solid ${G.border}`,color:G.muted,padding:"5px 11px",borderRadius:6,cursor:"pointer",fontSize:11,fontFamily:G.font}}>+ Nueva</button>
        </div>
      </div>

      {/* Formulario guardar simulación */}
      {showSave&&!savedConfirm&&(
        <div style={{background:G.card,borderBottom:`1px solid ${G.border}`,padding:"14px 20px",display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div style={{flex:"1 1 160px"}}>
            <div style={{fontSize:10,color:G.muted,marginBottom:4}}>Cliente</div>
            <input type="text" placeholder="Ej: Minera Los Andes" value={saveCliente}
              onChange={e=>setSaveCliente(e.target.value)}/>
          </div>
          <div style={{flex:"1 1 160px"}}>
            <div style={{fontSize:10,color:G.muted,marginBottom:4}}>Proyecto / Licitación</div>
            <input type="text" placeholder="Ej: Contrato áridos ruta 5" value={saveProyecto}
              onChange={e=>setSaveProyecto(e.target.value)}/>
          </div>
          <div style={{flex:"2 1 220px"}}>
            <div style={{fontSize:10,color:G.muted,marginBottom:4}}>Notas (opcional)</div>
            <input type="text" placeholder="Observaciones del terreno, etc." value={saveNotas}
              onChange={e=>setSaveNotas(e.target.value)}/>
          </div>
          <button onClick={()=>{
            if(!saveCliente.trim()&&!saveProyecto.trim()) return;
            onSave&&onSave(saveCliente.trim()||"Sin nombre",saveProyecto.trim()||"Sin proyecto",saveNotas.trim());
            setShowSave(false);
            setSavedConfirm(true);
            setTimeout(()=>setSavedConfirm(false),3000);
          }} style={{background:G.accent,color:"#000",border:"none",borderRadius:6,padding:"8px 18px",
            cursor:"pointer",fontFamily:G.font,fontWeight:600,fontSize:12,whiteSpace:"nowrap"}}>
            Guardar
          </button>
        </div>
      )}

      {/* Score banner */}
      <div style={{background:G.surface,borderBottom:`1px solid ${G.border}`,padding:"12px 20px",display:"flex",alignItems:"center",gap:20}}>
        <div>
          <div style={{fontSize:9,color:G.muted,letterSpacing:"0.1em"}}>ÍNDICE DE EFICIENCIA DEL CIRCUITO</div>
          <div style={{fontFamily:G.fontD,fontSize:42,fontWeight:800,color:effColor,lineHeight:1}}>
            {score}<span style={{fontSize:16}}>/100</span>
          </div>
          <div style={{fontSize:10,color:G.muted,marginTop:2}}>cumplimiento P80 · carga circulante · dureza</div>
        </div>
        <div style={{flex:1}}>
          <div style={{height:8,background:G.border,borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${score}%`,background:effColor,borderRadius:4,transition:"width 1s ease"}}/>
          </div>
          <div style={{marginTop:8,fontSize:12,color:G.muted}}>
            {res.bottlenecks.length>0?`⚠ ${res.bottlenecks[0]}`:"✓ Sin bottlenecks detectados"}
          </div>
          <div style={{marginTop:4,fontSize:11,color:res.errColor}}>
            Error estimado: <strong>±{res.errPct}%</strong>
            {(res.inp.curveType==="f80only"||res.inp.curveType==="omit")?" — ingresar curva granulométrica reduce el error":
             res.inp.curveType==="partial"?" — curva parcial (F80+F50)":
             ` — curva con ${(res.inp.curvePoints||[]).filter(p=>p.sizeMm>0).length} puntos`}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${G.border}`,background:G.surface}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 6px",background:"none",border:"none",
            borderBottom:`2px solid ${tab===t.id?G.accent:"transparent"}`,
            color:tab===t.id?G.accent:G.muted,fontSize:11,cursor:"pointer",fontFamily:G.font,letterSpacing:"0.03em"}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{padding:16,maxWidth:840,margin:"0 auto"}}>

        {/* ── TAB EQUIPOS ── */}
        {tab==="equipos"&&(
          <div style={{display:"grid",gap:14}}>
            {evalResult&&(
              <div style={{background:G.card,border:`1px solid ${evalResult.sufficient?G.green:G.red}`,borderRadius:8,padding:16}}>
                <SectionTitle>{evalResult.sufficient?"EQUIPOS SUFICIENTES":"EVALUACIÓN DE TU PARQUE DE EQUIPOS"}</SectionTitle>
                {evalResult.missing.length>0&&(
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:11,color:G.red,marginBottom:6}}>FALTAN:</div>
                    {evalResult.missing.map((m,i)=><div key={i} style={{fontSize:12,color:G.text,marginBottom:4}}>✕ {m}</div>)}
                  </div>
                )}
                {evalResult.excess.length>0&&(
                  <div><div style={{fontSize:11,color:G.accent,marginBottom:6}}>REVISAR:</div>
                    {evalResult.excess.map((e,i)=><div key={i} style={{fontSize:12,color:G.muted,marginBottom:4}}>⚠ {e}</div>)}
                  </div>
                )}
                {evalResult.sufficient&&<div style={{fontSize:12,color:G.green}}>✓ Los equipos declarados son suficientes para el objetivo.</div>}
              </div>
            )}

            {[
              {title:"CHANCADOR PRIMARIO — MANDÍBULA", list:res.eqRec.jaw, color:G.accent,
               note:`CSS requerido: ${sz(res.primary.css)} · P80 salida: ${sz(res.primary.p80)}`},
              {title:"CONO SECUNDARIO", list:res.eqRec.cone, color:G.purple,
               note:`CSS requerido: ${sz(res.secondary.css)} · P80 salida: ${sz(res.secondary.p80)}`},
              ...(res.needsT?[{title:"CONO / VSI TERCIARIO", list:EQ.cone.filter(e=>Number(res.tertiary.css)>=e.cssR[0]&&Number(res.tertiary.css)<=e.cssR[1]).slice(0,3)||EQ.cone.slice(0,2), color:G.cyan,
               note:`CSS requerido: ${sz(res.tertiary.css)} · P80 salida: ${sz(res.tertiary.p80)}`}]:[]),
              ...(showHSI?[{title:"HSI — CHANCADOR DE IMPACTO", list:res.eqRec.hsi, color:G.blue,
               note:`Capacidad requerida: ${res.inp.tph} tph`}]:[]),
              {title:`SELECCIONADORA — ${res.eqRec.is3d?"3 DECK":"2 DECK"}`, list:res.eqRec.screen, color:G.green,
               note:`Carga total: ${(Number(res.inp.tph)+Number(res.screening.over)).toFixed(0)} tph · CC: ${res.screening.ccLoad}%`},
            ].map(sec=>(
              <div key={sec.title} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:14}}>
                <SectionTitle>{sec.title}</SectionTitle>
                <div style={{fontSize:11,color:G.muted,marginBottom:10}}>Parámetros: {sec.note}</div>
                <div style={{display:"grid",gap:8}}>
                  {sec.list.map((eq,i)=>(
                    <div key={eq.model} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
                      padding:"10px 12px",background:i===0?`${G.accentDim}22`:G.faint,borderRadius:6,
                      border:`1px solid ${i===0?sec.color:G.border}`}}>
                      <div>
                        <div style={{fontSize:13,color:i===0?sec.color:G.text,fontWeight:i===0?600:400}}>
                          {eq.brand} {eq.model} {i===0?"✓":""}
                        </div>
                        <div style={{fontSize:10,color:G.muted,marginTop:2}}>{eq.notes}</div>
                      </div>
                      <div style={{textAlign:"right",fontSize:10,color:G.muted,flexShrink:0,marginLeft:10}}>
                        {eq.cssR&&<div>CSS {eq.cssR[0]}–{eq.cssR[1]}mm</div>}
                        {eq.capR&&<div>{eq.capR[0]}–{eq.capR[1]} tph</div>}
                        {eq.decks&&<div>{eq.decks} decks</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{background:G.card,border:`1px solid ${G.green}44`,borderRadius:8,padding:14}}>
              <SectionTitle>MALLAS SELECCIONADORA RECOMENDADAS</SectionTitle>
              <div style={{fontSize:11,color:G.muted,marginBottom:10}}>
                Determinadas según P80 objetivo de los productos ({res.recommendedDecks||1} deck{(res.recommendedDecks||1)>1?"s":""} recomendados)
              </div>
              {[1,2,3].slice(0,res.recommendedDecks||1).map(d=>(
                <div key={d} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"8px 10px",borderRadius:6,background:G.faint,marginBottom:6}}>
                  <span style={{fontSize:12,color:G.muted}}>Deck {d}</span>
                  <span style={{fontSize:15,color:G.green,fontWeight:700,fontFamily:G.fontD}}>
                    {d===1?res.recommendedMesh?.deck1:d===2?res.recommendedMesh?.deck2:res.recommendedMesh?.deck3} mm
                  </span>
                </div>
              ))}
              <div style={{fontSize:10,color:G.muted,marginTop:8,borderTop:`1px solid ${G.border}`,paddingTop:8}}>
                Las aperturas de malla se calculan automáticamente para maximizar eficiencia según el P80 objetivo definido en los productos.
              </div>
            </div>

            {(res.inp.circPath==="manual"||res.inp.circPath==="available")&&(
              <div style={{background:G.card,border:`1px solid ${G.accentDim}`,borderRadius:8,padding:16}}>
                <SectionTitle>SUGERENCIAS DE MEJORA AL CIRCUITO</SectionTitle>
                <div style={{fontSize:12,color:G.text,lineHeight:1.7}}><B t={analysis.variant}/></div>
                {analysis.recs.slice(0,2).map((r,i)=>(
                  <div key={i} style={{fontSize:12,color:G.text,marginTop:8,lineHeight:1.6}}><B t={r}/></div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB RESUMEN ── */}
        {tab==="resumen"&&(
          <div style={{display:"grid",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Kpi label="ENERGÍA ESPECÍFICA" value={res.final.ePerT} unit="kWh/t"
                sub={`Total: ${res.final.eTot} kWh · ${res.inp.tph} tph`} color={G.blue} icon="⚡"/>
              <Kpi label="CARGA CIRCULANTE" value={res.screening.ccLoad} unit="%"
                sub={`${res.screening.over} tph retornadas`}
                color={cc>30?G.red:cc>20?G.accent:G.green} icon="↺"/>
              <Kpi label="ERROR ESTIMADO" value={`±${res.errPct}`} unit="%"
                sub={(res.inp.curveType==="f80only"||res.inp.curveType==="omit")?"Solo F80 ingresado":res.inp.curveType==="partial"?"F80 + F50":`${(res.inp.curvePoints||[]).filter(p=>p.sizeMm>0).length} puntos de curva`}
                color={res.errColor} icon="◎"/>
              <Kpi label="ETAPAS DE CHANCADO" value={res.needsT?"3":"2"} unit="etapas"
                sub={res.needsT?"Mandíbula → Cono → Cono/VSI":"Mandíbula → Cono"}
                color={G.accent} icon="⊞"/>
            </div>
            <div style={{background:`linear-gradient(135deg,${G.card} 0%,${G.card2} 100%)`,border:`1px solid ${G.accentDim}`,borderRadius:8,padding:20}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${G.accent},#d97706)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>◈</div>
                <div>
                  <div style={{fontFamily:G.fontD,fontWeight:700,fontSize:14,color:G.accent}}>KrushRock — Análisis técnico</div>
                  <div style={{fontSize:10,color:G.muted}}>Motor de análisis por reglas · sin API externa · error ±{res.errPct}%</div>
                </div>
              </div>
              <div className="fi" style={{display:"grid",gap:12}}>
                <div style={{fontSize:13,color:G.text,lineHeight:1.75}}><B t={analysis.diag}/></div>
                <div style={{borderTop:`1px solid ${G.border}`,paddingTop:10}}>
                  <div style={{fontSize:10,color:G.accent,letterSpacing:"0.08em",marginBottom:8}}>OBSERVACIONES</div>
                  {analysis.obs.map((o,i)=><div key={i} style={{fontSize:12,color:G.text,lineHeight:1.65,marginBottom:5}}><B t={o}/></div>)}
                </div>
                <div style={{borderTop:`1px solid ${G.border}`,paddingTop:10}}>
                  <div style={{fontSize:10,color:G.accent,letterSpacing:"0.08em",marginBottom:8}}>RECOMENDACIONES</div>
                  {analysis.recs.map((r,i)=><div key={i} style={{fontSize:12,color:G.text,lineHeight:1.65,marginBottom:5}}><B t={r}/></div>)}
                </div>
                <div style={{background:G.faint,borderRadius:6,padding:"9px 13px",fontSize:12,color:G.muted,borderLeft:`3px solid ${G.accent}`}}>
                  {analysis.variant}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB CIRCUITO ── */}
        {tab==="circuito"&&(
          <div style={{display:"grid",gap:14}}>
            <Diagram r={res} unit={unit}/>
            <div style={{display:"grid",gridTemplateColumns:res.needsT?"1fr 1fr 1fr":"1fr 1fr",gap:10}}>
              {[
                {t:"MANDÍBULA (PRIMARIO)",c:G.accent,  items:[["CSS",sz(res.primary.css)],["P80 salida",sz(res.primary.p80)],["Energía",res.primary.energy+" kWh/t"]]},
                {t:"CONO (SECUNDARIO)",   c:G.purple, items:[["CSS",sz(res.secondary.css)],["P80 salida",sz(res.secondary.p80)],["Energía",res.secondary.energy+" kWh/t"]]},
                ...(res.needsT?[{t:"CONO / VSI (TERCIARIO)",c:G.cyan,items:[["CSS",sz(res.tertiary.css)],["P80 salida",sz(res.tertiary.p80)],["Energía",res.tertiary.energy+" kWh/t"]]}]:[]),
              ].map(s=>(
                <div key={s.t} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:14}}>
                  <div style={{fontSize:10,color:s.c,letterSpacing:"0.08em",marginBottom:10}}>● {s.t}</div>
                  {s.items.map(([k,v])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}>
                      <span style={{color:G.muted}}>{k}</span>
                      <span style={{color:s.c}}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <SectionTitle>DATOS POR ETAPA</SectionTitle>
            {[
              {title:"DATOS DE ENTRADA",items:[
                ["Tipo de roca",res.rock.name],
                ["Wi Bond",res.rock.wi+" kWh/t"],
                ["Abrasividad",res.rock.ab],
                ["Densidad",res.rock.den+" t/m³"],
                ["Tonelaje",res.inp.tph+" tph"],
                ["F80 alimentación",sz(res.inp.f80)],
                ["Humedad",humTxt],
                ["Altitud",res.inp.altitudeOmit?"Omitida":res.inp.altitude>0?res.inp.altitude+" m.s.n.m.":"No especificada"],
                ["Curva granulométrica",{f80only:"Solo F80",omit:"Solo F80",partial:"Parcial (F80+F50)",full:`Completa (${(res.inp.curvePoints||[]).filter(p=>p.sizeMm>0).length} puntos)`}[res.inp.curveType]||"Solo F80"],
                ["Error estimado","±"+res.errPct+"%"],
                ["Circuito",cnName],
              ]},
              {title:"BALANCE DE MASAS",items:[
                ["Alimentación fresca",res.inp.tph+" tph"],
                ["Sobre-tamaño retornado",res.screening.over+" tph"],
                ["Carga total seleccionadora",(Number(res.inp.tph)+Number(res.screening.over)).toFixed(0)+" tph"],
                ["Carga circulante",res.screening.ccLoad+" %"],
                ["Eficiencia seleccionadora (estimada)",res.screening.eff+" %"],
              ]},
              {title:"ENERGÍA DEL CIRCUITO",items:[
                ["Etapa primaria (mandíbula)",res.primary.energy+" kWh/t"],
                ["Etapa secundaria (cono)",res.secondary.energy+" kWh/t"],
                ...(res.needsT?[["Etapa terciaria (cono/VSI)",res.tertiary.energy+" kWh/t"]]:[]),
                ["Energía específica total",res.final.ePerT+" kWh/t"],
                ["Energía total por hora",res.final.eTot+" kWh"],
                ["Factor de potencia altitud",(res.altC*100).toFixed(0)+"%"+(res.altM>1500?` (${res.altM}m)`:"")],
              ]},
              {title:"CSS / P80 POR ETAPA",items:[
                ["Mandíbula CSS",sz(res.primary.css)],
                ["Mandíbula P80 salida",sz(res.primary.p80)],
                ["Cono CSS",sz(res.secondary.css)],
                ["Cono P80 salida",sz(res.secondary.p80)],
                ...(res.needsT?[
                  ["Cono/VSI terciario CSS",sz(res.tertiary.css)],
                  ["Cono/VSI P80 salida",sz(res.tertiary.p80)],
                ]:[]),
              ]},
              {title:"CONFIGURACIÓN DE EQUIPOS",items:[
                ["Perfil manto cono", res.conePerfil || "M (por defecto)"],
                ["Decks seleccionadora recomendados", `${res.recommendedDecks || 1}`],
                ["Malla deck 1 recomendada", `${res.recommendedMesh?.deck1 || res.meshMm} mm`],
                ...((res.recommendedDecks||1)>=2?[["Malla deck 2 recomendada",`${res.recommendedMesh?.deck2||"-"} mm`]]:[]),
                ...((res.recommendedDecks||1)>=3?[["Malla deck 3 recomendada",`${res.recommendedMesh?.deck3||"-"} mm`]]:[]),
                ["Palanca mandíbula", res.jawPalanca || "doble (estimado)"],
                ["RPM mandíbula", `${res.jawRpm} RPM`],
                ["RPM cono", `${res.coneRpm} RPM`],
              ]},
            ].map(sec=>(
              <div key={sec.title} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:14}}>
                <SectionTitle>{sec.title}</SectionTitle>
                {sec.items.map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:8,gap:8}}>
                    <span style={{color:G.muted,flexShrink:0}}>{k}</span>
                    <span style={{color:G.text,textAlign:"right"}}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── TAB PRODUCTOS ── */}
        {tab==="productos"&&(
          <div style={{display:"grid",gap:12}}>
            <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:16}}>
              <SectionTitle>DISTRIBUCIÓN DE PRODUCTOS</SectionTitle>
              <div style={{fontSize:12,color:G.muted,marginBottom:14}}>
                Alimentación: {res.inp.tph} tph
                {(res.inp.curveType==="f80only"||res.inp.curveType==="omit")&&<span style={{color:G.accent}}> · ⚠ distribución estimada (error ±{res.errPct}%)</span>}
                {res.inp.curveType==="partial"&&<span style={{color:G.accent}}> · curva parcial (error ±{res.errPct}%)</span>}
                {res.inp.curveType==="full"&&<span style={{color:G.green}}> · curva ingresada (error ±{res.errPct}%)</span>}
              </div>
              {res.products.map((p,i)=>{
                const pct=Number(p.yldPct);
                const cols=[G.accent,G.cyan,G.purple,G.green];
                const c=cols[i%cols.length];
                const pLabel=p.label||(p.minMm===0&&p.maxMm>=9999)?"Todo":p.label||`Producto ${i+1}`;
                return (
                  <div key={p.id} style={{marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                      <span style={{color:G.text}}>{pLabel}</span>
                      <span style={{color:c,fontWeight:600}}>{p.tphOut} tph · {pct}%</span>
                    </div>
                    <div style={{height:8,background:G.border,borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:c,borderRadius:4,transition:"width .8s ease"}}/>
                    </div>
                    <div style={{fontSize:10,color:G.muted,marginTop:3}}>
                      {fromMm(p.minMm,unit)} – {fromMm(p.maxMm,unit)} {ul}
                    </div>
                  </div>
                );
              })}
            </div>
            {res.bottlenecks.length>0&&(
              <div style={{background:G.card,border:`1px solid ${G.redDim||"#7f1d1d"}`,borderRadius:8,padding:14}}>
                <SectionTitle>BOTTLENECKS</SectionTitle>
                {res.bottlenecks.map((b,i)=><div key={i} style={{fontSize:12,color:G.text,marginBottom:5}}>⚠ {b}</div>)}
              </div>
            )}
          </div>
        )}


        {/* ── TAB PRODUCCIÓN ── */}
        {tab==="produccion"&&(
          <div style={{display:"grid",gap:14}}>

            {/* Parámetros operacionales */}
            <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:16}}>
              <SectionTitle>PARÁMETROS OPERACIONALES</SectionTitle>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div>
                  <div style={{fontSize:11,color:G.muted,marginBottom:6}}>Horas por turno</div>
                  <div style={{display:"flex",gap:6}}>
                    {[8,10,12].map(h=>(
                      <button key={h} onClick={()=>setHorasTurno(h)} style={{flex:1,padding:"8px 4px",borderRadius:6,cursor:"pointer",
                        border:`1px solid ${horasTurno===h?G.accent:G.border}`,
                        background:horasTurno===h?`${G.accentDim}33`:G.faint,
                        color:horasTurno===h?G.accent:G.muted,fontSize:13,fontFamily:G.font}}>
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,color:G.muted,marginBottom:6}}>Turnos por día</div>
                  <div style={{display:"flex",gap:6}}>
                    {[1,2,3].map(t=>(
                      <button key={t} onClick={()=>setTurnosDia(t)} style={{flex:1,padding:"8px 4px",borderRadius:6,cursor:"pointer",
                        border:`1px solid ${turnosDia===t?G.accent:G.border}`,
                        background:turnosDia===t?`${G.accentDim}33`:G.faint,
                        color:turnosDia===t?G.accent:G.muted,fontSize:13,fontFamily:G.font}}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,color:G.muted,marginBottom:6}}>Días operativos / semana</div>
                  <div style={{display:"flex",gap:6}}>
                    {[5,6,7].map(d=>(
                      <button key={d} onClick={()=>setDiasSemana(d)} style={{flex:1,padding:"8px 4px",borderRadius:6,cursor:"pointer",
                        border:`1px solid ${diasSemana===d?G.accent:G.border}`,
                        background:diasSemana===d?`${G.accentDim}33`:G.faint,
                        color:diasSemana===d?G.accent:G.muted,fontSize:13,fontFamily:G.font}}>
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",justifyContent:"center"}}>
                  <div style={{fontSize:11,color:G.muted}}>Horas operativas / día</div>
                  <div style={{fontFamily:G.fontD,fontWeight:700,fontSize:24,color:G.accent,lineHeight:1.2}}>{horasDia}h</div>
                  <div style={{fontSize:10,color:G.muted}}>{horasTurno}h × {turnosDia} turno(s)</div>
                </div>
                <div>
                  <div style={{fontSize:11,color:G.muted,marginBottom:5}}>Disponibilidad mecánica: <strong style={{color:G.accent}}>{dispMec}%</strong></div>
                  <input type="range" min={50} max={100} step={1} value={dispMec} onChange={e=>setDispMec(Number(e.target.value))}/>
                  <div style={{fontSize:10,color:G.muted,marginTop:2}}>Tiempo mecánico disponible (paradas programadas y fallas)</div>
                </div>
                <div>
                  <div style={{fontSize:11,color:G.muted,marginBottom:5}}>Utilización operacional: <strong style={{color:G.accent}}>{utilOp}%</strong></div>
                  <input type="range" min={50} max={100} step={1} value={utilOp} onChange={e=>setUtilOp(Number(e.target.value))}/>
                  <div style={{fontSize:10,color:G.muted,marginTop:2}}>Fracción de tiempo disponible en que se produce efectivamente</div>
                </div>
              </div>
              <div style={{marginTop:14,padding:"10px 14px",background:G.faint,borderRadius:6,display:"flex",flexWrap:"wrap",gap:20,fontSize:12}}>
                <span style={{color:G.muted}}>Factor efectivo: <strong style={{color:G.accent}}>{(factorEf*100).toFixed(0)}%</strong></span>
                <span style={{color:G.muted}}>TPH nominal: <strong style={{color:G.text}}>{tphNominal} tph</strong></span>
                <span style={{color:G.muted}}>TPH efectivo: <strong style={{color:G.green}}>{tphEfectivo.toFixed(1)} tph</strong></span>
                <span style={{color:G.muted}}>~{Math.round(diasPorMes)} días operativos/mes</span>
              </div>
            </div>

            <SectionTitle>PROYECCIONES DE PRODUCCIÓN</SectionTitle>

            {/* Selector de modo */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[
                {v:"produccion",l:"Producción",s:"¿Cuánto voy a producir?"},
                {v:"deadline",  l:"Deadline",  s:"¿Puedo cumplir una meta?"},
                {v:"campana",   l:"Campaña",   s:"Optimizar por producto"},
              ].map(m=>(
                <button key={m.v} onClick={()=>setProdMode(m.v)} style={{
                  padding:"12px 14px",borderRadius:8,cursor:"pointer",textAlign:"left",
                  background:prodMode===m.v?`${G.accentDim}33`:G.card,
                  border:`1px solid ${prodMode===m.v?G.accent:G.border}`,
                }}>
                  <div style={{fontSize:13,color:prodMode===m.v?G.accent:G.text,fontWeight:600}}>{m.l}</div>
                  <div style={{fontSize:10,color:G.muted,marginTop:2}}>{m.s}</div>
                </button>
              ))}
            </div>

            {/* ─── MODO PRODUCCIÓN ─── */}
            {prodMode==="produccion"&&(
              <>
                <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:16}}>
                  <SectionTitle>HORIZONTE DE SIMULACIÓN</SectionTitle>
                  <div style={{textAlign:"center",marginBottom:10}}>
                    <span style={{fontFamily:G.fontD,fontWeight:800,fontSize:48,color:G.accent}}>{horizMes}</span>
                    <span style={{fontSize:18,color:G.muted,marginLeft:10}}>meses</span>
                  </div>
                  <input type="range" min={1} max={24} step={1} value={horizMes} onChange={e=>setHorizMes(Number(e.target.value))}/>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:G.muted,marginTop:4,marginBottom:12}}>
                    <span>1</span><span>6</span><span>12</span><span>18</span><span>24 meses</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:5}}>
                    {[1,2,3,6,12,24].map(m=>(
                      <button key={m} onClick={()=>setHorizMes(m)} style={{padding:"6px 4px",borderRadius:6,cursor:"pointer",
                        border:`1px solid ${horizMes===m?G.accent:G.border}`,
                        background:horizMes===m?`${G.accentDim}33`:G.faint,
                        color:horizMes===m?G.accent:G.muted,fontSize:11,fontFamily:G.font}}>
                        {m}m
                      </button>
                    ))}
                  </div>
                  <div style={{fontSize:10,color:G.muted,marginTop:8}}>
                    Definido en el wizard — puedes ajustarlo aquí para comparar escenarios.
                  </div>
                </div>

                {/* KPIs producción */}
                <div style={{background:`linear-gradient(135deg,${G.card},${G.card2})`,border:`2px solid ${G.green}`,borderRadius:10,padding:20,textAlign:"center"}}>
                  <div style={{fontSize:11,color:G.muted,letterSpacing:"0.1em",marginBottom:6}}>PRODUCCIÓN TOTAL EN {horizMes} {horizMes===1?"MES":"MESES"}</div>
                  <div style={{fontFamily:G.fontD,fontWeight:800,fontSize:52,color:G.green,lineHeight:1}}>
                    {fmtTon(tonHorizonte)}
                  </div>
                  <div style={{fontSize:12,color:G.muted,marginTop:6}}>{Math.round(tonHorizonte).toLocaleString()} toneladas totales</div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <Kpi label="TON / MES" value={fmtTon(tonPorMes)} unit=""
                    sub={`${Math.round(diasPorMes)} días op. × ${horasDia}h × ${tphEfectivo.toFixed(1)} tph`}
                    color={G.accent} icon="◈"/>
                  <Kpi label="TON / SEMANA" value={fmtTon(tonPorSemana)} unit=""
                    sub={`${diasSemana} días operativos`} color={G.purple} icon="⊞"/>
                  <Kpi label="TON / DÍA" value={fmtTon(tonPorDia)} unit=""
                    sub={`${horasDia}h efectivas`} color={G.blue} icon="◆"/>
                  <Kpi label="TPH EFECTIVO" value={tphEfectivo.toFixed(1)} unit="tph"
                    sub={`${tphNominal} nominal × ${(factorEf*100).toFixed(0)}%`}
                    color={G.green} icon="⚡"/>
                </div>

                {/* Tabla por fracción */}
                <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:14}}>
                  <SectionTitle>DESGLOSE POR FRACCIÓN — {horizMes} {horizMes===1?"MES":"MESES"}</SectionTitle>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                      <thead>
                        <tr style={{borderBottom:`1px solid ${G.border}`}}>
                          <th style={{color:G.muted,padding:"6px 8px",textAlign:"left",fontSize:10,letterSpacing:"0.06em"}}>FRACCIÓN</th>
                          <th style={{color:G.muted,padding:"6px 8px",textAlign:"right",fontSize:10}}>TPH ef.</th>
                          <th style={{color:G.muted,padding:"6px 8px",textAlign:"right",fontSize:10}}>TON/MES</th>
                          <th style={{color:G.muted,padding:"6px 8px",textAlign:"right",fontSize:10}}>TOTAL {horizMes}M</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prodsEf.map((p,i)=>{
                          const cols=[G.accent,G.cyan,G.purple,G.green];
                          const c=cols[i%cols.length];
                          const pLabel=p.label||(p.minMm===0&&p.maxMm>=9999?"Todo":`Producto ${i+1}`);
                          return (
                            <tr key={p.id} style={{borderBottom:`1px solid ${G.border}22`}}>
                              <td style={{padding:"8px",color:c}}>
                                {pLabel}
                                <div style={{fontSize:9,color:G.muted}}>{fromMm(p.minMm,unit)}–{fromMm(p.maxMm,unit)} {ul} · {p.yldPct}%</div>
                              </td>
                              <td style={{padding:"8px",textAlign:"right",color:G.text}}>{p.tphEf}</td>
                              <td style={{padding:"8px",textAlign:"right",color:G.text}}>{p.tonMes.toLocaleString()}</td>
                              <td style={{padding:"8px",textAlign:"right",fontWeight:600,color:c}}>{p.tonHor.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                        <tr style={{borderTop:`1px solid ${G.border}`,background:G.faint}}>
                          <td style={{padding:"8px",color:G.accent,fontWeight:600,fontSize:12}}>TOTAL PLANTA</td>
                          <td style={{padding:"8px",textAlign:"right",color:G.accent,fontWeight:600}}>{tphEfectivo.toFixed(1)}</td>
                          <td style={{padding:"8px",textAlign:"right",color:G.accent,fontWeight:600}}>{Math.round(tonPorMes).toLocaleString()}</td>
                          <td style={{padding:"8px",textAlign:"right",fontWeight:700,color:G.green,fontSize:14}}>{Math.round(tonHorizonte).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ─── MODO DEADLINE ─── */}
            {prodMode==="deadline"&&(
              <>
                <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:16}}>
                  <SectionTitle>META DE PRODUCCIÓN</SectionTitle>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div>
                      <div style={{fontSize:11,color:G.muted,marginBottom:5}}>Toneladas objetivo (total planta)</div>
                      <input type="number" value={deadlineTon} min={1000} step={1000}
                        onChange={e=>setDeadlineTon(Math.max(1000,Number(e.target.value)))}/>
                      <div style={{fontSize:10,color:G.muted,marginTop:4}}>{(deadlineTon/1000).toFixed(0)}k ton totales</div>
                    </div>
                    <div>
                      <div style={{fontSize:11,color:G.muted,marginBottom:5}}>Plazo máximo (meses)</div>
                      <input type="number" value={deadlineMes} min={1} max={60} step={1}
                        onChange={e=>setDeadlineMes(Math.max(1,Number(e.target.value)))}/>
                      <div style={{display:"flex",gap:4,marginTop:6}}>
                        {[1,3,6,12].map(m=>(
                          <button key={m} onClick={()=>setDeadlineMes(m)} style={{flex:1,padding:"5px 2px",borderRadius:5,cursor:"pointer",
                            border:`1px solid ${deadlineMes===m?G.accent:G.border}`,
                            background:deadlineMes===m?`${G.accentDim}33`:G.faint,
                            color:deadlineMes===m?G.accent:G.muted,fontSize:11,fontFamily:G.font}}>
                            {m}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resultado cumplimiento */}
                <div style={{background:cumple?`${G.green}11`:`${G.redDim}33`,
                  border:`2px solid ${cumple?G.green:G.red}`,borderRadius:10,padding:22,textAlign:"center"}}>
                  <div style={{fontFamily:G.fontD,fontWeight:800,fontSize:38,color:cumple?G.green:G.red,marginBottom:6}}>
                    {cumple?"✓ CUMPLE":"✕ NO CUMPLE"}
                  </div>
                  <div style={{fontSize:13,color:G.muted,maxWidth:480,margin:"0 auto"}}>
                    {cumple
                      ? `La planta producirá ${fmtTon(tphEfectivo*horasDeadline)} en ${deadlineMes} meses — ${(pctCap-100).toFixed(0)}% sobre la meta. Tiempo real estimado: ${mesesParaMeta.toFixed(1)} meses.`
                      : `Necesitas ${tphNomReq.toFixed(0)} tph nominales, dispones de ${tphNominal} tph. Déficit: ${(tphNomReq-tphNominal).toFixed(0)} tph.`}
                  </div>
                </div>

                {/* KPIs deadline */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <Kpi label="TPH REQUERIDO (nominal)" value={tphNomReq.toFixed(0)} unit="tph"
                    sub={`efectivo necesario: ${tphEfReq.toFixed(1)} tph`}
                    color={cumple?G.green:G.red} icon="⚡"/>
                  <Kpi label="CAPACIDAD DISPONIBLE" value={pctCap.toFixed(0)} unit="%"
                    sub={cumple?"Margen positivo":"Capacidad insuficiente"}
                    color={cumple?G.green:G.red} icon="◎"/>
                  <Kpi label="TIEMPO REAL ESTIMADO" value={mesesParaMeta.toFixed(1)} unit="meses"
                    sub={mesesParaMeta<=deadlineMes?"Dentro del plazo":"Supera el plazo"}
                    color={mesesParaMeta<=deadlineMes?G.green:G.red} icon="→"/>
                  <Kpi label="PRODUCCIÓN EN PLAZO" value={fmtTon(tphEfectivo*horasDeadline)} unit=""
                    sub={`de ${(deadlineTon/1000).toFixed(0)}k ton objetivo`}
                    color={cumple?G.green:G.accent} icon="⊞"/>
                </div>

                {/* Análisis de brecha si no cumple */}
                {!cumple&&(
                  <div style={{background:G.card,border:`1px solid ${G.red}`,borderRadius:8,padding:16}}>
                    <SectionTitle>ANÁLISIS DE BRECHA</SectionTitle>
                    <div style={{display:"grid",gap:8,fontSize:12,color:G.text,lineHeight:1.7}}>
                      <div>⚠ Déficit de capacidad: <strong style={{color:G.red}}>{(tphNomReq-tphNominal).toFixed(0)} tph nominales</strong> ({((tphNomReq/tphNominal-1)*100).toFixed(0)}% más de lo disponible)</div>
                      <div>→ Para cumplir la meta en {deadlineMes} meses con el equipo actual, necesitas {(tphNomReq/tphNominal*100-100).toFixed(0)}% más de capacidad instalada.</div>
                      <div>→ Alternativa A: extender el plazo a <strong style={{color:G.accent}}>{mesesParaMeta.toFixed(1)} meses</strong> con la planta actual.</div>
                      <div>→ Alternativa B: aumentar disponibilidad mecánica o utilización (factor actual: {(factorEf*100).toFixed(0)}%).</div>
                      <div>→ Alternativa C: incorporar un segundo equipo o circuito paralelo.</div>
                    </div>
                  </div>
                )}

                {/* Tabla por fracción en plazo */}
                <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:14}}>
                  <SectionTitle>DESGLOSE POR FRACCIÓN — {deadlineMes} {deadlineMes===1?"MES":"MESES"}</SectionTitle>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                      <thead>
                        <tr style={{borderBottom:`1px solid ${G.border}`}}>
                          <th style={{color:G.muted,padding:"6px 8px",textAlign:"left",fontSize:10,letterSpacing:"0.06em"}}>FRACCIÓN</th>
                          <th style={{color:G.muted,padding:"6px 8px",textAlign:"right",fontSize:10}}>TPH ef.</th>
                          <th style={{color:G.muted,padding:"6px 8px",textAlign:"right",fontSize:10}}>TON/MES</th>
                          <th style={{color:G.muted,padding:"6px 8px",textAlign:"right",fontSize:10}}>TOTAL {deadlineMes}M</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prodsEf.map((p,i)=>{
                          const cols=[G.accent,G.cyan,G.purple,G.green];
                          const c=cols[i%cols.length];
                          const pLabel=p.label||(p.minMm===0&&p.maxMm>=9999?"Todo":`Producto ${i+1}`);
                          return (
                            <tr key={p.id} style={{borderBottom:`1px solid ${G.border}22`}}>
                              <td style={{padding:"8px",color:c}}>
                                {pLabel}
                                <div style={{fontSize:9,color:G.muted}}>{fromMm(p.minMm,unit)}–{fromMm(p.maxMm,unit)} {ul} · {p.yldPct}%</div>
                              </td>
                              <td style={{padding:"8px",textAlign:"right",color:G.text}}>{p.tphEf}</td>
                              <td style={{padding:"8px",textAlign:"right",color:G.text}}>{p.tonMes.toLocaleString()}</td>
                              <td style={{padding:"8px",textAlign:"right",fontWeight:600,color:c}}>{p.tonDL.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                        <tr style={{borderTop:`1px solid ${G.border}`,background:G.faint}}>
                          <td style={{padding:"8px",color:cumple?G.green:G.red,fontWeight:600,fontSize:12}}>TOTAL PLANTA</td>
                          <td style={{padding:"8px",textAlign:"right",color:G.accent,fontWeight:600}}>{tphEfectivo.toFixed(1)}</td>
                          <td style={{padding:"8px",textAlign:"right",color:G.accent,fontWeight:600}}>{Math.round(tonPorMes).toLocaleString()}</td>
                          <td style={{padding:"8px",textAlign:"right",fontWeight:700,color:cumple?G.green:G.red,fontSize:14}}>{Math.round(tphEfectivo*horasDeadline).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{marginTop:10,fontSize:11,color:G.muted,textAlign:"right"}}>
                    Meta: {deadlineTon.toLocaleString()} ton · Diferencia: <strong style={{color:cumple?G.green:G.red}}>
                      {cumple?"+":""}{Math.round(tphEfectivo*horasDeadline-deadlineTon).toLocaleString()} ton
                    </strong>
                  </div>
                </div>
              </>
            )}

            {/* ─── MODO CAMPAÑA ─── */}
            {prodMode==="campana"&&(
              <>
                {/* Inputs por producto */}
                <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:16}}>
                  <SectionTitle>OBJETIVO DE TONELADAS POR PRODUCTO</SectionTitle>
                  <div style={{fontSize:11,color:G.muted,marginBottom:12}}>
                    Ingresa la meta de toneladas para cada fracción. Deja en 0 las que no tienen meta.
                  </div>
                  <div style={{display:"grid",gap:8}}>
                    {prodsEf.map((p,i)=>{
                      const cols=[G.accent,G.cyan,G.purple,G.green];
                      const c=cols[i%cols.length];
                      const pLabel=p.label||(p.minMm===0&&p.maxMm>=9999?"Todo":`${fromMm(p.minMm,unit)}–${fromMm(p.maxMm,unit)} ${ul}`);
                      const target=Number(prodTargets[p.id]||0);
                      const mesesEst=target>0&&Number(p.tphEf)>0?target/(Number(p.tphEf)*horasPorMes):0;
                      return (
                        <div key={p.id} style={{background:G.faint,border:`1px solid ${target>0?c:G.border}`,
                          borderRadius:8,padding:12,display:"grid",gridTemplateColumns:"1fr auto",gap:10,alignItems:"center"}}>
                          <div>
                            <div style={{fontSize:13,color:c,fontWeight:600}}>{pLabel}</div>
                            <div style={{fontSize:10,color:G.muted,marginTop:2}}>
                              {p.yldPct}% del feed · {p.tphEf} tph ef. · {fmtTon(p.tonMes)}/mes
                              {target>0&&mesesEst>0&&<span style={{color:G.accent}}> · estimado sin optimizar: {mesesEst.toFixed(1)} m</span>}
                            </div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <input type="number" value={target||""} min={0} step={1000} placeholder="ton"
                              onChange={e=>setProdTargets(pt=>({...pt,[p.id]:Math.max(0,Number(e.target.value))}))}
                              style={{width:100,textAlign:"right"}}/>
                            <span style={{fontSize:11,color:G.muted}}>ton</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sin targets */}
                {!hasTargets&&(
                  <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,
                    padding:28,textAlign:"center",color:G.muted}}>
                    <div style={{fontSize:28,marginBottom:10}}>◈</div>
                    <div style={{fontSize:13}}>Ingresa al menos un objetivo de toneladas para calcular la campaña</div>
                  </div>
                )}

                {/* Resultados de campaña */}
                {campaignPhases&&campaignPhases.length>0&&(()=>{
                  const totalMeses = campaignTotalHours/horasPorMes;
                  const unoptMeses = campaignUnoptH/horasPorMes;
                  const ahorroMeses = Math.max(0, unoptMeses - totalMeses);
                  const hayCSSChanges = campaignPhases.some(ph=>ph.nextCSS!==null&&Math.abs(ph.nextCSS-ph.cssUsed)>0.1);
                  return (
                    <>
                      {/* Banner resumen */}
                      <div style={{background:`linear-gradient(135deg,${G.card},${G.card2})`,
                        border:`2px solid ${G.green}`,borderRadius:10,padding:20}}>
                        <div style={{fontSize:10,color:G.muted,letterSpacing:"0.08em",marginBottom:6}}>DURACIÓN TOTAL DE CAMPAÑA</div>
                        <div style={{display:"flex",alignItems:"baseline",gap:16,flexWrap:"wrap"}}>
                          <div>
                            <span style={{fontFamily:G.fontD,fontWeight:800,fontSize:44,color:G.green}}>{totalMeses.toFixed(1)}</span>
                            <span style={{fontSize:16,color:G.muted,marginLeft:8}}>meses con optimización</span>
                          </div>
                          {ahorroMeses>0.05&&(
                            <div style={{fontSize:12,color:G.muted}}>
                              Sin optimizar: <strong style={{color:G.accent}}>{unoptMeses.toFixed(1)} m</strong>
                              <span style={{color:G.green,marginLeft:8}}>→ Ahorro: <strong>{ahorroMeses.toFixed(1)} meses</strong></span>
                            </div>
                          )}
                        </div>
                        {hayCSSChanges&&(
                          <div style={{fontSize:11,color:G.muted,marginTop:8,borderTop:`1px solid ${G.border}`,paddingTop:8}}>
                            La optimización incluye cambios de CSS en el cono entre fases para maximizar el rendimiento de los productos pendientes.
                          </div>
                        )}
                      </div>

                      {/* Timeline de fases */}
                      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:16}}>
                        <SectionTitle>LÍNEA DE TIEMPO — PLAN DE CAMPAÑA</SectionTitle>
                        <div style={{display:"grid",gap:0}}>
                          {campaignPhases.map((ph,i)=>{
                            const phaseMeses = ph.phaseHours/horasPorMes;
                            const accMeses   = ph.accHours/horasPorMes;
                            const hasCSSChange = ph.nextCSS!==null&&Math.abs(ph.nextCSS-ph.cssUsed)>0.1;
                            const hasTertSugg  = ph.removeTertSuggestion!==null&&ph.removeTertSuggestion?.benefitPct>2;
                            const completingP  = ph.completing.map(c=>prodsEf.find(p=>p.id===c.id)).filter(Boolean);
                            const isLast       = i===campaignPhases.length-1;

                            return (
                              <div key={ph.phaseNum}>
                                {/* Tarjeta de fase */}
                                <div style={{background:G.faint,border:`1px solid ${G.border}`,
                                  borderRadius: hasCSSChange||hasTertSugg?"8px 8px 0 0":"8px",
                                  padding:14, marginBottom:(hasCSSChange||hasTertSugg)?0:10}}>
                                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                                    <div style={{flex:1}}>
                                      <div style={{fontSize:12,color:G.accent,fontWeight:600,marginBottom:6}}>
                                        Fase {ph.phaseNum} — CSS Cono: {ph.cssUsed}mm
                                      </div>
                                      {completingP.map((p,j)=>{
                                        const cols=[G.accent,G.cyan,G.purple,G.green];
                                        const c=cols[prodsEf.indexOf(p)%cols.length];
                                        const pLbl=p.label||(p.minMm===0&&p.maxMm>=9999?"Todo":`${fromMm(p.minMm,unit)}–${fromMm(p.maxMm,unit)} ${ul}`);
                                        return (
                                          <div key={j} style={{fontSize:12,color:c,marginBottom:2}}>
                                            ✓ <strong>{pLbl}</strong> — meta lograda: {(prodTargets[p.id]||0).toLocaleString()} ton
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div style={{textAlign:"right",flexShrink:0}}>
                                      <div style={{fontFamily:G.fontD,fontWeight:700,fontSize:22,color:G.text}}>{phaseMeses.toFixed(2)} m</div>
                                      <div style={{fontSize:10,color:G.muted}}>Acumulado: {accMeses.toFixed(2)} meses</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Bloque de optimización */}
                                {(hasCSSChange||hasTertSugg)&&!isLast&&(
                                  <div style={{background:`${G.accent}0e`,
                                    border:`1px dashed ${G.accent}`,borderRadius:"0 0 8px 8px",
                                    padding:"10px 14px",marginBottom:10}}>
                                    {hasCSSChange&&(
                                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:hasTertSugg?8:0}}>
                                        <span style={{fontSize:20,color:G.accent}}>↓</span>
                                        <div style={{fontSize:12,color:G.text}}>
                                          <strong style={{color:G.accent}}>Ajuste recomendado:</strong>{" "}
                                          Cambiar CSS cono de <strong>{ph.cssUsed}mm</strong> → <strong style={{color:G.green}}>{ph.nextCSS}mm</strong>
                                          {ph.cssImprovement>2&&(
                                            <span style={{color:G.green}}>{" — "}ahorro ~{ph.cssImprovement.toFixed(0)}% en siguiente fase</span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {hasTertSugg&&(
                                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                                        <span style={{fontSize:20,color:G.cyan}}>✂</span>
                                        <div style={{fontSize:12,color:G.text}}>
                                          <strong style={{color:G.cyan}}>Eliminar etapa terciaria:</strong>{" "}
                                          Los productos finos ya alcanzaron su meta. Retirar VSI/cono terciario libera capacidad
                                          {ph.removeTertSuggestion.benefitPct>2&&(
                                            <span style={{color:G.cyan}}>{" — "}mejora estimada: ~{ph.removeTertSuggestion.benefitPct.toFixed(0)}% más rápido en fase siguiente</span>
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
                          <div style={{background:`${G.green}15`,border:`1px solid ${G.green}`,
                            borderRadius:8,padding:14,textAlign:"center"}}>
                            <div style={{fontSize:13,color:G.green,fontWeight:600}}>
                              ✓ Todos los objetivos cumplidos en {(campaignTotalHours/horasPorMes).toFixed(1)} meses
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tabla resumen */}
                      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:14}}>
                        <SectionTitle>TABLA RESUMEN DE CAMPAÑA</SectionTitle>
                        <div style={{overflowX:"auto"}}>
                          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                            <thead>
                              <tr style={{borderBottom:`1px solid ${G.border}`}}>
                                <th style={{color:G.muted,padding:"5px 8px",textAlign:"left",fontSize:10}}>FASE</th>
                                <th style={{color:G.muted,padding:"5px 8px",textAlign:"right",fontSize:10}}>CSS</th>
                                <th style={{color:G.muted,padding:"5px 8px",textAlign:"right",fontSize:10}}>DURACIÓN</th>
                                <th style={{color:G.muted,padding:"5px 8px",textAlign:"right",fontSize:10}}>ACUMULADO</th>
                                <th style={{color:G.muted,padding:"5px 8px",textAlign:"left",fontSize:10}}>PRODUCTO COMPLETADO</th>
                              </tr>
                            </thead>
                            <tbody>
                              {campaignPhases.map(ph=>{
                                const cpProds = ph.completing.map(c=>prodsEf.find(p=>p.id===c.id)).filter(Boolean);
                                return (
                                  <tr key={ph.phaseNum} style={{borderBottom:`1px solid ${G.border}22`}}>
                                    <td style={{padding:"7px 8px",color:G.accent,fontWeight:600}}>Fase {ph.phaseNum}</td>
                                    <td style={{padding:"7px 8px",textAlign:"right",color:G.text}}>{ph.cssUsed}mm</td>
                                    <td style={{padding:"7px 8px",textAlign:"right",color:G.text}}>{(ph.phaseHours/horasPorMes).toFixed(2)} m</td>
                                    <td style={{padding:"7px 8px",textAlign:"right",color:G.green,fontWeight:600}}>{(ph.accHours/horasPorMes).toFixed(2)} m</td>
                                    <td style={{padding:"7px 8px",color:G.muted,fontSize:11}}>
                                      {cpProds.map((p,j)=>{
                                        const pLbl=p.label||(p.minMm===0&&p.maxMm>=9999?"Todo":`${fromMm(p.minMm,unit)}–${fromMm(p.maxMm,unit)} ${ul}`);
                                        return <span key={j}>{j>0?", ":""}{pLbl}</span>;
                                      })}
                                      {ph.nextCSS!==null&&Math.abs(ph.nextCSS-ph.cssUsed)>0.1&&(
                                        <span style={{color:G.accent}}> → CSS {ph.nextCSS}mm</span>
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

      </div>
    </div>
  );
}

// ── APP ────────────────────────────────────────────────────────────────────
export default function App(){
  const [res,setRes]         = useState(null);
  const [replayRes,setReplayRes] = useState(null);
  const [unit,setUnit] = useState("mm");

  // Historial en localStorage — máx 50 simulaciones
  const [savedSims,setSavedSims] = useState(()=>{
    try{return JSON.parse(localStorage.getItem("krushrock_sims")||"[]");}catch{return [];}
  });

  const saveSim=(cliente,proyecto,notas)=>{
    if(!res) return;
    const entry={
      id:Date.now().toString(),
      fecha:new Date().toISOString(),
      cliente,proyecto,notas,
      // resumen para mostrar en historial
      rockName:res.rock.name, tph:res.inp.tph,
      score:Number(res.final.score), errPct:res.errPct,
      p80:res.final.p80, p80T:res.p80T, circActual:res.circActual,
      plazoMeses:res.inp.plazoMeses||1,
      // datos completos para referencia
      inp:res.inp,
      primary:res.primary, secondary:res.secondary, tertiary:res.tertiary,
      screening:res.screening, final:res.final,
      products:res.products, bottlenecks:res.bottlenecks,
      errColor:res.errColor, needsT:res.needsT, feedOk:res.feedOk,
      recommendedMesh:res.recommendedMesh, recommendedDecks:res.recommendedDecks,
    };
    const updated=[entry,...savedSims].slice(0,50);
    setSavedSims(updated);
    try{localStorage.setItem("krushrock_sims",JSON.stringify(updated));}catch{}
  };

  const deleteSim=(id)=>{
    const updated=savedSims.filter(s=>s.id!==id);
    setSavedSims(updated);
    try{localStorage.setItem("krushrock_sims",JSON.stringify(updated));}catch{}
  };

  if(replayRes!==null)
    return <Results res={replayRes} unit={replayRes.inp?.unit||"mm"} onReset={()=>setReplayRes(null)} onSave={saveSim}/>;

  if(!res) return (
    <Onboarding
      onDone={inp=>{setUnit(inp.unit||"mm");setRes(simulate(inp));}}
      onReplay={setReplayRes}
      savedSims={savedSims}
      onDeleteSim={deleteSim}
    />
  );
  return <Results res={res} unit={unit} onReset={()=>setRes(null)} onSave={saveSim}/>;
}
