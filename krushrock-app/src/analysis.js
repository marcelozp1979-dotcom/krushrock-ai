export function buildAnalysis(r) {
  const cc = Number(r.screening.ccLoad);
  const p80f = Number(r.final.p80),
    gap = (Math.abs(p80f - r.p80T) / Math.max(r.p80T, 1)) * 100;
  const humN =
    r.inp.humidity === null || r.inp.humidity === "unknown"
      ? 0
      : Number(r.inp.humidity);
  const altM = r.altM;

  const diag =
    cc <= 20 && gap <= 10
      ? "Circuito con rendimiento **óptimo**. Carga circulante dentro del rango recomendado y P80 ajustado al objetivo."
      : cc <= 30 && gap <= 20
        ? "Circuito **funcional**. Hay margen de optimización en CSS y configuración de clasificación."
        : "Circuito con **limitaciones técnicas**. Se requieren ajustes antes de seleccionar equipos definitivos.";

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
        : gap <= 10
          ? "Configuración técnicamente adecuada para los requerimientos indicados."
          : "Revisar CSS de etapas para acercarse al P80 objetivo.";

  return { diag, obs: obs.slice(0, 4), recs: recs.slice(0, 3), variant };
}
