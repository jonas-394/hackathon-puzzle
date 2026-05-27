import { randInt } from '../utils/rng';
import { hashAnswer } from '../utils/hash';
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
function buildNumberSeq(rng, difficulty) {
    const easyKinds = ['arithmetic', 'squares', 'triangular'];
    const hardKinds = ['geometric', 'fibonacci', 'primes', 'cubes', 'doubleStep', 'alternating'];
    const pool = difficulty <= 5 ? easyKinds : [...easyKinds, ...hardKinds];
    const kind = pool[Math.floor(rng() * pool.length)];
    switch (kind) {
        case 'arithmetic': {
            const start = randInt(rng, 2, 15);
            const d = randInt(rng, 3, 12);
            const terms = Array.from({ length: 5 }, (_, i) => start + i * d);
            return { terms, answer: start + 5 * d, ruleHint: `Add ${d} each step` };
        }
        case 'geometric': {
            const start = randInt(rng, 1, 4);
            const r = randInt(rng, 2, 3);
            const terms = Array.from({ length: 5 }, (_, i) => start * r ** i);
            return { terms, answer: start * r ** 5, ruleHint: `Multiply by ${r} each step` };
        }
        case 'fibonacci': {
            const a = randInt(rng, 1, 6);
            const b = randInt(rng, a, a + 6);
            const seq = [a, b];
            for (let i = 2; i < 6; i++)
                seq.push(seq[i - 2] + seq[i - 1]);
            return { terms: seq.slice(0, 5), answer: seq[5], ruleHint: 'Each term = sum of previous two' };
        }
        case 'primes': {
            const offset = randInt(rng, 0, 8);
            const terms = PRIMES.slice(offset, offset + 5);
            return { terms, answer: PRIMES[offset + 5], ruleHint: 'Prime numbers' };
        }
        case 'squares': {
            const off = randInt(rng, 1, 6);
            const terms = Array.from({ length: 5 }, (_, i) => (i + off) ** 2);
            return { terms, answer: (5 + off) ** 2, ruleHint: 'Perfect squares' };
        }
        case 'cubes': {
            const off = randInt(rng, 1, 4);
            const terms = Array.from({ length: 5 }, (_, i) => (i + off) ** 3);
            return { terms, answer: (5 + off) ** 3, ruleHint: 'Perfect cubes' };
        }
        case 'triangular': {
            const off = randInt(rng, 1, 5);
            const t = (n) => (n * (n + 1)) / 2;
            const terms = Array.from({ length: 5 }, (_, i) => t(i + off));
            return { terms, answer: t(5 + off), ruleHint: 'Triangular numbers T(n) = n(n+1)/2' };
        }
        case 'doubleStep': {
            const start = randInt(rng, 1, 8);
            const d1 = randInt(rng, 2, 6);
            const d2 = randInt(rng, d1 + 1, d1 + 6);
            const seq = [start];
            for (let i = 0; i < 5; i++)
                seq.push(seq[i] + (i % 2 === 0 ? d1 : d2));
            return { terms: seq.slice(0, 5), answer: seq[5], ruleHint: `Alternates: +${d1} then +${d2}` };
        }
        case 'alternating': {
            // Two interleaved arithmetic sequences
            const a0 = randInt(rng, 2, 10);
            const b0 = randInt(rng, 2, 10);
            const da = randInt(rng, 2, 5);
            const db = randInt(rng, 2, 5);
            const terms = [a0, b0, a0 + da, b0 + db, a0 + 2 * da];
            return { terms, answer: b0 + 2 * db, ruleHint: 'Two interleaved sequences' };
        }
    }
}
export async function generateNumberSeq(rng, difficulty, showTypeLabel, freeHints, id) {
    const seq = buildNumberSeq(rng, difficulty);
    const ciphertext = seq.terms.join('  ,  ') + '  ,  ?';
    const answerHash = await hashAnswer(String(seq.answer));
    const prompt = 'What is the next number in the sequence?';
    const hints = [
        `The answer is a single number`,
        `Rule: ${seq.ruleHint}`,
    ];
    return { id, type: 'numberSeq', prompt, ciphertext, answerHash, hints, showTypeLabel, freeHints };
}
