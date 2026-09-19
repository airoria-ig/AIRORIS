import { useState, useRef, useEffect, useCallback } from 'react';
import { Crosshair, Zap, Bomb } from 'lucide-react';

interface TouchControlsProps {
  bombsAvailable: number;
  onMove: (vector: { x: number; y: number } | null) => void;
  onFireChange: (isFiring: boolean) => void;
  onBoostChange: (isBoosting: boolean) => void;
  onBomb: () => void;
}

export const TouchControls = ({
  bombsAvailable,
  onMove,
  onFireChange,
  onBoostChange,
  onBomb,
}: TouchControlsProps) => {
  // Joystick state
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const activeTouchId = useRef<number | null>(null);

  // Buttons active state
  const [isFiring, setIsFiring] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  };

  // Joystick touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (activeTouchId.current !== null) return;

    const touch = e.changedTouches[0];
    activeTouchId.current = touch.identifier;
    setIsDragging(true);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (activeTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId.current) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (activeTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId.current) {
        activeTouchId.current = null;
        setIsDragging(false);
        setKnobPos({ x: 0, y: 0 });
        onMove(null);
        break;
      }
    }
  }, [onMove]);

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = rect.width / 2 - 15;
    const rawDx = clientX - centerX;
    const rawDy = clientY - centerY;
    const dist = Math.hypot(rawDx, rawDy);

    let normX = 0;
    let normY = 0;

    if (dist > 0) {
      const clampedDist = Math.min(dist, maxRadius);
      normX = (rawDx / dist) * (clampedDist / maxRadius);
      normY = (rawDy / dist) * (clampedDist / maxRadius);

      setKnobPos({
        x: (rawDx / dist) * clampedDist,
        y: (rawDy / dist) * clampedDist,
      });
    } else {
      setKnobPos({ x: 0, y: 0 });
    }

    onMove({ x: normX, y: normY });
  };

  useEffect(() => {
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  // Fire action
  const handleFireStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsFiring(true);
    onFireChange(true);
    triggerHaptic(15);
  };

  const handleFireEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsFiring(false);
    onFireChange(false);
  };

  // Boost action
  const handleBoostStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsBoosting(true);
    onBoostChange(true);
    triggerHaptic(25);
  };

  const handleBoostEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsBoosting(false);
    onBoostChange(false);
  };

  // Bomb action
  const handleBombClick = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (bombsAvailable > 0) {
      triggerHaptic([30, 40, 50]);
      onBomb();
    }
  };

  return (
    <div
      id="android-touch-controls-layer"
      className="pointer-events-none absolute inset-0 z-30 flex justify-between items-end p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] select-none touch-none"
    >
      {/* Left Thumb: Virtual Analog Flight Stick */}
      <div className="pointer-events-auto flex flex-col items-center gap-1.5 mb-14 sm:mb-16">
        <div
          id="virtual-joystick-base"
          ref={joystickBaseRef}
          onTouchStart={handleTouchStart}
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 bg-slate-950/70 backdrop-blur-md flex items-center justify-center transition-colors shadow-2xl ${
            isDragging
              ? 'border-sky-400 bg-sky-950/40 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
              : 'border-slate-700/80'
          }`}
        >
          {/* Subtle directional markings */}
          <div className="absolute top-1.5 w-1 h-2 bg-slate-600 rounded-full" />
          <div className="absolute bottom-1.5 w-1 h-2 bg-slate-600 rounded-full" />
          <div className="absolute left-1.5 h-1 w-2 bg-slate-600 rounded-full" />
          <div className="absolute right-1.5 h-1 w-2 bg-slate-600 rounded-full" />
          <div className="w-8 h-8 rounded-full border border-dashed border-slate-700/60" />

          {/* Floating Knob Puck */}
          <div
            id="virtual-joystick-knob"
            className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 border border-white/40 shadow-lg flex items-center justify-center pointer-events-none transition-transform duration-75"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          >
            <div className="w-4 h-4 rounded-full bg-white/60 shadow-[0_0_8px_#ffffff]" />
          </div>
        </div>
        <span className="text-[9px] font-mono tracking-widest text-slate-400/80 uppercase">
          NAV THUMBSTICK
        </span>
      </div>

      {/* Right Thumb: Tactical Combat Touch Buttons */}
      <div className="pointer-events-auto flex items-end gap-3 mb-14 sm:mb-16">
        {/* Smart EMP Bomb Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            id="touch-btn-bomb"
            type="button"
            disabled={bombsAvailable <= 0}
            onTouchStart={handleBombClick}
            onClick={handleBombClick}
            className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 shadow-xl ${
              bombsAvailable > 0
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)] active:bg-rose-600'
                : 'bg-slate-950/50 border-slate-800 text-slate-600 opacity-50'
            }`}
          >
            <Bomb className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[9px] font-black uppercase mt-0.5">BOMB</span>
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full border border-slate-900 shadow">
              {bombsAvailable}
            </span>
          </button>
          <span className="text-[8px] font-mono text-slate-400 uppercase">EMP</span>
        </div>

        {/* Afterburner Boost Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            id="touch-btn-boost"
            type="button"
            onTouchStart={handleBoostStart}
            onTouchEnd={handleBoostEnd}
            onMouseDown={handleBoostStart}
            onMouseUp={handleBoostEnd}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 shadow-xl ${
              isBoosting
                ? 'bg-amber-500 border-yellow-300 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-105'
                : 'bg-amber-950/80 border-amber-500/70 text-amber-300 hover:border-amber-400'
            }`}
          >
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            <span className="text-[9px] font-black uppercase mt-0.5">BOOST</span>
          </button>
          <span className="text-[8px] font-mono text-slate-400 uppercase">AFTERBURN</span>
        </div>

        {/* Primary Laser Cannon FIRE Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            id="touch-btn-fire"
            type="button"
            onTouchStart={handleFireStart}
            onTouchEnd={handleFireEnd}
            onMouseDown={handleFireStart}
            onMouseUp={handleFireEnd}
            className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full border-2 flex flex-col items-center justify-center transition-all active:scale-95 shadow-2xl ${
              isFiring
                ? 'bg-sky-400 border-white text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.8)] scale-105'
                : 'bg-sky-950/90 border-sky-400/90 text-sky-300 hover:border-sky-300'
            }`}
          >
            <Crosshair className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="text-[10px] font-black tracking-wider uppercase">FIRE</span>
          </button>
          <span className="text-[8px] font-mono text-sky-400 font-bold uppercase">PRIMARY</span>
        </div>
      </div>
    </div>
  );
};
