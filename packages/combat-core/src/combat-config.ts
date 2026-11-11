/* Combat balance baseline — Phase 4 (docs/PHASE4-COMBAT-v1.md §4–§5).
 * Part 7 locks the formulas and structure but gives few concrete numbers;
 * everything tunable lives here so the 1,000-battle simulation can adjust
 * one file. Numbers marked BASELINE are Bé's, pending Tín's balance review. */
import type { CombatRole } from "@eidolith/shared-types";

export const COMBAT = {
  MAX_TICKS: 1200, // 120 s at 10 tps — Part 7 §2.1 target window is 90–120 s
  /* Anti-stall BASELINE (not in Part 7 — flagged for Tín's approval): after
   * 90 s, all damage ramps +2%/s so sustain mirrors resolve by wipe inside
   * the §2.1 window instead of dragging to the timeout tiebreak. */
  FATIGUE_START_TICKS: 900,
  FATIGUE_PCT_PER_SEC: 0.02,
  ARENA_W: 16,
  ARENA_H: 10,
  RETARGET_EVERY: 4, // ticks (Part 7 §8.5: re-score every 3–5 ticks)
  MOVE_EMIT_EVERY: 3,

  /* Ranges in arena units. Melee roles close in; ranged roles keep distance. */
  ROLE_RANGE: { Guardian: 1.4, Striker: 1.4, Specialist: 1.6, Controller: 3.2, Ranger: 4.2, Support: 4.0 } as Record<CombatRole, number>,
  SUPPORT_ACTION_RANGE: 5.5, // heal / shield reach
  MOVE_PER_SPD: 0.02, // units per tick per SPD point (BASELINE)
  SEPARATION_DIST: 1.0,
  SEPARATION_PUSH: 0.05,

  /* Basic attack (Part 7 §10.1): one hit every BASE × 15/SPD ticks. */
  BASIC_BASE_TICKS: 13,
  HP_SCALE: 7.5, // global HP multiplier so fights land in the §2.1 window (BASELINE, sim-tuned)
  RANDOM_MIN: 0.9, // §12.3 RandomFactor (BASELINE 0.90–1.10)
  RANDOM_MAX: 1.1,
  CRIT_CHANCE: 0.10, // BASELINE
  CRIT_MULT: 1.5,

  /* Energy (Part 7 §11, amounts BASELINE). */
  ENERGY_MAX: 100,
  ENERGY_ON_BASIC: 10,
  ENERGY_ON_SKILL: 15,
  ENERGY_ON_HIT: 8,
  ENERGY_ON_REACTION: 12,

  /* Statuses (Part 7 §13–§14, magnitudes BASELINE). DoT/regen resolve once
   * per second: pct of the target's MaxHP per stack. */
  DOT_PER_SECOND: { Burn: 0.04, Poison: 0.03 } as Record<string, number>,
  REGEN_PER_SECOND: 0.02,
  MAX_DOT_STACKS: 3,
  STATUS_DURATION_TICKS: {
    Burn: 30, Poison: 30, Wet: 50, Freeze: 15, Shock: 20,
    Weakness: 40, DefenseUp: 50, Regeneration: 40, Empowerment: 50, Knockback: 0,
  } as Record<string, number>,
  SHOCK_SLOW: 0.7, // action & move speed multiplier while Shocked
  WEAKNESS_ATK_MULT: 0.8,
  EMPOWER_ATK_MULT: 1.2,
  DEFENSE_UP_DEF_MULT: 1.25,
  KNOCKBACK_DIST: 1.5,

  /* Reactions (Part 7 §15, magnitudes BASELINE): bonus = pct of the
   * triggering attacker's ATK; splash at half value inside the radius. */
  REACTION_DMG_PCT: 0.6,
  REACTION_SPLASH_PCT: 0.5,
  REACTION_RADIUS: 2.0,
  REACTION_CD_TICKS: 80,
};

/** Utility-AI target scoring weights (Part 7 §8.3) per AI profile.
 * Order: Threat, LowHP, Distance, RolePriority, Vulnerability. */
export const AI_PROFILES = {
  aggressive: { threat: 0.30, lowHp: 0.25, distance: 0.20, role: 0.15, vuln: 0.10 },
  assassin:   { threat: 0.10, lowHp: 0.40, distance: 0.10, role: 0.30, vuln: 0.10 },
  protect:    { threat: 0.40, lowHp: 0.05, distance: 0.25, role: 0.20, vuln: 0.10 },
  ranged:     { threat: 0.20, lowHp: 0.20, distance: 0.30, role: 0.20, vuln: 0.10 },
} as const;
export type AiProfile = keyof typeof AI_PROFILES;
export const ROLE_AI_PROFILE: Record<CombatRole, AiProfile> = {
  Guardian: "protect", Striker: "assassin", Ranger: "ranged",
  Support: "ranged", Controller: "ranged", Specialist: "aggressive",
};
/** §8.4 role priority when hunting (assassin hunts the backline first). */
export const ROLE_PRIORITY: Record<AiProfile, Record<CombatRole, number>> = {
  aggressive: { Guardian: 0.4, Striker: 0.6, Ranger: 0.7, Support: 0.8, Controller: 0.7, Specialist: 0.6 },
  assassin:   { Guardian: 0.1, Striker: 0.4, Ranger: 0.8, Support: 1.0, Controller: 0.6, Specialist: 0.5 },
  protect:    { Guardian: 0.5, Striker: 0.8, Ranger: 0.7, Support: 0.4, Controller: 0.6, Specialist: 0.8 },
  ranged:     { Guardian: 0.3, Striker: 0.6, Ranger: 0.7, Support: 0.9, Controller: 0.7, Specialist: 0.6 },
};
