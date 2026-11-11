import Phaser from "phaser";
import type { PlayerProfile } from "@eidolith/shared-types";
/** World placeholder — Phase 1 proves login -> world entry. Renders the locked 64x32
 *  isometric ground grid (World Part 8 §4.3) and the Wanderer marker at spawn.
 *  Real Tiled maps, movement and networking arrive in Phase 2. */
const TILE_W = 64, TILE_H = 32;
export class WorldScene extends Phaser.Scene {
  constructor() { super("World"); }
  create(data: { profile: PlayerProfile }): void {
    const profile = data.profile;
    const { width } = this.scale;
    const g = this.add.graphics();
    const originX = width / 2, originY = 180;
    for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) {
      const px = originX + (x - y) * (TILE_W / 2), py = originY + (x + y) * (TILE_H / 2);
      g.fillStyle((x + y) % 2 === 0 ? 0x3d5a3a : 0x365134, 1);
      g.lineStyle(1, 0x2a4028, 1);
      g.beginPath();
      g.moveTo(px, py - TILE_H / 2); g.lineTo(px + TILE_W / 2, py); g.lineTo(px, py + TILE_H / 2); g.lineTo(px - TILE_W / 2, py);
      g.closePath(); g.fillPath(); g.strokePath();
    }
    // Wanderer marker at grid (4,4), depth by foot position (Art Part 14 §2).
    const wx = originX + (4 - 4) * (TILE_W / 2), wy = originY + (4 + 4) * (TILE_H / 2);
    const wanderer = this.add.rectangle(wx, wy - 14, 18, 28, 0xe8c96a).setDepth(wy);
    this.tweens.add({ targets: wanderer, y: wy - 18, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.add.text(wx, wy - 48, profile?.displayName ?? "Wanderer", { fontSize: "15px", color: "#ffffff" }).setOrigin(0.5).setDepth(wy + 1);
    this.add.text(20, 20, "Meadow Village — Verdant Plains", { fontSize: "20px", color: "#e8e4d8" });
    this.add.text(20, 48, `Wanderer: ${profile?.displayName ?? "?"} · Lv.${profile?.level ?? 1}`, { fontSize: "16px", color: "#9a937f" });
    this.add.text(20, this.scale.height - 36, "Phase 1 foundation — di chuyển & bản đồ Tiled đến ở Phase 2", { fontSize: "14px", color: "#6d675a" });
  }
}
