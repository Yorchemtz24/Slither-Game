// ============================================
// SLITHER.IO GAME - Main Game Engine
// ============================================

import { 
  GAME_CONFIG, 
  GameState, 
  Orb, 
  Particle, 
  GameStats,
  InputState,
  Vector2D
} from './types';
import { Snake } from './Snake';
import { 
  generateId, 
  randomColor, 
  randomBotName, 
  randomWorldPosition,
  generateOrb,
  distance,
  formatTime
} from './utils';

export class Game {
  // State
  state: GameState = 'menu';
  lastTime: number = 0;
  deltaTime: number = 0;
  gameTime: number = 0;
  
  // Entities
  player: Snake | null = null;
  bots: Snake[] = [];
  orbs: Map<string, Orb> = new Map();
  particles: Particle[] = [];
  
  // Camera
  camera: Vector2D = { x: 0, y: 0 };
  zoom: number = 1;
  targetZoom: number = 1;
  
  // Input
  input: InputState = {
    direction: { x: 1, y: 0 },
    boosting: false
  };
  
  // Stats
  highScore: number = 0;
  leaderboard: Array<{ name: string; length: number; score: number }> = [];
  
  // Callbacks
  onStateChange?: (state: GameState) => void;
  onStatsUpdate?: (stats: GameStats) => void;
  
  // Orb respawn
  orbSpawnTimer: number = 0;
  
  constructor() {
    this.loadHighScore();
  }

  // ============================================
  // Game Lifecycle
  // ============================================

  start(playerName: string = 'Player'): void {
    // Reset game state
    this.bots = [];
    this.orbs.clear();
    this.particles = [];
    this.gameTime = 0;
    this.zoom = 1;
    
    // Create player
    const pos = randomWorldPosition(200);
    this.player = new Snake(
      generateId(),
      playerName,
      randomColor(),
      false,
      pos.x,
      pos.y,
      GAME_CONFIG.INITIAL_LENGTH
    );
    
    // Create initial orbs
    for (let i = 0; i < GAME_CONFIG.INITIAL_ORB_COUNT; i++) {
      const orb = generateOrb();
      this.orbs.set(orb.id, orb);
    }
    
    // Create bots
    for (let i = 0; i < GAME_CONFIG.INITIAL_BOT_COUNT; i++) {
      this.spawnBot();
    }
    
    // Update state
    this.state = 'playing';
    this.lastTime = performance.now();
    this.onStateChange?.(this.state);
  }

  update(timestamp: number): void {
    if (this.state !== 'playing') return;
    
    // Calculate delta time
    this.deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.gameTime += this.deltaTime;
    
    // Update player
    if (this.player && this.player.isAlive) {
      this.player.update(this.input, this.deltaTime);
      this.updateCamera();
      
      // Check orb collection
      this.checkOrbCollection(this.player);
      
      // Check boundary
      this.checkWorldBoundary(this.player);
    }
    
    // Update bots
    this.updateBots();
    
    // Check collisions
    this.checkSnakeCollisions();
    
    // Update particles
    this.updateParticles();
    
    // Spawn orbs
    this.updateOrbSpawning();
    
    // Respawn dead bots
    this.respawnBots();
    
    // Update stats
    if (this.player) {
      this.onStatsUpdate?.(this.getStats());
    }
    
    // Check game over
    if (this.player && !this.player.isAlive) {
      this.gameOver();
    }
  }

  private gameOver(): void {
    this.state = 'gameOver';
    
    // Update high score
    if (this.player && this.player.score > this.highScore) {
      this.highScore = this.player.score;
      this.saveHighScore();
    }
    
    // Update leaderboard
    this.updateLeaderboard();
    
    this.onStateChange?.(this.state);
  }

  pause(): void {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.onStateChange?.(this.state);
    }
  }

  resume(): void {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.lastTime = performance.now();
      this.onStateChange?.(this.state);
    }
  }

  // Update input state
  setInput(direction: Vector2D, boosting: boolean): void {
    this.input.direction = direction;
    this.input.boosting = boosting;
  }

  // ============================================
  // Entity Management
  // ============================================

  private spawnBot(): void {
    const pos = randomWorldPosition(200);
    const length = Math.floor(
      Math.random() * (GAME_CONFIG.BOT_MAX_LENGTH - GAME_CONFIG.BOT_MIN_LENGTH) + 
      GAME_CONFIG.BOT_MIN_LENGTH
    );
    
    const bot = new Snake(
      generateId(),
      randomBotName(),
      randomColor(),
      true,
      pos.x,
      pos.y,
      length
    );
    
    this.bots.push(bot);
  }

  private updateBots(): void {
    for (const bot of this.bots) {
      if (!bot.isAlive) continue;
      
      // Simple AI
      this.updateBotAI(bot);
      
      // Update bot
      bot.update(bot.isBoosting ? 
        { direction: bot.targetDirection, boosting: true } : 
        { direction: bot.targetDirection, boosting: false }, 
        this.deltaTime
      );
      
      // Check orb collection
      this.checkOrbCollection(bot);
      
      // Check boundary
      this.checkWorldBoundary(bot);
    }
  }

  private updateBotAI(bot: Snake): void {
    const now = Date.now();
    
    // Make decisions periodically
    if (now - bot.lastDecisionTime > 200) {
      bot.lastDecisionTime = now;
      
      let bestDirection: Vector2D = bot.direction;
      let bestScore = -Infinity;
      
      // Check multiple directions
      const angles = [-0.5, -0.25, 0, 0.25, 0.5];
      
      for (const angleOffset of angles) {
        const angle = Math.atan2(bot.direction.y, bot.direction.x) + angleOffset;
        const testDir = { x: Math.cos(angle), y: Math.sin(angle) };
        let score = 0;
        
        // Score based on nearby orbs
        for (const [, orb] of this.orbs) {
          const dist = distance(
            bot.head.x + testDir.x * 100,
            bot.head.y + testDir.y * 100,
            orb.x, orb.y
          );
          if (dist < 200) {
            score += (200 - dist) * orb.value;
          }
        }
        
        // Score based on avoiding other snakes
        const playerDist = this.player && this.player.isAlive ? 
          distance(bot.head.x, bot.head.y, this.player.head.x, this.player.head.y) : Infinity;
        
        // Avoid player if nearby
        if (playerDist < 150 && this.player && this.player.length > bot.length) {
          const awayDir = {
            x: bot.head.x - this.player.head.x,
            y: bot.head.y - this.player.head.y
          };
          const alignment = testDir.x * (awayDir.x / playerDist) + 
                          testDir.y * (awayDir.y / playerDist);
          score += alignment * 500;
        }
        
        // Avoid world edges
        const testX = bot.head.x + testDir.x * 100;
        const testY = bot.head.y + testDir.y * 100;
        const edgeDist = Math.min(
          testX, 
          GAME_CONFIG.WORLD_WIDTH - testX,
          testY,
          GAME_CONFIG.WORLD_HEIGHT - testY
        );
        if (edgeDist < 100) {
          score -= (100 - edgeDist) * 10;
        }
        
        // Avoid other bots
        for (const otherBot of this.bots) {
          if (otherBot.id === bot.id || !otherBot.isAlive) continue;
          const otherDist = distance(bot.head.x, bot.head.y, otherBot.head.x, otherBot.head.y);
          if (otherDist < 100 && otherBot.length > bot.length) {
            const awayDir = {
              x: bot.head.x - otherBot.head.x,
              y: bot.head.y - otherBot.head.y
            };
            const alignment = testDir.x * (awayDir.x / otherDist) + 
                            testDir.y * (awayDir.y / otherDist);
            score += alignment * 300;
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestDirection = testDir;
        }
      }
      
      bot.targetDirection = bestDirection;
      
      // Decide whether to boost
      const nearestThreat = this.findNearestThreat(bot);
      bot.isBoosting = nearestThreat < 80 && bot.length > GAME_CONFIG.BOOST_MIN_LENGTH;
    }
  }

  private findNearestThreat(bot: Snake): number {
    let nearestDist = Infinity;
    
    // Check player
    if (this.player && this.player.isAlive && this.player.length > bot.length) {
      const dist = distance(bot.head.x, bot.head.y, this.player.head.x, this.player.head.y);
      nearestDist = Math.min(nearestDist, dist);
    }
    
    // Check other bots
    for (const other of this.bots) {
      if (other.id === bot.id || !other.isAlive || other.length <= bot.length) continue;
      const dist = distance(bot.head.x, bot.head.y, other.head.x, other.head.y);
      nearestDist = Math.min(nearestDist, dist);
    }
    
    return nearestDist;
  }

  private respawnBots(): void {
    const aliveBots = this.bots.filter(b => b.isAlive).length;
    
    if (aliveBots < GAME_CONFIG.INITIAL_BOT_COUNT) {
      // Remove dead bots
      this.bots = this.bots.filter(b => b.isAlive || Date.now() - b.deathTime < 3000);
      
      // Spawn new bots
      while (this.bots.filter(b => b.isAlive).length < GAME_CONFIG.INITIAL_BOT_COUNT) {
        this.spawnBot();
      }
    }
  }

  // ============================================
  // Collision Detection
  // ============================================

  private checkOrbCollection(snake: Snake): void {
    const headX = snake.head.x;
    const headY = snake.head.y;
    const collectRadius = GAME_CONFIG.HEAD_COLLISION_RADIUS + GAME_CONFIG.ORB_RADIUS;
    
    for (const [id, orb] of this.orbs) {
      if (distance(headX, headY, orb.x, orb.y) < collectRadius) {
        // Collect orb
        snake.grow(orb.value);
        snake.addScore(orb.value * 10);
        snake.orbsCollected++;
        
        // Create particle effect
        this.createOrbCollectParticles(orb);
        
        // Remove orb
        this.orbs.delete(id);
      }
    }
  }

  private checkWorldBoundary(snake: Snake): void {
    const padding = 20;
    const head = snake.head;
    
    if (head.x < padding || head.x > GAME_CONFIG.WORLD_WIDTH - padding ||
        head.y < padding || head.y > GAME_CONFIG.WORLD_HEIGHT - padding) {
      snake.die();
      this.createDeathParticles(snake);
    }
  }

  private checkSnakeCollisions(): void {
    if (!this.player || !this.player.isAlive) return;
    
    // Check player vs bots
    for (const bot of this.bots) {
      if (!bot.isAlive) continue;
      
      // Player head hits bot body
      if (bot.checkBodyCollision(this.player.head.x, this.player.head.y, GAME_CONFIG.HEAD_COLLISION_RADIUS)) {
        this.player.die();
        this.createDeathParticles(this.player);
        bot.kills++;
        
        // Drop player's orbs
        for (const orb of this.player.getDeathOrbs()) {
          this.orbs.set(orb.id, orb);
        }
        return;
      }
      
      // Bot head hits player body
      if (this.player.length > 3 && 
          this.player.checkBodyCollision(bot.head.x, bot.head.y, GAME_CONFIG.HEAD_COLLISION_RADIUS)) {
        bot.die();
        this.createDeathParticles(bot);
        this.player.kills++;
        
        // Drop bot's orbs
        for (const orb of bot.getDeathOrbs()) {
          this.orbs.set(orb.id, orb);
        }
        continue;
      }
      
      // Head-on collision (smaller snake dies)
      if (this.player.checkHeadCollision(bot.head.x, bot.head.y, GAME_CONFIG.HEAD_COLLISION_RADIUS)) {
        if (this.player.length < bot.length) {
          this.player.die();
          this.createDeathParticles(this.player);
          bot.kills++;
          
          for (const orb of this.player.getDeathOrbs()) {
            this.orbs.set(orb.id, orb);
          }
          return;
        } else if (this.player.length > bot.length) {
          bot.die();
          this.createDeathParticles(bot);
          this.player.kills++;
          
          for (const orb of bot.getDeathOrbs()) {
            this.orbs.set(orb.id, orb);
          }
        }
      }
    }
    
    // Check bot vs bot collisions
    for (let i = 0; i < this.bots.length; i++) {
      const bot1 = this.bots[i];
      if (!bot1.isAlive) continue;
      
      for (let j = i + 1; j < this.bots.length; j++) {
        const bot2 = this.bots[j];
        if (!bot2.isAlive) continue;
        
        // Check if bot1 hits bot2's body
        if (bot2.checkBodyCollision(bot1.head.x, bot1.head.y, GAME_CONFIG.HEAD_COLLISION_RADIUS)) {
          bot1.die();
          this.createDeathParticles(bot1);
          bot2.kills++;
          
          for (const orb of bot1.getDeathOrbs()) {
            this.orbs.set(orb.id, orb);
          }
          continue;
        }
        
        // Check if bot2 hits bot1's body
        if (bot1.checkBodyCollision(bot2.head.x, bot2.head.y, GAME_CONFIG.HEAD_COLLISION_RADIUS)) {
          bot2.die();
          this.createDeathParticles(bot2);
          bot1.kills++;
          
          for (const orb of bot2.getDeathOrbs()) {
            this.orbs.set(orb.id, orb);
          }
        }
      }
    }
  }

  // ============================================
  // Visual Effects
  // ============================================

  private createOrbCollectParticles(orb: Orb): void {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push({
        x: orb.x,
        y: orb.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 3,
        color: orb.color,
        life: 0.5,
        maxLife: 0.5
      });
    }
  }

  private createDeathParticles(snake: Snake): void {
    for (const segment of snake.segments) {
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        this.particles.push({
          x: segment.x,
          y: segment.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: GAME_CONFIG.SEGMENT_RADIUS * 0.8,
          color: snake.color,
          life: 1,
          maxLife: 1
        });
      }
    }
  }

  private updateParticles(): void {
    const decay = this.deltaTime / 1000;
    
    this.particles = this.particles.filter(p => {
      p.life -= decay;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.radius *= 0.97;
      return p.life > 0 && p.radius > 0.5;
    });
  }

  private updateOrbSpawning(): void {
    this.orbSpawnTimer += this.deltaTime;
    
    if (this.orbSpawnTimer >= GAME_CONFIG.ORB_RESPAWN_RATE && 
        this.orbs.size < GAME_CONFIG.MAX_ORBS) {
      this.orbSpawnTimer = 0;
      const orb = generateOrb();
      this.orbs.set(orb.id, orb);
    }
  }

  // ============================================
  // Camera
  // ============================================

  private updateCamera(): void {
    if (!this.player) return;
    
    // Follow player smoothly
    this.camera.x += (this.player.head.x - this.camera.x) * 0.1;
    this.camera.y += (this.player.head.y - this.camera.y) * 0.1;
    
    // Adjust zoom based on length
    this.targetZoom = Math.max(
      GAME_CONFIG.ZOOM_MIN,
      Math.min(GAME_CONFIG.ZOOM_MAX, 1 - (this.player.length - 10) * 0.005)
    );
    this.zoom += (this.targetZoom - this.zoom) * GAME_CONFIG.ZOOM_SPEED;
  }

  // ============================================
  // Stats & Leaderboard
  // ============================================

  getStats(): GameStats {
    return {
      score: this.player?.score ?? 0,
      length: this.player?.length ?? 0,
      kills: this.player?.kills ?? 0,
      timeAlive: Math.floor(this.gameTime / 1000),
      orbsCollected: this.player?.orbsCollected ?? 0
    };
  }

  private updateLeaderboard(): void {
    const allSnakes: Array<{ name: string; length: number; score: number }> = [];
    
    if (this.player) {
      allSnakes.push({
        name: this.player.name,
        length: this.player.length,
        score: this.player.score
      });
    }
    
    for (const bot of this.bots) {
      allSnakes.push({
        name: bot.name,
        length: bot.length,
        score: bot.score
      });
    }
    
    this.leaderboard = allSnakes.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  private loadHighScore(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('slither_high_score');
      this.highScore = saved ? parseInt(saved, 10) : 0;
    }
  }

  private saveHighScore(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('slither_high_score', this.highScore.toString());
    }
  }

  // ============================================
  // Rendering Helpers
  // ============================================

  worldToScreen(worldX: number, worldY: number, canvasWidth: number, canvasHeight: number): { x: number; y: number } {
    return {
      x: (worldX - this.camera.x) * this.zoom + canvasWidth / 2,
      y: (worldY - this.camera.y) * this.zoom + canvasHeight / 2
    };
  }

  screenToWorld(screenX: number, screenY: number, canvasWidth: number, canvasHeight: number): { x: number; y: number } {
    return {
      x: (screenX - canvasWidth / 2) / this.zoom + this.camera.x,
      y: (screenY - canvasHeight / 2) / this.zoom + this.camera.y
    };
  }
}
