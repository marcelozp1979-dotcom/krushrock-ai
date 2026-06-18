import { useState, useRef, useCallback, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  bg:        "#08090f",
  surface:   "#0e1118",
  card:      "#141924",
  cardHov:   "#1c2535",
  border:    "#232d42",
  borderHi:  "#3a4f70",
  amber:     "#f59e0b",
  amberDim:  "#78350f",
  amberSoft: "#92400e",
  green:     "#10b981",
  greenDim:  "#064e3b",
  red:       "#ef4444",
  blue:      "#3b82f6",
  purple:    "#8b5cf6",
  cyan:      "#06b6d4",
  text:      "#dde3f0",
  muted:     "#56647a",
  faint:     "#2a3548",
  mono:      "'Martian Mono', 'Fira Mono', monospace",
  display:   "'Anybody', sans-serif",
};

const INJECT = `
@import url('https://fonts.googleapis.com/css2?family=Anybody:wght@400;600;700;800;900&family=Martian+Mono:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:${T.bg};color:${T.text};font-family:${T.mono};min-height:100vh}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:${T.surface}}
::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
input[type=range]{-webkit-appearance:none;width:100%;height:4px;background:${T.border};border-radius:2px;outline:none;cursor:pointer}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${T.amber};cursor:pointer}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes flowDash{to{stroke-dashoffset:-12}}
@keyframes glow{0%,100%{box-shadow:0 0 8px ${T.amber}44}50%{box-shadow:0 0 18px ${T.amber}88}}
.fu{animation:fadeUp .35s ease forwards}
.pulse{animation:pulse 1.4s ease infinite}
.flow-line{stroke-dasharray:6 3;animation:flowDash .6s linear infinite}
`;

// ─────────────────────────────────────────────────────────────────────────────
// BIBLIOTECA DE EQUIPOS MÓVILES — CHILE
// Datos basados en especificaciones técnicas publicadas de cada fabricante
// ─────────────────────────────────────────────────────────────────────────────
const EQUIPMENT_DB = {
  // ── CHANCADORES PRIMARIOS (Mandíbula) ────────────────────────────────────
  jaw: [
    // POWERSCREEN
    {
      id: "ps_premiertrak_1180", brand: "Powerscreen", model: "Premiertrak 1180",
      type: "jaw", category: "primary",
      specs: { feedOpen: [1070,760], cssRange: [75,175], maxFeed: 650,
        capRange: [200,400], weight: 56000, engine: "CAT C13 328kW", mobile: true },
      curves: { css: [75,100,125,150,175], tph: [200,270,320,370,400], p80factor: [3.2,3.4,3.5,3.6,3.7] },
      notes: "Mandíbula 1070×760mm. Muy usada en minería mediana Chile.",
      color: T.amber,
    },
    {
      id: "ps_premiertrak_600", brand: "Powerscreen", model: "Premiertrak 600",
      type: "jaw", category: "primary",
      specs: { feedOpen: [1200,820], cssRange: [90,200], maxFeed: 800,
        capRange: [350,600], weight: 72000, engine: "CAT C18 522kW", mobile: true },
      curves: { css: [90,120,150,175,200], tph: [350,430,500,560,600], p80factor: [3.2,3.4,3.5,3.6,3.7] },
      notes: "Alta capacidad. Mandíbula 1200×820mm. Áridos y minería.",
      color: T.amber,
    },
    // KLEEMANN
    {
      id: "kleemann_mc110", brand: "Kleemann", model: "MOBICAT MC 110i EVO2",
      type: "jaw", category: "primary",
      specs: { feedOpen: [1100,700], cssRange: [70,150], maxFeed: 520,
        capRange: [200,350], weight: 48000, engine: "CAT C9.3B 261kW", mobile: true },
      curves: { css: [70,90,110,130,150], tph: [200,260,300,330,350], p80factor: [3.1,3.3,3.4,3.5,3.6] },
      notes: "Tecnología SPECTIVE. Control digital integrado.",
      color: T.cyan,
    },
    {
      id: "kleemann_mc120", brand: "Kleemann", model: "MOBICAT MC 120i PRO",
      type: "jaw", category: "primary",
      specs: { feedOpen: [1200,800], cssRange: [80,180], maxFeed: 650,
        capRange: [280,450], weight: 62000, engine: "MAN D2676 353kW", mobile: true },
      curves: { css: [80,110,140,160,180], tph: [280,350,400,430,450], p80factor: [3.2,3.4,3.5,3.6,3.7] },
      notes: "Serie PRO con sistema antiatasco hidráulico.",
      color: T.cyan,
    },
    // FINLAY — línea completa con datos de ficha técnica oficial
    {
      id: "finlay_j960", brand: "Finlay", model: "J-960",
      type: "jaw", category: "primary",
      // Fuente: Terex Finlay brochure J-960 — mandíbula 900×600mm, peso 28t
      specs: { feedOpen: [900,600], cssRange: [50,150], maxFeed: 400,
        capRange: [100,250], weight: 28000, engine: "CAT C7.1 168kW", mobile: true },
      curves: { css: [50,75,100,125,150], tph: [100,150,195,225,250], p80factor: [3.0,3.2,3.4,3.5,3.6] },
      notes: "Más compacto de la gama Finlay. Ideal operadores pequeños/medianos. Drive directo con función antiatasco.",
      color: T.green,
    },
    {
      id: "finlay_j1160", brand: "Finlay", model: "J-1160",
      type: "jaw", category: "primary",
      // Fuente: Terex Finlay brochure J-1160 — mandíbula 1000×600mm, CSS 40–145mm, peso 35.35t
      specs: { feedOpen: [1000,600], cssRange: [40,145], maxFeed: 520,
        capRange: [180,350], weight: 35350, engine: "Hidrostático CAT C9 224kW", mobile: true },
      curves: { css: [50,75,100,120,145], tph: [180,240,290,325,350], p80factor: [3.1,3.3,3.4,3.5,3.6] },
      notes: "Drive hidrostático con reversa. CSS 40–145mm. VGF velocidad variable. 35.35t.",
      color: T.green,
    },
    {
      id: "finlay_j1175", brand: "Finlay", model: "J-1175",
      type: "jaw", category: "primary",
      specs: { feedOpen: [1100,762], cssRange: [75,150], maxFeed: 560,
        capRange: [220,380], weight: 50000, engine: "CAT C9 224kW", mobile: true },
      curves: { css: [75,100,125,140,150], tph: [220,290,340,365,380], p80factor: [3.1,3.3,3.4,3.5,3.6] },
      notes: "Mandíbula 1100×762mm. Fácil transporte entre faenas.",
      color: T.green,
    },
    {
      id: "finlay_j1280", brand: "Finlay", model: "J-1280",
      type: "jaw", category: "primary",
      // Fuente: Technical Specification Finlay J1280 — mandíbula 1200×820mm, CSS 75–200mm, peso 68.875t
      specs: { feedOpen: [1200,820], cssRange: [75,200], maxFeed: 750,
        capRange: [300,500], weight: 68875, engine: "Scania DC13 331kW (450hp)", mobile: true },
      curves: { css: [75,100,125,150,175,200], tph: [300,370,420,460,485,500], p80factor: [3.2,3.4,3.5,3.6,3.7,3.8] },
      notes: "Nuevo 2023. Mandíbula 1200×820mm. Puente entre J-1175 y J-1480. 68.9t. Drive directo vía clutch.",
      color: T.green,
    },
    {
      id: "finlay_j1480", brand: "Finlay", model: "J-1480",
      type: "jaw", category: "primary",
      // Fuente: Technical Specification Finlay J1480 — mandíbula JW55 1415×820mm, CSS 85–225mm, cap hasta 750tph, peso 79.45t
      specs: { feedOpen: [1415,820], cssRange: [85,225], maxFeed: 900,
        capRange: [400,750], weight: 79450, engine: "Scania DC13 331kW (450hp)", mobile: true },
      curves: { css: [85,110,140,175,200,225], tph: [400,490,570,640,700,750], p80factor: [3.3,3.4,3.5,3.6,3.7,3.8] },
      notes: "Mayor mandíbula Finlay. Jaques JW55 1415×820mm. Hasta 750 tph. Pre-criba independiente. 79.45t.",
      color: T.green,
    },
    // SANDVIK
    {
      id: "sandvik_uj440i", brand: "Sandvik", model: "UJ440i",
      type: "jaw", category: "primary",
      specs: { feedOpen: [1200,830], cssRange: [80,200], maxFeed: 750,
        capRange: [300,500], weight: 67000, engine: "Volvo D13 324kW", mobile: true },
      curves: { css: [80,110,140,170,200], tph: [300,380,440,480,500], p80factor: [3.2,3.4,3.5,3.6,3.8] },
      notes: "Control remoto Sandvik My Fleet. Alta disponibilidad.",
      color: T.blue,
    },
    // METSO
    {
      id: "metso_lt120", brand: "Metso", model: "Lokotrack LT120",
      type: "jaw", category: "primary",
      specs: { feedOpen: [1200,870], cssRange: [90,200], maxFeed: 800,
        capRange: [400,650], weight: 78000, engine: "CAT C18 522kW", mobile: true },
      curves: { css: [90,120,150,175,200], tph: [400,490,560,610,650], p80factor: [3.3,3.4,3.5,3.6,3.8] },
      notes: "Ícono del sector. Probado en múltiples minas Chile.",
      color: T.red,
    },
    // ASTEC
    {
      id: "astec_gt440", brand: "Astec", model: "GT440",
      type: "jaw", category: "primary",
      specs: { feedOpen: [1067,762], cssRange: [75,150], maxFeed: 550,
        capRange: [200,360], weight: 49000, engine: "John Deere 6135 261kW", mobile: true },
      curves: { css: [75,100,120,140,150], tph: [200,270,315,345,360], p80factor: [3.1,3.3,3.4,3.5,3.6] },
      notes: "Robusto para áridos. Soporte técnico en Chile.",
      color: T.purple,
    },
  ],

  // ── CHANCADORES SECUNDARIOS / TERCIARIOS (Cono) ──────────────────────────
  cone: [
    // POWERSCREEN
    {
      id: "ps_1000maxtrak", brand: "Powerscreen", model: "1000 Maxtrak",
      type: "cone", category: "secondary",
      specs: { chamberType: "Automax 1000", cssRange: [6,44], maxFeed: 185,
        capRange: [90,280], weight: 38000, engine: "CAT C9 224kW", mobile: true },
      curves: { css: [6,10,16,22,32,44], tph: [90,130,180,220,260,280], p80factor: [2.8,3.0,3.2,3.5,3.8,4.0] },
      notes: "Automax chamber ø1000mm. Excelente para piedra partida fina.",
      color: T.amber,
    },
    {
      id: "ps_1300maxtrak", brand: "Powerscreen", model: "1300 Maxtrak",
      type: "cone", category: "secondary",
      specs: { chamberType: "Automax 1300", cssRange: [8,50], maxFeed: 220,
        capRange: [130,380], weight: 52000, engine: "CAT C13 328kW", mobile: true },
      curves: { css: [8,13,19,25,38,50], tph: [130,190,250,300,350,380], p80factor: [2.8,3.0,3.2,3.5,3.8,4.0] },
      notes: "Alta producción áridos y minería. Muy difundida en Chile.",
      color: T.amber,
    },
    // KLEEMANN
    {
      id: "kleemann_mco90", brand: "Kleemann", model: "MOBICONE MCO 90i EVO2",
      type: "cone", category: "secondary",
      specs: { chamberType: "Cono excéntrico ø900mm", cssRange: [8,30], maxFeed: 170,
        capRange: [80,250], weight: 36000, engine: "CAT C9.3B 261kW", mobile: true },
      curves: { css: [8,12,18,24,30], tph: [80,120,170,210,250], p80factor: [2.8,3.0,3.2,3.5,3.8] },
      notes: "Integración perfecta con MOBICAT. Proceso continuo.",
      color: T.cyan,
    },
    {
      id: "kleemann_mco110", brand: "Kleemann", model: "MOBICONE MCO 110i PRO",
      type: "cone", category: "secondary",
      specs: { chamberType: "Cono PRO ø1100mm", cssRange: [10,44], maxFeed: 215,
        capRange: [120,350], weight: 50000, engine: "MAN D2676 353kW", mobile: true },
      curves: { css: [10,16,22,32,44], tph: [120,180,240,300,350], p80factor: [2.9,3.1,3.3,3.6,3.9] },
      notes: "Sistema SPECTIVE con diagnóstico en tiempo real.",
      color: T.cyan,
    },
    // FINLAY — cono completo
    {
      id: "finlay_c1540", brand: "Finlay", model: "C-1540",
      type: "cone", category: "secondary",
      specs: { chamberType: "Finlay 1000 ø1000mm", cssRange: [8,38], maxFeed: 185,
        capRange: [90,270], weight: 38000, engine: "CAT C9 224kW", mobile: true },
      curves: { css: [8,13,19,25,38], tph: [90,135,185,225,270], p80factor: [2.8,3.0,3.2,3.5,3.8] },
      notes: "Cono ø1000mm. Metal detection con purge system. Ampliamente usado en Chile.",
      color: T.green,
    },
    {
      id: "finlay_c1545", brand: "Finlay", model: "C-1545",
      type: "cone", category: "secondary",
      // Fuente: Finlay C-1545 Technical Spec — cono ø1150mm (45"), CSS 14–45mm fino / 18–45mm M.Coarse, maxFeed 180–205mm, 43.44t, CAT C13 328kW
      specs: { chamberType: "Terex TC1150 ø1150mm", cssRange: [14,45], maxFeed: 205,
        capRange: [150,400], weight: 43440, engine: "CAT C13 328kW / Scania DC13 331kW", mobile: true },
      curves: { css: [14,18,22,28,36,45], tph: [150,195,245,300,360,400], p80factor: [2.9,3.1,3.2,3.5,3.7,3.9] },
      notes: "Cono ø1150mm (45\"). 3 configuraciones cámara: fino/medio-grueso/extra-grueso. Tramp relief automático. 43.44t.",
      color: T.green,
    },
    {
      id: "finlay_c1550", brand: "Finlay", model: "C-1550",
      type: "cone", category: "secondary",
      // Fuente: Terex Finlay C-1550 — cono Terex 1300 ø1300mm, hasta 64.5t, CSS mayor que C-1545, hasta 450+ tph
      specs: { chamberType: "Terex 1300 ø1300mm", cssRange: [16,50], maxFeed: 240,
        capRange: [200,500], weight: 64500, engine: "CAT C13 328kW / Scania DC13 331kW", mobile: true },
      curves: { css: [16,22,28,36,44,50], tph: [200,265,320,390,455,500], p80factor: [3.0,3.2,3.3,3.6,3.8,4.0] },
      notes: "Mayor cono Finlay móvil. Terex 1300 ø1300mm. Drive variable con clutch. Minería superficial y áridos alta producción. 64.5t.",
      color: T.green,
    },
    // SANDVIK
    {
      id: "sandvik_uc440i", brand: "Sandvik", model: "UC440i",
      type: "cone", category: "secondary",
      specs: { chamberType: "Hidrocono CH440 ø1100mm", cssRange: [6,44], maxFeed: 200,
        capRange: [100,340], weight: 42000, engine: "Scania DC13 317kW", mobile: true },
      curves: { css: [6,10,16,25,38,44], tph: [100,150,210,270,320,340], p80factor: [2.8,3.0,3.2,3.5,3.8,4.0] },
      notes: "Automatización ASRi. Control de densidad de carga.",
      color: T.blue,
    },
    // METSO
    {
      id: "metso_lt220d", brand: "Metso", model: "Lokotrack LT220D",
      type: "cone", category: "secondary",
      specs: { chamberType: "HP200 ø1100mm", cssRange: [8,48], maxFeed: 215,
        capRange: [120,400], weight: 58000, engine: "CAT C13 328kW", mobile: true },
      curves: { css: [8,13,19,25,38,48], tph: [120,185,255,310,370,400], p80factor: [2.9,3.1,3.3,3.5,3.8,4.0] },
      notes: "Cono HP200 + criba integrada. Doble función en una planta.",
      color: T.red,
    },
    // ASTEC
    {
      id: "astec_kodiak_k300", brand: "Astec", model: "Kodiak K300+",
      type: "cone", category: "secondary",
      specs: { chamberType: "K300 ø1000mm fino/grueso", cssRange: [6,38], maxFeed: 180,
        capRange: [85,280], weight: 36000, engine: "Cummins QSX15 391kW", mobile: true },
      curves: { css: [6,10,16,22,32,38], tph: [85,130,180,220,260,280], p80factor: [2.8,3.0,3.2,3.5,3.8,4.0] },
      notes: "Cámara intercambiable fino/medio/grueso.",
      color: T.purple,
    },
  ],

  // ── CRIBAS (ex Zarandas) ─────────────────────────────────────────────────
  screen: [
    // POWERSCREEN
    {
      id: "ps_chieftain_1700", brand: "Powerscreen", model: "Chieftain 1700",
      type: "screen", category: "screening",
      // Equiv. Finlay 683 2-deck — área media, 2 decks
      specs: { decks: 2, screenArea: [4.8,1.5], maxFeed: 500,
        capRange: [120,400], weight: 24000, engine: "CAT C4.4 74kW", mobile: true },
      curves: { apertures: [10,20,40,80], efficiency: [91,89,87,85] },
      notes: "Equiv. Finlay 683. 2 decks 4.8×1.5m. Operadores pequeños/medianos. Áridos y reciclaje.",
      color: T.amber,
    },
    {
      id: "ps_chieftain_2100x", brand: "Powerscreen", model: "Chieftain 2100X",
      type: "screen", category: "screening",
      // Equiv. Finlay 684T 2-deck — pantalla alta producción, 2 decks
      specs: { decks: 2, screenArea: [6.1,1.8], maxFeed: 600,
        capRange: [180,550], weight: 34700, engine: "CAT C4.4 97kW", mobile: true },
      curves: { apertures: [10,20,40,80], efficiency: [92,90,88,86] },
      notes: "Equiv. Finlay 684T 2-deck. 2 decks 6.1×1.8m. Stroke/ángulo/velocidad ajustables. 34.7t.",
      color: T.amber,
    },
    {
      id: "ps_chieftain_2200x", brand: "Powerscreen", model: "Chieftain 2200X",
      type: "screen", category: "screening",
      // Equiv. Finlay 694 3-deck — alta producción, 3 decks
      specs: { decks: 3, screenArea: [6.1,2.0], maxFeed: 700,
        capRange: [200,600], weight: 32000, engine: "CAT C4.4 97kW", mobile: true },
      curves: { apertures: [10,20,40,80], efficiency: [93,91,89,87] },
      notes: "Equiv. Finlay 694 3-deck. 3 decks 6.1×2.0m. Alta producción. Conveyor recirculante plegable.",
      color: T.amber,
    },
    {
      id: "ps_warrior_2400", brand: "Powerscreen", model: "Warrior 2400",
      type: "screen", category: "screening",
      // Equiv. Finlay 696 3-deck — criba pesada de alta capacidad
      specs: { decks: 3, screenArea: [6.1,1.52], maxFeed: 800,
        capRange: [250,650], weight: 35000, engine: "CAT C4.4 97kW", mobile: true },
      curves: { apertures: [10,20,40,80], efficiency: [93,91,89,87] },
      notes: "Equiv. Finlay 696 3-deck. Criba pesada 6.1×1.52m. Feeds grandes desde chancador. Alta capacidad.",
      color: T.amber,
    },
    // KLEEMANN
    {
      id: "kleemann_ms702", brand: "Kleemann", model: "MOBISCREEN MS 702i EVO",
      type: "screen", category: "screening",
      // Equiv. Finlay 683 2-deck
      specs: { decks: 2, screenArea: [5.0,1.5], maxFeed: 500,
        capRange: [120,380], weight: 22000, engine: "CAT C4.4 74kW", mobile: true },
      curves: { apertures: [10,20,40,80], efficiency: [91,89,87,85] },
      notes: "Equiv. Finlay 683. 2 decks. Ángulo ajustable hidráulicamente 15–20°.",
      color: T.cyan,
    },
    {
      id: "kleemann_ms703", brand: "Kleemann", model: "MOBISCREEN MS 703i EVO",
      type: "screen", category: "screening",
      // Equiv. Finlay 684T / 694 3-deck
      specs: { decks: 3, screenArea: [7.0,1.5], maxFeed: 650,
        capRange: [180,550], weight: 30000, engine: "CAT C4.4 97kW", mobile: true },
      curves: { apertures: [10,20,40,80], efficiency: [93,91,89,87] },
      notes: "Equiv. Finlay 694 3-deck. Triple deck 7.0×1.5m. Regulación ángulo hidráulica.",
      color: T.cyan,
    },
    {
      id: "kleemann_ms952", brand: "Kleemann", model: "MOBISCREEN MS 952i EVO",
      type: "screen", category: "screening",
      // Equiv. Finlay 696 3-deck — criba grande
      specs: { decks: 3, screenArea: [9.0,1.5], maxFeed: 900,
        capRange: [300,750], weight: 38000, engine: "CAT C4.4 97kW", mobile: true },
      curves: { apertures: [10,20,40,80], efficiency: [94,92,90,88] },
      notes: "Equiv. Finlay 696. Mayor criba Kleemann. 9.0×1.5m triple deck. Alta producción minería.",
      color: T.cyan,
    },
    // FINLAY — línea completa cribas
    {
      id: "finlay_683", brand: "Finlay", model: "683 — 2 deck",
      type: "screen", category: "screening",
      // Fuente: Technical Spec 683 — deck sup 3.66×1.52m, deck inf 3.00×1.52m, CAT C4.4 83kW, peso 24.25t
      specs: { decks: 2, screenArea: [3.66,1.52], maxFeed: 400,
        capRange: [100,350], weight: 24250, engine: "CAT C4.4 83kW", mobile: true },
      curves: { apertures: [10,20,40,80], efficiency: [91,89,87,85] },
      notes: "2 decks: 3.66×1.52m (sup) + 3.00×1.52m (inf). Ángulo ajustable 18–39°. Orugas o ruedas. 24.25t.",
      color: T.green,
    },
    {
      id: "finlay_684t", brand: "Finlay", model: "684T — 2 deck",
      type: "screen", category: "screening",
      // Finlay 684 2-deck — 4.3×1.7m decks, portátil
      specs: { decks: 2, screenArea: [4.3,1.7], maxFeed: 500,
        capRange: [150,450], weight: 27000, engine: "CAT C4.4 97kW", mobile: true },
      curves: { apertures: [10,20,40,80], efficiency: [92,90,88,86] },
      notes: "2 decks 4.3×1.7m. Portátil de fácil transporte. Rápido setup y desmontaje. Áridos y reciclaje.",
      color: T.green,
    },
    {
      id: "finlay_694_3deck", brand: "Finlay", model: "694 — 3 deck",
      type: "screen", category: "screening",
      // Fuente: Finlay 694 — 2 decks superiores 6.1×1.53m + deck inferior 5.55×1.53m, 3 decks
      specs: { decks: 3, screenArea: [6.1,1.53], maxFeed: 700,
        capRange: [200,600], weight: 32000, engine: "CAT C4.4 97kW / Eléctrico", mobile: true },
      curves: { apertures: [10,20,40,80], efficiency: [93,91,89,87] },
      notes: "3 decks: 2×6.1×1.53m (sup/med) + 5.55×1.53m (inf). Alta producción. Hybrid eléctrico/diesel disponible.",
      color: T.green,
    },
    {
      id: "finlay_696_3deck", brand: "Finlay", model: "696 — 3 deck",
      type: "screen", category: "screening",
      // Finlay 696 — mayor criba de la gama, 3 decks alta energía
      specs: { decks: 3, screenArea: [6.1,1.52], maxFeed: 850,
        capRange: [250,700], weight: 36000, engine: "CAT C7.1 168kW / Eléctrico", mobile: true },
      curves: { apertures: [10,20,40,80], efficiency: [94,92,90,88] },
      notes: "Mayor criba Finlay. 3 decks alta energía 6.1×1.52m. Minería, áridos y carbón alta producción. Hybrid disponible.",
      color: T.green,
    },
    // SANDVIK
    {
      id: "sandvik_ss3516", brand: "Sandvik", model: "SS3516",
      type: "screen", category: "screening",
      // Equiv. Finlay 683 2-deck
      specs: { decks: 2, screenArea: [5.5,1.5], maxFeed: 550,
        capRange: [150,450], weight: 26000, engine: "Volvo D5 105kW", mobile: true },
      curves: { apertures: [10,20,40,80], efficiency: [92,90,88,86] },
      notes: "Equiv. Finlay 684T. Doble deck. Integración nativa con conos Sandvik.",
      color: T.blue,
    },
    // METSO
    {
      id: "metso_st2_8", brand: "Metso", model: "Lokotrack ST2.8",
      type: "screen", category: "screening",
      // Equiv. Finlay 694 3-deck
      specs: { decks: 3, screenArea: [6.0,1.8], maxFeed: 700,
        capRange: [200,650], weight: 35000, engine: "CAT C7.1 168kW", mobile: true },
      curves: { apertures: [10,20,40,80], efficiency: [94,92,90,88] },
      notes: "Equiv. Finlay 694. 3 decks 6.0×1.8m. Alta eficiencia. Muy usado áridos y minería Chile.",
      color: T.red,
    },
    {
      id: "metso_st620", brand: "Metso", model: "Lokotrack ST620",
      type: "screen", category: "screening",
      // Equiv. Finlay 696 3-deck — criba grande
      specs: { decks: 3, screenArea: [6.2,2.0], maxFeed: 900,
        capRange: [300,800], weight: 40000, engine: "CAT C9 224kW", mobile: true },
      curves: { apertures: [10,20,40,80], efficiency: [94,92,90,88] },
      notes: "Equiv. Finlay 696. Mayor criba Metso Lokotrack. 6.2×2.0m triple deck. Minería y cantera.",
      color: T.red,
    },
  ],

  // ── SCALPERS / GRIZZLIES ─────────────────────────────────────────────────
  scalper: [
    // POWERSCREEN
    {
      id: "ps_warrior_1800", brand: "Powerscreen", model: "Warrior 1800",
      type: "scalper", category: "prescreening",
      specs: { decks: 2, screenArea: [5.5,1.5], maxFeed: 800,
        capRange: [250,700], weight: 26000, engine: "CAT C4.4 97kW", mobile: true },
      curves: { apertures: [40,80,120], efficiency: [89,87,85] },
      notes: "Scalper pesado 2 decks 5.5×1.5m. Pre-clasificación material grueso y pegajoso.",
      color: T.amber,
    },
    {
      id: "ps_warrior_2100", brand: "Powerscreen", model: "Warrior 2100",
      type: "scalper", category: "prescreening",
      specs: { decks: 3, screenArea: [4.88,1.52], maxFeed: 1000,
        capRange: [300,900], weight: 32000, engine: "CAT C4.4 97kW", mobile: true },
      curves: { apertures: [40,80,120], efficiency: [90,88,86] },
      notes: "Triple shaft technology. 3 decks 4.88×1.52m. Alta aceleración de criba.",
      color: T.amber,
    },
    // KLEEMANN
    {
      id: "kleemann_msr702", brand: "Kleemann", model: "MOBISCREEN MSR 702i EVO",
      type: "scalper", category: "prescreening",
      specs: { decks: 2, screenArea: [7.0,2.0], maxFeed: 1000,
        capRange: [300,900], weight: 28000, engine: "CAT C4.4 97kW", mobile: true },
      curves: { apertures: [40,80,120], efficiency: [90,88,86] },
      notes: "Rocker screen 7.0×2.0m. Ideal pre-chancado primario con mucho fino o arcillas.",
      color: T.cyan,
    },
    // FINLAY — scalpers
    {
      id: "finlay_883plus", brand: "Finlay", model: "883+ Scalper",
      type: "scalper", category: "prescreening",
      specs: { decks: 2, screenArea: [5.0,1.52], maxFeed: 900,
        capRange: [250,800], weight: 22000, engine: "CAT C4.4 74kW", mobile: true },
      curves: { apertures: [40,80,120], efficiency: [88,86,84] },
      notes: "Grizzly vibrante + scalper 2 decks. Separa tierras y finos antes del primario.",
      color: T.green,
    },
    {
      id: "finlay_893plus_scalper", brand: "Finlay", model: "893+ Scalper",
      type: "scalper", category: "prescreening",
      specs: { decks: 3, screenArea: [5.5,1.52], maxFeed: 1100,
        capRange: [350,1000], weight: 28000, engine: "CAT C4.4 97kW", mobile: true },
      curves: { apertures: [40,80,120], efficiency: [90,88,86] },
      notes: "Scalper 3 decks alta capacidad. Aplicaciones áridos, minería y demolición.",
      color: T.green,
    },
    // SANDVIK
    {
      id: "sandvik_sf5000", brand: "Sandvik", model: "SF5000",
      type: "scalper", category: "prescreening",
      specs: { decks: 2, screenArea: [5.0,1.5], maxFeed: 900,
        capRange: [250,750], weight: 24000, engine: "Scania DC9 246kW", mobile: true },
      curves: { apertures: [40,80,120], efficiency: [89,87,85] },
      notes: "Scalper 2 decks. Integración flota Sandvik. Telemetría My Fleet.",
      color: T.blue,
    },
    // METSO
    {
      id: "metso_st3_5", brand: "Metso", model: "Lokotrack ST3.5",
      type: "scalper", category: "prescreening",
      specs: { decks: 2, screenArea: [5.5,1.8], maxFeed: 1000,
        capRange: [300,900], weight: 32000, engine: "CAT C7.1 168kW", mobile: true },
      curves: { apertures: [40,80,120], efficiency: [90,88,86] },
      notes: "Scalper Lokotrack 5.5×1.8m. Alta capacidad. Muy usado minería Chile.",
      color: T.red,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MOTOR DE SIMULACIÓN v2
// ─────────────────────────────────────────────────────────────────────────────
const ROCK_DB = {
  granito:   { wi: 15.5, ab: 0.28, den: 2.70, name: "Granito" },
  caliza:    { wi: 11.2, ab: 0.12, den: 2.60, name: "Caliza" },
  cobre:     { wi: 14.0, ab: 0.22, den: 2.75, name: "Mineral de Cobre" },
  basalto:   { wi: 17.0, ab: 0.35, den: 2.90, name: "Basalto" },
  cuarcita:  { wi: 19.5, ab: 0.45, den: 2.65, name: "Cuarcita" },
  arenisca:  { wi:  9.5, ab: 0.08, den: 2.30, name: "Arenisca" },
  porfido:   { wi: 16.0, ab: 0.30, den: 2.72, name: "Pórfido Cuprífero" },
};

function interpolate(xs, ys, x) {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length-1]) return ys[ys.length-1];
  for (let i = 0; i < xs.length-1; i++) {
    if (x >= xs[i] && x <= xs[i+1]) {
      const t = (x - xs[i]) / (xs[i+1] - xs[i]);
      return ys[i] + t * (ys[i+1] - ys[i]);
    }
  }
  return ys[ys.length-1];
}

function simulateCircuit(nodes, connections, globalInputs) {
  const { tph, f80, p80Target, rockType, humidity } = globalInputs;
  const rock = ROCK_DB[rockType] || ROCK_DB.granito;
  const results = {};
  let currentF80 = f80;
  let currentTph = tph;

  // Ordenar nodos por tipo de proceso
  const order = ["scalper","jaw","cone","screen"];
  const sorted = [...nodes].sort((a,b) => order.indexOf(a.type) - order.indexOf(b.type));

  for (const node of sorted) {
    const eq = node.equipment;
    if (!eq) continue;

    if (node.type === "jaw" || node.type === "cone") {
      const cssOpt = Math.max(eq.specs.cssRange[0],
        Math.min(eq.specs.cssRange[1], p80Target * (node.type==="jaw" ? 0.18 : 0.14)));
      const capFromCurve = interpolate(eq.curves.css, eq.curves.tph, cssOpt);
      const p80factor = interpolate(eq.curves.css, eq.curves.p80factor, cssOpt);
      const p80out = cssOpt * p80factor;
      const energyBond = 10 * rock.wi * (1/Math.sqrt(p80out) - 1/Math.sqrt(currentF80));
      const utilization = Math.min(100, (currentTph / capFromCurve) * 100);
      results[node.id] = {
        css: cssOpt.toFixed(0), capNominal: capFromCurve.toFixed(0),
        capReal: Math.min(currentTph, capFromCurve).toFixed(0),
        p80in: currentF80.toFixed(0), p80out: p80out.toFixed(0),
        energy: Math.max(0, energyBond).toFixed(2),
        utilization: utilization.toFixed(0),
        rr: (currentF80 / p80out).toFixed(1),
        status: utilization > 95 ? "overload" : utilization > 80 ? "ok" : "underload",
      };
      currentF80 = p80out;
    }

    if (node.type === "screen" || node.type === "scalper") {
      const aperture = p80Target * 0.9;
      const eff = interpolate(eq.curves.apertures, eq.curves.efficiency, aperture) / 100;
      const humPenalty = humidity * 0.015;
      const effReal = Math.max(0.7, eff - humPenalty);
      const oversize = currentTph * (1 - effReal) * 0.4;
      const circLoad = (oversize / tph) * 100;
      results[node.id] = {
        aperture: aperture.toFixed(0),
        efficiency: (effReal * 100).toFixed(1),
        oversize: oversize.toFixed(0),
        circLoad: circLoad.toFixed(1),
        status: circLoad > 35 ? "overload" : circLoad > 20 ? "ok" : "ok",
      };
    }
  }

  // P80 final y score
  const lastCone = sorted.filter(n=>n.type==="cone").pop();
  const lastScreen = sorted.filter(n=>n.type==="screen").pop();
  const finalP80 = lastCone ? Number(results[lastCone.id]?.p80out || currentF80) : currentF80;
  const finalCircLoad = lastScreen ? Number(results[lastScreen.id]?.circLoad || 0) : 0;
  const p80Gap = Math.abs(finalP80 - p80Target) / p80Target;
  const effScore = Math.max(0, Math.min(100, 100 - finalCircLoad*0.7 - p80Gap*60 - rock.ab*15));

  const bottlenecks = sorted
    .filter(n => results[n.id]?.status === "overload")
    .map(n => n.equipment?.model || n.type);

  return { nodeResults: results, finalP80: finalP80.toFixed(0), circLoad: finalCircLoad.toFixed(1), effScore: effScore.toFixed(0), bottlenecks, rock, tph, p80Target };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES UI
// ─────────────────────────────────────────────────────────────────────────────
const brandColors = {
  Powerscreen: T.amber, Kleemann: T.cyan, Finlay: T.green,
  Sandvik: T.blue, Metso: T.red, Astec: T.purple,
};
const typeIcons = { jaw:"⬛", cone:"🔺", screen:"⊞", scalper:"◫" };
const typeLabels = { jaw:"Mandíbula", cone:"Cono", screen:"Criba", scalper:"Scalper" };

function Pill({ color, children, small }) {
  return <span style={{
    background: color+"22", color, border:`1px solid ${color}55`,
    padding: small?"1px 7px":"3px 10px", borderRadius:3,
    fontSize: small?9:10, fontFamily:T.mono, letterSpacing:"0.05em",
    whiteSpace:"nowrap"
  }}>{children}</span>;
}

function StatusDot({ status }) {
  const c = status==="overload"?T.red:status==="underload"?T.muted:T.green;
  return <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:c,marginRight:5}} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL BIBLIOTECA
// ─────────────────────────────────────────────────────────────────────────────
function EquipmentLibrary({ onDrop }) {
  const [tab, setTab] = useState("jaw");
  const [brandFilter, setBrandFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const tabs = [
    {id:"jaw", label:"Mandíbula"},
    {id:"cone", label:"Cono"},
    {id:"screen", label:"Criba"},
    {id:"scalper", label:"Scalper"},
  ];
  const brands = ["all","Powerscreen","Kleemann","Finlay","Sandvik","Metso","Astec"];
  const items = (EQUIPMENT_DB[tab]||[]).filter(e => brandFilter==="all" || e.brand===brandFilter);

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:T.surface,borderRight:`1px solid ${T.border}`}}>
      {/* Header biblioteca */}
      <div style={{padding:"14px 14px 10px",borderBottom:`1px solid ${T.border}`}}>
        <div style={{fontFamily:T.display,fontWeight:700,fontSize:13,color:T.amber,letterSpacing:"0.05em"}}>
          BIBLIOTECA
        </div>
        <div style={{fontSize:9,color:T.muted,marginTop:2}}>Arrastra equipos al canvas →</div>
      </div>

      {/* Tabs tipo */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1,padding:"8px 2px",background:"none",border:"none",
            borderBottom:`2px solid ${tab===t.id?T.amber:"transparent"}`,
            color:tab===t.id?T.amber:T.muted,fontSize:9,cursor:"pointer",
            fontFamily:T.mono,letterSpacing:"0.04em",transition:"all .2s"
          }}>{t.label}</button>
        ))}
      </div>

      {/* Filtro marca */}
      <div style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:4,flexWrap:"wrap"}}>
        {brands.map(b=>(
          <button key={b} onClick={()=>setBrandFilter(b)} style={{
            background:brandFilter===b?(brandColors[b]||T.amber)+"33":"none",
            border:`1px solid ${brandFilter===b?(brandColors[b]||T.amber):T.border}`,
            color:brandFilter===b?(brandColors[b]||T.amber):T.muted,
            borderRadius:3,padding:"2px 6px",fontSize:8,cursor:"pointer",
            fontFamily:T.mono
          }}>{b==="all"?"TODAS":b.toUpperCase()}</button>
        ))}
      </div>

      {/* Lista equipos */}
      <div style={{flex:1,overflowY:"auto",padding:"8px 8px"}}>
        {items.map(eq=>(
          <div key={eq.id}
            draggable
            onDragStart={e=>e.dataTransfer.setData("equipment", JSON.stringify(eq))}
            style={{
              background: expanded===eq.id?T.cardHov:T.card,
              border:`1px solid ${expanded===eq.id?eq.color:T.border}`,
              borderRadius:6, marginBottom:6, cursor:"grab",
              transition:"all .2s", overflow:"hidden"
            }}>
            {/* Header equipo */}
            <div style={{padding:"9px 10px",display:"flex",alignItems:"center",gap:8}}
              onClick={()=>setExpanded(expanded===eq.id?null:eq.id)}>
              <div style={{
                width:28,height:28,borderRadius:4,flexShrink:0,
                background:eq.color+"22",border:`1px solid ${eq.color}44`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:14
              }}>{typeIcons[eq.type]}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,color:eq.color,fontWeight:500,fontFamily:T.mono,
                  whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {eq.model}
                </div>
                <div style={{fontSize:9,color:T.muted}}>{eq.brand}</div>
              </div>
              <div style={{fontSize:9,color:T.muted}}>{expanded===eq.id?"▲":"▼"}</div>
            </div>

            {/* Specs expandidas */}
            {expanded===eq.id && (
              <div style={{padding:"0 10px 10px",borderTop:`1px solid ${T.border}`}} className="fu">
                <div style={{fontSize:9,color:T.muted,marginTop:8,marginBottom:4}}>ESPECIFICACIONES</div>
                {eq.type!=="screen"&&eq.type!=="scalper"&&[
                  ["Apertura", `${eq.specs.feedOpen?eq.specs.feedOpen.join("×"):"-"} mm`],
                  ["CSS", `${eq.specs.cssRange[0]}–${eq.specs.cssRange[1]} mm`],
                  ["Cap.", `${eq.specs.capRange[0]}–${eq.specs.capRange[1]} tph`],
                  ["Motor", eq.specs.engine],
                  ["Peso", (eq.specs.weight/1000).toFixed(0)+" t"],
                ].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:9,
                    padding:"2px 0",borderBottom:`1px solid ${T.faint}`}}>
                    <span style={{color:T.muted}}>{k}</span>
                    <span style={{color:T.text}}>{v}</span>
                  </div>
                ))}
                {(eq.type==="screen"||eq.type==="scalper")&&[
                  ["Decks", eq.specs.decks],
                  ["Área", `${eq.specs.screenArea?.join("×")||"-"} m`],
                  ["Cap.", `${eq.specs.capRange[0]}–${eq.specs.capRange[1]} tph`],
                  ["Motor", eq.specs.engine],
                ].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:9,
                    padding:"2px 0",borderBottom:`1px solid ${T.faint}`}}>
                    <span style={{color:T.muted}}>{k}</span>
                    <span style={{color:T.text}}>{v}</span>
                  </div>
                ))}
                <div style={{fontSize:8,color:T.muted,marginTop:6,fontStyle:"italic"}}>{eq.notes}</div>
                <button onClick={e=>{e.stopPropagation();onDrop(eq);}} style={{
                  marginTop:8,width:"100%",padding:"6px",background:eq.color+"22",
                  border:`1px solid ${eq.color}`,borderRadius:4,color:eq.color,
                  fontSize:9,cursor:"pointer",fontFamily:T.mono
                }}>+ Agregar al circuito</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Modal exportar */}
      {showExport && results && (
        <ExportModal
          results={results} nodes={nodes}
          globalInputs={globalInputs} aiAnalysis={aiAnalysis}
          onClose={()=>setShowExport(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS EDITOR DRAG & DROP
// ─────────────────────────────────────────────────────────────────────────────
let nodeIdCounter = 1;

function CircuitCanvas({ nodes, setNodes, results, selected, setSelected }) {
  const canvasRef = useRef(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({x:0,y:0});
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDropFromLibrary = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const data = e.dataTransfer.getData("equipment");
    if (!data) return;
    const eq = JSON.parse(data);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 60;
    const y = e.clientY - rect.top - 30;
    const newNode = { id: `node_${nodeIdCounter++}`, type: eq.type, equipment: eq, x, y };
    setNodes(prev => [...prev, newNode]);
  }, [setNodes]);

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setSelected(nodeId);
    const node = nodes.find(n=>n.id===nodeId);
    const rect = canvasRef.current.getBoundingClientRect();
    setDraggingNode(nodeId);
    setDragOffset({ x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (!draggingNode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - dragOffset.x);
    const y = Math.max(0, e.clientY - rect.top - dragOffset.y);
    setNodes(prev => prev.map(n => n.id===draggingNode?{...n,x,y}:n));
  }, [draggingNode, dragOffset, setNodes]);

  const handleMouseUp = () => setDraggingNode(null);

  const deleteNode = (id) => {
    setNodes(prev => prev.filter(n=>n.id!==id));
    if (selected===id) setSelected(null);
  };

  // Auto-conexiones visuales (por orden de proceso)
  const flowOrder = ["scalper","jaw","cone","screen"];
  const sortedForFlow = [...nodes].sort((a,b)=>flowOrder.indexOf(a.type)-flowOrder.indexOf(b.type));
  const connections = [];
  for (let i=0;i<sortedForFlow.length-1;i++) {
    const a=sortedForFlow[i], b=sortedForFlow[i+1];
    connections.push({from:a,to:b});
  }

  return (
    <div ref={canvasRef}
      style={{
        flex:1, position:"relative", overflow:"hidden",
        background:`radial-gradient(circle at 50% 50%, ${T.card} 0%, ${T.bg} 100%)`,
        backgroundImage:`radial-gradient(circle, ${T.border}33 1px, transparent 1px)`,
        backgroundSize:"28px 28px",
        border: isDragOver?`2px dashed ${T.amber}`:"2px solid transparent",
        transition:"border .2s"
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDrop={handleDropFromLibrary}
      onDragOver={e=>{e.preventDefault();setIsDragOver(true);}}
      onDragLeave={()=>setIsDragOver(false)}
      onClick={()=>setSelected(null)}
    >
      {/* SVG conexiones */}
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
        <defs>
          <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3z" fill={T.amber} />
          </marker>
        </defs>
        {connections.map((c,i)=>{
          const x1=c.from.x+60, y1=c.from.y+28;
          const x2=c.to.x, y2=c.to.y+28;
          const mx=(x1+x2)/2;
          return (
            <g key={i}>
              <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                fill="none" stroke={T.amber} strokeWidth="1.5"
                className="flow-line" markerEnd="url(#arr)" opacity="0.7" />
              <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                fill="none" stroke={T.amberDim} strokeWidth="3" opacity="0.2"/>
            </g>
          );
        })}
        {/* Recirculación */}
        {sortedForFlow.length>=2 && (()=>{
          const lastScreen=sortedForFlow.filter(n=>n.type==="screen").pop();
          const cone=sortedForFlow.find(n=>n.type==="cone");
          if(!lastScreen||!cone) return null;
          const x1=lastScreen.x+60,y1=lastScreen.y+50;
          const x2=cone.x+60,y2=cone.y+50;
          return (
            <path d={`M${x1},${y1} Q${(x1+x2)/2},${Math.max(y1,y2)+70} ${x2},${y2}`}
              fill="none" stroke={T.muted} strokeWidth="1" strokeDasharray="4 3"
              markerEnd="url(#arr)" opacity="0.5"/>
          );
        })()}
      </svg>

      {/* Nodos */}
      {nodes.map(node=>{
        const res = results?.nodeResults?.[node.id];
        const isSelected = selected===node.id;
        const bc = node.equipment?.color || T.muted;
        const status = res?.status;
        const statusColor = status==="overload"?T.red:status==="underload"?T.muted:T.green;

        return (
          <div key={node.id}
            onMouseDown={e=>handleNodeMouseDown(e,node.id)}
            style={{
              position:"absolute", left:node.x, top:node.y,
              width:120, userSelect:"none", cursor:"grab",
              filter: isSelected?`drop-shadow(0 0 10px ${bc}88)`:"none",
              zIndex: isSelected?10:1,
            }}>
            {/* Nodo principal */}
            <div style={{
              background:T.card, border:`2px solid ${isSelected?bc:T.border}`,
              borderRadius:8, padding:"8px 10px", position:"relative",
              transition:"border .2s"
            }}>
              {/* Status dot */}
              {res && <div style={{
                position:"absolute",top:5,right:5,
                width:7,height:7,borderRadius:"50%",background:statusColor
              }}/>}
              {/* Tipo */}
              <div style={{fontSize:18,textAlign:"center",marginBottom:3}}>
                {typeIcons[node.type]}
              </div>
              {/* Marca */}
              <div style={{fontSize:8,color:bc,textAlign:"center",fontFamily:T.mono,
                letterSpacing:"0.05em",marginBottom:1}}>
                {node.equipment?.brand?.toUpperCase()||"SIN EQUIPO"}
              </div>
              {/* Modelo */}
              <div style={{fontSize:8,color:T.text,textAlign:"center",
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {node.equipment?.model||typeLabels[node.type]}
              </div>
              {/* KPI principal */}
              {res && (node.type==="jaw"||node.type==="cone") && (
                <div style={{marginTop:5,padding:"3px 4px",background:T.surface,
                  borderRadius:3,textAlign:"center",fontSize:8,color:T.amber}}>
                  P80→{res.p80out}mm · {res.utilization}%
                </div>
              )}
              {res && (node.type==="screen"||node.type==="scalper") && (
                <div style={{marginTop:5,padding:"3px 4px",background:T.surface,
                  borderRadius:3,textAlign:"center",fontSize:8,
                  color:Number(res.circLoad)>30?T.red:T.green}}>
                  CC: {res.circLoad}%
                </div>
              )}
            </div>
            {/* Botón eliminar */}
            {isSelected && (
              <button onClick={e=>{e.stopPropagation();deleteNode(node.id);}} style={{
                position:"absolute",top:-8,right:-8,width:18,height:18,
                borderRadius:"50%",background:T.red,border:"none",
                color:"#fff",fontSize:10,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center"
              }}>×</button>
            )}
          </div>
        );
      })}

      {/* Placeholder vacío */}
      {nodes.length===0 && (
        <div style={{
          position:"absolute",inset:0,display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",pointerEvents:"none"
        }}>
          <div style={{fontSize:40,marginBottom:16,opacity:0.3}}>⬛→🔺→⊞</div>
          <div style={{fontSize:13,color:T.muted,textAlign:"center"}}>
            Arrastra equipos desde la biblioteca<br/>
            <span style={{fontSize:10}}>o usa el botón + Agregar</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL RESULTADOS LATERAL
// ─────────────────────────────────────────────────────────────────────────────
function ResultsPanel({ results, nodes, selected, globalInputs, aiAnalysis, aiLoading }) {
  if (!results) return (
    <div style={{padding:20,color:T.muted,fontSize:11,textAlign:"center"}}>
      <div style={{fontSize:32,marginBottom:12}}>◈</div>
      Configura el circuito y presiona<br/><strong style={{color:T.amber}}>SIMULAR</strong>
    </div>
  );

  const effScore = Number(results.effScore);
  const effColor = effScore>=75?T.green:effScore>=50?T.amber:T.red;
  const selNode = nodes.find(n=>n.id===selected);
  const selRes = selected?results.nodeResults?.[selected]:null;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12,padding:12,overflowY:"auto",height:"100%"}}>
      {/* Score global */}
      <div style={{background:T.card,border:`1px solid ${effColor}44`,borderRadius:8,padding:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:9,color:T.muted,letterSpacing:"0.08em",marginBottom:4}}>EFICIENCIA GLOBAL</div>
            <div style={{fontFamily:T.display,fontSize:42,fontWeight:800,color:effColor,lineHeight:1}}>
              {effScore}<span style={{fontSize:14,color:T.muted}}>/100</span>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9,color:T.muted}}>P80 FINAL</div>
            <div style={{fontFamily:T.display,fontSize:22,color:T.amber,fontWeight:700}}>
              {results.finalP80}<span style={{fontSize:11,color:T.muted}}> mm</span>
            </div>
            <div style={{fontSize:9,color:T.muted}}>Obj: {results.p80Target} mm</div>
          </div>
        </div>
        <div style={{height:5,background:T.border,borderRadius:3,marginTop:10,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${effScore}%`,background:effColor,borderRadius:3}}/>
        </div>
        {results.bottlenecks?.length>0 && (
          <div style={{marginTop:8,fontSize:9,color:T.red}}>
            ⚠ Bottleneck: {results.bottlenecks.join(", ")}
          </div>
        )}
      </div>

      {/* KPIs rápidos */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[
          {l:"ALIMENTACIÓN",v:results.tph,u:"tph",c:T.blue},
          {l:"CIRC. CARGA",v:results.circLoad,u:"%",c:Number(results.circLoad)>30?T.red:T.green},
        ].map(k=>(
          <div key={k.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:10}}>
            <div style={{fontSize:8,color:T.muted,marginBottom:3}}>{k.l}</div>
            <div style={{fontFamily:T.display,fontSize:20,color:k.c,fontWeight:700}}>
              {k.v}<span style={{fontSize:9,color:T.muted,marginLeft:2}}>{k.u}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detalle nodo seleccionado */}
      {selNode && selRes && (
        <div style={{background:T.card,border:`1px solid ${selNode.equipment?.color||T.border}`,borderRadius:8,padding:12}} className="fu">
          <div style={{fontSize:9,color:selNode.equipment?.color||T.amber,letterSpacing:"0.08em",marginBottom:8}}>
            ◈ {selNode.equipment?.model||typeLabels[selNode.type]}
          </div>
          {Object.entries(selRes).filter(([k])=>k!=="status").map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",
              fontSize:10,padding:"3px 0",borderBottom:`1px solid ${T.faint}`}}>
              <span style={{color:T.muted,textTransform:"uppercase",fontSize:8}}>{k}</span>
              <span style={{color:T.text}}>{v}{k==="utilization"||k==="efficiency"||k==="circLoad"?"%":k==="css"||k.includes("p80")||k==="aperture"?" mm":k==="energy"?" kWh/t":k.includes("cap")||k==="oversize"?" tph":""}</span>
            </div>
          ))}
        </div>
      )}

      {/* Análisis IA */}
      <div style={{background:`linear-gradient(135deg,${T.card},${T.surface})`,
        border:`1px solid ${T.amberSoft}`,borderRadius:8,padding:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <div style={{width:24,height:24,borderRadius:"50%",
            background:`linear-gradient(135deg,${T.amber},#d97706)`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>◈</div>
          <div style={{fontSize:10,color:T.amber,fontFamily:T.display,fontWeight:600}}>KrushRock</div>
          {aiLoading && <div style={{fontSize:8,color:T.muted}} className="pulse">● analizando…</div>}
        </div>
        {aiLoading ? (
          <div style={{fontSize:11,color:T.muted}} className="pulse">Procesando circuito…</div>
        ) : (
          <div style={{fontSize:10,color:T.text,lineHeight:1.7,whiteSpace:"pre-wrap"}} className="fu">
            {aiAnalysis}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL INPUTS GLOBALES
// ─────────────────────────────────────────────────────────────────────────────
function GlobalInputs({ inputs, setInputs, onSimulate, simulating, nodeCount }) {
  const fields = [
    {id:"tph",label:"Tonelaje",unit:"tph",min:50,max:2000,step:50},
    {id:"f80",label:"F80 alim.",unit:"mm",min:100,max:1500,step:50},
    {id:"p80Target",label:"P80 obj.",unit:"mm",min:5,max:150,step:5},
    {id:"humidity",label:"Humedad",unit:"/3",min:0,max:3,step:1},
  ];

  return (
    <div style={{
      background:T.surface,borderBottom:`1px solid ${T.border}`,
      padding:"10px 14px",display:"flex",alignItems:"center",
      gap:16,flexWrap:"wrap"
    }}>
      {/* Roca */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:9,color:T.muted}}>ROCA</span>
        <select value={inputs.rockType}
          onChange={e=>setInputs({...inputs,rockType:e.target.value})}
          style={{background:T.card,color:T.text,border:`1px solid ${T.border}`,
            borderRadius:4,padding:"4px 8px",fontSize:10,fontFamily:T.mono,cursor:"pointer"}}>
          {Object.entries(ROCK_DB).map(([k,v])=>(
            <option key={k} value={k}>{v.name} (Wi {v.wi})</option>
          ))}
        </select>
      </div>

      {/* Sliders */}
      {fields.map(f=>(
        <div key={f.id} style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:9,color:T.muted,whiteSpace:"nowrap"}}>{f.label}</span>
          <input type="range" min={f.min} max={f.max} step={f.step}
            value={inputs[f.id]}
            onChange={e=>setInputs({...inputs,[f.id]:Number(e.target.value)})}
            style={{width:70}} />
          <span style={{fontSize:10,color:T.amber,minWidth:45,whiteSpace:"nowrap"}}>
            {inputs[f.id]}<span style={{fontSize:8,color:T.muted}}>{f.unit}</span>
          </span>
        </div>
      ))}

      {/* Botón simular */}
      <button onClick={onSimulate} disabled={nodeCount===0||simulating} style={{
        marginLeft:"auto",padding:"8px 18px",
        background:nodeCount===0?T.faint:`linear-gradient(135deg,${T.amber},#d97706)`,
        border:"none",borderRadius:6,
        color:nodeCount===0?T.muted:"#000",
        fontFamily:T.display,fontWeight:700,fontSize:12,
        cursor:nodeCount===0?"not-allowed":"pointer",
        opacity:simulating?0.7:1,
        animation:nodeCount>0&&!simulating?"glow 2s ease infinite":"none",
        transition:"all .2s"
      }}>
        {simulating?"SIMULANDO…":"▶ SIMULAR"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP PRINCIPAL FASE 2
// ─────────────────────────────────────────────────────────────────────────────
// MODAL EXPORTAR PDF
// ─────────────────────────────────────────────────────────────────────────────
function ExportModal({ results, nodes, globalInputs, aiAnalysis, onClose }) {
  const [projectName, setProjectName] = useState("Simulacion KrushRock");
  const [company, setCompany] = useState("");
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const payload = {
      projectName, company,
      rock: results.rock,
      inputs: { ...globalInputs, circuit: globalInputs.circuit || "closed" },
      results: {
        effScore: results.effScore,
        finalP80: results.finalP80,
        circLoad: results.circLoad,
        bottlenecks: results.bottlenecks || [],
        nodeResults: results.nodeResults || {},
      },
      nodes: nodes.map(n => ({
        id: n.id, type: n.type,
        equipment: { brand: n.equipment?.brand, model: n.equipment?.model, color: n.equipment?.color },
      })),
      aiAnalysis,
    };

    // Generar PDF via API de Claude con instrucciones de Python
    const prompt = `Eres un generador de reporte tecnico PDF para KrushRock.
Datos del proyecto:
${JSON.stringify(payload, null, 2)}

Genera un reporte tecnico profesional en texto plano estructurado con:
- Encabezado: proyecto, empresa, fecha
- Parametros de entrada
- Resultados globales (score, P80 final, carga circulante)
- Tabla de equipos con resultados
- Balance de masas
- Analisis IA
- Disclaimer

Formato: secciones con === separadores, datos en columnas alineadas. Sin markdown. Solo texto plano profesional.`;

    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:2000,
          messages:[{role:"user",content:prompt}] })
      });
      const d = await r.json();
      const text = d.content?.find(b=>b.type==="text")?.text || "Reporte no disponible.";

      // Descargar como .txt (el PDF real requiere backend Python)
      const blob = new Blob([
        `KRUSHROCK — REPORTE DE SIMULACION\n` +
        `${"=".repeat(60)}\n` +
        `Proyecto: ${projectName}\n` +
        `Empresa:  ${company || "—"}\n` +
        `Fecha:    ${new Date().toLocaleString("es-CL")}\n` +
        `${"=".repeat(60)}\n\n` +
        text
      ], { type:"text/plain;charset=utf-8" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KrushRock_${projectName.replace(/\s+/g,"_")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch(e) {
      alert("Error al generar reporte. Intenta de nuevo.");
    }
    setExporting(false);
  };

  const copyJSON = () => {
    const payload = {
      projectName, company,
      rock: results.rock,
      inputs: globalInputs,
      results: { effScore:results.effScore, finalP80:results.finalP80,
        circLoad:results.circLoad, bottlenecks:results.bottlenecks||[],
        nodeResults:results.nodeResults||{} },
      nodes: nodes.map(n=>({ id:n.id, type:n.type,
        equipment:{brand:n.equipment?.brand, model:n.equipment?.model} })),
      aiAnalysis,
    };
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    alert("JSON copiado. Úsalo con: python3 krushrock_pdf.py datos.json reporte.pdf");
  };

  return (
    <div style={{
      position:"fixed",inset:0,background:"#000a",zIndex:100,
      display:"flex",alignItems:"center",justifyContent:"center",padding:16
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className="fu" style={{
        background:T.card,border:`1px solid ${T.amber}`,borderRadius:12,
        padding:24,width:"100%",maxWidth:420
      }}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          <div style={{width:32,height:32,borderRadius:6,
            background:`linear-gradient(135deg,${T.amber},#d97706)`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:T.display,fontWeight:800,color:"#000",fontSize:14}}>CS</div>
          <div>
            <div style={{fontFamily:T.display,fontWeight:700,color:T.amber,fontSize:14}}>
              Exportar Reporte
            </div>
            <div style={{fontSize:9,color:T.muted}}>Fase 3 — Documentación del proyecto</div>
          </div>
          <button onClick={onClose} style={{marginLeft:"auto",background:"none",border:"none",
            color:T.muted,fontSize:18,cursor:"pointer"}}>×</button>
        </div>

        {/* Campos */}
        {[
          {label:"Nombre del proyecto", val:projectName, set:setProjectName, ph:"Ej: Cantera Norte 2026"},
          {label:"Empresa / Cliente", val:company, set:setCompany, ph:"Ej: Áridos del Pacífico S.A."},
        ].map(f=>(
          <div key={f.label} style={{marginBottom:14}}>
            <div style={{fontSize:9,color:T.muted,marginBottom:4,letterSpacing:"0.06em"}}>{f.label.toUpperCase()}</div>
            <input value={f.val} onChange={e=>f.set(e.target.value)}
              placeholder={f.ph}
              style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,
                borderRadius:6,padding:"9px 12px",color:T.text,fontSize:12,
                fontFamily:T.mono,outline:"none"}} />
          </div>
        ))}

        {/* Resumen */}
        <div style={{background:T.surface,borderRadius:6,padding:12,marginBottom:18}}>
          <div style={{fontSize:9,color:T.muted,marginBottom:8,letterSpacing:"0.06em"}}>RESUMEN A EXPORTAR</div>
          {[
            ["Roca",`${results.rock?.name} (Wi=${results.rock?.wi})`],
            ["Equipos",`${nodes.length} equipo(s) en circuito`],
            ["Score eficiencia",`${results.effScore}/100`],
            ["P80 final",`${results.finalP80} mm (obj: ${globalInputs.p80Target} mm)`],
            ["Carga circulante",`${results.circLoad}%`],
            ["Análisis IA", aiAnalysis ? "Incluido ✓" : "No disponible"],
          ].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",
              fontSize:10,padding:"3px 0",borderBottom:`1px solid ${T.faint}`}}>
              <span style={{color:T.muted}}>{k}</span>
              <span style={{color:T.text}}>{v}</span>
            </div>
          ))}
        </div>

        {/* Botones */}
        <div style={{display:"grid",gap:8}}>
          <button onClick={handleExport} disabled={exporting} style={{
            padding:"12px",background:done?T.green:`linear-gradient(135deg,${T.amber},#d97706)`,
            border:"none",borderRadius:8,color:"#000",
            fontFamily:T.display,fontWeight:700,fontSize:13,cursor:"pointer",
            opacity:exporting?0.7:1
          }}>
            {done ? "✓ Reporte descargado" : exporting ? "Generando..." : "⬇ Descargar reporte (.txt)"}
          </button>
          <button onClick={copyJSON} style={{
            padding:"10px",background:"none",
            border:`1px solid ${T.border}`,borderRadius:8,
            color:T.muted,fontFamily:T.mono,fontSize:10,cursor:"pointer"
          }}>
            { } Copiar JSON para PDF con Python
          </button>
          <div style={{fontSize:8,color:T.muted,textAlign:"center",lineHeight:1.5}}>
            Para PDF con diseño completo: usa <span style={{color:T.amber}}>krushrock_pdf.py</span> con el JSON copiado
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [nodes, setNodes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [globalInputs, setGlobalInputs] = useState({
    tph: 300, f80: 600, p80Target: 25, rockType: "granito", humidity: 0
  });

  const addEquipmentFromLibrary = useCallback((eq) => {
    // posición automática por tipo
    const typePos = { scalper:{x:30,y:120}, jaw:{x:180,y:80}, cone:{x:380,y:80}, screen:{x:580,y:80} };
    const base = typePos[eq.type] || {x:100+Math.random()*300, y:100+Math.random()*150};
    const newNode = { id:`node_${nodeIdCounter++}`, type:eq.type, equipment:eq, x:base.x, y:base.y };
    setNodes(prev=>[...prev.filter(n=>n.type!==eq.type), newNode]); // uno por tipo
  }, []);

  const runSimulation = useCallback(async () => {
    if (nodes.length===0) return;
    setSimulating(true);
    setAiLoading(true);
    setAiAnalysis("");

    // Simulación sincrónica
    const res = simulateCircuit(nodes, [], globalInputs);
    setResults(res);
    setSimulating(false);

    // Análisis IA
    const nodesSummary = nodes.map(n=>{
      const r = res.nodeResults[n.id];
      return `${n.equipment?.brand} ${n.equipment?.model} (${typeLabels[n.type]}): ${JSON.stringify(r)}`;
    }).join("\n");

    const prompt = `Eres KrushRock, experto en ingeniería de chancado y selección con equipos móviles.

CIRCUITO SIMULADO:
Roca: ${res.rock.name} (Wi=${res.rock.wi}, abrasividad=${res.rock.ab})
Alimentación: ${globalInputs.tph} tph · F80=${globalInputs.f80}mm · P80 objetivo=${globalInputs.p80Target}mm
Humedad: ${globalInputs.humidity}/3

EQUIPOS Y RESULTADOS:
${nodesSummary}

RESULTADO GLOBAL:
P80 final: ${res.finalP80}mm (objetivo: ${res.p80Target}mm)
Carga circulante: ${res.circLoad}%
Score eficiencia: ${res.effScore}/100
Bottlenecks: ${res.bottlenecks.join(", ")||"ninguno"}

Proporciona un análisis técnico conciso en español (máximo 180 palabras):
1. **Diagnóstico** del circuito actual
2. **Puntos críticos** (bullets con ●)
3. **Ajustes recomendados** (bullets con →)
4. **Compatibilidad** de los equipos seleccionados entre sí

Usa terminología técnica de proceso. Sé directo y práctico.`;

    try {
      const r = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{role:"user",content:prompt}]
        })
      });
      const d = await r.json();
      setAiAnalysis(d.content?.find(b=>b.type==="text")?.text||"No disponible.");
    } catch {
      setAiAnalysis("Análisis IA no disponible. Revisa los KPIs para diagnóstico manual.");
    }
    setAiLoading(false);
  }, [nodes, globalInputs]);

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:T.bg,overflow:"hidden"}}>
      <style>{INJECT}</style>

      {/* ── TOPBAR ── */}
      <div style={{
        background:T.surface,borderBottom:`1px solid ${T.border}`,
        padding:"10px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0
      }}>
        <div style={{
          width:34,height:34,borderRadius:8,flexShrink:0,
          background:`linear-gradient(135deg,${T.amber},#d97706)`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontFamily:T.display,fontWeight:900,fontSize:15,color:"#000"
        }}>CS</div>
        <div>
          <div style={{fontFamily:T.display,fontWeight:800,fontSize:16,color:T.amber,letterSpacing:"0.03em"}}>
            KrushRock
          </div>
          <div style={{fontSize:8,color:T.muted,letterSpacing:"0.12em"}}>
            FASE 3 · EDITOR + EXPORTACIÓN · EQUIPOS MÓVILES CHILE
          </div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <Pill color={T.green}>Powerscreen</Pill>
          <Pill color={T.cyan}>Kleemann</Pill>
          <Pill color={T.green} small>Finlay</Pill>
          <Pill color={T.blue} small>Sandvik</Pill>
          <Pill color={T.red} small>Metso</Pill>
          <Pill color={T.purple} small>Astec</Pill>
          {results && (
            <button onClick={()=>setShowExport(true)} style={{
              padding:"6px 14px",
              background:`linear-gradient(135deg,${T.amber},#d97706)`,
              border:"none",borderRadius:6,color:"#000",
              fontFamily:T.display,fontWeight:700,fontSize:11,
              cursor:"pointer",letterSpacing:"0.03em"
            }}>&#8595; EXPORTAR</button>
          )}
        </div>
      </div>

      {/* ── BARRA INPUTS ── */}
      <GlobalInputs
        inputs={globalInputs}
        setInputs={setGlobalInputs}
        onSimulate={runSimulation}
        simulating={simulating}
        nodeCount={nodes.length}
      />

      {/* ── BODY ── */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* Biblioteca */}
        <div style={{width:200,flexShrink:0}}>
          <EquipmentLibrary onDrop={addEquipmentFromLibrary}/>
        </div>

        {/* Canvas */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <CircuitCanvas
            nodes={nodes} setNodes={setNodes}
            results={results} selected={selected} setSelected={setSelected}
          />
          {/* Info bar bottom */}
          <div style={{
            background:T.surface,borderTop:`1px solid ${T.border}`,
            padding:"5px 14px",display:"flex",alignItems:"center",gap:16,flexShrink:0
          }}>
            <span style={{fontSize:9,color:T.muted}}>{nodes.length} equipo(s) en circuito</span>
            {nodes.map(n=>(
              <span key={n.id} style={{fontSize:9,color:n.equipment?.color||T.muted}}>
                {typeIcons[n.type]} {n.equipment?.model||typeLabels[n.type]}
              </span>
            ))}
            {nodes.length>0 && <span style={{fontSize:9,color:T.muted}}>· Click en nodo para detalles · Arrastra para mover · × para eliminar</span>}
          </div>
        </div>

        {/* Panel resultados */}
        <div style={{width:260,flexShrink:0,borderLeft:`1px solid ${T.border}`,overflowY:"auto"}}>
          <ResultsPanel
            results={results} nodes={nodes} selected={selected}
            globalInputs={globalInputs}
            aiAnalysis={aiAnalysis} aiLoading={aiLoading}
          />
        </div>
      </div>
    </div>
  );
}
