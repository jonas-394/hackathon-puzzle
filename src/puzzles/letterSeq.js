import { randInt } from '../utils/rng';
import { hashAnswer } from '../utils/hash';
const A = 'A'.charCodeAt(0);
function numToLetter(n) {
    return String.fromCharCode(A + ((n % 26 + 26) % 26));
}
function buildLetterSeq(rng, difficulty) {
    const easy = ['skip', 'reverse', 'vowels', 'consonants'];
    const hard = ['doubleSkip', 'zigzag'];
    const pool = difficulty <= 5 ? easy : [...easy, ...hard];
    const kind = pool[Math.floor(rng() * pool.length)];
    switch (kind) {
        case 'skip': {
            const step = randInt(rng, 2, 4);
            const start = randInt(rng, 0, 20);
            const terms = Array.from({ length: 5 }, (_, i) => numToLetter(start + i * step));
            return { terms, answer: numToLetter(start + 5 * step), ruleHint: `Skip ${step - 1} letter${step > 2 ? 's' : ''} each step` };
        }
        case 'reverse': {
            const step = randInt(rng, 1, 3);
            const start = randInt(rng, step * 5, 25);
            const terms = Array.from({ length: 5 }, (_, i) => numToLetter(start - i * step));
            return { terms, answer: numToLetter(start - 5 * step), ruleHint: `Go backwards ${step} letter${step > 1 ? 's' : ''} each step` };
        }
        case 'vowels': {
            const VOWELS = ['A', 'E', 'I', 'O', 'U'];
            const start = randInt(rng, 0, VOWELS.length - 1);
            const terms = Array.from({ length: Math.min(5, VOWELS.length) }, (_, i) => VOWELS[(start + i) % VOWELS.length]);
            return { terms, answer: VOWELS[(start + 5) % VOWELS.length], ruleHint: 'Vowels in order: A E I O U' };
        }
        case 'consonants': {
            const CONSONANTS = 'BCDFGHJKLMNPQRSTVWXYZ'.split('');
            const start = randInt(rng, 0, CONSONANTS.length - 6);
            const step = randInt(rng, 1, 3);
            const terms = Array.from({ length: 5 }, (_, i) => CONSONANTS[start + i * step]);
            return { terms, answer: CONSONANTS[start + 5 * step] ?? CONSONANTS[CONSONANTS.length - 1], ruleHint: 'Consonants — skip every other letter' };
        }
        case 'doubleSkip': {
            const step1 = randInt(rng, 2, 4);
            const step2 = randInt(rng, step1 + 1, step1 + 4);
            const start = randInt(rng, 0, 10);
            const seq = [start];
            for (let i = 0; i < 5; i++)
                seq.push(seq[i] + (i % 2 === 0 ? step1 : step2));
            const terms = seq.slice(0, 5).map(numToLetter);
            return { terms, answer: numToLetter(seq[5]), ruleHint: `Alternating steps: +${step1}, +${step2}` };
        }
        case 'zigzag': {
            // Odd indices go forward, even go backward
            const mid = randInt(rng, 8, 18);
            const up = randInt(rng, 2, 4);
            const down = randInt(rng, 1, 3);
            const seq = [mid];
            for (let i = 0; i < 5; i++)
                seq.push(i % 2 === 0 ? seq[i] + up : seq[i] - down);
            const terms = seq.slice(0, 5).map(numToLetter);
            return { terms, answer: numToLetter(seq[5]), ruleHint: `Alternates: +${up} then -${down}` };
        }
    }
}
export async function generateLetterSeq(rng, difficulty, showTypeLabel, freeHints, id) {
    const seq = buildLetterSeq(rng, difficulty);
    const ciphertext = seq.terms.join('  ,  ') + '  ,  ?';
    const answerHash = await hashAnswer(seq.answer);
    const prompt = 'What is the next letter in the sequence?';
    const hints = [
        `The answer is a single letter (A–Z)`,
        `Rule: ${seq.ruleHint}`,
    ];
    return { id, type: 'letterSeq', prompt, ciphertext, answerHash, hints, showTypeLabel, freeHints };
}
