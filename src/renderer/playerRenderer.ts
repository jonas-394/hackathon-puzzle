import type { PlayerState, Direction } from '../types';
import { CELL_SIZE } from '../game/player';

const PLAYER_RADIUS = 18;
const PLAYER_COLOR  = '#f5a623';
const PLAYER_SHADOW = '#c07000';
const INDICATOR_COLOR = '#fff';

export function renderPlayer(ctx: CanvasRenderingContext2D, player: PlayerState): void {
  const cx = player.pixelX + CELL_SIZE / 2;
  const cy = player.pixelY + CELL_SIZE / 2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy + 4, PLAYER_RADIUS * 0.9, PLAYER_RADIUS * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = PLAYER_COLOR;
  ctx.beginPath();
  ctx.arc(cx, cy, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Rim
  ctx.strokeStyle = PLAYER_SHADOW;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // Direction triangle
  const [ox, oy] = directionOffset(player.facing);
  const tipX = cx + ox * (PLAYER_RADIUS - 4);
  const tipY = cy + oy * (PLAYER_RADIUS - 4);
  const perpX = -oy;
  const perpY = ox;

  ctx.fillStyle = INDICATOR_COLOR;
  ctx.beginPath();
  ctx.moveTo(tipX + ox * 7, tipY + oy * 7);
  ctx.lineTo(tipX + perpX * 5 - ox * 2, tipY + perpY * 5 - oy * 2);
  ctx.lineTo(tipX - perpX * 5 - ox * 2, tipY - perpY * 5 - oy * 2);
  ctx.closePath();
  ctx.fill();
}

function directionOffset(dir: Direction): [number, number] {
  switch (dir) {
    case 'N': return [0, -1];
    case 'S': return [0,  1];
    case 'E': return [1,  0];
    case 'W': return [-1, 0];
  }
}
