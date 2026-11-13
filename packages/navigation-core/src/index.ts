// Navigation core — World Part 8: A* over the isometric navigation grid.
// Pure TypeScript (no Phaser/DOM). Grid cells: 0 = walkable, 1 = blocked.
export interface GridPoint { x: number; y: number; }
export class NavGrid {
  constructor(readonly width: number, readonly height: number, readonly cells: Uint8Array) {}
  static fromRows(rows: string[]): NavGrid {
    const height = rows.length, width = rows[0].length;
    const cells = new Uint8Array(width * height);
    rows.forEach((row, y) => { for (let x = 0; x < width; x++) cells[y * width + x] = row[x] === "#" ? 1 : 0; });
    return new NavGrid(width, height, cells);
  }
  walkable(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height && this.cells[y * this.width + x] === 0;
  }
}
/** Straight-line walkability between two cell centres: samples the
 * segment finely; a diagonal crossing also requires both orthogonal
 * neighbours of the corner to be walkable (no corner cutting). */
export function lineWalkable(grid: NavGrid, a: GridPoint, b: GridPoint): boolean {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(1, Math.ceil(dist * 4));
  let px = a.x, py = a.y;
  for (let i = 1; i <= steps; i++) {
    const x = a.x + (b.x - a.x) * (i / steps), y = a.y + (b.y - a.y) * (i / steps);
    const cx = Math.round(x), cy = Math.round(y);
    if (!grid.walkable(cx, cy)) return false;
    if (cx !== px && cy !== py) {
      if (!grid.walkable(cx, py) || !grid.walkable(px, cy)) return false;
    }
    px = cx; py = cy;
  }
  return true;
}

/** A* pathfinding (8-directional, corner-guarded) + line-of-sight
 * smoothing, so walkers flow diagonally and cut natural corners
 * instead of stepping in right angles (the top-down stiffness fix,
 * 2026-11-12). Returns path excluding start, or null if unreachable. */
export function findPath(grid: NavGrid, start: GridPoint, goal: GridPoint): GridPoint[] | null {
  if (!grid.walkable(goal.x, goal.y)) return null;
  const key = (x: number, y: number) => y * grid.width + x;
  const open = new Map<number, number>(); // key -> fScore
  const gScore = new Map<number, number>([[key(start.x, start.y), 0]]);
  const cameFrom = new Map<number, number>();
  const heuristic = (x: number, y: number) => {
    const dx = Math.abs(goal.x - x), dy = Math.abs(goal.y - y);
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy); // octile
  };
  open.set(key(start.x, start.y), heuristic(start.x, start.y));
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const;
  while (open.size) {
    let current = -1, best = Infinity;
    for (const [k, f] of open) if (f < best) { best = f; current = k; }
    open.delete(current);
    const cx = current % grid.width, cy = Math.floor(current / grid.width);
    if (cx === goal.x && cy === goal.y) {
      const raw: GridPoint[] = [];
      let k = current;
      while (k !== key(start.x, start.y)) { raw.push({ x: k % grid.width, y: Math.floor(k / grid.width) }); k = cameFrom.get(k)!; }
      raw.reverse();
      // Smoothing: from each anchor, jump to the farthest visible point.
      const smooth: GridPoint[] = [];
      let anchor = start;
      let i = 0;
      while (i < raw.length) {
        let far = i;
        for (let j = raw.length - 1; j > i; j--) {
          if (lineWalkable(grid, anchor, raw[j])) { far = j; break; }
        }
        smooth.push(raw[far]);
        anchor = raw[far];
        i = far + 1;
      }
      return smooth;
    }
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (!grid.walkable(nx, ny)) continue;
      const diag = dx !== 0 && dy !== 0;
      if (diag && (!grid.walkable(cx + dx, cy) || !grid.walkable(cx, cy + dy))) continue; // no corner cutting
      const nk = key(nx, ny), tentative = (gScore.get(current) ?? Infinity) + (diag ? Math.SQRT2 : 1);
      if (tentative < (gScore.get(nk) ?? Infinity)) {
        gScore.set(nk, tentative); cameFrom.set(nk, current);
        open.set(nk, tentative + heuristic(nx, ny));
      }
    }
  }
  return null;
}
/** Isometric conversions for the locked 64x32 tile (World Part 8 §4.3, Art Part 14 §2). */
export const TILE_W = 64, TILE_H = 32;
export const gridToIso = (x: number, y: number) => ({ x: (x - y) * (TILE_W / 2), y: (x + y) * (TILE_H / 2) });
export const isoToGrid = (px: number, py: number) => ({
  x: (px / (TILE_W / 2) + py / (TILE_H / 2)) / 2,
  y: (py / (TILE_H / 2) - px / (TILE_W / 2)) / 2,
});
