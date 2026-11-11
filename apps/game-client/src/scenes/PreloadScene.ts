import Phaser from "phaser";
/** Preload: Phase 1 has no external assets yet (art production starts with the Art Bible, Part 14).
 *  Shows a loading label so the flow is real, then goes to Login. */
export class PreloadScene extends Phaser.Scene {
  constructor() { super("Preload"); }
  create(): void {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, "EIDOLITH", { fontSize: "44px", color: "#e8c96a", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 44, "The Forgotten Wilds", { fontSize: "18px", color: "#9a937f" }).setOrigin(0.5);
    this.time.delayedCall(400, () => this.scene.start("Login"));
  }
}
