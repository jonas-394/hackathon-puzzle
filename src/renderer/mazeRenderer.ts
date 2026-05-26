import type { MazeGrid, Door, Direction } from '../types';
import { CELL_SIZE } from '../game/player';
import { DELTA } from '../maze/generator';

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  background: '#0d0d1a',
  floor:      '#16213e',
  floorStart: '#0f3460',
  floorExit:  '#0a3d2e',
  wall:       '#2a2a60',
  wallAccent: '#4040a0',
  doorLocked: '#e94560',
  doorOpen:   '#1a3a2a',
  exitGlow:   '#4ecca3',
  startGlow:  '#53d8fb',
  token:      '#ffd700',
} as const;

const WALL_WIDTH = 3;
const DOOR_WIDTH = 8;

export function renderMaze(
  ctx: CanvasRenderingContext2D,
  grid: MazeGrid,
  doors: Door[],
  doorOpenProgress: Map<string, number>, // door key → 0..1 (1=fully open)
): void {
  const { cols, rows, cells } = grid;

  // Build a quick-lookup map: "col,row,dir" → Door
  const doorMap = new Map<string, Door>();
  for (const door of doors) {
    doorMap.set(`${door.col},${door.row},${door.direction}`, door);
    // Also index from the other side so player approaching from either direction triggers
    const [dc, dr] = DELTA[door.direction];
    const nc = door.col + dc;
    const nr = door.row + dr;
    const opp: Direction =
      door.direction === 'N' ? 'S' :
      door.direction === 'S' ? 'N' :
      door.direction === 'E' ? 'W' : 'E';
    doorMap.set(`${nc},${nr},${opp}`, door);
  }

  // ── Draw floor tiles ───────────────────────────────────────────────────────
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r][c];
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;

      ctx.fillStyle = cell.isStart ? C.floorStart : cell.isExit ? C.floorExit : C.floor;
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

      // Glow markers for start / exit
      if (cell.isStart) {
        ctx.strokeStyle = C.startGlow;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
      }
      if (cell.isExit) {
        ctx.strokeStyle = C.exitGlow;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
        // Exit arrow (downward triangle)
        const cx = x + CELL_SIZE / 2;
        const cy = y + CELL_SIZE / 2;
        ctx.fillStyle = C.exitGlow;
        ctx.beginPath();
        ctx.moveTo(cx, cy + 12);
        ctx.lineTo(cx - 10, cy - 6);
        ctx.lineTo(cx + 10, cy - 6);
        ctx.closePath();
        ctx.fill();
      }

      // Token pickup
      if (cell.hasToken) {
        const cx = x + CELL_SIZE / 2;
        const cy = y + CELL_SIZE / 2;
        ctx.fillStyle = C.token;
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff8';
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ── Draw walls ─────────────────────────────────────────────────────────────
  ctx.strokeStyle = C.wallAccent;
  ctx.lineWidth = WALL_WIDTH;
  ctx.lineCap = 'square';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r][c];
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;

      const directions: Direction[] = ['N', 'S', 'E', 'W'];
      for (const dir of directions) {
        if (!cell.walls[dir]) continue;

        // Skip if a door occupies this wall (door is rendered separately below)
        const dk = `${c},${r},${dir}`;
        if (doorMap.has(dk)) continue;

        ctx.beginPath();
        drawWallSegment(ctx, x, y, dir);
        ctx.stroke();
      }
    }
  }

  // ── Draw doors ─────────────────────────────────────────────────────────────
  for (const door of doors) {
    const x = door.col * CELL_SIZE;
    const y = door.row * CELL_SIZE;
    const prog = doorOpenProgress.get(`${door.col},${door.row},${door.direction}`) ?? (door.isOpen ? 1 : 0);

    // Lerp colour: locked red → open dark-green
    const r = Math.round(lerp(0xe9, 0x0a, prog));
    const g = Math.round(lerp(0x45, 0x5a, prog));
    const b = Math.round(lerp(0x60, 0x28, prog));
    ctx.strokeStyle = `rgb(${r},${g},${b})`;
    ctx.lineWidth = prog >= 1 ? 1 : DOOR_WIDTH;

    ctx.beginPath();
    drawWallSegment(ctx, x, y, door.direction);
    ctx.stroke();

    // Lock icon on closed doors
    if (prog < 1) {
      drawLockIcon(ctx, x, y, door.direction);
    }
  }
}

// ── Wall segment helper ───────────────────────────────────────────────────────
function drawWallSegment(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: Direction,
): void {
  switch (dir) {
    case 'N': ctx.moveTo(x, y);                    ctx.lineTo(x + CELL_SIZE, y);                    break;
    case 'S': ctx.moveTo(x, y + CELL_SIZE);        ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);        break;
    case 'W': ctx.moveTo(x, y);                    ctx.lineTo(x, y + CELL_SIZE);                    break;
    case 'E': ctx.moveTo(x + CELL_SIZE, y);        ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);        break;
  }
}

// ── Small lock icon drawn at the door midpoint ────────────────────────────────
function drawLockIcon(
  ctx: CanvasRenderingContext2D,
  cellX: number,
  cellY: number,
  dir: Direction,
): void {
  let cx: number, cy: number;
  switch (dir) {
    case 'N': cx = cellX + CELL_SIZE / 2; cy = cellY;                    break;
    case 'S': cx = cellX + CELL_SIZE / 2; cy = cellY + CELL_SIZE;        break;
    case 'W': cx = cellX;                 cy = cellY + CELL_SIZE / 2;    break;
    case 'E': cx = cellX + CELL_SIZE;     cy = cellY + CELL_SIZE / 2;    break;
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e94560';
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
