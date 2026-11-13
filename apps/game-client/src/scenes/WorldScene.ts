import Phaser from "phaser";
import type { PlayerProfile, WildSpawnInfo } from "@eidolith/shared-types";
import { NavGrid, findPath } from "@eidolith/navigation-core";
import { mapById, creatureById } from "@eidolith/game-data";
import { network, type RemotePlayer, type WorldSnapshot } from "../net/NetworkManager";
import { mountHub, type HubHandle } from "../ui/hub";
import { applyAppearance } from "../ui/appearance";
import { setNightAmbience, setDayAmbience, setWeatherAmbience, sfxStep, sfxThunder } from "../ui/sfx";
import type { BattleResponse, OwnedCreature } from "@eidolith/shared-types";
import type { HudData } from "./HudScene";
import meadowVillage from "@eidolith/game-data/maps/meadow_village.json";
import whisperingForest from "@eidolith/game-data/maps/whispering_forest.json";
import ancientGrove from "@eidolith/game-data/maps/ancient_grove.json";
import crystalLake from "@eidolith/game-data/maps/crystal_lake.json";
import windmillFields from "@eidolith/game-data/maps/windmill_fields.json";
import riverbendVillage from "@eidolith/game-data/maps/riverbend_village.json";
import lakeCave from "@eidolith/game-data/maps/lake_cave.json";
import forestDeep from "@eidolith/game-data/maps/forest_deep.json";
import groveRuins from "@eidolith/game-data/maps/grove_ruins.json";
import mistMarsh from "@eidolith/game-data/maps/mist_marsh.json";
import hilltopShrine from "@eidolith/game-data/maps/hilltop_shrine.json";
import farmAcres from "@eidolith/game-data/maps/farm_acres.json";
import forestCamp from "@eidolith/game-data/maps/forest_camp.json";
import rootHollow1 from "@eidolith/game-data/maps/root_hollow_1.json";
import rootHollow2 from "@eidolith/game-data/maps/root_hollow_2.json";
// World — Phase 2: real isometric world (World Part 8). Tiled maps rendered at the locked
// 64x32 tile, tap-to-move (tap anywhere to walk), A* pathfinding, camera follow/bounds,
// portals between maps, other players via WebSocket snapshot/events, world clock + weather HUD.
const MAP_JSON: Record<string, unknown> = { meadow_village: meadowVillage, whispering_forest: whisperingForest, ancient_grove: ancientGrove, crystal_lake: crystalLake, windmill_fields: windmillFields, riverbend_village: riverbendVillage, lake_cave: lakeCave, forest_deep: forestDeep, grove_ruins: groveRuins, mist_marsh: mistMarsh, hilltop_shrine: hilltopShrine, farm_acres: farmAcres, forest_camp: forestCamp, root_hollow_1: rootHollow1, root_hollow_2: rootHollow2 };
interface TiledObject { name: string; type: string; properties?: { name: string; value: unknown }[]; }
interface TiledMap { width: number; height: number; layers: { name: string; data?: number[]; objects?: TiledObject[] }[]; }
const prop = (o: TiledObject, n: string) => o.properties?.find(p => p.name === n)?.value;
const SPEED_TILES_PER_SEC = 4.2;
// 2.5D oblique (Tín, 2026-11-12): the ground plane is pitched — rows
// compress to 80% while sprites stand upright at full height, which is
// the classic tilted-camera RPG look of his reference (and reads much
// richer than the flat top-down). Gameplay/grid are untouched.
const SQUASH = 0.8;
/** Name labels: dark pill backing so names never merge with each other or the scenery,
 *  and they live on a top depth layer so canopies never cover them. */
// World name labels: render in the game's font at 2x resolution — at 1x in
// Phaser's default Courier the tiny canvas gets a smeared row of pixels
// across the glyphs (reads as a line under/through the name in-world).
const NAME_STYLE: Phaser.Types.GameObjects.Text.TextStyle = { fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "14px", color: "#ffffff", backgroundColor: "rgba(8,12,18,0.55)", padding: { x: 7, y: 3 }, resolution: 2 };
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
  /** Interiors (Lake Cave) ignore the sky clock: permanent gloom. */
  private caveDark = false;
  private tallProps: { img: Phaser.GameObjects.Image; x: number; y: number }[] = [];
  // Stage 4 sun/moon system (docs/STAGE4-SUNMOON-v1.md): ONE sun model
  // drives tint, celestial discs, light rays, shadows and night ambience.
  private skySun?: Phaser.GameObjects.Image;
  private skyStars?: Phaser.GameObjects.Image;
  private skyRays?: Phaser.GameObjects.Image;
  private skyFrac = { sun: { x: 0.5, y: 0.2, vis: false } };
  private staticShadows: { img: Phaser.GameObjects.Image; x: number; y: number; h: number }[] = [];
  private childShadows: { img: Phaser.GameObjects.Image; h: number }[] = [];
  private gridPos = { x: 0, y: 0 };
  private path: { x: number; y: number }[] = [];
  private remotes = new Map<string, { container: Phaser.GameObjects.Container; label: Phaser.GameObjects.Text; target: { x: number; y: number } }>();
  private wilds = new Map<string, { container: Phaser.GameObjects.Container; label: Phaser.GameObjects.Text; info: WildSpawnInfo }>();
  private lastSentAt = 0; private lastCellKey = "";
  private unsubs: (() => void)[] = [];
  private changingMap = false;
  // Weather FX (Part 15, 2026-11-13): the server snapshot's weather key
  // drives rain/snow/wind/fog visuals + storm lightning and the matching
  // ambience loops. Pools are screen-pinned like the sky layer.
  private weatherKey = "clear";
  private wxDrops: { img: Phaser.GameObjects.Image; ox: number; oy: number; sp: number; ph: number }[] = [];
  private wxSplashes: { img: Phaser.GameObjects.Image; ox: number; oy: number; t: number; life: number }[] = [];
  private wxLeaves: { img: Phaser.GameObjects.Image; ox: number; oy: number; sp: number; ph: number }[] = [];
  private wxMists: Phaser.GameObjects.Image[] = [];
  private wxFlash?: Phaser.GameObjects.Rectangle;
  private wxNextBolt = 0;
  private ambKey = "";

  constructor() { super("World"); }

  // 2.5D projection (Tín's calls, 2026-11-12 — square grid like his
  // Pokémon reference, ground plane pitched by SQUASH). worldFromGrid
  // returns the tile CENTRE on the pitched plane; sprites anchor their
  // feet at centre + 26 (the pitched tile's bottom edge).
  private worldFromGrid(gx: number, gy: number) {
    return { x: gx * 64 + 32 + this.originX, y: (gy * 64 + 32) * SQUASH + this.originY };
  }
  private gridFromWorld(wx: number, wy: number) {
    return { x: (wx - this.originX - 32) / 64, y: ((wy - this.originY) / SQUASH - 32) / 64 };
  }

  create(data: { profile: PlayerProfile; snapshot: WorldSnapshot }): void {
    // scene.restart reuses this instance, so per-session guards must be
    // reset here — a stuck changingMap once blocked every map change
    // after the first (found 2026-11-12 via the orphaned-grove report).
    this.changingMap = false;
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
      onFriendBattle: (pid: string) => { void this.startFriendBattle(pid); },
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
      getWilds: () => [...this.wilds.values()].map(x => x.info), tapWild: (id: string) => this.tryEncounter(id),
      setWorldMinutes: (m: number) => { this.worldMinutes = ((m % 1440) + 1440) % 1440; this.applyTint(); this.updateSun(); },
      getSunState: () => this.sunModel(),
      setWeather: (wkey: string) => this.setWeather(wkey),
      getWeatherFx: () => ({ key: this.weatherKey, drops: this.wxDrops.filter(d => d.img.visible).length, leaves: this.wxLeaves.filter(d => d.img.visible).length }) };
    this.events.once("shutdown", () => { setNightAmbience(false); setDayAmbience(false); setWeatherAmbience("off"); });
  }

  private buildMap(mapId: string, snap: WorldSnapshot): void {
    this.caveDark = mapId === "lake_cave" || mapId === "root_hollow_1" || mapId === "root_hollow_2";
    this.tallProps = [];
    this.mapId = mapId;
    this.staticShadows = [];
    this.childShadows = [];
    this.ensureSkyTextures();
    const map = MAP_JSON[mapId] as TiledMap;
    const W = map.width, H = map.height;
    this.originX = 0; this.originY = 0;
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
    const worldW = W * 64, worldH = Math.ceil(H * 64 * SQUASH);
    this.add.rectangle(worldW / 2, worldH / 2, worldW + 2400, worldH + 2400, 0x182b1c).setDepth(-3000);
    let seed = 1234567;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < 110; i++) {
      const wx = (rnd() - 0.12) * (worldW + 500), wy = (rnd() - 0.08) * (worldH + 340);
      const g = this.gridFromWorld(wx, wy);
      if (g.x > -1.2 && g.y > -1.2 && g.x < W + 0.2 && g.y < H + 0.2) continue; // outside the diamond only
      this.add.image(wx, wy, rnd() > 0.45 ? "tree" : "pine").setOrigin(0.5, 1).setDepth(-2000 + wy * 0.01).setAlpha(0.92);
    }
    // Ground painted as ONE continuous canvas — SEAMLESS GROUND (Tín,
    // 2026-11-12, after the feathered-tile bake still read as squares:
    // "nó phải liền"). No tiles are drawn at all now: each surface
    // group gets a mask of its cells, the mask is blurred, and a
    // SEAMLESS texture (mirror-wrapped, tools/build_surfaces_v1.py)
    // is composited through it in painter's order. A unified speckle
    // grain + soft light/shade blobs finish the whole canvas, so no
    // square unit survives anywhere on the ground.
    const GW = W * 64, GH = Math.ceil(H * 64 * SQUASH);
    const GROUP: Record<number, string> = { 1: "grass", 2: "dark", 6: "dark", 3: "stone", 4: "deep", 9: "shallow", 13: "shallow", 5: "flower", 7: "sand", 8: "dirt", 10: "swamp", 11: "rock", 12: "plank" };
    const ORDER = ["dark", "flower", "swamp", "rock", "sand", "dirt", "stone", "plank", "shallow", "deep"];
    const cv = document.createElement("canvas");
    cv.width = GW; cv.height = GH;
    const ctx = cv.getContext("2d")!;
    const fillPattern = (c: CanvasRenderingContext2D, name: string) => {
      const src = this.textures.get(`surf_${name}`).getSourceImage() as HTMLImageElement;
      c.fillStyle = c.createPattern(src, "repeat")!;
      c.fillRect(0, 0, GW, GH);
    };
    fillPattern(ctx, "grass");
    // MELTED MASKS, FIRM-EDGE PASS (2026-11-13): the first melt
    // (3px/cell upscaled ~21x + blur 5px) killed the squares but
    // feathered every region border into a ~20px blend band and,
    // with the soft blob finish, the whole ground read SMEARED
    // ("cứ bị lem lem"). The reference look is organic shapes with
    // DECISIVE edges and clean interiors. Now: 6px per cell
    // (upscale ~10.7x), circle r 0.62, blur 1.5px — corners stay
    // round (no squares) but the blend band narrows to ~5px, and
    // the radial light/shade blob finish is GONE (pure smear);
    // only a whisper of speckle remains.
    const MS = 6;
    for (const grp of ORDER) {
      const mc = document.createElement("canvas");
      mc.width = W * MS; mc.height = H * MS;
      const mctx = mc.getContext("2d")!;
      mctx.fillStyle = "#fff";
      let any = false;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (GROUP[ground[y * W + x]] !== grp) continue;
        any = true;
        mctx.beginPath();
        mctx.arc(x * MS + MS / 2, y * MS + MS / 2, MS * 0.62, 0, Math.PI * 2);
        mctx.fill();
        mctx.fillRect(x * MS + 1, y * MS + 1, MS - 2, MS - 2);
      }
      if (!any) continue;
      const lc = document.createElement("canvas");
      lc.width = GW; lc.height = GH;
      const lctx = lc.getContext("2d")!;
      fillPattern(lctx, grp);
      lctx.globalCompositeOperation = "destination-in";
      lctx.filter = "blur(1.5px)";
      lctx.imageSmoothingEnabled = true;
      lctx.imageSmoothingQuality = "high";
      lctx.drawImage(mc, 0, 0, GW, GH);
      lctx.filter = "none";
      ctx.drawImage(lc, 0, 0);
    }
    // A whisper of unified speckle (was 5200 heavy specks + 22 soft
    // radial blobs — the blobs are removed, see the firm-edge note).
    {
      let s2 = 987654321;
      const rnd2 = () => { s2 = (s2 * 1103515245 + 12345) & 0x7fffffff; return s2 / 0x7fffffff; };
      for (let i = 0; i < 1600; i++) {
        const a = 0.02 + rnd2() * 0.035;
        ctx.fillStyle = rnd2() > 0.5 ? `rgba(10,24,8,${a})` : `rgba(255,246,200,${a * 0.8})`;
        ctx.fillRect(rnd2() * GW, rnd2() * GH, 1 + rnd2() * 2, 1 + rnd2() * 1.4);
      }
    }
    const gkey = `ground_${mapId}`;
    if (this.textures.exists(gkey)) this.textures.remove(gkey);
    this.textures.addCanvas(gkey, cv);
    this.add.image(0, 0, gkey).setOrigin(0, 0).setDepth(-1000);
    // Props + NPCs (depth sorted by foot position).
    for (const o of objects) {
      const tx = Number(prop(o, "tileX")), ty = Number(prop(o, "tileY"));
      const p = this.worldFromGrid(tx, ty);
      if (o.type === "prop") {
        const sprite = String(prop(o, "sprite"));
        const img = this.add.image(p.x, p.y + 26, sprite).setOrigin(0.5, 1).setDepth(p.y);
        // Per-prop scale (composition v2): landmark trees/rocks are placed
        // oversized so a map has silhouettes, not just copies of one sprite.
        const sc = Number(prop(o, "scale") ?? 1);
        if (sc !== 1) img.setScale(sc);
        const hFac: Record<string, number> = { house: 2.3, tree: 1.8, pine: 1.9, rock: 0.7, bush: 0.55, stall: 1.6, lantern: 1.4, signpost: 0.9, crates: 0.7, well: 1.2, board: 0.9, basket: 0.4, pots: 0.5, shrine: 1.5, runes: 1.4, cluster: 1.1, planter: 0.6, hive: 1.0, dummy: 1.1, stump: 0.7, shrooms: 0.4, darkwood: 1.9, willow: 1.7, blossom: 1.6, elder: 2.2, dead: 1.7, autumn: 1.8, house2: 2.3, house3: 2.0 };
        this.addStaticShadow(p.x, p.y + 25, (hFac[sprite] ?? 1) * sc, p.y - 1);
        // Tall props register for the canopy-fade pass (update): a tree or
        // house in front of the player fades so the character is never
        // hidden behind foliage — the standard iso readability mechanic.
        if (["tree", "pine", "darkwood", "willow", "blossom", "elder", "dead", "autumn", "house", "house2", "house3"].includes(sprite)) {
          this.tallProps.push({ img, x: p.x, y: p.y + 26 });
        }
      } else if (o.type === "npc") {
        const npcTex: Record<string, string> = { "Elder Rowan": "npc_rowan", "Mira": "npc_mira", "Kael": "npc_kael" };
        this.add.image(p.x, p.y + 26, npcTex[o.name] ?? "wanderer").setOrigin(0.5, 1).setScale(0.5).setDepth(p.y);
        this.addStaticShadow(p.x, p.y + 23, 1, p.y - 1);
        this.add.text(p.x, p.y - 92, o.name, { ...NAME_STYLE, fontSize: "13px", color: "#cfe6ff" }).setOrigin(0.5).setDepth(LABEL_DEPTH);
        this.npcSpots.push({ name: o.name, tx, ty, x: p.x, y: p.y });
      } else if (o.type === "boss") {
        // The Ancient Treant: a giant ancient tree over the arena (dedicated
        // sprite is an art debt — see PHASE5B doc §2). Golden ring + label
        // mark it as the boss; tap it to open the boss dialog.
        const ring = this.add.ellipse(p.x, p.y + 26, 176, 46, 0xffd83d, 0.16).setDepth(p.y - 1);
        ring.setStrokeStyle(3, 0xffd83d, 0.75);
        this.add.image(p.x, p.y + 26, "elder").setOrigin(0.5, 1).setScale(1.7).setDepth(p.y);
        this.addStaticShadow(p.x, p.y + 25, 3, p.y - 2);
        this.add.text(p.x, p.y - 235, "Ancient Treant", { ...NAME_STYLE, fontSize: "17px", color: "#ffd83d" }).setOrigin(0.5).setDepth(LABEL_DEPTH);
        this.bossSpot = { tx, ty, x: p.x, y: p.y };
      }
    }
    // Player.
    this.gridPos = { x: snap.player.x, y: snap.player.y };
    const pp = this.worldFromGrid(this.gridPos.x, this.gridPos.y);
    const playerTex = this.profile.avatarId === "wanderer_female" ? "wanderer_f" : "wanderer";
    this.playerBody = this.add.image(0, 26, playerTex).setOrigin(0.5, 1).setScale(0.5);
    applyAppearance(this, this.profile, this.playerBody);
    this.tweens.add({ targets: this.playerBody, y: 23, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.player = this.add.container(pp.x, pp.y, [this.makeChildShadow(1), this.playerBody]).setDepth(pp.y);
    this.playerLabel = this.add.text(pp.x, pp.y - 92, this.profile.displayName, NAME_STYLE).setOrigin(0.5).setDepth(LABEL_DEPTH);
    this.path = [];
    this.lastCellKey = `${Math.round(this.gridPos.x)},${Math.round(this.gridPos.y)}`;
    // Remote players from snapshot.
    this.remotes.clear();
    for (const rp of snap.players) this.addRemote(rp);
    // Camera.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, W * 64, Math.ceil(H * 64 * SQUASH));
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setZoom(1); // integer zoom: texture pixels map 1:1 to screen pixels — fractional zooms make pixel art shimmer unevenly ("không nét")
    // Day/night tint, driven by the world clock (60 real minutes = 24 game hours).
    this.worldMinutes = snap.world.time.hour * 60 + snap.world.time.minute;
    // Per-map colour grade (composition v2): the light itself differs per
    // place — cool deep forest, warm bright fields, fresh lakeside. A
    // multiply wash under the day/night tint; white = neutral.
    const GRADES: Record<string, number> = { whispering_forest: 0xdcecf7, ancient_grove: 0xd9ecd2, windmill_fields: 0xfff0bd, crystal_lake: 0xe4f7ff, meadow_village: 0xfff6dc, riverbend_village: 0xf0f8e4, forest_deep: 0xd2e4dc, grove_ruins: 0xffe8c4, mist_marsh: 0xdcefe4, hilltop_shrine: 0xfff2cf, farm_acres: 0xfff6da, forest_camp: 0xd8e8dd, root_hollow_1: 0xcfd2b8, root_hollow_2: 0xbfc4a8 };
    this.add.rectangle(0, 0, 4200, 4200, GRADES[snap.world.mapId] ?? 0xffffff, 1).setDepth(79999).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.tintRect = this.add.rectangle(0, 0, 4200, 4200, 0x000000, 0).setDepth(80000);
    this.applyTint();
    this.weatherKey = snap.world.weather;
    this.buildSky();
    this.buildWeatherFx();
    this.updateSun();
    this.updateAmbience();
    this.time.addEvent({ delay: 1000, loop: true, callback: () => { this.worldMinutes = (this.worldMinutes + 0.4) % 1440; this.applyTint(); this.updateSun(); this.updateAmbience(); } });
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
    if (this.caveDark) this.tintRect.setFillStyle(0x05070f, 0.55); // cave gloom overrides the sky
  }

  /* ---------------------------------------------------------------- */
  /* Stage 4 — unified sun/moon model (docs/STAGE4-SUNMOON-v1.md).     */
  /* ONE model derived from the world hour drives every visual: tint   */
  /* (applyTint), the sun/moon discs on their arcs, star intensity,    */
  /* golden-hour light rays and every shadow's direction + length —    */
  /* the pattern Kingdom Two Crowns and modern 2D weather systems use: */
  /* a scene reads as lit by a single light.                           */
  /* ---------------------------------------------------------------- */

  /** Sun/moon state for the current world time. Sunrise 06:00, sunset
   *  18:36; elevation is a sine over the arc (0 at horizon, 1 at noon). */
  private sunModel() {
    const h = this.worldMinutes / 60;
    const dayT = (h - 6) / 12.6;
    const sunUp = dayT >= 0 && dayT <= 1;
    const elev = sunUp ? Math.sin(Math.PI * dayT) : 0;
    const nightT = h >= 18.6 ? (h - 18.6) / 11.4 : (h + 5.4) / 11.4;
    const moonElev = Math.sin(Math.PI * Math.min(1, Math.max(0, nightT)));
    const darkness = sunUp
      ? Math.min(1, Math.max(0, 0.5 - elev))
      : 0.55 + 0.45 * moonElev;
    const golden = elev > 0 ? Math.min(1, Math.max(0, 1 - Math.abs(elev - 0.3) / 0.3)) : 0;
    // Shadow casting: sun path left→right across the sky, shadows fall
    // opposite (long at low sun, short at noon); moonlight is a faint
    // second light with its own direction (Byzen's "one model" rule).
    const day = elev > 0.02;
    const dirX = day ? Math.cos(Math.PI * dayT) : Math.cos(Math.PI * nightT);
    const len = day ? 54 - 44 * elev : 30;
    return { h, dayT, sunUp, elev, nightT, moonElev, darkness, golden, day, dirX, len };
  }

  private ensureSkyTextures(): void {
    const mk = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
      if (this.textures.exists(key)) return;
      const tex = this.textures.createCanvas(key, w, h);
      if (!tex) return;
      draw(tex.getContext());
      tex.refresh();
    };
    // Soft blob shadow (radial gradient ellipse).
    mk("sky_shadow", 128, 64, (c) => {
      c.save(); c.translate(64, 32); c.scale(1, 0.5);
      const g = c.createRadialGradient(0, 0, 4, 0, 0, 62);
      g.addColorStop(0, "rgba(6,10,6,0.82)");
      g.addColorStop(0.7, "rgba(6,10,6,0.42)");
      g.addColorStop(1, "rgba(6,10,6,0)");
      c.fillStyle = g;
      c.beginPath(); c.arc(0, 0, 62, 0, Math.PI * 2); c.fill();
      c.restore();
    });
    // Weather FX sprites (Part 15): rain streak, snow flake, wind leaf,
    // ground splash ring, fog bank.
    mk("wx_drop", 6, 26, (c) => {
      const g = c.createLinearGradient(0, 0, 0, 26);
      g.addColorStop(0, "rgba(190,220,255,0)");
      g.addColorStop(0.35, "rgba(190,220,255,0.75)");
      g.addColorStop(1, "rgba(230,244,255,0.95)");
      c.fillStyle = g; c.fillRect(2, 0, 2, 26);
    });
    mk("wx_flake", 8, 8, (c) => {
      const g = c.createRadialGradient(4, 4, 0.5, 4, 4, 4);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g; c.beginPath(); c.arc(4, 4, 4, 0, Math.PI * 2); c.fill();
    });
    mk("wx_leaf", 16, 10, (c) => {
      c.fillStyle = "rgba(96,168,72,0.9)";
      c.beginPath(); c.ellipse(8, 5, 7, 3.6, 0.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(140,205,105,0.9)";
      c.beginPath(); c.ellipse(6.5, 4, 4, 2, 0.5, 0, Math.PI * 2); c.fill();
    });
    mk("wx_splash", 30, 12, (c) => {
      c.strokeStyle = "rgba(215,238,255,0.85)"; c.lineWidth = 1.6;
      c.beginPath(); c.ellipse(15, 6, 12, 4.4, 0, 0, Math.PI * 2); c.stroke();
    });
    mk("wx_mist", 512, 256, (c) => {
      const g = c.createRadialGradient(256, 128, 10, 256, 128, 250);
      g.addColorStop(0, "rgba(235,242,248,0.55)");
      g.addColorStop(1, "rgba(235,242,248,0)");
      c.fillStyle = g; c.fillRect(0, 0, 512, 256);
    });
    // Soft light/shade blob for the continuous-ground bake (pass 4).
    mk("ground_blob", 256, 256, (c) => {
      const g = c.createRadialGradient(128, 128, 8, 128, 128, 126);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, 256, 256);
    });
    // Sun disc with warm glow.
    mk("sky_sun", 192, 192, (c) => {
      const g = c.createRadialGradient(96, 96, 4, 96, 96, 95);
      g.addColorStop(0, "rgba(255,253,235,1)");
      g.addColorStop(0.2, "rgba(255,238,175,0.95)");
      g.addColorStop(0.45, "rgba(255,196,86,0.42)");
      g.addColorStop(1, "rgba(255,180,70,0)");
      c.fillStyle = g; c.fillRect(0, 0, 192, 192);
    });
    // Star field.
    mk("sky_stars", 1280, 720, (c) => {
      let s = 987654321;
      const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
      for (let i = 0; i < 230; i++) {
        const x = rnd() * 1280, y = Math.pow(rnd(), 1.4) * 700, r = 0.6 + rnd() * 1.3;
        const warm = rnd();
        c.fillStyle = warm > 0.8 ? "rgba(255,236,190,0.95)" : warm > 0.6 ? "rgba(196,220,255,0.95)" : "rgba(255,255,255,0.95)";
        c.globalAlpha = 0.35 + rnd() * 0.65;
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
        if (r > 1.6) { c.fillRect(x - r * 3, y - 0.5, r * 6, 1); c.fillRect(x - 0.5, y - r * 3, 1, r * 6); }
      }
      c.globalAlpha = 1;
    });
    // Golden-hour light rays: soft diagonal bands, ADD-blended.
    mk("sky_rays", 1024, 1024, (c) => {
      c.translate(512, 512); c.rotate(-0.62);
      for (let i = 0; i < 7; i++) {
        const x = -640 + i * 190 + (i % 3) * 36, wdt = 62 + (i % 3) * 44;
        const g = c.createLinearGradient(x, 0, x + wdt, 0);
        g.addColorStop(0, "rgba(255,222,150,0)");
        g.addColorStop(0.5, "rgba(255,222,150,0.20)");
        g.addColorStop(1, "rgba(255,222,150,0)");
        c.fillStyle = g; c.fillRect(x, -720, wdt, 1440);
      }
    });
  }

  private buildSky(): void {
    this.skyStars = this.add.image(0, 0, "sky_stars").setOrigin(0.5).setDepth(80003).setAlpha(0);
    this.skyRays = this.add.image(0, 0, "sky_rays").setOrigin(0.5).setDepth(80004)
      .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    this.skySun = this.add.image(0, 0, "sky_sun").setOrigin(0.5).setDepth(80006).setAlpha(0);
  }

  /* -------- Weather FX (Part 15): pooled, screen-pinned, budgeted -- */
  private buildWeatherFx(): void {
    this.wxDrops = []; this.wxSplashes = []; this.wxLeaves = []; this.wxMists = [];
    const R = Math.random;
    for (let i = 0; i < 110; i++) {
      const img = this.add.image(0, 0, "wx_drop").setOrigin(0.5).setDepth(80006).setVisible(false).setAlpha(0.75);
      this.wxDrops.push({ img, ox: R() * 1400, oy: R() * 800, sp: 0.85 + R() * 0.4, ph: R() * 6.28 });
    }
    for (let i = 0; i < 22; i++) {
      const img = this.add.image(0, 0, "wx_splash").setOrigin(0.5).setDepth(80005).setVisible(false);
      this.wxSplashes.push({ img, ox: R() * 1400, oy: R() * 800, t: R() * 0.4, life: 0.4 });
    }
    for (let i = 0; i < 22; i++) {
      const img = this.add.image(0, 0, "wx_leaf").setOrigin(0.5).setDepth(80006).setVisible(false).setAlpha(0.9);
      this.wxLeaves.push({ img, ox: R() * 1400, oy: R() * 800, sp: 130 + R() * 130, ph: R() * 6.28 });
    }
    for (let i = 0; i < 5; i++) {
      const img = this.add.image(0, 0, "wx_mist").setOrigin(0.5).setDepth(80005).setVisible(false).setAlpha(0.34).setScale(2.3);
      this.wxMists.push(img);
      img.setData("ox", R() * 1500 - 100); img.setData("oy", 120 + R() * 520);
    }
    this.wxFlash = this.add.rectangle(0, 0, 2600, 1600, 0xf4f8ff, 0).setDepth(80008);
    this.wxNextBolt = 0;
  }

  private setWeather(wkey: string): void {
    this.weatherKey = wkey;
    this.ambKey = "";
    this.updateAmbience();
  }

  /** One ambience decision per (weather × day/night × cave) state. */
  private updateAmbience(): void {
    const day = this.sunModel().day;
    const key = this.caveDark ? "cave" : `${this.weatherKey}|${day ? "D" : "N"}`;
    if (key === this.ambKey) return;
    this.ambKey = key;
    if (this.caveDark) { setWeatherAmbience("off"); setDayAmbience(false); return; }
    setWeatherAmbience(this.weatherKey === "rain" ? "rain" : this.weatherKey === "storm" ? "storm" : this.weatherKey === "wind" ? "wind" : "off");
    setDayAmbience(day && (this.weatherKey === "clear" || this.weatherKey === "cloudy" || this.weatherKey === "fog" || this.weatherKey === "snow"));
  }

  private updateWeatherFx(time: number, dt: number): void {
    if (!this.wxFlash) return;
    const v = this.cameras.main.worldView;
    const w = this.weatherKey, cave = this.caveDark;
    const raining = !cave && (w === "rain" || w === "storm");
    const snowing = !cave && w === "snow";
    const windy = !cave && (w === "wind" || w === "storm");
    const foggy = !cave && w === "fog";
    const slant = w === "storm" ? 300 : 130;
    const fall = w === "storm" ? 1180 : 950;
    for (const d of this.wxDrops) {
      const on = raining || snowing;
      d.img.setVisible(on);
      if (!on) continue;
      if (snowing) {
        d.img.setTexture("wx_flake");
        d.oy += 85 * d.sp * dt; d.ox += Math.sin(time / 480 + d.ph) * 26 * dt;
        d.img.setRotation(0);
      } else {
        d.img.setTexture("wx_drop");
        d.oy += fall * d.sp * dt; d.ox += slant * d.sp * dt;
        d.img.setRotation(Math.atan2(slant, fall));
      }
      if (d.oy > v.height + 30) { d.oy = -30; d.ox = Math.random() * (v.width + 60) - 30; }
      if (d.ox > v.width + 30) d.ox = -30;
      d.img.setPosition(v.x + d.ox, v.y + d.oy);
    }
    for (const s of this.wxSplashes) {
      s.img.setVisible(raining);
      if (!raining) continue;
      s.t -= dt;
      if (s.t <= 0) { s.ox = Math.random() * v.width; s.oy = Math.random() * v.height; s.life = 0.3 + Math.random() * 0.22; s.t = s.life; }
      const k = 1 - s.t / s.life;
      s.img.setPosition(v.x + s.ox, v.y + s.oy).setScale(0.45 + k * 0.95).setAlpha(0.75 * (1 - k));
    }
    for (const l of this.wxLeaves) {
      l.img.setVisible(windy);
      if (!windy) continue;
      l.ox += l.sp * dt; l.oy += Math.sin(time / 340 + l.ph) * 34 * dt;
      if (l.ox > v.width + 24) { l.ox = -24; l.oy = Math.random() * v.height; }
      l.img.setPosition(v.x + l.ox, v.y + l.oy).setRotation(time / 300 + l.ph);
    }
    for (const m of this.wxMists) {
      m.setVisible(foggy);
      if (!foggy) continue;
      let ox = (m.getData("ox") as number) + 7 * dt;
      if (ox > v.width + 320) ox = -320;
      m.setData("ox", ox);
      m.setPosition(v.x + ox, v.y + (m.getData("oy") as number));
    }
    // Storm lightning: flash first, thunder follows at a distance lag.
    if (!cave && w === "storm") {
      this.wxFlash.setPosition(v.centerX, v.centerY);
      if (time > this.wxNextBolt) {
        this.wxNextBolt = time + 6000 + Math.random() * 9000;
        this.wxFlash.setAlpha(0.5);
        this.tweens.add({ targets: this.wxFlash, alpha: 0, duration: 150, ease: "Quad.easeOut" });
        if (Math.random() < 0.35) this.time.delayedCall(190, () => {
          this.wxFlash?.setAlpha(0.32);
          this.tweens.add({ targets: this.wxFlash, alpha: 0, duration: 170, ease: "Quad.easeOut" });
        });
        this.time.delayedCall(250 + Math.random() * 650, () => sfxThunder());
      }
    } else this.wxFlash.setAlpha(0);
  }

  /** Recompute every sun-driven visual from the one model. */
  private updateSun(): void {
    const m = this.sunModel();
    if (this.caveDark) { // no sky inside the cave: hide disc, rays and stars
      this.skyStars?.setVisible(false);
      this.skySun?.setVisible(false);
      this.skyRays?.setVisible(false);
      return;
    }
    // Stars + twinkle.
    if (this.skyStars) {
      const tw = 0.84 + 0.10 * Math.sin(Date.now() / 700);
      this.skyStars.setAlpha(m.darkness * tw).setVisible(m.darkness > 0.02);
    }
    // Sun disc: NOT drawn in top-down (there is no horizon/sky in this
    // projection — Tín's moon ruling generalises: the hour reads through
    // light, shadows, rays and darkness). The disc code stays for the
    // sun model but never shows.
    this.skyFrac.sun = { x: (120 + m.dayT * 1040) / 1280, y: (172 - 100 * m.elev) / 720, vis: false };
    if (this.skySun) {
      this.skySun.setVisible(false);
      if (m.sunUp) {
        this.skySun.setAlpha(Math.min(1, m.elev * 3.5 + 0.2));
        const warm = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(0xff9440), Phaser.Display.Color.ValueToColor(0xfff2c0),
          100, Math.round(m.elev * 100));
        this.skySun.setTint(Phaser.Display.Color.GetColor(warm.r, warm.g, warm.b));
        this.skySun.setScale(1.18 - 0.3 * m.elev);
      }
    }
    // No moon disc (Tín's call, 2026-11-12): night reads through the
    // darkness itself + stars + ambience, not an icon on the sky.
    // Golden-hour rays: strongest at low sun, slant flips morning/evening.
    if (this.skyRays) {
      this.skyRays.setAlpha(m.golden * 0.13).setVisible(m.golden > 0.03);
      this.skyRays.setRotation((m.dayT - 0.5) * 0.9);
    }
    // Shadows: direction + length from the same model.
    const rot = m.dirX * 0.35;
    const alpha = m.day ? 0.44 * Math.min(1, 0.45 + m.elev) : 0.16;
    const place = (img: Phaser.GameObjects.Image, bx: number, by: number, hgt: number) => {
      img.setPosition(bx + m.dirX * m.len * hgt * 0.8, by + 0.36 * m.len * hgt * 0.34);
      img.setScale((0.7 + m.len / 38) * (0.55 + 0.45 * hgt), 0.5 * (0.55 + 0.45 * hgt));
      img.setRotation(rot).setAlpha(alpha);
    };
    this.staticShadows = this.staticShadows.filter(s => s.img.active);
    for (const s of this.staticShadows) place(s.img, s.x, s.y, s.h);
    this.childShadows = this.childShadows.filter(s => s.img.active);
    for (const s of this.childShadows) {
      s.img.setPosition(m.dirX * m.len * s.h * 0.55, 25);
      s.img.setScale((0.7 + m.len / 38) * (0.55 + 0.45 * s.h), 0.5 * (0.55 + 0.45 * s.h));
      s.img.setRotation(rot).setAlpha(alpha);
    }
    setNightAmbience(m.darkness > 0.55);
  }

  /** Pin the sky layer to the camera view (same trick as the tint rect):
   *  positions are view fractions, scales are screen pixels / zoom. */
  private pinSky(): void {
    if (!this.skySun) return;
    const v = this.cameras.main.worldView;
    const z = this.cameras.main.zoom;
    if (this.skyStars) this.skyStars.setPosition(v.centerX, v.centerY).setScale(1 / z);
    if (this.skyRays) this.skyRays.setPosition(v.centerX, v.y + 0.42 * v.height).setScale(1.75 / z);
    if (this.skySun) this.skySun.setPosition(v.x + this.skyFrac.sun.x * v.width, v.y + this.skyFrac.sun.y * v.height)
      .setScale((1.18 - 0.3 * this.sunModel().elev) / z);
  }

  private addStaticShadow(x: number, y: number, h: number, depth: number): void {
    const img = this.add.image(x, y, "sky_shadow").setOrigin(0.5).setDepth(depth).setAlpha(0.3);
    this.staticShadows.push({ img, x, y, h });
    // Contact AO: a tight dark ellipse pinned exactly at the base so
    // the object reads as standing ON the ground, not pasted over it
    // (the sun shadow above is offset by the hour and never does this).
    const aoW = 52 + 30 * h;
    this.add.image(x, y + 1, "sky_shadow").setOrigin(0.5).setDepth(depth).setAlpha(0.33).setDisplaySize(aoW, aoW * 0.3);
  }

  private makeChildShadow(h: number): Phaser.GameObjects.Container {
    const ao = this.add.image(0, 25, "sky_shadow").setOrigin(0.5).setAlpha(0.3).setDisplaySize(58, 20);
    const img = this.add.image(0, 25, "sky_shadow").setOrigin(0.5).setAlpha(0.3);
    this.childShadows.push({ img, h });
    return this.add.container(0, 0, [ao, img]);
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
    const body = this.add.image(0, 26, rp.avatarId === "wanderer_female" ? "wanderer_f" : "wanderer").setOrigin(0.5, 1).setScale(0.5).setTint(0xcfe8ff);
    applyAppearance(this, rp, body);
    const container = this.add.container(p.x, p.y, [this.makeChildShadow(1), body]).setDepth(p.y);
    const label = this.add.text(p.x, p.y - 92, rp.displayName, { ...NAME_STYLE, color: "#dfffd0" }).setOrigin(0.5).setDepth(LABEL_DEPTH);
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
    const parts: Phaser.GameObjects.GameObject[] = [this.makeChildShadow(0.55)];
    if (this.textures.exists(`cr_${info.creatureId}`)) {
      const img = this.add.image(0, 22, `cr_${info.creatureId}`).setOrigin(0.5, 1).setScale(0.42);
      this.tweens.add({ targets: img, y: 16, duration: 850 + Math.random() * 500, yoyo: true, repeat: -1, ease: "Sine.InOut" });
      parts.push(img);
    } else {
      const g = this.add.graphics();
      g.fillStyle(0x2c3e2f, 0.9).fillCircle(0, 4, 24);
      g.lineStyle(2, 0xe8c96a, 0.8).strokeCircle(0, 4, 24);
      const initial = this.add.text(0, 4, (def?.name ?? "?").charAt(0), { fontFamily: "'Baloo 2', sans-serif", fontSize: "22px", color: "#e8c96a", fontStyle: "bold", resolution: 2 }).setOrigin(0.5);
      parts.push(g, initial);
    }
    const container = this.add.container(p.x, p.y, parts).setDepth(p.y);
    const label = this.add.text(p.x, p.y - 52, `${def?.name ?? info.creatureId} · Lv.${info.level}`, { ...NAME_STYLE, color: "#ffe9a8" }).setOrigin(0.5).setDepth(LABEL_DEPTH);
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
  /** Phase 6: friendly battle against a friend's team snapshot (no rewards). */
  private async startFriendBattle(opponentPlayerId: string): Promise<void> {
    try {
      const { items } = await network.request<{ items: OwnedCreature[] }>("GET", "/creatures");
      if (!items.length) { this.hint("Hãy bắt Eidolon đầu tiên ở Whispering Forest trước!"); return; }
      const teamIds = items.slice(0, 5).map(c => c.instanceId);
      const battle = await network.request<BattleResponse>("POST", "/battles", { instanceIds: teamIds, mode: "friend", opponentPlayerId });
      this.scene.start("Battle", { battle, teamIds });
    } catch (e) {
      this.hint(e instanceof Error ? e.message : "Không mở được trận giao hữu");
    }
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
    this.pinSky();
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
      this.playerLabel?.setPosition(p.x, p.y - 92);
      this.sendPosition(time);
      this.checkPortal();
      sfxStep();
    }
    this.updateWeatherFx(time, dt);
    // Walk sway: a gentle rock while moving (the sprite has no walk
    // cycle yet — this keeps the glide from reading as a sliding statue).
    if (this.playerBody) {
      const targetRot = this.path.length ? Math.sin(time / 105) * 0.04 : 0;
      this.playerBody.rotation += (targetRot - this.playerBody.rotation) * 0.35;
    }
    // Remote players glide toward their targets.
    for (const remote of this.remotes.values()) {
      const p = this.worldFromGrid(remote.target.x, remote.target.y);
      const cur = remote.container;
      cur.x += (p.x - cur.x) * 0.25; cur.y += (p.y - cur.y) * 0.25;
      cur.setDepth(cur.y);
      remote.label.setPosition(cur.x, cur.y - 92);
    }
    // Canopy fade: a tall prop whose base is south of the player and whose
    // canopy covers the player's tile fades to 30% until the player steps
    // clear — placement alone can never guarantee this on every path.
    const pBaseY = this.player.y + 26;
    for (const t of this.tallProps) {
      const dy = t.y - pBaseY;
      const behind = dy > 4 && dy < t.img.displayHeight * 0.95 && Math.abs(this.player.x - t.x) < t.img.displayWidth * 0.45;
      const target = behind ? 0.22 : 1;
      if (Math.abs(t.img.alpha - target) > 0.02) t.img.alpha += (target - t.img.alpha) * 0.25;
    }
  }
}
