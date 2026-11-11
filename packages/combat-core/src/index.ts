// Combat core — Combat Part 7: deterministic 5v5 auto battle, fixed timestep
// 10 ticks/s, seeded RNG, server-authoritative. Pure TypeScript: no Phaser,
// no DOM (TDD Part 4 §3.2). The engine only simulates and emits presentation
// events (§17.3); it never touches animation or audio (§17.1).
// Balance numbers live in combat-config.ts; formulas follow Part 7 §12.
import { SeededRng, fnv1a } from "@eidolith/math-utils";
import {
  creatureById, skillsOf, statsAtLevel, elementMultiplier,
  ELEMENT_STATUS, HOSTILE_STATUSES, REACTIONS,
  type SkillDefinition, type StatusKind,
} from "@eidolith/game-data";
import type { CombatRole, ElementType } from "@eidolith/shared-types";
import { COMBAT, AI_PROFILES, ROLE_AI_PROFILE, ROLE_PRIORITY } from "./combat-config.js";

export { COMBAT } from "./combat-config.js";
export const TICKS_PER_SECOND = 10;
export const TICK_MS = 1000 / TICKS_PER_SECOND;

export interface BattleUnitInit {
  unitId: string; team: 0 | 1; slot: number;
  creatureId: string; name: string; element: ElementType; role: CombatRole;
  level: number; maxHp: number; atk: number; def: number; spd: number;
}
export function buildUnitInit(unitId: string, creatureId: string, level: number, team: 0 | 1, slot: number): BattleUnitInit {
  const def = creatureById(creatureId);
  if (!def) throw new Error(`unknown creature ${creatureId}`);
  const st = statsAtLevel(def, level);
  st.hp = Math.round(st.hp * COMBAT.HP_SCALE);
  return {
    unitId, team, slot, creatureId, name: def.name, element: def.element, role: def.role,
    level, maxHp: st.hp, atk: st.atk, def: st.def, spd: st.spd,
  };
}

export interface BattleEvent { tick: number; type: string; data: Record<string, unknown>; }
export interface BattleResult { winner: 0 | 1 | 2; ticks: number; hash: string; events: BattleEvent[]; }

interface StatusInstance { kind: StatusKind; stacks: number; ticksLeft: number; sourceId: string; }
interface UnitRt {
  init: BattleUnitInit; alive: boolean;
  x: number; y: number; hp: number; shield: number;
  energy: number; cooldowns: number[]; basicTimer: number;
  statuses: StatusInstance[]; targetId: string | null; retargetAt: number;
  threatDealt: number; lastMoveEmit: number; reactedTick: number;
  reactionReadyAt: Map<string, number>;
}

const STATUS_ELEMENT: Partial<Record<StatusKind, ElementType>> =
  Object.fromEntries(Object.entries(ELEMENT_STATUS).map(([el, st]) => [st, el as ElementType])) as Partial<Record<StatusKind, ElementType>>;
const SPAWN_Y = [5, 3.4, 6.6, 1.8, 8.2];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

type Action =
  | { kind: "skill"; skill: SkillDefinition; target: UnitRt }
  | { kind: "basic"; target: UnitRt };

export class BattleEngine {
  readonly rng: SeededRng;
  tick = 0;
  readonly events: BattleEvent[] = [];
  readonly units: UnitRt[] = [];
  finished = false;
  winner: 0 | 1 | 2 = 2;
  private byId = new Map<string, UnitRt>();

  constructor(seed: number, units: BattleUnitInit[]) {
    this.rng = new SeededRng(seed);
    for (const init of units) {
      const rt: UnitRt = {
        init, alive: true,
        x: init.team === 0 ? 3 : COMBAT.ARENA_W - 3, y: SPAWN_Y[init.slot] ?? 5,
        hp: init.maxHp, shield: 0, energy: 0,
        cooldowns: [0, 0, 0], basicTimer: 0,
        statuses: [], targetId: null, retargetAt: 0,
        threatDealt: 0, lastMoveEmit: -99, reactedTick: -1,
        reactionReadyAt: new Map(),
      };
      this.units.push(rt);
      this.byId.set(init.unitId, rt);
      this.emit("UnitSpawned", { unitId: init.unitId, x: rt.x, y: rt.y });
    }
  }

  private emit(type: string, data: Record<string, unknown>): void {
    this.events.push({ tick: this.tick, type, data });
  }
  private foes(u: UnitRt): UnitRt[] { return this.units.filter(o => o.alive && o.init.team !== u.init.team); }
  private allies(u: UnitRt): UnitRt[] { return this.units.filter(o => o.alive && o.init.team === u.init.team); }
  private has(u: UnitRt, kind: StatusKind): boolean { return u.statuses.some(s => s.kind === kind && s.ticksLeft > 0); }
  private fatigueMult(): number {
    if (this.tick <= COMBAT.FATIGUE_START_TICKS) return 1;
    return 1 + COMBAT.FATIGUE_PCT_PER_SEC * Math.floor((this.tick - COMBAT.FATIGUE_START_TICKS) / TICKS_PER_SECOND);
  }
  private effAtk(u: UnitRt): number {
    let a = u.init.atk;
    if (this.has(u, "Weakness")) a *= COMBAT.WEAKNESS_ATK_MULT;
    if (this.has(u, "Empowerment")) a *= COMBAT.EMPOWER_ATK_MULT;
    return a;
  }
  private effDef(u: UnitRt): number { return u.init.def * (this.has(u, "DefenseUp") ? COMBAT.DEFENSE_UP_DEF_MULT : 1); }
  private effSpd(u: UnitRt): number { return u.init.spd * (this.has(u, "Shock") ? COMBAT.SHOCK_SLOW : 1); }
  private basicInterval(u: UnitRt): number { return Math.max(4, Math.round(COMBAT.BASIC_BASE_TICKS * 15 / this.effSpd(u))); }

  /* ---------------- main loop ---------------- */

  step(): void {
    if (this.finished) return;
    this.tick++;
    for (const u of this.units) {
      u.cooldowns = u.cooldowns.map(c => Math.max(0, c - 1));
      u.basicTimer = Math.max(0, u.basicTimer - 1);
      u.threatDealt *= 0.98;
    }
    this.statusPhase();
    for (const u of this.units) if (u.alive) this.retarget(u);
    for (const u of this.units) if (u.alive) this.act(u);
    this.separate();
    this.checkEnd();
  }

  run(maxTicks = COMBAT.MAX_TICKS): BattleResult {
    while (!this.finished && this.tick < maxTicks) this.step();
    if (!this.finished) this.finishByTimeout();
    return { winner: this.winner, ticks: this.tick, hash: this.resultHash(), events: this.events };
  }
  resultHash(): string { return fnv1a(JSON.stringify(this.events)).toString(16); }

  private statusPhase(): void {
    for (const u of this.units) {
      if (!u.alive) continue;
      for (const st of u.statuses) {
        if (st.ticksLeft <= 0) continue;
        st.ticksLeft--;
        if (this.tick % TICKS_PER_SECOND === 0) {
          const dot = COMBAT.DOT_PER_SECOND[st.kind];
          if (dot) {
            const amount = Math.round(u.init.maxHp * dot * st.stacks);
            this.rawDamage(this.byId.get(st.sourceId) ?? null, u, amount, "StatusApplied");
          } else if (st.kind === "Regeneration" && u.alive) {
            this.heal(u, u, Math.round(u.init.maxHp * COMBAT.REGEN_PER_SECOND), null);
          }
        }
      }
      u.statuses = u.statuses.filter(s => s.ticksLeft > 0);
    }
  }

  /* ---------------- AI (Part 7 §8) ---------------- */

  private retarget(u: UnitRt): void {
    const cur = u.targetId ? this.byId.get(u.targetId) : undefined;
    if (this.tick < u.retargetAt && cur?.alive) return;
    u.retargetAt = this.tick + COMBAT.RETARGET_EVERY;
    const foes = this.foes(u);
    if (!foes.length) return;
    const profile = AI_PROFILES[ROLE_AI_PROFILE[u.init.role]];
    const prio = ROLE_PRIORITY[ROLE_AI_PROFILE[u.init.role]];
    const maxThreat = Math.max(1, ...foes.map(f => f.threatDealt));
    let best: UnitRt | null = null; let bestScore = -Infinity;
    for (const f of foes) {
      const vuln = clamp(
        (elementMultiplier(u.init.element, f.init.element) === 1.25 ? 1 : elementMultiplier(u.init.element, f.init.element) === 0.8 ? 0 : 0.5)
        + (this.has(f, "Weakness") || this.has(f, "Freeze") ? 0.3 : 0), 0, 1.3);
      const score =
        profile.threat * (f.threatDealt / maxThreat) +
        profile.lowHp * (1 - f.hp / f.init.maxHp) +
        profile.distance * (1 - Math.min(dist(u, f), 12) / 12) +
        profile.role * prio[f.init.role] +
        profile.vuln * vuln;
      if (score > bestScore) { bestScore = score; best = f; }
    }
    if (best && best.init.unitId !== u.targetId) {
      u.targetId = best.init.unitId;
      this.emit("UnitTargetChanged", { unitId: u.init.unitId, targetId: u.targetId });
    }
  }

  private lowestAlly(u: UnitRt): UnitRt | null {
    let best: UnitRt | null = null;
    for (const a of this.allies(u)) if (!best || a.hp / a.init.maxHp < best.hp / best.init.maxHp) best = a;
    return best;
  }

  private chooseAction(u: UnitRt): Action | null {
    const skills = skillsOf(u.init.creatureId);
    if (skills.length !== 3) return null;
    const [s1, s2, ult] = skills;
    const foe = u.targetId ? this.byId.get(u.targetId) : undefined;
    const foeOk = foe?.alive && foe.init.team !== u.init.team ? foe : undefined;
    const low = this.lowestAlly(u);

    if (u.energy >= COMBAT.ENERGY_MAX) {
      if (ult.kind === "heal") {
        const hurt = this.allies(u).filter(a => a.hp / a.init.maxHp < 0.6);
        if (hurt.length >= 2) return { kind: "skill", skill: ult, target: u };
      } else if (foeOk) {
        if (ult.aoeRadius > 0) {
          const inRadius = this.foes(u).filter(f => dist(f, foeOk) <= ult.aoeRadius).length;
          if (inRadius >= 2 || this.foes(u).length === 1) return { kind: "skill", skill: ult, target: foeOk };
        } else if (foeOk.hp / foeOk.init.maxHp <= 0.6 || this.foes(u).length === 1) {
          return { kind: "skill", skill: ult, target: foeOk };
        }
      }
    }
    if (s2.kind === "heal" && u.cooldowns[1] === 0 && low && low.hp / low.init.maxHp < 0.75)
      return { kind: "skill", skill: s2, target: low };
    if (s2.kind === "shield" && u.cooldowns[1] === 0 && low && low.hp / low.init.maxHp < 0.85)
      return { kind: "skill", skill: s2, target: low };
    if (u.cooldowns[0] === 0 && foeOk) return { kind: "skill", skill: s1, target: foeOk };
    if (s2.kind === "damage" && u.cooldowns[1] === 0 && foeOk) return { kind: "skill", skill: s2, target: foeOk };
    if (foeOk && u.basicTimer === 0) return { kind: "basic", target: foeOk };
    return foeOk ? { kind: "basic", target: foeOk } : null; // move toward foe
  }

  private actionRange(u: UnitRt, a: Action): number {
    if (a.kind === "skill" && (a.skill.kind === "heal" || a.skill.kind === "shield") && a.skill.energyCost === 0)
      return COMBAT.SUPPORT_ACTION_RANGE;
    if (a.kind === "skill" && a.skill.energyCost > 0 && a.skill.kind === "heal") return Infinity;
    return COMBAT.ROLE_RANGE[u.init.role];
  }

  private act(u: UnitRt): void {
    if (this.has(u, "Freeze")) return; // §13: frozen units cannot act
    const action = this.chooseAction(u);
    if (!action) return;
    const target = action.target;
    const range = this.actionRange(u, action);
    if (dist(u, target) > range) { this.moveToward(u, target, range); return; }
    if (action.kind === "basic") {
      if (u.basicTimer > 0) return; // in range, waiting for the next swing
      u.basicTimer = this.basicInterval(u);
      u.energy = Math.min(COMBAT.ENERGY_MAX, u.energy + COMBAT.ENERGY_ON_BASIC);
      this.dealDamage(u, target, 1.0, u.init.element, null, true);
      return;
    }
    this.castSkill(u, action.skill, target);
  }

  private moveToward(u: UnitRt, target: UnitRt, stopAt: number): void {
    const d = dist(u, target);
    if (d <= stopAt) return;
    const speed = u.init.spd * COMBAT.MOVE_PER_SPD * (this.has(u, "Shock") ? COMBAT.SHOCK_SLOW : 1);
    const stepLen = Math.min(d - stopAt + 0.05, speed);
    u.x = clamp(u.x + (target.x - u.x) / d * stepLen, 0.6, COMBAT.ARENA_W - 0.6);
    u.y = clamp(u.y + (target.y - u.y) / d * stepLen, 0.6, COMBAT.ARENA_H - 0.6);
    if (this.tick - u.lastMoveEmit >= COMBAT.MOVE_EMIT_EVERY) {
      u.lastMoveEmit = this.tick;
      this.emit("UnitMoved", { unitId: u.init.unitId, x: Math.round(u.x * 100) / 100, y: Math.round(u.y * 100) / 100 });
    }
  }

  private separate(): void {
    for (let i = 0; i < this.units.length; i++) {
      for (let j = i + 1; j < this.units.length; j++) {
        const a = this.units[i], b = this.units[j];
        if (!a.alive || !b.alive) continue;
        const d = dist(a, b);
        if (d > 0.001 && d < COMBAT.SEPARATION_DIST) {
          const push = (COMBAT.SEPARATION_DIST - d) * 0.35;
          const dx = (b.x - a.x) / d, dy = (b.y - a.y) / d;
          a.x = clamp(a.x - dx * push, 0.6, COMBAT.ARENA_W - 0.6);
          a.y = clamp(a.y - dy * push, 0.6, COMBAT.ARENA_H - 0.6);
          b.x = clamp(b.x + dx * push, 0.6, COMBAT.ARENA_W - 0.6);
          b.y = clamp(b.y + dy * push, 0.6, COMBAT.ARENA_H - 0.6);
        }
      }
    }
  }

  /* ---------------- resolution (Part 7 §12–§15) ---------------- */

  private castSkill(u: UnitRt, skill: SkillDefinition, primary: UnitRt): void {
    this.emit("SkillStarted", { unitId: u.init.unitId, skill: skill.name, targetId: primary.init.unitId });
    if (skill.energyCost > 0) u.energy = 0;
    else {
      u.cooldowns[skill.slot - 1] = skill.cooldownTicks;
      u.energy = Math.min(COMBAT.ENERGY_MAX, u.energy + COMBAT.ENERGY_ON_SKILL);
    }
    if (skill.kind === "heal") {
      const targets = skill.aoeRadius >= 90 ? this.allies(u) : [primary];
      for (const t of targets) if (t.alive) this.heal(u, t, Math.round(t.init.maxHp * skill.healPct), skill.name);
      return;
    }
    if (skill.kind === "shield") {
      const amount = Math.round(u.init.maxHp * skill.shieldPct);
      primary.shield += amount;
      this.emit("ShieldApplied", { sourceId: u.init.unitId, targetId: primary.init.unitId, amount, skill: skill.name });
      return;
    }
    const targets = skill.aoeRadius > 0
      ? this.foes(u).filter(f => dist(f, primary) <= skill.aoeRadius)
      : [primary];
    for (const t of targets) if (t.alive) this.dealDamage(u, t, skill.multiplier, u.init.element, skill.name, true);
    if (skill.status) {
      if (HOSTILE_STATUSES.includes(skill.status)) {
        for (const t of targets) if (t.alive) this.applyStatus(u, t, skill.status, skill.statusChance);
      } else {
        this.applyStatus(u, u, skill.status, 1);
      }
    }
  }

  /** Direct hit — full §12.3 formula chain, in the locked order. */
  private dealDamage(src: UnitRt, tgt: UnitRt, mult: number, element: ElementType, skillName: string | null, canCrit: boolean): void {
    if (!tgt.alive) return;
    const base = this.effAtk(src) * mult; // §12.1
    const mitigation = 1 / (1 + this.effDef(tgt) / 100); // §12.2
    const elem = elementMultiplier(element, tgt.init.element);
    const crit = canCrit && this.rng.next() < COMBAT.CRIT_CHANCE;
    const rf = COMBAT.RANDOM_MIN + this.rng.next() * (COMBAT.RANDOM_MAX - COMBAT.RANDOM_MIN);
    const raw = base * mitigation * elem * (crit ? COMBAT.CRIT_MULT : 1) * rf * this.fatigueMult(); // §12.3 (+ fatigue baseline)
    const absorbed = Math.min(tgt.shield, raw);
    tgt.shield -= absorbed;
    const hpDmg = Math.round(raw - absorbed);
    tgt.hp -= hpDmg;
    src.threatDealt += hpDmg;
    tgt.energy = Math.min(COMBAT.ENERGY_MAX, tgt.energy + COMBAT.ENERGY_ON_HIT);
    this.emit("DamageApplied", {
      sourceId: src.init.unitId, targetId: tgt.init.unitId, amount: hpDmg,
      shieldAbsorbed: Math.round(absorbed), element, crit, skill: skillName,
    });
    if (tgt.hp <= 0) { this.kill(tgt, src); return; }
    this.checkReaction(src, tgt, element);
  }

  /** Flat damage without crit/random factor (DoT ticks, reaction bonus). */
  private rawDamage(src: UnitRt | null, tgt: UnitRt, amount: number, via: string): void {
    if (!tgt.alive || amount <= 0) return;
    amount = Math.round(amount * this.fatigueMult());
    const absorbed = Math.min(tgt.shield, amount);
    tgt.shield -= absorbed;
    const hpDmg = amount - absorbed;
    tgt.hp -= hpDmg;
    if (src) src.threatDealt += hpDmg;
    this.emit("DamageApplied", {
      sourceId: src?.init.unitId ?? "status", targetId: tgt.init.unitId, amount: hpDmg,
      shieldAbsorbed: absorbed, element: tgt.init.element, crit: false, skill: via === "StatusApplied" ? "status" : "reaction",
    });
    if (tgt.hp <= 0) this.kill(tgt, src);
  }

  private heal(src: UnitRt, tgt: UnitRt, amount: number, skillName: string | null): void {
    const real = Math.min(amount, tgt.init.maxHp - tgt.hp); // §12.5: no overheal in MVP
    if (real <= 0) return;
    tgt.hp += real;
    this.emit("HealingApplied", { sourceId: src.init.unitId, targetId: tgt.init.unitId, amount: real, skill: skillName });
  }

  private applyStatus(src: UnitRt, tgt: UnitRt, kind: StatusKind, chance: number): void {
    if (!tgt.alive) return;
    if (kind === "Knockback") {
      if (this.rng.next() >= chance) return;
      const d = Math.max(dist(src, tgt), 0.001);
      tgt.x = clamp(tgt.x + (tgt.x - src.x) / d * COMBAT.KNOCKBACK_DIST, 0.6, COMBAT.ARENA_W - 0.6);
      tgt.y = clamp(tgt.y + (tgt.y - src.y) / d * COMBAT.KNOCKBACK_DIST, 0.6, COMBAT.ARENA_H - 0.6);
      this.emit("StatusApplied", { targetId: tgt.init.unitId, status: kind, stacks: 0, durationTicks: 0 });
      this.emit("UnitMoved", { unitId: tgt.init.unitId, x: Math.round(tgt.x * 100) / 100, y: Math.round(tgt.y * 100) / 100 });
      return;
    }
    // §14.4: EffectiveChance = BaseChance × (1 − Resistance); MVP resistance = 0.
    if (this.rng.next() >= chance) return;
    const duration = COMBAT.STATUS_DURATION_TICKS[kind] ?? 30;
    const existing = tgt.statuses.find(s => s.kind === kind);
    if (existing) {
      if (kind === "Burn" || kind === "Poison") existing.stacks = Math.min(COMBAT.MAX_DOT_STACKS, existing.stacks + 1);
      // §14.3: refresh-style statuses take the longer remaining duration;
      // Freeze never stacks duration beyond its base (no infinite freeze).
      existing.ticksLeft = kind === "Freeze" ? duration : Math.max(existing.ticksLeft, duration);
      existing.sourceId = src.init.unitId;
    } else {
      tgt.statuses.push({ kind, stacks: 1, ticksLeft: duration, sourceId: src.init.unitId });
    }
    const now = tgt.statuses.find(s => s.kind === kind)!;
    this.emit("StatusApplied", { targetId: tgt.init.unitId, status: kind, stacks: now.stacks, durationTicks: duration });
  }

  /** §15: a hit whose element pairs with a primer status already on the
   * target triggers that reaction — max 1 per target per tick, own cooldown. */
  private checkReaction(src: UnitRt, tgt: UnitRt, hitElement: ElementType): void {
    if (tgt.reactedTick === this.tick || !tgt.alive) return;
    for (const st of tgt.statuses) {
      const primer = STATUS_ELEMENT[st.kind];
      if (!primer || primer === hitElement) continue;
      const reaction = REACTIONS.find(r => (r.a === primer && r.b === hitElement) || (r.a === hitElement && r.b === primer));
      if (!reaction) continue;
      const readyAt = tgt.reactionReadyAt.get(reaction.name) ?? 0;
      if (this.tick < readyAt) continue;
      tgt.reactedTick = this.tick;
      tgt.reactionReadyAt.set(reaction.name, this.tick + COMBAT.REACTION_CD_TICKS);
      const mitigation = 1 / (1 + this.effDef(tgt) / 100);
      const elem = elementMultiplier(hitElement, tgt.init.element);
      const bonus = Math.round(this.effAtk(src) * COMBAT.REACTION_DMG_PCT * mitigation * elem);
      src.energy = Math.min(COMBAT.ENERGY_MAX, src.energy + COMBAT.ENERGY_ON_REACTION);
      this.emit("ReactionTriggered", { name: reaction.name, sourceId: src.init.unitId, targetId: tgt.init.unitId, amount: bonus });
      this.rawDamage(src, tgt, bonus, "ReactionTriggered");
      if (!tgt.alive) return;
      for (const bystander of this.foes(src)) {
        if (bystander === tgt || !bystander.alive) continue;
        if (dist(bystander, tgt) <= COMBAT.REACTION_RADIUS)
          this.rawDamage(src, bystander, Math.round(bonus * COMBAT.REACTION_SPLASH_PCT), "ReactionTriggered");
      }
      return;
    }
  }

  private kill(tgt: UnitRt, by: UnitRt | null): void {
    if (!tgt.alive) return;
    tgt.alive = false;
    tgt.hp = 0;
    this.emit("UnitDefeated", { unitId: tgt.init.unitId, byId: by?.init.unitId ?? null });
  }

  private checkEnd(): void {
    const t0 = this.units.some(u => u.alive && u.init.team === 0);
    const t1 = this.units.some(u => u.alive && u.init.team === 1);
    if (t0 && t1) return;
    this.winner = t0 ? 0 : 1;
    this.finished = true;
    this.emit("BattleCompleted", { winner: this.winner, ticks: this.tick, reason: "wipe" });
  }

  private finishByTimeout(): void {
    const sum = (team: 0 | 1) => this.units.filter(u => u.init.team === team)
      .reduce((acc, u) => acc + Math.max(0, u.hp) / u.init.maxHp, 0);
    const s0 = sum(0), s1 = sum(1);
    this.winner = s0 === s1 ? 2 : s0 > s1 ? 0 : 1;
    this.finished = true;
    this.emit("BattleCompleted", { winner: this.winner, ticks: this.tick, reason: "timeout" });
  }
}

/** Convenience: run a full battle to completion. */
export function runBattle(seed: number, units: BattleUnitInit[], maxTicks = COMBAT.MAX_TICKS): BattleResult {
  return new BattleEngine(seed, units).run(maxTicks);
}
