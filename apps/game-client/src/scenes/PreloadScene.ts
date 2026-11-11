import Phaser from "phaser";
/** Preload: art v2 "Premium Pixel" (approved docs/ART-DIRECTION-v1.md), generated pixel-native
 *  by tools/gen_art_v2.py at in-game sizes. */
export class PreloadScene extends Phaser.Scene {
  constructor() { super("Preload"); }
  preload(): void {
    this.load.spritesheet("verdant", "assets/tilesets/verdant-v2.png", { frameWidth: 64, frameHeight: 32 });
    for (const prop of ["tree", "pine", "house", "rock", "bush"]) this.load.image(prop, `assets/props/${prop}-v2.png`);
    this.load.image("wanderer", "assets/chars/wanderer-v2.png");
    this.load.image("wanderer_f", "assets/chars/wanderer-female-v2.png");
    this.load.image("npc_rowan", "assets/chars/npc-rowan-v2.png");
    this.load.image("npc_mira", "assets/chars/npc-mira-v2.png");
    this.load.image("npc_kael", "assets/chars/npc-kael-v2.png");
  }
  create(): void {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, "EIDOLITH", { fontSize: "44px", color: "#e8c96a", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 44, "The Forgotten Wilds", { fontSize: "18px", color: "#9a937f" }).setOrigin(0.5);
    this.time.delayedCall(300, () => this.scene.start("Login"));
  }
}
