'use client';

// ============================================
// SLITHER.IO GAME - Virtual Joystick
// ============================================

import React, { useRef, useEffect, useState } from 'react';
import { Vector2D } from '@/game/types';

interface VirtualJoystickProps {
  onDirectionChange: (direction: Vector2D) => void;
  onBoostChange: (boosting: boolean) => void;
  size?: number;
}

export function VirtualJoystick({ 
  onDirectionChange, 
  onBoostChange,
  size = 150 
}: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });

  // Touch/mouse handlers
  useEffect(() => {
    const handleStart = (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      startPos.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      
      isDragging.current = true;
      handleMove(clientX, clientY);
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging.current) return;

      const dx = clientX - startPos.current.x;
      const dy = clientY - startPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = size / 2 - 25;

      let normalizedX = dx;
      let normalizedY = dy;
      
      if (dist > maxDistance) {
        normalizedX = (dx / dist) * maxDistance;
        normalizedY = (dy / dist) * maxDistance;
      }

      setKnobOffset({ x: normalizedX, y: normalizedY });
      
      if (dist > 10) {
        onDirectionChange({ x: dx / (dist || 1), y: dy / (dist || 1) });
      }

      onBoostChange(dist > maxDistance * 0.9);
    };

    const handleEnd = () => {
      isDragging.current = false;
      setKnobOffset({ x: 0, y: 0 });
      onBoostChange(false);
    };

    // Mouse events
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        handleMove(e.clientX, e.clientY);
      }
    };

    const onMouseUp = () => {
      handleEnd();
    };

    // Touch events
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleEnd();
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [size, onDirectionChange, onBoostChange]);

  // Double tap for boost
  const lastTap = useRef(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onBoostChange(true);
      setTimeout(() => onBoostChange(false), 500);
    }
    lastTap.current = now;
  };

  return (
    <div className="fixed bottom-8 left-8 z-50">
      {/* Joystick base */}
      <div
        ref={containerRef}
        className="relative rounded-full bg-black/30 backdrop-blur-sm border-2 border-white/20"
        style={{ width: size, height: size }}
        onClick={handleDoubleTap}
      >
        {/* Inner circle */}
        <div className="absolute inset-4 rounded-full border border-white/10" />
        
        {/* Direction indicators */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="absolute top-3 w-0.5 h-4 bg-white rounded-full" />
          <div className="absolute bottom-3 w-0.5 h-4 bg-white rounded-full" />
          <div className="absolute left-3 w-4 h-0.5 bg-white rounded-full" />
          <div className="absolute right-3 w-4 h-0.5 bg-white rounded-full" />
        </div>
        
        {/* Knob */}
        <div
          ref={knobRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-white/80 to-white/40 shadow-lg border-2 border-white/50"
          style={{ 
            transform: `translate(calc(-50% + ${knobOffset.x}px), calc(-50% + ${knobOffset.y}px))`
          }}
        >
          <div className="absolute inset-2 rounded-full bg-white/20" />
        </div>
      </div>
      
      {/* Boost button */}
      <div
        className="mt-4 mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-red-500/60 to-orange-500/60 border-2 border-white/30 flex items-center justify-center backdrop-blur-sm cursor-pointer active:scale-95"
        onMouseDown={() => onBoostChange(true)}
        onMouseUp={() => onBoostChange(false)}
        onMouseLeave={() => onBoostChange(false)}
        onTouchStart={(e) => { e.preventDefault(); onBoostChange(true); }}
        onTouchEnd={(e) => { e.preventDefault(); onBoostChange(false); }}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="white" 
          strokeWidth="2"
          className="opacity-80"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </div>
    </div>
  );
}
