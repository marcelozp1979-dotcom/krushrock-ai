import { useState, useCallback } from "react";

const T = {
  bg:"#08090f", surface:"#0e1118", card:"#141924",
  border:"#232d42", amber:"#f59e0b", green:"#10b981",
  red:"#ef4444", blue:"#3b82f6", purple:"#8b5cf6",
  cyan:"#06b6d4", text:"#dde3f0", muted:"#56647a", faint:"#1a2540",
  mono:"'JetBrains Mono',monospace", display:"'Syne',sans-serif",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:${T.bg};color:${T.text};font-family:${T.mono}}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${T.surface}}
::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
input[type=range]{-webkit-appearance:none;height:3px;background:${T.border};border-radius:2px;outline:none;cursor:pointer;width:100%}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:${T.amber};cursor:pointer}
@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes flow{to{stroke-dashoffset:-12}}
.fu{animation:fu .3s ease forwards}
.pulse{animation:pulse 1.3s ease infinite}
.flow{stroke-dasharray:6 3;animation:flow .6s linear infinite}
`;

// ── EQUIPOS ────────────────────────────────────────────────────────────────
const BC = {Powerscreen:T.amber,Kleemann:T.cyan,Finlay:T.green,Sandvik:T.blue,Metso:T.red,Astec:T.purple};
const EQ = {
  jaw:[
    {id:"fj960", brand:"Finlay",model:"J-960",specs:{cssRange:[50,150],capRange:[100,250],feedOpen:[900,600],weight:28,engine:"CAT C7.1 168kW"},curves:{css:[50,75,100,125,150],tph:[100,150,195,225,250],p80f:[3.0,3.2,3.4,3.5,3.6]},notes:"Compacto. Fácil transporte."},
    {id:"fj1160",brand:"Finlay",model:"J-1160",specs:{cssRange:[40,145],capRange:[180,350],feedOpen:[1000,600],weight:35,engine:"CAT C9 224kW"},curves:{css:[50,75,100,120,145],tph:[180,240,290,325,350],p80f:[3.1,3.3,3.4,3.5,3.6]},notes:"Drive hidrostático con reversa."},
    {id:"fj1175",brand:"Finlay",model:"J-1175",specs:{cssRange:[75,150],capRange:[220,380],feedOpen:[1100,762],weight:50,engine:"CAT C9 224kW"},curves:{css:[75,100,125,140,150],tph:[220,290,340,365,380],p80f:[3.1,3.3,3.4,3.5,3.6]},notes:"Muy usada en Chile."},
    {id:"fj1280",brand:"Finlay",model:"J-1280",specs:{cssRange:[75,200],capRange:[300,500],feedOpen:[1200,820],weight:69,engine:"Scania 331kW"},curves:{css:[75,100,150,175,200],tph:[300,370,460,485,500],p80f:[3.2,3.4,3.6,3.7,3.8]},notes:"68.9t. Drive directo con clutch."},
    {id:"fj1480",brand:"Finlay",model:"J-1480",specs:{cssRange:[85,225],capRange:[400,750],feedOpen:[1415,820],weight:79,engine:"Scania 331kW"},curves:{css:[85,110,140,175,225],tph:[400,490,570,700,750],p80f:[3.3,3.4,3.5,3.7,3.8]},notes:"Mayor mandíbula Finlay. JW55."},
    {id:"ps1180",brand:"Powerscreen",model:"Premiertrak 1180",specs:{cssRange:[75,175],capRange:[200,400],feedOpen:[1070,760],weight:56,engine:"CAT C13 328kW"},curves:{css:[75,100,125,150,175],tph:[200,270,320,370,400],p80f:[3.2,3.4,3.5,3.6,3.7]},notes:"Minería mediana Chile."},
    {id:"ps600", brand:"Powerscreen",model:"Premiertrak 600",specs:{cssRange:[90,200],capRange:[350,600],feedOpen:[1200,820],weight:72,engine:"CAT C18 522kW"},curves:{css:[90,120,150,175,200],tph:[350,430,500,560,600],p80f:[3.2,3.4,3.5,3.6,3.7]},notes:"Alta capacidad."},
    {id:"km110", brand:"Kleemann",model:"MC 110i EVO2",specs:{cssRange:[70,150],capRange:[200,350],feedOpen:[1100,700],weight:48,engine:"CAT C9.3B 261kW"},curves:{css:[70,90,110,130,150],tph:[200,260,300,330,350],p80f:[3.1,3.3,3.4,3.5,3.6]},notes:"SPECTIVE digital."},
    {id:"km120", brand:"Kleemann",model:"MC 120i PRO",specs:{cssRange:[80,180],capRange:[280,450],feedOpen:[1200,800],weight:62,engine:"MAN D2676 353kW"},curves:{css:[80,110,140,160,180],tph:[280,350,400,430,450],p80f:[3.2,3.4,3.5,3.6,3.7]},notes:"Antiatasco hidráulico."},
    {id:"svuj",  brand:"Sandvik",model:"UJ440i",specs:{cssRange:[80,200],capRange:[300,500],feedOpen:[1200,830],weight:67,engine:"Volvo D13 324kW"},curves:{css:[80,110,140,170,200],tph:[300,380,440,480,500],p80f:[3.2,3.4,3.5,3.6,3.8]},notes:"My Fleet remoto."},
    {id:"mlt120",brand:"Metso",model:"Lokotrack LT120",specs:{cssRange:[90,200],capRange:[400,650],feedOpen:[1200,870],weight:78,engine:"CAT C18 522kW"},curves:{css:[90,120,150,175,200],tph:[400,490,560,610,650],p80f:[3.3,3.4,3.5,3.6,3.8]},notes:"Ícono en minas Chile."},
    {id:"ag440", brand:"Astec",model:"GT440",specs:{cssRange:[75,150],capRange:[200,360],feedOpen:[1067,762],weight:49,engine:"JD 6135 261kW"},curves:{css:[75,100,120,140,150],tph:[200,270,315,345,360],p80f:[3.1,3.3,3.4,3.5,3.6]},notes:"Robusto áridos."},
  ],
  cone:[
    {id:"fc1540",brand:"Finlay",model:"C-1540",specs:{cssRange:[8,38],capRange:[90,270],chamber:"ø1000mm",weight:38,engine:"CAT C9 224kW"},curves:{css:[8,13,19,25,38],tph:[90,135,185,225,270],p80f:[2.8,3.0,3.2,3.5,3.8]},notes:"Metal detection con purge."},
    {id:"fc1545",brand:"Finlay",model:"C-1545",specs:{cssRange:[14,45],capRange:[150,400],chamber:"TC1150 ø1150mm",weight:43,engine:"CAT C13 328kW"},curves:{css:[14,18,22,28,36,45],tph:[150,195,245,300,360,400],p80f:[2.9,3.1,3.2,3.5,3.7,3.9]},notes:"43.44t. 3 config. cámara."},
    {id:"fc1550",brand:"Finlay",model:"C-1550",specs:{cssRange:[16,50],capRange:[200,500],chamber:"Terex 1300 ø1300mm",weight:65,engine:"CAT C13 328kW"},curves:{css:[16,22,28,36,44,50],tph:[200,265,320,390,455,500],p80f:[3.0,3.2,3.3,3.6,3.8,4.0]},notes:"Mayor cono Finlay. 64.5t."},
    {id:"ps1000",brand:"Powerscreen",model:"1000 Maxtrak",specs:{cssRange:[6,44],capRange:[90,280],chamber:"Automax ø1000mm",weight:38,engine:"CAT C9 224kW"},curves:{css:[6,10,16,22,32,44],tph:[90,130,180,220,260,280],p80f:[2.8,3.0,3.2,3.5,3.8,4.0]},notes:"Excelente piedra fina."},
    {id:"ps1300",brand:"Powerscreen",model:"1300 Maxtrak",specs:{cssRange:[8,50],capRange:[130,380],chamber:"Automax ø1300mm",weight:52,engine:"CAT C13 328kW"},curves:{css:[8,13,19,25,38,50],tph:[130,190,250,300,350,380],p80f:[2.8,3.0,3.2,3.5,3.8,4.0]},notes:"Muy difundida en Chile."},
    {id:"km90",  brand:"Kleemann",model:"MCO 90i EVO2",specs:{cssRange:[8,30],capRange:[80,250],chamber:"ø900mm",weight:36,engine:"CAT C9.3B 261kW"},curves:{css:[8,12,18,24,30],tph:[80,120,170,210,250],p80f:[2.8,3.0,3.2,3.5,3.8]},notes:"Integra con MOBICAT."},
    {id:"km110c",brand:"Kleemann",model:"MCO 110i PRO",specs:{cssRange:[10,44],capRange:[120,350],chamber:"ø1100mm PRO",weight:50,engine:"MAN D2676 353kW"},curves:{css:[10,16,22,32,44],tph:[120,180,240,300,350],p80f:[2.9,3.1,3.3,3.6,3.9]},notes:"SPECTIVE diagnóstico RT."},
    {id:"svuc",  brand:"Sandvik",model:"UC440i",specs:{cssRange:[6,44],capRange:[100,340],chamber:"CH440 ø1100mm",weight:42,engine:"Scania DC13 317kW"},curves:{css:[6,10,16,25,38,44],tph:[100,150,210,270,320,340],p80f:[2.8,3.0,3.2,3.5,3.8,4.0]},notes:"ASRi automático."},
    {id:"mlt220",brand:"Metso",model:"Lokotrack LT220D",specs:{cssRange:[8,48],capRange:[120,400],chamber:"HP200 ø1100mm",weight:58,engine:"CAT C13 328kW"},curves:{css:[8,13,19,25,38,48],tph:[120,185,255,310,370,400],p80f:[2.9,3.1,3.3,3.5,3.8,4.0]},notes:"Cono + criba integrada."},
    {id:"akk300",brand:"Astec",model:"Kodiak K300+",specs:{cssRange:[6,38],capRange:[85,280],chamber:"K300 ø1000mm",weight:36,engine:"Cummins QSX15 391kW"},curves:{css:[6,10,16,22,32,38],tph:[85,130,180,220,260,280],p80f:[2.8,3.0,3.2,3.5,3.8,4.0]},notes:"Cámara intercambiable."},
  ],
  screen:[
    {id:"f683",  brand:"Finlay",model:"683 — 2 deck",specs:{decks:2,area:"3.66×1.52m",capRange:[100,350],weight:24,engine:"CAT C4.4 83kW"},curves:{ap:[10,20,40,80],eff:[91,89,87,85]},notes:"2 decks. Ángulo 18–39°."},
    {id:"f684t", brand:"Finlay",model:"684T — 2 deck",specs:{decks:2,area:"4.3×1.7m",capRange:[150,450],weight:27,engine:"CAT C4.4 97kW"},curves:{ap:[10,20,40,80],eff:[92,90,88,86]},notes:"Portátil fácil transporte."},
    {id:"f694",  brand:"Finlay",model:"694 — 3 deck",specs:{decks:3,area:"6.1×1.53m",capRange:[200,600],weight:32,engine:"CAT C4.4 97kW"},curves:{ap:[10,20,40,80],eff:[93,91,89,87]},notes:"Hybrid diesel/eléctrico."},
    {id:"f696",  brand:"Finlay",model:"696 — 3 deck",specs:{decks:3,area:"6.1×1.52m",capRange:[250,700],weight:36,engine:"CAT C7.1 168kW"},curves:{ap:[10,20,40,80],eff:[94,92,90,88]},notes:"Mayor criba Finlay."},
    {id:"psch22",brand:"Powerscreen",model:"Chieftain 2200X",specs:{decks:3,area:"6.1×2.0m",capRange:[200,600],weight:32,engine:"CAT C4.4 97kW"},curves:{ap:[10,20,40,80],eff:[93,91,89,87]},notes:"Equiv. F694 3-deck."},
    {id:"psw24", brand:"Powerscreen",model:"Warrior 2400",specs:{decks:3,area:"6.1×1.52m",capRange:[250,650],weight:35,engine:"CAT C4.4 97kW"},curves:{ap:[10,20,40,80],eff:[93,91,89,87]},notes:"Equiv. F696. Criba pesada."},
    {id:"km703", brand:"Kleemann",model:"MS 703i EVO",specs:{decks:3,area:"7.0×1.5m",capRange:[180,550],weight:30,engine:"CAT C4.4 97kW"},curves:{ap:[10,20,40,80],eff:[93,91,89,87]},notes:"Equiv. F694. Ángulo hidráulico."},
    {id:"km952", brand:"Kleemann",model:"MS 952i EVO",specs:{decks:3,area:"9.0×1.5m",capRange:[300,750],weight:38,engine:"CAT C4.4 97kW"},curves:{ap:[10,20,40,80],eff:[94,92,90,88]},notes:"Equiv. F696. Mayor Kleemann."},
    {id:"mst28", brand:"Metso",model:"Lokotrack ST2.8",specs:{decks:3,area:"6.0×1.8m",capRange:[200,650],weight:35,engine:"CAT C7.1 168kW"},curves:{ap:[10,20,40,80],eff:[94,92,90,88]},notes:"Equiv. F694. Alta eficiencia."},
    {id:"mst620",brand:"Metso",model:"Lokotrack ST620",specs:{decks:3,area:"6.2×2.0m",capRange:[300,800],weight:40,engine:"CAT C9 224kW"},curves:{ap:[10,20,40,80],eff:[94,92,90,88]},notes:"Equiv. F696. Alta capacidad."},
  ],
  scalper:[
    {id:"psw18", brand:"Powerscreen",model:"Warrior 1800",specs:{decks:2,area:"5.5×1.5m",capRange:[250,700],weight:26,engine:"CAT C4.4 97kW"},curves:{ap:[40,80,120],eff:[89,87,85]},notes:"Scalper pesado 2 decks."},
    {id:"km702s",brand:"Kleemann",model:"MSR 702i EVO",specs:{decks:2,area:"7.0×2.0m",capRange:[300,900],weight:28,engine:"CAT C4.4 97kW"},curves:{ap:[40,80,120],eff:[90,88,86]},notes:"Rocker screen. Pre-primario."},
    {id:"f883",  brand:"Finlay",model:"883+ Scalper",specs:{decks:2,area:"5.0×1.52m",capRange:[250,800],weight:22,engine:"CAT C4.4 74kW"},curves:{ap:[40,80,120],eff:[88,86,84]},notes:"Grizzly+scalper. Separa finos."},
    {id:"f893s", brand:"Finlay",model:"893+ Scalper",specs:{decks:3,area:"5.5×1.52m",capRange:[350,1000],weight:28,engine:"CAT C4.4 97kW"},curves:{ap:[40,80,120],eff:[90,88,86]},notes:"3 decks alta capacidad."},
    {id:"mst35", brand:"Metso",model:"Lokotrack ST3.5",specs:{decks:2,area:"5.5×1.8m",capRange:[300,900],weight:32,engine:"CAT C7.1 168kW"},curves:{ap:[40,80,120],eff:[90,88,86]},notes:"Alta capacidad minería Chile."},
  ],
};

const ROCKS = {granito:{wi:15.5,ab:0.28,name:"Granito"},caliza:{wi:11.2,ab:0.12,name:"Caliza"},cobre:{wi:14.0,ab:0.22,name:"Mineral Cobre"},basalto:{wi:17.0,ab:0.35,name:"Basalto"},cuarcita:{wi:19.5,ab:0.45,name:"Cuarcita"},arenisca:{wi:9.5,ab:0.08,name:"Arenisca"},porfido:{wi:16.0,ab:0.30,name:"Pórfido"}};
const TICONS = {jaw:"⬛",cone:"🔺",screen:"⊞",scalper:"◫"};
const TLABELS = {jaw:"Mandíbula",cone:"Cono",screen:"Criba",scalper:"Scalper"};

function lerp(xs,ys,x){if(!xs||xs.length<2)return ys?.[0]||0;if(x<=xs[0])return ys[0];if(x>=xs.at(-1))return ys.at(-1);for(let i=0;i<xs.length-1;i++){if(x>=xs[i]&&x<=xs[i+1]){const t=(x-xs[i])/(xs[i+1]-xs[i]);return ys[i]+t*(ys[i+1]-ys[i])}}return ys.at(-1)}

function simulate(nodes,inputs){
  const {tph,f80,p80t,rock,hum}=inputs;
  const rk=ROCKS[rock]||ROCKS.granito;
  const res={};let cf80=f80;
  const ord=["scalper","jaw","cone","screen"];
  const sorted=[...nodes].sort((a,b)=>ord.indexOf(a.type)-ord.indexOf(b.type));
  let totalE=0;
  for(const n of sorted){
    const eq=n.eq;if(!eq)continue;
    if(n.type==="jaw"||n.type==="cone"){
      const css=Math.max(eq.specs.cssRange[0],Math.min(eq.specs.cssRange[1],p80t*(n.type==="jaw"?0.18:0.14)));
      const cap=lerp(eq.curves.css,eq.curves.tph,css);
      const p80o=css*lerp(eq.curves.css,eq.curves.p80f,css);
      const e=Math.max(0,10*rk.wi*(1/Math.sqrt(Math.max(p80o,.1))-1/Math.sqrt(Math.max(cf80,.1))));
      totalE+=e;
      const util=Math.min(100,(tph/Math.max(cap,.1))*100);
      res[n.id]={css:css.toFixed(0),capN:cap.toFixed(0),p80i:cf80.toFixed(0),p80o:p80o.toFixed(0),e:e.toFixed(2),util:util.toFixed(0),rr:(cf80/Math.max(p80o,.1)).toFixed(1),st:util>95?"overload":util>60?"ok":"underload"};
      cf80=p80o;
    }
    if(n.type==="screen"||n.type==="scalper"){
      const ap=p80t*.9;
      const eff=Math.max(.70,lerp(eq.curves.ap,eq.curves.eff,ap)/100-hum*.015);
      const ov=tph*(1-eff)*.4;
      const cc=(ov/Math.max(tph,.1))*100;
      res[n.id]={ap:ap.toFixed(0),eff:(eff*100).toFixed(1),ov:ov.toFixed(0),cc:cc.toFixed(1),st:cc>35?"overload":cc>20?"warn":"ok"};
    }
  }
  const lc=sorted.filter(n=>n.type==="cone").at(-1);
  const ls=sorted.filter(n=>n.type==="screen").at(-1);
  const fp80=lc?Number(res[lc.id]?.p80o||cf80):cf80;
  const fcc=ls?Number(res[ls.id]?.cc||0):0;
  const gap=Math.abs(fp80-p80t)/Math.max(p80t,.1);
  const score=Math.max(0,Math.min(100,100-fcc*.7-gap*60-rk.ab*15));
  const bots=sorted.filter(n=>res[n.id]?.st==="overload").map(n=>n.eq?.model||n.type);
  return{res,fp80:fp80.toFixed(0),fcc:fcc.toFixed(1),score:score.toFixed(0),bots,rk,totalE:totalE.toFixed(2)};
}

let NC=1;
function mkNode(type,eq){return{id:`n${NC++}`,type,eq};}

export default function App(){
  const [tab,setTab]=useState("jaw");
  const [brand,setBrand]=useState("all");
  const [expanded,setExpanded]=useState(null);
  const [nodes,setNodes]=useState([]);
  const [selected,setSelected]=useState(null);
  const [simResult,setSimResult]=useState(null);
  const [aiText,setAiText]=useState("");
  const [aiLoad,setAiLoad]=useState(false);
  const [inputs,setInputs]=useState({tph:300,f80:600,p80t:25,rock:"granito",hum:0});

  const brands=["all","Finlay","Powerscreen","Kleemann","Sandvik","Metso","Astec"];
  const items=(EQ[tab]||[]).filter(e=>brand==="all"||e.brand===brand);

  const addEq=useCallback((eq)=>{
    setNodes(prev=>[...prev.filter(n=>n.type!==eq.type||tab==="screen"),mkNode(tab,eq)]);
  },[tab]);

  const removeNode=useCallback((id)=>{setNodes(p=>p.filter(n=>n.id!==id));if(selected===id)setSelected(null);},[selected]);

  const runSim=useCallback(async()=>{
    if(!nodes.length)return;
    const r=simulate(nodes,inputs);
    setSimResult(r);setAiLoad(true);setAiText("");
    const eqList=nodes.map(n=>`${n.eq?.brand} ${n.eq?.model} (${TLABELS[n.type]})`).join(", ");
    const prompt=`Eres KrushRock, experto en chancado y selección con equipos móviles en Chile.
Circuito: ${eqList}
Roca: ${r.rk.name} (Wi=${r.rk.wi}, ab=${r.rk.ab})
TPH: ${inputs.tph} | F80: ${inputs.f80}mm | P80 obj: ${inputs.p80t}mm | Humedad: ${inputs.hum}/3
Score: ${r.score}/100 | P80 final: ${r.fp80}mm | CC: ${r.fcc}% | Energía: ${r.totalE} kWh/t
Bottlenecks: ${r.bots.join(",")||"ninguno"}
Análisis técnico en español (máx 150 palabras): 1) Diagnóstico 2) Puntos críticos (● bullets) 3) Recomendaciones (→ bullets). Directo y técnico.`;
    try{
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,messages:[{role:"user",content:prompt}]})});
      const d=await resp.json();
      setAiText(d.content?.find(b=>b.type==="text")?.text||"No disponible.");
    }catch{setAiText("Análisis IA no disponible.");}
    setAiLoad(false);
  },[nodes,inputs]);

  const inp=(k,v)=>setInputs(p=>({...p,[k]:v}));
  const selNode=nodes.find(n=>n.id===selected);
  const selRes=simResult?.res?.[selected];
  const sc=Number(simResult?.score||0);
  const scColor=sc>=75?T.green:sc>=50?T.amber:T.red;

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:T.bg,overflow:"hidden"}}>
      <style>{CSS}</style>

      {/* TOPBAR */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"9px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <div style={{width:32,height:32,borderRadius:7,background:T.amber,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:T.display,fontWeight:900,fontSize:14,color:"#000"}}>CS</div>
        <div>
          <div style={{fontFamily:T.display,fontWeight:800,fontSize:15,color:T.amber}}>KrushRock</div>
          <div style={{fontSize:8,color:T.muted,letterSpacing:"0.1em"}}>EDITOR + BIBLIOTECA EQUIPOS MÓVILES CHILE</div>
        </div>
        {simResult&&(
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:12}}>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:8,color:T.muted}}>SCORE</div>
              <div style={{fontFamily:T.display,fontWeight:800,fontSize:20,color:scColor}}>{simResult.score}<span style={{fontSize:10,color:T.muted}}>/100</span></div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:8,color:T.muted}}>P80 FINAL</div>
              <div style={{fontFamily:T.display,fontWeight:800,fontSize:20,color:T.amber}}>{simResult.fp80}<span style={{fontSize:10,color:T.muted}}>mm</span></div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:8,color:T.muted}}>CC</div>
              <div style={{fontFamily:T.display,fontWeight:800,fontSize:20,color:Number(simResult.fcc)>30?T.red:T.green}}>{simResult.fcc}<span style={{fontSize:10,color:T.muted}}>%</span></div>
            </div>
          </div>
        )}
      </div>

      {/* INPUTS BAR */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"8px 14px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:8,color:T.muted}}>ROCA</span>
          <select value={inputs.rock} onChange={e=>inp("rock",e.target.value)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:4,padding:"4px 8px",color:T.text,fontSize:9,cursor:"pointer"}}>
            {Object.entries(ROCKS).map(([k,v])=><option key={k} value={k}>{v.name} (Wi {v.wi})</option>)}
          </select>
        </div>
        {[{k:"tph",l:"TPH",min:50,max:1000,step:25,u:"tph"},{k:"f80",l:"F80",min:100,max:1200,step:50,u:"mm"},{k:"p80t",l:"P80 obj",min:5,max:100,step:5,u:"mm"},{k:"hum",l:"Humedad",min:0,max:3,step:1,u:"/3"}].map(s=>(
          <div key={s.k} style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:8,color:T.muted}}>{s.l}</span>
            <input type="range" min={s.min} max={s.max} step={s.step} value={inputs[s.k]} onChange={e=>inp(s.k,Number(e.target.value))} style={{width:70,accentColor:T.amber}}/>
            <span style={{fontSize:10,color:T.amber,minWidth:40}}>{inputs[s.k]}<span style={{fontSize:8,color:T.muted}}>{s.u}</span></span>
          </div>
        ))}
        <button onClick={runSim} disabled={!nodes.length} style={{marginLeft:"auto",padding:"7px 18px",background:nodes.length?T.amber:"none",border:nodes.length?"none":`1px solid ${T.border}`,borderRadius:6,color:nodes.length?"#000":T.muted,fontFamily:T.display,fontWeight:700,fontSize:11,cursor:nodes.length?"pointer":"not-allowed"}}>
          ▶ SIMULAR
        </button>
      </div>

      {/* BODY */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* BIBLIOTECA */}
        <div style={{width:195,flexShrink:0,display:"flex",flexDirection:"column",background:T.surface,borderRight:`1px solid ${T.border}`}}>
          <div style={{padding:"10px 12px 6px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{fontFamily:T.display,fontWeight:700,fontSize:12,color:T.amber}}>BIBLIOTECA</div>
            <div style={{fontSize:8,color:T.muted,marginTop:2}}>Clic en equipo → agregar</div>
          </div>
          {/* Tabs tipo */}
          <div style={{display:"flex",borderBottom:`1px solid ${T.border}`}}>
            {Object.keys(EQ).map(t=>(
              <button key={t} onClick={()=>{setTab(t);setExpanded(null);}} style={{flex:1,padding:"6px 2px",background:"none",border:"none",borderBottom:`2px solid ${tab===t?T.amber:"transparent"}`,color:tab===t?T.amber:T.muted,fontSize:7.5,cursor:"pointer",fontFamily:T.mono}}>
                {TICONS[t]}
              </button>
            ))}
          </div>
          {/* Filtro marca */}
          <div style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`,display:"flex",flexWrap:"wrap",gap:3}}>
            {brands.map(b=>(
              <button key={b} onClick={()=>setBrand(b)} style={{background:brand===b?(BC[b]||T.amber)+"33":"none",border:`1px solid ${brand===b?(BC[b]||T.amber):T.border}`,color:brand===b?(BC[b]||T.amber):T.muted,borderRadius:3,padding:"2px 5px",fontSize:7,cursor:"pointer"}}>
                {b==="all"?"ALL":b.slice(0,4).toUpperCase()}
              </button>
            ))}
          </div>
          {/* Lista */}
          <div style={{flex:1,overflowY:"auto",padding:"6px 7px"}}>
            {items.map(eq=>{
              const bc=BC[eq.brand]||T.amber;
              const isEx=expanded===eq.id;
              return(
                <div key={eq.id} style={{background:isEx?T.card+"dd":T.card,border:`1px solid ${isEx?bc:T.border}`,borderRadius:5,marginBottom:5,overflow:"hidden",transition:"border .15s"}}>
                  <div style={{padding:"7px 9px",cursor:"pointer",display:"flex",alignItems:"center",gap:7}} onClick={()=>setExpanded(isEx?null:eq.id)}>
                    <div style={{width:24,height:24,borderRadius:3,background:bc+"22",border:`1px solid ${bc}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{TICONS[tab]}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:9,color:bc,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{eq.model}</div>
                      <div style={{fontSize:8,color:T.muted}}>{eq.brand}</div>
                    </div>
                    <span style={{fontSize:8,color:T.muted}}>{isEx?"▲":"▼"}</span>
                  </div>
                  {isEx&&(
                    <div style={{padding:"0 9px 9px",borderTop:`1px solid ${T.border}`}} className="fu">
                      <div style={{fontSize:8,color:T.muted,margin:"6px 0 4px"}}>ESPECIFICACIONES</div>
                      {eq.specs.cssRange&&[["CSS",`${eq.specs.cssRange[0]}–${eq.specs.cssRange[1]} mm`],["Cap.",`${eq.specs.capRange[0]}–${eq.specs.capRange[1]} tph`],["Peso",`${eq.specs.weight} t`],["Motor",eq.specs.engine]].map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:8,padding:"2px 0",borderBottom:`1px solid ${T.faint}`}}>
                          <span style={{color:T.muted}}>{k}</span><span style={{color:T.text}}>{v}</span>
                        </div>
                      ))}
                      {eq.specs.decks&&[["Decks",eq.specs.decks],["Área",eq.specs.area],["Cap.",`${eq.specs.capRange[0]}–${eq.specs.capRange[1]} tph`],["Motor",eq.specs.engine]].map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:8,padding:"2px 0",borderBottom:`1px solid ${T.faint}`}}>
                          <span style={{color:T.muted}}>{k}</span><span style={{color:T.text}}>{v}</span>
                        </div>
                      ))}
                      <div style={{fontSize:7,color:T.muted,marginTop:5,fontStyle:"italic"}}>{eq.notes}</div>
                      <button onClick={()=>addEq(eq)} style={{marginTop:7,width:"100%",padding:"5px",background:bc+"22",border:`1px solid ${bc}`,borderRadius:4,color:bc,fontSize:8,cursor:"pointer",fontFamily:T.mono}}>+ Agregar al circuito</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CANVAS */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{flex:1,position:"relative",background:`radial-gradient(circle at 50% 50%, ${T.card} 0%, ${T.bg} 100%)`,backgroundImage:`radial-gradient(circle,${T.border}44 1px,transparent 1px)`,backgroundSize:"28px 28px"}}>
            {/* SVG conexiones */}
            <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
              <defs><marker id="arr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3z" fill={T.amber}/></marker></defs>
              {(()=>{
                const ord=["scalper","jaw","cone","screen"];
                const s=[...nodes].sort((a,b)=>ord.indexOf(a.type)-ord.indexOf(b.type));
                return s.map((n,i)=>{
                  if(i===0)return null;
                  const prev=s[i-1];
                  const x1=prev.x+55,y1=prev.y+25,x2=n.x,y2=n.y+25,mx=(x1+x2)/2;
                  return<path key={n.id} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none" stroke={T.amber} strokeWidth="1.5" className="flow" markerEnd="url(#arr)" opacity=".7"/>;
                });
              })()}
            </svg>

            {/* Nodos */}
            {nodes.map(node=>{
              const res=simResult?.res?.[node.id];
              const bc2=BC[node.eq?.brand]||T.amber;
              const isSel=selected===node.id;
              const stColor=res?.st==="overload"?T.red:res?.st==="warn"?T.amber:T.green;
              return(
                <div key={node.id} onMouseDown={()=>setSelected(node.id)}
                  style={{position:"absolute",left:node.x||80+nodes.indexOf(node)*160,top:node.y||80,width:110,cursor:"pointer",filter:isSel?`drop-shadow(0 0 8px ${bc2}88)`:"none",zIndex:isSel?10:1,userSelect:"none"}}>
                  <div style={{background:T.card,border:`2px solid ${isSel?bc2:T.border}`,borderRadius:7,padding:"8px 10px",position:"relative",transition:"border .15s"}}>
                    {res&&<div style={{position:"absolute",top:4,right:4,width:7,height:7,borderRadius:"50%",background:stColor}}/>}
                    <div style={{fontSize:18,textAlign:"center",marginBottom:3}}>{TICONS[node.type]}</div>
                    <div style={{fontSize:7.5,color:bc2,textAlign:"center",letterSpacing:"0.04em"}}>{node.eq?.brand?.toUpperCase()}</div>
                    <div style={{fontSize:8,color:T.text,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{node.eq?.model}</div>
                    {res&&(node.type==="jaw"||node.type==="cone")&&<div style={{marginTop:4,padding:"2px 4px",background:T.surface,borderRadius:3,textAlign:"center",fontSize:7.5,color:T.amber}}>P80→{res.p80o}mm · {res.util}%</div>}
                    {res&&(node.type==="screen"||node.type==="scalper")&&<div style={{marginTop:4,padding:"2px 4px",background:T.surface,borderRadius:3,textAlign:"center",fontSize:7.5,color:Number(res.cc)>30?T.red:T.green}}>CC:{res.cc}%</div>}
                  </div>
                  {isSel&&<button onClick={e=>{e.stopPropagation();removeNode(node.id);}} style={{position:"absolute",top:-7,right:-7,width:18,height:18,borderRadius:"50%",background:T.red,border:"none",color:"#fff",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>}
                </div>
              );
            })}

            {/* Placeholder vacío */}
            {!nodes.length&&(
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
                <div style={{fontSize:36,marginBottom:12,opacity:.25}}>⬛→🔺→⊞</div>
                <div style={{fontSize:12,color:T.muted,textAlign:"center"}}>Agrega equipos desde la biblioteca<br/><span style={{fontSize:10}}>Clic en un equipo → + Agregar al circuito</span></div>
              </div>
            )}
          </div>

          {/* Barra inferior nodos */}
          <div style={{background:T.surface,borderTop:`1px solid ${T.border}`,padding:"5px 14px",display:"flex",alignItems:"center",gap:10,flexShrink:0,flexWrap:"wrap"}}>
            <span style={{fontSize:9,color:T.muted}}>{nodes.length} equipo(s)</span>
            {nodes.map(n=>(
              <span key={n.id} style={{fontSize:9,color:BC[n.eq?.brand]||T.amber}}>
                {TICONS[n.type]} {n.eq?.model}
              </span>
            ))}
            {nodes.length>0&&<span style={{fontSize:8,color:T.muted}}>· Clic en nodo para detalles · × para eliminar</span>}
          </div>
        </div>

        {/* PANEL RESULTADOS */}
        <div style={{width:250,flexShrink:0,borderLeft:`1px solid ${T.border}`,overflowY:"auto",background:T.surface}}>
          {!simResult&&(
            <div style={{padding:20,textAlign:"center",color:T.muted,fontSize:11}}>
              <div style={{fontSize:28,marginBottom:10,opacity:.3}}>◈</div>
              Configura equipos<br/>y presiona<br/><strong style={{color:T.amber}}>▶ SIMULAR</strong>
            </div>
          )}

          {simResult&&(
            <div style={{padding:12,display:"flex",flexDirection:"column",gap:10}} className="fu">
              {/* Score global */}
              <div style={{background:T.card,border:`1px solid ${scColor}44`,borderRadius:8,padding:12}}>
                <div style={{fontSize:8,color:T.muted,marginBottom:4}}>EFICIENCIA GLOBAL</div>
                <div style={{fontFamily:T.display,fontSize:36,fontWeight:800,color:scColor,lineHeight:1}}>{simResult.score}<span style={{fontSize:13,color:T.muted}}>/100</span></div>
                <div style={{height:4,background:T.border,borderRadius:2,marginTop:8,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${simResult.score}%`,background:scColor,borderRadius:2}}/>
                </div>
                {simResult.bots.length>0&&<div style={{fontSize:8,color:T.red,marginTop:6}}>⚠ {simResult.bots.join(", ")}</div>}
              </div>

              {/* KPIs */}
              {[{l:"P80 FINAL",v:simResult.fp80,u:"mm",c:T.amber},{l:"CARGA CIRC.",v:simResult.fcc,u:"%",c:Number(simResult.fcc)>30?T.red:T.green},{l:"ENERGÍA ESP.",v:simResult.totalE,u:"kWh/t",c:T.blue}].map(k=>(
                <div key={k.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:"9px 11px"}}>
                  <div style={{fontSize:8,color:T.muted,marginBottom:3}}>{k.l}</div>
                  <div style={{fontFamily:T.display,fontSize:20,fontWeight:700,color:k.c}}>{k.v}<span style={{fontSize:10,color:T.muted,marginLeft:2}}>{k.u}</span></div>
                </div>
              ))}

              {/* Detalle nodo seleccionado */}
              {selNode&&selRes&&(
                <div style={{background:T.card,border:`1px solid ${BC[selNode.eq?.brand]||T.amber}44`,borderRadius:7,padding:10}} className="fu">
                  <div style={{fontSize:8,color:BC[selNode.eq?.brand]||T.amber,marginBottom:7,letterSpacing:"0.06em"}}>◈ {selNode.eq?.brand} {selNode.eq?.model}</div>
                  {Object.entries(selRes).filter(([k])=>k!=="st").map(([k,v])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:9,padding:"3px 0",borderBottom:`1px solid ${T.faint}`}}>
                      <span style={{color:T.muted,fontSize:8}}>{k.toUpperCase()}</span>
                      <span style={{color:T.text}}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Análisis IA */}
              <div style={{background:T.card,border:`1px solid ${T.amber}33`,borderRadius:7,padding:12}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:T.amber,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0}}>◈</div>
                  <div style={{fontSize:9,color:T.amber,fontFamily:T.display,fontWeight:600}}>KrushRock</div>
                  {aiLoad&&<div style={{fontSize:8,color:T.muted}} className="pulse">● analizando…</div>}
                </div>
                {aiLoad
                  ?<div style={{fontSize:9,color:T.muted}} className="pulse">Procesando circuito…</div>
                  :<div style={{fontSize:9,color:T.text,lineHeight:1.7,whiteSpace:"pre-wrap"}} className="fu">{aiText||"Presiona SIMULAR para el análisis."}</div>
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
