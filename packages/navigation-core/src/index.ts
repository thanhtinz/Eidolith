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
/** A* pathfinding (4-directional). Returns path excluding start, or null if unreachable. */
export function findPath(grid: NavGrid, start: GridPoint, goal: GridPoint): GridPoint[] | null {
  if (!grid.walkable(goal.x, goal.y)) return null;
  const key = (x: number, y: number) => y * grid.width + x;
  const open = new Map<number, number>(); // key -> fScore
  const gScore = new Map<number, number>([[key(start.x, start.y), 0]]);
  const cameFrom = new Map<number, number>();
  open.set(key(start.x, start.y), Math.abs(goal.x - start.x) + Math.abs(goal.y - start.y));
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
  while (open.size) {
    let current = -1, best = Infinity;
    for (const [k, f] of open) if (f < best) { best = f; current = k; }
    open.delete(current);
    const cx = current % grid.width, cy = Math.floor(current / grid.width);
    if (cx === goal.x && cy === goal.y) {
      const path: GridPoint[] = [];
      let k = current;
      while (k !== key(start.x, start.y)) { path.push({ x: k % grid.width, y: Math.floor(k / grid.width) }); k = cameFrom.get(k)!; }
      return path.reverse();
    }
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (!grid.walkable(nx, ny)) continue;
      const nk = key(nx, ny), tentative = (gScore.get(current) ?? Infinity) + 1;
      if (tentative < (gScore.get(nk) ?? Infinity)) {
        gScore.set(nk, tentative); cameFrom.set(nk, current);
        open.set(nk, tentative + Math.abs(goal.x - nx) + Math.abs(goal.y - ny));
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
