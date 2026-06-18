import { useState, useCallback, useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  bg:      "#07080d",
  surface: "#0c0f1a",
  card:    "#111827",
  card2:   "#161f30",
  border:  "#1e2d45",
  borderB: "#2a3f5f",
  A:       "#f59e0b",   // escenario A — ámbar
  Adim:    "#78350f",
  B:       "#06b6d4",   // escenario B — cyan
  Bdim:    "#0e4f5f",
  green:   "#10b981",
  red:     "#ef4444",
  purple:  "#8b5cf6",
  text:    "#dde3f0",
  muted:   "#4a5a72",
  faint:   "#1a2540",
  mono:    "'JetBrains Mono','Fira Mono',monospace",
  display: "'Syne',sans-serif",
};

const CSS_INJECT = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:${T.bg};color:${T.text};font-family:${T.mono}}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:${T.surface}}
::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
input,select{font-family:${T.mono}}
input[type=range]{-webkit-appearance:none;height:3px;background:${T.border};border-radius:2px;outline:none;cursor:pointer}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;cursor:pointer}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes barGrow{from{width:0}to{width:var(--w)}}
@keyframes countUp{from{opacity:0}to{opacity:1}}
@keyframes scanline{0%{top:-10%}100%{top:110%}}
.fu{animation:fadeUp .3s ease forwards}
.pulse{animation:pulse 1.3s ease infinite}
`;

// ─────────────────────────────────────────────────────────────────────────────
// BASE DE DATOS — COSTOS REFERENCIALES CHILE 2024-2025
// Fuente: estimaciones de mercado áridos/minería Chile, precios en USD/hora
// ─────────────────────────────────────────────────────────────────────────────
const COST_DB = {
  // Costo combustible: ~1.15 USD/L, consumo referencial por kW instalado
  fuelCostUSD: 1.15,       // USD por litro
  electricCostUSD: 0.12,   // USD por kWh
  operatorCostUSD: 18,     // USD/hora operador
  mechanicCostUSD: 35,     // USD/hora mecánico
  hoursPerYear: 6000,      // horas operación/año típico Chile

  // Desgaste de piezas (USD/tonelada procesada) — por tipo de roca
  wearCost: {
    // [mandíbula, cono, criba] USD/t
    granito:  { jaw: 0.18, cone: 0.22, screen: 0.06 },
    caliza:   { jaw: 0.08, cone: 0.10, screen: 0.03 },
    cobre:    { jaw: 0.15, cone: 0.18, screen: 0.05 },
    basalto:  { jaw: 0.22, cone: 0.28, screen: 0.07 },
    cuarcita: { jaw: 0.30, cone: 0.38, screen: 0.09 },
    arenisca: { jaw: 0.06, cone: 0.07, screen: 0.02 },
    porfido:  { jaw: 0.20, cone: 0.25, screen: 0.07 },
  },

  // Mantenimiento preventivo (% del valor del equipo por año)
  maintPct: { jaw: 0.08, cone: 0.10, screen: 0.05, scalper: 0.04 },

  // Valor referencial equipos (USD) para cálculo mantenimiento
  equipValue: {
    // mandíbula
    "J-960":480000, "J-1160":620000, "J-1175":680000, "J-1280":850000, "J-1480":1100000,
    "Premiertrak 1180":720000, "Premiertrak 600":920000,
    "MOBICAT MC 110i EVO2":690000, "MOBICAT MC 120i PRO":880000,
    "UJ440i":780000, "Lokotrack LT120":1050000, "GT440":530000,
    // cono
    "1000 Maxtrak":520000, "1300 Maxtrak":720000,
    "MOBICONE MCO 90i EVO2":560000, "MOBICONE MCO 110i PRO":750000,
    "C-1540":530000, "C-1545":680000, "C-1550":920000,
    "UC440i":690000, "Lokotrack LT220D":880000, "Kodiak K300+":580000,
    // criba
    "683 — 2 deck":280000, "684T — 2 deck":320000,
    "694 — 3 deck":420000, "696 — 3 deck":520000,
    "Chieftain 1700":290000, "Chieftain 2100X":380000,
    "Chieftain 2200X":420000, "Warrior 2400":480000,
    "MOBISCREEN MS 702i EVO":310000, "MOBISCREEN MS 703i EVO":390000,
    "MOBISCREEN MS 952i EVO":550000,
    "SS3516":350000, "Lokotrack ST2.8":450000, "Lokotrack ST620":580000,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MOTOR SIMULACIÓN (Bond + curvas interpoladas)
// ─────────────────────────────────────────────────────────────────────────────
const ROCK_DB = {
  granito:  { wi:15.5, ab:0.28, den:2.70, name:"Granito" },
  caliza:   { wi:11.2, ab:0.12, den:2.60, name:"Caliza" },
  cobre:    { wi:14.0, ab:0.22, den:2.75, name:"Mineral de Cobre" },
  basalto:  { wi:17.0, ab:0.35, den:2.90, name:"Basalto" },
  cuarcita: { wi:19.5, ab:0.45, den:2.65, name:"Cuarcita" },
  arenisca: { wi: 9.5, ab:0.08, den:2.30, name:"Arenisca" },
  porfido:  { wi:16.0, ab:0.30, den:2.72, name:"Pórfido Cuprífero" },
};

function lerp(xs, ys, x) {
  if (!xs||!ys||xs.length<2) return ys?.[0]||0;
  if (x<=xs[0]) return ys[0];
  if (x>=xs[xs.length-1]) return ys[ys.length-1];
  for (let i=0;i<xs.length-1;i++) {
    if (x>=xs[i]&&x<=xs[i+1]) {
      const t=(x-xs[i])/(xs[i+1]-xs[i]);
      return ys[i]+t*(ys[i+1]-ys[i]);
    }
  }
  return ys[ys.length-1];
}

function simulateScenario(scenario) {
  const { tph, f80, p80Target, rockType, humidity, circuit, nodes } = scenario;
  const rock = ROCK_DB[rockType] || ROCK_DB.granito;
  const nodeResults = {};
  let currentF80 = f80;
  const flowOrder = ["scalper","jaw","cone","screen"];
  const sorted = [...nodes].sort((a,b)=>flowOrder.indexOf(a.type)-flowOrder.indexOf(b.type));

  for (const node of sorted) {
    const eq = node.equipment;
    if (!eq) continue;
    if (node.type==="jaw"||node.type==="cone") {
      const cssOpt = Math.max(eq.specs?.cssRange?.[0]||10,
        Math.min(eq.specs?.cssRange?.[1]||200, p80Target*(node.type==="jaw"?0.18:0.14)));
      const capFromCurve = lerp(eq.curves?.css, eq.curves?.tph, cssOpt);
      const p80factor = lerp(eq.curves?.css, eq.curves?.p80factor, cssOpt);
      const p80out = cssOpt * p80factor;
      const energyBond = Math.max(0, 10*rock.wi*(1/Math.sqrt(p80out)-1/Math.sqrt(currentF80)));
      const utilization = Math.min(100,(tph/Math.max(capFromCurve,1))*100);
      nodeResults[node.id] = {
        css:cssOpt.toFixed(0), capNominal:(capFromCurve||0).toFixed(0),
        capReal:Math.min(tph,capFromCurve||tph).toFixed(0),
        p80in:currentF80.toFixed(0), p80out:p80out.toFixed(0),
        energy:energyBond.toFixed(2), utilization:utilization.toFixed(0),
        rr:(currentF80/p80out).toFixed(1),
        status:utilization>95?"overload":utilization>80?"ok":"underload",
        energyKw: energyBond * tph,
      };
      currentF80 = p80out;
    }
    if (node.type==="screen"||node.type==="scalper") {
      const aperture = p80Target * 0.9;
      const eff = lerp(eq.curves?.apertures, eq.curves?.efficiency, aperture)/100;
      const effReal = Math.max(0.70, eff - humidity*0.015);
      const oversize = tph*(1-effReal)*0.4;
      const circLoad = (oversize/tph)*100;
      nodeResults[node.id] = {
        aperture:aperture.toFixed(0), efficiency:(effReal*100).toFixed(1),
        oversize:oversize.toFixed(0), circLoad:circLoad.toFixed(1),
        status:circLoad>35?"overload":circLoad>20?"warn":"ok",
      };
    }
  }

  const lastCone = sorted.filter(n=>n.type==="cone").pop();
  const lastScreen = sorted.filter(n=>n.type==="screen").pop();
  const finalP80 = lastCone ? Number(nodeResults[lastCone.id]?.p80out||currentF80) : currentF80;
  const finalCircLoad = lastScreen ? Number(nodeResults[lastScreen.id]?.circLoad||0) : 0;
  const p80Gap = Math.abs(finalP80-p80Target)/p80Target;
  const effScore = Math.max(0,Math.min(100,100-finalCircLoad*0.7-p80Gap*60-rock.ab*15));
  const bottlenecks = sorted.filter(n=>nodeResults[n.id]?.status==="overload")
    .map(n=>n.equipment?.model||n.type);

  // OPEX
  const opex = calcOPEX(sorted, nodeResults, tph, rockType, scenario.hoursPerYear||COST_DB.hoursPerYear);

  return { nodeResults, finalP80:finalP80.toFixed(0), circLoad:finalCircLoad.toFixed(1),
    effScore:effScore.toFixed(0), bottlenecks, rock, tph, p80Target, opex };
}

function calcOPEX(nodes, nodeResults, tph, rockType, hoursYear) {
  const wearCosts = COST_DB.wearCost[rockType] || COST_DB.wearCost.granito;
  let totalEnergyKwh = 0;
  let totalWearUSDt = 0;
  let totalMaintUSDyr = 0;
  let totalCapitalUSD = 0;

  for (const node of nodes) {
    const eq = node.equipment;
    if (!eq) continue;
    const res = nodeResults[node.id];
    const t = node.type;

    // Energía
    const energyKwh = Number(res?.energyKw||0);
    totalEnergyKwh += energyKwh;

    // Desgaste
    const wc = wearCosts[t==="jaw"?"jaw":t==="cone"?"cone":"screen"] || 0;
    totalWearUSDt += wc;

    // Mantenimiento
    const val = COST_DB.equipValue[eq.model] || 600000;
    const maintPct = COST_DB.maintPct[t] || 0.07;
    totalMaintUSDyr += val * maintPct;
    totalCapitalUSD += val;
  }

  // USD/hora operación
  const energyCostHr = (totalEnergyKwh / Math.max(tph,1)) * tph * COST_DB.electricCostUSD;
  const laborCostHr = COST_DB.operatorCostUSD * 1.5; // 1 operador + 0.5 mecánico promedio

  // Costo por tonelada
  const energyCostTon = (totalEnergyKwh / Math.max(tph,1)) * COST_DB.electricCostUSD;
  const laborCostTon  = laborCostHr / Math.max(tph,1);
  const maintCostTon  = (totalMaintUSDyr / Math.max(hoursYear*tph, 1));
  const totalCostTon  = energyCostTon + laborCostTon + maintCostTon + totalWearUSDt;

  // Producción anual
  const tonYear = tph * hoursYear;
  const revenueBase = tonYear * 8; // USD/t precio árido referencial
  const totalCostYear = totalCostTon * tonYear;
  const ebitda = revenueBase - totalCostYear;
  const ebitdaPct = (ebitda/Math.max(revenueBase,1))*100;

  return {
    energyCostTon: energyCostTon.toFixed(3),
    laborCostTon:  laborCostTon.toFixed(3),
    maintCostTon:  maintCostTon.toFixed(3),
    wearCostTon:   totalWearUSDt.toFixed(3),
    totalCostTon:  totalCostTon.toFixed(2),
    totalCostYear: (totalCostYear/1000).toFixed(0),  // miles USD
    tonYear:       (tonYear/1000).toFixed(0),         // miles ton
    capitalUSD:    (totalCapitalUSD/1000000).toFixed(2), // M USD
    ebitda:        (ebitda/1000).toFixed(0),          // miles USD
    ebitdaPct:     ebitdaPct.toFixed(1),
    maintUSDyr:    (totalMaintUSDyr/1000).toFixed(0),
    energyKwhTon:  (totalEnergyKwh/Math.max(tph,1)).toFixed(2),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DATOS EQUIPOS (subset esencial para selector rápido)
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_EQUIP = {
  jaw: [
    { id:"fj960",  brand:"Finlay", model:"J-960",
      specs:{feedOpen:[900,600],cssRange:[50,150]},
      curves:{css:[50,75,100,125,150],tph:[100,150,195,225,250],p80factor:[3.0,3.2,3.4,3.5,3.6]},
      color:"#10b981" },
    { id:"fj1160", brand:"Finlay", model:"J-1160",
      specs:{feedOpen:[1000,600],cssRange:[40,145]},
      curves:{css:[50,75,100,120,145],tph:[180,240,290,325,350],p80factor:[3.1,3.3,3.4,3.5,3.6]},
      color:"#10b981" },
    { id:"fj1175", brand:"Finlay", model:"J-1175",
      specs:{feedOpen:[1100,762],cssRange:[75,150]},
      curves:{css:[75,100,125,140,150],tph:[220,290,340,365,380],p80factor:[3.1,3.3,3.4,3.5,3.6]},
      color:"#10b981" },
    { id:"fj1280", brand:"Finlay", model:"J-1280",
      specs:{feedOpen:[1200,820],cssRange:[75,200]},
      curves:{css:[75,100,125,150,175,200],tph:[300,370,420,460,485,500],p80factor:[3.2,3.4,3.5,3.6,3.7,3.8]},
      color:"#10b981" },
    { id:"fj1480", brand:"Finlay", model:"J-1480",
      specs:{feedOpen:[1415,820],cssRange:[85,225]},
      curves:{css:[85,110,140,175,200,225],tph:[400,490,570,640,700,750],p80factor:[3.3,3.4,3.5,3.6,3.7,3.8]},
      color:"#10b981" },
    { id:"ps1180", brand:"Powerscreen", model:"Premiertrak 1180",
      specs:{feedOpen:[1070,760],cssRange:[75,175]},
      curves:{css:[75,100,125,150,175],tph:[200,270,320,370,400],p80factor:[3.2,3.4,3.5,3.6,3.7]},
      color:"#f59e0b" },
    { id:"ps600",  brand:"Powerscreen", model:"Premiertrak 600",
      specs:{feedOpen:[1200,820],cssRange:[90,200]},
      curves:{css:[90,120,150,175,200],tph:[350,430,500,560,600],p80factor:[3.2,3.4,3.5,3.6,3.7]},
      color:"#f59e0b" },
    { id:"km110",  brand:"Kleemann", model:"MOBICAT MC 110i EVO2",
      specs:{feedOpen:[1100,700],cssRange:[70,150]},
      curves:{css:[70,90,110,130,150],tph:[200,260,300,330,350],p80factor:[3.1,3.3,3.4,3.5,3.6]},
      color:"#06b6d4" },
    { id:"km120",  brand:"Kleemann", model:"MOBICAT MC 120i PRO",
      specs:{feedOpen:[1200,800],cssRange:[80,180]},
      curves:{css:[80,110,140,160,180],tph:[280,350,400,430,450],p80factor:[3.2,3.4,3.5,3.6,3.7]},
      color:"#06b6d4" },
    { id:"svuj",   brand:"Sandvik",    model:"UJ440i",
      specs:{feedOpen:[1200,830],cssRange:[80,200]},
      curves:{css:[80,110,140,170,200],tph:[300,380,440,480,500],p80factor:[3.2,3.4,3.5,3.6,3.8]},
      color:"#3b82f6" },
    { id:"mlt120", brand:"Metso",      model:"Lokotrack LT120",
      specs:{feedOpen:[1200,870],cssRange:[90,200]},
      curves:{css:[90,120,150,175,200],tph:[400,490,560,610,650],p80factor:[3.3,3.4,3.5,3.6,3.8]},
      color:"#ef4444" },
  ],
  cone: [
    { id:"fc1540", brand:"Finlay",     model:"C-1540",
      specs:{cssRange:[8,38]},
      curves:{css:[8,13,19,25,38],tph:[90,135,185,225,270],p80factor:[2.8,3.0,3.2,3.5,3.8]},
      color:"#10b981" },
    { id:"fc1545", brand:"Finlay",     model:"C-1545",
      specs:{cssRange:[14,45]},
      curves:{css:[14,18,22,28,36,45],tph:[150,195,245,300,360,400],p80factor:[2.9,3.1,3.2,3.5,3.7,3.9]},
      color:"#10b981" },
    { id:"fc1550", brand:"Finlay",     model:"C-1550",
      specs:{cssRange:[16,50]},
      curves:{css:[16,22,28,36,44,50],tph:[200,265,320,390,455,500],p80factor:[3.0,3.2,3.3,3.6,3.8,4.0]},
      color:"#10b981" },
    { id:"ps1000", brand:"Powerscreen",model:"1000 Maxtrak",
      specs:{cssRange:[6,44]},
      curves:{css:[6,10,16,22,32,44],tph:[90,130,180,220,260,280],p80factor:[2.8,3.0,3.2,3.5,3.8,4.0]},
      color:"#f59e0b" },
    { id:"ps1300", brand:"Powerscreen",model:"1300 Maxtrak",
      specs:{cssRange:[8,50]},
      curves:{css:[8,13,19,25,38,50],tph:[130,190,250,300,350,380],p80factor:[2.8,3.0,3.2,3.5,3.8,4.0]},
      color:"#f59e0b" },
    { id:"km90",   brand:"Kleemann",   model:"MOBICONE MCO 90i EVO2",
      specs:{cssRange:[8,30]},
      curves:{css:[8,12,18,24,30],tph:[80,120,170,210,250],p80factor:[2.8,3.0,3.2,3.5,3.8]},
      color:"#06b6d4" },
    { id:"km110c", brand:"Kleemann",   model:"MOBICONE MCO 110i PRO",
      specs:{cssRange:[10,44]},
      curves:{css:[10,16,22,32,44],tph:[120,180,240,300,350],p80factor:[2.9,3.1,3.3,3.6,3.9]},
      color:"#06b6d4" },
    { id:"svuc",   brand:"Sandvik",    model:"UC440i",
      specs:{cssRange:[6,44]},
      curves:{css:[6,10,16,25,38,44],tph:[100,150,210,270,320,340],p80factor:[2.8,3.0,3.2,3.5,3.8,4.0]},
      color:"#3b82f6" },
    { id:"mlt220", brand:"Metso",      model:"Lokotrack LT220D",
      specs:{cssRange:[8,48]},
      curves:{css:[8,13,19,25,38,48],tph:[120,185,255,310,370,400],p80factor:[2.9,3.1,3.3,3.5,3.8,4.0]},
      color:"#ef4444" },
  ],
  screen: [
    { id:"f683",   brand:"Finlay",     model:"683 — 2 deck",
      specs:{decks:2,screenArea:[3.66,1.52]},
      curves:{apertures:[10,20,40,80],efficiency:[91,89,87,85]}, color:"#10b981" },
    { id:"f684t",  brand:"Finlay",     model:"684T — 2 deck",
      specs:{decks:2,screenArea:[4.3,1.7]},
      curves:{apertures:[10,20,40,80],efficiency:[92,90,88,86]}, color:"#10b981" },
    { id:"f694",   brand:"Finlay",     model:"694 — 3 deck",
      specs:{decks:3,screenArea:[6.1,1.53]},
      curves:{apertures:[10,20,40,80],efficiency:[93,91,89,87]}, color:"#10b981" },
    { id:"f696",   brand:"Finlay",     model:"696 — 3 deck",
      specs:{decks:3,screenArea:[6.1,1.52]},
      curves:{apertures:[10,20,40,80],efficiency:[94,92,90,88]}, color:"#10b981" },
    { id:"psch17", brand:"Powerscreen",model:"Chieftain 1700",
      specs:{decks:2,screenArea:[4.8,1.5]},
      curves:{apertures:[10,20,40,80],efficiency:[91,89,87,85]}, color:"#f59e0b" },
    { id:"psch21", brand:"Powerscreen",model:"Chieftain 2100X",
      specs:{decks:2,screenArea:[6.1,1.8]},
      curves:{apertures:[10,20,40,80],efficiency:[92,90,88,86]}, color:"#f59e0b" },
    { id:"psch22", brand:"Powerscreen",model:"Chieftain 2200X",
      specs:{decks:3,screenArea:[6.1,2.0]},
      curves:{apertures:[10,20,40,80],efficiency:[93,91,89,87]}, color:"#f59e0b" },
    { id:"km703",  brand:"Kleemann",   model:"MOBISCREEN MS 703i EVO",
      specs:{decks:3,screenArea:[7.0,1.5]},
      curves:{apertures:[10,20,40,80],efficiency:[93,91,89,87]}, color:"#06b6d4" },
    { id:"svss",   brand:"Sandvik",    model:"SS3516",
      specs:{decks:2,screenArea:[5.5,1.5]},
      curves:{apertures:[10,20,40,80],efficiency:[92,90,88,86]}, color:"#3b82f6" },
    { id:"mst28",  brand:"Metso",      model:"Lokotrack ST2.8",
      specs:{decks:3,screenArea:[6.0,1.8]},
      curves:{apertures:[10,20,40,80],efficiency:[94,92,90,88]}, color:"#ef4444" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES UI
// ─────────────────────────────────────────────────────────────────────────────
const brandColor = b=>({Finlay:"#10b981",Powerscreen:"#f59e0b",Kleemann:"#06b6d4",
  Sandvik:"#3b82f6",Metso:"#ef4444",Astec:"#8b5cf6"}[b]||"#f59e0b");

function Tag({ color, children, small }) {
  return (
    <span style={{
      background:color+"1a", color, border:`1px solid ${color}44`,
      padding:small?"1px 6px":"2px 9px", borderRadius:3,
      fontSize:small?8:9, fontFamily:T.mono, whiteSpace:"nowrap"
    }}>{children}</span>
  );
}

function StatRow({ label, a, b, unit="", higherIsBetter=false, money=false }) {
  const na = Number(a)||0, nb = Number(b)||0;
  const diff = nb - na;
  const pct = na!==0 ? ((nb-na)/Math.abs(na)*100).toFixed(1) : null;
  let winner = "tie";
  if (na!==nb) winner = higherIsBetter ? (na>nb?"A":"B") : (na<nb?"A":"B");
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",
      borderBottom:`1px solid ${T.faint}`,fontSize:10}}>
      <span style={{color:T.muted,flex:"0 0 130px",fontSize:9}}>{label}</span>
      <span style={{color:winner==="A"?T.A:T.text,fontWeight:winner==="A"?"600":"400",
        flex:"0 0 70px",textAlign:"right"}}>
        {money?"$":""}{a}{unit}
        {winner==="A" && <span style={{color:T.A,marginLeft:4}}>✓</span>}
      </span>
      <div style={{flex:1,display:"flex",alignItems:"center",gap:4}}>
        <div style={{height:4,borderRadius:2,background:T.A,
          width:`${Math.min(100,(na/(Math.max(na,nb)||1))*100)}%`,transition:"width .6s"}} />
        <div style={{height:4,borderRadius:2,background:T.B,
          width:`${Math.min(100,(nb/(Math.max(na,nb)||1))*100)}%`,transition:"width .6s"}} />
      </div>
      <span style={{color:winner==="B"?T.B:T.text,fontWeight:winner==="B"?"600":"400",
        flex:"0 0 70px",textAlign:"left"}}>
        {winner==="B" && <span style={{color:T.B,marginRight:4}}>✓</span>}
        {money?"$":""}{b}{unit}
      </span>
      {pct!==null && (
        <span style={{fontSize:8,color:diff>0?T.red:T.green,minWidth:40,textAlign:"right"}}>
          {diff>0?"+":""}{pct}%
        </span>
      )}
    </div>
  );
}

function ScoreBadge({ score, color, label }) {
  const n = Number(score);
  return (
    <div style={{textAlign:"center"}}>
      <div style={{position:"relative",display:"inline-block"}}>
        <svg width={90} height={90} viewBox="0 0 90 90">
          <circle cx={45} cy={45} r={38} fill="none" stroke={T.faint} strokeWidth={6}/>
          <circle cx={45} cy={45} r={38} fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={`${2*Math.PI*38*n/100} ${2*Math.PI*38*(1-n/100)}`}
            strokeLinecap="round" transform="rotate(-90 45 45)"
            style={{transition:"stroke-dasharray .8s ease"}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center"}}>
          <span style={{fontFamily:T.display,fontWeight:800,fontSize:22,color,lineHeight:1}}>{n}</span>
          <span style={{fontSize:8,color:T.muted}}>/100</span>
        </div>
      </div>
      <div style={{fontSize:9,color:T.muted,marginTop:4}}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECTOR DE ESCENARIO (configurador izquierda/derecha)
// ─────────────────────────────────────────────────────────────────────────────
let nodeCounter = 1;
function mkNode(type, eq) {
  return { id:`n${nodeCounter++}`, type, equipment:eq };
}

const DEFAULT_SCENARIO = (label, colorKey) => ({
  label,
  colorKey,
  tph:300, f80:600, p80Target:25, rockType:"granito", humidity:0,
  circuit:"closed", hoursPerYear:6000,
  nodes:[
    mkNode("jaw",  QUICK_EQUIP.jaw.find(e=>e.id==="fj1175")),
    mkNode("cone", QUICK_EQUIP.cone.find(e=>e.id==="fc1545")),
    mkNode("screen",QUICK_EQUIP.screen.find(e=>e.id==="f694")),
  ],
});

function ScenarioConfigurator({ scenario, onChange, color, label }) {
  const { tph, f80, p80Target, rockType, humidity, circuit, hoursPerYear, nodes } = scenario;

  const setField = (k,v) => onChange({...scenario,[k]:v});

  const setNodeEq = (nodeId, type, eqId) => {
    const eq = QUICK_EQUIP[type]?.find(e=>e.id===eqId);
    if (!eq) return;
    onChange({...scenario, nodes: scenario.nodes.map(n=>
      n.id===nodeId ? {...n, equipment:eq} : n
    )});
  };

  const addNode = (type) => {
    if (nodes.find(n=>n.type===type)) return;
    const eq = QUICK_EQUIP[type]?.[0];
    onChange({...scenario, nodes:[...nodes, mkNode(type,eq)]});
  };

  const removeNode = (nodeId) => {
    onChange({...scenario, nodes:nodes.filter(n=>n.id!==nodeId)});
  };

  const sliders = [
    {k:"tph",    label:"Tonelaje",  min:50,  max:1000, step:25,  unit:"tph"},
    {k:"f80",    label:"F80",       min:100, max:1200, step:50,  unit:"mm"},
    {k:"p80Target",label:"P80 obj.", min:5,  max:100,  step:5,   unit:"mm"},
    {k:"humidity",label:"Humedad",  min:0,   max:3,    step:1,   unit:"/3"},
    {k:"hoursPerYear",label:"Hr/año",min:2000,max:8000,step:500,unit:"h"},
  ];

  const typeLabels = {jaw:"Mandíbula",cone:"Cono",screen:"Criba",scalper:"Scalper"};
  const typeOrder  = ["scalper","jaw","cone","screen"];

  return (
    <div style={{background:T.card,border:`1px solid ${color}33`,borderRadius:10,
      padding:16,display:"flex",flexDirection:"column",gap:12}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:10,height:10,borderRadius:"50%",background:color,flexShrink:0}}/>
        <div style={{fontFamily:T.display,fontWeight:700,fontSize:14,color}}>
          ESCENARIO {label}
        </div>
      </div>

      {/* Roca + circuito */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[          {k:"rockType",label:"Roca",type:"select",
            opts:Object.entries(ROCK_DB).map(([v,r])=>({v,l:`${r.name} (Wi ${r.wi})`}))},
          {k:"circuit", label:"Circuito",type:"select",
            opts:[
              {v:"closed",l:"Cerrado estándar"},
              {v:"scalper",l:"Con Scalper"},
              {v:"mid",l:"Selección al medio"},
            ]},
        ].map(f=>(
          <div key={f.k}>
            <div style={{fontSize:8,color:T.muted,marginBottom:3,letterSpacing:"0.06em"}}>
              {f.label.toUpperCase()}
            </div>
            <select value={scenario[f.k]} onChange={e=>setField(f.k,e.target.value)}
              style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,
                borderRadius:5,padding:"6px 8px",color:T.text,fontSize:9,cursor:"pointer"}}>
              {f.opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Sliders */}
      <div style={{display:"grid",gap:8}}>
        {sliders.map(s=>(
          <div key={s.k} style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:8,color:T.muted,width:60,flexShrink:0}}>{s.label}</span>
            <input type="range" min={s.min} max={s.max} step={s.step}
              value={scenario[s.k]}
              onChange={e=>setField(s.k,Number(e.target.value))}
              style={{flex:1,accentColor:color}} />
            <span style={{fontSize:10,color,width:52,textAlign:"right",fontWeight:600}}>
              {scenario[s.k]}<span style={{fontSize:8,color:T.muted}}>{s.unit}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Equipos */}
      <div>
        <div style={{fontSize:8,color:T.muted,marginBottom:8,letterSpacing:"0.06em"}}>EQUIPOS</div>
        {[...nodes].sort((a,b)=>typeOrder.indexOf(a.type)-typeOrder.indexOf(b.type)).map(node=>(
          <div key={node.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <div style={{fontSize:8,color:node.equipment?.color||T.muted,width:58,flexShrink:0}}>
              {typeLabels[node.type]}
            </div>
            <select value={node.equipment?.id||""}
              onChange={e=>setNodeEq(node.id,node.type,e.target.value)}
              style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,
                borderRadius:4,padding:"5px 6px",color:T.text,fontSize:8,cursor:"pointer"}}>
              {(QUICK_EQUIP[node.type]||[]).map(e=>(
                <option key={e.id} value={e.id}>{e.brand} {e.model}</option>
              ))}
            </select>
            <button onClick={()=>removeNode(node.id)} style={{
              width:18,height:18,borderRadius:"50%",background:T.faint,
              border:"none",color:T.muted,fontSize:10,cursor:"pointer",flexShrink:0
            }}>×</button>
          </div>
        ))}
        {/* Agregar equipo */}
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:4}}>
          {["scalper","jaw","cone","screen"]
            .filter(t=>!nodes.find(n=>n.type===t))
            .map(t=>(
              <button key={t} onClick={()=>addNode(t)} style={{
                padding:"3px 8px",background:"none",border:`1px solid ${T.border}`,
                borderRadius:4,color:T.muted,fontSize:8,cursor:"pointer"
              }}>+ {typeLabels[t]}</button>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRÁFICO DE BARRAS HORIZONTAL
// ─────────────────────────────────────────────────────────────────────────────
function BarChart({ title, items, maxVal }) {
  const max = maxVal || Math.max(...items.map(i=>Math.max(Number(i.a||0),Number(i.b||0))),1);
  return (
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:14}}>
      <div style={{fontSize:9,color:T.muted,letterSpacing:"0.08em",marginBottom:12}}>{title}</div>
      {items.map(item=>(
        <div key={item.label} style={{marginBottom:10}}>
          <div style={{fontSize:9,color:T.text,marginBottom:3}}>{item.label}</div>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            <div style={{flex:1,height:10,background:T.faint,borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(Number(item.a)||0)/max*100}%`,
                background:T.A,borderRadius:3,transition:"width .7s ease"}}/>
            </div>
            <span style={{fontSize:8,color:T.A,width:50,textAlign:"right"}}>{item.a}{item.unit}</span>
          </div>
          <div style={{display:"flex",gap:4,alignItems:"center",marginTop:2}}>
            <div style={{flex:1,height:10,background:T.faint,borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(Number(item.b)||0)/max*100}%`,
                background:T.B,borderRadius:3,transition:"width .7s ease"}}/>
            </div>
            <span style={{fontSize:8,color:T.B,width:50,textAlign:"right"}}>{item.b}{item.unit}</span>
          </div>
        </div>
      ))}
      <div style={{display:"flex",gap:16,marginTop:8}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <div style={{width:12,height:4,background:T.A,borderRadius:2}}/>
          <span style={{fontSize:8,color:T.muted}}>Escenario A</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <div style={{width:12,height:4,background:T.B,borderRadius:2}}/>
          <span style={{fontSize:8,color:T.muted}}>Escenario B</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL ANÁLISIS IA COMPARATIVO
// ─────────────────────────────────────────────────────────────────────────────
function AIComparison({ resA, resB, scA, scB, loading, text }) {
  return (
    <div style={{background:`linear-gradient(135deg,${T.card},${T.surface})`,
      border:`1px solid ${T.A}44`,borderRadius:10,padding:18}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{
          width:32,height:32,borderRadius:"50%",flexShrink:0,
          background:`linear-gradient(135deg,${T.A},#d97706)`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:16
        }}>◈</div>
        <div>
          <div style={{fontFamily:T.display,fontWeight:700,fontSize:13,color:T.A}}>
            KrushRock — Análisis Comparativo
          </div>
          <div style={{fontSize:9,color:T.muted}}>
            Esc. A vs Esc. B · evaluación técnica y económica
          </div>
        </div>
        {loading && <div className="pulse" style={{marginLeft:"auto",fontSize:9,color:T.muted}}>
          ● Analizando...
        </div>}
      </div>
      {loading ? (
        <div style={{height:80,display:"flex",alignItems:"center"}}>
          <div className="pulse" style={{fontSize:11,color:T.muted}}>
            Procesando comparación de circuitos...
          </div>
        </div>
      ) : (
        <div className="fu" style={{fontSize:10,color:T.text,lineHeight:1.75,whiteSpace:"pre-wrap"}}>
          {text || "Configura ambos escenarios y presiona COMPARAR para obtener el análisis."}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLA OPEX DETALLADA
// ─────────────────────────────────────────────────────────────────────────────
function OPEXTable({ opexA, opexB }) {
  const rows = [
    {l:"Energía",         a:opexA.energyCostTon,  b:opexB.energyCostTon,  u:" USD/t", hi:false},
    {l:"Mano de obra",    a:opexA.laborCostTon,   b:opexB.laborCostTon,   u:" USD/t", hi:false},
    {l:"Mantenimiento",   a:opexA.maintCostTon,   b:opexB.maintCostTon,   u:" USD/t", hi:false},
    {l:"Desgaste piezas", a:opexA.wearCostTon,    b:opexB.wearCostTon,    u:" USD/t", hi:false},
    {l:"TOTAL OPEX",      a:opexA.totalCostTon,   b:opexB.totalCostTon,   u:" USD/t", hi:false, bold:true},
    {l:"Producción anual",a:opexA.tonYear,         b:opexB.tonYear,         u:" kt/año",hi:true},
    {l:"Costo total año", a:opexA.totalCostYear,  b:opexB.totalCostYear,  u:"k USD",  hi:false},
    {l:"Capital equipos", a:opexA.capitalUSD,      b:opexB.capitalUSD,      u:" M USD", hi:false},
    {l:"EBITDA estimado", a:opexA.ebitda,          b:opexB.ebitda,          u:"k USD/año",hi:true,bold:true},
    {l:"Margen EBITDA",   a:opexA.ebitdaPct,      b:opexB.ebitdaPct,      u:"%",      hi:true},
    {l:"Energía específica",a:opexA.energyKwhTon, b:opexB.energyKwhTon,   u:" kWh/t", hi:false},
    {l:"Mantenimiento año",a:opexA.maintUSDyr,    b:opexB.maintUSDyr,     u:"k USD",  hi:false},
  ];

  return (
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden"}}>
      <div style={{background:T.surface,padding:"10px 14px",display:"flex",
        justifyContent:"space-between",alignItems:"center",
        borderBottom:`1px solid ${T.border}`}}>
        <div style={{fontSize:9,color:T.muted,letterSpacing:"0.08em"}}>◈ ANÁLISIS OPEX COMPARATIVO</div>
        <div style={{display:"flex",gap:16}}>
          <Tag color={T.A}>Escenario A</Tag>
          <Tag color={T.B}>Escenario B</Tag>
        </div>
      </div>
      <div style={{padding:"0 4px"}}>
        {rows.map(row=>(
          <StatRow key={row.l} label={row.l}
            a={row.a} b={row.b} unit={row.u}
            higherIsBetter={row.hi} />
        ))}
      </div>
      <div style={{padding:"8px 14px",background:T.surface,
        borderTop:`1px solid ${T.border}`,fontSize:8,color:T.muted}}>
        * EBITDA estimado con precio árido referencial 8 USD/t. Solo referencia orientativa.
        Mantenimiento estimado según valores publicados equipos. Verificar con operación real.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [scenarioA, setScenarioA] = useState(()=>DEFAULT_SCENARIO("A","A"));
  const [scenarioB, setScenarioB] = useState(()=>({
    ...DEFAULT_SCENARIO("B","B"),
    nodes:[
      mkNode("jaw",   QUICK_EQUIP.jaw.find(e=>e.id==="fj1280")),
      mkNode("cone",  QUICK_EQUIP.cone.find(e=>e.id==="fc1550")),
      mkNode("screen",QUICK_EQUIP.screen.find(e=>e.id==="f696")),
    ],
  }));

  const [resA, setResA] = useState(null);
  const [resB, setResB] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("tecnico");

  const handleCompare = useCallback(async () => {
    setComparing(true);
    setAiLoading(true);
    setAiText("");

    const rA = simulateScenario(scenarioA);
    const rB = simulateScenario(scenarioB);
    setResA(rA);
    setResB(rB);
    setComparing(false);

    // IA comparativa
    const rockA = ROCK_DB[scenarioA.rockType];
    const rockB = ROCK_DB[scenarioB.rockType];

    const eqA = scenarioA.nodes.map(n=>`${n.equipment?.brand} ${n.equipment?.model}`).join(" + ");
    const eqB = scenarioB.nodes.map(n=>`${n.equipment?.brand} ${n.equipment?.model}`).join(" + ");

    const prompt = `Eres KrushRock, experto en ingeniería de chancado y análisis económico de plantas móviles en Chile.

Compara estos dos circuitos de chancado y selección:

ESCENARIO A:
- Equipos: ${eqA}
- Roca: ${rockA?.name} (Wi=${rockA?.wi}, ab=${rockA?.ab})
- Alimentación: ${scenarioA.tph} tph | F80=${scenarioA.f80}mm | P80 obj=${scenarioA.p80Target}mm
- Score eficiencia: ${rA.effScore}/100 | P80 final: ${rA.finalP80}mm | CC: ${rA.circLoad}%
- OPEX total: ${rA.opex.totalCostTon} USD/t | EBITDA: ${rA.opex.ebitda}k USD/año (${rA.opex.ebitdaPct}%)
- Capital equipos: ${rA.opex.capitalUSD} M USD | Bottlenecks: ${rA.bottlenecks.join(",")||"ninguno"}

ESCENARIO B:
- Equipos: ${eqB}
- Roca: ${rockB?.name} (Wi=${rockB?.wi}, ab=${rockB?.ab})
- Alimentación: ${scenarioB.tph} tph | F80=${scenarioB.f80}mm | P80 obj=${scenarioB.p80Target}mm
- Score eficiencia: ${rB.effScore}/100 | P80 final: ${rB.finalP80}mm | CC: ${rB.circLoad}%
- OPEX total: ${rB.opex.totalCostTon} USD/t | EBITDA: ${rB.opex.ebitda}k USD/año (${rB.opex.ebitdaPct}%)
- Capital equipos: ${rB.opex.capitalUSD} M USD | Bottlenecks: ${rB.bottlenecks.join(",")||"ninguno"}

Entrega un análisis comparativo técnico-económico en español (máximo 220 palabras):
1. **Veredicto** (qué escenario recomiendas y por qué, en 2 líneas)
2. **Ventajas A** (2-3 bullets con ●)
3. **Ventajas B** (2-3 bullets con ●)
4. **Consideración económica** (payback, OPEX diferencial)
5. **Recomendación final** (1 línea)

Sé directo, técnico, orientado a decisión de compra o diseño de planta.`;

    try {
      const r = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
          messages:[{role:"user",content:prompt}] })
      });
      const d = await r.json();
      setAiText(d.content?.find(b=>b.type==="text")?.text||"No disponible.");
    } catch {
      setAiText("Análisis IA no disponible. Revisa los KPIs para diagnóstico manual.");
    }
    setAiLoading(false);
  }, [scenarioA, scenarioB]);

  const tabs = [
    {id:"tecnico",  label:"Técnico"},
    {id:"opex",     label:"OPEX"},
    {id:"graficos", label:"Gráficos"},
    {id:"ia",       label:"◈ IA"},
  ];

  const bothReady = resA && resB;

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column"}}>
      <style>{CSS_INJECT}</style>

      {/* ── TOPBAR ─────────────────────────────────────────────────────── */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,
        padding:"10px 18px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <div style={{width:36,height:36,borderRadius:8,flexShrink:0,
          background:`linear-gradient(135deg,${T.A},#d97706)`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontFamily:T.display,fontWeight:900,fontSize:16,color:"#000"}}>CS</div>
        <div>
          <div style={{fontFamily:T.display,fontWeight:800,fontSize:17,color:T.A}}>
            KrushRock
          </div>
          <div style={{fontSize:8,color:T.muted,letterSpacing:"0.12em"}}>
            FASE 4 · COMPARADOR DE ESCENARIOS + MÓDULO OPEX
          </div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:T.A}}/>
            <span style={{fontSize:9,color:T.A}}>Esc. A</span>
          </div>
          <span style={{color:T.muted,fontSize:12}}>vs</span>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:T.B}}/>
            <span style={{fontSize:9,color:T.B}}>Esc. B</span>
          </div>
          <button onClick={handleCompare} disabled={comparing} style={{
            marginLeft:12, padding:"8px 20px",
            background:comparing?"none":`linear-gradient(135deg,${T.A},#d97706)`,
            border:comparing?`1px solid ${T.border}`:"none",
            borderRadius:7,color:comparing?T.muted:"#000",
            fontFamily:T.display,fontWeight:700,fontSize:12,
            cursor:comparing?"not-allowed":"pointer",
            animation:!comparing?"glow 2s ease infinite":"none",
          }}>
            {comparing?"▶ PROCESANDO…":"▶ COMPARAR"}
          </button>
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>

        {/* Panel izquierdo — configuradores */}
        <div style={{width:340,flexShrink:0,overflowY:"auto",
          borderRight:`1px solid ${T.border}`,
          background:T.surface,padding:12,display:"flex",flexDirection:"column",gap:12}}>
          <ScenarioConfigurator scenario={scenarioA} onChange={setScenarioA}
            color={T.A} label="A" />
          <ScenarioConfigurator scenario={scenarioB} onChange={setScenarioB}
            color={T.B} label="B" />
        </div>

        {/* Panel derecho — resultados */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Tabs */}
          <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,
            background:T.surface,flexShrink:0}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
                flex:1,padding:"11px 4px",background:"none",border:"none",
                borderBottom:`2px solid ${activeTab===t.id?T.A:"transparent"}`,
                color:activeTab===t.id?T.A:T.muted,
                fontSize:11,cursor:"pointer",fontFamily:T.display,fontWeight:600,
                letterSpacing:"0.03em",transition:"all .2s"
              }}>{t.label}</button>
            ))}
          </div>

          {/* Contenido tabs */}
          <div style={{flex:1,overflowY:"auto",padding:16}}>

            {/* ── TAB TÉCNICO ── */}
            {activeTab==="tecnico" && (
              <div style={{display:"grid",gap:14}} className="fu">

                {/* Scores */}
                <div style={{background:T.card,border:`1px solid ${T.border}`,
                  borderRadius:10,padding:18}}>
                  <div style={{fontSize:9,color:T.muted,letterSpacing:"0.08em",marginBottom:16}}>
                    SCORE DE EFICIENCIA GLOBAL
                  </div>
                  <div style={{display:"flex",justifyContent:"space-around",alignItems:"center"}}>
                    <ScoreBadge score={resA?.effScore||0} color={T.A} label="Escenario A" />
                    <div style={{textAlign:"center"}}>
                      {bothReady && (
                        <>
                          <div style={{fontFamily:T.display,fontSize:11,color:T.muted}}>GANADOR</div>
                          <div style={{fontFamily:T.display,fontSize:24,fontWeight:800,
                            color:Number(resA.effScore)>=Number(resB.effScore)?T.A:T.B}}>
                            {Number(resA.effScore)>=Number(resB.effScore)?"A":"B"}
                          </div>
                          <div style={{fontSize:9,color:T.muted}}>eficiencia técnica</div>
                        </>
                      )}
                      {!bothReady && <div style={{fontSize:24,color:T.muted}}>vs</div>}
                    </div>
                    <ScoreBadge score={resB?.effScore||0} color={T.B} label="Escenario B" />
                  </div>
                </div>

                {/* Comparación KPIs */}
                {bothReady && (
                  <div style={{background:T.card,border:`1px solid ${T.border}`,
                    borderRadius:10,overflow:"hidden"}}>
                    <div style={{background:T.surface,padding:"10px 14px",
                      borderBottom:`1px solid ${T.border}`,
                      display:"flex",justifyContent:"space-between"}}>
                      <div style={{fontSize:9,color:T.muted,letterSpacing:"0.08em"}}>
                        ◈ COMPARACIÓN TÉCNICA
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <Tag color={T.A} small>A = mejor</Tag>
                        <Tag color={T.B} small>B = mejor</Tag>
                      </div>
                    </div>
                    <div style={{padding:"4px 14px 12px"}}>
                      <StatRow label="P80 final (mm)" a={resA.finalP80} b={resB.finalP80}
                        unit=" mm" higherIsBetter={false} />
                      <StatRow label="Score eficiencia" a={resA.effScore} b={resB.effScore}
                        unit="/100" higherIsBetter={true} />
                      <StatRow label="Carga circulante" a={resA.circLoad} b={resB.circLoad}
                        unit="%" higherIsBetter={false} />
                      <StatRow label="Tonelaje proceso" a={resA.tph} b={resB.tph}
                        unit=" tph" higherIsBetter={true} />
                      <StatRow label="P80 objetivo" a={resA.p80Target} b={resB.p80Target}
                        unit=" mm" higherIsBetter={false} />
                      <StatRow label="Energía específica" a={resA.opex?.energyKwhTon} b={resB.opex?.energyKwhTon}
                        unit=" kWh/t" higherIsBetter={false} />
                    </div>
                  </div>
                )}

                {/* Equipos comparados */}
                {bothReady && (
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {[{sc:scenarioA,res:resA,color:T.A,lbl:"A"},
                      {sc:scenarioB,res:resB,color:T.B,lbl:"B"}].map(({sc,res,color,lbl})=>(
                      <div key={lbl} style={{background:T.card,
                        border:`1px solid ${color}33`,borderRadius:8,padding:12}}>
                        <div style={{fontSize:9,color,marginBottom:8,fontWeight:600,
                          letterSpacing:"0.06em"}}>ESC. {lbl}</div>
                        {sc.nodes.map(n=>{
                          const r = res.nodeResults[n.id];
                          const typeL={jaw:"JAW",cone:"CONO",screen:"CRIBA",scalper:"SCALPER"};
                          return (
                            <div key={n.id} style={{marginBottom:6,padding:"5px 8px",
                              background:T.surface,borderRadius:5,
                              borderLeft:`2px solid ${n.equipment?.color||color}`}}>
                              <div style={{fontSize:8,color:n.equipment?.color||color}}>
                                {typeL[n.type]} · {n.equipment?.brand} {n.equipment?.model}
                              </div>
                              {r && (n.type==="jaw"||n.type==="cone") && (
                                <div style={{fontSize:8,color:T.muted,marginTop:2}}>
                                  P80→{r.p80out}mm · CSS {r.css}mm · {r.utilization}% util.
                                </div>
                              )}
                              {r && (n.type==="screen"||n.type==="scalper") && (
                                <div style={{fontSize:8,color:T.muted,marginTop:2}}>
                                  Efic {r.efficiency}% · CC {r.circLoad}%
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {res.bottlenecks?.length>0 && (
                          <div style={{fontSize:8,color:T.red,marginTop:6}}>
                            ⚠ {res.bottlenecks.join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!bothReady && (
                  <div style={{textAlign:"center",padding:"40px 20px",color:T.muted,fontSize:12}}>
                    <div style={{fontSize:32,marginBottom:12,opacity:0.4}}>◈</div>
                    Configura los escenarios y presiona<br/>
                    <strong style={{color:T.A}}>▶ COMPARAR</strong>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB OPEX ── */}
            {activeTab==="opex" && bothReady && (
              <div style={{display:"grid",gap:14}} className="fu">
                {/* Ganador económico */}
                <div style={{background:T.card,border:`1px solid ${T.border}`,
                  borderRadius:10,padding:18}}>
                  <div style={{fontSize:9,color:T.muted,letterSpacing:"0.08em",marginBottom:12}}>
                    COSTO OPERACIONAL USD/TONELADA
                  </div>
                  <div style={{display:"flex",justifyContent:"space-around",gap:12}}>
                    {[{r:resA,color:T.A,lbl:"A"},{r:resB,color:T.B,lbl:"B"}].map(({r,color,lbl})=>(
                      <div key={lbl} style={{flex:1,textAlign:"center",
                        background:T.surface,borderRadius:8,padding:14,
                        border:`1px solid ${color}33`}}>
                        <div style={{fontSize:9,color:T.muted}}>Escenario {lbl}</div>
                        <div style={{fontFamily:T.display,fontSize:32,fontWeight:800,
                          color,lineHeight:1,marginTop:6}}>
                          ${r.opex.totalCostTon}
                        </div>
                        <div style={{fontSize:8,color:T.muted,marginTop:3}}>USD/tonelada</div>
                        <div style={{marginTop:10,fontSize:10,color:T.green,fontWeight:600}}>
                          EBITDA {r.opex.ebitdaPct}%
                        </div>
                        <div style={{fontSize:8,color:T.muted}}>{r.opex.ebitda}k USD/año</div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:12,textAlign:"center",fontSize:11,
                    color:Number(resA.opex.totalCostTon)<Number(resB.opex.totalCostTon)?T.A:T.B,
                    fontFamily:T.display,fontWeight:700}}>
                    {Number(resA.opex.totalCostTon)<Number(resB.opex.totalCostTon)
                      ? "⬇ Escenario A es más económico"
                      : "⬇ Escenario B es más económico"}
                    {" · Δ $"}{Math.abs(
                      Number(resA.opex.totalCostTon)-Number(resB.opex.totalCostTon)
                    ).toFixed(3)} USD/t
                  </div>
                </div>
                <OPEXTable opexA={resA.opex} opexB={resB.opex} />
              </div>
            )}

            {activeTab==="opex" && !bothReady && (
              <div style={{textAlign:"center",padding:"60px 20px",color:T.muted}}>
                Presiona <strong style={{color:T.A}}>COMPARAR</strong> para ver el análisis OPEX
              </div>
            )}

            {/* ── TAB GRÁFICOS ── */}
            {activeTab==="graficos" && bothReady && (
              <div style={{display:"grid",gap:14}} className="fu">
                <BarChart title="EFICIENCIA Y PRODUCCIÓN"
                  items={[
                    {label:"Score eficiencia (/100)",   a:resA.effScore,         b:resB.effScore,         unit:""},
                    {label:"P80 final (mm)",              a:resA.finalP80,         b:resB.finalP80,         unit:" mm"},
                    {label:"Carga circulante (%)",        a:resA.circLoad,         b:resB.circLoad,         unit:"%"},
                    {label:"Producción (kt/año)",         a:resA.opex.tonYear,     b:resB.opex.tonYear,     unit:" kt"},
                  ]} />
                <BarChart title="COSTOS OPEX (USD/TONELADA)"
                  items={[
                    {label:"Energía",        a:resA.opex.energyCostTon, b:resB.opex.energyCostTon, unit:" USD/t"},
                    {label:"Mano de obra",   a:resA.opex.laborCostTon,  b:resB.opex.laborCostTon,  unit:" USD/t"},
                    {label:"Mantenimiento",  a:resA.opex.maintCostTon,  b:resB.opex.maintCostTon,  unit:" USD/t"},
                    {label:"Desgaste",       a:resA.opex.wearCostTon,   b:resB.opex.wearCostTon,   unit:" USD/t"},
                    {label:"TOTAL",          a:resA.opex.totalCostTon,  b:resB.opex.totalCostTon,  unit:" USD/t"},
                  ]} />
                <BarChart title="INVERSIÓN vs RETORNO"
                  items={[
                    {label:"Capital equipos (M USD)",   a:resA.opex.capitalUSD,  b:resB.opex.capitalUSD,  unit:" M"},
                    {label:"EBITDA anual (k USD)",       a:resA.opex.ebitda,      b:resB.opex.ebitda,      unit:"k"},
                    {label:"Mant. anual (k USD)",        a:resA.opex.maintUSDyr,  b:resB.opex.maintUSDyr,  unit:"k"},
                  ]} />
              </div>
            )}

            {activeTab==="graficos" && !bothReady && (
              <div style={{textAlign:"center",padding:"60px 20px",color:T.muted}}>
                Presiona <strong style={{color:T.A}}>COMPARAR</strong> para ver gráficos
              </div>
            )}

            {/* ── TAB IA ── */}
            {activeTab==="ia" && (
              <div className="fu">
                <AIComparison resA={resA} resB={resB}
                  scA={scenarioA} scB={scenarioB}
                  loading={aiLoading} text={aiText} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
