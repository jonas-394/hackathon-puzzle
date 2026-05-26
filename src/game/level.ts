import type { LevelData, Door, Puzzle } from '../types';
import { createRNG, shuffle, type RNG } from '../utils/rng';
import {
  generateMaze,
  findCriticalPath,
  findBranchDeadEnds,
  dirBetween,
} from '../maze/generator';
import { createPuzzle } from '../puzzles/factory';

// ── Maze size / door count by level ──────────────────────────────────────────
function mazeSize(level: number): { cols: number; rows: number } {
  if (level <= 3)  return { cols: 5,  rows: 5  };
  if (level <= 6)  return { cols: 7,  rows: 7  };
  if (level <= 10) return { cols: 9,  rows: 9  };
  const extra = Math.min(Math.floor((level - 11) / 2), 5);
  return { cols: 11 + extra, rows: 11 + extra };
}

function doorCount(level: number): number {
  if (level <= 3)  return 2;
  if (level <= 6)  return 3;
  if (level <= 10) return Math.random() < 0.5 ? 3 : 4;
  return 4;
}

function tokenCount(level: number): number {
  if (level <= 3)  return 1;
  if (level <= 6)  return 2;
  return 3;
}

// ── Level builder ─────────────────────────────────────────────────────────────
export async function buildLevel(levelNum: number): Promise<LevelData> {
  // Seed is deterministic from level number
  const seed = levelNum * 0x9e3779b9 + 0xdeadbeef;
  const rng: RNG = createRNG(seed);

  const { cols, rows } = mazeSize(levelNum);
  const grid = generateMaze(cols, rows, rng);
  const criticalPath = findCriticalPath(grid);

  // ── Place doors evenly along the critical path ────────────────────────────
  const nDoors = Math.min(doorCount(levelNum), criticalPath.length - 2);
  const doorPositions = pickEvenIndices(criticalPath.length - 1, nDoors);

  const doors: Door[] = [];
  const puzzles = new Map<string, Puzzle>();

  for (const pathIdx of doorPositions) {
    const [fc, fr] = criticalPath[pathIdx];
    const [tc, tr] = criticalPath[pathIdx + 1];
    const dir = dirBetween(fc, fr, tc, tr);

    const puzzle = await createPuzzle(levelNum, rng);
    puzzles.set(puzzle.id, puzzle);

    doors.push({
      col: fc,
      row: fr,
      direction: dir,
      puzzleId: puzzle.id,
      isOpen: false,
      wrongAttempts: 0,
      lockedUntil: 0,
    });
  }

  // ── Place hint tokens in dead-end branch cells ────────────────────────────
  const branchCells = shuffle(rng, findBranchDeadEnds(grid, criticalPath));
  const nTokens = Math.min(tokenCount(levelNum), branchCells.length);
  const tokenCells: Array<{ col: number; row: number }> = [];

  for (let i = 0; i < nTokens; i++) {
    const [col, row] = branchCells[i];
    grid.cells[row][col].hasToken = true;
    tokenCells.push({ col, row });
  }

  return { levelNum, seed, grid, doors, puzzles, tokenCells };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Pick `count` indices spread evenly over [1, length-1] (exclusive of endpoints). */
function pickEvenIndices(length: number, count: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.round((i + 1) * (length / (count + 1)));
    // Clamp to valid range [1, length-1]
    indices.push(Math.max(1, Math.min(length - 1, idx)));
  }
  // Deduplicate
  return [...new Set(indices)];
}
