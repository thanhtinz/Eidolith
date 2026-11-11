// Combat core — Combat Part 7: deterministic 5v5 auto battle, fixed timestep 10 ticks/s,
// seeded RNG, server-authoritative. Pure TypeScript: no Phaser, no DOM (TDD Part 4 §3.2).
// Phase 1 scope: engine skeleton with fixed-step loop + replay hash. Full systems land in Phase 4.
import { SeededRng } from "@eidolith/math-utils";
export const TICKS_PER_SECOND = 10;
export const TICK_MS = 1000 / TICKS_PER_SECOND;
export interface BattleUnitInit { unitId: string; team: 0 | 1; hp: number; atk: number; def: number; spd: number; }
export interface BattleEvent { tick: number; type: string; data: Record<string, unknown>; }
export class BattleEngine {
  readonly rng: SeededRng;
  tick = 0;
  readonly events: BattleEvent[] = [];
  constructor(seed: number, readonly units: BattleUnitInit[]) { this.rng = new SeededRng(seed); }
  step(): void { this.tick++; /* movement/AI/skills: Phase 4 */ }
  run(maxTicks: number): void { for (let i = 0; i < maxTicks; i++) this.step(); }
}
