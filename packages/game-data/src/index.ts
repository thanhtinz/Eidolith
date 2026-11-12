// Game data — data-driven content (GDS Part 3 Content Bible). Adding content means
// adding data here, never code changes in gameplay systems (TDD Part 4 §9.1).
import type { ElementType, Rarity, CombatRole } from "@eidolith/shared-types";
import { fnv1a } from "@eidolith/math-utils";
export const CONTENT_VERSION = 1;

export interface ElementDef { id: string; element: ElementType; themeVi: string; mainEffect: string; }
export const ELEMENTS: ElementDef[] = [
  { id: "E01", element: "Flame", themeVi: "Lửa", mainEffect: "Burn" },
  { id: "E02", element: "Tide", themeVi: "Nước", mainEffect: "Wet" },
  { id: "E03", element: "Grove", themeVi: "Thực vật", mainEffect: "Regeneration" },
  { id: "E04", element: "Stone", themeVi: "Đất đá", mainEffect: "Defense" },
  { id: "E05", element: "Gale", themeVi: "Gió", mainEffect: "Knockback" },
  { id: "E06", element: "Frost", themeVi: "Băng", mainEffect: "Freeze" },
  { id: "E07", element: "Volt", themeVi: "Điện", mainEffect: "Shock" },
  { id: "E08", element: "Venom", themeVi: "Độc", mainEffect: "Poison" },
  { id: "E09", element: "Shade", themeVi: "Bóng tối", mainEffect: "Weakness" },
  { id: "E10", element: "Astral", themeVi: "Tinh tú", mainEffect: "Empowerment" },
];
export interface ReactionDef { a: ElementType; b: ElementType; name: string; effectVi: string; }
export const REACTIONS: ReactionDef[] = [
  { a: "Tide", b: "Volt", name: "Conductive Field", effectVi: "Điện lan trong vùng ướt" },
  { a: "Flame", b: "Grove", name: "Wildfire", effectVi: "Lửa lan trên vùng thực vật" },
  { a: "Flame", b: "Frost", name: "Thermal Burst", effectVi: "Sát thương và sương nhiệt" },
  { a: "Grove", b: "Venom", name: "Toxic Bloom", effectVi: "Tạo vùng độc" },
  { a: "Gale", b: "Flame", name: "Firestorm", effectVi: "Mở rộng vùng lửa" },
  { a: "Stone", b: "Volt", name: "Charged Ground", effectVi: "Điện tích mặt đất" },
  { a: "Frost", b: "Tide", name: "Frozen Surface", effectVi: "Đóng băng vùng nước" },
  { a: "Shade", b: "Astral", name: "Eclipse", effectVi: "Thay đổi hiệu ứng năng lượng" },
];
/** Combat Part 7 §13.1 — elemental damage multipliers (MVP). */
export const ELEMENT_MULTIPLIER = { advantage: 1.25, neutral: 1.0, disadvantage: 0.8 } as const;
/** MVP combat focus elements (Combat Part 7 §24). The other four ship with basic kits. */
export const MVP_ELEMENTS: ElementType[] = ["Flame", "Tide", "Grove", "Stone", "Gale", "Frost"];

export interface BaseStats { hp: number; atk: number; def: number; spd: number; }
// PROVISIONAL starting numbers (open point 5 in KE-HOACH-MVP): generated per role/rarity,
// pending Tín's approval and Phase 4 simulation tuning. NOT final balance.
const ROLE_STATS: Record<CombatRole, BaseStats> = {
  Guardian:   { hp: 150, atk: 18, def: 16, spd: 10 },
  Striker:    { hp: 105, atk: 27, def: 10, spd: 14 },
  Ranger:     { hp: 95,  atk: 25, def: 9,  spd: 15 },
  Support:    { hp: 100, atk: 19, def: 11, spd: 13 },
  Controller: { hp: 102, atk: 21, def: 11, spd: 12 },
  Specialist: { hp: 98,  atk: 24, def: 10, spd: 14 },
};
const RARITY_MULT: Record<Rarity, number> = { Common: 1.0, Uncommon: 1.06, Rare: 1.13, Epic: 1.21, Legendary: 1.3 };
export function provisionalBaseStats(role: CombatRole, rarity: Rarity): BaseStats {
  const base = ROLE_STATS[role], m = RARITY_MULT[rarity];
  // Phase 4 sim tuning: SPD is role identity (never rarity-scaled, it would
  // compound action rate); ATK/DEF take 60% of the rarity bonus, HP the full
  // bonus — a full all-stat multiplier made rarity decide fights by itself.
  const soft = 1 + (m - 1) * 0.6;
  return { hp: Math.round(base.hp * m), atk: Math.round(base.atk * soft), def: Math.round(base.def * soft), spd: base.spd };
}

export interface CreatureDef {
  id: string; name: string; element: ElementType; rarity: Rarity; role: CombatRole;
  habitat: string; descriptionVi: string; skillNames: [string, string, string];
  traitName: string; traitDescVi: string; evolutionBranches: string[];
  baseStats: BaseStats; growthCurveId: string; assetKey: string;
}
const GROWTH: Record<CombatRole, string> = {
  Guardian: "growth_guardian_standard", Striker: "growth_striker_standard", Ranger: "growth_ranger_standard",
  Support: "growth_support_standard", Controller: "growth_controller_standard", Specialist: "growth_specialist_standard",
};
function creature(c: Omit<CreatureDef, "baseStats" | "growthCurveId" | "assetKey">): CreatureDef {
  return { ...c, baseStats: provisionalBaseStats(c.role, c.rarity), growthCurveId: GROWTH[c.role], assetKey: `creature_${c.id.toLowerCase().replace("-", "_")}` };
}
export const CREATURES: CreatureDef[] = [
  creature({ id: "EID-001", name: "Emberling", element: "Flame", rarity: "Common", role: "Striker", habitat: "Ashen Meadow", descriptionVi: "Một sinh vật nhỏ có cơ thể giống kỳ giông, mang nguồn nhiệt bên trong lớp vảy.", skillNames: ["Ember Bite", "Flame Dash", "Fire Burst"], traitName: "Hot Blood", traitDescVi: "Tăng sức mạnh khi HP thấp.", evolutionBranches: ["Ignidrake", "Cinderguard", "Solarwing"] }),
  creature({ id: "EID-002", name: "Mossling", element: "Grove", rarity: "Common", role: "Support", habitat: "Whispering Forest", descriptionVi: "Sinh vật nhỏ được hình thành từ rêu và những hạt giống cổ đại.", skillNames: ["Seed Heal", "Vine Bind", "Forest Blessing"], traitName: "Natural Growth", traitDescVi: "Tăng hiệu quả hồi phục.", evolutionBranches: ["Thornwarden", "Verdant Sage"] }),
  creature({ id: "EID-003", name: "Aquafin", element: "Tide", rarity: "Common", role: "Ranger", habitat: "Crystal Lake", descriptionVi: "Sinh vật thủy sinh có vây phát sáng và khả năng phóng luồng nước áp lực cao.", skillNames: ["Water Shot", "Bubble Trap", "Tidal Wave"], traitName: "Fluid Body", traitDescVi: "Tăng khả năng né tránh.", evolutionBranches: ["Tideray", "Abyssfin"] }),
  creature({ id: "EID-004", name: "Pebblit", element: "Stone", rarity: "Common", role: "Guardian", habitat: "Meadow Village Outskirts", descriptionVi: "Sinh vật nhỏ có lớp giáp đá tự nhiên.", skillNames: ["Stone Punch", "Rock Shield", "Earthquake"], traitName: "Hard Shell", traitDescVi: "Giảm sát thương nhận vào.", evolutionBranches: ["Granitusk", "Titanolith"] }),
  creature({ id: "EID-005", name: "Zephy", element: "Gale", rarity: "Common", role: "Ranger", habitat: "Open Meadow", descriptionVi: "Sinh vật giống chim nhỏ có khả năng điều khiển những luồng gió.", skillNames: ["Wind Peck", "Air Blade", "Cyclone"], traitName: "Swift Wings", traitDescVi: "Tăng tốc độ hành động.", evolutionBranches: ["Zephyrion", "Stormcrest"] }),
  creature({ id: "EID-006", name: "Glowmoth", element: "Astral", rarity: "Uncommon", role: "Support", habitat: "Whispering Forest – Night", descriptionVi: "Sinh vật giống bướm đêm có đôi cánh chứa ánh sáng phát quang.", skillNames: ["Starlight", "Radiant Dust", "Celestial Veil"], traitName: "Luminous Aura", traitDescVi: "Hỗ trợ đồng đội.", evolutionBranches: ["Lumivane", "Astramoth"] }),
  creature({ id: "EID-007", name: "Thornbug", element: "Venom", rarity: "Uncommon", role: "Controller", habitat: "Ancient Grove", descriptionVi: "Sinh vật côn trùng có lớp giáp gai và khả năng tiết độc.", skillNames: ["Toxic Sting", "Thorn Trap", "Venom Burst"], traitName: "Toxic Armor", traitDescVi: "Gây độc khi bị tấn công cận chiến.", evolutionBranches: ["Thorncrawler", "Venomarch"] }),
  creature({ id: "EID-008", name: "Shadekit", element: "Shade", rarity: "Rare", role: "Striker", habitat: "Forgotten Ruins", descriptionVi: "Sinh vật nhỏ di chuyển trong bóng tối, có khả năng tạo bản sao ảo ảnh.", skillNames: ["Shadow Claw", "Dark Veil", "Phantom Strike"], traitName: "Shadow Step", traitDescVi: "Tăng khả năng né tránh.", evolutionBranches: ["Noctyra", "Umbrafang"] }),
  creature({ id: "EID-009", name: "Frostling", element: "Frost", rarity: "Uncommon", role: "Controller", habitat: "Frozen Cave", descriptionVi: "Sinh vật nhỏ mang lõi băng và có khả năng tạo tinh thể lạnh.", skillNames: ["Ice Shard", "Frost Bind", "Crystal Storm"], traitName: "Cold Core", traitDescVi: "Tăng hiệu quả khống chế.", evolutionBranches: ["Glacior", "Cryomantle"] }),
  creature({ id: "EID-010", name: "Voltik", element: "Volt", rarity: "Rare", role: "Specialist", habitat: "Thunder Ridge", descriptionVi: "Sinh vật có cơ thể chứa các tinh thể điện và di chuyển với tốc độ cao.", skillNames: ["Spark Shot", "Static Field", "Thunder Crash"], traitName: "Electric Charge", traitDescVi: "Tăng năng lượng Ultimate.", evolutionBranches: ["Voltusk", "Stormcore"] }),
  creature({ id: "EID-011", name: "Rootusk", element: "Grove", rarity: "Uncommon", role: "Guardian", habitat: "", descriptionVi: "", skillNames: ["Root Slam", "Bark Armor", "Nature Wall"], traitName: "", traitDescVi: "", evolutionBranches: ["Elderroot", "Worldbark"] }),
  creature({ id: "EID-012", name: "Cindermite", element: "Flame", rarity: "Common", role: "Specialist", habitat: "", descriptionVi: "", skillNames: ["Ember Roll", "Heat Wave", "Magma Burst"], traitName: "", traitDescVi: "", evolutionBranches: ["Magmabite", "Infermite"] }),
  creature({ id: "EID-013", name: "Shellune", element: "Tide", rarity: "Uncommon", role: "Guardian", habitat: "", descriptionVi: "", skillNames: ["Aqua Guard", "Shell Bash", "Ocean Barrier"], traitName: "", traitDescVi: "", evolutionBranches: ["Tidalisk", "Abysshell"] }),
  creature({ id: "EID-014", name: "Galesprite", element: "Gale", rarity: "Uncommon", role: "Support", habitat: "", descriptionVi: "", skillNames: ["Breeze Heal", "Wind Shield", "Sky Dance"], traitName: "", traitDescVi: "", evolutionBranches: ["Aerolume", "Tempestia"] }),
  creature({ id: "EID-015", name: "Crystalhorn", element: "Stone", rarity: "Rare", role: "Guardian", habitat: "", descriptionVi: "", skillNames: ["Crystal Charge", "Gem Armor", "Shatterquake"], traitName: "", traitDescVi: "", evolutionBranches: ["Crystagorn", "Obsidrake"] }),
  creature({ id: "EID-016", name: "Venomleaf", element: "Venom", rarity: "Rare", role: "Controller", habitat: "", descriptionVi: "", skillNames: ["Poison Seed", "Toxic Cloud", "Corrupt Bloom"], traitName: "", traitDescVi: "", evolutionBranches: ["Blightbloom", "Vilethorn"] }),
  creature({ id: "EID-017", name: "Duskowl", element: "Shade", rarity: "Rare", role: "Ranger", habitat: "", descriptionVi: "", skillNames: ["Night Arrow", "Fear Gaze", "Eclipse Dive"], traitName: "", traitDescVi: "", evolutionBranches: ["Nocturnis", "Darkwing"] }),
  creature({ id: "EID-018", name: "Starwhisp", element: "Astral", rarity: "Epic", role: "Support", habitat: "", descriptionVi: "", skillNames: ["Star Pulse", "Cosmic Shield", "Astral Harmony"], traitName: "", traitDescVi: "", evolutionBranches: ["Celestwhisp", "Nebulume"] }),
  creature({ id: "EID-019", name: "Glacibear", element: "Frost", rarity: "Epic", role: "Guardian", habitat: "", descriptionVi: "", skillNames: ["Ice Smash", "Frozen Roar", "Glacier Wall"], traitName: "", traitDescVi: "", evolutionBranches: ["Frostmaw", "Polar Titan"] }),
  creature({ id: "EID-020", name: "Tempestray", element: "Volt", rarity: "Epic", role: "Striker", habitat: "", descriptionVi: "", skillNames: ["Lightning Dash", "Thunder Claw", "Tempest Nova"], traitName: "", traitDescVi: "", evolutionBranches: ["Stormreaver", "Thunderlord"] }),
];
/** Boss defs (Part 3 §45) — deliberately OUTSIDE the collectible roster:
 *  the content validator locks CREATURES at 20, and bosses must never be
 *  captured, summoned, listed in the dex or rolled as random enemies.
 *  Stats are explicit (not the role×rarity formula): boss-tuned baselines,
 *  see docs/PHASE5B-SANCTUARY-BOSS-SIDEQUESTS-v1.md §2. */
export const BOSSES: CreatureDef[] = [
  { id: "EID-B01", name: "Ancient Treant", element: "Grove", rarity: "Legendary", role: "Guardian",
    habitat: "Ancient Grove", descriptionVi: "Cổ thụ nghìn năm trấn giữ Ancient Grove — Area Guardian của Verdant Plains.",
    skillNames: ["Root Slam", "Forest Barrier", "Ancient Roar"], traitName: "Ancient Core", traitDescVi: "",
    evolutionBranches: [], baseStats: { hp: 660, atk: 48, def: 22, spd: 9 },
    growthCurveId: "growth_guardian_standard", assetKey: "boss_eid_b01" },
];
export const creatureById = (id: string) => CREATURES.find(c => c.id === id) ?? BOSSES.find(c => c.id === id);

/** Content validation (TDD §9.3): unique ids, valid enums, 3 skills, >=2 evolution branches. */
export function validateGameData(): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const c of CREATURES) {
    if (ids.has(c.id)) problems.push(`duplicate creature id ${c.id}`);
    ids.add(c.id);
    if (!ELEMENTS.some(e => e.element === c.element)) problems.push(`${c.id}: bad element ${c.element}`);
    if (c.skillNames.length !== 3) problems.push(`${c.id}: needs exactly 3 skills`);
    if (c.evolutionBranches.length < 2) problems.push(`${c.id}: needs >=2 evolution branches`);
    if (c.baseStats.hp <= 0 || c.baseStats.atk <= 0) problems.push(`${c.id}: invalid base stats`);
    const sk = SKILLS[c.id];
    if (!sk || sk.length !== 3) problems.push(`${c.id}: needs exactly 3 skill definitions`);
    else {
      if (sk[2].energyCost !== 100) problems.push(`${c.id}: slot 3 must be the energy ultimate`);
      if (sk.some(x => x.name.length === 0)) problems.push(`${c.id}: skill name missing`);
    }
  }
  if (CREATURES.length !== 20) problems.push(`roster must be 20, got ${CREATURES.length}`);
  return problems;
}
export function contentChecksum(): string {
  return fnv1a(JSON.stringify({ v: CONTENT_VERSION, creatures: CREATURES, elements: ELEMENTS, reactions: REACTIONS })).toString(16);
}
export * from "./maps.js";

/** Wild encounter tables (Phase 3, docs/PHASE3-COLLECTION-v1.md). Weights are
 *  relative; levels are inclusive ranges rolled by the server per spawn. */
export interface EncounterEntry { creatureId: string; weight: number; minLevel: number; maxLevel: number; }
export const ENCOUNTER_TABLES: Record<string, EncounterEntry[]> = {
  ancient_grove: [
    { creatureId: "EID-011", weight: 40, minLevel: 8, maxLevel: 11 },
    { creatureId: "EID-004", weight: 30, minLevel: 8, maxLevel: 10 },
    { creatureId: "EID-006", weight: 30, minLevel: 8, maxLevel: 11 },
  ],
  whispering_forest: [
    { creatureId: "EID-002", weight: 40, minLevel: 2, maxLevel: 4 },
    { creatureId: "EID-005", weight: 20, minLevel: 2, maxLevel: 4 },
    { creatureId: "EID-006", weight: 15, minLevel: 3, maxLevel: 5 },
    { creatureId: "EID-004", weight: 15, minLevel: 2, maxLevel: 3 },
    { creatureId: "EID-011", weight: 10, minLevel: 3, maxLevel: 5 },
  ],
};

/* ------------------------------------------------------------------ */
/* Combat data (Phase 4, docs/PHASE4-COMBAT-v1.md)                    */

/** Part 7 §13.1: the advantage chart is explicit config, never derived from
 * element names. MVP wheel over the 6 focus elements; the other 4 elements
 * are neutral in MVP. BASELINE (PHASE4 §6.2) — pending Tín's balance review. */
export const ELEMENT_ADVANTAGE: Partial<Record<ElementType, ElementType>> = {
  Flame: "Grove", Grove: "Stone", Stone: "Frost", Frost: "Gale", Gale: "Tide", Tide: "Flame",
};
export function elementMultiplier(attacker: ElementType, defender: ElementType): number {
  if (ELEMENT_ADVANTAGE[attacker] === defender) return ELEMENT_MULTIPLIER.advantage;
  if (ELEMENT_ADVANTAGE[defender] === attacker) return ELEMENT_MULTIPLIER.disadvantage;
  return ELEMENT_MULTIPLIER.neutral;
}

export type StatusKind = "Burn" | "Poison" | "Wet" | "Freeze" | "Shock" | "Weakness" | "DefenseUp" | "Regeneration" | "Empowerment" | "Knockback";
/** Part 7 §13.2 / Part 3 element bible: each element's signature status. */
export const ELEMENT_STATUS: Record<ElementType, StatusKind> = {
  Flame: "Burn", Tide: "Wet", Grove: "Regeneration", Stone: "DefenseUp", Gale: "Knockback",
  Frost: "Freeze", Volt: "Shock", Venom: "Poison", Shade: "Weakness", Astral: "Empowerment",
};
/** Statuses applied to the enemy hit; the rest (Regeneration/DefenseUp/
 * Empowerment) are applied to the caster itself. */
export const HOSTILE_STATUSES: StatusKind[] = ["Burn", "Poison", "Wet", "Freeze", "Shock", "Weakness", "Knockback"];

export type SkillKind = "damage" | "heal" | "shield";
export interface SkillDefinition {
  id: string; creatureId: string; slot: 1 | 2 | 3; name: string;
  kind: SkillKind; multiplier: number; cooldownTicks: number;
  aoeRadius: number; // 0 = single target
  status: StatusKind | null; statusChance: number; // 0..1 before resistance
  shieldPct: number; // of caster MaxHP (shield kind / guardian kit)
  healPct: number; // of target MaxHP (heal kind)
  energyCost: number; // 100 for ultimates, else 0
}

/** Role kit templates — PHASE4-COMBAT-v1 §3 baseline (multipliers on ATK,
 * cooldowns already converted to ticks at 10 tps). */
const ROLE_KITS: Record<CombatRole, {
  s1: number; s1cd: number; s2: number; s2cd: number; ult: number; ultAoe: number;
}> = {
  Guardian:   { s1: 1.0, s1cd: 40, s2: 0,   s2cd: 120, ult: 1.6, ultAoe: 2.2 },
  Striker:    { s1: 1.1, s1cd: 40, s2: 1.4, s2cd: 90,  ult: 2.2, ultAoe: 0 },
  Ranger:     { s1: 1.0, s1cd: 40, s2: 1.25, s2cd: 80, ult: 1.7, ultAoe: 2.4 },
  Support:    { s1: 0.8, s1cd: 40, s2: 0,   s2cd: 100, ult: 0,   ultAoe: 0 },
  Controller: { s1: 0.9, s1cd: 40, s2: 1.1, s2cd: 100, ult: 1.4, ultAoe: 2.4 },
  Specialist: { s1: 1.0, s1cd: 40, s2: 1.3, s2cd: 90,  ult: 1.9, ultAoe: 0 },
};

function buildSkills(c: CreatureDef): SkillDefinition[] {
  const kit = ROLE_KITS[c.role];
  const st = ELEMENT_STATUS[c.element];
  const hostile = HOSTILE_STATUSES.includes(st);
  const base = { creatureId: c.id, aoeRadius: 0, status: null as StatusKind | null, statusChance: 0, shieldPct: 0, healPct: 0, energyCost: 0 };
  const s1: SkillDefinition = { ...base, id: `${c.id}-S1`, slot: 1, name: c.skillNames[0], kind: "damage", multiplier: kit.s1, cooldownTicks: kit.s1cd };
  let s2: SkillDefinition;
  if (c.role === "Guardian") {
    s2 = { ...base, id: `${c.id}-S2`, slot: 2, name: c.skillNames[1], kind: "shield", multiplier: 0, cooldownTicks: kit.s2cd, shieldPct: 0.16 };
  } else if (c.role === "Support") {
    s2 = { ...base, id: `${c.id}-S2`, slot: 2, name: c.skillNames[1], kind: "heal", multiplier: 0, cooldownTicks: kit.s2cd, healPct: 0.14 };
  } else {
    s2 = { ...base, id: `${c.id}-S2`, slot: 2, name: c.skillNames[1], kind: "damage", multiplier: kit.s2, cooldownTicks: kit.s2cd,
      status: hostile || st === "Regeneration" || st === "DefenseUp" || st === "Empowerment" ? st : null, statusChance: 0.6 };
  }
  let ult: SkillDefinition;
  if (c.role === "Support") {
    ult = { ...base, id: `${c.id}-S3`, slot: 3, name: c.skillNames[2], kind: "heal", multiplier: 0, cooldownTicks: 0, healPct: 0.25, energyCost: 100, aoeRadius: 99 };
  } else {
    ult = { ...base, id: `${c.id}-S3`, slot: 3, name: c.skillNames[2], kind: "damage", multiplier: kit.ult, cooldownTicks: 0, energyCost: 100, aoeRadius: kit.ultAoe,
      status: c.role === "Controller" ? st : null, statusChance: c.role === "Controller" ? 0.6 : 0 };
  }
  return [s1, s2, ult];
}
export const SKILLS: Record<string, SkillDefinition[]> = Object.fromEntries([...CREATURES, ...BOSSES].map(c => [c.id, buildSkills(c)]));
export const skillsOf = (creatureId: string): SkillDefinition[] => SKILLS[creatureId] ?? [];

/** Level scaling (PHASE4 baseline): +8% per level on hp/atk/def; spd flat so
 * action order stays readable. Full growth curves land in Phase 5. */
export function statsAtLevel(def: CreatureDef, level: number): BaseStats {
  const m = 1 + 0.08 * Math.max(0, level - 1);
  return { hp: Math.round(def.baseStats.hp * m), atk: Math.round(def.baseStats.atk * m), def: Math.round(def.baseStats.def * m), spd: def.baseStats.spd };
}
