import Phaser from "phaser";
import { joyState } from "../state";
/** HUD overlay scene — drawn by its own camera so world camera zoom/scroll never displaces it.
 *  Shows map name, world clock, weather, zone player count, player name/level, and the virtual joystick. */
export interface HudData { mapLabel: string; weatherLabel: string; nameLevel: string; startMinutes: number; players: number; }
export class HudScene extends Phaser.Scene {
  private timeText!: Phaser.GameObjects.Text;
  private playersText!: Phaser.GameObjects.Text;
  private minutes = 0;
  constructor() { super("Hud"); }
  create(data: HudData): void {
    // Translucent dark panels behind every HUD text block so text stays readable
    // over bright scenery (trees, roofs, water).
    const g = this.add.graphics();
    g.fillStyle(0x060a08, 0.52).fillRoundedRect(8, 112, 330, 92, 12);
    g.fillStyle(0x060a08, 0.52).fillRoundedRect(this.scale.width - 188, 8, 180, 40, 12);
    this.add.text(16, 118, data.mapLabel, { fontSize: "19px", color: "#e8e4d8" });
    this.timeText = this.add.text(16, 146, "", { fontSize: "16px", color: "#cdb87a" });
    this.playersText = this.add.text(16, 172, "", { fontSize: "15px", color: "#9a937f" });
    this.add.text(this.scale.width - 16, 14, data.weatherLabel, { fontSize: "16px", color: "#9fc6e8" }).setOrigin(1, 0);
    // Player name/level lives in the hub top bar now (ui/hub.ts) — no duplicate chip here.
    this.minutes = data.startMinutes;
    this.setPlayers(data.players);
    this.updateClock();
    this.time.addEvent({ delay: 1000, loop: true, callback: () => { this.minutes = (this.minutes + 0.4) % 1440; this.updateClock(); } });
    this.game.events.on("hud:players", this.setPlayers, this);
    this.game.events.on("hud:clock", (mins: number) => { this.minutes = mins; this.updateClock(); });
    this.events.once("shutdown", () => { this.game.events.off("hud:players", this.setPlayers, this); this.game.events.off("hud:clock"); });
    this.buildJoystick();
  }
  private setPlayers = (n: number): void => { this.playersText?.setText(`Người chơi trong khu: ${n}`); };
  private updateClock(): void {
    const h = Math.floor(this.minutes / 60), m = Math.floor(this.minutes % 60);
    this.timeText?.setText(`Giờ thế giới: ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
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
