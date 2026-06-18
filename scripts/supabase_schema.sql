-- ============================================================
-- KrushRock — Schema Supabase (PostgreSQL)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── EXTENSIONES ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USUARIOS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             TEXT UNIQUE NOT NULL,
    password_hash     TEXT NOT NULL,
    full_name         TEXT NOT NULL,
    company           TEXT,
    plan              TEXT NOT NULL DEFAULT 'free'
                      CHECK (plan IN ('free','pro','enterprise')),
    sim_count_month   INT NOT NULL DEFAULT 0,
    sim_count_total   INT NOT NULL DEFAULT 0,
    sim_reset_date    DATE DEFAULT CURRENT_DATE,
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── PROYECTOS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    description  TEXT,
    client_name  TEXT,
    location     TEXT,
    rock_type    TEXT,
    tags         TEXT[] DEFAULT '{}',
    status       TEXT DEFAULT 'draft'
                 CHECK (status IN ('draft','active','archived')),
    sim_count    INT DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- ── SIMULACIONES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS simulations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id          UUID REFERENCES projects(id) ON DELETE SET NULL,
    name                TEXT NOT NULL DEFAULT 'Simulación',
    -- Parámetros de entrada
    tph                 NUMERIC NOT NULL,
    f80                 NUMERIC NOT NULL,
    p80_target          NUMERIC NOT NULL,
    rock_type           TEXT NOT NULL,
    humidity            INT DEFAULT 0,
    circuit_type        TEXT DEFAULT 'closed',
    hours_per_year      INT DEFAULT 6000,
    -- Datos completos (JSON)
    nodes_json          JSONB NOT NULL DEFAULT '[]',
    result_json         JSONB NOT NULL DEFAULT '{}',
    -- KPIs indexados para búsqueda rápida
    eff_score           NUMERIC,
    final_p80           NUMERIC,
    circ_load           NUMERIC,
    opex_total_usd_t    NUMERIC,
    -- Análisis IA
    ai_analysis         TEXT,
    -- Metadata
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sims_user       ON simulations(user_id);
CREATE INDEX idx_sims_project    ON simulations(project_id);
CREATE INDEX idx_sims_eff_score  ON simulations(eff_score DESC);
CREATE INDEX idx_sims_created    ON simulations(created_at DESC);

-- ── COMPARACIONES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comparisons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
    name            TEXT DEFAULT 'Comparación',
    sim_a_id        UUID REFERENCES simulations(id) ON DELETE SET NULL,
    sim_b_id        UUID REFERENCES simulations(id) ON DELETE SET NULL,
    winner_technical TEXT CHECK (winner_technical IN ('A','B','tie')),
    winner_opex      TEXT CHECK (winner_opex IN ('A','B','tie')),
    delta_opex_usd_t NUMERIC,
    ai_analysis      TEXT,
    result_json      JSONB DEFAULT '{}',
    created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_comp_user ON comparisons(user_id);

-- ── REPORTES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    simulation_id  UUID REFERENCES simulations(id) ON DELETE SET NULL,
    project_name   TEXT,
    pdf_path       TEXT,
    generated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── FEEDBACK DE USUARIOS (para entrenamiento IA) ──────────────
CREATE TABLE IF NOT EXISTS sim_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id   UUID REFERENCES simulations(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    rating          INT CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    actual_p80      NUMERIC,     -- P80 real medido en terreno
    actual_tph      NUMERIC,     -- TPH real en terreno
    actual_cc       NUMERIC,     -- Carga circulante real
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── LICENCIAS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS licenses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan            TEXT NOT NULL,
    starts_at       TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    stripe_sub_id   TEXT,        -- Stripe subscription ID
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── FUNCIÓN: reset mensual contador simulaciones ──────────────
CREATE OR REPLACE FUNCTION reset_monthly_sim_counts()
RETURNS void AS $$
BEGIN
    UPDATE users
    SET sim_count_month = 0,
        sim_reset_date  = CURRENT_DATE
    WHERE sim_reset_date < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Opcional: cron job mensual (requiere pg_cron en Supabase)
-- SELECT cron.schedule('reset-sim-counts', '0 0 1 * *', 'SELECT reset_monthly_sim_counts()');

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
-- Habilitar RLS (cada usuario solo ve sus datos)
ALTER TABLE projects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports     ENABLE ROW LEVEL SECURITY;

-- Políticas (el backend usa service_role key y las bypasea,
-- pero el cliente directo desde el browser las respeta)
CREATE POLICY "users_own_projects"    ON projects    FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_simulations" ON simulations FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_comparisons" ON comparisons FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_reports"     ON reports     FOR ALL USING (user_id = auth.uid());

-- ── DATOS DEMO (opcional) ─────────────────────────────────────
-- Insertar usuario demo para pruebas:
-- INSERT INTO users (email, password_hash, full_name, company, plan)
-- VALUES ('demo@krushrock.app', '$2b$...', 'Demo User', 'KrushRock Demo', 'pro');

-- ============================================================
-- FIN DEL SCHEMA
-- ============================================================
