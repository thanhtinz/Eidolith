-- Phase 4 Combat: server-run battles + stored replays (Part 7 §17, Part 6).
CREATE SCHEMA IF NOT EXISTS combat;

CREATE TABLE IF NOT EXISTS combat.battles (
  battle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  mode VARCHAR(24) NOT NULL DEFAULT 'practice',
  seed BIGINT NOT NULL,
  player_team JSONB NOT NULL,
  enemy_team JSONB NOT NULL,
  events JSONB NOT NULL,
  winner SMALLINT NOT NULL,
  ticks INTEGER NOT NULL,
  result_hash VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS battles_player_created ON combat.battles (player_id, created_at DESC);
