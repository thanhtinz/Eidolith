// Phase 3 MVP balance configuration — docs/PHASE3-COLLECTION-v1.md.
// Part 9 fixes the framework (server-side rolls, disclosed rates, per-banner
// pity); the concrete numbers live here so balancing touches one file.
import type { Rarity } from "@eidolith/shared-types";

export const CAPTURE_BASE_RATE: Record<Rarity, number> = {
  Common: 0.70, Uncommon: 0.55, Rare: 0.35, Epic: 0.18, Legendary: 0.05,
};
export const CAPTURE_LEVEL_PENALTY = 0.01; // per level above 1
export const CAPTURE_RATE_CAP = 0.95;
export const FLEE_CHANCE_ON_FAIL = 0.25;
export const ENCOUNTER_TTL_MS = 5 * 60 * 1000;
export const ENCOUNTER_MAX_DISTANCE = 3; // tiles, Chebyshev (Part 6 §6)
export const WILD_ALIVE_TARGET = 4;
export const WILD_RESPAWN_MS = 20 * 1000;
export const STARTER_ORBS = 5;

export const BANNER_STANDARD = {
  id: "banner_standard",
  name: "Standard Resonance",
  nameVi: "Triệu hồi Chuẩn",
  costSingle: 30,
  costTen: 270,
  currency: "crystal" as const,
  rates: { Common: 0.55, Uncommon: 0.30, Rare: 0.11, Epic: 0.04 } as Partial<Record<Rarity, number>>,
  pityRareAt: 10, // 10th consecutive pull without Rare+ guarantees Rare+
  pityEpicAt: 80, // 80 pulls without Epic guarantees Epic
};
export const DUPLICATE_SHARDS = 10;
export const DUPLICATE_BOND_ESSENCE = 5;
