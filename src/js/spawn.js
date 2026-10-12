/* spawn.js
   Factory functions for falling objects. A returned object keeps its game
   values (position, speed, etc.) together with the Phaser picture to draw. */

import { GAME_WIDTH, Difficulty, randomBetween } from './config.js';
import { drawRock, drawStar } from './drawing.js';

export function createRock(scene, speedScale, survivedTime) {
  const radius = randomBetween(14, 32);

  // random lumpiness for the outline
  const bumps = [];
  for (let i = 0; i < 9; i++) {
    bumps.push(randomBetween(0.74, 1));
  }

  const graphics = scene.add.graphics();
  graphics.setDepth(3);
  drawRock(graphics, radius, bumps);   // drawn once, then we just move and rotate it

  return {
    x: randomBetween(radius, GAME_WIDTH - radius),
    y: -radius,
    radius: radius,
    speedY: Difficulty.rockSpeed(survivedTime) * randomBetween(0.85, 1.25) * speedScale,
    speedX: randomBetween(-30, 30),
    rotation: randomBetween(0, 6.28),
    spin: randomBetween(-1.6, 1.6),
    graphics: graphics
  };
}

export function createStar(scene) {
  const graphics = scene.add.graphics();
  graphics.setDepth(2);
  drawStar(graphics, 11);

  return {
    x: randomBetween(24, GAME_WIDTH - 24),
    y: -20,
    radius: 11,
    speedY: randomBetween(110, 170),
    rotation: 0,
    graphics: graphics
  };
}

export function createPowerUp(scene) {
  const graphics = scene.add.graphics();
  graphics.setDepth(1);

  return {
    x: randomBetween(30, GAME_WIDTH - 30),
    y: -20,
    radius: 13,
    speedY: 120,
    pulse: 0,
    graphics: graphics
  };
}
