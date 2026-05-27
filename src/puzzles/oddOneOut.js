import { randInt, shuffle } from '../utils/rng';
import { hashAnswer } from '../utils/hash';
const PRIMES = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]);
function isPrime(n) { return PRIMES.has(n); }
function isEven(n) { return n % 2 === 0; }
function isSquare(n) { return Number.isInteger(Math.sqrt(n)); }
function buildOddOneOut(rng, difficulty) {
    const easy = ['evenVsOdd', 'multipleVsNot'];
    const hard = ['primeVsComposite', 'squareVsNot', 'divisibleVsNot'];
    const pool = difficulty <= 5 ? easy : [...easy, ...hard];
    const kind = pool[Math.floor(rng() * pool.length)];
    switch (kind) {
        case 'evenVsOdd': {
            // 5 evens, 1 odd (or vice versa)
            const useEven = rng() < 0.5;
            const majority = [];
            while (majority.length < 5) {
                const n = randInt(rng, 2, 40);
                if (isEven(n) === useEven && !majority.includes(n))
                    majority.push(n);
            }
            let odd;
            do {
                odd = randInt(rng, 2, 40);
            } while (isEven(odd) === useEven || majority.includes(odd));
            const insert = randInt(rng, 0, 5);
            const numbers = [...majority.slice(0, insert), odd, ...majority.slice(insert)];
            return { numbers, odd, ruleHint: `All but one are ${useEven ? 'even' : 'odd'}` };
        }
        case 'multipleVsNot': {
            const base = randInt(rng, 3, 7);
            const multiples = [];
            while (multiples.length < 5) {
                const n = base * randInt(rng, 2, 10);
                if (!multiples.includes(n))
                    multiples.push(n);
            }
            let odd;
            do {
                odd = randInt(rng, base * 2 + 1, base * 9);
            } while (odd % base === 0 || multiples.includes(odd));
            const insert = randInt(rng, 0, 5);
            const numbers = [...multiples.slice(0, insert), odd, ...multiples.slice(insert)];
            return { numbers, odd, ruleHint: `All but one are multiples of ${base}` };
        }
        case 'primeVsComposite': {
            const primeList = [...PRIMES].slice(0, 12);
            const primes = shuffle(rng, primeList).slice(0, 5);
            let odd;
            do {
                odd = randInt(rng, 4, 50);
            } while (isPrime(odd) || primes.includes(odd));
            const insert = randInt(rng, 0, 5);
            const numbers = [...primes.slice(0, insert), odd, ...primes.slice(insert)];
            return { numbers, odd, ruleHint: 'All but one are prime numbers' };
        }
        case 'squareVsNot': {
            const squares = [1, 4, 9, 16, 25, 36, 49];
            const chosen = shuffle(rng, squares).slice(0, 5);
            let odd;
            do {
                odd = randInt(rng, 2, 50);
            } while (isSquare(odd) || chosen.includes(odd));
            const insert = randInt(rng, 0, 5);
            const numbers = [...chosen.slice(0, insert), odd, ...chosen.slice(insert)];
            return { numbers, odd, ruleHint: 'All but one are perfect squares' };
        }
        case 'divisibleVsNot': {
            const d = randInt(rng, 4, 9);
            const candidates = [];
            for (let n = d * 2; n <= d * 12 && candidates.length < 5; n++) {
                if (n % d === 0)
                    candidates.push(n);
            }
            const chosen = shuffle(rng, candidates).slice(0, 5);
            let odd;
            do {
                odd = randInt(rng, d * 2, d * 10);
            } while (odd % d === 0 || chosen.includes(odd));
            const insert = randInt(rng, 0, 5);
            const numbers = [...chosen.slice(0, insert), odd, ...chosen.slice(insert)];
            return { numbers, odd, ruleHint: `All but one are divisible by ${d}` };
        }
    }
}
export async function generateOddOneOut(rng, difficulty, showTypeLabel, freeHints, id) {
    const puz = buildOddOneOut(rng, difficulty);
    const ciphertext = puz.numbers.join('     ');
    const answerHash = await hashAnswer(String(puz.odd));
    const prompt = 'Which number does NOT belong?';
    const hints = [
        `There are ${puz.numbers.length} numbers — one is the odd one out`,
        `Rule: ${puz.ruleHint}`,
    ];
    return { id, type: 'oddOneOut', prompt, ciphertext, answerHash, hints, showTypeLabel, freeHints };
}
