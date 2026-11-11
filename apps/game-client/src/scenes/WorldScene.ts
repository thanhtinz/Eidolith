import Phaser from "phaser";
import type { PlayerProfile } from "@eidolith/shared-types";
import { NavGrid, findPath, gridToIso, isoToGrid } from "@eidolith/navigation-core";
import { mapById } from "@eidolith/game-data";
import { network, type RemotePlayer, type WorldSnapshot } from "../net/NetworkManager";
import { joyState } from "../state";
import type { HudData } from "./HudScene";
import meadowVillage from "@eidolith/game-data/maps/meadow_village.json";
import whisperingForest from "@eidolith/game-data/maps/whispering_forest.json";
// World — Phase 2: real isometric world (World Part 8). Tiled maps rendered at the locked
// 64x32 tile, tap-to-move + virtual joystick, A* pathfinding, camera follow/bounds,
// portals between maps, other players via WebSocket snapshot/events, world clock + weather HUD.
const MAP_JSON: Record<string, unknown> = { meadow_village: meadowVillage, whispering_forest: whisperingForest };
interface TiledObject { name: string; type: string; properties?: { name: string; value: unknown }[]; }
interface TiledMap { width: number; height: number; layers: { name: string; data?: number[]; objects?: TiledObject[] }[]; }
const prop = (o: TiledObject, n: string) => o.properties?.find(p => p.name === n)?.value;
const SPEED_TILES_PER_SEC = 4.2;

export class WorldScene extends Phaser.Scene {
  private profile!: PlayerProfile;
  private mapId = "";
  private grid!: NavGrid;
  private originX = 0; private originY = 0;
  private portals = new Map<string, { targetMap: string; targetSpawn: string }>();
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Rectangle;
  private gridPos = { x: 0, y: 0 };
  private path: { x: number; y: number }[] = [];
  private remotes = new Map<string, { container: Phaser.GameObjects.Container; target: { x: number; y: number } }>();
  private lastSentAt = 0; private lastCellKey = "";
  private unsubs: (() => void)[] = [];
  private changingMap = false;

  constructor() { super("World"); }

  private worldFromGrid(gx: number, gy: number) {
    const iso = gridToIso(gx, gy);
    return { x: iso.x + this.originX, y: iso.y + this.originY };
  }
  private gridFromWorld(wx: number, wy: number) {
    return isoToGrid(wx - this.originX, wy - this.originY);
  }

  create(data: { profile: PlayerProfile; snapshot: WorldSnapshot }): void {
    this.profile = data.profile;
    const snap = data.snapshot ?? network.lastSnapshot!;
    this.buildMap(snap.world.mapId, snap);
    this.launchHud(snap);
    this.subscribeWorld();
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.onTap(pointer));
    const w = window as unknown as { __eidolith?: unknown };
    w.__eidolith = { scene: this, network, getPlayerGrid: () => ({ ...this.gridPos, mapId: this.mapId }), changeMap: (m: string, s: string) => this.doChangeMap(m, s) };
  }

  private buildMap(mapId: string, snap: WorldSnapshot): void {
    this.mapId = mapId;
    const map = MAP_JSON[mapId] as TiledMap;
    const W = map.width, H = map.height;
    this.originX = H * 32; this.originY = 16;
    const ground = map.layers.find(l => l.name === "ground")!.data!;
    const collision = map.layers.find(l => l.name === "collision")!.data!;
    const objects = map.layers.find(l => l.name === "objects")?.objects ?? [];
    // NPC cells block movement.
    const cells = Uint8Array.from(collision.map(v => (v ? 1 : 0)));
    for (const o of objects) if (o.type === "npc") cells[Number(prop(o, "tileY")) * W + Number(prop(o, "tileX"))] = 1;
    this.grid = new NavGrid(W, H, cells);
    this.portals.clear();
    for (const o of objects) if (o.type === "portal") {
      this.portals.set(`${Number(prop(o, "tileX"))},${Number(prop(o, "tileY"))}`, { targetMap: String(prop(o, "targetMap")), targetSpawn: String(prop(o, "targetSpawn")) });
    }
    // Ground baked into one RenderTexture.
    const rt = this.add.renderTexture(0, 0, (W + H) * 32, (W + H) * 16 + 32).setOrigin(0, 0).setDepth(-1000);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const gid = ground[y * W + x];
      if (!gid) continue;
      const p = this.worldFromGrid(x, y);
      const img = this.make.image({ key: "verdant", frame: gid - 1 }, false);
      rt.draw(img, p.x, p.y);
      img.destroy();
    }
    // Props + NPCs (depth sorted by foot position).
    for (const o of objects) {
      const tx = Number(prop(o, "tileX")), ty = Number(prop(o, "tileY"));
      const p = this.worldFromGrid(tx, ty);
      if (o.type === "prop") {
        const sprite = String(prop(o, "sprite"));
        const img = this.add.image(p.x, p.y + 16, sprite).setOrigin(0.5, 1).setDepth(p.y);
        if (sprite === "house") img.setScale(1.15);
      } else if (o.type === "npc") {
        const body = this.add.rectangle(p.x, p.y - 2, 16, 26, 0x7ab5d6).setOrigin(0.5, 1).setDepth(p.y);
        void body;
        this.add.text(p.x, p.y - 34, o.name, { fontSize: "13px", color: "#cfe6ff" }).setOrigin(0.5).setDepth(p.y + 1);
      }
    }
    // Player.
    this.gridPos = { x: snap.player.x, y: snap.player.y };
    const pp = this.worldFromGrid(this.gridPos.x, this.gridPos.y);
    this.playerBody = this.add.rectangle(0, 0, 18, 28, 0xe8c96a).setOrigin(0.5, 1);
    const nameText = this.add.text(0, -34, this.profile.displayName, { fontSize: "14px", color: "#ffffff" }).setOrigin(0.5);
    this.player = this.add.container(pp.x, pp.y, [this.playerBody, nameText]).setDepth(pp.y);
    this.path = [];
    this.lastCellKey = `${Math.round(this.gridPos.x)},${Math.round(this.gridPos.y)}`;
    // Remote players from snapshot.
    this.remotes.clear();
    for (const rp of snap.players) this.addRemote(rp);
    // Camera.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, (W + H) * 32, (W + H) * 16 + 32);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setZoom(1.6);
  }

  private launchHud(snap: WorldSnapshot): void {
    const def = mapById(this.mapId);
    const weatherVi: Record<string, string> = { clear: "Quang đãng", cloudy: "Nhiều mây", rain: "Mưa" };
    const data: HudData = {
      mapLabel: `${def?.nameVi ?? this.mapId} — Verdant Plains`,
      weatherLabel: weatherVi[snap.world.weather] ?? snap.world.weather,
      nameLevel: `${this.profile.displayName} · Lv.${this.profile.level}`,
      startMinutes: snap.world.time.hour * 60 + snap.world.time.minute,
      players: snap.players.length + 1,
    };
    if (this.scene.isActive("Hud")) this.scene.stop("Hud");
    this.scene.launch("Hud", data);
    this.events.once("shutdown", () => this.scene.stop("Hud"));
  }

  private updateHudPlayers(): void {
    this.game.events.emit("hud:players", this.remotes.size + 1);
  }

  private addRemote(rp: RemotePlayer): void {
    if (this.remotes.has(rp.playerId)) return;
    const p = this.worldFromGrid(rp.x, rp.y);
    const body = this.add.rectangle(0, 0, 18, 28, 0x9ad67a).setOrigin(0.5, 1);
    const label = this.add.text(0, -34, rp.displayName, { fontSize: "14px", color: "#dfffd0" }).setOrigin(0.5);
    const container = this.add.container(p.x, p.y, [body, label]).setDepth(p.y);
    this.remotes.set(rp.playerId, { container, target: { x: rp.x, y: rp.y } });
    this.updateHudPlayers();
  }
  private removeRemote(playerId: string): void {
    this.remotes.get(playerId)?.container.destroy();
    this.remotes.delete(playerId);
    this.updateHudPlayers();
  }

  private subscribeWorld(): void {
    this.unsubs.push(network.subscribe("world.player.joined", (p) => this.addRemote(p as RemotePlayer)));
    this.unsubs.push(network.subscribe("world.player.left", (p) => this.removeRemote((p as { playerId: string }).playerId)));
    this.unsubs.push(network.subscribe("world.player.moved", (p) => {
      const m = p as { playerId: string; x: number; y: number };
      const remote = this.remotes.get(m.playerId);
      if (remote) remote.target = { x: m.x, y: m.y };
    }));
    this.events.once("shutdown", () => { this.unsubs.forEach(u => u()); this.unsubs = []; });
  }


  private onTap(pointer: Phaser.Input.Pointer): void {
    if (joyState.active || this.changingMap) return;
    const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    // Ignore taps on the joystick corner.
    if (pointer.x < 190 && pointer.y > this.scale.height - 220) return;
    const g = this.gridFromWorld(worldPoint.x, worldPoint.y);
    const tx = Math.round(g.x), ty = Math.round(g.y);
    if (!this.grid.walkable(tx, ty)) return;
    const from = { x: Math.round(this.gridPos.x), y: Math.round(this.gridPos.y) };
    const found = findPath(this.grid, from, { x: tx, y: ty });
    if (found) this.path = found;
  }

  private async doChangeMap(targetMap: string, targetSpawn: string): Promise<void> {
    if (this.changingMap) return;
    this.changingMap = true;
    try {
      const snapshot = await network.changeMap(targetMap, targetSpawn);
      this.scene.restart({ profile: this.profile, snapshot });
    } catch { this.changingMap = false; }
  }

  private checkPortal(): void {
    const key = `${Math.round(this.gridPos.x)},${Math.round(this.gridPos.y)}`;
    if (key === this.lastCellKey) return;
    this.lastCellKey = key;
    const portal = this.portals.get(key);
    if (portal) void this.doChangeMap(portal.targetMap, portal.targetSpawn);
  }

  private sendPosition(now: number): void {
    if (now - this.lastSentAt < 150) return;
    this.lastSentAt = now;
    network.send("world.player.move", { x: Math.round(this.gridPos.x * 100) / 100, y: Math.round(this.gridPos.y * 100) / 100 });
  }

  update(time: number, deltaMs: number): void {
    if (!this.player) return;
    const dt = Math.min(deltaMs, 100) / 1000;
    let moved = false;
    if (joyState.active && (joyState.vec.x !== 0 || joyState.vec.y !== 0)) {
      const nx = this.gridPos.x + joyState.vec.x * SPEED_TILES_PER_SEC * dt;
      const ny = this.gridPos.y + joyState.vec.y * SPEED_TILES_PER_SEC * dt;
      if (this.grid.walkable(Math.round(nx), Math.round(this.gridPos.y))) this.gridPos.x = nx;
      if (this.grid.walkable(Math.round(this.gridPos.x), Math.round(ny))) this.gridPos.y = ny;
      moved = true;
    } else if (this.path.length) {
      const target = this.path[0];
      const dx = target.x - this.gridPos.x, dy = target.y - this.gridPos.y;
      const dist = Math.hypot(dx, dy);
      const step = SPEED_TILES_PER_SEC * dt;
      if (dist <= step) { this.gridPos = { ...target }; this.path.shift(); }
      else { this.gridPos.x += (dx / dist) * step; this.gridPos.y += (dy / dist) * step; }
      moved = true;
    }
    if (moved) {
      const p = this.worldFromGrid(this.gridPos.x, this.gridPos.y);
      this.player.setPosition(p.x, p.y).setDepth(p.y);
      this.sendPosition(time);
      this.checkPortal();
    }
    // Remote players glide toward their targets.
    for (const remote of this.remotes.values()) {
      const p = this.worldFromGrid(remote.target.x, remote.target.y);
      const cur = remote.container;
      cur.x += (p.x - cur.x) * 0.25; cur.y += (p.y - cur.y) * 0.25;
      cur.setDepth(cur.y);
    }
  }
}
