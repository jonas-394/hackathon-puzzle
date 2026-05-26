import type { Direction, PlayerState } from '../types';

export const CELL_SIZE = 64;   // pixels per grid cell
export const MOVE_DURATION = 130; // ms to slide one cell

export function createPlayer(col: number, row: number): PlayerState {
  const px = col * CELL_SIZE;
  const py = row * CELL_SIZE;
  return {
    col,
    row,
    pixelX: px,
    pixelY: py,
    startPixelX: px,
    startPixelY: py,
    targetPixelX: px,
    targetPixelY: py,
    facing: 'S',
    isMoving: false,
    moveStartTime: 0,
    collectedTokenKeys: new Set(),
  };
}

/** Begin moving the player toward a neighbouring cell. */
export function startMove(player: PlayerState, dir: Direction, timestamp: number): PlayerState {
  const dx = dir === 'E' ? 1 : dir === 'W' ? -1 : 0;
  const dy = dir === 'S' ? 1 : dir === 'N' ? -1 : 0;
  const newCol = player.col + dx;
  const newRow = player.row + dy;
  const targetPx = newCol * CELL_SIZE;
  const targetPy = newRow * CELL_SIZE;
  return {
    ...player,
    facing: dir,
    isMoving: true,
    moveStartTime: timestamp,
    startPixelX: player.pixelX,
    startPixelY: player.pixelY,
    targetPixelX: targetPx,
    targetPixelY: targetPy,
    // Grid position updated immediately so collision logic stays consistent
    col: newCol,
    row: newRow,
  };
}

/** Advance movement lerp; call once per frame while isMoving. */
export function updateMovement(player: PlayerState, timestamp: number): PlayerState {
  if (!player.isMoving) return player;

  const t = Math.min((timestamp - player.moveStartTime) / MOVE_DURATION, 1);
  const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out

  const pixelX = player.startPixelX + (player.targetPixelX - player.startPixelX) * eased;
  const pixelY = player.startPixelY + (player.targetPixelY - player.startPixelY) * eased;

  if (t >= 1) {
    return {
      ...player,
      pixelX: player.targetPixelX,
      pixelY: player.targetPixelY,
      isMoving: false,
    };
  }

  return { ...player, pixelX, pixelY };
}

/** Token key for a given cell coordinate */
export function tokenKey(col: number, row: number): string {
  return `${col},${row}`;
}
