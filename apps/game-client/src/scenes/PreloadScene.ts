import { CREATURE_SPRITES } from "../ui/sprites";
import Phaser from "phaser";
/** Preload: art v3 — assets extracted DIRECTLY from the approved concept sheets
 *  (tools/extract_art_v3.py) so the game matches the approved mockups.
 *  NPC sprites remain the v2 set until their own sheets are generated. */
export class PreloadScene extends Phaser.Scene {
  constructor() { super("Preload"); }
  preload(): void {
    // Title-screen art loads FIRST: the entry background must be ready before
    // the login/register page appears (Tín's order 2026-11-12). Default is the
    // World Tree art; swap to assets/ui/title-vista-v1.jpg for the vista.
    this.load.image("title_bg", "assets/ui/title-worldtree-v1.jpg");
    this.load.image("creation_bg", "assets/ui/creation-grove-v1.jpg");
    this.load.spritesheet("verdant", "assets/tilesets/verdant-top-v5.png", { frameWidth: 64, frameHeight: 64 });
    for (const s of ["grass", "dark", "flower", "stone", "deep", "shallow", "sand", "dirt", "swamp", "rock", "plank"]) {
      this.load.image(`surf_${s}`, `assets/tilesets/surf-${s}.png`);
    }
    for (const prop of ["tree", "pine", "house", "rock", "bush"]) this.load.image(prop, `assets/props/${prop}-v6.png`);
    // Dressing props (stall/well/lanterns/shrine/runes/...) — the layer that
    // makes one map stop looking like another (extract_props_v1.py).
    for (const prop of ["stall", "lantern", "signpost", "crates", "well", "board", "basket", "pots", "shrine", "runes", "cluster", "planter", "hive", "dummy", "stump", "shrooms", "darkwood", "willow", "blossom", "elder", "dead", "autumn", "house2", "house3"]) this.load.image(prop, `assets/props/${prop}-v3.png`);
    this.load.image("wanderer", "assets/chars/wanderer-v4.png");
    this.load.image("wanderer_f", "assets/chars/wanderer-female-v4.png");
    this.load.image("npc_rowan", "assets/chars/npc-rowan-v5.png");
    this.load.image("npc_mira", "assets/chars/npc-mira-v5.png");
    this.load.image("npc_kael", "assets/chars/npc-kael-v5.png");
    for (const [id, path] of Object.entries(CREATURE_SPRITES)) this.load.image(`cr_${id}`, path);
  }
  create(): void {
    // Straight into Login: it renders the title screen over the loaded art.
    this.scene.start("Login");
  }
}
