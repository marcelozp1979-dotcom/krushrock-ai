-- KrushRock — Catálogo de equipos de chancado y zarandeo
-- Ejecutar una vez en el SQL Editor de Supabase (https://app.supabase.com)

CREATE TABLE IF NOT EXISTS equipment (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  brand       TEXT        NOT NULL,
  model       TEXT        NOT NULL,
  type        TEXT        NOT NULL,   -- jaw | cone | hsi | screen | screen_1d | screen_hf
  css_min_mm  FLOAT,                  -- NULL para harneros (no tienen CSS)
  css_max_mm  FLOAT,
  cap_min_tph FLOAT       NOT NULL,
  cap_max_tph FLOAT       NOT NULL,
  feed_max_mm FLOAT,
  decks       INT,                    -- número de pisos (solo harneros)
  extra_specs JSONB       DEFAULT '{}',  -- palanca, rpm y otros por tipo
  notes       TEXT        DEFAULT '',
  is_active   BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (brand, model)
);

-- Índices para las consultas más comunes
CREATE INDEX IF NOT EXISTS idx_equipment_type     ON equipment (type);
CREATE INDEX IF NOT EXISTS idx_equipment_is_active ON equipment (is_active);
