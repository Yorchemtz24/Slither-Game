'use client';

// ============================================
// SLITHER.IO GAME - Canvas Renderer
// ============================================

import React, { useRef, useEffect } from 'react';
import { Game } from '@/game/Game';
import { GAME_CONFIG } from '@/game/types';

interface GameCanvasProps {
  game: Game;
  isPlaying: boolean;
}

// Color utilities
function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

// Drawing functions (outside component to avoid hook issues)
function drawGrid(
  ctx: CanvasRenderingContext2D,
  left: number, right: number, top: number, bottom: number
) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;

  const gridSize = GAME_CONFIG.GRID_SIZE;
  const startX = Math.floor(left / gridSize) * gridSize;
  const startY = Math.floor(top / gridSize) * gridSize;

  for (let x = startX; x <= right; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }

  for (let y = startY; y <= bottom; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }
}

function drawBoundary(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#ff4757';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#ff4757';
  ctx.shadowBlur = 20;
  
  ctx.strokeRect(
    GAME_CONFIG.GRID_SIZE,
    GAME_CONFIG.GRID_SIZE,
    GAME_CONFIG.WORLD_WIDTH - GAME_CONFIG.GRID_SIZE * 2,
    GAME_CONFIG.WORLD_HEIGHT - GAME_CONFIG.GRID_SIZE * 2
  );
  
  ctx.shadowBlur = 0;
}

function drawOrb(ctx: CanvasRenderingContext2D, orb: { 
  x: number; y: number; radius: number; color: string; pulsePhase: number 
}) {
  const time = Date.now() / 1000;
  const pulse = 1 + Math.sin(time * 3 + orb.pulsePhase) * 0.15;
  const radius = orb.radius * pulse;

  ctx.shadowColor = orb.color;
  ctx.shadowBlur = 15;
  
  ctx.fillStyle = orb.color;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, radius * 1.5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, radius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(orb.x - radius * 0.3, orb.y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowBlur = 0;
}

function drawNameTag(
  ctx: CanvasRenderingContext2D, 
  x: number, y: number, name: string, isPlayer: boolean
) {
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const metrics = ctx.measureText(name);
  const padding = 6;
  const width = metrics.width + padding * 2;
  const height = 18;
  
  ctx.fillStyle = isPlayer ? 'rgba(0, 255, 136, 0.8)' : 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - height / 2, width, height, 4);
  ctx.fill();
  
  if (isPlayer) {
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  ctx.fillStyle = '#ffffff';
  ctx.fillText(name, x, y);
}

function drawSnake(
  ctx: CanvasRenderingContext2D, 
  snake: { 
    segments: { x: number; y: number }[]; 
    color: string; 
    name: string;
    isBoosting?: boolean;
    eyeAngle?: number;
  },
  isPlayer: boolean
) {
  const segments = snake.segments;
  if (segments.length === 0) return;

  // Draw trail if boosting
  if (snake.isBoosting) {
    ctx.globalAlpha = 0.3;
    for (let i = segments.length - 1; i >= Math.max(0, segments.length - 10); i--) {
      const seg = segments[i];
      ctx.fillStyle = snake.color;
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, GAME_CONFIG.SEGMENT_RADIUS * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Draw body segments
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    const ratio = i / segments.length;
    const radius = GAME_CONFIG.SEGMENT_RADIUS * (0.7 + ratio * 0.3);
    
    ctx.shadowColor = snake.color;
    ctx.shadowBlur = isPlayer ? 10 : 5;
    
    const gradient = ctx.createRadialGradient(seg.x, seg.y, 0, seg.x, seg.y, radius);
    gradient.addColorStop(0, lightenColor(snake.color, 30));
    gradient.addColorStop(1, snake.color);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.shadowBlur = 0;

  // Draw head
  const head = segments[0];
  const headRadius = GAME_CONFIG.SEGMENT_RADIUS * 1.3;
  
  ctx.shadowColor = snake.color;
  ctx.shadowBlur = 15;
  
  const headGradient = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, headRadius);
  headGradient.addColorStop(0, lightenColor(snake.color, 50));
  headGradient.addColorStop(0.7, snake.color);
  headGradient.addColorStop(1, darkenColor(snake.color, 20));
  
  ctx.fillStyle = headGradient;
  ctx.beginPath();
  ctx.arc(head.x, head.y, headRadius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowBlur = 0;

  // Draw eyes
  const eyeAngle = snake.eyeAngle ?? Math.atan2(
    head.y - (segments[1]?.y ?? head.y),
    head.x - (segments[1]?.x ?? head.x)
  );
  const eyeOffset = headRadius * 0.5;
  const eyeRadius = headRadius * 0.35;
  
  const leftEyeX = head.x + Math.cos(eyeAngle - 0.5) * eyeOffset;
  const leftEyeY = head.y + Math.sin(eyeAngle - 0.5) * eyeOffset;
  const rightEyeX = head.x + Math.cos(eyeAngle + 0.5) * eyeOffset;
  const rightEyeY = head.y + Math.sin(eyeAngle + 0.5) * eyeOffset;
  
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
  ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#000000';
  const pupilOffset = eyeRadius * 0.3;
  ctx.beginPath();
  ctx.arc(
    leftEyeX + Math.cos(eyeAngle) * pupilOffset,
    leftEyeY + Math.sin(eyeAngle) * pupilOffset,
    eyeRadius * 0.5, 0, Math.PI * 2
  );
  ctx.arc(
    rightEyeX + Math.cos(eyeAngle) * pupilOffset,
    rightEyeY + Math.sin(eyeAngle) * pupilOffset,
    eyeRadius * 0.5, 0, Math.PI * 2
  );
  ctx.fill();

  drawNameTag(ctx, head.x, head.y - headRadius - 20, snake.name, isPlayer);
}

function renderGameScene(ctx: CanvasRenderingContext2D, width: number, height: number, game: Game) {
  const zoom = game.zoom;
  const camera = game.camera;

  const visibleLeft = camera.x - width / 2 / zoom;
  const visibleRight = camera.x + width / 2 / zoom;
  const visibleTop = camera.y - height / 2 / zoom;
  const visibleBottom = camera.y + height / 2 / zoom;

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-camera.x, -camera.y);

  drawGrid(ctx, visibleLeft, visibleRight, visibleTop, visibleBottom);
  drawBoundary(ctx);

  game.orbs.forEach(orb => {
    if (orb.x >= visibleLeft - 50 && orb.x <= visibleRight + 50 &&
        orb.y >= visibleTop - 50 && orb.y <= visibleBottom + 50) {
      drawOrb(ctx, orb);
    }
  });

  game.particles.forEach(particle => {
    ctx.globalAlpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  game.bots.forEach(bot => {
    if (bot.isAlive) {
      drawSnake(ctx, bot, bot === game.player);
    }
  });

  if (game.player && game.player.isAlive) {
    drawSnake(ctx, game.player, true);
  }

  ctx.restore();
}

export function GameCanvas({ game, isPlaying }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resize();
    window.addEventListener('resize', resize);

    const render = (timestamp: number) => {
      if (isPlaying) {
        game.update(timestamp);
      }

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      renderGameScene(ctx, canvas.width, canvas.height, game);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [game, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 touch-none"
      style={{ touchAction: 'none' }}
    />
  );
}
