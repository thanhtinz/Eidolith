# Audio/VFX status vs Part 15 (2026-11-13)

## Done
- Battle SFX: per-element ult (10 elements), hit/crit, heal, defeat,
  win/lose/draw stings, ult splash sting (ui/sfx.ts).
- Battle VFX: ult splash -> spotlight (pillar/glow/ring/burst/shake/
  banner); NEW ordinary-hit impact burst + ring in the target's
  element colour, crits bigger and gold (BattleScene.impactFx).
- World weather VFX (WorldScene.updateWeatherFx, pooled + screen-
  pinned, cave-exempt): rain (110 streaks + splash rings), storm
  (denser rain + wind leaves + lightning flash with distance-lagged
  thunder), wind (22 drifting leaves), fog (5 mist banks), snow
  (flake fall). Driven by the server snapshot weather key.
- Ambience: night crickets/owl (Stage 4); NEW day birds (Verdant,
  Part 15 §3); NEW weather loops — rain/wind/storm filtered-noise
  rig with smooth morphs (sfx.setWeatherAmbience/setDayAmbience).
- Movement: soft alternating footsteps while walking (sfxStep).
- UI SFX pack: delegated button tick, panel open/close sweeps,
  reward sting (summon, quest claims, expedition claim, Sanctuary
  collect-all), level-up fanfare (evolution), capture set (throw /
  success sparkle / break-out crack / fled whistle).
- All synthesized WebAudio — zero audio assets; respects the sfx
  setting; window.__sfxPlayed counter for verification.

## Verified (2026-11-13 tours)
vfxtour: rain drops 110 visible, wind leaves 22, fog mists 5,
storm drops 110 + thunder played, footsteps +6 over a 4-cell walk,
UI click/open deltas > 0. impacttour: impactFx fired 4x in a live
arena battle.

## Still missing vs Part 15 (honest debt)
- Music: NO music engine yet (settings.music exists, nothing plays)
  — 3 themes + adaptive states (§4/§10) unimplemented.
- Creature vocalizations (§10: 20 vocal sets) — none.
- Boss telegraph audio cue (§5) — waits on boss phase presentation.
- Regional ambience beyond Verdant — lands with regions 2–5.
- Reduced-effects setting (§6) — not yet; weather/impact density is
  fixed. Settings has music/sfx toggles only.
