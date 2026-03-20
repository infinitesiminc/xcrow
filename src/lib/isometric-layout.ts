/**
 * Isometric Grid Layout — positions skills on a diamond grid.
 * 
 * Uses relationship graph to place connected skills near each other,
 * then assigns them to isometric grid cells.
 * The grid is larger than the viewport — user scrolls to pan.
 */

import { SKILL_TAXONOMY } from "./skill-map";
import { SKILL_EDGES, getNeighbors } from "./skill-relationships";

export interface GridNode {
  id: string;
  col: number;
  row: number;
  /** Screen-space x (isometric) */
  x: number;
  /** Screen-space y (isometric) */
  y: number;
}

// Grid cell size in pixels (isometric diamond) — large for readability
const CELL_W = 260;
const CELL_H = 160;

// Grid dimensions — enough for ~35 skills with breathing room
const GRID_COLS = 8;
const GRID_ROWS = 8;

// Convert grid coords to isometric screen coords
function toIso(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row) * (CELL_W / 2) + (GRID_COLS * CELL_W) / 2,
    y: (col + row) * (CELL_H / 2) + 80,
  };
}

/**
 * Place skills on the isometric grid using a greedy BFS approach:
 * Start from the most-connected skill, place neighbors nearby.
 */
export function computeIsometricLayout(): GridNode[] {
  // Sort skills by connection count (most connected first)
  const connectionCount = new Map<string, number>();
  for (const skill of SKILL_TAXONOMY) {
    connectionCount.set(skill.id, getNeighbors(skill.id).length);
  }
  const sorted = [...SKILL_TAXONOMY].sort(
    (a, b) => (connectionCount.get(b.id) ?? 0) - (connectionCount.get(a.id) ?? 0)
  );

  const placed = new Map<string, { col: number; row: number }>();
  const occupied = new Set<string>();
  const cellKey = (c: number, r: number) => `${c},${r}`;

  // Place first skill near center
  const startCol = Math.floor(GRID_COLS / 2);
  const startRow = Math.floor(GRID_ROWS / 2);
  placed.set(sorted[0].id, { col: startCol, row: startRow });
  occupied.add(cellKey(startCol, startRow));

  // BFS queue
  const queue = [sorted[0].id];
  const visited = new Set([sorted[0].id]);

  // Neighbor offsets in grid space (adjacent cells)
  const offsets = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, -1], [1, -1], [-1, 1],
  ];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentPos = placed.get(currentId)!;
    const neighbors = getNeighbors(currentId)
      .sort((a, b) => b.strength - a.strength);

    for (const neighbor of neighbors) {
      if (visited.has(neighbor.id)) continue;
      visited.add(neighbor.id);

      // Find closest available cell to current
      let bestCell: { col: number; row: number } | null = null;
      let bestDist = Infinity;

      // Search in expanding radius
      for (let radius = 1; radius <= 4; radius++) {
        for (const [dc, dr] of offsets) {
          const c = currentPos.col + dc * radius;
          const r = currentPos.row + dr * radius;
          if (c < 0 || c >= GRID_COLS || r < 0 || r >= GRID_ROWS) continue;
          if (occupied.has(cellKey(c, r))) continue;

          // Prefer cells at distance proportional to inverse strength
          const idealDist = 4 - neighbor.strength; // strong=1 cell, weak=3 cells
          const dist = Math.abs(radius - idealDist) + Math.random() * 0.5;
          if (dist < bestDist) {
            bestDist = dist;
            bestCell = { col: c, row: r };
          }
        }
        if (bestCell) break;
      }

      if (bestCell) {
        placed.set(neighbor.id, bestCell);
        occupied.add(cellKey(bestCell.col, bestCell.row));
        queue.push(neighbor.id);
      }
    }
  }

  // Place any remaining unvisited skills in empty cells
  for (const skill of sorted) {
    if (placed.has(skill.id)) continue;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (!occupied.has(cellKey(c, r))) {
          placed.set(skill.id, { col: c, row: r });
          occupied.add(cellKey(c, r));
          break;
        }
      }
      if (placed.has(skill.id)) break;
    }
  }

  return Array.from(placed.entries()).map(([id, { col, row }]) => {
    const iso = toIso(col, row);
    return { id, col, row, x: iso.x, y: iso.y };
  });
}

/** Total canvas size needed for the isometric grid */
export function getCanvasSize(): { width: number; height: number } {
  return {
    width: GRID_COLS * CELL_W + CELL_W,
    height: GRID_ROWS * CELL_H + CELL_H + 160,
  };
}

export { CELL_W, CELL_H };
