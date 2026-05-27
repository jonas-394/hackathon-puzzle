import { randInt } from '../utils/rng';
import { hashAnswer } from '../utils/hash';
function buildMatrix(rng, difficulty) {
    const easy = ['rowSum', 'colSum', 'rowDiff'];
    const hard = ['rowProduct', 'arithmetic2D'];
    const pool = difficulty <= 6 ? easy : [...easy, ...hard];
    const kind = pool[Math.floor(rng() * pool.length)];
    switch (kind) {
        case 'rowSum': {
            // Each row sums to the same value S
            const S = randInt(rng, 15, 30);
            const makeRow = () => {
                const a = randInt(rng, 2, S - 4);
                const b = randInt(rng, 2, S - a - 2);
                return [a, b, S - a - b];
            };
            const grid = [makeRow(), makeRow(), makeRow()];
            const answer = grid[2][2];
            grid[2][2] = -1; // placeholder
            return { grid, answer, ruleHint: `Each row sums to ${S}` };
        }
        case 'colSum': {
            // build to make columns sum to the same total
            const a = randInt(rng, 2, 10);
            const b = randInt(rng, 2, 10);
            const grid = [
                [randInt(rng, 2, 8), randInt(rng, 2, 8), randInt(rng, 2, 8)],
                [randInt(rng, 2, 8), randInt(rng, 2, 8), randInt(rng, 2, 8)],
                [a, b, 0],
            ];
            const colSums = [grid[0][0] + grid[1][0], grid[0][1] + grid[1][1], grid[0][2] + grid[1][2]];
            const target = Math.max(...colSums) + randInt(rng, 2, 6);
            grid[2][0] = target - colSums[0];
            grid[2][1] = target - colSums[1];
            const answer = target - colSums[2];
            grid[2][2] = -1;
            return { grid, answer, ruleHint: `Each column sums to ${target}` };
        }
        case 'rowDiff': {
            // Each row: col2 = col1 - col0
            const makeRow = () => {
                const a = randInt(rng, 5, 20);
                const b = randInt(rng, a + 1, a + 15);
                return [a, b, b - a];
            };
            const grid = [makeRow(), makeRow(), makeRow()];
            const answer = grid[2][2];
            grid[2][2] = -1;
            return { grid, answer, ruleHint: 'Third column = second − first' };
        }
        case 'rowProduct': {
            // Each row: col0 × col1 = col2
            const makeRow = () => {
                const a = randInt(rng, 2, 6);
                const b = randInt(rng, 2, 6);
                return [a, b, a * b];
            };
            const grid = [makeRow(), makeRow(), makeRow()];
            const answer = grid[2][2];
            grid[2][2] = -1;
            return { grid, answer, ruleHint: 'Third column = first × second' };
        }
        case 'arithmetic2D': {
            // Numbers fill a 3×3 grid following an arithmetic rule (row + col increments)
            const start = randInt(rng, 1, 8);
            const rowStep = randInt(rng, 2, 6);
            const colStep = randInt(rng, 2, 6);
            const grid = Array.from({ length: 3 }, (_, r) => Array.from({ length: 3 }, (_, c) => start + r * rowStep + c * colStep));
            const answer = grid[2][2];
            grid[2][2] = -1;
            return { grid, answer, ruleHint: `Rows increase by ${rowStep}, columns increase by ${colStep}` };
        }
    }
}
export async function generateShapeSeq(rng, difficulty, showTypeLabel, freeHints, id) {
    const puz = buildMatrix(rng, difficulty);
    const rows = puz.grid.map((row, ri) => row
        .map((v, ci) => (ri === 2 && ci === 2 ? ' ?' : String(v).padStart(3)))
        .join('  '));
    const ciphertext = rows.join('\n');
    const answerHash = await hashAnswer(String(puz.answer));
    const prompt = 'Fill in the missing number in the bottom-right of the grid:';
    const hints = [
        `The answer is a number`,
        `Rule: ${puz.ruleHint}`,
    ];
    return { id, type: 'shapeSeq', prompt, ciphertext, answerHash, hints, showTypeLabel, freeHints };
}
