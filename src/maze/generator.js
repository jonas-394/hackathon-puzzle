import { shuffle } from '../utils/rng';
// ── Constants ─────────────────────────────────────────────────────────────────
const OPPOSITE = { N: 'S', S: 'N', E: 'W', W: 'E' };
export const DELTA = {
    N: [0, -1],
    S: [0, 1],
    E: [1, 0],
    W: [-1, 0],
};
// ── Maze generation (Recursive Backtracking) ──────────────────────────────────
export function generateMaze(cols, rows, rng) {
    const cells = Array.from({ length: rows }, (_, row) => Array.from({ length: cols }, (_, col) => ({
        col,
        row,
        walls: { N: true, S: true, E: true, W: true },
        isStart: false,
        isExit: false,
        hasToken: false,
    })));
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    function carve(col, row) {
        visited[row][col] = true;
        for (const dir of shuffle(rng, ['N', 'S', 'E', 'W'])) {
            const [dc, dr] = DELTA[dir];
            const nc = col + dc;
            const nr = row + dr;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
                cells[row][col].walls[dir] = false;
                cells[nr][nc].walls[OPPOSITE[dir]] = false;
                carve(nc, nr);
            }
        }
    }
    carve(0, 0);
    cells[0][0].isStart = true;
    cells[rows - 1][cols - 1].isExit = true;
    return {
        cols,
        rows,
        cells,
        startCol: 0,
        startRow: 0,
        exitCol: cols - 1,
        exitRow: rows - 1,
    };
}
// ── BFS: shortest path from start to exit ────────────────────────────────────
export function findCriticalPath(grid) {
    const { cols, rows, cells, startCol, startRow, exitCol, exitRow } = grid;
    const dist = Array.from({ length: rows }, () => Array(cols).fill(-1));
    const prev = Array.from({ length: rows }, () => Array(cols).fill(null));
    const queue = [[startCol, startRow]];
    dist[startRow][startCol] = 0;
    while (queue.length > 0) {
        const [col, row] = queue.shift();
        for (const dir of ['N', 'S', 'E', 'W']) {
            if (cells[row][col].walls[dir])
                continue;
            const [dc, dr] = DELTA[dir];
            const nc = col + dc;
            const nr = row + dr;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && dist[nr][nc] === -1) {
                dist[nr][nc] = dist[row][col] + 1;
                prev[nr][nc] = [col, row];
                queue.push([nc, nr]);
            }
        }
    }
    // Reconstruct path
    const path = [];
    let cur = [exitCol, exitRow];
    while (cur !== null) {
        path.unshift(cur);
        const pair = cur;
        cur = prev[pair[1]][pair[0]];
    }
    return path;
}
// ── Find dead-end cells NOT on the critical path (good for token placement) ──
export function findBranchDeadEnds(grid, criticalPath) {
    const onPath = new Set(criticalPath.map(([c, r]) => `${c},${r}`));
    const deadEnds = [];
    for (let r = 0; r < grid.rows; r++) {
        for (let c = 0; c < grid.cols; c++) {
            if (onPath.has(`${c},${r}`))
                continue;
            const cell = grid.cells[r][c];
            const passages = ['N', 'S', 'E', 'W'].filter(d => !cell.walls[d]).length;
            if (passages === 1)
                deadEnds.push([c, r]);
        }
    }
    return deadEnds;
}
// ── Direction between two adjacent cells ─────────────────────────────────────
export function dirBetween(fromCol, fromRow, toCol, toRow) {
    const dc = toCol - fromCol;
    const dr = toRow - fromRow;
    if (dc === 1 && dr === 0)
        return 'E';
    if (dc === -1 && dr === 0)
        return 'W';
    if (dc === 0 && dr === 1)
        return 'S';
    if (dc === 0 && dr === -1)
        return 'N';
    throw new Error(`Cells (${fromCol},${fromRow})→(${toCol},${toRow}) not adjacent`);
}
