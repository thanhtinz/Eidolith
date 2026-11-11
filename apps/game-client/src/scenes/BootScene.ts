import Phaser from "phaser";
/** Boot: minimal setup, then preload. (TDD Part 4 scene flow: Boot -> Preload -> Login -> World) */
export class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }
  create(): void { this.scene.start("Preload"); }
}
