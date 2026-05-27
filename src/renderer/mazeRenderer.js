import { CELL_SIZE } from '../game/player';
import { DELTA } from '../maze/generator';
// ── Colour palette (Telia purple × Pac-Man × Mario) ──────────────────────────
const C = {
    floor0: 'rgba(14,0,32,0.55)',
    floor1: 'rgba(20,0,46,0.55)',
    floorStart: 'rgba(0,24,64,0.65)',
    floorExit: 'rgba(20,0,46,0.70)',
    wallStroke: '#dd44ff',
    wallGlow: '#990ae3',
    doorLockedGlow: '#ff5500',
    doorOpenGlow: '#00ff88',
    startGlow: '#44aaff',
    pellet: '#ffe000',
    pelletGlow: '#ffaa00',
    tileGrid: 'rgba(153,10,227,0.10)',
};
const WALL_T = 8; // wall block thickness (px, centred on cell edge)
const SIDE_D = 5; // depth extrusion shown on south/east face
const DOOR_WIDTH = 11;
export function renderMaze(ctx, grid, doors, doorOpenProgress, timestamp) {
    const { cols, rows, cells } = grid;
    // Door lookup (both sides)
    const doorMap = new Map();
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
            if (cell.isStart)
                drawStartMarker(ctx, x, y);
            if (cell.isExit)
                drawFlagpole(ctx, cx, cy, timestamp);
            if (cell.hasToken)
                drawPellet(ctx, cx, cy, timestamp, c, r);
        }
    }
    // ── Pseudo-3D walls ─────────────────────────────────────────────────────────
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = cells[r][c];
            const x = c * CELL_SIZE;
            const y = r * CELL_SIZE;
            for (const dir of ['N', 'S', 'E', 'W']) {
                if (!cell.walls[dir] || doorMap.has(`${c},${r},${dir}`))
                    continue;
                drawWall3D(ctx, x, y, dir);
            }
        }
    }
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
function drawStartMarker(ctx, x, y) {
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
// ── Telia logo (loaded once) ──────────────────────────────────────────────────
const teliaImg = new Image();
teliaImg.src = './telia-logo.png';
// ── Telia logo exit marker (flagpole + Telia logo flag) ──────────────────────
function drawFlagpole(ctx, cx, cy, timestamp) {
    const poleTop = cy - 36;
    const poleBot = cy + 12;
    const bob = Math.sin(timestamp / 700) * 3;
    const pulse = 0.7 + 0.3 * Math.sin(timestamp / 500);
    ctx.save();
    // ── Pole shadow ──
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(cx + 1, poleTop + 2, 4, poleBot - poleTop);
    // ── Pole (silver gradient) ──
    const pg = ctx.createLinearGradient(cx - 2, 0, cx + 4, 0);
    pg.addColorStop(0, '#ccccdd');
    pg.addColorStop(0.5, '#ffffff');
    pg.addColorStop(1, '#8888aa');
    ctx.fillStyle = pg;
    ctx.fillRect(cx - 2, poleTop, 4, poleBot - poleTop);
    // ── Base ball ──
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#cc88ff';
    ctx.fillStyle = '#ccccdd';
    ctx.beginPath();
    ctx.arc(cx, poleBot, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // ── Telia logo flag attached at pole top, with bob ──
    // Clip only the icon (left square portion of the horizontal logotype).
    // Logo is 3170×1251 px; icon occupies roughly the first 1251×1251 pixels.
    const ICON_SRC_W = 1251;
    const ICON_SRC_H = 1251;
    const iconSize = 20;
    const flagX = cx + 2; // attached to right side of pole
    const flagY = poleTop + bob;
    // Purple backdrop behind icon
    ctx.shadowBlur = 20 * pulse;
    ctx.shadowColor = '#990ae3';
    ctx.fillStyle = 'rgba(100,0,160,0.75)';
    ctx.beginPath();
    ctx.roundRect(flagX - 2, flagY - 2, iconSize + 4, iconSize + 4, 4);
    ctx.fill();
    // Icon image (source-cropped to symbol only)
    ctx.shadowBlur = 12 * pulse;
    ctx.shadowColor = '#cc44ff';
    if (teliaImg.complete && teliaImg.naturalWidth > 0) {
        ctx.drawImage(teliaImg, 0, 0, ICON_SRC_W, ICON_SRC_H, flagX, flagY, iconSize, iconSize);
    }
    else {
        ctx.fillStyle = '#990ae3';
        ctx.beginPath();
        ctx.arc(flagX + iconSize / 2, flagY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}
// ── Pac-Man style pellet ──────────────────────────────────────────────────────
function drawPellet(ctx, cx, cy, timestamp, c, r) {
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
function drawDoor(ctx, cellX, cellY, dir, prog, _timestamp) {
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
function drawBrickMortar(ctx, cx, cy, dir) {
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
            ctx.moveTo(mx, wallY - 6);
            ctx.lineTo(mx, wallY + 6);
        }
        else {
            const my = cy + i * (CELL_SIZE / 4);
            ctx.moveTo(wallX - 6, my);
            ctx.lineTo(wallX + 6, my);
        }
        ctx.stroke();
    }
    ctx.restore();
}
function drawLockDot(ctx, cellX, cellY, dir) {
    const mx = (dir === 'N' || dir === 'S') ? cellX + CELL_SIZE / 2
        : dir === 'W' ? cellX : cellX + CELL_SIZE;
    const my = (dir === 'E' || dir === 'W') ? cellY + CELL_SIZE / 2
        : dir === 'N' ? cellY : cellY + CELL_SIZE;
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(mx, my, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff2200';
    ctx.beginPath();
    ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
// ── Pseudo-3D wall block ─────────────────────────────────────────────────────
function drawWall3D(ctx, x, y, dir) {
    const half = WALL_T / 2;
    const isH = dir === 'N' || dir === 'S';
    const edge = isH
        ? (dir === 'N' ? y : y + CELL_SIZE)
        : (dir === 'W' ? x : x + CELL_SIZE);
    ctx.save();
    if (isH) {
        // Floor shadow (south)
        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        ctx.fillRect(x + 3, edge + half + SIDE_D, CELL_SIZE - 6, 4);
        // Side face (south, dark purple)
        ctx.fillStyle = '#1a0030';
        ctx.fillRect(x, edge + half, CELL_SIZE, SIDE_D);
        // Top body (gradient: bright north → dark south)
        const gH = ctx.createLinearGradient(0, edge - half, 0, edge + half);
        gH.addColorStop(0, '#ee55ff');
        gH.addColorStop(1, '#770088');
        ctx.fillStyle = gH;
        ctx.fillRect(x, edge - half, CELL_SIZE, WALL_T);
        // Neon glow line on the lit (north) edge
        ctx.shadowBlur = 16;
        ctx.shadowColor = C.wallGlow;
        ctx.strokeStyle = C.wallStroke;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, edge - half);
        ctx.lineTo(x + CELL_SIZE, edge - half);
        ctx.stroke();
    }
    else {
        // Floor shadow (east)
        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        ctx.fillRect(edge + half + SIDE_D, y + 3, 4, CELL_SIZE - 6);
        // Side face (east, dark purple)
        ctx.fillStyle = '#1a0030';
        ctx.fillRect(edge + half, y, SIDE_D, CELL_SIZE);
        // Top body (gradient: bright west → dark east)
        const gV = ctx.createLinearGradient(edge - half, 0, edge + half, 0);
        gV.addColorStop(0, '#ee55ff');
        gV.addColorStop(1, '#770088');
        ctx.fillStyle = gV;
        ctx.fillRect(edge - half, y, WALL_T, CELL_SIZE);
        // Neon glow line on the lit (west) edge
        ctx.shadowBlur = 16;
        ctx.shadowColor = C.wallGlow;
        ctx.strokeStyle = C.wallStroke;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(edge - half, y);
        ctx.lineTo(edge - half, y + CELL_SIZE);
        ctx.stroke();
    }
    ctx.restore();
}
function wallSeg(ctx, x, y, dir) {
    switch (dir) {
        case 'N':
            ctx.moveTo(x, y);
            ctx.lineTo(x + CELL_SIZE, y);
            break;
        case 'S':
            ctx.moveTo(x, y + CELL_SIZE);
            ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
            break;
        case 'W':
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + CELL_SIZE);
            break;
        case 'E':
            ctx.moveTo(x + CELL_SIZE, y);
            ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
            break;
    }
}
function opposite(dir) {
    return dir === 'N' ? 'S' : dir === 'S' ? 'N' : dir === 'E' ? 'W' : 'E';
}
function lerp(a, b, t) {
    return a + (b - a) * t;
}
