/**
 * Numerical Analogy puzzles — A : B :: C : ?
 * Classic IQ-test "proportion" style.
 */
import type { Puzzle } from '../types';
import type { RNG } from '../utils/rng';
import { randInt } from '../utils/rng';
import { hashAnswer } from '../utils/hash';

type AnalogyKind = 'multiply' | 'add' | 'square' | 'half' | 'subtract' | 'double';

interface Analogy {
  a: number; b: number; c: number; d: number;
  ruleHint: string;
}

function buildAnalogy(rng: RNG, difficulty: number): Analogy {
  const easy: AnalogyKind[] = ['add', 'multiply', 'double', 'half'];
  const hard: AnalogyKind[] = ['square', 'subtract'];
  const pool: AnalogyKind[] = difficulty <= 5 ? easy : [...easy, ...hard];
  const kind = pool[Math.floor(rng() * pool.length)];

  switch (kind) {
    case 'add': {
      const a = randInt(rng, 2, 15);
      const n = randInt(rng, 3, 12);
      const c = randInt(rng, 2, 15);
      return { a, b: a + n, c, d: c + n, ruleHint: `Add ${n} to get the second number` };
    }
    case 'multiply': {
      const m = randInt(rng, 2, 5);
      const a = randInt(rng, 2, 10);
      const c = randInt(rng, 2, 10);
      return { a, b: a * m, c, d: c * m, ruleHint: `Multiply by ${m}` };
    }
    case 'double': {
      const a = randInt(rng, 3, 20);
      const c = randInt(rng, 3, 20);
      return { a, b: a * 2, c, d: c * 2, ruleHint: 'Double the first number' };
    }
    case 'half': {
      const a = randInt(rng, 2, 10) * 2;
      const c = randInt(rng, 2, 10) * 2;
      return { a, b: a / 2, c, d: c / 2, ruleHint: 'Halve the first number' };
    }
    case 'square': {
      const a = randInt(rng, 2, 8);
      const c = randInt(rng, 2, 8);
      return { a, b: a ** 2, c, d: c ** 2, ruleHint: 'Square the first number' };
    }
    case 'subtract': {
      const n = randInt(rng, 2, 10);
      const a = randInt(rng, n + 1, n + 15);
      const c = randInt(rng, n + 1, n + 15);
      return { a, b: a - n, c, d: c - n, ruleHint: `Subtract ${n}` };
    }
  }
}

export async function generateAnalogy(
  rng: RNG,
  difficulty: number,
  showTypeLabel: boolean,
  freeHints: number,
  id: string,
): Promise<Puzzle> {
  const ana = buildAnalogy(rng, difficulty);
  const ciphertext = `${ana.a} : ${ana.b}  ::  ${ana.c} : ?`;
  const answerHash = await hashAnswer(String(ana.d));
  const prompt = 'Complete the analogy  (A : B :: C : ?)';
  const hints: string[] = [
    `The answer is a number`,
    `Rule: ${ana.ruleHint}`,
  ];
  return { id, type: 'analogy', prompt, ciphertext, answerHash, hints, showTypeLabel, freeHints };
}
