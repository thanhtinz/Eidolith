// BattleScene — Phase 4 playback of a server-run battle (Part 7 §17).
// The server simulates with combat-core; this scene only plays the event
// stream: movement, hits, damage numbers, statuses, reactions, result.
// HP/energy shown here mirror the engine's own rules from the same events.
import Phaser from "phaser";
import type { BattleResponse, BattleTeamUnit } from "@eidolith/shared-types";
import { network } from "../net/NetworkManager";

const TILE = 72, OX = 64;
const sx = (x: number) => OX + x * TILE;
const sy = (y: number) => y * TILE;
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

  constructor() { super("Battle"); }

  init(data: { battle: BattleResponse; teamIds: string[] }): void {
    this.battle = data.battle;
    this.teamIds = data.teamIds ?? [];
    this.units = new Map(); this.evIdx = 0; this.playTick = 0; this.done = false; this.speed = 1;
  }

  create(): void {
    this.drawArena();
    for (const def of this.battle.teams) this.makeUnit(def);
    this.mountOverlay();
    this.events.once("shutdown", () => this.unmountOverlay());
  }

  private drawArena(): void {
    const g = this.add.graphics();
    g.fillStyle(0x141c10, 1).fillRect(0, 0, 1280, 720);
    for (let x = 0; x < 16; x++) for (let y = 0; y < 10; y++) {
      g.fillStyle((x + y) % 2 === 0 ? 0x3d5c26 : 0x38531f, 1).fillRect(OX + x * TILE, y * TILE, TILE, TILE);
    }
    g.lineStyle(3, 0xd4a437, 0.85).strokeRect(OX, 0, 16 * TILE, 720);
    g.lineStyle(2, 0xffffff, 0.14).lineBetween(640, 8, 640, 712);
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
      const h = 92; img.setDisplaySize(h * (img.width / Math.max(1, img.height)), h);
      if (def.team === 1) img.setFlipX(true);
      cont.add(img); art = img;
    } else {
      const circle = this.add.circle(0, -6, 30, Phaser.Display.Color.HexStringToColor(ELEMENT_CSS[def.element] ?? "#888888").color, 0.9);
      const letter = this.add.text(0, -6, def.name.charAt(0), { fontSize: "26px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
      cont.add([circle, letter]); art = circle;
    }
    const name = this.add.text(0, -64, `${def.name} · Lv.${def.level}`, {
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
    if (!this.done) {
      this.playTick += (delta / 100) * this.speed;
      const upto = Math.floor(this.playTick);
      while (this.evIdx < this.battle.events.length && this.battle.events[this.evIdx].tick <= upto) {
        this.process(this.battle.events[this.evIdx], false);
        this.evIdx++;
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
          this.floater(v.cont.x, v.cont.y - 84, String(d.skill), isUlt ? "#ffd94a" : "#f7ead0", isUlt ? 20 : 14.5, instant);
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
          this.tweens.add({ targets: v.cont, alpha: 0.35, duration: 350 });
        } else { v.cont.setAlpha(0.35); }
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
    // Ultimates are the creature's third skill name; the scene doesn't carry
    // the kit, so detect by energy: engine spends a full bar on ults — the
    // playback mirrors energy, and an ult cast is the one taken at 100.
    void d;
    return v.energy >= 100;
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
