export class LevelCompleteOverlay {
    constructor(uiLayer) {
        this.el = document.createElement('div');
        this.el.className = 'overlay';
        this.el.style.display = 'none';
        uiLayer.appendChild(this.el);
    }
    show(prevState, newState, onContinue) {
        this.onContinue = onContinue;
        const gained = newState.score - prevState.score;
        const basePoints = 1000;
        const livesBonus = prevState.lives * 100;
        const tokenBonus = prevState.tokens * 50;
        this.el.style.display = 'flex';
        this.el.innerHTML = `
      <div class="card">
        <h1>Level ${prevState.level}<br>Complete!</h1>
        <table class="score-table">
          <tr><td>Base reward</td>              <td>+${basePoints}</td></tr>
          <tr><td>Lives  ×${prevState.lives}</td><td>+${livesBonus}</td></tr>
          <tr><td>Tokens ×${prevState.tokens}</td><td>+${tokenBonus}</td></tr>
          <tr><td><strong>Total gained</strong></td><td><strong>+${gained}</strong></td></tr>
          <tr><td>Total score</td>              <td>${newState.score}</td></tr>
        </table>
        <div class="btn-row">
          <button id="lc-continue" class="big">Continue to Level ${newState.level} →</button>
        </div>
      </div>
    `;
        this.el.querySelector('#lc-continue')?.addEventListener('click', () => {
            this.hide();
            this.onContinue();
        });
    }
    hide() {
        this.el.style.display = 'none';
    }
}
