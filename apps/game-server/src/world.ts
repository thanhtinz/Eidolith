// World WebSocket — API Part 6 §20-22 + World Part 8: shared zone per map (MVP),
// AOI = whole zone at MVP scale, snapshot on join/resume, server world clock
// (60 real minutes = 24h game day, World Part 8 §13) and synced weather.
import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { verifyAccessToken } from "./auth-core.js";
import { query } from "./db.js";
import { ENCOUNTER_TABLES } from "@eidolith/game-data";
import type { WildSpawnInfo } from "@eidolith/shared-types";
import { WILD_ALIVE_TARGET, WILD_RESPAWN_MS, ENCOUNTER_TTL_MS } from "./collection-config.js";
interface MapObject { name: string; type: string; properties?: { name: string; value: unknown }[]; }
interface MapFile { layers: { name: string; objects?: MapObject[] }[]; }
const prop = (o: MapObject, n: string) => o.properties?.find(p => p.name === n)?.value;
const mapsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "packages", "game-data", "maps");
const SPAWNS = new Map<string, Map<string, { x: number; y: number }>>();
const WILD_POINTS = new Map<string, { x: number; y: number }[]>();
for (const mapId of ["meadow_village", "whispering_forest"]) {
  const map = JSON.parse(readFileSync(join(mapsDir, `${mapId}.json`), "utf8")) as MapFile;
  const objects = map.layers.find(l => l.name === "objects")?.objects ?? [];
  const spawns = new Map<string, { x: number; y: number }>();
  for (const o of objects) if (o.type === "spawn") spawns.set(o.name, { x: Number(prop(o, "tileX")), y: Number(prop(o, "tileY")) });
  SPAWNS.set(mapId, spawns);
  WILD_POINTS.set(mapId, objects.filter(o => o.type === "wild_spawn").map(o => ({ x: Number(prop(o, "tileX")), y: Number(prop(o, "tileY")) })));
}
export function worldClock(now = Date.now()) {
  const cycleMs = 60 * 60 * 1000; // 60 real minutes per game day
  const dayMinutes = Math.floor(((now % cycleMs) / cycleMs) * 1440);
  return { hour: Math.floor(dayMinutes / 60), minute: dayMinutes % 60, cycleMinutes: 60 };
}
const WEATHERS = ["clear", "clear", "clear", "cloudy", "rain", "wind"] as const;
export function weatherFor(regionId: string, now = Date.now()) {
  const window = Math.floor(now / (30 * 60 * 1000));
  let h = window;
  for (const ch of regionId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return WEATHERS[h % WEATHERS.length];
}
interface PlayerState {
  userId: string; playerId: string; displayName: string; level: number; avatarId: string;
  mapId: string; x: number; y: number; ws: WebSocket; lastPersist: number; lastMoveAt: number;
}
const zones = new Map<string, Map<string, PlayerState>>();
function zone(mapId: string) {
  if (!zones.has(mapId)) zones.set(mapId, new Map());
  return zones.get(mapId)!;
}
function send(ws: WebSocket, type: string, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type, timestamp: Date.now(), payload }));
}
function broadcast(mapId: string, exceptPlayerId: string | null, type: string, payload: unknown) {
  for (const p of zone(mapId).values()) if (p.playerId !== exceptPlayerId) send(p.ws, type, payload);
}
const pub = (p: PlayerState) => ({ playerId: p.playerId, displayName: p.displayName, level: p.level, avatarId: p.avatarId, x: p.x, y: p.y, mapId: p.mapId });
async function persist(p: PlayerState) {
  p.lastPersist = Date.now();
  await query(`UPDATE players.player_profiles SET current_map_id=$1, position_x=$2, position_y=$3, updated_at=now() WHERE id=$4`,
    [p.mapId, p.x, p.y, p.playerId]).catch(() => undefined);
}
// ---- Wild Eidolon spawns + encounters (Phase 3) ----
const wilds = new Map<string, Map<string, WildSpawnInfo>>();
const respawnDue = new Map<string, number>();
let spawnSeq = 0;
function rollWild(mapId: string): WildSpawnInfo | null {
  const table = ENCOUNTER_TABLES[mapId];
  const points = WILD_POINTS.get(mapId) ?? [];
  if (!table || !points.length) return null;
  const total = table.reduce((a, e) => a + e.weight, 0);
  let r = Math.random() * total;
  let entry = table[0];
  for (const e of table) { r -= e.weight; if (r <= 0) { entry = e; break; } }
  const alive = wilds.get(mapId) ?? new Map();
  const free = points.filter(pt => ![...alive.values()].some(w => w.x === pt.x && w.y === pt.y));
  const pt = (free.length ? free : points)[Math.floor(Math.random() * (free.length ? free.length : points.length))];
  return {
    spawnId: `wild_${mapId}_${++spawnSeq}`,
    creatureId: entry.creatureId,
    level: entry.minLevel + Math.floor(Math.random() * (entry.maxLevel - entry.minLevel + 1)),
    x: pt.x, y: pt.y,
  };
}
export function listWilds(mapId: string): WildSpawnInfo[] { return [...(wilds.get(mapId)?.values() ?? [])]; }
export function getWild(mapId: string, spawnId: string): WildSpawnInfo | undefined { return wilds.get(mapId)?.get(spawnId); }
export function removeWild(mapId: string, spawnId: string): void {
  if (wilds.get(mapId)?.delete(spawnId)) {
    respawnDue.set(mapId, Date.now() + WILD_RESPAWN_MS);
    broadcast(mapId, null, "world.wild_removed", { spawnId });
  }
}
function topUpWilds(mapId: string): void {
  if (!ENCOUNTER_TABLES[mapId]) return;
  if (!wilds.has(mapId)) wilds.set(mapId, new Map());
  const alive = wilds.get(mapId)!;
  while (alive.size < WILD_ALIVE_TARGET) {
    const w = rollWild(mapId);
    if (!w) break;
    alive.set(w.spawnId, w);
    broadcast(mapId, null, "world.wild_spawned", w);
  }
}
setInterval(() => {
  for (const mapId of Object.keys(ENCOUNTER_TABLES)) {
    if (!zone(mapId).size) continue;
    if (listWilds(mapId).length >= WILD_ALIVE_TARGET) continue;
    if (Date.now() < (respawnDue.get(mapId) ?? 0)) continue;
    topUpWilds(mapId);
  }
}, 5000).unref();

export interface EncounterState {
  id: string; playerId: string; userId: string; mapId: string; spawnId: string;
  creatureId: string; level: number; expiresAt: number;
}
const encounters = new Map<string, EncounterState>();
export function findPlayerByUserId(userId: string): PlayerState | undefined {
  for (const z of zones.values()) for (const p of z.values()) if (p.userId === userId) return p;
  return undefined;
}
export function startEncounter(state: PlayerState, wild: WildSpawnInfo): EncounterState {
  for (const e of encounters.values()) if (e.playerId === state.playerId) encounters.delete(e.id);
  const enc: EncounterState = {
    id: `enc_${++spawnSeq}_${Date.now().toString(36)}`, playerId: state.playerId, userId: state.userId,
    mapId: state.mapId, spawnId: wild.spawnId, creatureId: wild.creatureId, level: wild.level,
    expiresAt: Date.now() + ENCOUNTER_TTL_MS,
  };
  encounters.set(enc.id, enc);
  return enc;
}
export function getEncounter(id: string): EncounterState | undefined {
  const e = encounters.get(id);
  if (e && e.expiresAt < Date.now()) { encounters.delete(id); return undefined; }
  return e;
}
export function endEncounter(id: string): void { encounters.delete(id); }

export function attachWorldServer(server: Server): void {
  const wss = new WebSocketServer({ server, path: "/ws/v1" });
  wss.on("connection", (ws) => {
    let state: PlayerState | null = null;
    const authTimer = setTimeout(() => { if (!state) ws.close(4001, "auth timeout"); }, 5000);
    ws.on("message", async (raw) => {
      let msg: { type?: string; payload?: Record<string, unknown> };
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      const payload = msg.payload ?? {};
      if (msg.type === "system.ping") { send(ws, "system.pong", { serverTime: Date.now() }); return; }
      if (!state) {
        if (msg.type !== "auth.authenticate" || typeof payload.accessToken !== "string") { ws.close(4002, "unauthenticated"); return; }
        try {
          const decoded = verifyAccessToken(payload.accessToken);
          const { rows } = await query<{ id: string; display_name: string; level: number; avatar_id: string; current_map_id: string; position_x: number; position_y: number }>(
            `SELECT id, display_name, level, avatar_id, current_map_id, position_x, position_y FROM players.player_profiles WHERE user_id = $1`, [decoded.sub]);
          if (!rows.length) { ws.close(4003, "player not found"); return; }
          const r = rows[0];
          const mapId = SPAWNS.has(r.current_map_id) ? r.current_map_id : "meadow_village";
          const spawn = SPAWNS.get(mapId)!.get(mapId === "whispering_forest" ? "from_village" : "spawn_player")!;
          const hasSavedPos = r.position_x !== 0 || r.position_y !== 0;
          state = {
            userId: decoded.sub, playerId: r.id, displayName: r.display_name, level: r.level, avatarId: r.avatar_id,
            mapId, x: hasSavedPos ? r.position_x : spawn.x, y: hasSavedPos ? r.position_y : spawn.y,
            ws, lastPersist: 0, lastMoveAt: Date.now(),
          };
          clearTimeout(authTimer);
          zone(mapId).set(state.playerId, state);
          topUpWilds(mapId);
          send(ws, "world.snapshot", {
            player: pub(state),
            players: [...zone(mapId).values()].filter(p => p.playerId !== state!.playerId).map(pub),
            wilds: listWilds(mapId),
            world: { mapId, time: worldClock(), weather: weatherFor("verdant_plains") },
          });
          broadcast(mapId, state.playerId, "world.player.joined", pub(state));
        } catch { ws.close(4002, "unauthenticated"); }
        return;
      }
      if (msg.type === "world.player.move") {
        const x = Number(payload.x), y = Number(payload.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        const now = Date.now();
        const maxDist = 9 * ((now - state.lastMoveAt) / 1000) + 2; // ~9 tiles/s + slack
        if (Math.hypot(x - state.x, y - state.y) > maxDist) return; // reject teleport
        state.x = x; state.y = y; state.lastMoveAt = now;
        broadcast(state.mapId, state.playerId, "world.player.moved", { playerId: state.playerId, x, y });
        if (now - state.lastPersist > 5000) void persist(state);
        return;
      }
      if (msg.type === "world.change_map") {
        const targetMap = String(payload.targetMap ?? "");
        const targetSpawn = String(payload.targetSpawn ?? "");
        const spawn = SPAWNS.get(targetMap)?.get(targetSpawn);
        if (!spawn) { send(ws, "system.error", { code: "WORLD_INVALID_MAP", message: "Map hoặc điểm đến không hợp lệ" }); return; }
        const oldMap = state.mapId;
        zone(oldMap).delete(state.playerId);
        broadcast(oldMap, state.playerId, "world.player.left", { playerId: state.playerId });
        state.mapId = targetMap; state.x = spawn.x; state.y = spawn.y; state.lastMoveAt = Date.now();
        zone(targetMap).set(state.playerId, state);
        topUpWilds(targetMap);
        send(ws, "world.snapshot", {
          player: pub(state),
          players: [...zone(targetMap).values()].filter(p => p.playerId !== state!.playerId).map(pub),
          wilds: listWilds(targetMap),
          world: { mapId: targetMap, time: worldClock(), weather: weatherFor("verdant_plains") },
        });
        broadcast(targetMap, state.playerId, "world.player.joined", pub(state));
        void persist(state);
        return;
      }
    });
    ws.on("close", () => {
      clearTimeout(authTimer);
      if (state) {
        zone(state.mapId).delete(state.playerId);
        broadcast(state.mapId, state.playerId, "world.player.left", { playerId: state.playerId });
        void persist(state);
      }
    });
  });
}
