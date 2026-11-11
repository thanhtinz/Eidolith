// sfx.ts — synthesized battle sound effects (WebAudio, no audio assets).
// Small procedural recipes per element so ultimates SOUND like their
// element; ordinary hits/heals/defeats get light ticks. Respects the
// hub setting (localStorage "eidolith.settings".sfx). A play counter is
// exposed on window.__sfxPlayed for automated verification.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function enabled(): boolean {
  try {
    const s = JSON.parse(localStorage.getItem("eidolith.settings") ?? "{}") as { sfx?: boolean };
    return s.sfx !== false;
  } catch { return true; }
}

function played(): void {
  const w = window as unknown as Record<string, unknown>;
  w.__sfxPlayed = Number(w.__sfxPlayed ?? 0) + 1;
}

interface ToneOpts { type?: OscillatorType; f0: number; f1?: number; delay?: number; dur: number; vol: number }
function tone({ type = "sine", f0, f1, delay = 0, dur, vol }: ToneOpts): void {
  const c = ac(); if (!c || !master) return;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t0);
  if (f1 !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

let noiseBuf: AudioBuffer | null = null;
function noiseBuffer(c: AudioContext): AudioBuffer {
  if (noiseBuf) return noiseBuf;
  const len = Math.floor(c.sampleRate * 1.2);
  noiseBuf = c.createBuffer(1, len, c.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

interface NoiseOpts { delay?: number; dur: number; vol: number; type?: BiquadFilterType; f0: number; f1?: number; q?: number }
function noise({ delay = 0, dur, vol, type = "lowpass", f0, f1, q = 0.8 }: NoiseOpts): void {
  const c = ac(); if (!c || !master) return;
  const t0 = c.currentTime + delay;
  const src = c.createBufferSource(); src.buffer = noiseBuffer(c); src.loop = true;
  const flt = c.createBiquadFilter(); flt.type = type; flt.Q.value = q;
  flt.frequency.setValueAtTime(f0, t0);
  if (f1 !== undefined) flt.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(flt); flt.connect(g); g.connect(master);
  src.start(t0); src.stop(t0 + dur + 0.05);
}

function boom(delay = 0): void {
  tone({ f0: 150, f1: 40, delay, dur: 0.5, vol: 0.55 });
  noise({ delay, dur: 0.4, vol: 0.25, f0: 900, f1: 120 });
}
function whoosh(delay = 0): void {
  noise({ delay, dur: 0.38, vol: 0.22, type: "bandpass", f0: 300, f1: 2600, q: 1.4 });
}

/** The ultimate sound: shared whoosh + impact, with an element signature. */
export function sfxUlt(element: string): void {
  if (!enabled() || !ac()) return;
  played();
  whoosh(0);
  switch (element) {
    case "Flame":
      for (let i = 0; i < 5; i++) noise({ delay: 0.05 + i * 0.06, dur: 0.09, vol: 0.12, type: "highpass", f0: 1800 });
      tone({ type: "sawtooth", f0: 90, f1: 55, delay: 0.3, dur: 0.5, vol: 0.2 });
      break;
    case "Tide":
      tone({ f0: 720, f1: 170, delay: 0.05, dur: 0.5, vol: 0.3 });
      noise({ delay: 0.25, dur: 0.55, vol: 0.28, f0: 1400, f1: 300 });
      break;
    case "Grove":
      [523, 659, 784, 1047].forEach((f, i) => tone({ type: "triangle", f0: f, delay: 0.06 * i, dur: 0.5, vol: 0.22 }));
      break;
    case "Stone":
      noise({ dur: 0.7, vol: 0.3, f0: 220, f1: 60 });
      tone({ f0: 95, f1: 34, delay: 0.28, dur: 0.6, vol: 0.5 });
      break;
    case "Gale":
      noise({ dur: 0.8, vol: 0.26, type: "bandpass", f0: 500, f1: 3200, q: 2.2 });
      tone({ f0: 880, f1: 1560, delay: 0.15, dur: 0.4, vol: 0.08 });
      break;
    case "Frost":
      [1568, 2093, 2637].forEach((f, i) => tone({ f0: f, delay: 0.07 * i, dur: 0.45, vol: 0.16 }));
      break;
    case "Volt":
      tone({ type: "square", f0: 1250, f1: 180, dur: 0.22, vol: 0.16 });
      noise({ delay: 0.05, dur: 0.3, vol: 0.14, type: "highpass", f0: 2400 });
      break;
    case "Venom":
      [392, 330, 262].forEach((f, i) => tone({ f0: f, f1: f * 0.9, delay: 0.09 * i, dur: 0.3, vol: 0.2 }));
      break;
    case "Shade":
      tone({ type: "sawtooth", f0: 110, f1: 98, dur: 0.8, vol: 0.12 });
      tone({ type: "sawtooth", f0: 116, f1: 104, dur: 0.8, vol: 0.12 });
      break;
    case "Astral":
      [784, 988, 1175, 1568].forEach((f, i) => { tone({ f0: f, delay: 0.07 * i, dur: 0.6, vol: 0.16 }); tone({ f0: f * 2, delay: 0.07 * i, dur: 0.4, vol: 0.05 }); });
      break;
    default:
      tone({ type: "triangle", f0: 660, f1: 990, dur: 0.35, vol: 0.2 });
  }
  boom(0.32);
}

let lastHit = 0;
export function sfxHit(crit: boolean): void {
  if (!enabled() || !ac()) return;
  const now = performance.now();
  if (now - lastHit < 55) return;
  lastHit = now;
  played();
  noise({ dur: 0.07, vol: crit ? 0.22 : 0.13, type: "bandpass", f0: crit ? 2100 : 1500 + Math.random() * 500, q: 1.1 });
  if (crit) tone({ type: "triangle", f0: 1180, f1: 620, dur: 0.12, vol: 0.14 });
}

let lastHeal = 0;
export function sfxHeal(): void {
  if (!enabled() || !ac()) return;
  const now = performance.now();
  if (now - lastHeal < 200) return;
  lastHeal = now;
  played();
  tone({ type: "triangle", f0: 784, dur: 0.22, vol: 0.1 });
  tone({ type: "triangle", f0: 1047, delay: 0.07, dur: 0.3, vol: 0.1 });
}

export function sfxDefeat(): void {
  if (!enabled() || !ac()) return;
  played();
  tone({ type: "triangle", f0: 420, f1: 130, dur: 0.4, vol: 0.2 });
}

export function sfxEnd(win: boolean | null): void {
  if (!enabled() || !ac()) return;
  played();
  if (win === true) [523, 659, 784, 1047].forEach((f, i) => tone({ type: "triangle", f0: f, delay: 0.1 * i, dur: 0.55, vol: 0.2 }));
  else if (win === false) [392, 330, 262, 196].forEach((f, i) => tone({ type: "triangle", f0: f, delay: 0.12 * i, dur: 0.5, vol: 0.18 }));
  else tone({ type: "triangle", f0: 523, dur: 0.5, vol: 0.16 });
}

/** Short rising sting for the ult splash flash (the full element sound
 * lands with the release VFX). */
export function sfxSting(): void {
  if (!enabled() || !ac()) return;
  played();
  whoosh(0);
  tone({ type: "triangle", f0: 520, f1: 1180, dur: 0.35, vol: 0.14 });
}
