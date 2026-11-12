-- 005_progression.sql — Phase 5 Progression: quest progress (Arc chain +
-- daily objectives) and the bond-points counter behind bond levels.
CREATE SCHEMA IF NOT EXISTS progression;

CREATE TABLE IF NOT EXISTS progression.arc_progress (
  player_id  uuid NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  quest_key  text NOT NULL,
  progress   int  NOT NULL DEFAULT 0,
  claimed_at timestamptz,
  PRIMARY KEY (player_id, quest_key)
);

CREATE TABLE IF NOT EXISTS progression.daily_progress (
  player_id  uuid NOT NULL REFERENCES players.player_profiles(id) ON DELETE CASCADE,
  day        date NOT NULL,
  quest_key  text NOT NULL,
  progress   int  NOT NULL DEFAULT 0,
  claimed_at timestamptz,
  PRIMARY KEY (player_id, day, quest_key)
);

ALTER TABLE creatures.creature_instances
  ADD COLUMN IF NOT EXISTS bond_points int NOT NULL DEFAULT 0;
