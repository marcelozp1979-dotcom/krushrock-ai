import { G } from "../shared.js";

export function Badge({ color, children }) {
  const c = {
    amber: { bg: "#78350f", tx: "#fcd34d", bd: "#92400e" },
    green: { bg: "#064e3b", tx: "#6ee7b7", bd: "#065f46" },
    red: { bg: "#7f1d1d", tx: "#fca5a5", bd: "#991b1b" },
    blue: { bg: "#1e3a5f", tx: "#93c5fd", bd: "#1d4ed8" },
    gray: { bg: "#1f2937", tx: "#9ca3af", bd: "#374151" },
  }[color] || { bg: "#1f2937", tx: "#9ca3af", bd: "#374151" };
  return (
    <span
      style={{
        background: c.bg,
        color: c.tx,
        border: `1px solid ${c.bd}`,
        padding: "2px 10px",
        borderRadius: 4,
        fontSize: 11,
        fontFamily: G.font,
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function Kpi({ label, value, unit, sub, color, icon }) {
  return (
    <div
      style={{
        background: G.card,
        border: `1px solid ${G.border}`,
        borderRadius: 8,
        padding: "14px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 3,
          height: "100%",
          background: color || G.accent,
        }}
      />
      <div
        style={{
          fontSize: 10,
          color: G.muted,
          letterSpacing: "0.08em",
          marginBottom: 4,
        }}
      >
        {icon} {label}
      </div>
      <div
        style={{
          fontSize: 25,
          fontFamily: G.fontD,
          fontWeight: 700,
          color: color || G.accent,
          lineHeight: 1,
        }}
      >
        {value}
        <span style={{ fontSize: 12, color: G.muted, marginLeft: 4 }}>
          {unit}
        </span>
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: G.muted, marginTop: 3 }}>{sub}</div>
      )}
    </div>
  );
}

export function SectionTitle({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        color: G.accent,
        letterSpacing: "0.1em",
        marginBottom: 11,
        fontFamily: G.font,
        borderLeft: `3px solid ${G.accent}`,
        paddingLeft: 8,
      }}
    >
      ◈ {children}
    </div>
  );
}

export function B({ t }) {
  const html = String(t).replace(
    /\*\*(.*?)\*\*/g,
    `<strong style="color:${G.accent}">$1</strong>`,
  );
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Info({ text }) {
  return (
    <span
      title={text}
      style={{ marginLeft: 4, cursor: "help", color: G.muted, fontSize: "0.85em", userSelect: "none" }}
    >
      ⓘ
    </span>
  );
}
