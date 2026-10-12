/* drawing.js
   Drawing instructions only: these functions do not move objects or apply
   game rules. Shapes are drawn around (0, 0); the scene positions them later. */

import { COLORS } from './config.js';

// Draws a shape from a list of points: filled, then outlined.
// The fill is made of triangles that all start at the center (0, 0).
export function drawPolygon(g, points, fillColor, lineWidth, lineColor) {
  g.fillStyle(fillColor, 1);
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];   // the next point (wraps to the first)
    g.fillTriangle(0, 0, a.x, a.y, b.x, b.y);
  }
  g.lineStyle(lineWidth, lineColor, 1);
  g.strokePoints(points, true);
}

// The ship: flame, body and (optional) shield bubble
export function drawShip(g, hasShield) {
  // flame (its length flickers randomly)
  const flameLength = 8 + Math.random() * 7;
  g.fillStyle(COLORS.amber, 1);
  g.fillTriangle(-5, 10, 0, 10 + flameLength, 5, 10);

  // body
  const body = [
    { x: 0, y: -19 },
    { x: 14, y: 15 },
    { x: 0, y: 8 },
    { x: -14, y: 15 }
  ];
  drawPolygon(g, body, COLORS.teal, 2, COLORS.white);

  // shield bubble
  if (hasShield) {
    g.fillStyle(COLORS.teal, 0.16);
    g.fillCircle(0, 0, 27);
    g.lineStyle(2.5, COLORS.teal, 1);
    g.strokeCircle(0, 0, 27);
  }
}

// An asteroid. "bumps" is a list of 9 numbers that make the outline lumpy.
export function drawRock(g, radius, bumps) {
  const points = [];
  for (let i = 0; i < bumps.length; i++) {
    const angle = i / bumps.length * Math.PI * 2;
    points.push({
      x: Math.cos(angle) * radius * bumps[i],
      y: Math.sin(angle) * radius * bumps[i]
    });
  }
  drawPolygon(g, points, COLORS.rockFill, 2, COLORS.rockEdge);

  // small crater
  g.lineStyle(1.5, COLORS.rockCrater, 1);
  g.strokeCircle(radius * 0.25, -radius * 0.2, radius * 0.18);
}

// A 5-point star (10 points: outer, inner, outer, inner...)
export function drawStar(g, radius) {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI / 5 - Math.PI / 2;
    let distance = radius;
    if (i % 2 === 1) {
      distance = radius * 0.45;   // every second point is closer to the center
    }
    points.push({ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance });
  }
  drawPolygon(g, points, COLORS.amber, 1.5, COLORS.starEdge);
}

// The shield power-up: a pulsing ring with a dot
export function drawPowerUp(g, radius, pulse) {
  const pulsingRadius = radius + Math.sin(pulse) * 1.5;
  g.fillStyle(COLORS.teal, 0.2);
  g.fillCircle(0, 0, pulsingRadius);
  g.lineStyle(3, COLORS.teal, 1);
  g.strokeCircle(0, 0, pulsingRadius);
  g.fillStyle(COLORS.teal, 1);
  g.fillCircle(0, 0, 4);
}
