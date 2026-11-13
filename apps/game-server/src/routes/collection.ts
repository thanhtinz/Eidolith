// Phase 3 Collection — API Part 6 §5/§6/§7/§8 + Part 9 rules.
// All capture/summon rolls happen here on the server; the client never
// decides outcomes (Part 9 §7.5). Balance numbers: collection-config.ts.
import { Router } from "express";
import { creatureById, CREATURES } from "@eidolith/game-data";
import type { OwnedCreature, InventoryStack, SummonPullResponse, SummonResultItem, Rarity } from "@eidolith/shared-types";
import { pool, query } from "../db.js";
import { ApiError, Errors, ok } from "../http.js";
import { requireAuth, type AuthedRequest } from "../middleware.js";
import { findPlayerByUserId, getEncounter, getWild, removeWild, startEncounter, endEncounter } from "../world.js";
import { bumpObjectives } from "../progression.js";
import {
  CAPTURE_BASE_RATE, CAPTURE_LEVEL_PENALTY, CAPTURE_RATE_CAP, FLEE_CHANCE_ON_FAIL,
  ENCOUNTER_MAX_DISTANCE, BANNER_STANDARD, DUPLICATE_SHARDS, DUPLICATE_BOND_ESSENCE,
} from "../collection-config.js";

export const collectionRouter = Router();
collectionRouter.use(requireAuth);

async function profileIdOf(userId: string): Promise<string> {
  const { rows } = await query<{ id: string }>(`SELECT id FROM players.player_profiles WHERE user_id = $1`, [userId]);
  if (!rows.length) throw Errors.playerNotFound();
  return rows[0].id;
}
const err = (status: number, code: string, message: string) => new ApiError(status, code, message);

// ---- Collection (Part 6 §5.1) ----
collectionRouter.get("/creatures", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    const { rows } = await query<{ id: string; creature_id: string; level: number; experience: number; bond_level: number; acquired_method: string; acquired_at: string }>(
      `SELECT id, creature_id, level, experience, bond_level, acquired_method, acquired_at FROM creatures.creature_instances WHERE player_id = $1 ORDER BY acquired_at DESC LIMIT 200`, [playerId]);
    const items: OwnedCreature[] = rows.map(r => {
      const def = creatureById(r.creature_id);
      return {
        instanceId: r.id, creatureId: r.creature_id, name: def?.name ?? r.creature_id, level: Number(r.level),
        rarity: (def?.rarity ?? "Common") as Rarity, element: def?.element ?? "", role: def?.role ?? "",
        acquiredMethod: r.acquired_method, acquiredAt: r.acquired_at,
        experience: Number(r.experience), bondLevel: Number(r.bond_level),
      };
    });
    ok(req, res, { items, nextCursor: null, hasMore: false });
  } catch (e) { next(e); }
});

// ---- Inventory (Part 6 §8) ----
collectionRouter.get("/inventory", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    const { rows } = await query<{ item_id: string; name: string; category: string; rarity: string; description: string; quantity: string }>(
      `SELECT i.id AS item_id, i.name, i.category, i.rarity, i.description, pi.quantity
       FROM inventory.player_inventory pi JOIN inventory.items i ON i.id = pi.item_id
       WHERE pi.player_id = $1 AND pi.quantity > 0 ORDER BY i.category, i.name`, [playerId]);
    const items: InventoryStack[] = rows.map(r => ({
      itemId: r.item_id, name: r.name, category: r.category, rarity: r.rarity, description: r.description, quantity: Number(r.quantity),
    }));
    ok(req, res, { items });
  } catch (e) { next(e); }
});

// ---- Encounters (Part 6 §6) ----
collectionRouter.post("/encounters/start", async (req: AuthedRequest, res, next) => {
  try {
    const { spawnId } = req.body as { spawnId?: string };
    if (!spawnId) throw Errors.validation({ spawnId: "Thiếu spawnId" });
    const state = findPlayerByUserId(req.userId!);
    if (!state) throw err(409, "ENCOUNTER_NOT_IN_WORLD", "Bạn chưa vào thế giới");
    const wild = getWild(state.mapId, spawnId);
    if (!wild) throw err(404, "ENCOUNTER_INVALID", "Eidolon hoang dã không còn ở đó");
    const dist = Math.max(Math.abs(wild.x - state.x), Math.abs(wild.y - state.y));
    if (dist > ENCOUNTER_MAX_DISTANCE) throw err(422, "ENCOUNTER_TOO_FAR", "Hãy lại gần Eidolon hơn");
    const enc = startEncounter(state, wild);
    ok(req, res, {
      encounterId: enc.id,
      creature: { creatureId: enc.creatureId, level: enc.level },
      captureAvailable: true,
      expiresAt: new Date(enc.expiresAt).toISOString(),
    });
  } catch (e) { next(e); }
});

collectionRouter.post("/encounters/:id/capture", async (req: AuthedRequest, res, next) => {
  const client = await pool.connect();
  try {
    const playerId = await profileIdOf(req.userId!);
    const enc = getEncounter(req.params.id);
    if (!enc || enc.playerId !== playerId) throw err(404, "ENCOUNTER_INVALID", "Encounter không hợp lệ hoặc đã hết hạn");
    const wild = getWild(enc.mapId, enc.spawnId);
    if (!wild) { endEncounter(enc.id); throw err(410, "ENCOUNTER_EXPIRED", "Eidolon đã rời khỏi khu vực"); }
    const { captureItemId } = req.body as { captureItemId?: string };
    const itemId = captureItemId ?? "basic_capture_orb";
    const def = creatureById(enc.creatureId);
    if (!def) throw Errors.internal();

    await client.query("BEGIN");
    const inv = await client.query<{ quantity: string }>(
      `SELECT quantity FROM inventory.player_inventory WHERE player_id = $1 AND item_id = $2 FOR UPDATE`, [playerId, itemId]);
    if (!inv.rows.length || Number(inv.rows[0].quantity) <= 0) {
      await client.query("ROLLBACK");
      throw err(422, "ITEM_NOT_ENOUGH", "Không còn Capture Orb");
    }
    const item = await client.query<{ properties: { captureMultiplier?: number } }>(
      `SELECT properties FROM inventory.items WHERE id = $1`, [itemId]);
    const multiplier = Number(item.rows[0]?.properties?.captureMultiplier ?? 1);
    await client.query(
      `UPDATE inventory.player_inventory SET quantity = quantity - 1, updated_at = now() WHERE player_id = $1 AND item_id = $2`, [playerId, itemId]);

    const base = CAPTURE_BASE_RATE[def.rarity] ?? 0.5;
    const chance = Math.min(CAPTURE_RATE_CAP, base * (1 - CAPTURE_LEVEL_PENALTY * (enc.level - 1)) * multiplier);
    const captured = Math.random() < chance;
    let instanceId: string | null = null;
    let fled = false;
    if (captured) {
      await bumpObjectives(client, playerId, "captured", 1);
      const ins = await client.query<{ id: string }>(
        `INSERT INTO creatures.creature_instances (player_id, creature_id, level, acquired_method)
         VALUES ($1,$2,$3,'capture') RETURNING id`, [playerId, enc.creatureId, enc.level]);
      instanceId = ins.rows[0].id;
    } else {
      fled = Math.random() < FLEE_CHANCE_ON_FAIL;
    }
    await client.query("COMMIT");
    if (captured || fled) { removeWild(enc.mapId, enc.spawnId); endEncounter(enc.id); }
    const left = await query<{ quantity: string }>(
      `SELECT quantity FROM inventory.player_inventory WHERE player_id = $1 AND item_id = $2`, [playerId, itemId]);
    ok(req, res, {
      captured, fled, creatureInstanceId: instanceId, creatureId: enc.creatureId,
      orbsLeft: Number(left.rows[0]?.quantity ?? 0),
    });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    next(e);
  } finally { client.release(); }
});

// ---- Summoning (Part 6 §7) ----
collectionRouter.get("/summoning/banners", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    const { rows } = await query<{ since_rare: number; since_epic: number; pulls_total: number }>(
      `SELECT since_rare, since_epic, pulls_total FROM summoning.player_pity WHERE player_id = $1 AND banner_id = $2`, [playerId, BANNER_STANDARD.id]);
    const pity = rows[0] ?? { since_rare: 0, since_epic: 0, pulls_total: 0 };
    ok(req, res, {
      banners: [{
        id: BANNER_STANDARD.id, name: BANNER_STANDARD.name, nameVi: BANNER_STANDARD.nameVi,
        cost: { currency: BANNER_STANDARD.currency, amount: BANNER_STANDARD.costSingle },
        costTen: BANNER_STANDARD.costTen,
        pullCountOptions: [1, 10],
        rates: BANNER_STANDARD.rates,
        pity: { sinceRare: pity.since_rare, sinceEpic: pity.since_epic, guaranteeRareAt: BANNER_STANDARD.pityRareAt, guaranteeEpicAt: BANNER_STANDARD.pityEpicAt },
      }],
    });
  } catch (e) { next(e); }
});

const RARITY_ORDER: Rarity[] = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
function rollRarity(rng: () => number): Rarity {
  let r = rng();
  for (const rarity of RARITY_ORDER) {
    const rate = BANNER_STANDARD.rates[rarity] ?? 0;
    if (r < rate) return rarity;
    r -= rate;
  }
  return "Common";
}
const atLeast = (rarity: Rarity, floor: Rarity) => RARITY_ORDER.indexOf(rarity) >= RARITY_ORDER.indexOf(floor);

collectionRouter.post("/summoning/pull", async (req: AuthedRequest, res, next) => {
  const client = await pool.connect();
  try {
    const playerId = await profileIdOf(req.userId!);
    const { bannerId, pullCount } = req.body as { bannerId?: string; pullCount?: number };
    if (bannerId !== BANNER_STANDARD.id) throw err(404, "SUMMON_BANNER_NOT_FOUND", "Banner không tồn tại");
    const count = pullCount === 10 ? 10 : 1;
    const cost = count === 10 ? BANNER_STANDARD.costTen : BANNER_STANDARD.costSingle;
    const idemKey = req.header("Idempotency-Key");
    await client.query("BEGIN");
    if (idemKey) {
      const prior = await client.query<{ response: SummonPullResponse }>(
        `SELECT response FROM summoning.pull_operations WHERE idempotency_key = $1 AND player_id = $2`, [idemKey, playerId]);
      if (prior.rows.length) { await client.query("COMMIT"); ok(req, res, prior.rows[0].response); return; }
    }
    const wallet = await client.query<{ balance: string }>(
      `SELECT balance FROM economy.player_wallets WHERE player_id = $1 AND currency_id = 'crystal' FOR UPDATE`, [playerId]);
    const balance = Number(wallet.rows[0]?.balance ?? 0);
    if (balance < cost) { await client.query("ROLLBACK"); throw err(422, "WALLET_INSUFFICIENT", "Không đủ Crystal"); }
    const newBalance = balance - cost;
    await client.query(`UPDATE economy.player_wallets SET balance = $1, updated_at = now() WHERE player_id = $2 AND currency_id = 'crystal'`, [newBalance, playerId]);
    await client.query(
      `INSERT INTO economy.currency_transactions (player_id, currency_id, amount, balance_after, reason) VALUES ($1,'crystal',$2,$3,'summon')`,
      [playerId, -cost, newBalance]);

    const pityRes = await client.query<{ since_rare: number; since_epic: number; pulls_total: number }>(
      `SELECT since_rare, since_epic, pulls_total FROM summoning.player_pity WHERE player_id = $1 AND banner_id = $2 FOR UPDATE`, [playerId, BANNER_STANDARD.id]);
    const pity = pityRes.rows[0] ?? { since_rare: 0, since_epic: 0, pulls_total: 0 };
    const owned = new Set((await client.query<{ creature_id: string }>(
      `SELECT DISTINCT creature_id FROM creatures.creature_instances WHERE player_id = $1`, [playerId])).rows.map(r => r.creature_id));

    const results: SummonResultItem[] = [];
    for (let i = 0; i < count; i++) {
      let rarity = rollRarity(Math.random);
      // Pity (Part 9 §8.6): the pull that reaches a guarantee floor is raised.
      if (pity.since_epic + 1 >= BANNER_STANDARD.pityEpicAt && !atLeast(rarity, "Epic")) rarity = "Epic";
      else if (pity.since_rare + 1 >= BANNER_STANDARD.pityRareAt && !atLeast(rarity, "Rare")) rarity = "Rare";
      const pool = CREATURES.filter(c => c.rarity === rarity);
      const picked = pool[Math.floor(Math.random() * pool.length)];
      pity.pulls_total += 1;
      pity.since_rare = atLeast(rarity, "Rare") ? 0 : pity.since_rare + 1;
      pity.since_epic = atLeast(rarity, "Epic") ? 0 : pity.since_epic + 1;
      if (owned.has(picked.id)) {
        await client.query(
          `INSERT INTO creatures.creature_shards (player_id, creature_id, shards) VALUES ($1,$2,$3)
           ON CONFLICT (player_id, creature_id) DO UPDATE SET shards = creatures.creature_shards.shards + $3`,
          [playerId, picked.id, DUPLICATE_SHARDS]);
        await client.query(
          `UPDATE economy.player_wallets SET balance = balance + $1, updated_at = now() WHERE player_id = $2 AND currency_id = 'bond_essence'`,
          [DUPLICATE_BOND_ESSENCE, playerId]);
        results.push({ creatureId: picked.id, rarity, isDuplicate: true, creatureInstanceId: null, shardsGained: DUPLICATE_SHARDS });
      } else {
        const ins = await client.query<{ id: string }>(
          `INSERT INTO creatures.creature_instances (player_id, creature_id, level, acquired_method)
           VALUES ($1,$2,1,'summon') RETURNING id`, [playerId, picked.id]);
        owned.add(picked.id);
        results.push({ creatureId: picked.id, rarity, isDuplicate: false, creatureInstanceId: ins.rows[0].id, shardsGained: 0 });
      }
    }
    await client.query(
      `INSERT INTO summoning.player_pity (player_id, banner_id, pulls_total, since_rare, since_epic, updated_at)
       VALUES ($1,$2,$3,$4,$5,now())
       ON CONFLICT (player_id, banner_id) DO UPDATE SET pulls_total = $3, since_rare = $4, since_epic = $5, updated_at = now()`,
      [playerId, BANNER_STANDARD.id, pity.pulls_total, pity.since_rare, pity.since_epic]);
    const response: SummonPullResponse = {
      results,
      pity: { sinceRare: pity.since_rare, sinceEpic: pity.since_epic, guaranteeRareAt: BANNER_STANDARD.pityRareAt, guaranteeEpicAt: BANNER_STANDARD.pityEpicAt },
      remainingCrystal: newBalance,
    };
    if (idemKey) await client.query(
      `INSERT INTO summoning.pull_operations (idempotency_key, player_id, response) VALUES ($1,$2,$3)`, [idemKey, playerId, JSON.stringify(response)]);
    await bumpObjectives(client, playerId, "summoned", 1);
    await client.query("COMMIT");
    ok(req, res, response);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    next(e);
  } finally { client.release(); }
});


/* ---- Evolution (Awakened) — approved EVOLUTION-DRAFT-v1, DDD §17.2 ----
 * One transaction: lock the instance, validate ownership/state/level,
 * spend 1 Evolution Core, repoint the instance at the evolved template
 * (level/XP/bond untouched), write the audit log. Creatures assigned in
 * the Sanctuary or away on an expedition must come home first. */
export const EVOLUTION_MIN_LEVEL = 16;
collectionRouter.post("/creatures/:instanceId/evolve", async (req: AuthedRequest, res, next) => {
  try {
    const playerId = await profileIdOf(req.userId!);
    const { targetId } = req.body as { targetId?: string };
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query<{ id: string; creature_id: string; level: number }>(
        `SELECT id, creature_id, level FROM creatures.creature_instances WHERE id = $1 AND player_id = $2 FOR UPDATE`,
        [req.params.instanceId, playerId]);
      if (!rows.length) throw err(404, "CREATURE_NOT_FOUND", "Eidolon không tồn tại");
      const inst = rows[0];
      const baseDef = creatureById(inst.creature_id);
      if (!baseDef || baseDef.evolvedFrom) throw err(422, "EVOLUTION_NOT_AVAILABLE", "Dạng này không tiến hoá thêm được ở giai đoạn này");
      if (!(baseDef.evolutionTargets ?? []).includes(targetId ?? ""))
        throw err(422, "EVOLUTION_TARGET_INVALID", "Nhánh tiến hoá không hợp lệ cho loài này");
      if (Number(inst.level) < EVOLUTION_MIN_LEVEL)
        throw err(422, "EVOLUTION_LEVEL", `Cần cấp ${EVOLUTION_MIN_LEVEL} để tiến hoá (hiện tại Lv.${inst.level})`);
      const { rows: busyA } = await client.query(
        `SELECT 1 FROM sanctuary.assignments WHERE creature_instance_id = $1`, [inst.id]);
      if (busyA.length) throw err(422, "EVOLUTION_BUSY", "Eidolon đang phân công ở Sanctuary — rút về trước khi tiến hoá");
      const { rows: busyE } = await client.query(
        `SELECT 1 FROM sanctuary.expeditions WHERE player_id = $1 AND claimed_at IS NULL AND $2 = ANY(creature_instance_ids)`, [playerId, inst.id]);
      if (busyE.length) throw err(422, "EVOLUTION_BUSY", "Eidolon đang đi thám hiểm — chờ đội về trước khi tiến hoá");
      const { rows: spent } = await client.query<{ balance: string }>(
        `UPDATE economy.player_wallets SET balance = balance - 1, updated_at = now()
         WHERE player_id = $1 AND currency_id = 'evolution_core' AND balance >= 1 RETURNING balance`, [playerId]);
      if (!spent.length) throw err(422, "EVOLUTION_NO_CORE", "Cần 1 Evolution Core để tiến hoá");
      await client.query(
        `INSERT INTO economy.currency_transactions (player_id, currency_id, amount, balance_after, reason)
         VALUES ($1, 'evolution_core', -1, $2, 'evolution')`, [playerId, Number(spent[0].balance)]);
      await client.query(`UPDATE creatures.creature_instances SET creature_id = $1 WHERE id = $2`, [targetId, inst.id]);
      await client.query(
        `INSERT INTO progression.evolution_log (player_id, instance_id, from_creature_id, to_creature_id) VALUES ($1, $2, $3, $4)`,
        [playerId, inst.id, inst.creature_id, targetId]);
      await client.query("COMMIT");
      ok(req, res, { instanceId: inst.id, fromCreatureId: inst.creature_id, toCreatureId: targetId });
    } catch (e) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw e;
    } finally { client.release(); }
  } catch (e) { next(e); }
});
