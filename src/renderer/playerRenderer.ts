import type { PlayerState, Direction } from '../types';
import { CELL_SIZE } from '../game/player';

const RADIUS = 21;

export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  timestamp: number,
): void {
  const cx = player.pixelX + CELL_SIZE / 2;
  const cy = player.pixelY + CELL_SIZE / 2;

  // Mouth opens and chomps while moving, slightly open at rest
  const mouthAngle = player.isMoving
    ? Math.abs(Math.sin(timestamp / 90)) * 0.38
    : 0.08;

  const facing = dirAngle(player.facing);

  ctx.save();

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy + 5, RADIUS * 0.85, RADIUS * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glow aura
  ctx.shadowBlur = 24;
  ctx.shadowColor = '#ffcc00';

  // Pac-Man body
  ctx.fillStyle = '#ffe000';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, RADIUS, facing + mouthAngle, facing + Math.PI * 2 - mouthAngle);
  ctx.closePath();
  ctx.fill();

  // Highlight rim
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,200,0,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, RADIUS - 1, facing + mouthAngle, facing + Math.PI * 2 - mouthAngle);
  ctx.stroke();

  // Eye
  const eyeAngle = facing - Math.PI / 3;
  const eyeX = cx + Math.cos(eyeAngle) * (RADIUS * 0.52);
  const eyeY = cy + Math.sin(eyeAngle) * (RADIUS * 0.52);
  ctx.fillStyle = '#1a0030';
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function dirAngle(dir: Direction): number {
  switch (dir) {
    case 'E': return 0;
    case 'S': return Math.PI / 2;
    case 'W': return Math.PI;
    case 'N': return -Math.PI / 2;
  }
}
