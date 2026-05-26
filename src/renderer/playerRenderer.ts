import type { PlayerState } from '../types';
import { CELL_SIZE } from '../game/player';

const RADIUS = 24;

// Load player image once at module level
const playerImg = new Image();
playerImg.src = './nowak.JPG';

export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  _timestamp: number,
): void {
  const cx = player.pixelX + CELL_SIZE / 2;
  const cy = player.pixelY + CELL_SIZE / 2;

  ctx.save();

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.40)';
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy + 6, RADIUS * 0.85, RADIUS * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glow aura
  ctx.shadowBlur = 28;
  ctx.shadowColor = '#990ae3';

  // Circular clip
  ctx.beginPath();
  ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
  ctx.clip();

  ctx.translate(cx, cy);

  if (playerImg.complete && playerImg.naturalWidth > 0) {
    const d = RADIUS * 2;
    ctx.drawImage(playerImg, -RADIUS, -RADIUS, d, d);
  } else {
    // Fallback solid circle while image loads
    ctx.fillStyle = '#ffe000';
    ctx.beginPath();
    ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Neon border ring drawn on top (outside the clip)
  ctx.save();
  ctx.shadowBlur = 14;
  ctx.shadowColor = '#dd44ff';
  ctx.strokeStyle = '#dd44ff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

