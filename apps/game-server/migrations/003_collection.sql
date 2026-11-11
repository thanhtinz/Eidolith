-- Phase 3 Collection — DDD Part 5 §3.2 (creature_instances), §6.1/§6.2
-- (items, inventory), summoning pity + idempotency (Part 9 §8).
CREATE SCHEMA IF NOT EXISTS creatures;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS summoning;

CREATE TABLE IF NOT EXISTS creatures.creature_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  creature_id VARCHAR(64) NOT NULL,
  nickname VARCHAR(32),
  level INTEGER NOT NULL DEFAULT 1,
  experience BIGINT NOT NULL DEFAULT 0,
  evolution_stage SMALLINT NOT NULL DEFAULT 0,
  bond_level SMALLINT NOT NULL DEFAULT 0,
  acquired_method VARCHAR(32) NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_instances_player ON creatures.creature_instances (player_id, acquired_at);

CREATE TABLE IF NOT EXISTS creatures.creature_shards (
  player_id UUID NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  creature_id VARCHAR(64) NOT NULL,
  shards INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, creature_id)
);

CREATE TABLE IF NOT EXISTS inventory.items (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(32) NOT NULL,
  rarity VARCHAR(20) NOT NULL DEFAULT 'common',
  description TEXT NOT NULL DEFAULT '',
  stack_limit INTEGER NOT NULL DEFAULT 999,
  is_tradeable BOOLEAN NOT NULL DEFAULT false,
  is_consumable BOOLEAN NOT NULL DEFAULT true,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO inventory.items (id, name, category, rarity, description, properties) VALUES
  ('basic_capture_orb', 'Capture Orb Cơ Bản', 'capture', 'common', 'Quả cầu bắt Eidolon thông thường.', '{"captureMultiplier":1.0}'::jsonb),
  ('advanced_capture_orb', 'Capture Orb Cao Cấp', 'capture', 'rare', 'Tăng 50% hiệu quả bắt.', '{"captureMultiplier":1.5}'::jsonb)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS inventory.player_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  item_id VARCHAR(64) NOT NULL REFERENCES inventory.items(id),
  quantity BIGINT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, item_id)
);

CREATE TABLE IF NOT EXISTS summoning.player_pity (
  player_id UUID NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  banner_id VARCHAR(64) NOT NULL,
  pulls_total INTEGER NOT NULL DEFAULT 0,
  since_rare INTEGER NOT NULL DEFAULT 0,
  since_epic INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, banner_id)
);

CREATE TABLE IF NOT EXISTS summoning.pull_operations (
  idempotency_key VARCHAR(128) PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill: existing profiles receive the starter Capture Orbs.
INSERT INTO inventory.player_inventory (player_id, item_id, quantity)
SELECT p.id, 'basic_capture_orb', 5 FROM players.player_profiles p
ON CONFLICT (player_id, item_id) DO NOTHING;
