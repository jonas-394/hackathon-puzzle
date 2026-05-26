// ── Directions ──────────────────────────────────────────────────────────────
export type Direction = 'N' | 'S' | 'E' | 'W';

// ── Maze ─────────────────────────────────────────────────────────────────────
export interface Cell {
  col: number;
  row: number;
  walls: Record<Direction, boolean>; // true = wall present
  isStart: boolean;
  isExit: boolean;
  hasToken: boolean;
}

export interface MazeGrid {
  cols: number;
  rows: number;
  cells: Cell[][];
  startCol: number;
  startRow: number;
  exitCol: number;
  exitRow: number;
}

// ── Puzzles ───────────────────────────────────────────────────────────────────
export type PuzzleType =
  | 'numberSeq'
  | 'letterSeq'
  | 'analogy'
  | 'oddOneOut'
  | 'shapeSeq'
  | 'wordAnalogy';

export interface Puzzle {
  id: string;
  type: PuzzleType;
  prompt: string;       // instructions (and optional key info) shown above ciphertext
  ciphertext: string;   // the encoded string to decode
  answerHash: string;   // SHA-256 hex of normalized answer
  hints: string[];      // progressive hint stages (index 0 = cheapest)
  showTypeLabel: boolean;
  freeHints: number;    // hint stages revealed for free (0 or 1)
}

// ── Doors ─────────────────────────────────────────────────────────────────────
export interface Door {
  col: number;
  row: number;
  direction: Direction;  // which wall of this cell the door occupies
  puzzleId: string;
  isOpen: boolean;
  wrongAttempts: number;
  lockedUntil: number;   // Date.now() ms; 0 = not locked
}

// ── Level ─────────────────────────────────────────────────────────────────────
export interface LevelData {
  levelNum: number;
  seed: number;
  grid: MazeGrid;
  doors: Door[];
  puzzles: Map<string, Puzzle>;
  tokenCells: Array<{ col: number; row: number }>;
}

// ── Player ────────────────────────────────────────────────────────────────────
export interface PlayerState {
  col: number;
  row: number;
  pixelX: number;
  pixelY: number;
  startPixelX: number;
  startPixelY: number;
  targetPixelX: number;
  targetPixelY: number;
  facing: Direction;
  isMoving: boolean;
  moveStartTime: number;
  collectedTokenKeys: Set<string>;
}

// ── Game state (persisted) ────────────────────────────────────────────────────
export interface GameState {
  level: number;
  lives: number;
  tokens: number;
  score: number;
  bestLevel: number;
}
