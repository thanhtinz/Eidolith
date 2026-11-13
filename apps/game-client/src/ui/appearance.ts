import type Phaser from "phaser";
/** Character appearance (creation flow, 2026-11-12). The player is an ordinary
 *  villager: outfits are everyday clothes, NOT professions. Preview priority
 *  (same rule as the approved mock): a non-default hairstyle wins over a
 *  non-default outfit, because the sample sheets vary one dimension at a time;
 *  hair color is a masked HSV recolor applied on top of whichever base shows. */
export interface AppearanceLike {
  avatarId: string; hairStyle?: string; hairColor?: string; outfit?: string;
}
export const HAIR_COLORS: [string, string, string][] = [
  ["brown", "Nâu", "#8a5a33"], ["black", "Đen", "#26221f"], ["blond", "Vàng", "#e8c96a"],
  ["silver", "Bạc", "#dfe5ea"], ["red", "Đỏ", "#b33a26"],
];
export const APPEARANCE_UI = {
  female: {
    defStyle: "long",
    styles: [["long", "Dài xoăn"], ["ponytail", "Đuôi ngựa"], ["braid", "Tết bím"], ["bun", "Búi cao"], ["bob", "Ngắn bob"]] as [string, string][],
    outfits: [["default", "Mặc định"], ["sweater", "Áo len"], ["shirt", "Sơ mi"], ["floral", "Váy hoa"], ["coat", "Áo khoác"], ["apron", "Tạp dề"]] as [string, string][],
  },
  male: {
    defStyle: "messy",
    styles: [["messy", "Ngắn rối"], ["slick", "Vuốt ngược"], ["halfup", "Buộc nửa"], ["crop", "Cắt ngắn"], ["curly", "Xoăn xù"]] as [string, string][],
    outfits: [["default", "Mặc định"], ["sweater", "Áo len"], ["plaid", "Caro"], ["jacket", "Khoác"], ["vest", "Gile"], ["work", "Lao động"]] as [string, string][],
  },
} as const;
export type GenderKey = keyof typeof APPEARANCE_UI;
export const genderOf = (avatarId: string): GenderKey => (avatarId === "wanderer_female" ? "female" : "male");

export function isCustom(a: AppearanceLike): boolean {
  const g = APPEARANCE_UI[genderOf(a.avatarId)];
  return (a.hairStyle !== undefined && a.hairStyle !== g.defStyle)
    || (a.outfit !== undefined && a.outfit !== "default")
    || (a.hairColor !== undefined && a.hairColor !== "brown");
}
function basePath(a: AppearanceLike): string {
  const gender = genderOf(a.avatarId);
  const g = APPEARANCE_UI[gender];
  const style = a.hairStyle ?? g.defStyle;
  if (style !== g.defStyle) return `assets/chars/custom/hair-${gender}-${style}.png`;
  if (a.outfit && a.outfit !== "default") return `assets/chars/custom/outfit-${gender}-${a.outfit}.png`;
  if (a.hairColor && a.hairColor !== "brown") return gender === "female" ? "assets/chars/wanderer-female-v4.png" : "assets/chars/wanderer-v4.png";
  return `assets/chars/custom/hair-${gender}-${g.defStyle}.png`;
}
const HAIR_TARGET: Record<string, [number, number, number]> = {
  black: [25, 0.35, 0.42], blond: [44, 0.85, 1.28], silver: [220, 0.10, 1.45], red: [4, 1.15, 0.95],
};
/** Masked HSV hair recolor — a direct port of the mock pipeline
 *  (shots/creation-mock/gen_variants.py): warm brown hues in the head zone
 *  (plus the female side-hair columns), value-capped so skin stays clean. */
export function recolorHair(canvas: HTMLCanvasElement, color: string, gender: GenderKey): void {
  const target = HAIR_TARGET[color];
  if (!target) return;
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width, H = canvas.height;
  const data = ctx.getImageData(0, 0, W, H);
  const px = data.data;
  const [tHue, sMul, vMul] = target;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (px[i + 3] <= 10) continue;
      const inZone = y < H * 0.30 || (gender === "female" && (x < W * 0.24 || x > W * 0.76) && y < H * 0.62);
      if (!inZone) continue;
      const r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
      if (d === 0) continue;
      let h = 0;
      if (mx === r) h = (60 * ((g - b) / d) + 360) % 360;
      else if (mx === g) h = 60 * ((b - r) / d) + 120;
      else h = 60 * ((r - g) / d) + 240;
      const s = mx > 0 ? d / mx : 0, v = mx;
      const isHair = h >= 6 && h <= 48 && s > 0.16 && v > 0.10 && (v < 0.64 || (s > 0.45 && v < 0.88));
      if (!isHair) continue;
      const ns = Math.min(1, Math.max(0, s * sMul)), nv = Math.min(1, Math.max(0, v * vMul));
      const hh = (tHue % 360) / 60, c = nv * ns, xx = c * (1 - Math.abs((hh % 2) - 1)), m = nv - c;
      let nr = 0, ng = 0, nb = 0;
      if (hh < 1) { nr = c; ng = xx; } else if (hh < 2) { nr = xx; ng = c; }
      else if (hh < 3) { ng = c; nb = xx; } else if (hh < 4) { ng = xx; nb = c; }
      else if (hh < 5) { nr = xx; nb = c; } else { nr = c; nb = xx; }
      px[i] = (nr + m) * 255; px[i + 1] = (ng + m) * 255; px[i + 2] = (nb + m) * 255;
    }
  }
  ctx.putImageData(data, 0, 0);
}
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
/** Full-pipeline base canvas for an appearance: base art + hair recolor. */
export async function appearanceCanvas(a: AppearanceLike): Promise<HTMLCanvasElement> {
  const img = await loadImage(basePath(a));
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  canvas.getContext("2d")!.drawImage(img, 0, 0);
  if (a.hairColor && a.hairColor !== "brown") recolorHair(canvas, a.hairColor, genderOf(a.avatarId));
  return canvas;
}
/** Smooth preview (creation screen) as a data URL. */
export async function previewDataUrl(a: AppearanceLike): Promise<string> {
  return (await appearanceCanvas(a)).toDataURL("image/png");
}
/** Pixel-lean: uniform 2px blocks like the game's extracted art, height 208. */
function pixelLean(src: HTMLCanvasElement): HTMLCanvasElement {
  const half = document.createElement("canvas");
  half.height = 104; half.width = Math.max(2, Math.round((src.width / src.height) * 104));
  const hctx = half.getContext("2d")!;
  hctx.imageSmoothingEnabled = true;
  hctx.drawImage(src, 0, 0, half.width, half.height);
  const out = document.createElement("canvas");
  out.width = half.width * 2; out.height = 208;
  const octx = out.getContext("2d")!;
  octx.imageSmoothingEnabled = false;
  octx.drawImage(half, 0, 0, out.width, out.height);
  return out;
}
const pending = new Map<string, Promise<string>>();
/** Ensure a Phaser texture exists for this appearance; resolves its key. */
export function ensureAppearanceTexture(scene: Phaser.Scene, a: AppearanceLike): Promise<string> {
  const gender = genderOf(a.avatarId);
  const g = APPEARANCE_UI[gender];
  const key = `appr_${gender}_${a.hairStyle ?? g.defStyle}_${a.hairColor ?? "brown"}_${a.outfit ?? "default"}`;
  if (scene.textures.exists(key)) return Promise.resolve(key);
  let p = pending.get(key);
  if (!p) {
    p = appearanceCanvas(a).then(src => {
      if (!scene.textures.exists(key)) scene.textures.addCanvas(key, pixelLean(src));
      pending.delete(key);
      return key;
    }).catch(() => { pending.delete(key); return gender === "female" ? "wanderer_f" : "wanderer"; });
    pending.set(key, p);
  }
  return p;
}
/** Swap a sprite to the appearance texture once it is built (stock meanwhile). */
export function applyAppearance(scene: Phaser.Scene, a: AppearanceLike, sprite: Phaser.GameObjects.Image): void {
  if (!isCustom(a)) return;
  void ensureAppearanceTexture(scene, a).then(key => { if (sprite.active) sprite.setTexture(key); });
}
