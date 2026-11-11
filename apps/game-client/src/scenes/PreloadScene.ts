import Phaser from "phaser";
/** Preload: tileset + prop sprites (Phase 2 generated placeholder art; production art follows Part 14). */
export class PreloadScene extends Phaser.Scene {
  constructor() { super("Preload"); }
  preload(): void {
    this.load.spritesheet("verdant", "assets/tilesets/verdant.png", { frameWidth: 64, frameHeight: 32 });
    for (const prop of ["tree", "pine", "house", "rock", "bush"]) this.load.image(prop, `assets/props/${prop}.png`);
  }
  create(): void {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, "EIDOLITH", { fontSize: "44px", color: "#e8c96a", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 44, "The Forgotten Wilds", { fontSize: "18px", color: "#9a937f" }).setOrigin(0.5);
    this.time.delayedCall(300, () => this.scene.start("Login"));
  }
}
