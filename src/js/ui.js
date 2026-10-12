/* ui.js
   The HTML interface: score boxes, lives, and menu panels. It displays values
   and forwards button clicks; GameScene remains responsible for game rules. */

export const UI = {
  // Find the HTML elements once so the game can update them quickly later.
  scoreBox: document.getElementById('score'),
  levelBox: document.getElementById('level'),
  bestBox: document.getElementById('best'),
  lifeIcons: Array.from(document.getElementById('lives').children),
  menuPanel: document.getElementById('menu'),
  pausePanel: document.getElementById('pause'),
  overPanel: document.getElementById('over'),
  finalScoreBox: document.getElementById('finalScore'),
  finalBestBox: document.getElementById('finalBest'),
  newBestBadge: document.getElementById('newBest'),
  pauseButton: document.getElementById('pauseBtn'),
  soundButton: document.getElementById('soundBtn'),

  // Update score, level and lives
  updateHud: function (score, level, lives) {
    this.scoreBox.textContent = Math.floor(score);
    this.levelBox.textContent = level;
    for (let i = 0; i < this.lifeIcons.length; i++) {
      // an icon turns grey when its number is not below the lives left
      this.lifeIcons[i].classList.toggle('lost', i >= lives);
    }
  },

  setBest: function (value) {
    this.bestBox.textContent = value;
  },

  showPlaying: function () {
    this.menuPanel.hidden = true;
    this.overPanel.hidden = true;
    this.pausePanel.hidden = true;
    this.pauseButton.disabled = false;
    this.pauseButton.textContent = 'Pause';
  },

  showPaused: function () {
    this.pausePanel.hidden = false;
    this.pauseButton.textContent = 'Resume';
  },

  showResumed: function () {
    this.pausePanel.hidden = true;
    this.pauseButton.textContent = 'Pause';
  },

  showGameOver: function (finalScore, best, isNewBest) {
    this.finalScoreBox.textContent = finalScore;
    this.finalBestBox.textContent = 'Best score: ' + best;
    this.newBestBadge.hidden = !isNewBest;
    this.overPanel.hidden = false;
    this.pauseButton.disabled = true;
  },

  setSoundLabel: function (muted) {
    this.soundButton.textContent = muted ? 'Sound off' : 'Sound on';
    this.soundButton.setAttribute('aria-pressed', String(!muted));
  },

  // main.js passes these actions in. This keeps HTML button setup separate
  // from the Phaser scene that performs each action.
  bindButtons: function (actions) {
    document.getElementById('play').addEventListener('click', actions.start);
    document.getElementById('again').addEventListener('click', actions.start);
    document.getElementById('resume').addEventListener('click', actions.resume);
    this.pauseButton.addEventListener('click', actions.toggle);
    this.soundButton.addEventListener('click', actions.toggleSound);
  }
};
