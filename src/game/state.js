const STORAGE_KEY = 'cipher_dungeon_v1';
export const MAX_LIVES = 5;
export function createInitialState() {
    return { level: 1, lives: MAX_LIVES, tokens: 0, score: 0, bestLevel: 1 };
}
export function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    catch {
        // Ignore storage errors (private mode, quota, etc.)
    }
}
export function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (typeof parsed.level === 'number' &&
            typeof parsed.lives === 'number' &&
            typeof parsed.tokens === 'number' &&
            typeof parsed.score === 'number' &&
            typeof parsed.bestLevel === 'number') {
            return parsed;
        }
    }
    catch {
        // Corrupted data
    }
    return null;
}
export function hasSavedState() {
    return loadState() !== null;
}
export function clearState() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    }
    catch {
        // Ignore
    }
}
/** Apply level-complete score bonus. Returns updated state (does not mutate). */
export function applyLevelComplete(state) {
    const basePoints = 1000;
    const livesBonus = state.lives * 100;
    const tokenBonus = state.tokens * 50;
    return {
        ...state,
        score: state.score + basePoints + livesBonus + tokenBonus,
        level: state.level + 1,
        bestLevel: Math.max(state.bestLevel, state.level + 1),
    };
}
