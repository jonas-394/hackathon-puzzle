import { checkAnswer } from '../utils/hash';
import { PUZZLE_TYPE_LABELS } from '../puzzles/factory';
const LOCKOUT_MS = 10000;
const LOCKOUT_WRONG_THRESHOLD = 3;
export class PuzzleOverlay {
    constructor(uiLayer) {
        this.hintsRevealed = 0;
        this.lockoutTimer = null;
        this.el = document.createElement('div');
        this.el.className = 'overlay';
        this.el.style.display = 'none';
        uiLayer.appendChild(this.el);
    }
    show(puzzle, door, tokens, onResult) {
        this.currentPuzzle = puzzle;
        this.currentDoor = door;
        this.onResult = onResult;
        this.hintsRevealed = puzzle.freeHints;
        this.el.style.display = 'flex';
        this.render(tokens, '');
        // Focus input on next tick
        requestAnimationFrame(() => {
            this.el.querySelector('input')?.focus();
        });
    }
    hide() {
        this.el.style.display = 'none';
        if (this.lockoutTimer)
            clearTimeout(this.lockoutTimer);
        this.lockoutTimer = null;
    }
    get isVisible() {
        return this.el.style.display !== 'none';
    }
    render(tokens, statusMsg, statusClass = '') {
        const p = this.currentPuzzle;
        const door = this.currentDoor;
        const now = Date.now();
        const isLocked = door.lockedUntil > now;
        const remaining = isLocked ? Math.ceil((door.lockedUntil - now) / 1000) : 0;
        const typeLabel = p.showTypeLabel
            ? `<div class="cipher-label">🔒 ${PUZZLE_TYPE_LABELS[p.type]}</div>`
            : `<div class="cipher-label">🔒 LOCKED DOOR</div>`;
        // Prompt lines (handle newlines in prompt)
        const promptHtml = p.prompt
            .split('\n')
            .map(line => `<p>${escHtml(line)}</p>`)
            .join('');
        // Hints revealed so far
        let hintsHtml = '';
        for (let i = 0; i < this.hintsRevealed; i++) {
            if (p.hints[i] !== undefined) {
                hintsHtml += `<div class="hint-box">💡 ${escHtml(p.hints[i])}</div>`;
            }
        }
        const canRevealMore = this.hintsRevealed < p.hints.length;
        const hintCost = this.hintsRevealed < p.freeHints ? 0 : 1;
        const hintBtnLabel = canRevealMore
            ? `Hint ${hintCost > 0 ? `(−${hintCost} token)` : '(free)'}`
            : 'No more hints';
        const lockMsg = isLocked
            ? `<div class="status-msg locked">⏳ Door locked — try again in ${remaining}s</div>`
            : '';
        const statusHtml = statusMsg
            ? `<div class="status-msg ${statusClass}">${escHtml(statusMsg)}</div>`
            : '<div class="status-msg"></div>';
        this.el.innerHTML = `
      <div class="card" id="puzzle-card">
        ${typeLabel}
        ${promptHtml}
        <div class="ciphertext">${escHtml(p.ciphertext)}</div>
        ${hintsHtml}
        ${lockMsg}
        <div class="input-row">
          <input
            type="text"
            id="puzzle-input"
            placeholder="Your answer…"
            autocomplete="off"
            spellcheck="false"
            ${isLocked ? 'disabled' : ''}
          />
          <button id="puzzle-submit" ${isLocked ? 'disabled' : ''}>Submit</button>
        </div>
        ${statusHtml}
        <div class="btn-row">
          <button
            id="puzzle-hint"
            class="secondary"
            ${!canRevealMore || (hintCost > 0 && tokens < hintCost) || isLocked ? 'disabled' : ''}
          >${hintBtnLabel}</button>
          <button id="puzzle-close" class="secondary">✕ Close</button>
        </div>
      </div>
    `;
        // ── Event listeners ─────────────────────────────────────────────────────
        this.el.querySelector('#puzzle-submit')?.addEventListener('click', () => {
            this.submitAnswer(tokens);
        });
        this.el.querySelector('#puzzle-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter')
                this.submitAnswer(tokens);
        });
        this.el.querySelector('#puzzle-hint')?.addEventListener('click', () => {
            this.revealHint(tokens);
        });
        this.el.querySelector('#puzzle-close')?.addEventListener('click', () => {
            this.hide();
            this.onResult({ correct: false, livesLost: 0, lockedUntilMs: 0 });
        });
        // Re-start lockout countdown if still locked
        if (isLocked)
            this.startLockoutCountdown(tokens);
    }
    async submitAnswer(tokens) {
        const door = this.currentDoor;
        const now = Date.now();
        if (door.lockedUntil > now)
            return;
        const input = this.el.querySelector('#puzzle-input');
        if (!input)
            return;
        const value = input.value.trim();
        if (!value)
            return;
        const correct = await checkAnswer(value, this.currentPuzzle.answerHash);
        if (correct) {
            this.shakeCard(false);
            this.onResult({ correct: true, livesLost: 0, lockedUntilMs: 0 });
            this.hide();
            return;
        }
        // Wrong answer
        door.wrongAttempts++;
        let lockedUntilMs = 0;
        let livesLost = 1;
        if (door.wrongAttempts >= LOCKOUT_WRONG_THRESHOLD) {
            lockedUntilMs = Date.now() + LOCKOUT_MS;
            door.lockedUntil = lockedUntilMs;
        }
        this.shakeCard(true);
        const attemptsLeft = LOCKOUT_WRONG_THRESHOLD - door.wrongAttempts;
        const msg = lockedUntilMs > 0
            ? 'Too many wrong answers — door locked for 10s!'
            : `Wrong! ${attemptsLeft > 0 ? `${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} before lockout.` : ''}`;
        this.onResult({ correct: false, livesLost, lockedUntilMs });
        this.render(tokens, msg, 'error');
    }
    revealHint(tokens) {
        if (this.hintsRevealed >= this.currentPuzzle.hints.length)
            return;
        const isFree = this.hintsRevealed < this.currentPuzzle.freeHints;
        if (!isFree && tokens < 1)
            return;
        const costTokens = isFree ? 0 : 1;
        this.hintsRevealed++;
        this.onResult({ correct: false, livesLost: 0, lockedUntilMs: 0 });
        // Re-render — caller will update tokens count
        this.render(tokens - costTokens, isFree ? '' : 'Hint revealed (−1 token)', isFree ? '' : 'locked');
        // Notify controller about token spend via the result callback with a special signal
        // We accomplish this by re-triggering onResult with a livesLost=-costTokens convention:
        if (costTokens > 0) {
            this.onResult({ correct: false, livesLost: -costTokens, lockedUntilMs: 0 });
        }
    }
    shakeCard(isError) {
        const card = this.el.querySelector('#puzzle-card');
        if (!card)
            return;
        if (isError) {
            card.classList.remove('shake');
            void card.offsetWidth; // reflow to restart animation
            card.classList.add('shake');
        }
    }
    startLockoutCountdown(tokens) {
        if (this.lockoutTimer)
            clearTimeout(this.lockoutTimer);
        this.lockoutTimer = setInterval(() => {
            if (Date.now() >= this.currentDoor.lockedUntil) {
                clearInterval(this.lockoutTimer);
                this.lockoutTimer = null;
                this.render(tokens, 'Door unlocked — try again!', 'success');
            }
            else {
                this.render(tokens, '', '');
            }
        }, 1000);
    }
}
function escHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
