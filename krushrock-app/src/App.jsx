import { useState, useEffect } from "react";
import { G, GCSS, API_BASE } from "./shared.js";
import { LandingScreen, SimpleMode } from "./components/ModoSimple.jsx";
import { runSimulation } from "./engine.js";
import Results from "./components/Resultados.jsx";
import Onboarding from "./components/Wizard.jsx";

export default function App() {
  const [res, setRes] = useState(null);
  const [unit, setUnit] = useState("mm");
  const [currentInp, setCurrentInp] = useState(null);
  const [editStep, setEditStep] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState(null);
  const [appMode, setAppMode] = useState(null);

  // Catálogo de equipos: se carga desde el backend. null = cargando.
  const [eqCatalog, setEqCatalog] = useState(null);
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

  // Alias para usar el catálogo en JSX. Vacío hasta que llegue la respuesta del backend.
  const EQ = eqCatalog || {};
  const EQ_BY_CAT = eqCatalog ? {
    jaw:      EQ.jaw       || [],
    cone:     EQ.cone      || [],
    hsi:      EQ.hsi       || [],
    screen3d: (EQ.screen || []).filter((e) => e.decks === 3),
    screen2d: (EQ.screen || []).filter((e) => e.decks === 2),
    screen1d: EQ.screen_1d || [],
    screen_hf: EQ.screen_hf || [],
  } : null;

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
      productFitPct: res.final.productFitPct,
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
    setAppMode(null);
  };

  if (appMode === null)
    return <LandingScreen onSelect={setAppMode} />;
  // Estado de carga: el catálogo aún no llegó del backend
  if (!eqCatalog)
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        minHeight:"100vh",background:G.bg,color:G.text,gap:16,fontFamily:G.font}}>
        <div style={{fontSize:32,fontWeight:700,color:G.accent}}>KrushRock</div>
        <div style={{fontSize:15,color:G.muted}}>Cargando catálogo de equipos...</div>
        <div style={{width:200,height:4,background:G.border,borderRadius:2,overflow:"hidden"}}>
          <div style={{width:"40%",height:4,background:G.accent,borderRadius:2,
            animation:"flowDash 1s linear infinite"}}/>
        </div>
      </div>
    );

  if (appMode === "simple")
    return <SimpleMode eqCatalog={eqCatalog} onBack={() => setAppMode(null)} />;

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
