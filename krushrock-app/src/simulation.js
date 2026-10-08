import { ROCK_DB } from "./catalogo.js";
import { API_BASE, G } from "./shared.js";

export async function runSimulation(inp) {
  // Catálogo de equipos: siempre viene del componente (cargado desde el backend)
  const EQ = inp.eqCatalog || {};

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

  // ── Helpers de selección y capacidad de equipos ───────────────────────────

  // Estima % pasante de la alimentación a un tamaño dado.
  // Usa curvePoints si están disponibles; si no, modelo log-lineal con f80/f50.
  const estimatePassingPct = (sizeMm) => {
    const pts = (curvePoints || [])
      .filter((p) => p.sizeMm > 0 && p.pct !== undefined && p.pct !== null)
      .sort((a, b) => a.sizeMm - b.sizeMm);
    if (pts.length >= 2) {
      if (sizeMm <= pts[0].sizeMm) return pts[0].pct;
      if (sizeMm >= pts[pts.length - 1].sizeMm) return pts[pts.length - 1].pct;
      const i = pts.findIndex((p) => p.sizeMm >= sizeMm);
      const lo = pts[i - 1], hi = pts[i];
      const t = (Math.log(sizeMm) - Math.log(lo.sizeMm)) /
                (Math.log(hi.sizeMm) - Math.log(lo.sizeMm));
      return lo.pct + t * (hi.pct - lo.pct);
    }
    const x2 = Math.log(f80), y2 = 80;
    const x1 = f50 > 0 ? Math.log(f50) : Math.log(f80 * 0.3);
    const y1 = f50 > 0 ? 50 : 20;
    const slope = (y2 - y1) / (x2 - x1);
    return Math.max(0, Math.min(100, y2 + slope * (Math.log(Math.max(0.1, sizeMm)) - x2)));
  };

  // Para modo auto: intenta N unidades del equipo de mayor capacidad (N=2..4).
  const tryParallel = (srcList) => {
    if (!srcList.length) return null;
    const best = srcList.reduce((m, e) => (e.capR?.[1] || 0) > (m.capR?.[1] || 0) ? e : m, srcList[0]);
    const maxCap = best.capR?.[1] || 0;
    if (!maxCap) return null;
    for (let n = 2; n <= 4; n++) {
      if (maxCap * n >= tph) return { n, eq: best };
    }
    return { n: null, eq: best }; // incluso 4× no alcanza
  };

  // Capacidad del equipo seleccionado manualmente para un tipo dado.
  const getManualCap = (type) => {
    if (circPath === "manual") {
      let eq = null;
      if (type === "jaw")    eq = jawEq;
      if (type === "cone")   eq = coneEq;
      if (type === "screen") {
        const sm = manualEq?.screen3d || manualEq?.screen2d || manualEq?.screen1d || manualEq?.screen_hf;
        eq = sm ? EQ.screen.find((e) => e.model === sm) ?? null : null;
      }
      if (type === "hsi") {
        const hm = manualEq?.hsi;
        eq = hm ? EQ.hsi.find((e) => e.model === hm) ?? null : null;
      }
      return eq?.capR?.[1] || null;
    }
    if (circPath === "available") {
      const avail = inp.availEquip || [];
      const item = avail.find((e) => {
        if (type === "jaw")    return e.type === "jaw";
        if (type === "cone")   return e.type === "cone" || e.type === "hsi";
        if (type === "screen") return e.type?.startsWith("screen");
        if (type === "hsi")    return e.type === "hsi";
        return false;
      });
      if (!item) return null;
      const pool = item.type?.startsWith("screen") ? EQ.screen : (EQ[item.type] || []);
      return pool.find((e) => e.model === item.model)?.capR?.[1] || null;
    }
    return null;
  };

  // Construye el objeto de info de capacidad para una categoría.
  // aberturaMm: tamaño de corte conocido para estimar contaminación (null si no disponible aún).
  const buildCapInfo = (type, fitList, srcList, aberturaMm) => {
    const isManual = circPath === "manual" || circPath === "available";
    if (isManual) {
      const maxCap = getManualCap(type);
      if (!maxCap || tph <= maxCap) return { status: "ok" };
      const overloadPct = Math.round((tph - maxCap) / maxCap * 100);
      let contamPct = null;
      if (aberturaMm > 0) {
        const nearCutFrac = Math.max(0, estimatePassingPct(aberturaMm * 1.2) - estimatePassingPct(aberturaMm * 0.8)) / 100;
        const overloadFrac = Math.min(1, (tph - maxCap) / tph);
        contamPct = Math.round(Math.min(50, nearCutFrac * overloadFrac * 100));
      }
      return { status: "manual_sobre", maxCap, overloadPct, contamPct, aberturaMm };
    }
    // Modo automático
    if (fitList.length > 0) return { status: "ok" };
    if (!srcList.length)   return { status: "sin_catalogo" };
    const par = tryParallel(srcList);
    if (!par) return { status: "sin_catalogo" };
    if (par.n !== null) return { status: "paralelo", n: par.n, eq: par.eq };
    return { status: "excedido", maxCap: par.eq?.capR?.[1] || 0 };
  };

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
    capacidadInfo: {
      jaw:    buildCapInfo("jaw",    jawFit,    EQ.jaw,    roughJawCss),
      cone:   buildCapInfo("cone",   coneFit,   EQ.cone,   null),
      screen: buildCapInfo("screen", screenFit, screenSrc, meshMm),
      hsi:    buildCapInfo("hsi",    hsiFit,    EQ.hsi,    null),
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
    scoreVal     = apiResult.product_fit_pct ?? null;

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
      productFitPct: scoreVal !== null ? Number(scoreVal).toFixed(1) : null,
    },
    products: products_display,
    bottlenecks: bottlenecks_display,
    apiResult,
  };
}
