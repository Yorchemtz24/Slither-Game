// ============================================
// SLITHER.IO GAME - Types and Constants
// ============================================

export const GAME_CONFIG = {
  // World
  WORLD_WIDTH: 4000,
  WORLD_HEIGHT: 4000,
  GRID_SIZE: 50,
  
  // Snake
  INITIAL_LENGTH: 10,
  SEGMENT_RADIUS: 8,
  SEGMENT_SPACING: 4,
  BASE_SPEED: 3,
  BOOST_SPEED: 6,
  TURN_SPEED: 0.15,
  
  // Orbs
  INITIAL_ORB_COUNT: 300,
  ORB_MIN_VALUE: 1,
  ORB_MAX_VALUE: 3,
  ORB_RADIUS: 6,
  ORB_RESPAWN_RATE: 1000, // ms
  MAX_ORBS: 500,
  
  // Bots
  INITIAL_BOT_COUNT: 15,
  BOT_MIN_LENGTH: 5,
  BOT_MAX_LENGTH: 50,
  BOT_SPEED_VARIANCE: 0.3,
  
  // Visual
  COLORS: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
    '#FF69B4', '#32CD32', '#FF4500', '#9370DB'
  ],
  
  // Camera
  ZOOM_MIN: 0.5,
  ZOOM_MAX: 1.5,
  ZOOM_SPEED: 0.01,
  
  // Boost
  BOOST_DRAIN_RATE: 2, // segments per second
  BOOST_MIN_LENGTH: 15,
  
  // Collision
  HEAD_COLLISION_RADIUS: 12,
  BODY_COLLISION_RADIUS: 8,
} as const;

export interface Vector2D {
  x: number;
  y: number;
}

export interface Segment {
  x: number;
  y: number;
}

export interface Orb {
  id: string;
  x: number;
  y: number;
  radius: number;
  value: number;
  color: string;
  pulsePhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver';

export interface ScoreEntry {
  name: string;
  score: number;
  length: number;
  time: number;
}

export interface GameStats {
  score: number;
  length: number;
  kills: number;
  timeAlive: number;
  orbsCollected: number;
}

export interface SnakeConfig {
  id: string;
  name: string;
  color: string;
  isBot: boolean;
  initialLength?: number;
}

export interface InputState {
  direction: Vector2D;
  boosting: boolean;
}
