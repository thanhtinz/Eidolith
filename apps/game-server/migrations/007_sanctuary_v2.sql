-- 007_sanctuary_v2.sql — Sanctuary redesign v2, phase 1 (docs/SANCTUARY-REDESIGN-v2.md):
-- building levels (Part 2 §27.1, Part 6 §13 upgrade endpoint) and the
-- Research Data currency (Part 1 §10.1) produced by the Research Lab.
CREATE TABLE IF NOT EXISTS sanctuary.buildings (
  player_id   uuid NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  building_id text NOT NULL,
  level       int  NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, building_id)
);

INSERT INTO economy.currency_types (id, name, is_premium, is_tradeable) VALUES
  ('research_data', 'Research Data', false, false)
ON CONFLICT (id) DO NOTHING;

-- Backfill: every existing profile gets a Research Data wallet row.
INSERT INTO economy.player_wallets (player_id, currency_id, balance)
SELECT p.id, 'research_data', 0 FROM players.player_profiles p
ON CONFLICT (player_id, currency_id) DO NOTHING;
