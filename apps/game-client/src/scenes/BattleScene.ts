// BattleScene — Phase 4 playback of a server-run battle (Part 7 §17).
// The server simulates with combat-core; this scene only plays the event
// stream: movement, hits, damage numbers, statuses, reactions, result.
// HP/energy shown here mirror the engine's own rules from the same events.
import Phaser from "phaser";
import type { BattleResponse, BattleTeamUnit } from "@eidolith/shared-types";
import { network } from "../net/NetworkManager";
import { skillsOf } from "@eidolith/game-data";

const sx = (x: number) => 215 + (x / 16) * 850;
const sy = (y: number) => 180 + (y / 10) * 360;
const ELEMENT_CSS: Record<string, string> = {
  Flame: "#ff8a5c", Tide: "#6ec1ff", Grove: "#8fd96a", Stone: "#d8a860", Gale: "#7fd4c1",
  Frost: "#bfeaff", Volt: "#ffd94a", Venom: "#b07fe8", Shade: "#9aa3d8", Astral: "#f2a7d4",
};
const STATUS_CHIP: Record<string, { ch: string; color: string }> = {
  Burn: { ch: "BỎNG", color: "#ff8a5c" }, Poison: { ch: "ĐỘC", color: "#b07fe8" },
  Wet: { ch: "ƯỚT", color: "#6ec1ff" }, Freeze: { ch: "BĂNG", color: "#bfeaff" },
  Shock: { ch: "SỐC", color: "#ffd94a" }, Weakness: { ch: "YẾU", color: "#9aa3d8" },
  DefenseUp: { ch: "GIÁP+", color: "#d8c9a8" }, Regeneration: { ch: "HỒI", color: "#8fd96a" },
  Empowerment: { ch: "LỰC+", color: "#f2a7d4" }, Knockback: { ch: "ĐẨY", color: "#e8e4d8" },
};

interface UnitVis {
  def: BattleTeamUnit; cont: Phaser.GameObjects.Container;
  art: Phaser.GameObjects.Image | Phaser.GameObjects.Arc | null;
  bar: Phaser.GameObjects.Graphics; chips: Phaser.GameObjects.Text;
  hp: number; shield: number; energy: number;
  tx: number; ty: number; dead: boolean;
  statuses: Map<string, number>;
}

/** Approved ultimate splash art, keyed by creature id. Species without an
 * entry fall back to a sprite-based cut-in band. */
const ULT_ART: Record<string, string> = {
  "EID-001": "assets/battle/ult-eid-001-v2.png",
};
/** Animated ultimate cinematics (image-to-video from the splash art).
 * Species listed here get a real animated cut-in; the rest use the
 * splash/band presentation. */
const ULT_VIDEO: Record<string, string> = {
  "EID-001": "assets/battle/ult-eid-001-v3.mp4",
};

export class BattleScene extends Phaser.Scene {
  private battle!: BattleResponse;
  private teamIds: string[] = [];
  private units = new Map<string, UnitVis>();
  private evIdx = 0;
  private playTick = 0;
  private speed = 1;
  private done = false;
  private overlay?: HTMLDivElement;
  private syncTimer?: number;
  private statusEl?: HTMLElement;
  private resultEl?: HTMLElement;
  private cutinUntil = 0;
  private cutinCont?: Phaser.GameObjects.Container;
  private cutinEl?: HTMLElement;

  constructor() { super("Battle"); }

  init(data: { battle: BattleResponse; teamIds: string[] }): void {
    this.battle = data.battle;
    this.teamIds = data.teamIds ?? [];
    this.units = new Map(); this.evIdx = 0; this.playTick = 0; this.done = false; this.speed = 1;
    this.cutinUntil = 0; this.cutinCont = undefined;
  }

  preload(): void {
    this.load.image("arena_bg", "assets/battle/arena-v1.png");
    for (const def of this.battle.teams) {
      const art = ULT_ART[def.creatureId];
      if (art) this.load.image(`ult_${def.creatureId}`, art);
    }
  }

  create(): void {
    for (const def of this.battle.teams) {
      const vid = ULT_VIDEO[def.creatureId];
      if (vid) void fetch(vid).catch(() => undefined); // warm the HTTP cache
    }
    this.drawArena();
    for (const def of this.battle.teams) this.makeUnit(def);
    this.mountOverlay();
    this.events.once("shutdown", () => this.unmountOverlay());
  }

  private drawArena(): void {
    if (this.textures.exists("arena_bg")) {
      this.add.image(640, 360, "arena_bg").setDisplaySize(1280, 720).setDepth(0);
    } else {
      const g = this.add.graphics();
      g.fillStyle(0x3d5c26, 1).fillRect(0, 0, 1280, 720);
    }
  }

  private makeUnit(def: BattleTeamUnit): void {
    const cont = this.add.container(0, 0);
    const shadow = this.add.ellipse(0, 26, 52, 14, 0x000000, 0.3);
    const ring = this.add.ellipse(0, 26, 56, 16, def.team === 0 ? 0x3fa7c4 : 0xc0392b, 0.55);
    cont.add([shadow, ring]);
    let art: UnitVis["art"] = null;
    const key = `cr_${def.creatureId}`;
    if (this.textures.exists(key)) {
      const img = this.add.image(0, -6, key);
      const h = 68; img.setDisplaySize(h * (img.width / Math.max(1, img.height)), h);
      this.tweens.add({ targets: img, y: -3, duration: 850 + (Number(def.unitId.split("-")[1] ?? 0)) * 130, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      if (def.team === 1) img.setFlipX(true);
      cont.add(img); art = img;
    } else {
      const circle = this.add.circle(0, -6, 30, Phaser.Display.Color.HexStringToColor(ELEMENT_CSS[def.element] ?? "#888888").color, 0.9);
      const letter = this.add.text(0, -6, def.name.charAt(0), { fontSize: "26px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
      cont.add([circle, letter]); art = circle;
    }
    const nameY = Number(def.unitId.split("-")[1] ?? 0) % 2 === 0 ? -64 : -82;
    const name = this.add.text(0, nameY, `${def.name} · Lv.${def.level}`, {
      fontSize: "12.5px", color: "#f7ead0", backgroundColor: "rgba(10,8,4,0.62)", padding: { x: 6, y: 2 },
      fontFamily: "'Be Vietnam Pro', sans-serif",
    }).setOrigin(0.5);
    const bar = this.add.graphics();
    const chips = this.add.text(0, 44, "", { fontSize: "10.5px", color: "#fff", fontFamily: "'Be Vietnam Pro', sans-serif" }).setOrigin(0.5, 0);
    cont.add([name, bar, chips]);
    cont.setDepth(100);
    const vis: UnitVis = {
      def, cont, art, bar, chips, hp: def.maxHp, shield: 0, energy: 0,
      tx: 0, ty: 0, dead: false, statuses: new Map(),
    };
    this.units.set(def.unitId, vis);
    this.drawBar(vis);
  }

  private drawBar(v: UnitVis): void {
    const g = v.bar; const w = 68, x = -w / 2;
    g.clear();
    if (v.dead) return;
    const pct = Math.max(0, v.hp / v.def.maxHp);
    g.fillStyle(0x120c06, 0.85).fillRoundedRect(x - 1, -55, w + 2, 9, 3);
    g.fillStyle(pct > 0.5 ? 0x63c74d : pct > 0.25 ? 0xe8a33d : 0xe2574c, 1).fillRoundedRect(x, -54, w * pct, 7, 3);
    if (v.shield > 0) {
      const sp = Math.min(1, v.shield / v.def.maxHp);
      g.fillStyle(0xffffff, 0.85).fillRoundedRect(x, -54, w * sp, 3, 2);
    }
    g.fillStyle(0x120c06, 0.85).fillRoundedRect(x - 1, -44, w + 2, 5, 2);
    g.fillStyle(v.energy >= 100 ? 0xffd94a : 0x3fa7c4, 1).fillRoundedRect(x, -43.5, w * (v.energy / 100), 4, 2);
  }

  /* ---------------- DOM overlay (theme A) ---------------- */

  private mountOverlay(): void {
    const canvas = this.game.canvas;
    const div = document.createElement("div");
    div.innerHTML = `
      <style>
        .bt-root{position:relative;width:1280px;height:720px;font-family:'Be Vietnam Pro',system-ui,sans-serif;color:#f7ead0;pointer-events:none}
        .bt-top{position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;gap:8px;align-items:center;pointer-events:auto}
        .bt-pill{background:linear-gradient(180deg,#3b2517,#2a190e);border:2px solid #d4a437;border-radius:999px;padding:7px 16px;font-size:15px;box-shadow:0 4px 12px rgba(0,0,0,.4);white-space:nowrap}
        .bt-pill b{font-family:'Baloo 2',sans-serif;color:#e8c96a;letter-spacing:.6px}
        .bt-btn{cursor:pointer;color:#f7ead0;font-weight:600}
        .bt-btn.on{background:linear-gradient(180deg,#8a5a1e,#6e4513);color:#ffe9a8}
        .bt-result{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:430px;background:linear-gradient(180deg,#2e1c0f,#211307);border:2px solid #d4a437;border-radius:22px;padding:26px 28px;text-align:center;pointer-events:auto;box-shadow:0 24px 70px rgba(0,0,0,.6)}
        .bt-result h2{font-family:'Baloo 2',sans-serif;font-size:34px;margin:0 0 6px;color:#e8c96a}
        .bt-result p{margin:4px 0 14px;color:#c9b18a;font-size:15.5px}
        .bt-result .row{display:flex;gap:10px}
        .bt-result button{flex:1;padding:13px;border:none;border-radius:12px;font-size:16.5px;font-weight:700;cursor:pointer;font-family:'Baloo 2',sans-serif}
        .bt-cutin{position:absolute;inset:0;background:#000;z-index:60;pointer-events:auto;overflow:hidden;cursor:pointer}
        .bt-cutin video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
        .bt-cutin .bar{position:absolute;left:0;width:100%;height:86px;background:#000;z-index:2}
        .bt-cutin .bar.t{top:0}.bt-cutin .bar.b{bottom:0}
        .bt-cutin .ttl{position:absolute;left:70px;bottom:120px;z-index:3;animation:btcin .45s .15s cubic-bezier(.2,.9,.3,1) both}
        .bt-cutin .who{font-family:'Baloo 2',sans-serif;font-weight:700;font-size:21px;color:#ffd94a;letter-spacing:1.5px}
        .bt-cutin .rule{width:340px;height:3px;background:#d4a437;margin:4px 0 6px}
        .bt-cutin .skill{font-family:'Baloo 2',sans-serif;font-weight:800;font-size:56px;line-height:1;color:#fff;text-shadow:0 4px 0 #1c0e02,0 6px 18px rgba(0,0,0,.6)}
        .bt-cutin .flash{position:absolute;inset:0;background:#fff;opacity:0;z-index:4;pointer-events:none}
        @keyframes btcin{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:none}}
        .bt-again{background:linear-gradient(180deg,#e8a33d,#c8871e);color:#fff}
        .bt-exit{background:#171006;color:#e8c96a;border:1.5px solid #d4a437 !important}
      </style>
      <div class="bt-root">
        <div class="bt-top">
          <span class="bt-pill"><b>ĐẤU TRƯỜNG</b> · <span id="bt-status">Đang đấu…</span></span>
          <button class="bt-pill bt-btn" data-sp="1">×1</button>
          <button class="bt-pill bt-btn" data-sp="2">×2</button>
          <button class="bt-pill bt-btn" data-sp="4">×4</button>
          <button class="bt-pill bt-btn" id="bt-skip">Bỏ qua ▸▸</button>
          <button class="bt-pill bt-btn" id="bt-quit">Rời trận</button>
        </div>
        <div id="bt-cutin-slot"></div>
        <div class="bt-result" id="bt-result" hidden>
          <h2 id="bt-title">THẮNG</h2>
          <p id="bt-sub"></p>
          <div class="row">
            <button class="bt-again" id="bt-again">Đấu lại</button>
            <button class="bt-exit" id="bt-back">Về thế giới</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(div);
    this.overlay = div;
    this.statusEl = div.querySelector("#bt-status") as HTMLElement;
    this.resultEl = div.querySelector("#bt-result") as HTMLElement;
    const sync = () => {
      const r = canvas.getBoundingClientRect();
      div.style.position = "fixed";
      div.style.left = `${r.left}px`; div.style.top = `${r.top}px`;
      div.style.width = `${r.width}px`; div.style.height = `${r.height}px`;
      div.style.transformOrigin = "top left";
      div.style.transform = `scale(${r.width / 1280})`;
      div.style.zIndex = "30"; div.style.pointerEvents = "none";
    };
    sync();
    this.syncTimer = window.setInterval(sync, 600);
    window.addEventListener("resize", sync);
    div.querySelectorAll("[data-sp]").forEach(b => b.addEventListener("click", () => {
      this.speed = Number((b as HTMLElement).dataset.sp);
      div.querySelectorAll("[data-sp]").forEach(x => x.classList.toggle("on", x === b));
    }));
    (div.querySelector('[data-sp="1"]') as HTMLElement).classList.add("on");
    div.querySelector("#bt-skip")!.addEventListener("click", () => this.skipAll());
    div.querySelector("#bt-quit")!.addEventListener("click", () => this.exit());
    div.querySelector("#bt-back")!.addEventListener("click", () => this.exit());
    div.querySelector("#bt-again")!.addEventListener("click", () => { void this.rematch(); });
  }

  private unmountOverlay(): void {
    if (this.syncTimer) window.clearInterval(this.syncTimer);
    this.overlay?.remove();
    this.overlay = undefined;
  }

  private exit(): void {
    this.scene.start("World");
  }

  private async rematch(): Promise<void> {
    if (!this.teamIds.length) { this.exit(); return; }
    try {
      const res = await network.request<BattleResponse>("POST", "/battles", { instanceIds: this.teamIds });
      this.scene.restart({ battle: res, teamIds: this.teamIds });
    } catch { this.exit(); }
  }

  /* ---------------- playback ---------------- */

  update(_time: number, delta: number): void {
    if (this.time.now < this.cutinUntil) return; // cut-in on stage: time stops
    if (!this.done) {
      this.playTick += (delta / 100) * this.speed;
      const upto = Math.floor(this.playTick);
      while (this.evIdx < this.battle.events.length && this.battle.events[this.evIdx].tick <= upto) {
        this.process(this.battle.events[this.evIdx], false);
        this.evIdx++;
        if (this.time.now < this.cutinUntil) break; // a cut-in just started
      }
      if (this.statusEl && !this.done)
        this.statusEl.textContent = `Đang đấu · ${(Math.min(upto, this.battle.ticks) / 10).toFixed(0)}s`;
    }
    for (const v of this.units.values()) {
      if (v.dead) continue;
      v.cont.x += (v.tx - v.cont.x) * 0.4;
      v.cont.y += (v.ty - v.cont.y) * 0.4;
      v.cont.setDepth(100 + v.cont.y / 10);
      // expire status chips by playback tick
      let changed = false;
      for (const [k, exp] of v.statuses) if (this.playTick > exp) { v.statuses.delete(k); changed = true; }
      if (changed) this.drawChips(v);
    }
  }

  private skipAll(): void {
    this.endCutin();
    while (this.evIdx < this.battle.events.length) {
      this.process(this.battle.events[this.evIdx], true);
      this.evIdx++;
    }
    for (const v of this.units.values()) { v.cont.x = v.tx; v.cont.y = v.ty; }
  }

  private floater(x: number, y: number, text: string, color: string, size = 17, instant = false): void {
    if (instant) return;
    const t = this.add.text(x, y, text, {
      fontSize: `${size}px`, color, fontStyle: "bold", fontFamily: "'Baloo 2', sans-serif",
      stroke: "#140d06", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(400);
    this.tweens.add({ targets: t, y: y - 44, alpha: 0, duration: 850, ease: "Quad.easeOut", onComplete: () => t.destroy() });
  }

  private drawChips(v: UnitVis): void {
    const parts: string[] = [];
    for (const k of v.statuses.keys()) {
      const c = STATUS_CHIP[k];
      if (c) parts.push(c.ch);
    }
    v.chips.setText(parts.join(" "));
  }

  private process(e: BattleResponse["events"][number], instant: boolean): void {
    const d = e.data as Record<string, unknown>;
    const vis = (id: unknown) => this.units.get(String(id));
    switch (e.type) {
      case "UnitSpawned": {
        const v = vis(d.unitId); if (!v) break;
        v.tx = sx(Number(d.x)); v.ty = sy(Number(d.y));
        if (instant || e.tick === 0) { v.cont.x = v.tx; v.cont.y = v.ty; }
        break;
      }
      case "UnitMoved": {
        const v = vis(d.unitId); if (!v) break;
        v.tx = sx(Number(d.x)); v.ty = sy(Number(d.y));
        break;
      }
      case "SkillStarted": {
        const v = vis(d.unitId); if (!v) break;
        if (String(d.skill) && v) {
          const isUlt = this.isUlt(v, d);
          if (isUlt) v.energy = 0; else v.energy = Math.min(100, v.energy + 15);
          if (isUlt && !instant && this.speed <= 2) this.startCutin(v, String(d.skill));
          else this.floater(v.cont.x, v.cont.y - 84, String(d.skill), isUlt ? "#ffd94a" : "#f7ead0", isUlt ? 20 : 14.5, instant);
          if (!instant && v.art && "x" in v.art) {
            const target = vis(d.targetId);
            if (target) {
              const dir = Math.sign(target.cont.x - v.cont.x) || 1;
              this.tweens.add({ targets: v.art, x: dir * 10, duration: 110, yoyo: true, ease: "Quad.easeOut" });
            }
          }
          this.drawBar(v);
        }
        break;
      }
      case "DamageApplied": {
        const t = vis(d.targetId); if (!t) break;
        const absorbed = Number(d.shieldAbsorbed ?? 0);
        t.shield = Math.max(0, t.shield - absorbed);
        t.hp = Math.max(0, t.hp - Number(d.amount ?? 0));
        const skill = d.skill as string | null;
        if (skill !== "status" && skill !== "reaction") {
          t.energy = Math.min(100, t.energy + 8);
          const s = vis(d.sourceId);
          if (s && skill === null) s.energy = Math.min(100, s.energy + 10);
          if (s) this.drawBar(s);
        }
        const crit = Boolean(d.crit);
        const color = ELEMENT_CSS[String(d.element)] ?? "#ffffff";
        this.floater(t.cont.x, t.cont.y - 74, crit ? `${d.amount}!` : `${d.amount}`, crit ? "#ffd94a" : color, crit ? 23 : 16.5, instant);
        if (!instant && t.art instanceof Phaser.GameObjects.Image) {
          const img = t.art;
          img.setTintFill(0xffffff);
          this.time.delayedCall(70, () => img.clearTint());
        }
        this.drawBar(t);
        break;
      }
      case "HealingApplied": {
        const t = vis(d.targetId); if (!t) break;
        t.hp = Math.min(t.def.maxHp, t.hp + Number(d.amount ?? 0));
        this.floater(t.cont.x, t.cont.y - 74, `+${d.amount}`, "#8fd96a", 15.5, instant);
        this.drawBar(t);
        break;
      }
      case "ShieldApplied": {
        const t = vis(d.targetId); if (!t) break;
        t.shield += Number(d.amount ?? 0);
        this.floater(t.cont.x, t.cont.y - 74, `Khiên +${d.amount}`, "#e8e4d8", 13.5, instant);
        this.drawBar(t);
        break;
      }
      case "StatusApplied": {
        const t = vis(d.targetId); if (!t) break;
        const kind = String(d.status);
        t.statuses.set(kind, e.tick + Number(d.durationTicks ?? 0));
        this.drawChips(t);
        break;
      }
      case "ReactionTriggered": {
        const t = vis(d.targetId); const s = vis(d.sourceId);
        if (s) { s.energy = Math.min(100, s.energy + 12); this.drawBar(s); }
        if (t) this.floater(t.cont.x, t.cont.y - 100, String(d.name), "#ff7043", 19, instant);
        break;
      }
      case "UnitDefeated": {
        const v = vis(d.unitId); if (!v) break;
        v.dead = true; v.hp = 0;
        v.bar.clear();
        if (!instant) {
          this.tweens.add({ targets: v.cont, alpha: 0.22, duration: 350 });
          this.tweens.add({ targets: v.cont, scaleX: 0.92, scaleY: 0.92, duration: 350 });
        } else { v.cont.setAlpha(0.22); v.cont.setScale(0.92); }
        break;
      }
      case "BattleCompleted": {
        this.done = true;
        const show = () => this.showResult();
        if (instant) show(); else this.time.delayedCall(900, show);
        break;
      }
    }
  }

  private isUlt(v: UnitVis, d: Record<string, unknown>): boolean {
    // An ultimate is exactly the creature's third skill (slot 3, energyCost
    // 100) in game-data. (An earlier energy-mirror heuristic drifted from
    // the engine and fired cut-ins on ordinary skills — use the kit.)
    return skillsOf(v.def.creatureId)[2]?.name === String(d.skill);
  }

  /* -------- ultimate cut-in (research note: docs/PHASE4-COMBAT-v1.md) ----
   * Genre pattern (Persona / Epic Seven / Honkai: Star Rail): freeze the
   * fight, dim the world, splash art sweeps in over letterbox bars, the
   * skill name lands, a white flash releases back into the real hit.
   * Kept short (~1.5 s at x1) and tap-to-skip so it never becomes a toll. */
  private startCutin(v: UnitVis, skillName: string): void {
    if (this.cutinCont || this.cutinEl) this.endCutin();
    const vidSrc = ULT_VIDEO[v.def.creatureId];
    if (vidSrc) { this.startVideoCutin(v, skillName, vidSrc); return; }
    const dur = this.speed >= 2 ? 1000 : 1500;
    this.cutinUntil = this.time.now + dur;
    (window as unknown as Record<string, unknown>).__cutin = skillName;
    const hex = ELEMENT_CSS[v.def.element] ?? "#ffb347";
    const col = Phaser.Display.Color.HexStringToColor(hex).color;
    const cont = this.add.container(0, 0).setDepth(9000);
    this.cutinCont = cont;

    const dim = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0).setDepth(0);
    cont.add(dim);
    this.tweens.add({ targets: dim, fillAlpha: 0.5, duration: 160 });

    const key = `ult_${v.def.creatureId}`;
    if (this.textures.exists(key)) {
      const art = this.add.image(640, 360, key).setDepth(1);
      const sc = Math.max(1280 / art.width, 720 / art.height);
      art.setScale(sc * 1.09);
      cont.add(art);
      this.tweens.add({ targets: art, scaleX: sc, scaleY: sc, duration: dur, ease: "Quad.easeOut" });
    } else {
      const band = this.add.rectangle(640, 360, 1280, 360, col, 0.28).setDepth(1);
      const glow = this.add.circle(905, 360, 190, col, 0.35).setDepth(1);
      cont.add([band, glow]);
      const tex = `cr_${v.def.creatureId}`;
      if (this.textures.exists(tex)) {
        const big = this.add.image(905, 368, tex).setDepth(2);
        big.setDisplaySize(320 * (big.width / Math.max(1, big.height)), 320);
        if (v.def.team === 1) big.setFlipX(true);
        cont.add(big);
        this.tweens.add({ targets: big, scaleX: big.scaleX * 1.06, scaleY: big.scaleY * 1.06, duration: dur, ease: "Quad.easeOut" });
      }
    }

    const barT = this.add.rectangle(640, -43, 1280, 86, 0x000000, 1).setDepth(3);
    const barB = this.add.rectangle(640, 763, 1280, 86, 0x000000, 1).setDepth(3);
    cont.add([barT, barB]);
    this.tweens.add({ targets: barT, y: 43, duration: 220, ease: "Quad.easeOut" });
    this.tweens.add({ targets: barB, y: 677, duration: 220, ease: "Quad.easeOut" });

    const who = this.add.text(74, 514, v.def.name.toUpperCase(), {
      fontFamily: "\"Baloo 2\", sans-serif", fontSize: "21px", color: "#ffd94a", fontStyle: "bold",
    }).setDepth(4).setAlpha(0);
    const skill = this.add.text(70, 540, skillName.toUpperCase(), {
      fontFamily: "\"Baloo 2\", sans-serif", fontSize: "56px", color: "#ffffff", fontStyle: "bold",
    }).setDepth(4).setAlpha(0);
    skill.setStroke("#1c0e02", 8).setShadow(0, 4, "rgba(0,0,0,.55)", 10);
    const rule = this.add.rectangle(74, 536, 0, 3, 0xd4a437, 1).setOrigin(0, 0.5).setDepth(4);
    cont.add([who, skill, rule]);
    this.tweens.add({ targets: [who, skill], alpha: 1, x: "+=14", delay: 190, duration: 240, ease: "Quad.easeOut" });
    this.tweens.add({ targets: rule, width: 340, delay: 190, duration: 300, ease: "Quad.easeOut" });

    for (let i = 0; i < 24; i++) {
      const sp = this.add.circle(880 + (Math.random() - 0.5) * 220, 380 + (Math.random() - 0.5) * 200,
        2 + Math.random() * 3, i % 3 === 0 ? 0xffffff : col, 0.95).setDepth(5);
      cont.add(sp);
      this.tweens.add({
        targets: sp, x: sp.x + (Math.random() - 0.5) * 460, y: sp.y - 60 - Math.random() * 180,
        alpha: 0, duration: 620 + Math.random() * 480, delay: 120 + Math.random() * 260, ease: "Quad.easeOut",
      });
    }

    const flash = this.add.rectangle(640, 360, 1280, 720, 0xffffff, 0).setDepth(6);
    cont.add(flash);
    this.tweens.add({ targets: flash, fillAlpha: 0.8, delay: dur - 240, duration: 90, yoyo: true, onComplete: () => this.endCutin() });

    this.input.once("pointerdown", () => this.endCutin());
  }

  /** Animated cut-in: full-screen ultimate video (DOM layer above the
   * canvas), letterbox bars + title, white flash into the real hit.
   * Tap anywhere to skip. Full length at x1, 1.5x rate at x2. */
  private startVideoCutin(v: UnitVis, skillName: string, src: string): void {
    const slot = this.overlay?.querySelector("#bt-cutin-slot");
    if (!slot) return;
    const rate = this.speed >= 2 ? 1.5 : 1;
    this.cutinUntil = this.time.now + 3100 / rate;
    (window as unknown as Record<string, unknown>).__cutin = skillName;
    const poster = ULT_ART[v.def.creatureId];
    const el = document.createElement("div");
    el.className = "bt-cutin";
    el.innerHTML = `
      <video src="${src}" ${poster ? `poster="${poster}"` : ""} autoplay muted playsinline></video>
      <div class="bar t"></div><div class="bar b"></div>
      <div class="ttl">
        <div class="who">${v.def.name.toUpperCase()}</div>
        <div class="rule"></div>
        <div class="skill">${skillName.toUpperCase()}</div>
      </div>
      <div class="flash"></div>`;
    slot.appendChild(el);
    this.cutinEl = el;
    const video = el.querySelector("video") as HTMLVideoElement;
    video.playbackRate = rate;
    void video.play().catch(() => undefined);
    const flash = el.querySelector(".flash") as HTMLElement;
    video.addEventListener("ended", () => {
      flash.style.transition = "opacity .12s";
      flash.style.opacity = "0.85";
      window.setTimeout(() => this.endCutin(), 110);
    });
    el.addEventListener("pointerdown", () => this.endCutin());
  }

  private endCutin(): void {
    if (this.cutinCont) { this.cutinCont.destroy(); this.cutinCont = undefined; }
    if (this.cutinEl) { this.cutinEl.remove(); this.cutinEl = undefined; }
    this.cutinUntil = 0;
    delete (window as unknown as Record<string, unknown>).__cutin;
  }

  private showResult(): void {
    if (!this.resultEl || !this.overlay) return;
    const w = this.battle.winner;
    const title = this.overlay.querySelector("#bt-title") as HTMLElement;
    const sub = this.overlay.querySelector("#bt-sub") as HTMLElement;
    title.textContent = w === 0 ? "THẮNG!" : w === 1 ? "THUA" : "HOÀ";
    title.style.color = w === 0 ? "#ffd94a" : w === 1 ? "#ff9a8a" : "#e8c96a";
    sub.textContent = `Trận đấu ${(this.battle.ticks / 10).toFixed(1)} giây · Mã xác thực ${this.battle.hash.slice(0, 8)}`;
    if (this.statusEl) this.statusEl.textContent = "Đã kết thúc";
    this.resultEl.hidden = false;
  }
}
