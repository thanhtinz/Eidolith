-- 006_sanctuary_sidequests.sql — Phase 5b: Sanctuary assignments with lazy
-- time accrual (Part 2 §27.2, Part 6 §13) and NPC side-quest progress
-- (Part 10 side quests; accepted at the NPC, progress counted from accept).
CREATE SCHEMA IF NOT EXISTS sanctuary;

CREATE TABLE IF NOT EXISTS sanctuary.assignments (
  player_id           uuid NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  building_id         text NOT NULL,
  creature_instance_id uuid NOT NULL UNIQUE REFERENCES creatures.creature_instances(id) ON DELETE CASCADE,
  assigned_at         timestamptz NOT NULL DEFAULT now(),
  -- Accrual cursor: whole units (bond points / XP) are consumed up to this
  -- instant on collect; the fractional remainder keeps accruing.
  accrued_from        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, building_id, creature_instance_id)
);

CREATE TABLE IF NOT EXISTS progression.side_progress (
  player_id  uuid NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  quest_key  text NOT NULL,
  progress   int  NOT NULL DEFAULT 0,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  PRIMARY KEY (player_id, quest_key)
);
