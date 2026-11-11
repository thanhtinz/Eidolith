import Phaser from "phaser";
import { joyState } from "../state";
/** HUD overlay scene — only the virtual joystick remains here; all player/map
 *  information lives in the hub top bar (ui/hub.ts) so the top of the screen
 *  has exactly one HUD layer. */
export interface HudData { mapLabel: string; weatherLabel: string; nameLevel: string; startMinutes: number; players: number; }
export class HudScene extends Phaser.Scene {
  constructor() { super("Hud"); }
  create(_data: HudData): void {
    this.buildJoystick();
  }
  private buildJoystick(): void {
    const bx = 96, by = this.scale.height - 228;
    const base = this.add.graphics();
    base.fillStyle(0x000000, 0.25).fillCircle(bx, by, 54);
    base.lineStyle(2, 0xffffff, 0.35).strokeCircle(bx, by, 54);
    const knob = this.add.graphics();
    const drawKnob = (dx: number, dy: number) => { knob.clear(); knob.fillStyle(0xffffff, 0.45).fillCircle(bx + dx, by + dy, 23); };
    drawKnob(0, 0);
    const zone = this.add.zone(bx, by, 140, 140).setInteractive();
    zone.on("pointerdown", (pointer: Phaser.Input.Pointer) => { joyState.active = true; joyState.pointerId = pointer.id; joyState.vec = { x: 0, y: 0 }; });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!joyState.active || pointer.id !== joyState.pointerId) return;
      let dx = pointer.x - bx, dy = pointer.y - by;
      const len = Math.hypot(dx, dy);
      if (len > 50) { dx = (dx / len) * 50; dy = (dy / len) * 50; }
      drawKnob(dx, dy);
      const nx = len > 6 ? dx / 50 : 0, ny = len > 6 ? dy / 50 : 0;
      joyState.vec = { x: (nx + ny) / 1.6, y: (ny - nx) / 1.6 };
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === joyState.pointerId) { joyState.active = false; joyState.vec = { x: 0, y: 0 }; drawKnob(0, 0); }
    });
  }
}
