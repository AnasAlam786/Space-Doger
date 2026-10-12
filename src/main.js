/* main.js
   This is the browser entry point. It starts Phaser, then connects the HTML
   controls to the methods in GameScene. */

import Phaser from 'phaser';
import './css/style.css';
import { GAME_WIDTH, GAME_HEIGHT } from './js/config.js';
import { GameScene } from './js/GameScene.js';
import { UI } from './js/ui.js';
import { Sound } from './js/audio.js';
import { Leaderboard } from './js/leaderboard.js';

// 1. Create the Phaser game. Phaser puts its canvas inside the HTML element
// named "gameHolder" and starts GameScene.
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'gameHolder',               // the <div> that holds the canvas
  backgroundColor: '#14182B',
  scale: {
    mode: Phaser.Scale.FIT,           // shrink or grow to fit the box
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [GameScene]
});

// Phaser creates the scene as the game starts. Look it up when a control is used.
function getScene() {
  return game.scene.keys.GameScene;
}

// 2. Buttons live in HTML; their actions call methods on the Phaser scene.
UI.bindButtons({
  start: function () {
    if (Leaderboard.getSavedUsername()) getScene().startGame();
  },
  register: async function (username) {
    UI.setUsernameMessage('Checking username…', false);
    try {
      const player = await Leaderboard.registerPlayer(username);
      getScene().best = player.highscore;
      UI.setBest(player.highscore);
      UI.showMenu(player.username, []);
      try {
        UI.setLeaderboard(await Leaderboard.getTopFive());
      } catch (error) {
        UI.setLeaderboardMessage(`Could not load leaderboard: ${error.message}`, true);
      }
    } catch (error) {
      UI.setUsernameMessage(error.message, true);
    }
  },
  resume: function () { getScene().resumeGame(); },
  toggle: function () { getScene().togglePause(); },
  toggleSound: function () {
    Sound.init();
    UI.setSoundLabel(Sound.toggleMute());
  }
});

async function initializePlayer() {
  const savedUsername = Leaderboard.getSavedUsername();
  if (!savedUsername) {
    UI.showUsernameForm(
      Leaderboard.isConfigured
        ? 'Choose a username to join the leaderboard.'
        : 'Add your Supabase URL and anon key to .env, then restart the dev server.'
    );
    return;
  }

  try {
    const player = await Leaderboard.getPlayer(savedUsername);
    if (!player) {
      Leaderboard.clearSavedUsername();
      UI.showUsernameForm('Your saved username is no longer active. Choose a new one.');
      return;
    }
    Leaderboard.savePlayerCookies(player.username, player.highscore);
    getScene().best = player.highscore;
    UI.setBest(player.highscore);
    UI.showMenu(player.username, []);
    try {
      UI.setLeaderboard(await Leaderboard.getTopFive());
    } catch (error) {
      UI.setLeaderboardMessage(`Could not load leaderboard: ${error.message}`, true);
    }
  } catch (error) {
    UI.showUsernameForm(`Could not connect to the leaderboard: ${error.message}`, savedUsername);
  }
}

initializePlayer();

// 3. Keyboard shortcuts use the same scene methods as the buttons.
window.addEventListener('keydown', function (e) {
  if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]')) {
    return;
  }

  const key = e.key.toLowerCase();
  const scene = getScene();

  if (scene.mode === 'play' && key.startsWith('arrow')) {
    e.preventDefault();
  }

  if (key === 'p' || key === 'escape') {
    scene.togglePause();
    return;
  }

  const clickedOnButton = e.target.closest && e.target.closest('button');
  const canStart = scene.mode === 'menu' || scene.mode === 'over';
  if ((key === 'enter' || key === ' ') && canStart && !clickedOnButton &&
      Leaderboard.getSavedUsername() && UI.usernamePanel.hidden) {
    e.preventDefault();
    scene.startGame();
  }
});

// 4. Pause if the player switches away from the browser tab.
document.addEventListener('visibilitychange', function () {
  if (document.hidden) getScene().pauseGame();
});
