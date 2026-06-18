import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA WHITE-LABEL — cada cliente tiene su propia identidad visual
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_BRAND = {
  name:        "KrushRock",
  tagline:     "Simulador Inteligente de Chancado y Selección",
  logoText:    "CS",
  primaryColor:"#f59e0b",
  accentColor: "#06b6d4",
  bgColor:     "#08090f",
  surfaceColor:"#0e1118",
  cardColor:   "#141924",
  textColor:   "#dde3f0",
  font:        "Syne",
  plan:        "enterprise",
  domain:      "krushrock.app",
  supportEmail:"soporte@krushrock.app",
  showPoweredBy: true,
};

// Simulación de marca de un cliente específico (white-label)
const CLIENT_BRANDS = {
  "aridos-pacifico": {
    ...DEFAULT_BRAND,
    name:        "ÁridosSim",
    tagline:     "Plataforma de Simulación — Áridos del Pacífico",
    logoText:    "AP",
    primaryColor:"#2563eb",
    accentColor: "#10b981",
    domain:      "sim.aridospacifico.cl",
    supportEmail:"ingenieria@aridospacifico.cl",
    showPoweredBy: true,
  },
  "minera-norte": {
    ...DEFAULT_BRAND,
    name:        "CrushPro",
    tagline:     "Sistema de Simulación Minera — Norte Grande",
    logoText:    "MN",
    primaryColor:"#dc2626",
    accentColor: "#f59e0b",
    domain:      "crushpro.mineranorte.cl",
    supportEmail:"operaciones@mineranorte.cl",
    showPoweredBy: false,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS DINÁMICOS — se generan desde la marca activa
// ─────────────────────────────────────────────────────────────────────────────
function makeTokens(brand) {
  return {
    bg:      brand.bgColor,
    surface: brand.surfaceColor,
    card:    brand.cardColor,
    border:  "#1e2d45",
    primary: brand.primaryColor,
    accent:  brand.accentColor,
    text:    brand.textColor,
    muted:   "#56647a",
    faint:   "#1a2540",
    green:   "#10b981",
    red:     "#ef4444",
    amber:   "#f59e0b",
    mono:    "'JetBrains Mono','Fira Mono',monospace",
    display: `'${brand.font}',sans-serif`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DATOS SIMULADOS — usuarios, proyectos, simulaciones de clientes
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id:"u1", name:"Carlos Mendoza",    email:"c.mendoza@aridospacifico.cl", role:"admin",    plan:"enterprise", sims:142, lastActive:"hace 2h",   avatar:"CM", status:"active" },
  { id:"u2", name:"María Torres",      email:"m.torres@aridospacifico.cl",  role:"engineer", plan:"enterprise", sims:89,  lastActive:"hace 5h",   avatar:"MT", status:"active" },
  { id:"u3", name:"Pedro Saavedra",    email:"p.saavedra@minera.cl",        role:"engineer", plan:"pro",        sims:34,  lastActive:"hace 1d",   avatar:"PS", status:"active" },
  { id:"u4", name:"Ana Contreras",     email:"a.contreras@cantera.cl",      role:"viewer",   plan:"free",       sims:5,   lastActive:"hace 3d",   avatar:"AC", status:"inactive" },
  { id:"u5", name:"Roberto Vega",      email:"r.vega@consultora.cl",        role:"engineer", plan:"pro",        sims:67,  lastActive:"hace 6h",   avatar:"RV", status:"active" },
  { id:"u6", name:"Laura Fuentes",     email:"l.fuentes@mina.cl",           role:"admin",    plan:"enterprise", sims:201, lastActive:"hace 1h",   avatar:"LF", status:"active" },
];

const MOCK_PROJECTS = [
  { id:"p1", name:"Planta Cantera Norte",    client:"Áridos del Pacífico", status:"active",  sims:24, lastSim:"2025-05-20", score:82, tph:350, rock:"Granito"  },
  { id:"p2", name:"Expansión Línea 2",       client:"Minera Norte Grande", status:"active",  sims:18, lastSim:"2025-05-22", score:74, tph:500, rock:"Basalto"  },
  { id:"p3", name:"Estudio Prefactibilidad", client:"Cantera del Sur",     status:"draft",   sims:7,  lastSim:"2025-05-18", score:68, tph:150, rock:"Caliza"   },
  { id:"p4", name:"Retrofit Planta 1",       client:"Áridos del Pacífico", status:"active",  sims:31, lastSim:"2025-05-23", score:91, tph:280, rock:"Pórfido"  },
  { id:"p5", name:"Nueva Planta Rancagua",   client:"Hormigones S.A.",     status:"archived",sims:52, lastSim:"2025-04-15", score:79, tph:420, rock:"Granito"  },
  { id:"p6", name:"Línea Áridos Finos",      client:"Cemento Nacional",    status:"active",  sims:11, lastSim:"2025-05-21", score:85, tph:200, rock:"Caliza"   },
];

const MOCK_SIMS = [
  { id:"s1", name:"Circuito base Cantera Norte",  project:"Planta Cantera Norte",    score:82, p80:25, tph:350, opex:2.84, date:"2025-05-23 09:14", circuit:"closed",  equip:"J-1280 + C-1545 + 694" },
  { id:"s2", name:"Variante con Scalper",         project:"Planta Cantera Norte",    score:78, p80:28, tph:350, opex:2.91, date:"2025-05-23 10:02", circuit:"scalper", equip:"J-1280 + Scalper + C-1545 + 694" },
  { id:"s3", name:"Alta capacidad Línea 2",       project:"Expansión Línea 2",       score:74, p80:32, tph:500, opex:3.12, date:"2025-05-22 14:30", circuit:"closed",  equip:"LT120 + LT220D + ST2.8" },
  { id:"s4", name:"Estudio caliza 150tph",        project:"Estudio Prefactibilidad", score:68, p80:20, tph:150, opex:3.45, date:"2025-05-18 11:20", circuit:"mid",     equip:"J-1160 + C-1540 + 683" },
  { id:"s5", name:"Optimización retrofit",        project:"Retrofit Planta 1",       score:91, p80:22, tph:280, opex:2.61, date:"2025-05-20 16:45", circuit:"closed",  equip:"J-1175 + C-1545 + 694" },
  { id:"s6", name:"Comparación A vs B",           project:"Retrofit Planta 1",       score:88, p80:24, tph:280, opex:2.73, date:"2025-05-21 09:00", circuit:"scalper", equip:"Premiertrak 600 + 1300 Maxtrak" },
];

const MOCK_METRICS = {
  totalSims:    342,
  totalProjects: 18,
  totalUsers:    24,
  avgScore:      79.4,
  totalTphDesigned: 48500,
  simsThisMonth: 87,
  reportsGenerated: 56,
  aiAnalyses:   289,
  topRock:      "Granito (34%)",
  topCircuit:   "Circuito cerrado (61%)",
  topBrand:     "Finlay (42% de equipos)",
  avgOpex:      2.93,
};

// ─────────────────────────────────────────────────────────────────────────────
// CSS INYECTADO (dinámico según brand)
// ─────────────────────────────────────────────────────────────────────────────
function makeCSS(T) {
  return `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:${T.bg};color:${T.text};font-family:${T.mono};min-height:100vh}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:${T.surface}}
::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
input,select,textarea{font-family:${T.mono};outline:none}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes barIn{from{width:0}to{width:var(--w)}}
.fu{animation:fadeUp .3s ease forwards}
.pulse{animation:pulse 1.4s ease infinite}
.spin{animation:spin 1s linear infinite}
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES BASE
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ initials, color, size=32 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:color+"33", border:`1px solid ${color}66`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.35, fontWeight:700, color, flexShrink:0,
    }}>{initials}</div>
  );
}

function Badge({ status }) {
  const map = {
    active:   { bg:"#064e3b", text:"#6ee7b7", label:"Activo" },
    inactive: { bg:"#1f2937", text:"#6b7280", label:"Inactivo" },
    draft:    { bg:"#1e3a5f", text:"#93c5fd", label:"Borrador" },
    archived: { bg:"#2d1f3d", text:"#a78bfa", label:"Archivado" },
    admin:    { bg:"#78350f", text:"#fcd34d", label:"Admin" },
    engineer: { bg:"#1e3a5f", text:"#93c5fd", label:"Ingeniero" },
    viewer:   { bg:"#1f2937", text:"#9ca3af", label:"Visualizador" },
    free:     { bg:"#1f2937", text:"#6b7280", label:"Free" },
    pro:      { bg:"#1e3a5f", text:"#60a5fa", label:"Pro" },
    enterprise:{ bg:"#2d1b00", text:"#f59e0b", label:"Enterprise" },
  };
  const s = map[status] || map.inactive;
  return (
    <span style={{
      background:s.bg, color:s.text,
      padding:"2px 8px", borderRadius:3,
      fontSize:9, fontFamily:"inherit", whiteSpace:"nowrap",
    }}>{s.label}</span>
  );
}

function StatCard({ label, value, unit="", sub="", color, icon, T }) {
  return (
    <div className="fu" style={{
      background:T.card, border:`1px solid ${T.border}`,
      borderRadius:8, padding:"14px 16px", position:"relative",
      overflow:"hidden",
    }}>
      <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:color}}/>
      <div style={{fontSize:9,color:T.muted,letterSpacing:"0.07em",marginBottom:6}}>{icon} {label}</div>
      <div style={{fontFamily:T.display,fontSize:26,fontWeight:800,color,lineHeight:1}}>
        {value}<span style={{fontSize:12,color:T.muted,marginLeft:3}}>{unit}</span>
      </div>
      {sub && <div style={{fontSize:9,color:T.muted,marginTop:4}}>{sub}</div>}
    </div>
  );
}

function ScoreBar({ value, T }) {
  const color = value>=80?"#10b981":value>=65?"#f59e0b":"#ef4444";
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1,height:5,background:T.faint,borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${value}%`,background:color,borderRadius:3,transition:"width .6s"}}/>
      </div>
      <span style={{fontSize:9,color,minWidth:28,textAlign:"right",fontWeight:600}}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN: BRAND CONFIGURATOR (White Label)
// ─────────────────────────────────────────────────────────────────────────────
function BrandConfigurator({ brand, onSave, T }) {
  const [draft, setDraft] = useState({ ...brand });
  const [saved, setSaved] = useState(false);

  const field = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const handleSave = () => {
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const colors = [
    { k:"primaryColor", label:"Color primario" },
    { k:"accentColor",  label:"Color acento" },
    { k:"bgColor",      label:"Fondo" },
    { k:"surfaceColor", label:"Superficie" },
    { k:"cardColor",    label:"Cards" },
    { k:"textColor",    label:"Texto" },
  ];

  const presets = [
    { name:"KrushRock (default)", primaryColor:"#f59e0b", accentColor:"#06b6d4", bgColor:"#08090f", surfaceColor:"#0e1118", cardColor:"#141924", textColor:"#dde3f0" },
    { name:"Azul Corporativo",   primaryColor:"#2563eb", accentColor:"#10b981", bgColor:"#08090f", surfaceColor:"#0e1118", cardColor:"#141924", textColor:"#dde3f0" },
    { name:"Rojo Minería",       primaryColor:"#dc2626", accentColor:"#f59e0b", bgColor:"#08090f", surfaceColor:"#0e1118", cardColor:"#141924", textColor:"#dde3f0" },
    { name:"Verde Áridos",       primaryColor:"#16a34a", accentColor:"#06b6d4", bgColor:"#08090f", surfaceColor:"#0e1118", cardColor:"#141924", textColor:"#dde3f0" },
    { name:"Claro Profesional",  primaryColor:"#1d4ed8", accentColor:"#7c3aed", bgColor:"#f8fafc", surfaceColor:"#f1f5f9", cardColor:"#ffffff", textColor:"#1e293b" },
  ];

  return (
    <div style={{display:"grid",gap:16}}>
      {/* Preview en tiempo real */}
      <div style={{
        background:draft.bgColor, border:`1px solid ${T.border}`,
        borderRadius:10, padding:20,
      }}>
        <div style={{fontSize:9,color:T.muted,marginBottom:12,letterSpacing:"0.08em"}}>
          PREVIEW EN TIEMPO REAL
        </div>
        <div style={{
          background:draft.surfaceColor,
          borderBottom:`1px solid ${T.border}`,
          padding:"12px 16px",
          display:"flex",alignItems:"center",gap:10,
          borderRadius:"6px 6px 0 0",
        }}>
          <div style={{
            width:32,height:32,borderRadius:7,
            background:draft.primaryColor,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:T.display,fontWeight:900,fontSize:14,color:"#fff",
          }}>{draft.logoText}</div>
          <div>
            <div style={{fontFamily:T.display,fontWeight:700,fontSize:15,color:draft.primaryColor}}>
              {draft.name}
            </div>
            <div style={{fontSize:8,color:draft.accentColor,letterSpacing:"0.08em"}}>
              {draft.tagline}
            </div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:6}}>
            {["Dashboard","Proyectos","Simulaciones"].map(n=>(
              <span key={n} style={{fontSize:9,color:draft.textColor,
                padding:"4px 10px",background:draft.cardColor,
                borderRadius:5,border:`1px solid ${T.border}`}}>{n}</span>
            ))}
          </div>
        </div>
        <div style={{
          background:draft.cardColor,
          padding:12,borderRadius:"0 0 6px 6px",
          border:`1px solid ${T.border}`,borderTop:"none",
          display:"flex",gap:8,
        }}>
          {["Score: 87/100","P80: 24mm","OPEX: $2.84"].map((s,i)=>(
            <div key={i} style={{flex:1,padding:"8px 10px",
              background:draft.surfaceColor,borderRadius:5,
              borderLeft:`3px solid ${i===0?draft.primaryColor:draft.accentColor}`}}>
              <div style={{fontSize:8,color:draft.accentColor}}>{s.split(":")[0]}</div>
              <div style={{fontSize:16,fontFamily:T.display,fontWeight:800,
                color:draft.primaryColor}}>{s.split(":")[1]}</div>
            </div>
          ))}
        </div>
        {draft.showPoweredBy && (
          <div style={{textAlign:"center",marginTop:8,fontSize:8,color:T.muted}}>
            Powered by <span style={{color:draft.primaryColor}}>KrushRock</span>
          </div>
        )}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {/* Textos */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:14}}>
          <div style={{fontSize:9,color:T.muted,letterSpacing:"0.08em",marginBottom:10}}>IDENTIDAD</div>
          {[
            {k:"name",     label:"Nombre del producto",    ph:"KrushRock"},
            {k:"tagline",  label:"Tagline",                ph:"Simulador Inteligente..."},
            {k:"logoText", label:"Texto del logo (2 car.)",ph:"CS"},
            {k:"domain",   label:"Dominio personalizado",  ph:"sim.tuempresa.cl"},
            {k:"supportEmail",label:"Email de soporte",    ph:"soporte@tuempresa.cl"},
          ].map(f=>(
            <div key={f.k} style={{marginBottom:8}}>
              <div style={{fontSize:8,color:T.muted,marginBottom:3}}>{f.label.toUpperCase()}</div>
              <input value={draft[f.k]||""} onChange={e=>field(f.k,e.target.value)}
                placeholder={f.ph}
                style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,
                  borderRadius:5,padding:"6px 10px",color:T.text,fontSize:10}} />
            </div>
          ))}
          <label style={{display:"flex",alignItems:"center",gap:8,marginTop:4,cursor:"pointer"}}>
            <input type="checkbox" checked={draft.showPoweredBy}
              onChange={e=>field("showPoweredBy",e.target.checked)} />
            <span style={{fontSize:9,color:T.muted}}>Mostrar "Powered by KrushRock"</span>
          </label>
        </div>

        {/* Colores */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:14}}>
          <div style={{fontSize:9,color:T.muted,letterSpacing:"0.08em",marginBottom:10}}>COLORES</div>
          {colors.map(c=>(
            <div key={c.k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <input type="color" value={draft[c.k]||"#000000"}
                onChange={e=>field(c.k,e.target.value)}
                style={{width:28,height:28,borderRadius:5,border:"none",cursor:"pointer",padding:2,
                  background:T.surface}} />
              <span style={{fontSize:9,color:T.muted,flex:1}}>{c.label}</span>
              <span style={{fontSize:8,color:T.muted,fontFamily:T.mono}}>{draft[c.k]}</span>
            </div>
          ))}
          <div style={{marginTop:10}}>
            <div style={{fontSize:9,color:T.muted,marginBottom:6}}>PRESETS</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {presets.map(p=>(
                <button key={p.name} onClick={()=>setDraft(d=>({...d,...p}))} style={{
                  padding:"5px 10px",background:T.surface,border:`1px solid ${T.border}`,
                  borderRadius:5,color:T.muted,fontSize:9,cursor:"pointer",textAlign:"left",
                  display:"flex",alignItems:"center",gap:8,
                }}>
                  <div style={{width:14,height:14,borderRadius:"50%",background:p.primaryColor,flexShrink:0}}/>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleSave} style={{
        padding:"12px",
        background:saved?"#064e3b":`linear-gradient(135deg,${T.primary},${T.primary}cc)`,
        border:"none",borderRadius:8,
        color:saved?"#6ee7b7":"#000",
        fontFamily:T.display,fontWeight:700,fontSize:13,cursor:"pointer",
        transition:"all .3s",
      }}>
        {saved ? "✓ Configuración guardada" : "Guardar configuración white-label"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN: GESTIÓN DE USUARIOS
// ─────────────────────────────────────────────────────────────────────────────
function UsersSection({ T }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("engineer");
  const [invitePlan, setInvitePlan] = useState("pro");
  const [inviteSent, setInviteSent] = useState(false);

  const filtered = MOCK_USERS.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter==="all" || u.status===filter || u.role===filter || u.plan===filter;
    return matchSearch && matchFilter;
  });

  const handleInvite = () => {
    if (!inviteEmail) return;
    setInviteSent(true);
    setTimeout(() => { setInviteSent(false); setShowInvite(false); setInviteEmail(""); }, 2500);
  };

  const roleColors = { admin:"#f59e0b", engineer:"#3b82f6", viewer:"#6b7280" };

  return (
    <div style={{display:"grid",gap:14}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar usuario..."
          style={{flex:1,minWidth:180,background:T.card,border:`1px solid ${T.border}`,
            borderRadius:7,padding:"8px 12px",color:T.text,fontSize:11}} />
        <select value={filter} onChange={e=>setFilter(e.target.value)}
          style={{background:T.card,border:`1px solid ${T.border}`,
            borderRadius:7,padding:"8px 12px",color:T.text,fontSize:11,cursor:"pointer"}}>
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="admin">Admins</option>
          <option value="engineer">Ingenieros</option>
          <option value="enterprise">Enterprise</option>
          <option value="pro">Pro</option>
        </select>
        <button onClick={()=>setShowInvite(!showInvite)} style={{
          padding:"8px 16px",background:`linear-gradient(135deg,${T.primary},${T.primary}cc)`,
          border:"none",borderRadius:7,color:"#000",
          fontFamily:T.display,fontWeight:700,fontSize:11,cursor:"pointer",
        }}>+ Invitar usuario</button>
      </div>

      {/* Panel invitar */}
      {showInvite && (
        <div className="fu" style={{background:T.card,border:`1px solid ${T.primary}44`,
          borderRadius:9,padding:16}}>
          <div style={{fontSize:10,color:T.primary,fontWeight:600,marginBottom:12}}>
            INVITAR NUEVO USUARIO
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:8,alignItems:"end"}}>
            <div>
              <div style={{fontSize:8,color:T.muted,marginBottom:3}}>EMAIL</div>
              <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}
                placeholder="ingeniero@empresa.cl"
                style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,
                  borderRadius:5,padding:"8px 10px",color:T.text,fontSize:11}} />
            </div>
            {[
              {label:"ROL",   val:inviteRole, set:setInviteRole,
               opts:[{v:"admin",l:"Admin"},{v:"engineer",l:"Ingeniero"},{v:"viewer",l:"Visualizador"}]},
              {label:"PLAN",  val:invitePlan, set:setInvitePlan,
               opts:[{v:"free",l:"Free"},{v:"pro",l:"Pro"},{v:"enterprise",l:"Enterprise"}]},
            ].map(f=>(
              <div key={f.label}>
                <div style={{fontSize:8,color:T.muted,marginBottom:3}}>{f.label}</div>
                <select value={f.val} onChange={e=>f.set(e.target.value)}
                  style={{background:T.surface,border:`1px solid ${T.border}`,
                    borderRadius:5,padding:"8px 10px",color:T.text,fontSize:11,cursor:"pointer"}}>
                  {f.opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            ))}
            <button onClick={handleInvite} style={{
              padding:"8px 14px",
              background:inviteSent?"#064e3b":`linear-gradient(135deg,${T.primary},${T.primary}cc)`,
              border:"none",borderRadius:5,
              color:inviteSent?"#6ee7b7":"#000",
              fontFamily:T.display,fontWeight:700,fontSize:11,cursor:"pointer",
            }}>
              {inviteSent ? "✓ Enviado" : "Enviar invitación"}
            </button>
          </div>
        </div>
      )}

      {/* Tabla usuarios */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:9,overflow:"hidden"}}>
        <div style={{background:T.surface,padding:"10px 16px",
          display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1fr 1fr 1fr 80px",
          gap:8,borderBottom:`1px solid ${T.border}`}}>
          {["Usuario","Email","Rol","Plan","Simulaciones","Último acceso",""].map(h=>(
            <div key={h} style={{fontSize:8,color:T.muted,letterSpacing:"0.07em"}}>{h}</div>
          ))}
        </div>
        {filtered.map((u,i)=>(
          <div key={u.id} style={{
            padding:"11px 16px",
            display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1fr 1fr 1fr 80px",
            gap:8,alignItems:"center",
            background:i%2===0?T.card:T.surface,
            borderBottom:`1px solid ${T.faint}`,
          }}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Avatar initials={u.avatar} color={roleColors[u.role]||T.primary} size={28}/>
              <div>
                <div style={{fontSize:10,color:T.text,fontWeight:500}}>{u.name}</div>
                <div style={{fontSize:8,color:u.status==="active"?T.green:T.muted}}>
                  ● {u.status==="active"?"Activo":"Inactivo"}
                </div>
              </div>
            </div>
            <div style={{fontSize:9,color:T.muted,overflow:"hidden",textOverflow:"ellipsis",
              whiteSpace:"nowrap"}}>{u.email}</div>
            <Badge status={u.role}/>
            <Badge status={u.plan}/>
            <div style={{fontSize:10,color:T.text,textAlign:"center"}}>{u.sims}</div>
            <div style={{fontSize:9,color:T.muted}}>{u.lastActive}</div>
            <div style={{display:"flex",gap:4}}>
              <button style={{padding:"3px 8px",background:T.faint,border:"none",
                borderRadius:4,color:T.muted,fontSize:8,cursor:"pointer"}}>Editar</button>
              <button style={{padding:"3px 8px",background:"#7f1d1d33",border:"none",
                borderRadius:4,color:"#fca5a5",fontSize:8,cursor:"pointer"}}>Quitar</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{fontSize:9,color:T.muted,textAlign:"center"}}>
        {filtered.length} usuario(s) · Licencia activa para {MOCK_METRICS.totalUsers} usuarios
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN: PROYECTOS
// ─────────────────────────────────────────────────────────────────────────────
function ProjectsSection({ T }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const filtered = MOCK_PROJECTS.filter(p =>
    statusFilter==="all" || p.status===statusFilter
  );

  const statusColor = { active:T.green, draft:T.accent||"#06b6d4", archived:T.muted };

  return (
    <div style={{display:"grid",gap:14}}>
      {/* Filtros */}
      <div style={{display:"flex",gap:6}}>
        {["all","active","draft","archived"].map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)} style={{
            padding:"5px 12px",borderRadius:5,fontSize:9,cursor:"pointer",
            background:statusFilter===s?T.primary+"33":T.card,
            border:`1px solid ${statusFilter===s?T.primary:T.border}`,
            color:statusFilter===s?T.primary:T.muted,
          }}>
            {s==="all"?"Todos":s==="active"?"Activos":s==="draft"?"Borradores":"Archivados"}
          </button>
        ))}
        <button style={{marginLeft:"auto",padding:"5px 14px",
          background:`linear-gradient(135deg,${T.primary},${T.primary}cc)`,
          border:"none",borderRadius:5,color:"#000",
          fontFamily:T.display,fontWeight:700,fontSize:10,cursor:"pointer"}}>
          + Nuevo proyecto
        </button>
      </div>

      {/* Grid proyectos */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        {filtered.map(p=>(
          <div key={p.id} className="fu" style={{
            background:T.card,border:`1px solid ${T.border}`,
            borderRadius:9,padding:16,cursor:"pointer",transition:"border .2s",
          }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=T.primary}
            onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",
              alignItems:"flex-start",marginBottom:10}}>
              <div style={{flex:1,marginRight:8}}>
                <div style={{fontSize:12,color:T.text,fontWeight:600,
                  fontFamily:T.display,marginBottom:3}}>{p.name}</div>
                <div style={{fontSize:9,color:T.muted}}>{p.client}</div>
              </div>
              <Badge status={p.status}/>
            </div>
            {/* Score */}
            <div style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",
                fontSize:9,color:T.muted,marginBottom:4}}>
                <span>Score promedio</span>
                <span style={{color:p.score>=80?T.green:T.amber}}>{p.score}/100</span>
              </div>
              <ScoreBar value={p.score} T={T}/>
            </div>
            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",
              gap:6,padding:"8px 0",borderTop:`1px solid ${T.faint}`}}>
              {[
                {l:"Sims",v:p.sims},
                {l:"TPH obj.",v:p.tph},
                {l:"Roca",v:p.rock},
              ].map(s=>(
                <div key={s.l} style={{textAlign:"center"}}>
                  <div style={{fontSize:11,color:T.primary,fontWeight:700,
                    fontFamily:T.display}}>{s.v}</div>
                  <div style={{fontSize:8,color:T.muted}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:8,color:T.muted,marginTop:8,textAlign:"right"}}>
              Última sim: {p.lastSim}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN: HISTORIAL SIMULACIONES
// ─────────────────────────────────────────────────────────────────────────────
function SimulationsSection({ T }) {
  return (
    <div style={{display:"grid",gap:12}}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:9,overflow:"hidden"}}>
        <div style={{background:T.surface,padding:"10px 16px",
          display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1fr 1fr 1fr 100px",
          gap:8,borderBottom:`1px solid ${T.border}`}}>
          {["Simulación","Proyecto","Score","P80","TPH","OPEX","Fecha"].map(h=>(
            <div key={h} style={{fontSize:8,color:T.muted,letterSpacing:"0.07em"}}>{h}</div>
          ))}
        </div>
        {MOCK_SIMS.map((s,i)=>{
          const sc = Number(s.score);
          const sc_color = sc>=80?T.green:sc>=65?T.amber:"#ef4444";
          return (
            <div key={s.id} style={{
              padding:"10px 16px",
              display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1fr 1fr 1fr 100px",
              gap:8,alignItems:"center",
              background:i%2===0?T.card:T.surface,
              borderBottom:`1px solid ${T.faint}`,cursor:"pointer",
            }}
              onMouseEnter={e=>e.currentTarget.style.background=T.card+"dd"}
              onMouseLeave={e=>e.currentTarget.style.background=i%2===0?T.card:T.surface}>
              <div>
                <div style={{fontSize:10,color:T.text,fontWeight:500}}>{s.name}</div>
                <div style={{fontSize:8,color:T.muted,marginTop:2}}>{s.equip}</div>
              </div>
              <div style={{fontSize:9,color:T.muted}}>{s.project}</div>
              <div style={{fontFamily:T.display,fontWeight:700,fontSize:14,color:sc_color}}>
                {s.score}
              </div>
              <div style={{fontSize:10,color:T.text}}>{s.p80}<span style={{fontSize:8,color:T.muted}}>mm</span></div>
              <div style={{fontSize:10,color:T.text}}>{s.tph}<span style={{fontSize:8,color:T.muted}}>tph</span></div>
              <div style={{fontSize:10,color:T.text}}>${s.opex}<span style={{fontSize:8,color:T.muted}}>/t</span></div>
              <div style={{fontSize:8,color:T.muted}}>{s.date.split(" ")[0]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN: DASHBOARD MÉTRICAS
// ─────────────────────────────────────────────────────────────────────────────
function DashboardSection({ brand, T }) {
  const M = MOCK_METRICS;
  return (
    <div style={{display:"grid",gap:16}}>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        <StatCard T={T} label="TOTAL SIMULACIONES" value={M.totalSims}     color={T.primary} icon="◈" sub={`+${M.simsThisMonth} este mes`}/>
        <StatCard T={T} label="PROYECTOS ACTIVOS"  value={M.totalProjects} color={T.accent||"#06b6d4"} icon="▣" sub="18 proyectos totales"/>
        <StatCard T={T} label="USUARIOS"           value={M.totalUsers}    color={T.green}  icon="◉" sub="Licencias activas"/>
        <StatCard T={T} label="SCORE PROMEDIO"     value={M.avgScore}      unit="/100" color="#f59e0b" icon="★" sub="Eficiencia global"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        <StatCard T={T} label="TPH DISEÑADOS"      value={(M.totalTphDesigned/1000).toFixed(1)} unit="k tph" color={T.primary} icon="⚡"/>
        <StatCard T={T} label="REPORTES PDF"       value={M.reportsGenerated} color={T.accent||"#06b6d4"} icon="📄"/>
        <StatCard T={T} label="ANÁLISIS IA"        value={M.aiAnalyses}    color={T.green}  icon="◈"/>
        <StatCard T={T} label="OPEX PROMEDIO"      value={M.avgOpex} unit="USD/t" color="#f59e0b" icon="$"/>
      </div>

      {/* Insights */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:16}}>
          <div style={{fontSize:9,color:T.muted,letterSpacing:"0.08em",marginBottom:12}}>
            PATRONES MÁS USADOS
          </div>
          {[
            {label:"Roca más simulada",  value:M.topRock,    color:T.primary},
            {label:"Circuito preferido", value:M.topCircuit, color:T.accent||"#06b6d4"},
            {label:"Marca de equipo",    value:M.topBrand,   color:T.green},
          ].map(item=>(
            <div key={item.label} style={{display:"flex",justifyContent:"space-between",
              padding:"6px 0",borderBottom:`1px solid ${T.faint}`,fontSize:10}}>
              <span style={{color:T.muted}}>{item.label}</span>
              <span style={{color:item.color,fontWeight:600}}>{item.value}</span>
            </div>
          ))}
        </div>

        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:16}}>
          <div style={{fontSize:9,color:T.muted,letterSpacing:"0.08em",marginBottom:12}}>
            ACTIVIDAD — ÚLTIMOS 7 DÍAS
          </div>
          {[
            {day:"Lun",sims:14},
            {day:"Mar",sims:22},
            {day:"Mié",sims:18},
            {day:"Jue",sims:31},
            {day:"Vie",sims:27},
            {day:"Sáb",sims:8},
            {day:"Dom",sims:5},
          ].map(d=>(
            <div key={d.day} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
              <span style={{fontSize:9,color:T.muted,width:28}}>{d.day}</span>
              <div style={{flex:1,height:8,background:T.faint,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(d.sims/31)*100}%`,
                  background:T.primary,borderRadius:3,transition:"width .5s"}}/>
              </div>
              <span style={{fontSize:9,color:T.text,width:18,textAlign:"right"}}>{d.sims}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Proyectos recientes */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:16}}>
        <div style={{fontSize:9,color:T.muted,letterSpacing:"0.08em",marginBottom:12}}>
          PROYECTOS ACTIVOS — RESUMEN
        </div>
        {MOCK_PROJECTS.filter(p=>p.status==="active").map(p=>(
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,
            padding:"8px 0",borderBottom:`1px solid ${T.faint}`}}>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:T.text,fontWeight:500}}>{p.name}</div>
              <div style={{fontSize:9,color:T.muted}}>{p.client} · {p.rock}</div>
            </div>
            <div style={{width:120}}><ScoreBar value={p.score} T={T}/></div>
            <div style={{textAlign:"right",minWidth:60}}>
              <div style={{fontSize:10,color:T.primary,fontWeight:600}}>{p.tph} tph</div>
              <div style={{fontSize:8,color:T.muted}}>{p.sims} sims</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN: LICENCIAS Y PLANES
// ─────────────────────────────────────────────────────────────────────────────
function LicensesSection({ T }) {
  const plans = [
    { name:"Free",       price:"$0",    period:"/mes", color:"#6b7280",
      features:["5 simulaciones/mes","1 proyecto","Sin exportación PDF","Sin comparador"],
      limits:"5 sim/mes", users:"1 usuario" },
    { name:"Pro",        price:"$149",  period:"/mes", color:T.accent||"#06b6d4",
      features:["500 simulaciones/mes","Proyectos ilimitados","Exportación PDF","Comparador A vs B","Análisis IA completo"],
      limits:"500 sim/mes", users:"5 usuarios" },
    { name:"Enterprise", price:"$490",  period:"/mes", color:T.primary, popular:true,
      features:["Simulaciones ilimitadas","Usuarios ilimitados","White label completo","API access","Soporte prioritario","Onboarding dedicado","Logo propio en PDFs"],
      limits:"Ilimitado", users:"Usuarios ilimitados" },
  ];

  return (
    <div style={{display:"grid",gap:16}}>
      {/* Tu plan actual */}
      <div style={{background:T.card,border:`2px solid ${T.primary}`,borderRadius:9,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:9,color:T.muted,marginBottom:4}}>PLAN ACTUAL</div>
            <div style={{fontFamily:T.display,fontSize:24,fontWeight:800,color:T.primary}}>
              Enterprise
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:22,fontFamily:T.display,fontWeight:800,color:T.text}}>$490</div>
            <div style={{fontSize:9,color:T.muted}}>/mes · facturación anual</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:12}}>
          {[
            {l:"Simulaciones usadas",v:"87 / ∞"},
            {l:"Usuarios activos",v:"6 / ∞"},
            {l:"Proyectos",v:"18 / ∞"},
            {l:"Próximo cobro",v:"01/06/2025"},
          ].map(s=>(
            <div key={s.l} style={{background:T.surface,borderRadius:6,padding:"8px 10px"}}>
              <div style={{fontSize:8,color:T.muted}}>{s.l}</div>
              <div style={{fontSize:12,color:T.text,fontWeight:600,marginTop:2}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Planes disponibles */}
      <div style={{fontSize:9,color:T.muted,letterSpacing:"0.08em"}}>PLANES DISPONIBLES</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {plans.map(plan=>(
          <div key={plan.name} style={{
            background:T.card,
            border:`2px solid ${plan.popular?plan.color:T.border}`,
            borderRadius:9,padding:18,position:"relative",
          }}>
            {plan.popular && (
              <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",
                background:T.primary,color:"#000",
                padding:"2px 12px",borderRadius:10,fontSize:8,fontWeight:700,
                fontFamily:T.display,whiteSpace:"nowrap"}}>
                MÁS POPULAR
              </div>
            )}
            <div style={{fontFamily:T.display,fontWeight:800,fontSize:18,color:plan.color}}>
              {plan.name}
            </div>
            <div style={{display:"flex",alignItems:"baseline",gap:2,margin:"8px 0 14px"}}>
              <span style={{fontFamily:T.display,fontWeight:800,fontSize:28,color:T.text}}>
                {plan.price}
              </span>
              <span style={{fontSize:10,color:T.muted}}>{plan.period}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
              {plan.features.map(f=>(
                <div key={f} style={{display:"flex",gap:6,alignItems:"flex-start",fontSize:10}}>
                  <span style={{color:plan.color,marginTop:1}}>✓</span>
                  <span style={{color:T.text}}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{fontSize:8,color:T.muted,marginBottom:10}}>
              {plan.limits} · {plan.users}
            </div>
            <button style={{
              width:"100%",padding:"9px",
              background:plan.popular?`linear-gradient(135deg,${plan.color},${plan.color}cc)`:"none",
              border:`1px solid ${plan.color}`,
              borderRadius:6,color:plan.popular?"#000":plan.color,
              fontFamily:T.display,fontWeight:700,fontSize:11,cursor:"pointer",
            }}>
              {plan.name==="Enterprise"?"Plan actual":"Cambiar a "+plan.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN: CONFIGURACIÓN API
// ─────────────────────────────────────────────────────────────────────────────
function APISection({ T }) {
  const [showKey, setShowKey] = useState(false);
  const apiKey = "csk_live_f8a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6";

  return (
    <div style={{display:"grid",gap:14}}>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:18}}>
        <div style={{fontSize:10,color:T.primary,fontWeight:600,marginBottom:14}}>API ACCESS — PLAN ENTERPRISE</div>
        <div style={{fontSize:9,color:T.muted,marginBottom:14,lineHeight:1.6}}>
          Integra KrushRock directamente en tus propios sistemas. La API REST permite
          ejecutar simulaciones, obtener resultados y generar reportes programáticamente.
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:8,color:T.muted,marginBottom:5}}>TU API KEY</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,
              borderRadius:6,padding:"9px 12px",fontFamily:T.mono,fontSize:11,
              color:T.text,letterSpacing:"0.05em"}}>
              {showKey ? apiKey : "csk_live_" + "●".repeat(28)}
            </div>
            <button onClick={()=>setShowKey(!showKey)} style={{
              padding:"9px 14px",background:T.faint,border:`1px solid ${T.border}`,
              borderRadius:6,color:T.muted,fontSize:10,cursor:"pointer"}}>
              {showKey?"Ocultar":"Mostrar"}
            </button>
            <button onClick={()=>navigator.clipboard?.writeText(apiKey)} style={{
              padding:"9px 14px",background:`${T.primary}22`,
              border:`1px solid ${T.primary}44`,
              borderRadius:6,color:T.primary,fontSize:10,cursor:"pointer"}}>
              Copiar
            </button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[
            {label:"Base URL",       value:"https://api.krushrock.app/v1"},
            {label:"Versión",        value:"v2.0.0"},
            {label:"Rate limit",     value:"1000 req/hora"},
            {label:"Autenticación",  value:"Bearer Token (JWT)"},
          ].map(item=>(
            <div key={item.label} style={{background:T.surface,borderRadius:6,padding:"9px 12px"}}>
              <div style={{fontSize:8,color:T.muted}}>{item.label}</div>
              <div style={{fontSize:10,color:T.text,marginTop:2,fontFamily:T.mono}}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ejemplo de código */}
      <div style={{background:"#0d1117",border:`1px solid ${T.border}`,borderRadius:9,padding:16}}>
        <div style={{fontSize:9,color:T.muted,marginBottom:10,letterSpacing:"0.08em"}}>EJEMPLO — Ejecutar simulación via API</div>
        <pre style={{fontSize:9,color:"#e2e8f0",fontFamily:T.mono,lineHeight:1.7,overflow:"auto"}}>
{`// JavaScript / Node.js
const response = await fetch(
  'https://api.krushrock.app/v1/simulations/run',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ${apiKey.slice(0,20)}...',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tph: 300,
      f80: 600,
      p80_target: 25,
      rock_type: 'granito',
      humidity: 1,
      circuit: 'closed',
      nodes: [
        {
          id: 'n1', type: 'jaw',
          equipment: {
            brand: 'Finlay', model: 'J-1280',
            curves: { css: [75,100,150,200], tph: [300,370,460,500] }
          }
        },
        {
          id: 'n2', type: 'cone',
          equipment: {
            brand: 'Finlay', model: 'C-1545',
            curves: { css: [14,22,36,45], tph: [150,245,360,400] }
          }
        }
      ],
      save: true
    })
  }
);

const { result } = await response.json();
console.log(\`Score: \${result.eff_score}/100\`);
console.log(\`P80: \${result.final_p80_mm}mm\`);
console.log(\`OPEX: \${result.opex.total_usd_t} USD/t\`);`}
        </pre>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP PRINCIPAL — PORTAL DE CLIENTES
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeBrand, setActiveBrand] = useState(DEFAULT_BRAND);
  const [T, setT] = useState(makeTokens(DEFAULT_BRAND));
  const [activeSection, setActiveSection] = useState("dashboard");
  const [brandKey, setBrandKey] = useState("default");

  // Actualizar tokens cuando cambia la marca
  useEffect(() => { setT(makeTokens(activeBrand)); }, [activeBrand]);

  const handleBrandSave = useCallback((newBrand) => {
    setActiveBrand(newBrand);
  }, []);

  const nav = [
    { id:"dashboard",  label:"Dashboard",    icon:"◈" },
    { id:"projects",   label:"Proyectos",    icon:"▣" },
    { id:"simulations",label:"Simulaciones", icon:"⚡" },
    { id:"users",      label:"Usuarios",     icon:"◉" },
    { id:"brand",      label:"White Label",  icon:"◑" },
    { id:"licenses",   label:"Licencias",    icon:"★" },
    { id:"api",        label:"API Access",   icon:"{ }" },
  ];

  return (
    <div style={{display:"flex",height:"100vh",background:T.bg,overflow:"hidden"}}>
      <style>{makeCSS(T)}</style>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <div style={{width:210,flexShrink:0,background:T.surface,
        borderRight:`1px solid ${T.border}`,
        display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Logo */}
        <div style={{padding:"18px 16px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{
              width:34,height:34,borderRadius:8,
              background:T.primary,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:T.display,fontWeight:900,fontSize:15,
              color:T.bg==="f8fafc"?"#fff":"#000",flexShrink:0,
            }}>{activeBrand.logoText}</div>
            <div>
              <div style={{fontFamily:T.display,fontWeight:800,fontSize:14,color:T.primary,
                lineHeight:1.2}}>{activeBrand.name}</div>
              <div style={{fontSize:8,color:T.muted,marginTop:2}}>Portal Admin</div>
            </div>
          </div>
        </div>

        {/* Demo: selector de marca */}
        <div style={{padding:"10px 12px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{fontSize:8,color:T.muted,marginBottom:5}}>DEMO: CLIENTE</div>
          <select value={brandKey}
            onChange={e=>{
              setBrandKey(e.target.value);
              setActiveBrand(e.target.value==="default"
                ? DEFAULT_BRAND
                : CLIENT_BRANDS[e.target.value]||DEFAULT_BRAND);
            }}
            style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,
              borderRadius:5,padding:"5px 8px",color:T.text,fontSize:9,cursor:"pointer"}}>
            <option value="default">KrushRock (default)</option>
            <option value="aridos-pacifico">Áridos del Pacífico</option>
            <option value="minera-norte">Minera Norte Grande</option>
          </select>
        </div>

        {/* Nav */}
        <nav style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
          {nav.map(item=>(
            <button key={item.id} onClick={()=>setActiveSection(item.id)} style={{
              width:"100%",padding:"10px 16px",
              background:activeSection===item.id?T.primary+"22":"none",
              border:"none",
              borderLeft:`3px solid ${activeSection===item.id?T.primary:"transparent"}`,
              color:activeSection===item.id?T.primary:T.muted,
              textAlign:"left",fontSize:11,cursor:"pointer",
              display:"flex",alignItems:"center",gap:10,
              fontFamily:T.mono,transition:"all .15s",
            }}>
              <span style={{fontSize:14,opacity:0.8}}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div style={{padding:"12px 16px",borderTop:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Avatar initials="AD" color={T.primary} size={26}/>
            <div>
              <div style={{fontSize:9,color:T.text}}>Admin Demo</div>
              <div style={{fontSize:8,color:T.muted}}>admin@krushrock.app</div>
            </div>
          </div>
          {activeBrand.showPoweredBy && (
            <div style={{marginTop:10,fontSize:8,color:T.muted,textAlign:"center"}}>
              Powered by <span style={{color:T.primary}}>KrushRock</span>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,
          padding:"12px 20px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <div>
            <div style={{fontFamily:T.display,fontWeight:700,fontSize:16,color:T.text}}>
              {nav.find(n=>n.id===activeSection)?.label}
            </div>
            <div style={{fontSize:9,color:T.muted}}>{activeBrand.tagline}</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:9,color:T.muted}}>{activeBrand.domain}</span>
            <div style={{
              padding:"4px 10px",borderRadius:4,
              background:T.primary+"22",color:T.primary,
              fontSize:9,fontWeight:600,
            }}>Enterprise</div>
          </div>
        </div>

        {/* Contenido */}
        <div style={{flex:1,overflowY:"auto",padding:20}}>
          {activeSection==="dashboard"   && <DashboardSection brand={activeBrand} T={T}/>}
          {activeSection==="projects"    && <ProjectsSection T={T}/>}
          {activeSection==="simulations" && <SimulationsSection T={T}/>}
          {activeSection==="users"       && <UsersSection T={T}/>}
          {activeSection==="brand"       && <BrandConfigurator brand={activeBrand} onSave={handleBrandSave} T={T}/>}
          {activeSection==="licenses"    && <LicensesSection T={T}/>}
          {activeSection==="api"         && <APISection T={T}/>}
        </div>
      </div>
    </div>
  );
}
