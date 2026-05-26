export class MainMenu {
  private el: HTMLElement;
  private onNewGame!: () => void;
  private onContinue!: () => void;

  constructor(uiLayer: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'overlay';
    this.el.style.display = 'none';
    uiLayer.appendChild(this.el);
  }

  show(hasSave: boolean, savedLevel: number, onNewGame: () => void, onContinue: () => void): void {
    this.onNewGame = onNewGame;
    this.onContinue = onContinue;

    this.el.style.display = 'flex';
    const continueBtn = hasSave
      ? `<button id="mm-continue" class="big secondary">Continue — Level ${savedLevel}</button>`
      : '';

    this.el.innerHTML = `
      <div class="card">
        <h1>Cipher<br>Dungeon</h1>
        <p style="text-align:center; color:#a0a8c0; font-size:0.9rem; line-height:1.7;">
          Navigate a procedural maze.<br>
          Solve cryptographic puzzles to unlock doors.<br>
          Collect hint tokens in hidden dead-ends.<br>
          Reach the exit — and go deeper.
        </p>
        <div style="color:#404060; font-size:0.8rem; text-align:center;">
          WASD / Arrow keys &nbsp;|&nbsp; 6 cipher types &nbsp;|&nbsp; Infinite levels
        </div>
        <div class="btn-row" style="margin-top:8px;">
          <button id="mm-new" class="big">New Game</button>
          ${continueBtn}
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
  }

  hide(): void {
    this.el.style.display = 'none';
  }
}

export class GameOverOverlay {
  private el: HTMLElement;
  private onRestart!: () => void;

  constructor(uiLayer: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'overlay';
    this.el.style.display = 'none';
    uiLayer.appendChild(this.el);
  }

  show(state: { level: number; score: number; bestLevel: number }, onRestart: () => void): void {
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

  hide(): void {
    this.el.style.display = 'none';
  }
}
