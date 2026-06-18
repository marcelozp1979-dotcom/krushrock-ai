-- ============================================================
-- KrushRock — Migración 001
-- Alinea el schema con el motor actual (krushrock-ai.jsx)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── CLIENTES ─────────────────────────────────────────────────
-- Tabla dedicada de clientes (empresa + contacto)
-- Los proyectos quedan ligados al cliente, las sims al proyecto
CREATE TABLE IF NOT EXISTS clients (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,            -- nombre empresa o persona
    rut          TEXT,                     -- RUT empresa (Chile)
    contacto     TEXT,                     -- nombre contacto
    email        TEXT,
    telefono     TEXT,
    region       TEXT,
    notas        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_clients_user ON clients(user_id);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_clients" ON clients FOR ALL USING (user_id = auth.uid());

-- Agregar client_id a proyectos si no existe
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);

-- ── SIMULACIONES — nuevas columnas del motor actual ───────────
-- El motor ya no usa nodes_json ni p80_target.
-- Se agregan columnas sin borrar las antiguas (backward compatible).

-- Inputs del wizard actual
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS rock_key        TEXT;   -- key en ROCK_DB o "personalizada"
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS custom_rock_name TEXT;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS custom_wi       NUMERIC;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS custom_den      NUMERIC;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS custom_ab       NUMERIC;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS f80_mm          NUMERIC; -- feed P80 real
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS altitude_m      NUMERIC;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS altitude_omit   BOOLEAN DEFAULT FALSE;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS curve_type      TEXT     -- 'omit','f80only','partial','full'
    CHECK (curve_type IN ('omit','f80only','partial','full'));
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS curve_points    JSONB;   -- [{label,sizeMm,passPct}]
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS f50_mm          NUMERIC;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS circ_path       TEXT     -- 'ai','manual','available'
    CHECK (circ_path IN ('ai','manual','available'));
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS cone_perfil     TEXT     -- 'EF','F','M','C','EC'
    CHECK (cone_perfil IN ('EF','F','M','C','EC'));
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS plazo_meses     INT;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS tph_omit        BOOLEAN DEFAULT FALSE; -- si TPH fue derivado de metas
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS manual_eq       JSONB;  -- equipo manual seleccionado
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS avail_equip     JSONB;  -- equipos disponibles evaluados

-- Outputs del motor
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS err_pct         NUMERIC; -- error estimado en %
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS circ_actual     TEXT;    -- circuito real usado
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS needs_tertiary  BOOLEAN DEFAULT FALSE;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS recommended_decks INT;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS recommended_mesh JSONB;  -- {deck1,deck2,deck3}
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS primary_json    JSONB;   -- resultado chancador primario
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS secondary_json  JSONB;   -- resultado chancador secundario
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS tertiary_json   JSONB;   -- resultado cono terciario
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS screening_json  JSONB;   -- resultado seleccionadora
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS bottlenecks     JSONB;   -- array de alertas

-- Renombrar columna confusa (nodes_json era del modelo canvas drag-and-drop)
-- NOTA: no se elimina para no romper filas antiguas. Se agrega alias semántico.
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS inp_json JSONB; -- copia completa del objeto inp

-- ── PRODUCTOS POR SIMULACIÓN ──────────────────────────────────
-- Cada simulación produce N productos (fracciones granulométricas)
-- Esta tabla permite filtrar/analizar por fracción sin parsear JSON
CREATE TABLE IF NOT EXISTS simulation_products (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id  UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    product_label  TEXT,            -- ej: "Gravilla 3/4"
    min_mm         NUMERIC,
    max_mm         NUMERIC,
    target_ton     NUMERIC,         -- tonelaje objetivo ingresado
    tph_out        NUMERIC,         -- TPH real calculado para esta fracción
    yield_pct      NUMERIC,         -- rendimiento en %
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_simprod_sim ON simulation_products(simulation_id);

-- ── FUNCIÓN: updated_at automático ────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER trg_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── ÍNDICES ADICIONALES ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sims_rock_key  ON simulations(rock_key);
CREATE INDEX IF NOT EXISTS idx_sims_plazo     ON simulations(plazo_meses);
CREATE INDEX IF NOT EXISTS idx_sims_circ      ON simulations(circ_actual);

-- ============================================================
-- INSTRUCCIONES PARA EL BACKEND
-- ============================================================
-- 1. El endpoint POST /simulations/run debe guardar:
--    - inp_json: el objeto completo de inputs del motor
--    - rock_key, f80_mm, cone_perfil, circ_path, plazo_meses
--    - eff_score, final_p80, err_pct, circ_actual (KPIs indexados)
--    - primary_json, secondary_json, tertiary_json, screening_json
--    - recommended_decks, recommended_mesh
--    - bottlenecks (JSON array)
--    - Y luego INSERT en simulation_products por cada fracción activa
--
-- 2. Los campos antiguos (nodes_json, p80_target, hours_per_year)
--    quedan en la tabla para compatibilidad con registros previos.
--    Nuevas filas los dejan NULL.
-- ============================================================
