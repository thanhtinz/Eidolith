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
  return { hp: Math.round(base.hp * m), atk: Math.round(base.atk * m), def: Math.round(base.def * m), spd: Math.round(base.spd * m) };
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
export const creatureById = (id: string) => CREATURES.find(c => c.id === id);

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
  }
  if (CREATURES.length !== 20) problems.push(`roster must be 20, got ${CREATURES.length}`);
  return problems;
}
export function contentChecksum(): string {
  return fnv1a(JSON.stringify({ v: CONTENT_VERSION, creatures: CREATURES, elements: ELEMENTS, reactions: REACTIONS })).toString(16);
}
export * from "./maps.js";
