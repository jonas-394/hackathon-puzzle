import type { GameState } from '../types';

const PAD = 16;
const LINE = 28;
const FONT     = '16px "Courier New", monospace';
const FONT_BIG = 'bold 18px "Courier New", monospace';

export function renderHUD(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasWidth: number,
): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Telia-purple pill background
  ctx.fillStyle = 'rgba(20,0,40,0.88)';
  roundRect(ctx, PAD, PAD, 290, LINE * 3 + 20, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(221,68,255,0.5)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, PAD, PAD, 290, LINE * 3 + 20, 12);
  ctx.stroke();

  // Level — Telia purple
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#dd44ff';
  ctx.fillStyle = '#dd44ff';
  ctx.font = FONT_BIG;
  ctx.fillText(`LEVEL  ${state.level}`, PAD + 14, PAD + LINE);

  // Lives — Mario red
  ctx.shadowColor = '#ff4466';
  ctx.fillStyle = '#ff4466';
  ctx.font = FONT;
  const hearts = '♥'.repeat(state.lives) + '♡'.repeat(Math.max(0, 5 - state.lives));
  ctx.fillText(`LIVES  ${hearts}`, PAD + 14, PAD + LINE * 2);

  // Tokens + score — Pac-Man gold
  ctx.shadowColor = '#ffe000';
  ctx.fillStyle = '#ffe000';
  ctx.fillText(`● ${state.tokens}   SCORE  ${state.score}`, PAD + 14, PAD + LINE * 3);

  ctx.shadowBlur = 0;

  // Bottom hint
  ctx.fillStyle = 'rgba(153,10,227,0.45)';
  ctx.font = '13px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / ↑↓←→  to move', canvasWidth / 2, ctx.canvas.height - 14);
  ctx.textAlign = 'left';

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
