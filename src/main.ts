import type { Direction, GameState, LevelData, PlayerState, Door, Puzzle } from './types';
import { buildLevel } from './game/level';
import {
  createPlayer,
  startMove,
  updateMovement,
  tokenKey,
  CELL_SIZE,
} from './game/player';
import {
  createInitialState,
  loadState,
  hasSavedState,
  saveState,
  clearState,
  applyLevelComplete,
} from './game/state';
import { renderMaze } from './renderer/mazeRenderer';
import { renderPlayer } from './renderer/playerRenderer';
import { renderHUD } from './renderer/hudRenderer';
import { PuzzleOverlay } from './ui/puzzleOverlay';
import { LevelCompleteOverlay } from './ui/levelComplete';
import { MainMenu, GameOverOverlay } from './ui/mainMenu';
import { DELTA } from './maze/generator';

// ── Phase ─────────────────────────────────────────────────────────────────────
type Phase = 'menu' | 'loading' | 'playing' | 'puzzle' | 'levelComplete' | 'gameOver';

// ── Global state ──────────────────────────────────────────────────────────────
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let phase: Phase = 'menu';
let gameState: GameState;
let levelData: LevelData;
let player: PlayerState;

// Input queue: only store the last pending direction
let pendingDir: Direction | null = null;
const heldKeys = new Set<string>();

// Door open animations: door key → start timestamp
const doorOpenAnimations = new Map<string, number>();
const DOOR_ANIM_MS = 500;

// ── UI components ──────────────────────────────────────────────────────────────
let puzzleOverlay: PuzzleOverlay;
let levelCompleteOverlay: LevelCompleteOverlay;
let mainMenu: MainMenu;
let gameOverOverlay: GameOverOverlay;

// ── Initialisation ────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('game') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const uiLayer = document.getElementById('ui-layer')!;
  puzzleOverlay       = new PuzzleOverlay(uiLayer);
  levelCompleteOverlay = new LevelCompleteOverlay(uiLayer);
  mainMenu            = new MainMenu(uiLayer);
  gameOverOverlay     = new GameOverOverlay(uiLayer);

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup',   handleKeyUp);

  const savedState = loadState();
  mainMenu.show(
    hasSavedState(),
    savedState?.level ?? 1,
    () => startNewGame(),
    () => continueGame(savedState!),
  );

  requestAnimationFrame(gameLoop);
});

function resizeCanvas(): void {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

// ── Game loop ─────────────────────────────────────────────────────────────────
function gameLoop(timestamp: number): void {
  update(timestamp);
  render(timestamp);
  requestAnimationFrame(gameLoop);
}

function update(timestamp: number): void {
  if (phase !== 'playing') return;
  if (!levelData || !player) return;

  // Advance player movement lerp
  player = updateMovement(player, timestamp);

  // Process next move once the current animation finishes
  if (!player.isMoving) {
    // Derive a direction from held keys if pendingDir was consumed
    if (!pendingDir) {
      pendingDir = dirFromHeldKeys();
    }
    if (pendingDir) {
      processMove(pendingDir, timestamp);
      pendingDir = null;
    }
  }

  // Token pickup
  const tk = tokenKey(player.col, player.row);
  if (!player.collectedTokenKeys.has(tk)) {
    const cell = levelData.grid.cells[player.row]?.[player.col];
    if (cell?.hasToken) {
      cell.hasToken = false;
      player.collectedTokenKeys.add(tk);
      gameState = { ...gameState, tokens: gameState.tokens + 1 };
      saveState(gameState);
    }
  }

  // Exit check (only when movement finished)
  if (!player.isMoving &&
      player.col === levelData.grid.exitCol &&
      player.row === levelData.grid.exitRow) {
    triggerLevelComplete();
  }
}

function render(timestamp: number): void {
  const w = canvas.width;
  const h = canvas.height;

  // Clear
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, w, h);

  if (phase === 'playing' || phase === 'puzzle' || phase === 'levelComplete') {
    // Camera: centre on player
    const camX = Math.round(w / 2 - (player.pixelX + CELL_SIZE / 2));
    const camY = Math.round(h / 2 - (player.pixelY + CELL_SIZE / 2));

    ctx.save();
    ctx.translate(camX, camY);

    // Build door-open progress map
    const doorProgress = new Map<string, number>();
    for (const door of levelData.doors) {
      const dk = `${door.col},${door.row},${door.direction}`;
      if (door.isOpen) {
        const animStart = doorOpenAnimations.get(dk);
        if (animStart !== undefined) {
          const t = Math.min((timestamp - animStart) / DOOR_ANIM_MS, 1);
          doorProgress.set(dk, t);
        } else {
          doorProgress.set(dk, 1);
        }
      }
    }

    renderMaze(ctx, levelData.grid, levelData.doors, doorProgress);
    renderPlayer(ctx, player);

    ctx.restore();

    renderHUD(ctx, gameState, w);
  }
}

// ── Input ─────────────────────────────────────────────────────────────────────
function handleKeyDown(e: KeyboardEvent): void {
  heldKeys.add(e.key);

  if (phase !== 'playing') return;
  if (puzzleOverlay.isVisible) return;

  const dir = keyToDir(e.key);
  if (dir) {
    e.preventDefault();
    pendingDir = dir;
  }
}

function handleKeyUp(e: KeyboardEvent): void {
  heldKeys.delete(e.key);
}

function dirFromHeldKeys(): Direction | null {
  for (const key of ['ArrowUp','w','W','ArrowDown','s','S','ArrowLeft','a','A','ArrowRight','d','D']) {
    if (heldKeys.has(key)) {
      const d = keyToDir(key);
      if (d) return d;
    }
  }
  return null;
}

function keyToDir(key: string): Direction | null {
  switch (key) {
    case 'ArrowUp':    case 'w': case 'W': return 'N';
    case 'ArrowDown':  case 's': case 'S': return 'S';
    case 'ArrowLeft':  case 'a': case 'A': return 'W';
    case 'ArrowRight': case 'd': case 'D': return 'E';
    default: return null;
  }
}

// ── Movement logic ────────────────────────────────────────────────────────────
function processMove(dir: Direction, timestamp: number): void {
  const cell = levelData.grid.cells[player.row][player.col];

  // Always update facing even if blocked
  player = { ...player, facing: dir };

  // Wall collision
  if (cell.walls[dir]) return;

  // Door check
  const door = findDoor(player.col, player.row, dir);
  if (door && !door.isOpen) {
    const puzzle = levelData.puzzles.get(door.puzzleId);
    if (puzzle) openPuzzleOverlay(puzzle, door);
    return;
  }

  // Move
  player = startMove(player, dir, timestamp);
}

function findDoor(col: number, row: number, dir: Direction): Door | undefined {
  // Door stored at (col, row, dir) or at neighbour (col+dc, row+dr, opposite)
  for (const door of levelData.doors) {
    if (door.col === col && door.row === row && door.direction === dir) return door;
    const [dc, dr] = DELTA[door.direction];
    const nc = door.col + dc;
    const nr = door.row + dr;
    const opp: Direction =
      door.direction === 'N' ? 'S' :
      door.direction === 'S' ? 'N' :
      door.direction === 'E' ? 'W' : 'E';
    if (nc === col && nr === row && opp === dir) return door;
  }
  return undefined;
}

// ── Puzzle overlay ─────────────────────────────────────────────────────────────
function openPuzzleOverlay(puzzle: Puzzle, door: Door): void {
  phase = 'puzzle';

  puzzleOverlay.show(puzzle, door, gameState.tokens, (result) => {
    if (result.correct) {
      door.isOpen = true;
      const dk = `${door.col},${door.row},${door.direction}`;
      doorOpenAnimations.set(dk, performance.now());
      phase = 'playing';
      return;
    }

    if (result.livesLost > 0) {
      // Deduct life
      gameState = { ...gameState, lives: gameState.lives - result.livesLost };
      saveState(gameState);
      if (gameState.lives <= 0) {
        puzzleOverlay.hide();
        triggerGameOver();
        return;
      }
    } else if (result.livesLost < 0) {
      // Negative = token cost from hint
      gameState = { ...gameState, tokens: Math.max(0, gameState.tokens + result.livesLost) };
      saveState(gameState);
    }

    if (!puzzleOverlay.isVisible) {
      phase = 'playing';
    }
  });
}

// ── Level transitions ─────────────────────────────────────────────────────────
function triggerLevelComplete(): void {
  if (phase === 'levelComplete') return;
  phase = 'levelComplete';
  const prevState = { ...gameState };
  const newState = applyLevelComplete(gameState);
  gameState = newState;
  saveState(gameState);

  levelCompleteOverlay.show(prevState, newState, async () => {
    phase = 'loading';
    await loadLevel(gameState.level);
    phase = 'playing';
  });
}

function triggerGameOver(): void {
  phase = 'gameOver';
  clearState();
  gameOverOverlay.show(
    { level: gameState.level, score: gameState.score, bestLevel: gameState.bestLevel },
    () => startNewGame(),
  );
}

// ── Game start / load ─────────────────────────────────────────────────────────
async function startNewGame(): Promise<void> {
  clearState();
  gameState = createInitialState();
  saveState(gameState);
  phase = 'loading';
  await loadLevel(1);
  phase = 'playing';
}

async function continueGame(saved: GameState): Promise<void> {
  gameState = saved;
  phase = 'loading';
  await loadLevel(gameState.level);
  phase = 'playing';
}

async function loadLevel(level: number): Promise<void> {
  doorOpenAnimations.clear();
  levelData = await buildLevel(level);
  player = createPlayer(levelData.grid.startCol, levelData.grid.startRow);
  pendingDir = null;
}
