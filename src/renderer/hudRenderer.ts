import type { GameState } from '../types';

const PAD = 16;
const LINE = 28;
const FONT = '16px "Courier New", monospace';
const FONT_BIG = 'bold 18px "Courier New", monospace';

export function renderHUD(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasWidth: number,
): void {
  // Freeze the transform so HUD is always in screen-space
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Background pill
  ctx.fillStyle = 'rgba(13,13,26,0.82)';
  roundRect(ctx, PAD, PAD, 280, LINE * 3 + 20, 10);
  ctx.fill();

  ctx.fillStyle = '#53d8fb';
  ctx.font = FONT_BIG;
  ctx.fillText(`LEVEL  ${state.level}`, PAD + 14, PAD + LINE);

  ctx.font = FONT;
  ctx.fillStyle = '#e94560';
  const hearts = '♥'.repeat(state.lives) + '♡'.repeat(Math.max(0, 5 - state.lives));
  ctx.fillText(`LIVES  ${hearts}`, PAD + 14, PAD + LINE * 2);

  ctx.fillStyle = '#ffd700';
  ctx.fillText(`TOKENS  ${state.tokens}   SCORE  ${state.score}`, PAD + 14, PAD + LINE * 3);

  // Key hint bottom-centre
  ctx.fillStyle = '#404060';
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
