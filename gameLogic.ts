// ─────────────────────────────────────────────────────────────────────────────
// gameLogic.ts — Boarder Battleship helper
// ─────────────────────────────────────────────────────────────────────────────

export const GRID = 12;

export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';
export type Grid = CellState[][];
export type Orientation = 'H' | 'V';

// ── Piece definitions ─────────────────────────────────────────────────────────
// Each piece is described by its occupied cells relative to an anchor (row 0, col 0).
// The soldier shape (from the image): 4-cell vertical line + 1 extra at chest (row 1)
// and 1 extra at base (row 3) — making an L+bump silhouette.

export interface PieceDef {
  id: string;
  label: string;
  // relative [row, col] offsets from anchor
  cells: [number, number][];
  asset: any; // require('../assets/pieces/<name>.png')
  color: string; // tint for hit overlay
}

export const PIECES: PieceDef[] = [
  {
    id: 'd20',
    label: 'D20 Dice',
    // 2×2 block
    cells: [[0,0],[0,1],[1,0],[1,1]],
    asset: require('../assets/pieces/d20.png'),
    color: '#a78bfa',
  },
  {
    id: 'king',
    label: 'Chess King',
    // 3-cell vertical line
    cells: [[0,0],[1,0],[2,0]],
    asset: require('../assets/pieces/king.png'),
    color: '#fbbf24',
  },
  {
    id: 'car',
    label: 'Monopoly Car',
    // 2-cell horizontal line
    cells: [[0,0],[0,1]],
    asset: require('../assets/pieces/car.png'),
    color: '#34d399',
  },
  {
    id: 'soldier',
    label: 'Soldier',
    // 4-cell vertical spine + 1 extra width at chest (row 1) + 1 extra at base (row 3)
    // Mirrors the silhouette in the reference image
    cells: [[0,0],[1,0],[1,1],[2,0],[3,0],[3,1]],
    asset: require('../assets/pieces/soldier.png'),
    color: '#4ade80',
  },
  {
    id: 'card',
    label: 'Playing Card',
    // 3×2 rectangle (3 rows, 2 cols)
    cells: [[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]],
    asset: require('../assets/pieces/card.png'),
    color: '#f87171',
  },
];

// ── Grid helpers ──────────────────────────────────────────────────────────────

export function emptyGrid(): Grid {
  return Array.from({ length: GRID }, () => Array(GRID).fill('empty'));
}

/** Returns all absolute [row, col] positions for a piece at anchor with optional rotation */
export function getPieceCells(
  piece: PieceDef,
  anchorRow: number,
  anchorCol: number,
  rotate: boolean = false,
): [number, number][] {
  return piece.cells.map(([dr, dc]) => {
    const [r, c] = rotate ? [dc, dr] : [dr, dc];
    return [anchorRow + r, anchorCol + c];
  });
}

/** Returns true if all cells are inside the grid and not already occupied */
export function canPlace(
  grid: Grid,
  cells: [number, number][],
): boolean {
  return cells.every(([r, c]) =>
    r >= 0 && r < GRID && c >= 0 && c < GRID && grid[r][c] === 'empty',
  );
}

/** Mutates a grid copy, marking cells as 'ship' */
export function placePiece(
  grid: Grid,
  cells: [number, number][],
): Grid {
  const next = grid.map(row => [...row]);
  cells.forEach(([r, c]) => { next[r][c] = 'ship'; });
  return next;
}

// ── Placement record (tracks which cells belong to which piece instance) ──────

export interface PlacedPiece {
  defId: string;
  cells: [number, number][];
  sunk: boolean;
}

/** Randomly place all pieces on a grid. Returns [grid, placedPieces]. */
export function randomPlacement(): [Grid, PlacedPiece[]] {
  let grid = emptyGrid();
  const placed: PlacedPiece[] = [];

  for (const piece of PIECES) {
    let success = false;
    let attempts = 0;
    while (!success && attempts < 500) {
      attempts++;
      const rotate = Math.random() < 0.5;
      const row = Math.floor(Math.random() * GRID);
      const col = Math.floor(Math.random() * GRID);
      const cells = getPieceCells(piece, row, col, rotate);
      if (canPlace(grid, cells)) {
        grid = placePiece(grid, cells);
        placed.push({ defId: piece.id, cells, sunk: false });
        success = true;
      }
    }
  }

  return [grid, placed];
}

// ── Attack resolution ─────────────────────────────────────────────────────────

export interface AttackResult {
  grid: Grid;
  placedPieces: PlacedPiece[];
  wasHit: boolean;
  sunkPiece: PlacedPiece | null;
  gameOver: boolean;
}

export function resolveAttack(
  grid: Grid,
  placedPieces: PlacedPiece[],
  row: number,
  col: number,
): AttackResult {
  const next = grid.map(r => [...r]);
  const cell = next[row][col];

  if (cell === 'hit' || cell === 'miss' || cell === 'sunk') {
    // Already attacked — no change
    return { grid, placedPieces, wasHit: false, sunkPiece: null, gameOver: false };
  }

  const wasHit = cell === 'ship';
  next[row][col] = wasHit ? 'hit' : 'miss';

  let sunkPiece: PlacedPiece | null = null;
  const updatedPieces = placedPieces.map(p => {
    if (p.sunk) return p;
    const allHit = p.cells.every(([r, c]) => next[r][c] === 'hit' || next[r][c] === 'sunk');
    if (allHit) {
      // Mark all cells of sunk piece
      p.cells.forEach(([r, c]) => { next[r][c] = 'sunk'; });
      sunkPiece = { ...p, sunk: true };
      return sunkPiece;
    }
    return p;
  });

  const gameOver = updatedPieces.every(p => p.sunk);

  return {
    grid: next,
    placedPieces: updatedPieces,
    wasHit,
    sunkPiece,
    gameOver,
  };
}

/**
 * Returns a cell [row, col] for the CPU to attack.
 *
 * Target mode — if any cells are 'hit' (damaged but not yet sunk), pick a
 * random unattacked orthogonal neighbour of one of them so the CPU chases
 * and finishes off wounded pieces.
 *
 * Hunt mode — no active hits, fall back to a random unattacked cell.
 */
export function cpuPickCell(grid: Grid): [number, number] {
  // Gather all hit-but-not-sunk cells
  const hitCells: [number, number][] = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (grid[r][c] === 'hit') hitCells.push([r, c]);
    }
  }

  if (hitCells.length > 0) {
    // Collect unattacked orthogonal neighbours of every active hit cell
    const neighbours: [number, number][] = [];
    const seen = new Set<string>();
    const DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [hr, hc] of hitCells) {
      for (const [dr, dc] of DIRS) {
        const nr = hr + dr;
        const nc = hc + dc;
        const key = `${nr},${nc}`;
        if (
          nr >= 0 && nr < GRID &&
          nc >= 0 && nc < GRID &&
          !seen.has(key) &&
          (grid[nr][nc] === 'empty' || grid[nr][nc] === 'ship')
        ) {
          neighbours.push([nr, nc]);
          seen.add(key);
        }
      }
    }
    if (neighbours.length > 0) {
      return neighbours[Math.floor(Math.random() * neighbours.length)];
    }
  }

  // Hunt mode — pick any unattacked cell at random
  const available: [number, number][] = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (grid[r][c] === 'empty' || grid[r][c] === 'ship') {
        available.push([r, c]);
      }
    }
  }
  return available[Math.floor(Math.random() * available.length)];
}
