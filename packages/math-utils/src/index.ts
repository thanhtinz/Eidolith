// Deterministic math utilities — TDD Part 4: combat-core must be deterministic
// (seeded RNG, fixed timestep). No Math.random() anywhere in simulation code.
/** SplitMix32-style seeded RNG. Same seed -> same sequence, on every platform. */
export class SeededRng {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  nextUint32(): number {
    this.state = (this.state + 0x9e3779b9) >>> 0;
    let z = this.state;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    return (z ^ (z >>> 15)) >>> 0;
  }
  /** Float in [0, 1). */
  next(): number { return this.nextUint32() / 4294967296; }
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number { return min + Math.floor(this.next() * (max - min + 1)); }
  /** Float in [min, max). */
  range(min: number, max: number): number { return min + this.next() * (max - min); }
  pick<T>(items: readonly T[]): T { return items[Math.floor(this.next() * items.length)]; }
}
/** Stable string hash (FNV-1a) — used for content checksums and seed derivation. */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) { h ^= input.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
