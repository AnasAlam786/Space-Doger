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
  usernamePanel: document.getElementById('usernamePanel'),
  usernameForm: document.getElementById('usernameForm'),
  usernameInput: document.getElementById('usernameInput'),
  usernameMessage: document.getElementById('usernameMessage'),
  playerName: document.getElementById('playerName'),
  leaderboardList: document.getElementById('leaderboardList'),
  leaderboardMessage: document.getElementById('leaderboardMessage'),
  finalScoreBox: document.getElementById('finalScore'),
  finalBestBox: document.getElementById('finalBest'),
  scoreMessage: document.getElementById('scoreMessage'),
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

  showUsernameForm: function (message, username) {
    this.menuPanel.hidden = true;
    this.overPanel.hidden = true;
    this.usernamePanel.hidden = false;
    this.usernameInput.value = username || '';
    this.setUsernameMessage(message || '', Boolean(message));
    this.usernameInput.focus();
  },

  setUsernameMessage: function (message, isError) {
    this.usernameMessage.textContent = message;
    this.usernameMessage.classList.toggle('error', isError);
  },

  showMenu: function (username, players) {
    this.usernamePanel.hidden = true;
    this.overPanel.hidden = true;
    this.playerName.textContent = username;
    this.setLeaderboard(players);
    this.menuPanel.hidden = false;
  },

  setLeaderboard: function (players) {
    this.leaderboardList.replaceChildren();
    players.forEach(function (player, index) {
      const item = document.createElement('li');
      const rank = document.createElement('span');
      const name = document.createElement('span');
      const score = document.createElement('span');
      rank.textContent = String(index + 1).padStart(2, '0');
      name.textContent = player.username;
      score.textContent = String(player.highscore);
      item.append(rank, name, score);
      this.leaderboardList.append(item);
    }, this);
    this.leaderboardMessage.textContent = players.length ? '' : 'No scores yet. Be the first!';
    this.leaderboardMessage.classList.remove('error');
  },

  setLeaderboardMessage: function (message, isError) {
    this.leaderboardMessage.textContent = message;
    this.leaderboardMessage.classList.toggle('error', isError);
  },

  setScoreMessage: function (message, isError) {
    this.scoreMessage.textContent = message;
    this.scoreMessage.classList.toggle('error', isError);
  },

  showPlaying: function () {
    this.menuPanel.hidden = true;
    this.overPanel.hidden = true;
    this.pausePanel.hidden = true;
    this.usernamePanel.hidden = true;
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
    this.setScoreMessage('Saving your score…', false);
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
    this.usernameForm.addEventListener('submit', function (event) {
      event.preventDefault();
      actions.register(this.usernameInput.value.trim());
    }.bind(this));
    document.getElementById('play').addEventListener('click', actions.start);
    document.getElementById('again').addEventListener('click', actions.start);
    document.getElementById('resume').addEventListener('click', actions.resume);
    this.pauseButton.addEventListener('click', actions.toggle);
    this.soundButton.addEventListener('click', actions.toggleSound);
  }
};
