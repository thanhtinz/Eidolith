-- 009_evolution.sql — Evolution (Awakened stage), approved EVOLUTION-DRAFT-v1
-- (Tín approved all 4 points 2026-11-12). The instance keeps its row (level,
-- XP, bond preserved) and repoints creature_id to the evolved template
-- (DDD Part 5 §17.2 transaction model); this log is the audit trail.
CREATE TABLE IF NOT EXISTS progression.evolution_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id        uuid NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  instance_id      uuid NOT NULL,
  from_creature_id text NOT NULL,
  to_creature_id   text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS evolution_log_player_idx ON progression.evolution_log (player_id);
