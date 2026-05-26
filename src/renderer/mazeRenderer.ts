import type { MazeGrid, Door, Direction } from '../types';
import { CELL_SIZE } from '../game/player';
import { DELTA } from '../maze/generator';

// ── Colour palette (Telia purple × Pac-Man × Mario) ──────────────────────────
const C = {
  floor0:         '#0e0020',
  floor1:         '#14002e',
  floorStart:     '#001840',
  floorExit:      '#001a14',
  wallStroke:     '#dd44ff',
  wallGlow:       '#990ae3',
  doorLockedGlow: '#ff5500',
  doorOpenGlow:   '#00ff88',
  exitPole:       '#bbbbcc',
  exitFlag:       '#4ecca3',
  startGlow:      '#44aaff',
  pellet:         '#ffe000',
  pelletGlow:     '#ffaa00',
  tileGrid:       'rgba(153,10,227,0.07)',
} as const;

const WALL_WIDTH = 5;
const DOOR_WIDTH = 11;

export function renderMaze(
  ctx: CanvasRenderingContext2D,
  grid: MazeGrid,
  doors: Door[],
  doorOpenProgress: Map<string, number>,
  timestamp: number,
): void {
  const { cols, rows, cells } = grid;

  // Door lookup (both sides)
  const doorMap = new Map<string, Door>();
  for (const door of doors) {
    doorMap.set(`${door.col},${door.row},${door.direction}`, door);
    const [dc, dr] = DELTA[door.direction];
    const nc = door.col + dc;
    const nr = door.row + dr;
    doorMap.set(`${nc},${nr},${opposite(door.direction)}`, door);
  }

  // ── Floor tiles (checkerboard) ────────────────────────────────────────────
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r][c];
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;
      ctx.fillStyle = cell.isStart ? C.floorStart : cell.isExit ? C.floorExit
        : (c + r) % 2 === 0 ? C.floor0 : C.floor1;
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = C.tileGrid;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
    }
  }

  // ── Special cells ─────────────────────────────────────────────────────────
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r][c];
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;
      const cx = x + CELL_SIZE / 2;
      const cy = y + CELL_SIZE / 2;
      if (cell.isStart)  drawStartMarker(ctx, x, y);
      if (cell.isExit)   drawFlagpole(ctx, cx, cy, timestamp);
      if (cell.hasToken) drawPellet(ctx, cx, cy, timestamp, c, r);
    }
  }

  // ── Neon walls ────────────────────────────────────────────────────────────
  ctx.save();
  ctx.shadowBlur = 14;
  ctx.shadowColor = C.wallGlow;
  ctx.strokeStyle = C.wallStroke;
  ctx.lineWidth = WALL_WIDTH;
  ctx.lineCap = 'round';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r][c];
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;
      for (const dir of ['N', 'S', 'E', 'W'] as Direction[]) {
        if (!cell.walls[dir] || doorMap.has(`${c},${r},${dir}`)) continue;
        ctx.beginPath();
        wallSeg(ctx, x, y, dir);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  // ── Doors ─────────────────────────────────────────────────────────────────
  for (const door of doors) {
    const x = door.col * CELL_SIZE;
    const y = door.row * CELL_SIZE;
    const dk = `${door.col},${door.row},${door.direction}`;
    const prog = doorOpenProgress.get(dk) ?? (door.isOpen ? 1 : 0);
    drawDoor(ctx, x, y, door.direction, prog, timestamp);
  }
}

// ── Start marker ─────────────────────────────────────────────────────────────
function drawStartMarker(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.shadowBlur = 18;
  ctx.shadowColor = C.startGlow;
  ctx.strokeStyle = C.startGlow;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 8, y + 8, CELL_SIZE - 16, CELL_SIZE - 16);
  ctx.fillStyle = 'rgba(68,170,255,0.12)';
  ctx.fillRect(x + 8, y + 8, CELL_SIZE - 16, CELL_SIZE - 16);
  ctx.shadowBlur = 0;
  ctx.fillStyle = C.startGlow;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', x + CELL_SIZE / 2, y + CELL_SIZE / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

// ── Mario-style flagpole ──────────────────────────────────────────────────────
function drawFlagpole(ctx: CanvasRenderingContext2D, cx: number, cy: number, timestamp: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(cx - 1, cy - 24, 6, 32);
  ctx.shadowBlur = 8;
  ctx.shadowColor = C.exitFlag;
  ctx.fillStyle = C.exitPole;
  ctx.fillRect(cx - 2, cy - 24, 4, 32);
  const wave = Math.sin(timestamp / 250) * 4;
  ctx.fillStyle = C.exitFlag;
  ctx.shadowBlur = 14;
  ctx.shadowColor = C.exitFlag;
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - 24);
  ctx.quadraticCurveTo(cx + 15 + wave, cy - 17, cx + 2, cy - 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.exitFlag;
  ctx.beginPath();
  ctx.arc(cx, cy + 8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Pac-Man style pellet ──────────────────────────────────────────────────────
function drawPellet(ctx: CanvasRenderingContext2D, cx: number, cy: number, timestamp: number, c: number, r: number): void {
  const pulse = 0.8 + 0.2 * Math.sin(timestamp / 380 + c * 0.9 + r * 1.3);
  ctx.save();
  ctx.shadowBlur = 14 * pulse;
  ctx.shadowColor = C.pelletGlow;
  ctx.fillStyle = C.pellet;
  ctx.beginPath();
  ctx.arc(cx, cy, 8 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(cx - 2.5, cy - 2.5, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Door ──────────────────────────────────────────────────────────────────────
function drawDoor(ctx: CanvasRenderingContext2D, cellX: number, cellY: number, dir: Direction, prog: number, _timestamp: number): void {
  const rr = Math.round(lerp(0xff, 0x00, prog));
  const gg = Math.round(lerp(0x22, 0xdd, prog));
  const bb = Math.round(lerp(0x00, 0x44, prog));
  ctx.save();
  ctx.shadowBlur = prog >= 1 ? 6 : 20;
  ctx.shadowColor = prog >= 1 ? C.doorOpenGlow : C.doorLockedGlow;
  ctx.strokeStyle = `rgb(${rr},${gg},${bb})`;
  ctx.lineWidth = prog >= 1 ? 2 : DOOR_WIDTH;
  ctx.lineCap = 'round';
  ctx.beginPath();
  wallSeg(ctx, cellX, cellY, dir);
  ctx.stroke();
  if (prog < 1) {
    drawBrickMortar(ctx, cellX, cellY, dir);
    drawLockDot(ctx, cellX, cellY, dir);
  }
  ctx.restore();
}

function drawBrickMortar(ctx: CanvasRenderingContext2D, cx: number, cy: number, dir: Direction): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,140,60,0.55)';
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 0;
  const isHoriz = dir === 'N' || dir === 'S';
  const wallX = dir === 'E' ? cx + CELL_SIZE : cx;
  const wallY = dir === 'S' ? cy + CELL_SIZE : cy;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    if (isHoriz) {
      const mx = cx + i * (CELL_SIZE / 4);
      ctx.moveTo(mx, wallY - 6); ctx.lineTo(mx, wallY + 6);
    } else {
      const my = cy + i * (CELL_SIZE / 4);
      ctx.moveTo(wallX - 6, my); ctx.lineTo(wallX + 6, my);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawLockDot(ctx: CanvasRenderingContext2D, cellX: number, cellY: number, dir: Direction): void {
  const mx = (dir === 'N' || dir === 'S') ? cellX + CELL_SIZE / 2
    : dir === 'W' ? cellX : cellX + CELL_SIZE;
  const my = (dir === 'E' || dir === 'W') ? cellY + CELL_SIZE / 2
    : dir === 'N' ? cellY : cellY + CELL_SIZE;
  ctx.save();
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#fff';
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff2200';
  ctx.beginPath(); ctx.arc(mx, my, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function wallSeg(ctx: CanvasRenderingContext2D, x: number, y: number, dir: Direction): void {
  switch (dir) {
    case 'N': ctx.moveTo(x, y);             ctx.lineTo(x + CELL_SIZE, y);             break;
    case 'S': ctx.moveTo(x, y + CELL_SIZE); ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE); break;
    case 'W': ctx.moveTo(x, y);             ctx.lineTo(x, y + CELL_SIZE);             break;
    case 'E': ctx.moveTo(x + CELL_SIZE, y); ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE); break;
  }
}

function opposite(dir: Direction): Direction {
  return dir === 'N' ? 'S' : dir === 'S' ? 'N' : dir === 'E' ? 'W' : 'E';
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
