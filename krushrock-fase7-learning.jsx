import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  bg:"#07080d", surface:"#0c0f1a", card:"#111827", card2:"#161f30",
  border:"#1e2d45", borderB:"#2a3f5f",
  amber:"#f59e0b", green:"#10b981", red:"#ef4444",
  blue:"#3b82f6", purple:"#8b5cf6", cyan:"#06b6d4",
  text:"#dde3f0", muted:"#4a5a72", faint:"#1a2540",
  mono:"'JetBrains Mono','Fira Mono',monospace",
  display:"'Syne',sans-serif",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:${T.bg};color:${T.text};font-family:${T.mono}}
::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:${T.surface}}
::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
input[type=range]{-webkit-appearance:none;height:3px;background:${T.border};border-radius:2px;outline:none;cursor:pointer}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:${T.amber};cursor:pointer}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes grow{from{width:0}to{width:100%}}
@keyframes scanAnim{0%{top:-5%}100%{top:105%}}
.fu{animation:fadeUp .35s ease forwards}
.pulse{animation:pulse 1.3s ease infinite}
`;

// ─────────────────────────────────────────────────────────────────────────────
// DATOS SIMULADOS — feedback real de usuarios en terreno
// Cada entrada tiene: lo que predijo el modelo vs lo que midió el operador
// ─────────────────────────────────────────────────────────────────────────────
const FEEDBACK_DATA = [
  { id:"f001", date:"2025-05-01", project:"Cantera Norte",    rock:"granito",
    equip:"J-1280 + C-1545",  circuit:"closed",
    pred_p80:25.0, real_p80:27.2, pred_cc:22.1, real_cc:24.8,
    pred_tph:300,  real_tph:285,  pred_opex:2.84, real_opex:3.01,
    rating:4, comment:"El CC fue un poco mayor al esperado, posiblemente por desgaste de mallas",
    humidity:1, wi:15.5 },
  { id:"f002", date:"2025-05-03", project:"Línea 2 Basalto",  rock:"basalto",
    equip:"LT120 + LT220D",   circuit:"closed",
    pred_p80:32.0, real_p80:30.1, pred_cc:28.4, real_cc:26.9,
    pred_tph:500,  real_tph:512,  pred_opex:3.12, real_opex:2.98,
    rating:5, comment:"Resultados muy cerca de la simulación, excelente",
    humidity:0, wi:17.0 },
  { id:"f003", date:"2025-05-05", project:"Retrofit Planta 1",rock:"porfido",
    equip:"J-1175 + C-1545",  circuit:"scalper",
    pred_p80:22.0, real_p80:24.8, pred_cc:19.5, real_cc:23.2,
    pred_tph:280,  real_tph:261,  pred_opex:2.61, real_opex:2.89,
    rating:3, comment:"Material tenía más arcillas de lo estimado, afectó zaranda",
    humidity:2, wi:16.0 },
  { id:"f004", date:"2025-05-08", project:"Caliza Mina Sur",  rock:"caliza",
    equip:"J-1160 + C-1540",  circuit:"mid",
    pred_p80:20.0, real_p80:20.9, pred_cc:16.2, real_cc:17.1,
    pred_tph:150,  real_tph:147,  pred_opex:3.45, real_opex:3.38,
    rating:5, comment:"Predicción muy precisa para caliza",
    humidity:0, wi:11.2 },
  { id:"f005", date:"2025-05-10", project:"Áridos Rancagua",  rock:"granito",
    equip:"Premiertrak 600 + 1300 Maxtrak", circuit:"closed",
    pred_p80:25.0, real_p80:28.5, pred_cc:23.8, real_cc:29.1,
    pred_tph:420,  real_tph:388,  pred_opex:2.91, real_opex:3.24,
    rating:2, comment:"La predicción subestimó el desgaste con granito muy abrasivo (ab=0.35)",
    humidity:1, wi:15.5 },
  { id:"f006", date:"2025-05-12", project:"Cantera Norte",    rock:"granito",
    equip:"J-1280 + C-1545",  circuit:"closed",
    pred_p80:25.0, real_p80:26.1, pred_cc:22.1, real_cc:22.9,
    pred_tph:300,  real_tph:298,  pred_opex:2.84, real_opex:2.88,
    rating:5, comment:"Modelo ajustado mejoró mucho la precisión respecto a sim anterior",
    humidity:1, wi:15.5 },
  { id:"f007", date:"2025-05-15", project:"Cuarcita Norte",   rock:"cuarcita",
    equip:"J-1480 + C-1550",  circuit:"closed",
    pred_p80:30.0, real_p80:34.2, pred_cc:31.5, real_cc:38.7,
    pred_tph:400,  real_tph:362,  pred_opex:3.45, real_opex:4.12,
    rating:2, comment:"Cuarcita muy dura, Wi real medido fue 21.2 vs 19.5 esperado",
    humidity:0, wi:19.5 },
  { id:"f008", date:"2025-05-17", project:"Arenisca Atacama",  rock:"arenisca",
    equip:"J-960 + C-1540",   circuit:"scalper",
    pred_p80:18.0, real_p80:18.4, pred_cc:14.2, real_cc:14.8,
    pred_tph:150,  real_tph:153,  pred_opex:2.21, real_opex:2.19,
    rating:5, comment:"Excelente predicción para arenisca, material muy predecible",
    humidity:0, wi:9.5 },
  { id:"f009", date:"2025-05-19", project:"Basalto Costera",  rock:"basalto",
    equip:"MC 120i PRO + MCO 110i", circuit:"closed",
    pred_p80:28.0, real_p80:29.8, pred_cc:26.1, real_cc:28.4,
    pred_tph:350,  real_tph:338,  pred_opex:2.95, real_opex:3.08,
    rating:4, comment:"Kleemann rindió bien, pequeña subestimación del CC",
    humidity:1, wi:17.0 },
  { id:"f010", date:"2025-05-21", project:"Minería Cobre",    rock:"cobre",
    equip:"LT120 + C-1545",   circuit:"scalper",
    pred_p80:22.0, real_p80:23.1, pred_cc:20.8, real_cc:22.3,
    pred_tph:480,  real_tph:471,  pred_opex:3.18, real_opex:3.27,
    rating:4, comment:"Resultados muy aceptables para mineral de cobre",
    humidity:2, wi:14.0 },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOTOR DE APRENDIZAJE — calcula correcciones basadas en feedback
// ─────────────────────────────────────────────────────────────────────────────
function calcLearningModel(feedback) {
  if (feedback.length === 0) return null;

  // Errores por variable
  const errors = feedback.map(f => ({
    p80_err:  f.real_p80  - f.pred_p80,
    cc_err:   f.real_cc   - f.pred_cc,
    tph_err:  f.real_tph  - f.pred_tph,
    opex_err: f.real_opex - f.pred_opex,
    rock:     f.rock,
    humidity: f.humidity,
    wi:       f.wi,
  }));

  // Error medio absoluto (MAE)
  const mae = (key) => {
    const vals = errors.map(e => Math.abs(e[key]));
    return vals.reduce((a,b)=>a+b,0) / vals.length;
  };

  // Bias sistemático (tendencia de sub/sobreestimación)
  const bias = (key) => {
    const vals = errors.map(e => e[key]);
    return vals.reduce((a,b)=>a+b,0) / vals.length;
  };

  // Accuracy (% de predicciones dentro de ±10%)
  const accuracy = (predKey, realKey) => {
    const within = feedback.filter(f => {
      const pct = Math.abs(f[realKey] - f[predKey]) / Math.max(f[predKey], 0.1) * 100;
      return pct <= 10;
    });
    return (within.length / feedback.length) * 100;
  };

  // Corrección por roca (factores de ajuste por tipo)
  const rockAdjust = {};
  const rocks = [...new Set(feedback.map(f=>f.rock))];
  for (const rock of rocks) {
    const rockFB = feedback.filter(f=>f.rock===rock);
    if (rockFB.length > 0) {
      const avgErr = rockFB.reduce((s,f)=>s+(f.real_p80-f.pred_p80),0)/rockFB.length;
      rockAdjust[rock] = { p80_correction: avgErr, n: rockFB.length };
    }
  }

  // R² simplificado
  const r2 = (predKey, realKey) => {
    const preds  = feedback.map(f=>f[predKey]);
    const reals  = feedback.map(f=>f[realKey]);
    const mean   = reals.reduce((a,b)=>a+b,0)/reals.length;
    const ssTot  = reals.reduce((s,r)=>s+(r-mean)**2,0);
    const ssRes  = reals.reduce((s,r,i)=>s+(r-preds[i])**2,0);
    return ssTot>0 ? Math.max(0,1-ssRes/ssTot) : 0;
  };

  // Evolución temporal del error (mejora con el tiempo)
  const sorted = [...feedback].sort((a,b)=>a.date.localeCompare(b.date));
  const halfN = Math.ceil(sorted.length/2);
  const firstHalf = sorted.slice(0, halfN);
  const secHalf   = sorted.slice(halfN);
  const maeFirst = firstHalf.reduce((s,f)=>s+Math.abs(f.real_p80-f.pred_p80),0)/firstHalf.length;
  const maeSec   = secHalf.reduce((s,f)=>s+Math.abs(f.real_p80-f.pred_p80),0)/secHalf.length;
  const improvement = ((maeFirst - maeSec) / maeFirst * 100);

  // Rating promedio
  const avgRating = feedback.reduce((s,f)=>s+f.rating,0)/feedback.length;

  return {
    n: feedback.length,
    metrics: {
      p80:  { mae:mae("p80_err").toFixed(2),  bias:bias("p80_err").toFixed(2),  acc:accuracy("pred_p80","real_p80").toFixed(1),  r2:r2("pred_p80","real_p80").toFixed(3) },
      cc:   { mae:mae("cc_err").toFixed(2),   bias:bias("cc_err").toFixed(2),   acc:accuracy("pred_cc","real_cc").toFixed(1),    r2:r2("pred_cc","real_cc").toFixed(3) },
      tph:  { mae:mae("tph_err").toFixed(1),  bias:bias("tph_err").toFixed(1),  acc:accuracy("pred_tph","real_tph").toFixed(1),  r2:r2("pred_tph","real_tph").toFixed(3) },
      opex: { mae:mae("opex_err").toFixed(3), bias:bias("opex_err").toFixed(3), acc:accuracy("pred_opex","real_opex").toFixed(1),r2:r2("pred_opex","real_opex").toFixed(3) },
    },
    rockAdjust,
    improvement: improvement.toFixed(1),
    avgRating: avgRating.toFixed(1),
    errorTrend: sorted.map(f=>({
      date:f.date,
      p80_err: Math.abs(f.real_p80-f.pred_p80).toFixed(2),
    })),
    // Factor de corrección sugerido para próximas simulaciones
    corrections: {
      p80_factor:  (1 + bias("p80_err")/15).toFixed(4),
      cc_factor:   (1 + bias("cc_err")/20).toFixed(4),
      tph_factor:  (1 + bias("tph_err")/300).toFixed(4),
      opex_factor: (1 + bias("opex_err")/3).toFixed(4),
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES
// ─────────────────────────────────────────────────────────────────────────────
function MetricCard({ label, value, unit, sub, color, delta }) {
  const deltaPos = delta > 0;
  return (
    <div className="fu" style={{background:T.card,border:`1px solid ${T.border}`,
      borderRadius:8,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:color}}/>
      <div style={{fontSize:9,color:T.muted,letterSpacing:"0.07em",marginBottom:5}}>{label}</div>
      <div style={{fontFamily:T.display,fontWeight:800,fontSize:26,color,lineHeight:1}}>
        {value}<span style={{fontSize:11,color:T.muted,marginLeft:3}}>{unit}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:5,alignItems:"center"}}>
        {sub && <div style={{fontSize:9,color:T.muted}}>{sub}</div>}
        {delta !== undefined && (
          <div style={{fontSize:9,color:deltaPos?T.green:T.red}}>
            {deltaPos?"↓":"↑"} {Math.abs(delta)}{unit} vs modelo base
          </div>
        )}
      </div>
    </div>
  );
}

function AccuracyGauge({ label, pct, color }) {
  const n = Number(pct);
  return (
    <div style={{textAlign:"center"}}>
      <svg width={80} height={80} viewBox="0 0 80 80">
        <circle cx={40} cy={40} r={33} fill="none" stroke={T.faint} strokeWidth={7}/>
        <circle cx={40} cy={40} r={33} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${2*Math.PI*33*n/100} ${2*Math.PI*33*(1-n/100)}`}
          strokeLinecap="round" transform="rotate(-90 40 40)"
          style={{transition:"stroke-dasharray .8s ease"}}/>
        <text x={40} y={38} textAnchor="middle" fontSize={14} fontWeight={800}
          fill={color} fontFamily="JetBrains Mono">{n.toFixed(0)}</text>
        <text x={40} y={52} textAnchor="middle" fontSize={8} fill={T.muted}>%</text>
      </svg>
      <div style={{fontSize:9,color:T.muted,marginTop:3}}>{label}</div>
    </div>
  );
}

function MiniChart({ data, color, label }) {
  if (!data || data.length === 0) return null;
  const vals = data.map(d => Number(d.p80_err));
  const max = Math.max(...vals, 0.1);
  const w = 100, h = 40;
  const pts = vals.map((v,i) => `${(i/(vals.length-1))*w},${h-(v/max)*h}`).join(" ");
  return (
    <div>
      <div style={{fontSize:9,color:T.muted,marginBottom:6}}>{label}</div>
      <svg width="100%" viewBox={`0 0 ${w} ${h+4}`} style={{overflow:"visible"}}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
          strokeLinejoin="round" strokeLinecap="round"/>
        {vals.map((v,i)=>(
          <circle key={i}
            cx={(i/(vals.length-1))*w} cy={h-(v/max)*h}
            r={2.5} fill={T.card} stroke={color} strokeWidth={1.2}/>
        ))}
      </svg>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:T.muted,marginTop:2}}>
        <span>{data[0]?.date}</span>
        <span>{data[data.length-1]?.date}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL FEEDBACK — formulario para ingresar medición real
// ─────────────────────────────────────────────────────────────────────────────
function FeedbackPanel({ onSubmit, T }) {
  const [form, setForm] = useState({
    project:"", equip:"", rock:"granito", circuit:"closed",
    pred_p80:25, real_p80:25, pred_cc:22, real_cc:22,
    pred_tph:300, real_tph:300, pred_opex:2.84, real_opex:2.84,
    rating:4, comment:"", humidity:0, wi:15.5,
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = () => {
    if (!form.project) return;
    onSubmit({ ...form, id:`f${Date.now()}`, date: new Date().toISOString().split("T")[0] });
    setSubmitted(true);
    setTimeout(()=>setSubmitted(false), 2000);
  };

  return (
    <div style={{background:T.card,border:`1px solid ${T.amber}33`,borderRadius:10,padding:18}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <div style={{width:28,height:28,borderRadius:6,background:`${T.amber}22`,
          border:`1px solid ${T.amber}44`,display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:14}}>📊</div>
        <div>
          <div style={{fontFamily:T.display,fontWeight:700,fontSize:13,color:T.amber}}>
            Ingresar medición real
          </div>
          <div style={{fontSize:9,color:T.muted}}>Compara predicción vs resultado en terreno</div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        {[
          {k:"project",label:"Proyecto",type:"text",ph:"Ej: Cantera Norte"},
          {k:"equip",  label:"Equipos", type:"text",ph:"Ej: J-1280 + C-1545"},
        ].map(f=>(
          <div key={f.k}>
            <div style={{fontSize:8,color:T.muted,marginBottom:3}}>{f.label.toUpperCase()}</div>
            <input value={form[f.k]} onChange={e=>set(f.k,e.target.value)}
              placeholder={f.ph}
              style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,
                borderRadius:5,padding:"7px 10px",color:T.text,fontSize:10}}/>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        {[
          {k:"rock",    label:"Roca",    type:"select",
           opts:[["granito","Granito"],["caliza","Caliza"],["cobre","Mineral Cobre"],
                 ["basalto","Basalto"],["cuarcita","Cuarcita"],["porfido","Pórfido"]]},
          {k:"circuit", label:"Circuito",type:"select",
           opts:[["closed","Circuito cerrado"],["scalper","Con Scalper"],["mid","Sel. al medio"]]},
        ].map(f=>(
          <div key={f.k}>
            <div style={{fontSize:8,color:T.muted,marginBottom:3}}>{f.label.toUpperCase()}</div>
            <select value={form[f.k]} onChange={e=>set(f.k,e.target.value)}
              style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,
                borderRadius:5,padding:"7px 10px",color:T.text,fontSize:10,cursor:"pointer"}}>
              {f.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Comparación predicción vs real */}
      <div style={{background:T.surface,borderRadius:7,padding:12,marginBottom:12}}>
        <div style={{fontSize:9,color:T.muted,marginBottom:10,letterSpacing:"0.06em"}}>
          PREDICCIÓN vs MEDICIÓN REAL
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 16px 1fr",gap:4,
          alignItems:"center",marginBottom:6}}>
          <div style={{fontSize:8,color:T.muted,textAlign:"center"}}>PREDICHO</div>
          <div/>
          <div style={{fontSize:8,color:T.amber,textAlign:"center"}}>REAL (terreno)</div>
        </div>
        {[
          {label:"P80 (mm)",    pk:"pred_p80",  rk:"real_p80",  step:0.1},
          {label:"Circ. Carga %",pk:"pred_cc",  rk:"real_cc",   step:0.1},
          {label:"TPH",         pk:"pred_tph",  rk:"real_tph",  step:1},
          {label:"OPEX USD/t",  pk:"pred_opex", rk:"real_opex", step:0.01},
        ].map(row=>{
          const diff = (Number(form[row.rk])-Number(form[row.pk])).toFixed(2);
          const diffColor = Math.abs(Number(diff))<2?T.green:Math.abs(Number(diff))<5?T.amber:T.red;
          return (
            <div key={row.label} style={{display:"grid",
              gridTemplateColumns:"1fr 50px 1fr",gap:4,
              alignItems:"center",marginBottom:6}}>
              <div>
                <div style={{fontSize:8,color:T.muted,marginBottom:2}}>{row.label}</div>
                <input type="number" step={row.step} value={form[row.pk]}
                  onChange={e=>set(row.pk,Number(e.target.value))}
                  style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,
                    borderRadius:4,padding:"5px 8px",color:T.text,fontSize:10}}/>
              </div>
              <div style={{textAlign:"center",fontSize:9,color:diffColor,fontWeight:600}}>
                {Number(diff)>0?"+":""}{diff}
              </div>
              <div>
                <div style={{fontSize:8,color:T.amber,marginBottom:2}}>{row.label}</div>
                <input type="number" step={row.step} value={form[row.rk]}
                  onChange={e=>set(row.rk,Number(e.target.value))}
                  style={{width:"100%",background:`${T.amber}11`,
                    border:`1px solid ${T.amber}44`,
                    borderRadius:4,padding:"5px 8px",color:T.amber,fontSize:10}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rating */}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:8,color:T.muted,marginBottom:6}}>
          CALIDAD DE LA PREDICCIÓN (1–5 estrellas)
        </div>
        <div style={{display:"flex",gap:6}}>
          {[1,2,3,4,5].map(n=>(
            <button key={n} onClick={()=>set("rating",n)} style={{
              width:32,height:32,borderRadius:5,
              background:n<=form.rating?`${T.amber}22`:T.surface,
              border:`1px solid ${n<=form.rating?T.amber:T.border}`,
              color:n<=form.rating?T.amber:T.muted,
              fontSize:16,cursor:"pointer",
            }}>★</button>
          ))}
          <span style={{alignSelf:"center",fontSize:9,color:T.muted,marginLeft:8}}>
            {["","Muy malo","Malo","Aceptable","Bueno","Excelente"][form.rating]}
          </span>
        </div>
      </div>

      {/* Comentario */}
      <textarea value={form.comment} onChange={e=>set("comment",e.target.value)}
        placeholder="Observaciones del operador en terreno..."
        rows={2}
        style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,
          borderRadius:5,padding:"8px 10px",color:T.text,fontSize:10,
          resize:"none",marginBottom:12}}/>

      <button onClick={handleSubmit} style={{
        width:"100%",padding:"11px",
        background:submitted?"#064e3b":`linear-gradient(135deg,${T.amber},#d97706)`,
        border:"none",borderRadius:7,
        color:submitted?"#6ee7b7":"#000",
        fontFamily:T.display,fontWeight:700,fontSize:12,cursor:"pointer",
        transition:"all .3s",
      }}>
        {submitted ? "✓ Feedback registrado — modelo actualizándose" : "Registrar medición y actualizar modelo"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL MODELO — muestra el estado del modelo entrenado
// ─────────────────────────────────────────────────────────────────────────────
function ModelPanel({ model, T }) {
  if (!model) return null;
  const { metrics, rockAdjust, improvement, avgRating, corrections, errorTrend } = model;

  const metricColor = (acc) => Number(acc) >= 80 ? T.green : Number(acc) >= 60 ? T.amber : T.red;

  return (
    <div style={{display:"grid",gap:14}}>
      {/* Estado del modelo */}
      <div style={{background:T.card,border:`1px solid ${T.green}44`,borderRadius:10,padding:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:T.green,
            boxShadow:`0 0 8px ${T.green}`}}/>
          <div style={{fontFamily:T.display,fontWeight:700,color:T.green,fontSize:13}}>
            Modelo activo — v{model.n}.0
          </div>
          <div style={{marginLeft:"auto",fontSize:9,color:T.muted}}>
            {model.n} observaciones · Rating prom: {avgRating}/5 ★
          </div>
        </div>

        {/* Accuracy gauges */}
        <div style={{display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:8}}>
          <AccuracyGauge label="P80 (±10%)"   pct={metrics.p80.acc}  color={metricColor(metrics.p80.acc)}/>
          <AccuracyGauge label="Circ.Carga"   pct={metrics.cc.acc}   color={metricColor(metrics.cc.acc)}/>
          <AccuracyGauge label="Tonelaje"      pct={metrics.tph.acc}  color={metricColor(metrics.tph.acc)}/>
          <AccuracyGauge label="OPEX"          pct={metrics.opex.acc} color={metricColor(metrics.opex.acc)}/>
        </div>
      </div>

      {/* Métricas detalladas */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden"}}>
        <div style={{background:T.surface,padding:"10px 14px",
          borderBottom:`1px solid ${T.border}`,
          display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:6}}>
          {["Variable","MAE","Bias","Accuracy","R²"].map(h=>(
            <div key={h} style={{fontSize:8,color:T.muted,letterSpacing:"0.07em"}}>{h}</div>
          ))}
        </div>
        {[
          {label:"P80 (mm)",    m:metrics.p80,  color:metricColor(metrics.p80.acc)},
          {label:"Circ. Carga %",m:metrics.cc,  color:metricColor(metrics.cc.acc)},
          {label:"TPH",         m:metrics.tph,  color:metricColor(metrics.tph.acc)},
          {label:"OPEX USD/t",  m:metrics.opex, color:metricColor(metrics.opex.acc)},
        ].map((row,i)=>(
          <div key={row.label} style={{
            display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:6,
            padding:"9px 14px",
            background:i%2===0?T.card:T.surface,
            borderBottom:`1px solid ${T.faint}`,
            fontSize:10,
          }}>
            <span style={{color:T.text}}>{row.label}</span>
            <span style={{color:T.text,fontFamily:T.mono}}>{row.m.mae}</span>
            <span style={{color:Number(row.m.bias)>0?T.red:T.green,fontFamily:T.mono}}>
              {Number(row.m.bias)>0?"+":""}{row.m.bias}
            </span>
            <span style={{color:row.color,fontWeight:600}}>{row.m.acc}%</span>
            <span style={{color:T.muted,fontFamily:T.mono}}>{row.m.r2}</span>
          </div>
        ))}
      </div>

      {/* Correcciones activas */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:14}}>
        <div style={{fontSize:9,color:T.muted,letterSpacing:"0.08em",marginBottom:12}}>
          FACTORES DE CORRECCIÓN ACTIVOS
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {label:"Factor P80",    val:corrections.p80_factor,  color:T.amber},
            {label:"Factor CC",     val:corrections.cc_factor,   color:T.cyan},
            {label:"Factor TPH",    val:corrections.tph_factor,  color:T.blue},
            {label:"Factor OPEX",   val:corrections.opex_factor, color:T.purple},
          ].map(c=>(
            <div key={c.label} style={{background:T.surface,borderRadius:6,
              padding:"8px 12px",borderLeft:`3px solid ${c.color}`}}>
              <div style={{fontSize:8,color:T.muted}}>{c.label}</div>
              <div style={{fontFamily:T.mono,fontSize:14,color:c.color,fontWeight:600,marginTop:3}}>
                ×{c.val}
              </div>
              <div style={{fontSize:8,color:T.muted,marginTop:2}}>
                {Number(c.val)>1?"↑ ajuste positivo":"↓ ajuste negativo"}
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:12,fontSize:9,color:T.muted,lineHeight:1.6}}>
          Estos factores se aplican automáticamente a las próximas simulaciones
          para reducir el error sistemático detectado en datos de terreno.
        </div>
      </div>

      {/* Tendencia del error */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
          <div style={{fontSize:9,color:T.muted,letterSpacing:"0.08em"}}>EVOLUCIÓN MAE P80 (mm)</div>
          <div style={{fontSize:10,color:improvement>0?T.green:T.red,fontWeight:600}}>
            {improvement>0?"↓":"↑"} {Math.abs(improvement)}% vs período anterior
          </div>
        </div>
        <MiniChart data={errorTrend} color={T.amber} label=""/>
      </div>

      {/* Ajuste por roca */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:14}}>
        <div style={{fontSize:9,color:T.muted,letterSpacing:"0.08em",marginBottom:12}}>
          CORRECCIÓN P80 POR TIPO DE ROCA (mm)
        </div>
        {Object.entries(rockAdjust).map(([rock,data])=>{
          const corr = Number(data.p80_correction);
          const color = Math.abs(corr)<1?T.green:Math.abs(corr)<3?T.amber:T.red;
          return (
            <div key={rock} style={{display:"flex",alignItems:"center",gap:10,
              padding:"6px 0",borderBottom:`1px solid ${T.faint}`}}>
              <span style={{fontSize:10,color:T.text,flex:1,textTransform:"capitalize"}}>{rock}</span>
              <span style={{fontSize:9,color:T.muted}}>{data.n} obs.</span>
              <div style={{width:80,height:6,background:T.faint,borderRadius:3,overflow:"hidden"}}>
                <div style={{
                  height:"100%",
                  width:`${Math.min(100,Math.abs(corr)/5*100)}%`,
                  background:color,
                  marginLeft:corr<0?"auto":0,
                  borderRadius:3,
                }}/>
              </div>
              <span style={{fontSize:10,color,fontWeight:600,minWidth:50,textAlign:"right"}}>
                {corr>0?"+":""}{corr.toFixed(2)} mm
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL HISTORIAL DE FEEDBACK
// ─────────────────────────────────────────────────────────────────────────────
function FeedbackHistory({ feedback, T }) {
  return (
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden"}}>
      <div style={{background:T.surface,padding:"10px 14px",
        borderBottom:`1px solid ${T.border}`,
        display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr 60px",gap:6}}>
        {["Proyecto","Equipos","P80 pred/real","CC pred/real","TPH pred/real","OPEX","Rating"].map(h=>(
          <div key={h} style={{fontSize:8,color:T.muted,letterSpacing:"0.06em"}}>{h}</div>
        ))}
      </div>
      {feedback.map((f,i)=>{
        const p80err = (f.real_p80-f.pred_p80).toFixed(1);
        const ccerr  = (f.real_cc -f.pred_cc ).toFixed(1);
        const tpherr = (f.real_tph-f.pred_tph).toFixed(0);
        const opexerr= (f.real_opex-f.pred_opex).toFixed(2);
        const errColor = (e) => Math.abs(Number(e))<2?T.green:Math.abs(Number(e))<5?T.amber:T.red;
        return (
          <div key={f.id} style={{
            display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr 60px",gap:6,
            padding:"9px 14px",fontSize:9,
            background:i%2===0?T.card:T.surface,
            borderBottom:`1px solid ${T.faint}`,
          }}>
            <div>
              <div style={{color:T.text,fontSize:10}}>{f.project}</div>
              <div style={{color:T.muted,fontSize:8}}>{f.date}</div>
            </div>
            <div style={{color:T.muted,overflow:"hidden",textOverflow:"ellipsis",
              whiteSpace:"nowrap",fontSize:9}}>{f.equip}</div>
            <div>
              <span style={{color:T.muted}}>{f.pred_p80}</span>
              <span style={{color:T.muted}}> → </span>
              <span style={{color:errColor(p80err),fontWeight:600}}>{f.real_p80}</span>
              <span style={{color:errColor(p80err),fontSize:8,marginLeft:3}}>
                ({Number(p80err)>0?"+":""}{p80err})
              </span>
            </div>
            <div>
              <span style={{color:T.muted}}>{f.pred_cc}</span>
              <span style={{color:T.muted}}> → </span>
              <span style={{color:errColor(ccerr),fontWeight:600}}>{f.real_cc}</span>
              <span style={{color:errColor(ccerr),fontSize:8,marginLeft:3}}>
                ({Number(ccerr)>0?"+":""}{ccerr})
              </span>
            </div>
            <div>
              <span style={{color:T.muted}}>{f.pred_tph}</span>
              <span style={{color:T.muted}}> → </span>
              <span style={{color:errColor(tpherr),fontWeight:600}}>{f.real_tph}</span>
            </div>
            <div>
              <span style={{color:T.muted}}>${f.pred_opex}</span>
              <span style={{color:T.muted}}> → </span>
              <span style={{color:errColor(opexerr),fontWeight:600}}>${f.real_opex}</span>
            </div>
            <div style={{textAlign:"center"}}>
              {Array.from({length:5}).map((_,n)=>(
                <span key={n} style={{color:n<f.rating?T.amber:T.faint,fontSize:10}}>★</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL IA — análisis automático del feedback acumulado
// ─────────────────────────────────────────────────────────────────────────────
function AIInsightsPanel({ feedback, model, loading, text, onAnalyze, T }) {
  return (
    <div style={{background:`linear-gradient(135deg,${T.card},${T.surface})`,
      border:`1px solid ${T.amber}44`,borderRadius:10,padding:18}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{width:32,height:32,borderRadius:"50%",
          background:`linear-gradient(135deg,${T.amber},#d97706)`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>◈</div>
        <div>
          <div style={{fontFamily:T.display,fontWeight:700,fontSize:13,color:T.amber}}>
            KrushRock — Análisis de Aprendizaje
          </div>
          <div style={{fontSize:9,color:T.muted}}>
            Detecta patrones en {feedback.length} observaciones de terreno
          </div>
        </div>
        {loading && <div className="pulse" style={{marginLeft:"auto",fontSize:9,color:T.muted}}>● analizando…</div>}
        {!loading && (
          <button onClick={onAnalyze} style={{
            marginLeft:"auto",padding:"6px 14px",
            background:`linear-gradient(135deg,${T.amber},#d97706)`,
            border:"none",borderRadius:6,color:"#000",
            fontFamily:T.display,fontWeight:700,fontSize:10,cursor:"pointer",
          }}>Analizar con IA</button>
        )}
      </div>
      {loading ? (
        <div className="pulse" style={{fontSize:11,color:T.muted}}>Procesando datos de terreno…</div>
      ) : text ? (
        <div className="fu" style={{fontSize:10,color:T.text,lineHeight:1.75,whiteSpace:"pre-wrap"}}>
          {text}
        </div>
      ) : (
        <div style={{fontSize:10,color:T.muted,textAlign:"center",padding:"20px 0"}}>
          Presiona "Analizar con IA" para obtener insights automáticos del modelo de aprendizaje
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [feedback, setFeedback] = useState(FEEDBACK_DATA);
  const [model, setModel] = useState(null);
  const [activeTab, setActiveTab] = useState("modelo");
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Recalcular modelo cuando cambia el feedback
  useEffect(() => {
    setModel(calcLearningModel(feedback));
  }, [feedback]);

  const handleFeedbackSubmit = useCallback((entry) => {
    setFeedback(prev => [...prev, entry]);
  }, []);

  const handleAIAnalysis = useCallback(async () => {
    if (!model) return;
    setAiLoading(true);
    setAiText("");

    const rockSummary = Object.entries(model.rockAdjust)
      .map(([r,d])=>`${r}: corrección P80 ${d.p80_correction.toFixed(2)}mm (${d.n} obs)`)
      .join("; ");

    const prompt = `Eres KrushRock, experto en ingeniería de chancado, análisis de datos de proceso y aprendizaje automático aplicado a plantas de chancado móviles en Chile.

Analiza estos resultados del motor de aprendizaje basado en ${model.n} observaciones reales de terreno:

MÉTRICAS DE PRECISIÓN DEL MODELO:
- P80: MAE=${model.metrics.p80.mae}mm | Bias=${model.metrics.p80.bias}mm | Accuracy=${model.metrics.p80.acc}% | R²=${model.metrics.p80.r2}
- Carga circulante: MAE=${model.metrics.cc.mae}% | Bias=${model.metrics.cc.bias}% | Accuracy=${model.metrics.cc.acc}%
- Tonelaje: MAE=${model.metrics.tph.mae}tph | Bias=${model.metrics.tph.bias}tph | Accuracy=${model.metrics.tph.acc}%
- OPEX: MAE=$${model.metrics.opex.mae}/t | Bias=${model.metrics.opex.bias} | Accuracy=${model.metrics.opex.acc}%

CORRECCIONES POR ROCA: ${rockSummary}
MEJORA RECIENTE: ${model.improvement}% menos error vs período anterior
RATING PROMEDIO DE USUARIOS: ${model.avgRating}/5 estrellas

FACTORES DE CORRECCIÓN ACTIVOS:
- P80: ×${model.corrections.p80_factor}
- CC: ×${model.corrections.cc_factor}
- TPH: ×${model.corrections.tph_factor}
- OPEX: ×${model.corrections.opex_factor}

Genera un análisis técnico de aprendizaje automático en español (máximo 250 palabras):
1. **Estado del modelo** (evaluación general de precisión)
2. **Variables más precisas y más problemáticas** (con causas probables)
3. **Patrones detectados** por tipo de roca (bullets con ●)
4. **Recomendaciones para mejorar el modelo** (bullets con →)
5. **Próximos pasos** para aumentar la base de datos de entrenamiento

Usa terminología técnica de proceso y machine learning. Sé directo y orientado a acción.`;

    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
          messages:[{role:"user",content:prompt}] })
      });
      const d = await r.json();
      setAiText(d.content?.find(b=>b.type==="text")?.text || "No disponible.");
    } catch {
      setAiText("Análisis IA no disponible. Revisa las métricas manualmente.");
    }
    setAiLoading(false);
  }, [model]);

  const tabs = [
    {id:"modelo",    label:"Estado del modelo"},
    {id:"feedback",  label:"Ingresar medición"},
    {id:"historial", label:"Historial"},
    {id:"ia",        label:"◈ Insights IA"},
  ];

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column"}}>
      <style>{CSS}</style>

      {/* TOPBAR */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,
        padding:"11px 18px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <div style={{width:34,height:34,borderRadius:8,
          background:`linear-gradient(135deg,${T.amber},#d97706)`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontFamily:T.display,fontWeight:900,fontSize:15,color:"#000"}}>CS</div>
        <div>
          <div style={{fontFamily:T.display,fontWeight:800,fontSize:16,color:T.amber}}>
            KrushRock
          </div>
          <div style={{fontSize:8,color:T.muted,letterSpacing:"0.12em"}}>
            FASE 7 · MOTOR DE APRENDIZAJE · MEJORA CONTINUA CON DATOS REALES
          </div>
        </div>
        {model && (
          <div style={{marginLeft:"auto",display:"flex",gap:10,alignItems:"center"}}>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:9,color:T.muted}}>MODELO ACTIVO</div>
              <div style={{fontFamily:T.display,fontWeight:700,color:T.green,fontSize:13}}>
                v{model.n}.0 · {model.n} obs.
              </div>
            </div>
            <div style={{width:8,height:8,borderRadius:"50%",background:T.green,
              boxShadow:`0 0 8px ${T.green}`}}/>
          </div>
        )}
      </div>

      {/* KPIs rápidos */}
      {model && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,
          borderBottom:`1px solid ${T.border}`,background:T.surface}}>
          {[
            {label:"OBSERVACIONES",v:model.n,        unit:"", color:T.amber},
            {label:"ACCURACY P80", v:model.metrics.p80.acc, unit:"%", color:Number(model.metrics.p80.acc)>=80?T.green:T.amber},
            {label:"MEJORA RECIENTE",v:model.improvement, unit:"%", color:T.green},
            {label:"RATING USUARIOS",v:model.avgRating,  unit:"/5 ★", color:T.amber},
          ].map(k=>(
            <div key={k.label} style={{padding:"10px 16px",borderRight:`1px solid ${T.border}`}}>
              <div style={{fontSize:8,color:T.muted,letterSpacing:"0.07em"}}>{k.label}</div>
              <div style={{fontFamily:T.display,fontWeight:800,fontSize:20,color:k.color,lineHeight:1.2}}>
                {k.v}<span style={{fontSize:10,color:T.muted}}>{k.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,
        background:T.surface,flexShrink:0}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            flex:1,padding:"10px 4px",background:"none",border:"none",
            borderBottom:`2px solid ${activeTab===t.id?T.amber:"transparent"}`,
            color:activeTab===t.id?T.amber:T.muted,
            fontSize:11,cursor:"pointer",
            fontFamily:T.display,fontWeight:600,transition:"all .2s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{flex:1,overflowY:"auto",padding:16,maxWidth:900,margin:"0 auto",width:"100%"}}>
        {activeTab==="modelo"    && model && <ModelPanel model={model} T={T}/>}
        {activeTab==="feedback"  && <FeedbackPanel onSubmit={handleFeedbackSubmit} T={T}/>}
        {activeTab==="historial" && <FeedbackHistory feedback={feedback} T={T}/>}
        {activeTab==="ia"        && (
          <AIInsightsPanel
            feedback={feedback} model={model}
            loading={aiLoading} text={aiText}
            onAnalyze={handleAIAnalysis} T={T}/>
        )}
      </div>
    </div>
  );
}
