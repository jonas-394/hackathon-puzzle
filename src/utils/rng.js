export function createRNG(seed) {
    let s = seed >>> 0;
    return () => {
        s += 0x6d2b79f5;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
/** Integer in [min, max] inclusive */
export function randInt(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
}
/** Random element from array */
export function randElement(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
}
/** Fisher-Yates shuffle — returns a new array */
export function shuffle(rng, arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
