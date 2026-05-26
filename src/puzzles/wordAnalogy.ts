/**
 * Word Analogy puzzles — HOT : COLD :: BIG : ?
 * Player types the missing word.
 */
import type { Puzzle } from '../types';
import type { RNG } from '../utils/rng';
import { randElement } from '../utils/rng';
import { hashAnswer } from '../utils/hash';

type AnalogyCategory = 'antonyms' | 'category' | 'degree' | 'partWhole' | 'actionObject';

interface WordPair { a: string; b: string }

const ANTONYMS: WordPair[] = [
  { a: 'HOT',   b: 'COLD'  }, { a: 'FAST',  b: 'SLOW'  }, { a: 'LIGHT', b: 'DARK'  },
  { a: 'BIG',   b: 'SMALL' }, { a: 'UP',    b: 'DOWN'  }, { a: 'OPEN',  b: 'CLOSED'},
  { a: 'HARD',  b: 'SOFT'  }, { a: 'FULL',  b: 'EMPTY' }, { a: 'LOUD',  b: 'QUIET' },
  { a: 'RICH',  b: 'POOR'  }, { a: 'HAPPY', b: 'SAD'   }, { a: 'SHARP', b: 'BLUNT' },
  { a: 'TALL',  b: 'SHORT' }, { a: 'WIDE',  b: 'NARROW'}, { a: 'CLEAN', b: 'DIRTY' },
  { a: 'EARLY', b: 'LATE'  }, { a: 'THICK', b: 'THIN'  }, { a: 'BRAVE', b: 'AFRAID'},
];

const CATEGORY: Array<{ item: string; category: string }> = [
  { item: 'ROSE',   category: 'FLOWER'  },
  { item: 'EAGLE',  category: 'BIRD'    },
  { item: 'SALMON', category: 'FISH'    },
  { item: 'OAK',    category: 'TREE'    },
  { item: 'RUBY',   category: 'GEM'     },
  { item: 'HAMMER', category: 'TOOL'    },
  { item: 'VIOLIN', category: 'INSTRUMENT' },
  { item: 'MARS',   category: 'PLANET'  },
  { item: 'PYTHON', category: 'SNAKE'   },
  { item: 'CHESS',  category: 'GAME'    },
];

const DEGREE: Array<{ low: string; high: string }> = [
  { low: 'WARM',   high: 'HOT'      },
  { low: 'COOL',   high: 'COLD'     },
  { low: 'BREEZE', high: 'STORM'    },
  { low: 'DAMP',   high: 'SOAKED'   },
  { low: 'LARGE',  high: 'ENORMOUS' },
  { low: 'SMART',  high: 'GENIUS'   },
  { low: 'TIRED',  high: 'EXHAUSTED'},
  { low: 'ANGRY',  high: 'FURIOUS'  },
];

const PART_WHOLE: Array<{ part: string; whole: string }> = [
  { part: 'CHAPTER', whole: 'BOOK'     },
  { part: 'PETAL',   whole: 'FLOWER'   },
  { part: 'WHEEL',   whole: 'CAR'      },
  { part: 'KEY',     whole: 'KEYBOARD' },
  { part: 'BRANCH',  whole: 'TREE'     },
  { part: 'ROOM',    whole: 'HOUSE'    },
  { part: 'INNING',  whole: 'GAME'     },
  { part: 'HOUR',    whole: 'DAY'      },
];

const ACTION_OBJECT: Array<{ action: string; object: string }> = [
  { action: 'READ',   object: 'BOOK'    },
  { action: 'DRIVE',  object: 'CAR'     },
  { action: 'COOK',   object: 'FOOD'    },
  { action: 'PAINT',  object: 'CANVAS'  },
  { action: 'TYPE',   object: 'KEYBOARD'},
  { action: 'SAIL',   object: 'BOAT'    },
  { action: 'PLANT',  object: 'SEED'    },
  { action: 'STRUM',  object: 'GUITAR'  },
];

export async function generateWordAnalogy(
  rng: RNG,
  difficulty: number,
  showTypeLabel: boolean,
  freeHints: number,
  id: string,
): Promise<Puzzle> {
  const easy: AnalogyCategory[] = ['antonyms', 'category'];
  const hard: AnalogyCategory[] = ['degree', 'partWhole', 'actionObject'];
  const pool: AnalogyCategory[] = difficulty <= 5 ? easy : [...easy, ...hard];
  const cat = pool[Math.floor(rng() * pool.length)];

  let a: string, b: string, c: string, d: string, ruleHint: string;

  switch (cat) {
    case 'antonyms': {
      const p1 = randElement(rng, ANTONYMS);
      let p2: WordPair;
      do { p2 = randElement(rng, ANTONYMS); } while (p2.a === p1.a);
      [a, b, c, d] = [p1.a, p1.b, p2.a, p2.b];
      ruleHint = 'Opposites (antonyms)';
      break;
    }
    case 'category': {
      const p1 = randElement(rng, CATEGORY);
      let p2: typeof CATEGORY[number];
      do { p2 = randElement(rng, CATEGORY); } while (p2.item === p1.item);
      [a, b, c, d] = [p1.item, p1.category, p2.item, p2.category];
      ruleHint = 'Item → Category';
      break;
    }
    case 'degree': {
      const p1 = randElement(rng, DEGREE);
      let p2: typeof DEGREE[number];
      do { p2 = randElement(rng, DEGREE); } while (p2.low === p1.low);
      [a, b, c, d] = [p1.low, p1.high, p2.low, p2.high];
      ruleHint = 'Mild form → Intense form';
      break;
    }
    case 'partWhole': {
      const p1 = randElement(rng, PART_WHOLE);
      let p2: typeof PART_WHOLE[number];
      do { p2 = randElement(rng, PART_WHOLE); } while (p2.part === p1.part);
      [a, b, c, d] = [p1.part, p1.whole, p2.part, p2.whole];
      ruleHint = 'Part → Whole';
      break;
    }
    case 'actionObject': {
      const p1 = randElement(rng, ACTION_OBJECT);
      let p2: typeof ACTION_OBJECT[number];
      do { p2 = randElement(rng, ACTION_OBJECT); } while (p2.action === p1.action);
      [a, b, c, d] = [p1.action, p1.object, p2.action, p2.object];
      ruleHint = 'Action → Object it acts on';
      break;
    }
  }

  const ciphertext = `${a}  :  ${b}     ::     ${c}  :  ?`;
  const answerHash = await hashAnswer(d);
  const prompt = 'Complete the word analogy  (A : B :: C : ?)';
  const hints: string[] = [
    `The answer is a word`,
    `Rule: ${ruleHint}`,
  ];
  return { id, type: 'wordAnalogy', prompt, ciphertext, answerHash, hints, showTypeLabel, freeHints };
}
