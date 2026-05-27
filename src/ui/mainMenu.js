import { checkAnswer } from '../utils/hash';
// SHA-256 of 'DEVMODE' (uppercase-normalised, matches checkAnswer convention).
// Change password: run  node -e "require('crypto').webcrypto.subtle.digest('SHA-256',
//   new TextEncoder().encode('YOUR_PASSWORD'.toUpperCase()))
//   .then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))"
const ADMIN_HASH = 'c487d9eef5c282846a2488fb4599cfd43618665f257ef91f220ce0efc6c65117';
const MAX_DEV_LEVEL = 50;
export class MainMenu {
    constructor(uiLayer) {
        this.el = document.createElement('div');
        this.el.className = 'overlay';
        this.el.style.display = 'none';
        uiLayer.appendChild(this.el);
    }
    show(hasSave, savedLevel, onNewGame, onContinue, onDevStart) {
        this.onNewGame = onNewGame;
        this.onContinue = onContinue;
        this.onDevStart = onDevStart;
        this.el.style.display = 'flex';
        const continueBtn = hasSave
            ? `<button id="mm-continue" class="big secondary">Continue — Level ${savedLevel}</button>`
            : '';
        this.el.innerHTML = `
      <div class="card">
        <h1>Purple<br>Maze</h1>
        <p style="text-align:center; color:#a0a8c0; font-size:0.9rem; line-height:1.7;">
          Navigate a procedural maze.<br>
          Solve IQ puzzles to unlock doors.<br>
          Collect hint tokens in hidden dead-ends.<br>
          Reach the exit — and go deeper.
        </p>
        <div style="color:#404060; font-size:0.8rem; text-align:center;">
          WASD / Arrow keys &nbsp;|&nbsp; 6 IQ puzzle types &nbsp;|&nbsp; Infinite levels
        </div>
        <div class="btn-row" style="margin-top:8px;">
          <button id="mm-new" class="big">New Game</button>
          ${continueBtn}
        </div>
        <div style="margin-top:18px; text-align:center;">
          <button id="mm-dev-toggle" class="secondary" style="font-size:0.72rem; padding:5px 12px; opacity:0.55;">Dev Mode</button>
        </div>
        <div id="mm-dev-panel" style="display:none; margin-top:12px; border-top:1px solid #440066; padding-top:14px;">
          <p style="color:#a0a8c0; font-size:0.8rem; margin:0 0 8px;">Admin password</p>
          <div class="input-row">
            <input id="mm-dev-pw" type="password" placeholder="password" autocomplete="off" />
          </div>
          <p style="color:#a0a8c0; font-size:0.8rem; margin:8px 0;">
            Start at level &nbsp;
            <input id="mm-dev-lvl" type="number" min="1" max="${MAX_DEV_LEVEL}" value="5"
              style="width:56px; display:inline-block; padding:4px 6px; font-size:0.9rem;" />
          </p>
          <div id="mm-dev-error" style="color:#ff4466; font-size:0.8rem; min-height:1.2em;"></div>
          <button id="mm-dev-go" class="big" style="margin-top:6px; width:100%;">Start</button>
        </div>
      </div>
    `;
        this.el.querySelector('#mm-new')?.addEventListener('click', () => {
            this.hide();
            this.onNewGame();
        });
        this.el.querySelector('#mm-continue')?.addEventListener('click', () => {
            this.hide();
            this.onContinue();
        });
        // Dev mode toggle
        this.el.querySelector('#mm-dev-toggle')?.addEventListener('click', () => {
            const panel = this.el.querySelector('#mm-dev-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
        // Dev mode submit
        this.el.querySelector('#mm-dev-go')?.addEventListener('click', () => {
            void this.handleDevStart();
        });
        this.el.querySelector('#mm-dev-pw')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter')
                void this.handleDevStart();
        });
    }
    async handleDevStart() {
        const pwInput = this.el.querySelector('#mm-dev-pw');
        const lvlInput = this.el.querySelector('#mm-dev-lvl');
        const errEl = this.el.querySelector('#mm-dev-error');
        const ok = await checkAnswer(pwInput.value, ADMIN_HASH);
        if (!ok) {
            errEl.textContent = 'Wrong password.';
            pwInput.value = '';
            pwInput.focus();
            return;
        }
        const level = Math.max(1, Math.min(MAX_DEV_LEVEL, parseInt(lvlInput.value) || 1));
        this.hide();
        this.onDevStart(level);
    }
    hide() {
        this.el.style.display = 'none';
    }
}
export class GameOverOverlay {
    constructor(uiLayer) {
        this.el = document.createElement('div');
        this.el.className = 'overlay';
        this.el.style.display = 'none';
        uiLayer.appendChild(this.el);
    }
    show(state, onRestart) {
        this.onRestart = onRestart;
        this.el.style.display = 'flex';
        this.el.innerHTML = `
      <div class="card">
        <h1 style="color:#e94560;">Game Over</h1>
        <table class="score-table">
          <tr><td>Reached level</td> <td>${state.level}</td></tr>
          <tr><td>Final score</td>   <td>${state.score}</td></tr>
          <tr><td>Best level</td>    <td>${state.bestLevel}</td></tr>
        </table>
        <div class="btn-row" style="margin-top:8px;">
          <button id="go-restart" class="big">Try Again</button>
        </div>
      </div>
    `;
        this.el.querySelector('#go-restart')?.addEventListener('click', () => {
            this.hide();
            this.onRestart();
        });
    }
    hide() {
        this.el.style.display = 'none';
    }
}
