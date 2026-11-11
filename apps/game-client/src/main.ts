import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { LoginScene } from "./scenes/LoginScene";
import { WorldScene } from "./scenes/WorldScene";
import { HudScene } from "./scenes/HudScene";
// TDD Part 4: logical resolution 720x1280 portrait, Scale FIT, pixelArt.
new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 720,
  height: 1280,
  backgroundColor: "#1a2418",
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  dom: { createContainer: true },
  scene: [BootScene, PreloadScene, LoginScene, WorldScene, HudScene],
});
