// ============================================
// SLITHER.IO GAME - Utility Functions
// ============================================

import { GAME_CONFIG, Vector2D, Orb } from './types';

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Random number in range
export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Random integer in range
export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

// Random color from palette
export function randomColor(): string {
  return GAME_CONFIG.COLORS[randomInt(0, GAME_CONFIG.COLORS.length - 1)];
}

// Distance between two points
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Normalize vector
export function normalize(vec: Vector2D): Vector2D {
  const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: vec.x / len, y: vec.y / len };
}

// Linear interpolation
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Angle between two points
export function angleBetween(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

// Clamp value
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Check circle collision
export function circleCollision(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number
): boolean {
  return distance(x1, y1, x2, y2) < r1 + r2;
}

// Generate random position within world bounds
export function randomWorldPosition(padding: number = 100): Vector2D {
  return {
    x: randomRange(padding, GAME_CONFIG.WORLD_WIDTH - padding),
    y: randomRange(padding, GAME_CONFIG.WORLD_HEIGHT - padding)
  };
}

// Generate orb
export function generateOrb(): Orb {
  const pos = randomWorldPosition(50);
  const value = randomInt(GAME_CONFIG.ORB_MIN_VALUE, GAME_CONFIG.ORB_MAX_VALUE);
  
  return {
    id: generateId(),
    x: pos.x,
    y: pos.y,
    radius: GAME_CONFIG.ORB_RADIUS + value,
    value,
    color: randomColor(),
    pulsePhase: Math.random() * Math.PI * 2
  };
}

// Bot names
export const BOT_NAMES = [
  'Serpent', 'Viper', 'Cobra', 'Python', 'Anaconda',
  'Mamba', 'Rattler', 'Sidewinder', 'Boa', 'Adder',
  'Asp', 'Krait', 'Taipan', 'Fer-de-lance', 'Cottonmouth',
  'Copperhead', 'Bushmaster', 'Lancehead', 'Keelback', 'Racer',
  'Bullsnake', 'Garter', 'Hognose', 'Kingsnake', 'Milksnake',
  'Cornsnake', 'RatSnake', 'Pine', 'Bull', 'Coachwhip',
  'Whipsnake', 'Patchnose', 'Lyresnake', 'Indigo', 'Pine'
];

export function randomBotName(): string {
  return BOT_NAMES[randomInt(0, BOT_NAMES.length - 1)];
}

// Format time
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format score
export function formatScore(score: number): string {
  if (score >= 1000000) {
    return (score / 1000000).toFixed(1) + 'M';
  }
  if (score >= 1000) {
    return (score / 1000).toFixed(1) + 'K';
  }
  return score.toString();
}

// Ease out cubic
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Ease in out quad
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
