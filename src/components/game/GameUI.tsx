'use client';

// ============================================
// SLITHER.IO GAME - Game UI Components
// ============================================

import React, { useState, useEffect } from 'react';
import { GameStats } from '@/game/types';
import { formatScore, formatTime } from '@/game/utils';

// ============================================
// Main Menu Screen
// ============================================

interface MainMenuProps {
  highScore: number;
  onStart: (playerName: string) => void;
}

export function MainMenu({ highScore, onStart }: MainMenuProps) {
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = () => {
    const name = playerName.trim() || 'Player';
    setIsLoading(true);
    setTimeout(() => {
      onStart(name);
    }, 100);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-purple-900/50 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,80,255,0.15),transparent_50%)]" />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 5],
              opacity: 0.3 + Math.random() * 0.4,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="relative mb-8">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-400 to-blue-500 drop-shadow-2xl tracking-tight">
          SLITHER
        </h1>
        <div className="absolute -inset-4 bg-gradient-to-r from-green-400/20 via-cyan-400/20 to-blue-500/20 blur-3xl -z-10" />
        <p className="text-center text-white/60 text-lg mt-2">
          ¡Crece. Compite. Domina!
        </p>
      </div>

      {/* High Score */}
      {highScore > 0 && (
        <div className="mb-6 px-6 py-3 rounded-full bg-yellow-500/20 border border-yellow-500/50">
          <p className="text-yellow-400 font-bold flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            Récord: {formatScore(highScore)}
          </p>
        </div>
      )}

      {/* Name Input */}
      <div className="w-full max-w-xs px-4 mb-4">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Tu nombre..."
          maxLength={15}
          className="w-full px-6 py-4 text-center text-xl font-bold rounded-2xl bg-white/10 border-2 border-white/20 text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
        />
      </div>

      {/* Play Button */}
      <button
        onClick={handleStart}
        disabled={isLoading}
        className="group relative px-12 py-4 text-2xl font-bold text-white rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-lg shadow-green-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        <span className="relative z-10 flex items-center gap-3">
          {isLoading ? (
            <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
          JUGAR
        </span>
      </button>

      {/* Instructions */}
      <div className="absolute bottom-8 left-0 right-0 px-4">
        <div className="max-w-md mx-auto p-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
          <p className="text-white/60 text-center text-sm">
            <span className="text-white/80">📱 Móvil:</span> Usa el joystick virtual para moverte<br/>
            <span className="text-white/80">🖥️ PC:</span> Mueve el ratón o usa WASD/Flechas
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Game HUD (Heads-Up Display)
// ============================================

interface GameHUDProps {
  stats: GameStats;
  leaderboard: Array<{ name: string; length: number; score: number }>;
  isPaused: boolean;
  onPause: () => void;
}

export function GameHUD({ stats, leaderboard, isPaused, onPause }: GameHUDProps) {
  return (
    <>
      {/* Top Stats Bar */}
      <div className="absolute top-0 left-0 right-0 z-40 p-4">
        <div className="flex items-start justify-between max-w-7xl mx-auto">
          {/* Left: Score & Length */}
          <div className="flex flex-col gap-2">
            {/* Score */}
            <div className="px-4 py-2 rounded-xl bg-black/40 backdrop-blur border border-white/10">
              <p className="text-xs text-white/60 uppercase tracking-wider">Puntuación</p>
              <p className="text-2xl font-bold text-white">{formatScore(stats.score)}</p>
            </div>
            
            {/* Length */}
            <div className="px-4 py-2 rounded-xl bg-black/40 backdrop-blur border border-white/10">
              <p className="text-xs text-white/60 uppercase tracking-wider">Longitud</p>
              <p className="text-xl font-bold text-cyan-400">{stats.length}</p>
            </div>
          </div>

          {/* Right: Time & Kills */}
          <div className="flex flex-col gap-2 items-end">
            {/* Time */}
            <div className="px-4 py-2 rounded-xl bg-black/40 backdrop-blur border border-white/10">
              <p className="text-xs text-white/60 uppercase tracking-wider">Tiempo</p>
              <p className="text-xl font-bold text-white">{formatTime(stats.timeAlive)}</p>
            </div>
            
            {/* Kills */}
            <div className="px-4 py-2 rounded-xl bg-black/40 backdrop-blur border border-white/10 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <p className="text-lg font-bold text-white">{stats.kills}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Leaderboard */}
      <div className="absolute top-4 right-4 z-40 hidden sm:block">
        <div className="w-48 rounded-xl bg-black/40 backdrop-blur border border-white/10 overflow-hidden">
          <div className="px-3 py-2 bg-white/5 border-b border-white/10">
            <p className="text-xs text-white/60 uppercase tracking-wider font-bold">
              🏆 Clasificación
            </p>
          </div>
          <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
            {leaderboard.slice(0, 5).map((entry, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-2 px-2 py-1 rounded-lg text-sm ${
                  entry.name === 'You' || i === 0 ? 'bg-cyan-500/20' : ''
                }`}
              >
                <span className={`font-bold ${
                  i === 0 ? 'text-yellow-400' : 
                  i === 1 ? 'text-gray-300' : 
                  i === 2 ? 'text-amber-600' : 'text-white/60'
                }`}>
                  {i + 1}.
                </span>
                <span className="text-white/80 truncate flex-1">{entry.name}</span>
                <span className="text-white/40 text-xs">{entry.length}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pause Button */}
      <button
        onClick={onPause}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-40 p-3 rounded-xl bg-black/40 backdrop-blur border border-white/10 hover:bg-white/10 transition-colors"
      >
        {isPaused ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        )}
      </button>

      {/* Boost indicator */}
      <div className="absolute bottom-24 right-8 z-40 sm:hidden">
        <div className="px-3 py-2 rounded-xl bg-black/40 backdrop-blur border border-white/10">
          <p className="text-xs text-white/60 text-center">
            🔥 Mantén para acelerar
          </p>
        </div>
      </div>
    </>
  );
}

// ============================================
// Pause Menu
// ============================================

interface PauseMenuProps {
  onResume: () => void;
  onQuit: () => void;
}

export function PauseMenu({ onResume, onQuit }: PauseMenuProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="p-8 rounded-3xl bg-slate-900/90 border border-white/20 shadow-2xl text-center">
        <h2 className="text-3xl font-bold text-white mb-6">PAUSA</h2>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="px-8 py-3 text-lg font-bold text-white rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all hover:scale-105 active:scale-95"
          >
            Continuar
          </button>
          
          <button
            onClick={onQuit}
            className="px-8 py-3 text-lg font-bold text-white/80 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Game Over Screen
// ============================================

interface GameOverProps {
  stats: GameStats;
  highScore: number;
  isNewHighScore: boolean;
  onRestart: () => void;
  onMenu: () => void;
}

export function GameOver({ stats, highScore, isNewHighScore, onRestart, onMenu }: GameOverProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-800 border border-white/20 shadow-2xl text-center max-w-sm w-full mx-4">
        {/* New High Score Badge */}
        {isNewHighScore && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-bounce">
              <p className="text-sm font-bold text-white">¡NUEVO RÉCORD!</p>
            </div>
          </div>
        )}

        {/* Title */}
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500 mb-6 mt-4">
          GAME OVER
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-white/5">
            <p className="text-xs text-white/60 uppercase">Puntuación</p>
            <p className="text-2xl font-bold text-white">{formatScore(stats.score)}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5">
            <p className="text-xs text-white/60 uppercase">Longitud</p>
            <p className="text-2xl font-bold text-cyan-400">{stats.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5">
            <p className="text-xs text-white/60 uppercase">Eliminaciones</p>
            <p className="text-2xl font-bold text-red-400">{stats.kills}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5">
            <p className="text-xs text-white/60 uppercase">Tiempo</p>
            <p className="text-2xl font-bold text-white">{formatTime(stats.timeAlive)}</p>
          </div>
        </div>

        {/* High Score */}
        <div className="mb-6 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-sm text-yellow-400">
            🏆 Mejor puntuación: {formatScore(highScore)}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onRestart}
            className="px-8 py-3 text-lg font-bold text-white rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all hover:scale-105 active:scale-95"
          >
            Jugar de Nuevo
          </button>
          
          <button
            onClick={onMenu}
            className="px-8 py-3 text-lg font-bold text-white/80 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
          >
            Menú Principal
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Mini Map
// ============================================

interface MiniMapProps {
  playerX: number;
  playerY: number;
  worldWidth: number;
  worldHeight: number;
  bots: Array<{ x: number; y: number; length: number }>;
}

export function MiniMap({ playerX, playerY, worldWidth, worldHeight, bots }: MiniMapProps) {
  const mapSize = 120;
  const scale = mapSize / worldWidth;

  return (
    <div className="absolute bottom-4 right-4 z-40 hidden sm:block">
      <div 
        className="rounded-lg bg-black/50 backdrop-blur border border-white/20 overflow-hidden"
        style={{ width: mapSize, height: mapSize }}
      >
        {/* Grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}/>
        </div>
        
        {/* Bots */}
        {bots.map((bot, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-red-500"
            style={{
              left: bot.x * scale,
              top: bot.y * scale,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
        
        {/* Player */}
        <div
          className="absolute w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"
          style={{
            left: playerX * scale,
            top: playerY * scale,
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>
    </div>
  );
}
