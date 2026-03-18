// ============================================
// SLITHER.IO GAME - Snake Class
// ============================================

import { 
  GAME_CONFIG, 
  Segment, 
  Vector2D, 
  InputState,
  Particle,
  Orb 
} from './types';
import { 
  generateId, 
  normalize, 
  lerp, 
  distance, 
  clamp,
  angleBetween 
} from './utils';

export class Snake {
  id: string;
  name: string;
  color: string;
  isBot: boolean;
  
  segments: Segment[] = [];
  direction: Vector2D = { x: 1, y: 0 };
  targetDirection: Vector2D = { x: 1, y: 0 };
  
  speed: number;
  isBoosting: boolean = false;
  boostTimer: number = 0;
  
  score: number = 0;
  kills: number = 0;
  orbsCollected: number = 0;
  
  isAlive: boolean = true;
  deathTime: number = 0;
  
  // Visual
  eyeAngle: number = 0;
  trailParticles: Particle[] = [];
  
  // Bot AI
  targetOrb: Orb | null = null;
  avoidanceDirection: Vector2D | null = null;
  wanderAngle: number = Math.random() * Math.PI * 2;
  lastDecisionTime: number = 0;

  constructor(
    id: string,
    name: string,
    color: string,
    isBot: boolean = false,
    startX?: number,
    startY?: number,
    initialLength: number = GAME_CONFIG.INITIAL_LENGTH
  ) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.isBot = isBot;
    this.speed = GAME_CONFIG.BASE_SPEED;
    
    // Initialize position
    const x = startX ?? Math.random() * (GAME_CONFIG.WORLD_WIDTH - 200) + 100;
    const y = startY ?? Math.random() * (GAME_CONFIG.WORLD_HEIGHT - 200) + 100;
    
    // Random initial direction
    const angle = Math.random() * Math.PI * 2;
    this.direction = { x: Math.cos(angle), y: Math.sin(angle) };
    this.targetDirection = { ...this.direction };
    
    // Create initial segments
    for (let i = 0; i < initialLength; i++) {
      this.segments.push({
        x: x - this.direction.x * i * GAME_CONFIG.SEGMENT_SPACING,
        y: y - this.direction.y * i * GAME_CONFIG.SEGMENT_SPACING
      });
    }
  }

  get head(): Segment {
    return this.segments[0];
  }

  get length(): number {
    return this.segments.length;
  }

  get radius(): number {
    return GAME_CONFIG.SEGMENT_RADIUS;
  }

  update(input: InputState, deltaTime: number): void {
    if (!this.isAlive) return;

    // Update direction based on input
    if (input.direction.x !== 0 || input.direction.y !== 0) {
      this.targetDirection = normalize(input.direction);
    }

    // Smooth direction change
    const turnSpeed = GAME_CONFIG.TURN_SPEED;
    this.direction.x = lerp(this.direction.x, this.targetDirection.x, turnSpeed);
    this.direction.y = lerp(this.direction.y, this.targetDirection.y, turnSpeed);
    this.direction = normalize(this.direction);

    // Handle boosting
    this.isBoosting = input.boosting && this.length > GAME_CONFIG.BOOST_MIN_LENGTH;
    
    if (this.isBoosting) {
      this.speed = GAME_CONFIG.BOOST_SPEED;
      this.boostTimer += deltaTime;
      
      // Drain segments while boosting
      if (this.boostTimer >= 1000 / GAME_CONFIG.BOOST_DRAIN_RATE) {
        this.boostTimer = 0;
        if (this.segments.length > GAME_CONFIG.BOOST_MIN_LENGTH) {
          const lastSegment = this.segments.pop();
          if (lastSegment) {
            // Create trail particle
            this.trailParticles.push({
              x: lastSegment.x,
              y: lastSegment.y,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              radius: GAME_CONFIG.SEGMENT_RADIUS * 0.8,
              color: this.color,
              life: 1,
              maxLife: 1
            });
          }
        }
      }
    } else {
      this.speed = GAME_CONFIG.BASE_SPEED;
      this.boostTimer = 0;
    }

    // Move head
    const newHeadX = this.head.x + this.direction.x * this.speed;
    const newHeadY = this.head.y + this.direction.y * this.speed;

    // World boundary collision
    const padding = 20;
    if (newHeadX < padding || newHeadX > GAME_CONFIG.WORLD_WIDTH - padding ||
        newHeadY < padding || newHeadY > GAME_CONFIG.WORLD_HEIGHT - padding) {
      this.die();
      return;
    }

    // Update segments
    this.segments.unshift({ x: newHeadX, y: newHeadY });
    this.segments.pop();

    // Update eye angle
    this.eyeAngle = angleBetween(this.head.x, this.head.y, 
      this.head.x + this.direction.x * 10, 
      this.head.y + this.direction.y * 10);

    // Update trail particles
    this.updateTrailParticles(deltaTime);
  }

  grow(amount: number = 1): void {
    const tail = this.segments[this.segments.length - 1];
    const prevTail = this.segments[this.segments.length - 2] || tail;
    
    const dx = tail.x - prevTail.x;
    const dy = tail.y - prevTail.y;
    
    for (let i = 0; i < amount; i++) {
      this.segments.push({
        x: tail.x + dx * (i + 1),
        y: tail.y + dy * (i + 1)
      });
    }
  }

  addScore(points: number): void {
    this.score += points;
  }

  die(): void {
    this.isAlive = false;
    this.deathTime = Date.now();
  }

  getDeathOrbs(): Orb[] {
    const orbs: Orb[] = [];
    
    for (const segment of this.segments) {
      orbs.push({
        id: generateId(),
        x: segment.x + (Math.random() - 0.5) * 20,
        y: segment.y + (Math.random() - 0.5) * 20,
        radius: GAME_CONFIG.ORB_RADIUS + 1,
        value: Math.ceil(this.length / 10) + 1,
        color: this.color,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
    
    return orbs;
  }

  private updateTrailParticles(deltaTime: number): void {
    const decay = deltaTime / 500;
    
    this.trailParticles = this.trailParticles.filter(p => {
      p.life -= decay;
      p.x += p.vx;
      p.y += p.vy;
      p.radius *= 0.98;
      return p.life > 0;
    });
  }

  // Check if a point collides with this snake's body (excluding head)
  checkBodyCollision(x: number, y: number, radius: number): boolean {
    // Skip first few segments near head
    for (let i = 4; i < this.segments.length; i++) {
      const seg = this.segments[i];
      if (distance(x, y, seg.x, seg.y) < radius + GAME_CONFIG.SEGMENT_RADIUS) {
        return true;
      }
    }
    return false;
  }

  // Check if a point collides with this snake's head
  checkHeadCollision(x: number, y: number, radius: number): boolean {
    return distance(x, y, this.head.x, this.head.y) < 
      radius + GAME_CONFIG.HEAD_COLLISION_RADIUS;
  }
}
