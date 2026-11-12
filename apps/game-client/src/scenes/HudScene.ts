import Phaser from "phaser";
/** HUD overlay scene — the virtual joystick was removed on the user's order
 *  (2026-11-11): movement is tap-to-move only, handled by WorldScene. All
 *  player/map information lives in the DOM hub (ui/hub.ts), so this scene
 *  intentionally renders nothing now; it stays registered because
 *  WorldScene launches it with the world snapshot. */
export interface HudData { mapLabel: string; weatherLabel: string; nameLevel: string; startMinutes: number; players: number; }
export class HudScene extends Phaser.Scene {
  constructor() { super("Hud"); }
  create(_data: HudData): void { /* tap-to-move only — no on-screen joystick */ }
}
