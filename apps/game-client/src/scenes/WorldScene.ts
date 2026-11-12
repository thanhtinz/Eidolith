import Phaser from "phaser";
import type { PlayerProfile, WildSpawnInfo } from "@eidolith/shared-types";
import { NavGrid, findPath, gridToIso, isoToGrid } from "@eidolith/navigation-core";
import { mapById, creatureById } from "@eidolith/game-data";
import { network, type RemotePlayer, type WorldSnapshot } from "../net/NetworkManager";
import { mountHub, type HubHandle } from "../ui/hub";
import type { BattleResponse, OwnedCreature } from "@eidolith/shared-types";
import type { HudData } from "./HudScene";
import meadowVillage from "@eidolith/game-data/maps/meadow_village.json";
import whisperingForest from "@eidolith/game-data/maps/whispering_forest.json";
import ancientGrove from "@eidolith/game-data/maps/ancient_grove.json";
// World — Phase 2: real isometric world (World Part 8). Tiled maps rendered at the locked
// 64x32 tile, tap-to-move (tap anywhere to walk), A* pathfinding, camera follow/bounds,
// portals between maps, other players via WebSocket snapshot/events, world clock + weather HUD.
const MAP_JSON: Record<string, unknown> = { meadow_village: meadowVillage, whispering_forest: whisperingForest, ancient_grove: ancientGrove };
interface TiledObject { name: string; type: string; properties?: { name: string; value: unknown }[]; }
interface TiledMap { width: number; height: number; layers: { name: string; data?: number[]; objects?: TiledObject[] }[]; }
const prop = (o: TiledObject, n: string) => o.properties?.find(p => p.name === n)?.value;
const SPEED_TILES_PER_SEC = 4.2;
/** Name labels: dark pill backing so names never merge with each other or the scenery,
 *  and they live on a top depth layer so canopies never cover them. */
const NAME_STYLE: Phaser.Types.GameObjects.Text.TextStyle = { fontSize: "14px", color: "#ffffff", backgroundColor: "rgba(8,12,18,0.55)", padding: { x: 7, y: 3 } };
const LABEL_DEPTH = 90000;

export class WorldScene extends Phaser.Scene {
  private profile!: PlayerProfile;
  private hub?: HubHandle;
  private mapId = "";
  private grid!: NavGrid;
  private originX = 0; private originY = 0;
  private portals = new Map<string, { targetMap: string; targetSpawn: string }>();
  private npcSpots: { name: string; tx: number; ty: number; x: number; y: number }[] = [];
  private bossSpot: { tx: number; ty: number; x: number; y: number } | null = null;
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Image;
  private playerLabel!: Phaser.GameObjects.Text;
  private tintRect!: Phaser.GameObjects.Rectangle;
  private worldMinutes = 720;
  private gridPos = { x: 0, y: 0 };
  private path: { x: number; y: number }[] = [];
  private remotes = new Map<string, { container: Phaser.GameObjects.Container; label: Phaser.GameObjects.Text; target: { x: number; y: number } }>();
  private wilds = new Map<string, { container: Phaser.GameObjects.Container; label: Phaser.GameObjects.Text; info: WildSpawnInfo }>();
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
    for (const w of snap.wilds ?? []) this.addWild(w);
    this.launchHud(snap);
    const weatherVi: Record<string, string> = { clear: "Quang đãng", cloudy: "Nhiều mây", rain: "Mưa", wind: "Gió mạnh", storm: "Bão", fog: "Sương mù", snow: "Tuyết" };
    this.hub = mountHub(this, {
      profile: this.profile,
      hud: {
        mapLabel: `${mapById(snap.world.mapId)?.nameVi ?? snap.world.mapId} — Verdant Plains`,
        weatherLabel: weatherVi[snap.world.weather] ?? snap.world.weather, weatherKey: snap.world.weather,
        startMinutes: snap.world.time.hour * 60 + snap.world.time.minute,
        players: snap.players.length + 1,
        mapId: snap.world.mapId,
        mapW: (MAP_JSON[snap.world.mapId] as TiledMap).width,
        mapH: (MAP_JSON[snap.world.mapId] as TiledMap).height,
      },
      onArena: () => { void this.startArenaBattle(); },
      onBoss: () => { void this.startBossBattle(); },
      onLogout: () => {
        void network.request("POST", "/auth/logout").catch(() => undefined);
        network.clearTokens();
        this.scene.stop("Hud");
        this.scene.start("Login");
      },
    });
    this.events.once("shutdown", () => { this.hub?.destroy(); this.hub = undefined; });
    this.game.events.emit("hud:pos", { x: this.gridPos.x, y: this.gridPos.y });
    void network.request<{ gold: number; crystal: number }>("GET", "/player/wallet")
      .then(w => this.hub?.setWallet(w)).catch(() => undefined);
    this.subscribeWorld();
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.onTap(pointer));
    const w = window as unknown as { __eidolith?: unknown };
    w.__eidolith = { scene: this, network, getPlayerGrid: () => ({ ...this.gridPos, mapId: this.mapId }), changeMap: (m: string, s: string) => this.doChangeMap(m, s),
      getWilds: () => [...this.wilds.values()].map(x => x.info), tapWild: (id: string) => this.tryEncounter(id) };
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
    this.npcSpots = [];
    this.bossSpot = null;
    for (const o of objects) if (o.type === "portal") {
      this.portals.set(`${Number(prop(o, "tileX"))},${Number(prop(o, "tileY"))}`, { targetMap: String(prop(o, "targetMap")), targetSpawn: String(prop(o, "targetSpawn")) });
    }
    // Backdrop: the world sits inside a forest — dark ground + a ring of trees beyond
    // the map diamond, so the portrait screen never shows empty black corners.
    this.cameras.main.setBackgroundColor("#101c12");
    const worldW = (W + H) * 32, worldH = (W + H) * 16 + 32;
    this.add.rectangle(worldW / 2, worldH / 2, worldW + 2400, worldH + 2400, 0x182b1c).setDepth(-3000);
    let seed = 1234567;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < 110; i++) {
      const wx = (rnd() - 0.12) * (worldW + 500), wy = (rnd() - 0.08) * (worldH + 340);
      const g = this.gridFromWorld(wx, wy);
      if (g.x > -1.2 && g.y > -1.2 && g.x < W + 0.2 && g.y < H + 0.2) continue; // outside the diamond only
      this.add.image(wx, wy, rnd() > 0.45 ? "tree" : "pine").setOrigin(0.5, 1).setDepth(-2000 + wy * 0.01).setAlpha(0.92);
    }
    // Ground baked into one RenderTexture.
    const rt = this.add.renderTexture(0, 0, (W + H) * 32, (W + H) * 16 + 32).setOrigin(0, 0).setDepth(-1000);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const gid = ground[y * W + x];
      if (!gid) continue;
      const p = this.worldFromGrid(x, y);
      // Grass uses 4 extracted variants (deterministic per cell) so the ground
      // never shows a single-tile repetition grid.
      let frame = gid - 1;
      if (gid === 1) frame = [0, 5, 6, 7][((x * 7 + y * 13) % 4 + 4) % 4];
      else if (gid === 2) frame = [8, 9][((x * 5 + y * 11) % 2 + 2) % 2];
      else if (gid >= 3) frame = gid - 2;
      const img = this.make.image({ key: "verdant", frame }, false);
      img.setScale(1.09); // slight overlap so tile seams never show the clear colour
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
        if (sprite === "house") img.setScale(1.0);
      } else if (o.type === "npc") {
        const npcTex: Record<string, string> = { "Elder Rowan": "npc_rowan", "Mira": "npc_mira", "Kael": "npc_kael" };
        this.add.image(p.x, p.y + 14, npcTex[o.name] ?? "wanderer").setOrigin(0.5, 1).setScale(0.5).setDepth(p.y);
        this.add.text(p.x, p.y - 98, o.name, { ...NAME_STYLE, fontSize: "13px", color: "#cfe6ff" }).setOrigin(0.5).setDepth(LABEL_DEPTH);
        this.npcSpots.push({ name: o.name, tx, ty, x: p.x, y: p.y });
      } else if (o.type === "boss") {
        // The Ancient Treant: a giant ancient tree over the arena (dedicated
        // sprite is an art debt — see PHASE5B doc §2). Golden ring + label
        // mark it as the boss; tap it to open the boss dialog.
        const ring = this.add.ellipse(p.x, p.y + 18, 190, 52, 0xffd83d, 0.16).setDepth(p.y - 1);
        ring.setStrokeStyle(3, 0xffd83d, 0.75);
        this.add.image(p.x, p.y + 16, "tree").setOrigin(0.5, 1).setScale(2.7).setDepth(p.y);
        this.add.text(p.x, p.y - 235, "Ancient Treant", { ...NAME_STYLE, fontSize: "17px", color: "#ffd83d" }).setOrigin(0.5).setDepth(LABEL_DEPTH);
        this.bossSpot = { tx, ty, x: p.x, y: p.y };
      }
    }
    // Player.
    this.gridPos = { x: snap.player.x, y: snap.player.y };
    const pp = this.worldFromGrid(this.gridPos.x, this.gridPos.y);
    const playerTex = this.profile.avatarId === "wanderer_female" ? "wanderer_f" : "wanderer";
    this.playerBody = this.add.image(0, 14, playerTex).setOrigin(0.5, 1).setScale(0.5);
    this.tweens.add({ targets: this.playerBody, y: 11, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.player = this.add.container(pp.x, pp.y, [this.playerBody]).setDepth(pp.y);
    this.playerLabel = this.add.text(pp.x, pp.y - 100, this.profile.displayName, NAME_STYLE).setOrigin(0.5).setDepth(LABEL_DEPTH);
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
    // Day/night tint, driven by the world clock (60 real minutes = 24 game hours).
    this.worldMinutes = snap.world.time.hour * 60 + snap.world.time.minute;
    this.tintRect = this.add.rectangle(0, 0, 4200, 4200, 0x000000, 0).setDepth(80000);
    this.applyTint();
    this.time.addEvent({ delay: 1000, loop: true, callback: () => { this.worldMinutes = (this.worldMinutes + 0.4) % 1440; this.applyTint(); } });
  }

  /** Smooth keyframed tint: deep blue at night, warm at dawn/dusk, clear at midday. */
  private applyTint(): void {
    if (!this.tintRect) return;
    const keys: [number, number, number, number, number][] = [
      [0, 8, 12, 44, 0.40], [5, 8, 12, 44, 0.40], [6.5, 70, 50, 60, 0.16], [8, 0, 0, 0, 0],
      [16, 0, 0, 0, 0], [17.5, 120, 60, 30, 0.13], [19, 30, 30, 80, 0.26], [20.5, 8, 12, 44, 0.40], [24, 8, 12, 44, 0.40],
    ];
    const h = this.worldMinutes / 60;
    let a = keys[0], b = keys[keys.length - 1];
    for (let i = 0; i < keys.length - 1; i++) if (h >= keys[i][0] && h <= keys[i + 1][0]) { a = keys[i]; b = keys[i + 1]; break; }
    const t = b[0] === a[0] ? 0 : (h - a[0]) / (b[0] - a[0]);
    const mix = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
    this.tintRect.setFillStyle(Phaser.Display.Color.GetColor(mix(1), mix(2), mix(3)), a[4] + (b[4] - a[4]) * t);
  }

  private launchHud(snap: WorldSnapshot): void {
    const def = mapById(this.mapId);
    const weatherVi: Record<string, string> = { clear: "Quang đãng", cloudy: "Nhiều mây", rain: "Mưa", wind: "Gió mạnh", storm: "Bão", fog: "Sương mù", snow: "Tuyết" };
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
    const body = this.add.image(0, 14, rp.avatarId === "wanderer_female" ? "wanderer_f" : "wanderer").setOrigin(0.5, 1).setScale(0.5).setTint(0xcfe8ff);
    const container = this.add.container(p.x, p.y, [body]).setDepth(p.y);
    const label = this.add.text(p.x, p.y - 100, rp.displayName, { ...NAME_STYLE, color: "#dfffd0" }).setOrigin(0.5).setDepth(LABEL_DEPTH);
    this.remotes.set(rp.playerId, { container, label, target: { x: rp.x, y: rp.y } });
    this.updateHudPlayers();
  }
  private removeRemote(playerId: string): void {
    this.remotes.get(playerId)?.container.destroy();
    this.remotes.get(playerId)?.label.destroy();
    this.remotes.delete(playerId);
    this.updateHudPlayers();
  }

  private addWild(info: WildSpawnInfo): void {
    if (this.wilds.has(info.spawnId)) return;
    const def = creatureById(info.creatureId);
    const p = this.worldFromGrid(info.x, info.y);
    const parts: Phaser.GameObjects.GameObject[] = [];
    if (this.textures.exists(`cr_${info.creatureId}`)) {
      const img = this.add.image(0, 6, `cr_${info.creatureId}`).setOrigin(0.5, 1).setScale(0.42);
      this.tweens.add({ targets: img, y: 0, duration: 850 + Math.random() * 500, yoyo: true, repeat: -1, ease: "Sine.InOut" });
      parts.push(img);
    } else {
      const g = this.add.graphics();
      g.fillStyle(0x2c3e2f, 0.9).fillCircle(0, -18, 24);
      g.lineStyle(2, 0xe8c96a, 0.8).strokeCircle(0, -18, 24);
      const initial = this.add.text(0, -18, (def?.name ?? "?").charAt(0), { fontSize: "22px", color: "#e8c96a", fontStyle: "bold" }).setOrigin(0.5);
      parts.push(g, initial);
    }
    const container = this.add.container(p.x, p.y, parts).setDepth(p.y);
    const label = this.add.text(p.x, p.y - 82, `${def?.name ?? info.creatureId} · Lv.${info.level}`, { ...NAME_STYLE, color: "#ffe9a8" }).setOrigin(0.5).setDepth(LABEL_DEPTH);
    this.wilds.set(info.spawnId, { container, label, info });
  }
  private removeWild(spawnId: string): void {
    const w = this.wilds.get(spawnId);
    if (!w) return;
    w.container.destroy(); w.label.destroy();
    this.wilds.delete(spawnId);
  }
  /** Phase 4: practice battle at the Arena — team = first 5 owned Eidolons,
   * simulated on the server; BattleScene only plays the event stream. */
  private async startArenaBattle(): Promise<void> {
    try {
      const { items } = await network.request<{ items: OwnedCreature[] }>("GET", "/creatures");
      if (!items.length) { this.hint("Hãy bắt Eidolon đầu tiên ở Whispering Forest trước!"); return; }
      const teamIds = items.slice(0, 5).map(c => c.instanceId);
      const battle = await network.request<BattleResponse>("POST", "/battles", { instanceIds: teamIds });
      this.scene.start("Battle", { battle, teamIds });
    } catch (e) {
      this.hint(e instanceof Error ? e.message : "Không mở được trận đấu");
    }
  }

  private hint(text: string): void {
    const p = this.worldFromGrid(this.gridPos.x, this.gridPos.y);
    const t = this.add.text(p.x, p.y - 120, text, { ...NAME_STYLE, fontSize: "16px", color: "#ffd9a8" }).setOrigin(0.5).setDepth(LABEL_DEPTH + 1);
    this.tweens.add({ targets: t, y: p.y - 150, alpha: 0, duration: 1600, onComplete: () => t.destroy() });
  }
  /** Walk toward a tile-adjacent cell (used when tapping NPC/boss from afar). */
  private walkToward(tx: number, ty: number): void {
    const from = { x: Math.round(this.gridPos.x), y: Math.round(this.gridPos.y) };
    const candidates = [
      { x: tx + 1, y: ty }, { x: tx - 1, y: ty }, { x: tx, y: ty + 1 }, { x: tx, y: ty - 1 },
      { x: tx + 2, y: ty }, { x: tx - 2, y: ty }, { x: tx, y: ty + 2 }, { x: tx, y: ty - 2 },
    ].filter(c => this.grid.walkable(c.x, c.y));
    for (const c of candidates) { const f = findPath(this.grid, from, c); if (f) { this.path = f; break; } }
  }
  private tapNpc(n: { name: string; tx: number; ty: number }): void {
    const dist = Math.max(Math.abs(n.tx - Math.round(this.gridPos.x)), Math.abs(n.ty - Math.round(this.gridPos.y)));
    if (dist > 3) { this.hint("Lại gần hơn để nói chuyện!"); this.walkToward(n.tx, n.ty); return; }
    this.hub?.openNpc(n.name);
  }
  private tapBoss(): void {
    if (!this.bossSpot) return;
    const dist = Math.max(Math.abs(this.bossSpot.tx - Math.round(this.gridPos.x)), Math.abs(this.bossSpot.ty - Math.round(this.gridPos.y)));
    if (dist > 5) { this.hint("Lại gần đấu trường hơn!"); this.walkToward(this.bossSpot.tx, this.bossSpot.ty + 3); return; }
    this.hub?.openBoss();
  }
  private async startBossBattle(): Promise<void> {
    try {
      const { items } = await network.request<{ items: OwnedCreature[] }>("GET", "/creatures");
      if (!items.length) { this.hint("Hãy bắt Eidolon đầu tiên ở Whispering Forest trước!"); return; }
      const teamIds = items.slice(0, 5).map(c => c.instanceId);
      const battle = await network.request<BattleResponse>("POST", "/battles", { instanceIds: teamIds, mode: "boss" });
      this.scene.start("Battle", { battle, teamIds });
    } catch (e) {
      this.hint(e instanceof Error ? e.message : "Không mở được trận boss");
    }
  }

  private async tryEncounter(spawnId: string): Promise<void> {
    const w = this.wilds.get(spawnId);
    if (!w) return;
    const dist = Math.max(Math.abs(w.info.x - Math.round(this.gridPos.x)), Math.abs(w.info.y - Math.round(this.gridPos.y)));
    if (dist > 3) {
      this.hint("Lại gần hơn để bắt!");
      const from = { x: Math.round(this.gridPos.x), y: Math.round(this.gridPos.y) };
      const candidates = [
        { x: w.info.x + 1, y: w.info.y }, { x: w.info.x - 1, y: w.info.y },
        { x: w.info.x, y: w.info.y + 1 }, { x: w.info.x, y: w.info.y - 1 },
      ].filter(c => this.grid.walkable(c.x, c.y));
      for (const c of candidates) { const f = findPath(this.grid, from, c); if (f) { this.path = f; break; } }
      return;
    }
    try {
      const res = await network.request<{ encounterId: string; creature: { creatureId: string; level: number }; expiresAt: string }>(
        "POST", "/encounters/start", { spawnId });
      this.hub?.openEncounter({ encounterId: res.encounterId, creatureId: res.creature.creatureId, level: res.creature.level });
    } catch (e) {
      this.hint(e instanceof Error ? e.message : "Không bắt đầu được encounter");
    }
  }

  private subscribeWorld(): void {
    this.unsubs.push(network.subscribe("world.player.joined", (p) => this.addRemote(p as RemotePlayer)));
    this.unsubs.push(network.subscribe("world.player.left", (p) => this.removeRemote((p as { playerId: string }).playerId)));
    this.unsubs.push(network.subscribe("world.wild_spawned", (p) => this.addWild(p as WildSpawnInfo)));
    this.unsubs.push(network.subscribe("world.wild_removed", (p) => this.removeWild((p as { spawnId: string }).spawnId)));
    this.unsubs.push(network.subscribe("world.player.moved", (p) => {
      const m = p as { playerId: string; x: number; y: number };
      const remote = this.remotes.get(m.playerId);
      if (remote) remote.target = { x: m.x, y: m.y };
    }));
    this.events.once("shutdown", () => { this.unsubs.forEach(u => u()); this.unsubs = []; });
  }


  private onTap(pointer: Phaser.Input.Pointer): void {
    if (this.changingMap) return;
    const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    for (const n of this.npcSpots) {
      if (Math.hypot(worldPoint.x - n.x, worldPoint.y - (n.y - 40)) < 58) { this.tapNpc(n); return; }
    }
    if (this.bossSpot && Math.hypot(worldPoint.x - this.bossSpot.x, worldPoint.y - (this.bossSpot.y - 60)) < 110) { this.tapBoss(); return; }
    for (const w of this.wilds.values()) {
      if (Math.hypot(worldPoint.x - w.container.x, worldPoint.y - (w.container.y - 30)) < 46) { void this.tryEncounter(w.info.spawnId); return; }
    }
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
    this.game.events.emit("hud:pos", { x: this.gridPos.x, y: this.gridPos.y });
    network.send("world.player.move", { x: Math.round(this.gridPos.x * 100) / 100, y: Math.round(this.gridPos.y * 100) / 100 });
  }

  update(time: number, deltaMs: number): void {
    if (!this.player) return;
    if (this.tintRect) { const v = this.cameras.main.worldView; this.tintRect.setPosition(v.centerX, v.centerY); }
    const dt = Math.min(deltaMs, 100) / 1000;
    let moved = false;
    if (this.path.length) {
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
      this.playerLabel?.setPosition(p.x, p.y - 100);
      this.sendPosition(time);
      this.checkPortal();
    }
    // Remote players glide toward their targets.
    for (const remote of this.remotes.values()) {
      const p = this.worldFromGrid(remote.target.x, remote.target.y);
      const cur = remote.container;
      cur.x += (p.x - cur.x) * 0.25; cur.y += (p.y - cur.y) * 0.25;
      cur.setDepth(cur.y);
      remote.label.setPosition(cur.x, cur.y - 100);
    }
  }
}
