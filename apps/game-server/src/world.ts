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
interface MapObject { name: string; type: string; properties?: { name: string; value: unknown }[]; }
interface MapFile { layers: { name: string; objects?: MapObject[] }[]; }
const prop = (o: MapObject, n: string) => o.properties?.find(p => p.name === n)?.value;
const mapsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "packages", "game-data", "maps");
const SPAWNS = new Map<string, Map<string, { x: number; y: number }>>();
for (const mapId of ["meadow_village", "whispering_forest"]) {
  const map = JSON.parse(readFileSync(join(mapsDir, `${mapId}.json`), "utf8")) as MapFile;
  const objects = map.layers.find(l => l.name === "objects")?.objects ?? [];
  const spawns = new Map<string, { x: number; y: number }>();
  for (const o of objects) if (o.type === "spawn") spawns.set(o.name, { x: Number(prop(o, "tileX")), y: Number(prop(o, "tileY")) });
  SPAWNS.set(mapId, spawns);
}
export function worldClock(now = Date.now()) {
  const cycleMs = 60 * 60 * 1000; // 60 real minutes per game day
  const dayMinutes = Math.floor(((now % cycleMs) / cycleMs) * 1440);
  return { hour: Math.floor(dayMinutes / 60), minute: dayMinutes % 60, cycleMinutes: 60 };
}
const WEATHERS = ["clear", "clear", "clear", "cloudy", "rain"] as const;
export function weatherFor(regionId: string, now = Date.now()) {
  const window = Math.floor(now / (30 * 60 * 1000));
  let h = window;
  for (const ch of regionId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return WEATHERS[h % WEATHERS.length];
}
interface PlayerState {
  userId: string; playerId: string; displayName: string; level: number;
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
const pub = (p: PlayerState) => ({ playerId: p.playerId, displayName: p.displayName, level: p.level, x: p.x, y: p.y, mapId: p.mapId });
async function persist(p: PlayerState) {
  p.lastPersist = Date.now();
  await query(`UPDATE players.player_profiles SET current_map_id=$1, position_x=$2, position_y=$3, updated_at=now() WHERE id=$4`,
    [p.mapId, p.x, p.y, p.playerId]).catch(() => undefined);
}
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
          const { rows } = await query<{ id: string; display_name: string; level: number; current_map_id: string; position_x: number; position_y: number }>(
            `SELECT id, display_name, level, current_map_id, position_x, position_y FROM players.player_profiles WHERE user_id = $1`, [decoded.sub]);
          if (!rows.length) { ws.close(4003, "player not found"); return; }
          const r = rows[0];
          const mapId = SPAWNS.has(r.current_map_id) ? r.current_map_id : "meadow_village";
          const spawn = SPAWNS.get(mapId)!.get(mapId === "whispering_forest" ? "from_village" : "spawn_player")!;
          const hasSavedPos = r.position_x !== 0 || r.position_y !== 0;
          state = {
            userId: decoded.sub, playerId: r.id, displayName: r.display_name, level: r.level,
            mapId, x: hasSavedPos ? r.position_x : spawn.x, y: hasSavedPos ? r.position_y : spawn.y,
            ws, lastPersist: 0, lastMoveAt: Date.now(),
          };
          clearTimeout(authTimer);
          zone(mapId).set(state.playerId, state);
          send(ws, "world.snapshot", {
            player: pub(state),
            players: [...zone(mapId).values()].filter(p => p.playerId !== state!.playerId).map(pub),
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
        send(ws, "world.snapshot", {
          player: pub(state),
          players: [...zone(targetMap).values()].filter(p => p.playerId !== state!.playerId).map(pub),
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
