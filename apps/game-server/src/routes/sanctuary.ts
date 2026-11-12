// Sanctuary (Part 2 §27, Part 6 §13) — redesign v2 phase 1
// (docs/SANCTUARY-REDESIGN-v2.md, approved by Tín 2026-11-11, layout A):
// building levels Lv.1–5 gated by the Sanctuary Hall, element/role synergy
// +20% (Part 1 §9.2), Research Lab producing Research Data, collect-all.
// Accrual stays lazy from timestamps and is collected in whole units (the
// fractional remainder keeps accruing). All numbers are Bé's MVP baselines.
import { Router } from "express";
import { ok, ApiError, Errors } from "../http.js";
import { requireAuth, type AuthedRequest } from "../middleware.js";
import { pool, query } from "../db.js";
import { addBondPoints, grantCreatureXp, grantCurrency } from "../progression.js";
import { creatureById } from "@eidolith/game-data";
import type { SanctuaryBuildingView, SanctuaryStateResponse } from "@eidolith/shared-types";

export const sanctuaryRouter = Router();
sanctuaryRouter.use(requireAuth);

async function profileIdOf(userId: string): Promise<string> {
  const { rows } = await query<{ id: string }>(`SELECT id FROM players.player_profiles WHERE user_id = $1`, [userId]);
  if (!rows.length) throw Errors.playerNotFound();
  return rows[0].id;
}
const err = (status: number, code: string, message: string) => new ApiError(status, code, message);

type Kind = "bond" | "xp" | "data" | "info" | "locked";
interface BuildingDef {
  id: string; nameVi: string; descVi: string; kind: Kind;
  /** Per level 1..5: assignment slots (0 = takes no assignments). */
  slotsByLevel: number[];
  /** Per level 1..5: whole units per minute per assigned creature. */
  perMinuteByLevel: number[];
  synergyElements: string[]; synergyRoles: string[];
  /** Gold cost to upgrade INTO level 2..5. */
  upgradeGold: number[];
}
const SYNERGY_BONUS = 1.2;
export const BUILDINGS: BuildingDef[] = [
  { id: "main_hall", nameVi: "Nhà chính", descVi: "Sanctuary Hall — cấp Nhà chính quyết định trần tích luỹ và cấp tối đa của mọi công trình.", kind: "info",
    slotsByLevel: [0, 0, 0, 0, 0], perMinuteByLevel: [0, 0, 0, 0, 0], synergyElements: [], synergyRoles: [], upgradeGold: [300, 600, 1200, 2400] },
  { id: "bond_garden", nameVi: "Vườn gắn kết", descVi: "Habitat — chăm sóc Eidolon, tăng Bond theo thời gian.", kind: "bond",
    slotsByLevel: [3, 3, 4, 4, 5], perMinuteByLevel: [1 / 10, 1 / 9, 1 / 8, 1 / 7, 1 / 6], synergyElements: ["Grove", "Tide"], synergyRoles: ["Support"], upgradeGold: [150, 400, 900, 1800] },
  { id: "training_ground", nameVi: "Sân tập", descVi: "Training Ground — rèn luyện nhận XP theo thời gian.", kind: "xp",
    slotsByLevel: [2, 3, 3, 4, 4], perMinuteByLevel: [2, 2, 3, 3, 4], synergyElements: ["Stone", "Gale"], synergyRoles: ["Striker", "Guardian"], upgradeGold: [150, 400, 900, 1800] },
  { id: "research_lab", nameVi: "Phòng nghiên cứu", descVi: "Research Lab — nghiên cứu sinh Research Data theo thời gian.", kind: "data",
    slotsByLevel: [2, 3, 3, 4, 4], perMinuteByLevel: [1 / 60, 1 / 60, 2 / 60, 2 / 60, 3 / 60], synergyElements: ["Astral", "Volt"], synergyRoles: ["Controller", "Specialist"], upgradeGold: [150, 400, 900, 1800] },
  { id: "evo_shrine", nameVi: "Đài tiến hoá", descVi: "Evolution Shrine — tiến hoá Eidolon bằng Evolution Core.", kind: "locked",
    slotsByLevel: [0, 0, 0, 0, 0], perMinuteByLevel: [0, 0, 0, 0, 0], synergyElements: [], synergyRoles: [], upgradeGold: [0, 0, 0, 0] },
];
const buildingById = new Map(BUILDINGS.map(b => [b.id, b]));
/** Accrual cap in minutes by Sanctuary Hall level (Lv.1..5). */
const CAP_MINUTES_BY_HALL = [480, 600, 600, 720, 720];
/** Research Data part of the upgrade cost into Lv.4 / Lv.5. */
const UPGRADE_DATA: Record<number, number> = { 4: 10, 5: 25 };
const MAX_LEVEL = 5;

async function buildingLevels(playerId: string): Promise<Map<string, number>> {
  const { rows } = await query<{ building_id: string; level: number }>(
    `SELECT building_id, level FROM sanctuary.buildings WHERE player_id = $1`, [playerId]);
  const map = new Map<string, number>();
  for (const def of BUILDINGS) map.set(def.id, 1);
  for (const r of rows) if (map.has(r.building_id)) map.set(r.building_id, Number(r.level));
  return map;
}
function synergyOf(def: BuildingDef, creatureId: string): boolean {
  const c = creatureById(creatureId);
  if (!c) return false;
  return def.synergyElements.includes(c.element) || def.synergyRoles.includes(c.role);
}
function effectiveRate(def: BuildingDef, level: number, creatureId: string): number {
  const base = def.perMinuteByLevel[level - 1];
  return synergyOf(def, creatureId) ? base * SYNERGY_BONUS : base;
}

interface AssignRow {
  building_id: string; creature_instance_id: string; creature_id: string; level: number;
  accrued_from: Date;
}
async function assignmentRows(playerId: string): Promise<AssignRow[]> {
  const { rows } = await query<AssignRow>(
    `SELECT a.building_id, a.creature_instance_id, c.creature_id, c.level, a.accrued_from
     FROM sanctuary.assignments a
     JOIN creatures.creature_instances c ON c.id = a.creature_instance_id
     WHERE a.player_id = $1 ORDER BY a.assigned_at`, [playerId]);
  return rows;
}
/** Whole units accrued by one assignment right now (capped by Hall level). */
function accruedOf(rate: number, row: AssignRow, capMinutes: number, now = Date.now()): number {
  if (rate <= 0) return 0;
  const minutes = Math.min((now - new Date(row.accrued_from).getTime()) / 60000, capMinutes);
  return Math.max(0, Math.floor(minutes * rate));
}
/** Deduct a currency inside the caller's tx (balance already verified).
 *  Direct UPDATE: grantCurrency's upsert proposes the negative row first
 *  and trips the balance>=0 check constraint before conflict resolution. */
async function spendCurrency(client: { query: (q: string, p: unknown[]) => Promise<{ rows: { balance: string }[] }> }, playerId: string, currency: string, amount: number, reason: string): Promise<void> {
  const { rows } = await client.query(
    `UPDATE economy.player_wallets SET balance = balance - $3, updated_at = now()
     WHERE player_id = $1 AND currency_id = $2 RETURNING balance`,
    [playerId, currency, amount]);
  if (!rows.length) throw err(422, "INSUFFICIENT_FUNDS", "Ví chưa có loại tiền này");
  await client.query(
    `INSERT INTO economy.currency_transactions (player_id, currency_id, amount, balance_after, reason) VALUES ($1,$2,$3,$4,$5)`,
    [playerId, currency, -amount, Number(rows[0].balance), reason]);
}
async function walletBalance(playerId: string, currency: string): Promise<number> {
  const { rows } = await query<{ balance: string }>(
    `SELECT balance FROM economy.player_wallets WHERE player_id = $1 AND currency_id = $2`, [playerId, currency]);
  return Number(rows[0]?.balance ?? 0);
}

sanctuaryRouter.get("/sanctuary", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    const levels = await buildingLevels(playerId);
    const hallLevel = levels.get("main_hall") ?? 1;
    const capMinutes = CAP_MINUTES_BY_HALL[hallLevel - 1];
    const rows = await assignmentRows(playerId);
    const totals = { bond: 0, xp: 0, data: 0 };
    const buildings: SanctuaryBuildingView[] = BUILDINGS.map(def => {
      const level = levels.get(def.id) ?? 1;
      const mine = rows.filter(r => r.building_id === def.id);
      const assignments = mine.map(r => {
        const rate = effectiveRate(def, level, r.creature_id);
        const accrued = accruedOf(rate, r, capMinutes);
        if (def.kind === "bond") totals.bond += accrued;
        else if (def.kind === "xp") totals.xp += accrued;
        else if (def.kind === "data") totals.data += accrued;
        const capUnits = Math.max(1, Math.floor(capMinutes * rate));
        const elapsedMin = Math.min((Date.now() - new Date(r.accrued_from).getTime()) / 60000, capMinutes);
        const nextUnitInSec = accrued >= capUnits ? 0 : Math.max(0, Math.ceil(((accrued + 1) / rate - elapsedMin) * 60));
        return {
          instanceId: r.creature_instance_id, creatureId: r.creature_id, level: Number(r.level), accrued,
          progress01: rate > 0 ? Math.min(1, accrued / capUnits) : 0,
          nextUnitInSec, capInSec: Math.max(0, Math.round((capMinutes - elapsedMin) * 60)),
          synergy: synergyOf(def, r.creature_id),
        };
      });
      let upgrade: SanctuaryBuildingView["upgrade"] = null;
      if (def.kind !== "locked" && level < MAX_LEVEL) {
        const toLevel = level + 1;
        upgrade = {
          toLevel, gold: def.upgradeGold[toLevel - 2], data: UPGRADE_DATA[toLevel] ?? 0,
          blockedByHall: def.id !== "main_hall" && toLevel > hallLevel,
        };
      }
      return {
        id: def.id, nameVi: def.nameVi, descVi: def.descVi, level, kind: def.kind,
        slots: def.slotsByLevel[level - 1], perMinute: def.perMinuteByLevel[level - 1],
        synergyElements: def.synergyElements, synergyRoles: def.synergyRoles,
        upgrade, assignments,
      };
    });
    const payload: SanctuaryStateResponse = {
      buildings, hallLevel, capHours: capMinutes / 60, totals,
      researchData: await walletBalance(playerId, "research_data"),
    };
    ok(req, res, payload);
  } catch (e) { next(e); }
});

sanctuaryRouter.post("/sanctuary/assign", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    const { buildingId, creatureInstanceId } = req.body as { buildingId?: string; creatureInstanceId?: string };
    const def = buildingId ? buildingById.get(buildingId) : undefined;
    const levels = await buildingLevels(playerId);
    const level = def ? (levels.get(def.id) ?? 1) : 1;
    if (!def || def.slotsByLevel[level - 1] === 0) throw err(422, "SANCTUARY_BUILDING_INVALID", "Công trình này không nhận phân công");
    if (!creatureInstanceId) throw err(422, "SANCTUARY_INVALID", "Thiếu Eidolon cần phân công");
    const { rows: owned } = await query<{ id: string }>(
      `SELECT id FROM creatures.creature_instances WHERE id = $1 AND player_id = $2`, [creatureInstanceId, playerId]);
    if (!owned.length) throw err(404, "CREATURE_NOT_FOUND", "Eidolon không tồn tại hoặc không thuộc về bạn");
    const { rows: existing } = await query<{ building_id: string }>(
      `SELECT building_id FROM sanctuary.assignments WHERE creature_instance_id = $1`, [creatureInstanceId]);
    if (existing.length) throw err(422, "SANCTUARY_ALREADY_ASSIGNED", "Eidolon này đã được phân công rồi");
    const { rows: inBuilding } = await query<{ n: string }>(
      `SELECT COUNT(*) AS n FROM sanctuary.assignments WHERE player_id = $1 AND building_id = $2`, [playerId, def.id]);
    if (Number(inBuilding[0].n) >= def.slotsByLevel[level - 1]) throw err(422, "SANCTUARY_FULL", "Công trình đã đủ chỗ");
    await query(
      `INSERT INTO sanctuary.assignments (player_id, building_id, creature_instance_id) VALUES ($1, $2, $3)`,
      [playerId, def.id, creatureInstanceId]);
    ok(req, res, { assigned: true });
  } catch (e) { next(e); }
});

sanctuaryRouter.post("/sanctuary/unassign", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    const { creatureInstanceId } = req.body as { creatureInstanceId?: string };
    if (!creatureInstanceId) throw err(422, "SANCTUARY_INVALID", "Thiếu Eidolon cần rút về");
    const { rows } = await query<{ building_id: string }>(
      `DELETE FROM sanctuary.assignments WHERE player_id = $1 AND creature_instance_id = $2 RETURNING building_id`,
      [playerId, creatureInstanceId]);
    if (!rows.length) throw err(404, "SANCTUARY_NOT_ASSIGNED", "Eidolon này chưa được phân công");
    ok(req, res, { unassigned: true });
  } catch (e) { next(e); }
});

/** Collect whole accrued units for the given buildings inside one tx. */
async function collectBuildings(playerId: string, defs: BuildingDef[]) {
  const levels = await buildingLevels(playerId);
  const capMinutes = CAP_MINUTES_BY_HALL[(levels.get("main_hall") ?? 1) - 1];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<AssignRow>(
      `SELECT a.building_id, a.creature_instance_id, c.creature_id, c.level, a.accrued_from
       FROM sanctuary.assignments a
       JOIN creatures.creature_instances c ON c.id = a.creature_instance_id
       WHERE a.player_id = $1 AND a.building_id = ANY($2) FOR UPDATE OF a`,
      [playerId, defs.map(d => d.id)]);
    const gains: { buildingId: string; instanceId: string; creatureId: string; kind: string; amount: number }[] = [];
    for (const row of rows) {
      const def = buildingById.get(row.building_id)!;
      const level = levels.get(def.id) ?? 1;
      const rate = effectiveRate(def, level, row.creature_id);
      const amount = accruedOf(rate, row, capMinutes);
      if (amount <= 0) continue;
      if (def.kind === "bond") await addBondPoints(client, playerId, row.creature_instance_id, amount);
      else if (def.kind === "xp") await grantCreatureXp(client, playerId, row.creature_instance_id, amount);
      else if (def.kind === "data") await grantCurrency(client, playerId, "research_data", amount, "sanctuary_research");
      else continue;
      // Consume exactly the whole units; the fractional rest keeps accruing.
      const consumedMs = (amount / rate) * 60000;
      await client.query(
        `UPDATE sanctuary.assignments SET accrued_from = accrued_from + ($1 * interval '1 millisecond') WHERE creature_instance_id = $2`,
        [Math.round(consumedMs), row.creature_instance_id]);
      gains.push({ buildingId: def.id, instanceId: row.creature_instance_id, creatureId: row.creature_id, kind: def.kind, amount });
    }
    await client.query("COMMIT");
    return gains;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally { client.release(); }
}

sanctuaryRouter.post("/sanctuary/collect", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    const { buildingId } = req.body as { buildingId?: string };
    const def = buildingId ? buildingById.get(buildingId) : undefined;
    if (!def || def.kind === "info" || def.kind === "locked") throw err(422, "SANCTUARY_BUILDING_INVALID", "Công trình này không có gì để thu hoạch");
    const gains = await collectBuildings(playerId, [def]);
    ok(req, res, { gains });
  } catch (e) { next(e); }
});

sanctuaryRouter.post("/sanctuary/collect-all", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    const gains = await collectBuildings(playerId, BUILDINGS.filter(d => d.kind === "bond" || d.kind === "xp" || d.kind === "data"));
    const totals = { bond: 0, xp: 0, data: 0 };
    for (const g of gains) {
      if (g.kind === "bond") totals.bond += g.amount;
      else if (g.kind === "xp") totals.xp += g.amount;
      else if (g.kind === "data") totals.data += g.amount;
    }
    ok(req, res, { gains, totals });
  } catch (e) { next(e); }
});

sanctuaryRouter.post("/sanctuary/buildings/:id/upgrade", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    const def = buildingById.get(req.params.id);
    if (!def || def.kind === "locked") throw err(422, "SANCTUARY_BUILDING_INVALID", "Công trình này chưa nâng cấp được");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: lvlRows } = await client.query<{ building_id: string; level: number }>(
        `SELECT building_id, level FROM sanctuary.buildings WHERE player_id = $1 FOR UPDATE`, [playerId]);
      const levelOf = (id: string) => Number(lvlRows.find(r => r.building_id === id)?.level ?? 1);
      const level = levelOf(def.id);
      if (level >= MAX_LEVEL) throw err(422, "SANCTUARY_MAX_LEVEL", "Công trình đã đạt cấp tối đa");
      const toLevel = level + 1;
      const hallLevel = levelOf("main_hall");
      if (def.id !== "main_hall" && toLevel > hallLevel)
        throw err(422, "SANCTUARY_HALL_GATE", `Cần nâng Nhà chính lên Lv.${toLevel} trước`);
      const goldCost = def.upgradeGold[toLevel - 2];
      const dataCost = UPGRADE_DATA[toLevel] ?? 0;
      const { rows: wRows } = await client.query<{ currency_id: string; balance: string }>(
        `SELECT currency_id, balance FROM economy.player_wallets WHERE player_id = $1 AND currency_id = ANY($2) FOR UPDATE`,
        [playerId, ["gold", "research_data"]]);
      const bal = (id: string) => Number(wRows.find(r => r.currency_id === id)?.balance ?? 0);
      if (bal("gold") < goldCost) throw err(422, "INSUFFICIENT_GOLD", `Không đủ Gold (cần ${goldCost})`);
      if (bal("research_data") < dataCost) throw err(422, "INSUFFICIENT_DATA", `Không đủ Research Data (cần ${dataCost})`);
      if (goldCost > 0) await spendCurrency(client, playerId, "gold", goldCost, "sanctuary_upgrade");
      if (dataCost > 0) await spendCurrency(client, playerId, "research_data", dataCost, "sanctuary_upgrade");
      await client.query(
        `INSERT INTO sanctuary.buildings (player_id, building_id, level) VALUES ($1,$2,$3)
         ON CONFLICT (player_id, building_id) DO UPDATE SET level = $3, updated_at = now()`,
        [playerId, def.id, toLevel]);
      await client.query("COMMIT");
      ok(req, res, { buildingId: def.id, level: toLevel, gold: bal("gold") - goldCost, researchData: bal("research_data") - dataCost });
    } catch (e) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw e;
    } finally { client.release(); }
  } catch (e) { next(e); }
});
