import { useState } from "react";
import { G, GCSS, API_BASE, setAuthToken } from "../shared.js";

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const inp = {
    background: G.card, color: G.text, border: `1px solid ${G.border}`,
    borderRadius: 8, padding: "10px 14px", fontFamily: G.font, fontSize: 14,
    outline: "none", width: "100%",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Ingresa tu correo y contraseña."); return; }
    setLoading(true); setError(null);
    try {
      // OAuth2PasswordRequestForm requiere application/x-www-form-urlencoded
      const body = new URLSearchParams({ username: email, password });
      const resp = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.detail || "Credenciales incorrectas.");
      }
      const data = await resp.json();
      setAuthToken(data.access_token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: G.font }}>
      <style>{GCSS}</style>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontFamily: G.fontD, fontSize: 38, fontWeight: 800,
          color: G.accent, letterSpacing: "-0.02em", lineHeight: 1 }}>KrushRock</div>
        <div style={{ color: G.muted, fontSize: 13, marginTop: 6 }}>
          Simulador de plantas de chancado
        </div>
      </div>
      <form onSubmit={handleSubmit}
        style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 16,
          padding: 32, width: "100%", maxWidth: 380, display: "flex",
          flexDirection: "column", gap: 18 }}>
        <div style={{ fontFamily: G.fontD, fontSize: 18, fontWeight: 700, color: G.text }}>
          Iniciar sesión
        </div>
        <div>
          <label style={{ fontSize: 12, color: G.muted, display: "block", marginBottom: 6 }}>
            Correo electrónico
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="tu@empresa.com" style={inp} autoFocus />
        </div>
        <div>
          <label style={{ fontSize: 12, color: G.muted, display: "block", marginBottom: 6 }}>
            Contraseña
          </label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" style={inp} />
        </div>
        {error && (
          <div style={{ color: G.red, fontSize: 12, background: "#1a0a0a",
            border: `1px solid ${G.red}`, borderRadius: 6, padding: "8px 12px" }}>
            {error}
          </div>
        )}
        <button type="submit" disabled={loading}
          style={{ padding: "12px 20px", background: loading ? G.border : G.accent,
            color: loading ? G.muted : "#000", border: "none", borderRadius: 8,
            fontFamily: G.fontD, fontSize: 15, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Iniciando sesión…" : "Entrar →"}
        </button>
        <div style={{ fontSize: 11, color: G.muted, textAlign: "center", lineHeight: 1.6 }}>
          Acceso por invitación. Si no tienes cuenta,
          contacta al administrador del sistema.
        </div>
      </form>
    </div>
  );
}
