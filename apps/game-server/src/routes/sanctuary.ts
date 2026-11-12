// Phase 5b Sanctuary (Part 2 §27.2, Part 6 §13): assign Eidolon to
// buildings; Bond/XP accrue lazily from timestamps and are collected in
// whole units (the fractional remainder keeps accruing). Rates are Bé's
// MVP baselines — docs/PHASE5B-SANCTUARY-BOSS-SIDEQUESTS-v1.md §1.
import { Router } from "express";
import { ok, ApiError, Errors } from "../http.js";
import { requireAuth, type AuthedRequest } from "../middleware.js";
import { pool, query } from "../db.js";
import { addBondPoints, grantCreatureXp } from "../progression.js";
import type { SanctuaryBuildingView, SanctuaryStateResponse } from "@eidolith/shared-types";

export const sanctuaryRouter = Router();
sanctuaryRouter.use(requireAuth);

async function profileIdOf(userId: string): Promise<string> {
  const { rows } = await query<{ id: string }>(`SELECT id FROM players.player_profiles WHERE user_id = $1`, [userId]);
  if (!rows.length) throw Errors.playerNotFound();
  return rows[0].id;
}
const err = (status: number, code: string, message: string) => new ApiError(status, code, message);

interface BuildingDef {
  id: string; nameVi: string; descVi: string; kind: "bond" | "xp" | "info" | "locked";
  slots: number; perMinute: number; // whole units per minute per assigned creature
}
export const BUILDINGS: BuildingDef[] = [
  { id: "main_hall", nameVi: "Nhà chính", descVi: "Trung tâm của Sanctuary — quản lý phân công và nâng cấp.", kind: "info", slots: 0, perMinute: 0 },
  { id: "bond_garden", nameVi: "Vườn gắn kết", descVi: "Eidolon ở đây tăng Bond theo thời gian (1 điểm / 10 phút).", kind: "bond", slots: 3, perMinute: 0.1 },
  { id: "training_ground", nameVi: "Sân tập", descVi: "Eidolon tập luyện tại đây nhận XP theo thời gian (2 XP / phút).", kind: "xp", slots: 2, perMinute: 2 },
  { id: "evo_shrine", nameVi: "Đài tiến hoá", descVi: "Dùng Evolution Core để tiến hoá Eidolon theo nhánh.", kind: "locked", slots: 0, perMinute: 0 },
];
const buildingById = new Map(BUILDINGS.map(b => [b.id, b]));
const ACCRUAL_CAP_MINUTES = 8 * 60;

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
/** Whole units accrued by one assignment right now (cap 8h). */
function accruedOf(def: BuildingDef, row: AssignRow, now = Date.now()): number {
  const minutes = Math.min((now - new Date(row.accrued_from).getTime()) / 60000, ACCRUAL_CAP_MINUTES);
  return Math.max(0, Math.floor(minutes * def.perMinute));
}

sanctuaryRouter.get("/sanctuary", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    const rows = await assignmentRows(playerId);
    const buildings: SanctuaryBuildingView[] = BUILDINGS.map(def => ({
      id: def.id, nameVi: def.nameVi, descVi: def.descVi, level: 1, kind: def.kind, slots: def.slots,
      assignments: rows.filter(r => r.building_id === def.id).map(r => ({
        instanceId: r.creature_instance_id, creatureId: r.creature_id, level: Number(r.level), accrued: accruedOf(def, r),
      })),
    }));
    const payload: SanctuaryStateResponse = { buildings };
    ok(req, res, payload);
  } catch (e) { next(e); }
});

sanctuaryRouter.post("/sanctuary/assign", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    const { buildingId, creatureInstanceId } = req.body as { buildingId?: string; creatureInstanceId?: string };
    const def = buildingId ? buildingById.get(buildingId) : undefined;
    if (!def || def.slots === 0) throw err(422, "SANCTUARY_BUILDING_INVALID", "Công trình này không nhận phân công");
    if (!creatureInstanceId) throw err(422, "SANCTUARY_INVALID", "Thiếu Eidolon cần phân công");
    const { rows: owned } = await query<{ id: string }>(
      `SELECT id FROM creatures.creature_instances WHERE id = $1 AND player_id = $2`, [creatureInstanceId, playerId]);
    if (!owned.length) throw err(404, "CREATURE_NOT_FOUND", "Eidolon không tồn tại hoặc không thuộc về bạn");
    const { rows: existing } = await query<{ building_id: string }>(
      `SELECT building_id FROM sanctuary.assignments WHERE creature_instance_id = $1`, [creatureInstanceId]);
    if (existing.length) throw err(422, "SANCTUARY_ALREADY_ASSIGNED", "Eidolon này đã được phân công rồi");
    const { rows: inBuilding } = await query<{ n: string }>(
      `SELECT COUNT(*) AS n FROM sanctuary.assignments WHERE player_id = $1 AND building_id = $2`, [playerId, def.id]);
    if (Number(inBuilding[0].n) >= def.slots) throw err(422, "SANCTUARY_FULL", "Công trình đã đủ chỗ");
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

sanctuaryRouter.post("/sanctuary/collect", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    const { buildingId } = req.body as { buildingId?: string };
    const def = buildingId ? buildingById.get(buildingId) : undefined;
    if (!def || def.slots === 0) throw err(422, "SANCTUARY_BUILDING_INVALID", "Công trình này không có gì để thu hoạch");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query<AssignRow>(
        `SELECT a.building_id, a.creature_instance_id, c.creature_id, c.level, a.accrued_from
         FROM sanctuary.assignments a
         JOIN creatures.creature_instances c ON c.id = a.creature_instance_id
         WHERE a.player_id = $1 AND a.building_id = $2 FOR UPDATE OF a`, [playerId, def.id]);
      const gains: { instanceId: string; creatureId: string; kind: string; amount: number }[] = [];
      for (const row of rows) {
        const amount = accruedOf(def, row);
        if (amount <= 0) continue;
        if (def.kind === "bond") await addBondPoints(client, playerId, row.creature_instance_id, amount);
        else await grantCreatureXp(client, playerId, row.creature_instance_id, amount);
        // Consume exactly the whole units; the fractional rest keeps accruing.
        const consumedMs = (amount / def.perMinute) * 60000;
        await client.query(
          `UPDATE sanctuary.assignments SET accrued_from = accrued_from + ($1 * interval '1 millisecond') WHERE creature_instance_id = $2`,
          [Math.round(consumedMs), row.creature_instance_id]);
        gains.push({ instanceId: row.creature_instance_id, creatureId: row.creature_id, kind: def.kind, amount });
      }
      await client.query("COMMIT");
      ok(req, res, { gains });
    } catch (e) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw e;
    } finally { client.release(); }
  } catch (e) { next(e); }
});
