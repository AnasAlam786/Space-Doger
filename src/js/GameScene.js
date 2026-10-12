/* GameScene.js
   This scene coordinates the game. Phaser calls create() once, then calls
   update() repeatedly. The mode decides which game logic should run. */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, SETTINGS, Difficulty, randomBetween } from './config.js';
import { Sound } from './audio.js';
import { Leaderboard } from './leaderboard.js';
import { UI } from './ui.js';
import { drawPowerUp } from './drawing.js';
import { Ship } from './ship.js';
import { createRock, createStar, createPowerUp } from './spawn.js';

export class GameScene extends Phaser.Scene {

  constructor() {
    super('GameScene');
  }

  // ============================================================
  // create: runs once
  // ============================================================
  create() {
    // "mode" is the game-state switch used by update().
    this.mode = 'menu';

    // Game numbers
    this.survivedTime = 0;
    this.score = 0;
    this.lives = SETTINGS.startLives;
    this.level = 1;
    this.hasShield = false;
    this.invincibleTime = 0;
    this.shakeTime = 0;
    this.rockTimer = 0.6;
    this.starTimer = 1.5;
    this.powerTimer = 9;

    // These arrays store the active game objects. Each object also stores its
    // Phaser graphics object so we can move and destroy its picture.
    this.rocks = [];
    this.stars = [];
    this.powerUps = [];

    this.best = Leaderboard.getSavedHighscore();
    UI.setBest(this.best);

    // Background: a graphics object that we redraw each frame
    this.backgroundGraphics = this.add.graphics();
    this.backgroundGraphics.setScrollFactor(0);   // stays still when the screen shakes
    this.backgroundStars = [];
    for (let i = 0; i < 70; i++) {
      this.backgroundStars.push({
        x: randomBetween(0, GAME_WIDTH),
        y: randomBetween(0, GAME_HEIGHT),
        speed: randomBetween(14, 70),
        size: randomBetween(0.6, 1.8)
      });
    }

    // The Ship class owns the player's position, movement, and picture.
    this.ship = new Ship(this);

    // "SHIELD READY" text at the top right
    this.shieldText = this.add.text(GAME_WIDTH - 14, 32, 'SHIELD READY', {
      fontFamily: 'Oswald, Arial, sans-serif',
      fontSize: '16px',
      fontStyle: '600',
      color: '#3FC1B0'
    });
    this.shieldText.setOrigin(1, 1);
    this.shieldText.setDepth(6);
    this.shieldText.setVisible(false);

    // Keyboard keys (arrows and WASD)
    // Don't let Phaser prevent browser defaults for these keys: the username
    // input uses several of the same letters.
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,S', false);

    // Bass beat: every 380 ms, but only while playing
    this.time.addEvent({
      delay: 380,
      loop: true,
      callback: function () {
        if (this.mode === 'play') Sound.playBassNote();
      },
      callbackScope: this
    });
  }

  // ============================================================
  // Game flow: start, pause, resume, game over
  // ============================================================
  startGame() {
    Sound.init();

    // Remove old things from the screen
    this.clearList(this.rocks);
    this.clearList(this.stars);
    this.clearList(this.powerUps);

    // Reset numbers
    this.survivedTime = 0;
    this.score = 0;
    this.lives = SETTINGS.startLives;
    this.level = 1;
    this.hasShield = false;
    this.invincibleTime = 0;
    this.shakeTime = 0;
    this.rockTimer = 0.6;
    this.starTimer = 1.5;
    this.powerTimer = 9;
    this.ship.reset();

    this.mode = 'play';
    UI.showPlaying();
  }

  pauseGame() {
    if (this.mode !== 'play') return;
    this.mode = 'pause';
    UI.showPaused();
  }

  resumeGame() {
    if (this.mode !== 'pause') return;
    this.mode = 'play';
    UI.showResumed();
  }

  togglePause() {
    if (this.mode === 'play') {
      this.pauseGame();
    } else {
      this.resumeGame();
    }
  }

  gameOver() {
    this.mode = 'over';

    const finalScore = Math.floor(this.score);
    const isNewBest = finalScore > this.best;

    UI.showGameOver(finalScore, this.best, isNewBest);
    Leaderboard.submitHighscore(Leaderboard.getSavedUsername(), finalScore)
      .then((highscore) => {
        this.best = highscore;
        UI.setBest(highscore);
        UI.finalBestBox.textContent = 'Best score: ' + highscore;
        UI.setScoreMessage('Score saved to the leaderboard.', false);
        return Leaderboard.getTopFive();
      })
      .then((players) => UI.setLeaderboard(players))
      .catch((error) => {
        UI.setScoreMessage(`Could not save your score: ${error.message}`, true);
      });
    Sound.playGameOver();
  }

  // ============================================================
  // update: runs every frame
  // ============================================================
  update(time, delta) {
    // dt = seconds since the last frame (limited so lag spikes don't teleport things)
    const dt = Math.min(0.05, delta / 1000);

    if (this.mode === 'play') {
      this.updatePlay(dt);
    } else if (this.mode === 'menu') {
      this.updateMenu(dt);
    }

    // Drawing
    if (this.mode === 'pause') {
      this.drawBackground(0);          // background stops while paused
    } else {
      this.drawBackground(dt);
    }
    this.drawEverything();
    this.shakeScreen();
    UI.updateHud(this.score, this.level, this.lives);
  }

  // One frame of the real game. The order matters:
  // update values -> move player -> spawn -> move objects -> check collisions.
  updatePlay(dt) {
    // Time, level and score
    this.survivedTime += dt;
    this.level = Difficulty.level(this.survivedTime);
    this.score += dt * SETTINGS.survivalPointsPerSecond;
    if (this.invincibleTime > 0) this.invincibleTime -= dt;
    if (this.shakeTime > 0) this.shakeTime -= dt;

    // Move the ship
    this.ship.update(dt, this.keys, this.input.activePointer);

    // A timer counts down each frame. When it reaches zero, create an object
    // and reset the timer so another one appears later.
    this.rockTimer -= dt;
    if (this.rockTimer <= 0) {
      this.rocks.push(createRock(this, 1, this.survivedTime));
      this.rockTimer = Difficulty.rockInterval(this.survivedTime) * randomBetween(0.8, 1.2);
    }

    this.starTimer -= dt;
    if (this.starTimer <= 0) {
      this.stars.push(createStar(this));
      this.starTimer = Difficulty.starInterval();
    }

    this.powerTimer -= dt;
    if (this.powerTimer <= 0) {
      if (!this.hasShield) {            // no new shield if you already have one
        this.powerUps.push(createPowerUp(this));
      }
      this.powerTimer = Difficulty.powerInterval();
    }

    // Move first, then check the new positions for collisions and pickups.
    this.moveThings(dt);
    this.checkRockHits();
    if (this.mode !== 'play') return;   // the game ended in checkRockHits
    this.checkStarPickups();
    this.checkPowerUpPickups();
  }

  // The menu is still animated, but only slow asteroids move behind it.
  updateMenu(dt) {
    this.rockTimer -= dt;
    if (this.rockTimer <= 0) {
      this.rocks.push(createRock(this, 0.55, 0));
      this.rockTimer = randomBetween(0.9, 1.6);
    }
    this.moveThings(dt);
  }

  // ============================================================
  // Moving things
  // ============================================================
  moveThings(dt) {
    for (const rock of this.rocks) {
      rock.y += rock.speedY * dt;
      rock.x += rock.speedX * dt;
      rock.rotation += rock.spin * dt;
    }
    for (const star of this.stars) {
      star.y += star.speedY * dt;
      star.rotation += 2 * dt;
    }
    for (const power of this.powerUps) {
      power.y += power.speedY * dt;
      power.pulse += dt * 5;
    }

    // Delete things that left the screen (loop backwards so deleting is safe)
    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const rock = this.rocks[i];
      if (rock.y > GAME_HEIGHT + 50 || rock.x < -60 || rock.x > GAME_WIDTH + 60) {
        this.removeFromList(this.rocks, i);
      }
    }
    for (let i = this.stars.length - 1; i >= 0; i--) {
      if (this.stars[i].y > GAME_HEIGHT + 30) {
        this.removeFromList(this.stars, i);
      }
    }
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      if (this.powerUps[i].y > GAME_HEIGHT + 30) {
        this.removeFromList(this.powerUps, i);
      }
    }
  }

  // ============================================================
  // Collisions
  // ============================================================

  // Approximate each object as a circle. If the distance between their
  // centers is smaller than their combined radii, they are touching.
  circlesTouch(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const totalRadius = r1 + r2;
    return dx * dx + dy * dy < totalRadius * totalRadius;
  }

  checkRockHits() {
    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const rock = this.rocks[i];
      if (this.invincibleTime > 0) continue;   // safe right now

      const touching = this.circlesTouch(
        this.ship.x, this.ship.y, this.ship.radius,
        rock.x, rock.y, rock.radius * 0.85
      );
      if (!touching) continue;

      this.removeFromList(this.rocks, i);

      if (this.hasShield) {
        // The shield blocks the hit
        this.hasShield = false;
        this.invincibleTime = SETTINGS.shieldInvincibleSeconds;
        Sound.playBlock();
        this.showPopText(this.ship.x, this.ship.y - 30, 'Blocked', '#3FC1B0');
      } else {
        // Lose a life
        this.lives = this.lives - 1;
        this.invincibleTime = SETTINGS.hitInvincibleSeconds;
        this.shakeTime = 0.3;
        Sound.playHit();
        if (this.lives <= 0) {
          this.gameOver();
          return;
        }
      }
    }
  }

  checkStarPickups() {
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const star = this.stars[i];
      const touching = this.circlesTouch(
        this.ship.x, this.ship.y, this.ship.radius,
        star.x, star.y, star.radius + 4
      );
      if (touching) {
        this.score += SETTINGS.starPoints;
        Sound.playStar();
        this.showPopText(star.x, star.y - 12, '+' + SETTINGS.starPoints, '#F2B544');
        this.removeFromList(this.stars, i);
      }
    }
  }

  checkPowerUpPickups() {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const power = this.powerUps[i];
      const touching = this.circlesTouch(
        this.ship.x, this.ship.y, this.ship.radius,
        power.x, power.y, power.radius + 4
      );
      if (touching) {
        this.hasShield = true;
        Sound.playPower();
        this.showPopText(power.x, power.y - 14, 'Shield', '#3FC1B0');
        this.removeFromList(this.powerUps, i);
      }
    }
  }

  // ============================================================
  // Drawing
  // ============================================================

  // Draw the background independently of game objects so it sits behind them.
  drawBackground(dt) {
    let speedMultiplier = 0.4;
    if (this.mode === 'play') speedMultiplier = 1;

    const g = this.backgroundGraphics;
    g.clear();
    for (const star of this.backgroundStars) {
      star.y += star.speed * dt * speedMultiplier;
      if (star.y > GAME_HEIGHT) {          // fell off the bottom: restart at the top
        star.y = -2;
        star.x = randomBetween(0, GAME_WIDTH);
      }
      g.fillStyle(COLORS.backgroundStar, 0.25 + star.size / 3);
      g.fillCircle(star.x, star.y, star.size);
    }
  }

  // The objects store simple x/y values for game logic. Copy those values to
  // their Phaser graphics so the canvas shows their current positions.
  drawEverything() {
    for (const rock of this.rocks) {
      rock.graphics.setPosition(rock.x, rock.y);
      rock.graphics.setRotation(rock.rotation);
    }
    for (const star of this.stars) {
      star.graphics.setPosition(star.x, star.y);
      star.graphics.setRotation(star.rotation);
    }
    for (const power of this.powerUps) {
      power.graphics.clear();               // the ring pulses, so redraw it
      power.graphics.setPosition(power.x, power.y);
      drawPowerUp(power.graphics, power.radius, power.pulse);
    }

    this.ship.draw(this.hasShield, this.invincibleTime);
    this.shieldText.setVisible(this.mode === 'play' && this.hasShield);
  }

  // Shake the screen for a moment after losing a life
  shakeScreen() {
    const camera = this.cameras.main;
    if (this.mode === 'play' && this.shakeTime > 0) {
      camera.setScroll(randomBetween(-5, 5), randomBetween(-5, 5));
    } else {
      camera.setScroll(0, 0);
    }
  }

  // Text that floats up and fades out ("+50", "Shield", "Blocked")
  showPopText(x, y, message, color) {
    const text = this.add.text(x, y, message, {
      fontFamily: 'Oswald, Arial, sans-serif',
      fontSize: '20px',
      fontStyle: '700',
      color: color
    });
    text.setOrigin(0.5);
    text.setDepth(5);

    // A "tween" changes values over time: move up 36 and fade out in 0.9 seconds
    this.tweens.add({
      targets: text,
      y: y - 36,
      alpha: 0,
      duration: 900,
      onComplete: function () {
        text.destroy();
      }
    });
  }

  // ============================================================
  // Small helpers
  // ============================================================

  // Remove one item from a list and delete its picture
  removeFromList(list, index) {
    list[index].graphics.destroy();
    list.splice(index, 1);
  }

  // Remove every item from a list
  clearList(list) {
    for (const item of list) {
      item.graphics.destroy();
    }
    list.length = 0;
  }
}
