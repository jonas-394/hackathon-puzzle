import type { Puzzle, PuzzleType } from '../types';
import type { RNG } from '../utils/rng';
import { randElement } from '../utils/rng';
import { generateNumberSeq } from './numberSeq';
import { generateLetterSeq } from './letterSeq';
import { generateAnalogy } from './analogy';
import { generateOddOneOut } from './oddOneOut';
import { generateShapeSeq } from './shapeSeq';
import { generateWordAnalogy } from './wordAnalogy';

// ── Difficulty tiers ──────────────────────────────────────────────────────────
// Tier 1 (levels 1–3):  numberSeq + letterSeq; type labeled + 1 free hint
// Tier 2 (levels 4–6):  + analogy + wordAnalogy; type labeled, no free hints
// Tier 3 (levels 7–10): + oddOneOut + shapeSeq; type labeled, no free hints
// Tier 4 (levels 11+):  All 6; NO type label, no free hints

const TIER1: PuzzleType[] = ['numberSeq', 'letterSeq'];
const TIER2: PuzzleType[] = ['numberSeq', 'letterSeq', 'analogy', 'wordAnalogy'];
const TIER3: PuzzleType[] = ['numberSeq', 'letterSeq', 'analogy', 'wordAnalogy', 'oddOneOut', 'shapeSeq'];
const TIER4: PuzzleType[] = ['numberSeq', 'letterSeq', 'analogy', 'wordAnalogy', 'oddOneOut', 'shapeSeq'];

function tierForLevel(level: number): {
  pool: PuzzleType[];
  showTypeLabel: boolean;
  freeHints: number;
} {
  if (level <= 3)  return { pool: TIER1, showTypeLabel: true,  freeHints: 1 };
  if (level <= 6)  return { pool: TIER2, showTypeLabel: true,  freeHints: 0 };
  if (level <= 10) return { pool: TIER3, showTypeLabel: true,  freeHints: 0 };
  return               { pool: TIER4, showTypeLabel: false, freeHints: 0 };
}

let _puzzleCounter = 0;
function nextId(): string {
  return `puzzle_${++_puzzleCounter}`;
}

export async function createPuzzle(level: number, rng: RNG): Promise<Puzzle> {
  const { pool, showTypeLabel, freeHints } = tierForLevel(level);
  const type = randElement(rng, pool);
  const id = nextId();

  switch (type) {
    case 'numberSeq':   return generateNumberSeq(rng, level, showTypeLabel, freeHints, id);
    case 'letterSeq':   return generateLetterSeq(rng, level, showTypeLabel, freeHints, id);
    case 'analogy':     return generateAnalogy(rng, level, showTypeLabel, freeHints, id);
    case 'oddOneOut':   return generateOddOneOut(rng, level, showTypeLabel, freeHints, id);
    case 'shapeSeq':    return generateShapeSeq(rng, level, showTypeLabel, freeHints, id);
    case 'wordAnalogy': return generateWordAnalogy(rng, level, showTypeLabel, freeHints, id);
  }
}

// Human-readable label for each puzzle type
export const PUZZLE_TYPE_LABELS: Record<PuzzleType, string> = {
  numberSeq:   'Number Sequence',
  letterSeq:   'Letter Sequence',
  analogy:     'Number Analogy',
  oddOneOut:   'Odd One Out',
  shapeSeq:    'Number Grid',
  wordAnalogy: 'Word Analogy',
};
