import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { LoginScene } from "./scenes/LoginScene";
import { WorldScene } from "./scenes/WorldScene";
import { HudScene } from "./scenes/HudScene";
// Landscape 1280x720 (Tín, 2026-11-11 — overrides the Part 4 portrait lock), Scale FIT, pixelArt.
new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#1a2418",
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  dom: { createContainer: true },
  scene: [BootScene, PreloadScene, LoginScene, WorldScene, HudScene],
});
