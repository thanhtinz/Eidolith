// BattleScene — Phase 4 playback of a server-run battle (Part 7 §17).
// The server simulates with combat-core; this scene only plays the event
// stream: movement, hits, damage numbers, statuses, reactions, result.
// HP/energy shown here mirror the engine's own rules from the same events.
import Phaser from "phaser";
import type { BattleResponse, BattleTeamUnit } from "@eidolith/shared-types";
import { network } from "../net/NetworkManager";
import { skillsOf, creatureById } from "@eidolith/game-data";
import { sfxUlt, sfxSting, sfxHit, sfxHeal, sfxDefeat, sfxEnd } from "../ui/sfx";

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

/** Ultimate splash art, keyed by creature id. On an ult the splash
 * flashes up briefly, vanishes, and the caster's in-arena VFX erupts.
 * Species without an entry skip the flash and go straight to the VFX. */
const ULT_ART: Record<string, string> = {
  "EID-001": "assets/battle/ult-eid-001-v2.png",
  "EID-002": "assets/battle/ult-eid-002-v1.png",
  "EID-003": "assets/battle/ult-eid-003-v1.png",
  "EID-004": "assets/battle/ult-eid-004-v1.png",
  "EID-005": "assets/battle/ult-eid-005-v1.png",
  "EID-006": "assets/battle/ult-eid-006-v1.png",
  "EID-011": "assets/battle/ult-eid-011-v1.png",
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
  private splashUntil = 0;
  private splashCont?: Phaser.GameObjects.Container;
  private fxObjs: Phaser.GameObjects.GameObject[] = [];
  private fxUnit?: UnitVis;
  private fxBaseDepth = 0;
  private fxArtBase?: { sx: number; sy: number };

  constructor() { super("Battle"); }

  init(data: { battle: BattleResponse; teamIds: string[] }): void {
    this.battle = data.battle;
    this.teamIds = data.teamIds ?? [];
    this.units = new Map(); this.evIdx = 0; this.playTick = 0; this.done = false; this.speed = 1;
    this.splashUntil = 0; this.splashCont = undefined; this.fxObjs = []; this.fxUnit = undefined;
  }

  preload(): void {
    this.load.image("arena_bg", "assets/battle/arena-v1.png");
    for (const def of this.battle.teams) {
      const art = ULT_ART[def.creatureId];
      if (art) this.load.image(`ult_${def.creatureId}`, art);
    }
  }

  create(): void {
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
    const bossK = def.creatureId === "EID-B01" ? 1.75 : 1;
    const shadow = this.add.ellipse(0, 26, 52 * bossK, 14 * bossK, 0x000000, 0.3);
    const ring = this.add.ellipse(0, 26, 56 * bossK, 16 * bossK, def.team === 0 ? 0x3fa7c4 : 0xc0392b, 0.55);
    cont.add([shadow, ring]);
    let art: UnitVis["art"] = null;
    const key = `cr_${def.creatureId}`;
    const bossScale = bossK; // boss presence (Phase 5b)
    if (this.textures.exists(key)) {
      const img = this.add.image(0, -6, key);
      const h = 68 * bossScale; img.setDisplaySize(h * (img.width / Math.max(1, img.height)), h);
      this.tweens.add({ targets: img, y: -3, duration: 850 + (Number(def.unitId.split("-")[1] ?? 0)) * 130, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      if (def.team === 1) img.setFlipX(true);
      cont.add(img); art = img;
    } else {
      const circle = this.add.circle(0, -6, 30 * bossScale, Phaser.Display.Color.HexStringToColor(ELEMENT_CSS[def.element] ?? "#888888").color, 0.9);
      const letter = this.add.text(0, -6, def.name.charAt(0), { fontSize: `${Math.round(26 * bossScale)}px`, color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
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
        .bt-root{position:relative;width:1280px;height:720px;font-family:'Be Vietnam Pro',system-ui,sans-serif;color:#f4f7fa;pointer-events:none}
        .bt-top{position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;gap:8px;align-items:center;pointer-events:auto}
        .bt-pill{background:rgba(27,33,43,.93);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:7px 16px;font-size:15px;box-shadow:0 6px 16px rgba(0,0,0,.4);white-space:nowrap}
        .bt-pill b{font-family:'Baloo 2',sans-serif;color:#ffd83d;letter-spacing:.6px}
        .bt-btn{cursor:pointer;color:#f4f7fa;font-weight:700}
        .bt-btn.on{background:#ffd83d;color:#26303a;border-color:#ffd83d}
        .bt-result{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:430px;background:rgba(27,33,43,.97);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:26px 28px;text-align:center;pointer-events:auto;box-shadow:0 24px 70px rgba(0,0,0,.6)}
        .bt-result h2{font-family:'Baloo 2',sans-serif;font-size:34px;margin:0 0 6px;color:#ffd83d}
        .bt-result p{margin:4px 0 14px;color:#aeb9c4;font-size:15.5px}
        .bt-result .row{display:flex;gap:10px}
        .bt-result button{flex:1;padding:13px;border:none;border-radius:12px;font-size:16.5px;font-weight:700;cursor:pointer;font-family:'Baloo 2',sans-serif}
        .bt-again{background:#ffd83d;color:#26303a}
        .bt-exit{background:rgba(255,255,255,.06);color:#f4f7fa;border:1px solid rgba(255,255,255,.16) !important}
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
        <div class="bt-result" id="bt-result" hidden>
          <h2 id="bt-title">THẮNG</h2>
          <p id="bt-sub"></p>
          <p id="bt-rewards" style="color:#ffd83d;font-size:16px;min-height:22px"></p>
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
    if (this.time.now < this.splashUntil) return; // ult splash on stage: time stops
    if (!this.done) {
      this.playTick += (delta / 100) * this.speed;
      const upto = Math.floor(this.playTick);
      while (this.evIdx < this.battle.events.length && this.battle.events[this.evIdx].tick <= upto) {
        this.process(this.battle.events[this.evIdx], false);
        this.evIdx++;
        if (this.time.now < this.splashUntil) break; // an ult splash just started
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
    this.endSplash(); this.endFx();
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
          if (isUlt && !instant && this.speed <= 2) this.startSplash(v, String(d.skill));
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
        if (!instant) { sfxHit(crit); this.impactFx(t, String(d.element), crit); }
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
        if (!instant) sfxHeal();
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
          sfxDefeat();
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
    // the engine and fired effects on ordinary skills — use the kit.)
    return skillsOf(v.def.creatureId)[2]?.name === String(d.skill);
  }

  /* -------- ultimate presentation: splash flash -> in-arena VFX --------
   * Tin's flow (2026-11-11): the ult's splash art flashes up briefly,
   * vanishes — and at that exact moment the casting monster's own VFX
   * erupts in the arena (element glow, light pillar, particle burst,
   * pop + skill banner, camera shake) while the hit lands, with a
   * synthesized element sound (ui/sfx.ts). The splash freezes playback
   * for ~0.75s; the VFX itself does not freeze anything. */
  private startSplash(v: UnitVis, skillName: string): void {
    this.endSplash(); this.endFx();
    const key = `ult_${v.def.creatureId}`;
    const hasArt = this.textures.exists(key);
    const dur = hasArt ? (this.speed >= 2 ? 500 : 750) : 420;
    this.splashUntil = this.time.now + dur;
    (window as unknown as Record<string, unknown>).__ultFx = skillName;
    sfxSting();
    if (hasArt) {
      const cont = this.add.container(0, 0).setDepth(9000);
      this.splashCont = cont;
      cont.add(this.add.rectangle(640, 360, 1280, 720, 0x000000, 1));
      const img = this.add.image(640, 360, key).setScale(1.07);
      cont.add(img);
      this.tweens.add({ targets: img, scale: 1.0, duration: dur, ease: "Quad.easeOut" });
      const barT = this.add.rectangle(640, -43, 1280, 86, 0x000000, 1);
      const barB = this.add.rectangle(640, 763, 1280, 86, 0x000000, 1);
      cont.add([barT, barB]);
      this.tweens.add({ targets: barT, y: 43, duration: 240, ease: "Quad.easeOut" });
      this.tweens.add({ targets: barB, y: 677, duration: 240, ease: "Quad.easeOut" });
      const who = this.add.text(70, 514, v.def.name.toUpperCase(), {
        fontFamily: "'Baloo 2', sans-serif", fontSize: "21px", fontStyle: "bold", color: "#ffd94a",
      });
      who.setLetterSpacing?.(1.5);
      const rule = this.add.rectangle(70, 536, 340, 3, 0xd4a437, 1).setOrigin(0, 0.5);
      const skill = this.add.text(70, 540, skillName.toUpperCase(), {
        fontFamily: "'Baloo 2', sans-serif", fontSize: "56px", fontStyle: "bold", color: "#ffffff",
        stroke: "#1c0e02", strokeThickness: 6,
      });
      who.setAlpha(0); rule.setAlpha(0); skill.setAlpha(0);
      cont.add([who, rule, skill]);
      this.tweens.add({ targets: [who, rule, skill], alpha: 1, duration: 160, delay: 90 });
    }
    this.time.delayedCall(dur, () => this.releaseUlt(v, skillName));
    if (hasArt) this.input.once("pointerdown", () => this.releaseUlt(v, skillName));
  }

  /** The splash vanishes; the caster's VFX erupts and the hit lands. */
  private releaseUlt(v: UnitVis, skillName: string): void {
    if (this.splashUntil === 0 && !this.splashCont) return; // already released (tap-skip race)
    if (this.splashCont) {
      const flash = this.add.rectangle(640, 360, 1280, 720, 0xffffff, 0.85).setDepth(9500);
      this.tweens.add({ targets: flash, alpha: 0, duration: 130, onComplete: () => flash.destroy() });
    }
    this.endSplash();
    (window as unknown as Record<string, unknown>).__ultRelease = skillName;
    this.spotlightFx(v, skillName);
  }

  /* Ordinary-hit impact (Part 15 impact layer): a short element burst
   * + ring at the target, so non-ult hits read as physical contact,
   * not just a floating number. Crits burst bigger and gold-white. */
  private impactFx(t: UnitVis, element: string, crit: boolean): void {
    const css = crit ? "#ffd94a" : ELEMENT_CSS[element] ?? "#ffffff";
    const color = Phaser.Display.Color.HexStringToColor(css).color;
    const x = t.cont.x, y = t.cont.y - 26;
    const n = crit ? 10 : 6;
    for (let i = 0; i < n; i++) {
      const p = this.add.circle(x, y, crit ? 3.4 : 2.6, i % 3 === 0 ? 0xffffff : color, 1).setDepth(455);
      const ang = Math.random() * Math.PI * 2, dist = (crit ? 46 : 32) + Math.random() * (crit ? 40 : 26);
      this.tweens.add({ targets: p, x: x + Math.cos(ang) * dist, y: y + Math.sin(ang) * dist * 0.7 - 6, alpha: 0, scale: 0.3, duration: 240 + Math.random() * 160, ease: "Quad.easeOut", onComplete: () => p.destroy() });
    }
    const ring = this.add.circle(x, y + 8, 12, color, 0).setDepth(454);
    ring.setStrokeStyle(2, color, 0.85);
    this.tweens.add({ targets: ring, scale: crit ? 2.5 : 1.8, alpha: 0, duration: 260, ease: "Quad.easeOut", onComplete: () => ring.destroy() });
  }

  private spotlightFx(v: UnitVis, skillName: string): void {
    sfxUlt(v.def.element);
    const css = ELEMENT_CSS[v.def.element] ?? "#ffd94a";
    const color = Phaser.Display.Color.HexStringToColor(css).color;
    const x = v.cont.x, y = v.cont.y;
    this.fxUnit = v; this.fxBaseDepth = v.cont.depth;
    v.cont.setDepth(460);
    const dur = 700;
    const track = <T extends Phaser.GameObjects.GameObject>(o: T): T => { this.fxObjs.push(o); return o; };
    const dim = track(this.add.rectangle(640, 360, 1280, 720, 0x04060a, 0).setDepth(400));
    this.tweens.add({ targets: dim, fillAlpha: 0.34, duration: 110 });
    this.tweens.add({ targets: dim, fillAlpha: 0, delay: dur - 220, duration: 220, onComplete: () => this.endFx() });
    const pillar = track(this.add.rectangle(x, y - 190, 58, 470, color, 0.16).setDepth(448));
    pillar.setScale(1, 0.1);
    this.tweens.add({ targets: pillar, scaleY: 1, alpha: 0, duration: dur, ease: "Quad.easeOut" });
    const glow = track(this.add.circle(x, y - 4, 62, color, 0.3).setDepth(449));
    glow.setScale(0.4);
    this.tweens.add({ targets: glow, scale: 1.25, alpha: 0, duration: dur, ease: "Quad.easeOut" });
    const ring = track(this.add.circle(x, y + 22, 30, color, 0).setDepth(449));
    ring.setStrokeStyle(3, color, 0.9);
    this.tweens.add({ targets: ring, scale: 3.1, alpha: 0, duration: 620, ease: "Quad.easeOut" });
    for (let i = 0; i < 26; i++) {
      const p = track(this.add.circle(x, y - 8, 2.5 + Math.random() * 3, i % 4 === 0 ? 0xffffff : color, 1).setDepth(455));
      const ang = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 110;
      this.tweens.add({ targets: p, x: x + Math.cos(ang) * dist, y: y - 8 + Math.sin(ang) * dist - 22, alpha: 0, scale: 0.3, duration: 480 + Math.random() * 300, ease: "Quad.easeOut" });
    }
    if (v.art) {
      this.fxArtBase = { sx: v.art.scaleX, sy: v.art.scaleY };
      this.tweens.add({ targets: v.art, scaleX: this.fxArtBase.sx * 1.3, scaleY: this.fxArtBase.sy * 1.3, duration: 170, yoyo: true, ease: "Quad.easeOut" });
    }
    this.tweens.add({ targets: v.cont, y: y - 12, duration: 170, yoyo: true, ease: "Quad.easeOut" });
    const banner = track(this.add.text(x, y - 104, skillName.toUpperCase(), {
      fontFamily: "'Baloo 2', sans-serif", fontSize: "29px", fontStyle: "bold",
      color: css, stroke: "#160d03", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(470));
    banner.setScale(0.5); banner.setAlpha(0);
    this.tweens.add({ targets: banner, scale: 1.05, alpha: 1, y: y - 114, duration: 170, ease: "Back.easeOut" });
    this.tweens.add({ targets: banner, alpha: 0, delay: dur - 200, duration: 190 });
    this.cameras.main.shake(130, 0.0032);
  }

  private endSplash(): void {
    if (this.splashCont) { this.splashCont.destroy(); this.splashCont = undefined; }
    this.splashUntil = 0;
    delete (window as unknown as Record<string, unknown>).__ultFx;
  }

  private endFx(): void {
    for (const o of this.fxObjs) { this.tweens.killTweensOf(o); o.destroy(); }
    this.fxObjs = [];
    if (this.fxUnit) {
      if (this.fxUnit.art && this.fxArtBase) this.fxUnit.art.setScale(this.fxArtBase.sx, this.fxArtBase.sy);
      this.fxUnit.cont.setDepth(this.fxBaseDepth);
      this.fxUnit = undefined; this.fxArtBase = undefined;
    }
    delete (window as unknown as Record<string, unknown>).__ultRelease;
  }

  private showResult(): void {
    if (!this.resultEl || !this.overlay) return;
    const w = this.battle.winner;
    sfxEnd(w === 0 ? true : w === 1 ? false : null);
    const title = this.overlay.querySelector("#bt-title") as HTMLElement;
    const sub = this.overlay.querySelector("#bt-sub") as HTMLElement;
    title.textContent = w === 0 ? "THẮNG!" : w === 1 ? "THUA" : "HOÀ";
    title.style.color = w === 0 ? "#ffd83d" : w === 1 ? "#ff9a8a" : "#f4f7fa";
    sub.textContent = `Trận đấu ${(this.battle.ticks / 10).toFixed(1)} giây · Mã xác thực ${this.battle.hash.slice(0, 8)}`;
    const rw = this.overlay.querySelector("#bt-rewards") as HTMLElement | null;
    if (rw && this.battle.rewards) {
      const r = this.battle.rewards;
      const ups = r.levelUps.map(u => `${creatureById(u.creatureId)?.name ?? u.creatureId} lên Lv.${u.level}`).join(" · ");
      rw.textContent = `+${r.gold} Gold · Đội +${r.creatureXp} XP · Bạn +${r.playerXp} XP`
        + (r.evolutionCore ? " · +1 Evolution Core" : "") + (ups ? ` · ${ups}!` : "") + (r.playerLeveledUp ? ` · Bạn lên Lv.${r.playerLevel}!` : "");
    } else if (rw) {
      rw.textContent = "Trận giao hữu — không tính thưởng";
    }
    if (this.statusEl) this.statusEl.textContent = "Đã kết thúc";
    this.resultEl.hidden = false;
  }
}
