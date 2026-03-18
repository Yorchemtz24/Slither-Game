'use client';

// ============================================
// SLITHER.IO GAME - Main Game Component
// ============================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Game } from '@/game/Game';
import { GameCanvas } from './GameCanvas';
import { VirtualJoystick } from './VirtualJoystick';
import { 
  MainMenu, 
  GameHUD, 
  PauseMenu, 
  GameOver,
  MiniMap 
} from './GameUI';
import { GameState, GameStats, Vector2D, GAME_CONFIG } from '@/game/types';

// Get initial high score
function getInitialHighScore(): number {
  if (typeof window === 'undefined') return 0;
  const saved = localStorage.getItem('slither_high_score');
  return saved ? parseInt(saved, 10) : 0;
}

export function SlitherGame() {
  // State for rendering
  const [gameState, setGameState] = useState<GameState>('menu');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    length: 0,
    kills: 0,
    timeAlive: 0,
    orbsCollected: 0
  });
  const [highScore] = useState(getInitialHighScore);
  const [leaderboard, setLeaderboard] = useState<Array<{ name: string; length: number; score: number }>>([]);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [botPositions, setBotPositions] = useState<Array<{ x: number; y: number; length: number }>>([]);
  const [playerAlive, setPlayerAlive] = useState(false);

  // Create game instance once using useMemo
  const game = useMemo(() => {
    const gameInstance = new Game();
    
    gameInstance.onStateChange = (state) => {
      setGameState(state);
      
      if (state === 'gameOver') {
        const playerScore = gameInstance.player?.score ?? 0;
        const saved = localStorage.getItem('slither_high_score');
        const currentHigh = saved ? parseInt(saved, 10) : 0;
        setIsNewHighScore(playerScore > currentHigh);
      }
    };
    
    gameInstance.onStatsUpdate = (newStats) => {
      setStats(newStats);
      
      if (gameInstance.player) {
        setPlayerPos({ x: gameInstance.player.head.x, y: gameInstance.player.head.y });
        setPlayerAlive(gameInstance.player.isAlive);
      }
      
      setBotPositions(
        gameInstance.bots
          .filter(b => b.isAlive)
          .map(b => ({ x: b.head.x, y: b.head.y, length: b.length }))
      );
      
      const allSnakes = [
        ...(gameInstance.player && gameInstance.player.isAlive ? [{
          name: gameInstance.player.name,
          length: gameInstance.player.length,
          score: gameInstance.player.score
        }] : []),
        ...gameInstance.bots
          .filter(b => b.isAlive)
          .map(b => ({ name: b.name, length: b.length, score: b.score }))
      ].sort((a, b) => b.score - a.score).slice(0, 10);
      
      setLeaderboard(allSnakes);
    };
    
    gameInstance.highScore = highScore;
    
    return gameInstance;
  }, [highScore]);

  // Game actions
  const handleStart = useCallback((playerName: string) => {
    game?.start(playerName);
  }, [game]);

  const handlePause = useCallback(() => {
    if (gameState === 'playing') {
      game?.pause();
    } else if (gameState === 'paused') {
      game?.resume();
    }
  }, [game, gameState]);

  const handleResume = useCallback(() => {
    game?.resume();
  }, [game]);

  const handleRestart = useCallback(() => {
    if (game?.player) {
      const name = game.player.name;
      game.start(name);
    }
  }, [game]);

  const handleMenu = useCallback(() => {
    setGameState('menu');
  }, []);

  // Direction change handler
  const handleDirectionChange = useCallback((direction: Vector2D) => {
    if (game && gameState === 'playing') {
      game.setInput(direction, game.input.boosting);
    }
  }, [game, gameState]);

  // Boost change handler
  const handleBoostChange = useCallback((boosting: boolean) => {
    if (game && gameState === 'playing') {
      game.setInput(game.input.direction, boosting);
    }
  }, [game, gameState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          handleDirectionChange({ x: 0, y: -1 });
          break;
        case 'arrowdown':
        case 's':
          handleDirectionChange({ x: 0, y: 1 });
          break;
        case 'arrowleft':
        case 'a':
          handleDirectionChange({ x: -1, y: 0 });
          break;
        case 'arrowright':
        case 'd':
          handleDirectionChange({ x: 1, y: 0 });
          break;
        case ' ':
        case 'shift':
          handleBoostChange(true);
          break;
        case 'escape':
        case 'p':
          game?.pause();
          break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'shift':
          handleBoostChange(false);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, handleDirectionChange, handleBoostChange, game]);

  // Mouse controls
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gameState !== 'playing') return;
      
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 20) {
        handleDirectionChange({ x: dx / length, y: dy / length });
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [gameState, handleDirectionChange]);

  if (!game) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-slate-900">
      {/* Game Canvas */}
      {gameState === 'playing' && (
        <GameCanvas game={game} isPlaying={true} />
      )}

      {/* Main Menu */}
      {gameState === 'menu' && (
        <MainMenu 
          highScore={highScore} 
          onStart={handleStart} 
        />
      )}

      {/* Game HUD */}
      {gameState === 'playing' && playerAlive && (
        <>
          <GameHUD
            stats={stats}
            leaderboard={leaderboard}
            isPaused={false}
            onPause={handlePause}
          />
          
          <VirtualJoystick
            onDirectionChange={handleDirectionChange}
            onBoostChange={handleBoostChange}
          />
          
          <MiniMap
            playerX={playerPos.x}
            playerY={playerPos.y}
            worldWidth={GAME_CONFIG.WORLD_WIDTH}
            worldHeight={GAME_CONFIG.WORLD_HEIGHT}
            bots={botPositions}
          />
        </>
      )}

      {/* Pause Menu */}
      {gameState === 'paused' && (
        <>
          <GameCanvas game={game} isPlaying={false} />
          <GameHUD
            stats={stats}
            leaderboard={leaderboard}
            isPaused={true}
            onPause={handlePause}
          />
          <PauseMenu 
            onResume={handleResume} 
            onQuit={handleMenu} 
          />
        </>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameOver' && (
        <>
          <GameCanvas game={game} isPlaying={false} />
          <GameOver
            stats={stats}
            highScore={highScore}
            isNewHighScore={isNewHighScore}
            onRestart={handleRestart}
            onMenu={handleMenu}
          />
        </>
      )}
    </div>
  );
}
