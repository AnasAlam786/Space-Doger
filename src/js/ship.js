/* ship.js
   The player's ship. This class stores the ship's position and handles input.
   GameScene calls update() and draw() once per frame while the game is active. */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SETTINGS } from './config.js';
import { drawShip } from './drawing.js';

export class Ship {
  constructor(scene) {
    this.radius = SETTINGS.shipRadius;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(4);      // depth decides what is drawn on top
    this.reset();
  }

  // Put the ship back at the start position
  reset() {
    this.x = GAME_WIDTH / 2;
    this.y = GAME_HEIGHT - 90;
  }

  // Move the ship. "keys" are the keyboard keys, "pointer" is the mouse or finger.
  update(dt, keys, pointer) {
    // Which way do the keys point? left = -1, right = +1
    let dx = 0;
    let dy = 0;
    if (keys.LEFT.isDown || keys.A.isDown) dx = dx - 1;
    if (keys.RIGHT.isDown || keys.D.isDown) dx = dx + 1;
    if (keys.UP.isDown || keys.W.isDown) dy = dy - 1;
    if (keys.DOWN.isDown || keys.S.isDown) dy = dy + 1;

    if (dx !== 0 || dy !== 0) {
      // Keyboard: divide by the length so diagonal moves are not faster
      const length = Math.hypot(dx, dy);
      this.x += dx / length * SETTINGS.shipSpeed * dt;
      this.y += dy / length * SETTINGS.shipSpeed * dt;
    } else if (pointer.isDown) {
      // Mouse or finger: glide toward it
      let targetX = pointer.x;
      let targetY = pointer.y;
      if (pointer.wasTouch) {
        targetY = targetY - SETTINGS.touchOffsetY;   // keep the ship visible above the finger
      }
      // Move partway toward the pointer each frame for smooth touch/mouse input.
      const ease = Math.min(1, dt * 14);
      this.x += (targetX - this.x) * ease;
      this.y += (targetY - this.y) * ease;
    }

    // Keep the ship inside the play field
    this.x = Phaser.Math.Clamp(this.x, 18, GAME_WIDTH - 18);
    this.y = Phaser.Math.Clamp(this.y, 60, GAME_HEIGHT - 30);
  }

  // Draw the ship. It blinks while invincible.
  draw(hasShield, invincibleTime) {
    this.graphics.clear();
    this.graphics.setPosition(this.x, this.y);

    const blinkOff = invincibleTime > 0 && Math.floor(invincibleTime * 12) % 2 === 0;
    if (blinkOff) return;

    drawShip(this.graphics, hasShield);
  }
}
