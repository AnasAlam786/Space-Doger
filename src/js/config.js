/* config.js
   Shared settings and small calculations. Change these values to tune the game
   without having to search through the game logic. */

// Size of the play field
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 600;

// Colors (Phaser uses 0x numbers instead of '#' text)
export const COLORS = {
  teal: 0x3FC1B0,
  amber: 0xF2B544,
  white: 0xF4F1EA,
  rockFill: 0x2A3158,
  rockEdge: 0x6A74A8,
  rockCrater: 0x4A5488,
  starEdge: 0xFFE19A,
  backgroundStar: 0xC9CFEA
};

// Game rules
export const SETTINGS = {
  shipSpeed: 330,               // keyboard speed (units per second)
  shipRadius: 13,
  startLives: 3,
  levelSeconds: 20,             // new level every 20 seconds
  survivalPointsPerSecond: 8,
  starPoints: 50,
  hitInvincibleSeconds: 1.6,    // safe time after losing a life
  shieldInvincibleSeconds: 0.7, // safe time after the shield blocks a hit
  touchOffsetY: 50              // ship floats above the finger on touch screens
};

// A random number between min and max
export function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

// Difficulty formulas. "t" is the number of seconds the player has survived.
// The scene asks these functions when it needs the current level or a timer.
export const Difficulty = {
  level: function (t) {
    return 1 + Math.floor(t / SETTINGS.levelSeconds);
  },
  rockInterval: function (t) {
    return Math.max(0.3, 0.85 - t * 0.01);   // seconds between asteroids
  },
  rockSpeed: function (t) {
    return Math.min(380, 120 + t * 4.5);     // how fast asteroids fall
  },
  starInterval: function () {
    return randomBetween(1.2, 2.2);
  },
  powerInterval: function () {
    return randomBetween(12, 18);
  }
};
