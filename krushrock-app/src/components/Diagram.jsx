import { G, unitLabel, fromMm } from "../shared.js";

export default function Diagram({ r, unit }) {
  const {
    circActual,
    primary: pr,
    secondary: sc,
    tertiary: te,
    screening: sr,
    final: fi,
    inp,
    needsT,
  } = r;
  const W = needsT ? 820 : 690;
  const ns = { rx: 6, fill: G.card, stroke: G.border, strokeWidth: 1.5 };
  const ts = {
    fill: G.text,
    fontSize: 10,
    fontFamily: G.font,
    textAnchor: "middle",
  };
  const ss = {
    fill: G.muted,
    fontSize: 8.5,
    fontFamily: G.font,
    textAnchor: "middle",
  };
  const fl = {
    stroke: G.accent,
    strokeWidth: 1.5,
    fill: "none",
    strokeDasharray: "5 3",
  };
  const sl = { stroke: G.accent, strokeWidth: 1.5, fill: "none" };
  const u = unit || "mm",
    ul = unitLabel(u);
  const sz = (mm) => fromMm(Number(mm), u) + ul;
  const cn =
    {
      abierto: "CIRCUITO ABIERTO",
      cerrado: "CIRCUITO CERRADO",
      cerrado_doble: "DOBLE DECK",
      con_scalper: "CON SCALPER",
      ai: "RECOMENDADO IA",
    }[circActual] || "CIRCUITO";
  const xF = 8,
    xJ = 115,
    xC = 245,
    xC2 = needsT ? 375 : null,
    xS = needsT ? 505 : 375,
    xPr = xS + 95;

  return (
    <div
      style={{
        background: G.surface,
        border: `1px solid ${G.border}`,
        borderRadius: 8,
        padding: 16,
        overflowX: "auto",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: G.muted,
          marginBottom: 12,
          letterSpacing: "0.08em",
        }}
      >
        ◈ DIAGRAMA — {cn}
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${W} 290`}
        style={{ minWidth: Math.min(W, 440) }}
      >
        <defs>
          <marker
            id="ar"
            markerWidth="7"
            markerHeight="7"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L7,3z" fill={G.accent} />
          </marker>
          <marker
            id="ag"
            markerWidth="7"
            markerHeight="7"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L7,3z" fill={G.green} />
          </marker>
        </defs>
        <rect x={xF} y={108} width={90} height={52} {...ns} stroke={G.green} />
        <text x={xF + 45} y={126} {...ts} fill={G.green}>
          ALIMENT.
        </text>
        <text x={xF + 45} y={138} {...ss}>
          F80 {sz(inp.f80)}
        </text>
        <text x={xF + 45} y={149} {...ss}>
          {inp.tph} tph
        </text>
        <line
          x1={xF + 90}
          y1={134}
          x2={xJ}
          y2={134}
          {...fl}
          className="flow"
          markerEnd="url(#ar)"
        />
        <rect x={xJ} y={96} width={95} height={75} {...ns} stroke={G.accent} />
        <text x={xJ + 47} y={114} {...ts} fill={G.accent}>
          MANDÍBULA
        </text>
        <text x={xJ + 47} y={126} {...ss}>
          CSS {sz(pr.css)}
        </text>
        <text x={xJ + 47} y={137} {...ss}>
          P80: {sz(pr.p80)}
        </text>
        <text x={xJ + 47} y={148} {...ss}>
          ⚡{pr.energy} kWh/t
        </text>
        <line
          x1={xJ + 95}
          y1={134}
          x2={xC}
          y2={134}
          {...fl}
          className="flow"
          markerEnd="url(#ar)"
        />
        <rect x={xC} y={96} width={95} height={75} {...ns} stroke={G.purple} />
        <text x={xC + 47} y={114} {...ts} fill={G.purple}>
          CONO
        </text>
        <text x={xC + 47} y={126} {...ss}>
          CSS {sz(sc.css)}
        </text>
        <text x={xC + 47} y={137} {...ss}>
          P80: {sz(sc.p80)}
        </text>
        <text x={xC + 47} y={148} {...ss}>
          ⚡{sc.energy} kWh/t
        </text>
        {needsT ? (
          <>
            <line
              x1={xC + 95}
              y1={134}
              x2={xC2}
              y2={134}
              {...fl}
              className="flow"
              markerEnd="url(#ar)"
            />
            <rect
              x={xC2}
              y={96}
              width={95}
              height={75}
              {...ns}
              stroke={G.cyan}
            />
            <text x={xC2 + 47} y={114} {...ts} fill={G.cyan}>
              CONO / VSI
            </text>
            <text x={xC2 + 47} y={126} {...ss}>
              CSS {sz(te.css)}
            </text>
            <text x={xC2 + 47} y={137} {...ss}>
              P80: {sz(te.p80)}
            </text>
            <text x={xC2 + 47} y={148} {...ss}>
              ⚡{te.energy} kWh/t
            </text>
            <line
              x1={xC2 + 95}
              y1={134}
              x2={xS}
              y2={134}
              {...fl}
              className="flow"
              markerEnd="url(#ar)"
            />
          </>
        ) : (
          <line
            x1={xC + 95}
            y1={134}
            x2={xS}
            y2={134}
            {...fl}
            className="flow"
            markerEnd="url(#ar)"
          />
        )}
        <rect x={xS} y={96} width={95} height={75} {...ns} stroke={G.green} />
        <text x={xS + 47} y={114} {...ts} fill={G.green}>
          SELECT.
        </text>
        <text x={xS + 47} y={125} {...ss}>
          {circActual === "cerrado_doble" ? "Doble deck" : "Simple"}
        </text>
        <text x={xS + 47} y={136} {...ss}>
          Efic. {sr.eff}%
        </text>
        <text x={xS + 47} y={147} {...ss}>
          CC: {sr.ccLoad}%
        </text>
        <line
          x1={xS + 95}
          y1={120}
          x2={xPr}
          y2={120}
          {...sl}
          markerEnd="url(#ag)"
        />
        <rect x={xPr} y={108} width={14} height={26} fill={G.green} rx={3} />
        <text x={xPr + 7} y={146} {...ss} fill={G.green}>
          P80
        </text>
        <text x={xPr + 7} y={156} {...ss} fill={G.green}>
          {sz(fi.p80)}
        </text>
        {circActual !== "abierto" &&
          (() => {
            const xT = needsT ? xC2 + 47 : xC + 47;
            return (
              <>
                <line x1={xS + 47} y1={171} x2={xS + 47} y2={232} {...sl} />
                <line x1={xS + 47} y1={232} x2={xT} y2={232} {...sl} />
                <line
                  x1={xT}
                  y1={232}
                  x2={xT}
                  y2={171}
                  {...sl}
                  markerEnd="url(#ar)"
                />
                <text x={(xS + 47 + xT) / 2} y={248} {...ss} fill={G.muted}>
                  ↺ retorno {sr.over} tph
                </text>
              </>
            );
          })()}
      </svg>
      <div
        style={{
          fontSize: 10,
          color: G.muted,
          marginTop: 10,
          padding: "8px 12px",
          background: G.faint,
          borderRadius: 6,
          borderLeft: `3px solid ${G.border}`,
        }}
      >
        Nota técnica: P80 del producto es mayor que el CSS porque el CSS es la
        apertura mínima del equipo, pero el producto tiene distribución de
        tamaños. Para mandíbulas P80 ≈ CSS × 1.75 y para conos P80 ≈ CSS × 1.60
        — esto es correcto y esperado.
      </div>
    </div>
  );
}
