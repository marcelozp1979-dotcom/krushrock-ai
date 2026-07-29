import { useState } from "react";
import { CAT_LABELS } from "../catalogo.js";
import { G, GCSS, fromMm, unitLabel, toMm, API_BASE } from "../shared.js";
import { Badge, Kpi, SectionTitle, B, Info } from "./BaseComponents.jsx";
import Diagram from "./Diagram.jsx";
import { buildAnalysis, coneFactor, calcYieldsForCSS, computeCampaign, campaignUnoptTime } from "../engine.js";

// ── RESULTADOS ─────────────────────────────────────────────────────────────
export default function Results({ res, unit: initUnit, onReset, onSave, onEdit, eqCatalog = null }) {
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
  const EQ = eqCatalog || {};
  const analysis = buildAnalysis(res);
  const cc = Number(res.screening.ccLoad);
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

      {/* Indicadores de circuito */}
      <div
        style={{
          background: G.surface,
          borderBottom: `1px solid ${G.border}`,
          padding: "12px 20px",
        }}
      >
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 10 }}>
          {/* Carga circulante */}
          {(() => {
            const [ccLbl, ccClr] = cc <= 20
              ? ["Normal", G.green]
              : cc <= 30
                ? ["Elevada", G.accent]
                : ["Alta", G.red];
            return (
              <div style={{ minWidth: 130 }}>
                <div style={{ fontSize: 9, color: G.muted, letterSpacing: "0.1em", marginBottom: 2 }}>
                  CARGA CIRCULANTE
                </div>
                <div style={{ fontFamily: G.fontD, fontSize: 30, fontWeight: 700, color: ccClr, lineHeight: 1 }}>
                  {cc}%
                </div>
                <div style={{ fontSize: 10, color: ccClr, marginTop: 2 }}>{ccLbl}</div>
              </div>
            );
          })()}
          {/* Material aprovechado */}
          {res.final.productFitPct !== null && (() => {
            const pf = Number(res.final.productFitPct);
            const pfClr = pf >= 70 ? G.green : pf >= 50 ? G.accent : G.red;
            return (
              <div style={{ minWidth: 160 }}>
                <div style={{ fontSize: 9, color: G.muted, letterSpacing: "0.1em", marginBottom: 2 }}>
                  MATERIAL APROVECHADO
                </div>
                <div style={{ fontFamily: G.fontD, fontSize: 30, fontWeight: 700, color: pfClr, lineHeight: 1 }}>
                  {res.final.productFitPct}%
                </div>
                <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>del flujo final dentro de rangos</div>
              </div>
            );
          })()}
          {/* Cumplimiento P80 — solo si hay exactamente 1 producto activo */}
          {(res.inp.products || []).filter((p) => p.active).length === 1 && (() => {
            const p80f = Number(res.final.p80);
            const p80tgt = res.p80T;
            const gapPct = Math.abs(p80f - p80tgt) / Math.max(p80tgt, 1) * 100;
            const [p80Lbl, p80Clr] = gapPct <= 10
              ? ["Cumple", G.green]
              : gapPct <= 25
                ? ["Cercano al objetivo", G.accent]
                : ["Ajustar CSS", G.red];
            return (
              <div style={{ minWidth: 160 }}>
                <div style={{ fontSize: 9, color: G.muted, letterSpacing: "0.1em", marginBottom: 2 }}>
                  CUMPLIMIENTO P80
                </div>
                <div style={{ fontFamily: G.fontD, fontSize: 30, fontWeight: 700, color: p80Clr, lineHeight: 1 }}>
                  {p80f}mm
                </div>
                <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>objetivo: {p80tgt}mm · {p80Lbl}</div>
              </div>
            );
          })()}
        </div>
        <div style={{ fontSize: 12, color: G.muted }}>
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
            {/* Advertencias de capacidad — auto: paralelo/excedido; manual: sobrecarga */}
            {res.eqRec?.capacidadInfo && [
              { key: "jaw",    label: "mandíbula" },
              { key: "cone",   label: "cono" },
              { key: "screen", label: "seleccionadora" },
              { key: "hsi",    label: "HSI" },
            ].filter(({ key }) => {
              const ci = res.eqRec.capacidadInfo[key];
              return ci && ci.status !== "ok" && ci.status !== "sin_catalogo";
            }).map(({ key, label }) => {
              const ci = res.eqRec.capacidadInfo[key];
              const isError = ci.status === "excedido";
              let msg;
              if (ci.status === "paralelo") {
                msg = `⚠️ Se requieren ${ci.n}× ${ci.eq?.brand || ""} ${ci.eq?.model || ""} en paralelo para cubrir ${res.inp.tph} tph.`;
              } else if (ci.status === "excedido") {
                msg = `⚠️ Ningún ${label} de catálogo (ni en paralelo) cubre ${res.inp.tph} tph. Máximo lograble con un equipo: ${ci.maxCap} tph. Reduce el tonelaje de alimentación o agrega equipos adicionales.`;
              } else if (ci.status === "manual_sobre") {
                const contamLine = ci.contamPct !== null
                  ? ` Estimado: hasta ~${ci.contamPct}% del producto podría venir contaminado con material bajo el corte (estimación aproximada).`
                  : "";
                msg = `⚠️ Con tu equipo, el máximo sostenible es ${ci.maxCap} tph. Estás alimentando ${res.inp.tph} tph (${ci.overloadPct}% sobre su capacidad) — parte del material cercano a ${ci.aberturaMm ? ci.aberturaMm + "mm" : "la abertura de corte"} no va a alcanzar a pasar y va a contaminar tu producto.${contamLine}`;
              }
              return (
                <div
                  key={key}
                  style={{
                    background: isError ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                    border: `1px solid ${isError ? G.red : G.accent}`,
                    borderRadius: 8,
                    padding: "12px 14px",
                    fontSize: 12,
                    color: isError ? G.red : G.accent,
                    lineHeight: 1.6,
                  }}
                >
                  {msg}
                </div>
              );
            })}
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
