import Phaser from "phaser";
/** Preload: art v3 — assets extracted DIRECTLY from the approved concept sheets
 *  (tools/extract_art_v3.py) so the game matches the approved mockups.
 *  NPC sprites remain the v2 set until their own sheets are generated. */
export class PreloadScene extends Phaser.Scene {
  constructor() { super("Preload"); }
  preload(): void {
    this.load.spritesheet("verdant", "assets/tilesets/verdant-v4.png", { frameWidth: 64, frameHeight: 32 });
    for (const prop of ["tree", "pine", "house", "rock", "bush"]) this.load.image(prop, `assets/props/${prop}-v3.png`);
    this.load.image("wanderer", "assets/chars/wanderer-v3.png");
    this.load.image("wanderer_f", "assets/chars/wanderer-female-v3.png");
    this.load.image("npc_rowan", "assets/chars/npc-rowan-v4.png");
    this.load.image("npc_mira", "assets/chars/npc-mira-v4.png");
    this.load.image("npc_kael", "assets/chars/npc-kael-v4.png");
  }
  create(): void {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, "EIDOLITH", { fontSize: "44px", color: "#e8c96a", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 44, "The Forgotten Wilds", { fontSize: "18px", color: "#9a937f" }).setOrigin(0.5);
    this.time.delayedCall(300, () => this.scene.start("Login"));
  }
}
