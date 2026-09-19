import { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/gameEngine';
import { GameState, Player } from './types';
import { GameHud } from './components/GameHud';
import { GameOverModal } from './components/GameOverModal';
import { MusicUploadModal } from './components/MusicUploadModal';
import { ControlsGuide } from './components/ControlsGuide';
import { TouchControls } from './components/TouchControls';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import {
  Play,
  RotateCcw,
  Music,
  Info,
  Rocket,
  Shield,
  Zap,
  Trophy,
  MousePointer,
  Keyboard,
  Smartphone,
  Maximize2,
} from 'lucide-react';
import { soundEngine } from './audio/soundEngine';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [player, setPlayer] = useState<Player | null>(null);
  const [sectorProgress, setSectorProgress] = useState(0);
  const [distance, setDistance] = useState(0);
  const [maxDistance, setMaxDistance] = useState(6500);
  const [sectorName, setSectorName] = useState('Sector Alpha: Orion Nebula');
  const [bossAlertName, setBossAlertName] = useState<string | null>(null);

  const [gameOverStats, setGameOverStats] = useState<{
    score: number;
    highscore: number;
    enemiesKilled: number;
    asteroidsDestroyed: number;
    sectorReached: number;
  } | null>(null);

  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [controlMode, setControlMode] = useState<'keyboard' | 'mouse'>('keyboard');
  const [highScore, setHighScore] = useState(0);

  // Android & Touch detection
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(true);
  const [isPortrait, setIsPortrait] = useState(false);

  // Initialize Game Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect touch / Android capability
    const touchCheck =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    setIsTouchDevice(touchCheck);
    setShowTouchControls(touchCheck);

    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        setIsPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 768);
      }
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    // Read stored high score
    try {
      const stored = parseInt(localStorage.getItem('space_scroller_highscore') || '0', 10);
      setHighScore(stored);
    } catch {
      // ignore
    }

    const engine = new GameEngine(canvas, {
      onStateChange: (state) => setGameState(state),
      onPlayerUpdate: (p) => setPlayer(p),
      onSectorProgress: (progress, dist, maxDist, name) => {
        setSectorProgress(progress);
        setDistance(dist);
        setMaxDistance(maxDist);
        setSectorName(name);
      },
      onBossAlert: (name) => {
        setBossAlertName(name);
        setTimeout(() => setBossAlertName(null), 4000);
      },
      onGameOver: (stats) => {
        setGameOverStats(stats);
        if (stats.highscore > highScore) {
          setHighScore(stats.highscore);
        }
      },
      onSectorCleared: () => {
        // sector victory
      },
    });

    engineRef.current = engine;

    // Handle responsive resize
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        const w = clientWidth || 1280;
        const h = clientHeight || 720;
        engine.resize(w, h);
      }
    };

    updateSize();
    const observer = new ResizeObserver(() => updateSize());
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      engine.stop();
      observer.disconnect();
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);

  const handleStartGame = () => {
    soundEngine.ensureReady();
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  };

  const handlePauseGame = () => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  };

  const handleResumeGame = () => {
    if (engineRef.current) {
      engineRef.current.resumeGame();
    }
  };

  const handleTriggerBomb = () => {
    if (engineRef.current) {
      engineRef.current.triggerBomb();
    }
  };

  const toggleControlMode = () => {
    const nextMode = controlMode === 'keyboard' ? 'mouse' : 'keyboard';
    setControlMode(nextMode);
    if (engineRef.current) {
      engineRef.current.setControlMode(nextMode);
    }
  };

  return (
    <div
      id="space-game-root"
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none flex flex-col justify-center items-center touch-none overscroll-none"
    >
      {/* Primary Game Canvas */}
      <canvas
        id="game-canvas"
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair touch-none"
      />

      {/* Portrait Mode Hint for Mobile / Android */}
      {isPortrait && gameState === 'playing' && (
        <div
          id="portrait-orientation-warning"
          className="absolute top-16 z-50 px-4 py-2 bg-amber-950/90 border border-amber-500 text-amber-200 text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-md animate-pulse"
        >
          <Smartphone className="w-4 h-4 rotate-90" />
          <span>Rotate device to Landscape for optimal space cockpit view</span>
        </div>
      )}

      {/* In-Game Active Top and Bottom Gauges */}
      {(gameState === 'playing' || gameState === 'warping') && (
        <GameHud
          player={player}
          sectorProgress={sectorProgress}
          distance={distance}
          maxDistance={maxDistance}
          sectorName={sectorName}
          onPause={handlePauseGame}
          onBomb={handleTriggerBomb}
          onOpenUploadModal={() => setIsMusicModalOpen(true)}
        />
      )}

      {/* Mobile Android Touch Controls Layer (Thumbstick + Fire/Boost/Bomb) */}
      {(gameState === 'playing' || gameState === 'warping') && showTouchControls && (
        <TouchControls
          bombsAvailable={player?.bombs || 0}
          onMove={(vector) => engineRef.current?.setVirtualJoystick(vector)}
          onFireChange={(isFiring) => engineRef.current?.setTouchFiring(isFiring)}
          onBoostChange={(isBoosting) => engineRef.current?.setTouchBoosting(isBoosting)}
          onBomb={handleTriggerBomb}
        />
      )}

      {/* Hyperspace Warp Jump Banner */}
      {gameState === 'warping' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-sky-950/20 backdrop-blur-[2px] animate-pulse z-30">
          <div className="flex flex-col items-center gap-2 p-6 bg-slate-900/90 border border-sky-400 rounded-3xl shadow-[0_0_30px_rgba(56,189,248,0.4)]">
            <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase">
              SECTOR VICTORY ACHIEVED
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider">
              ENGAGING HYPERSPACE JUMP
            </h2>
            <span className="text-xs text-slate-300">
              Entering Next Deep Space Anomaly Sector...
            </span>
          </div>
        </div>
      )}

      {/* Main Menu Screen */}
      {gameState === 'menu' && (
        <div
          id="screen-main-menu"
          className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-lg bg-slate-900/95 border border-slate-700/80 rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-4 sm:gap-6 text-slate-200 my-auto">
            {/* Title & Branding */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-500/30 rounded-full text-sky-400 text-xs font-mono">
                <Rocket className="w-3.5 h-3.5" /> ANDROID-READY SPACE SHOOTER
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase drop-shadow-md">
                Space Side-Scroller
              </h1>
              <p className="text-xs text-slate-400 max-w-sm">
                Procedurally generated cosmic sectors, multi-layer parallax scrolling, top & bottom cockpit telemetry gauges, and custom music.
              </p>
            </div>

            {/* Highscore & Ship Quick Specs */}
            <div className="w-full grid grid-cols-3 gap-2 text-xs">
              <div className="flex flex-col items-center bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] text-slate-400 mt-1">BEST SCORE</span>
                <span className="font-mono font-bold text-white text-sm">{highScore.toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-center bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
                <Shield className="w-4 h-4 text-sky-400" />
                <span className="text-[10px] text-slate-400 mt-1">SHIELD MATRIX</span>
                <span className="font-mono font-bold text-sky-300 text-sm">Top Gauge</span>
              </div>
              <div className="flex flex-col items-center bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] text-slate-400 mt-1">AFTERBURNER</span>
                <span className="font-mono font-bold text-amber-300 text-sm">Bottom Gauge</span>
              </div>
            </div>

            {/* Android PWA Install & Fullscreen Bar */}
            <PWAInstallBanner />

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2.5">
              <button
                id="btn-start-mission"
                type="button"
                onClick={handleStartGame}
                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-sky-500 via-indigo-600 to-sky-500 hover:from-sky-400 hover:to-indigo-500 text-white font-black tracking-wide text-sm sm:text-base rounded-2xl shadow-xl hover:shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" /> LAUNCH MISSION
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-open-music-loader"
                  type="button"
                  onClick={() => setIsMusicModalOpen(true)}
                  className="py-2.5 px-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Music className="w-4 h-4 text-sky-400" /> Load Music
                </button>

                <button
                  id="btn-toggle-guide"
                  type="button"
                  onClick={() => setIsGuideOpen(!isGuideOpen)}
                  className="py-2.5 px-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Info className="w-4 h-4 text-amber-400" /> Flight Manual
                </button>
              </div>

              {/* Mobile Touch Flight Stick Toggle */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>On-Screen Touch Thumbstick & Buttons</span>
                </div>
                <button
                  id="btn-toggle-touch-controls"
                  type="button"
                  onClick={() => setShowTouchControls(!showTouchControls)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                    showTouchControls
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {showTouchControls ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {/* Desktop / Laptop Keyboard / Mouse selector */}
              {!isTouchDevice && (
                <button
                  id="btn-toggle-control-mode"
                  type="button"
                  onClick={toggleControlMode}
                  className="py-1.5 text-[11px] text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  {controlMode === 'keyboard' ? (
                    <>
                      <Keyboard className="w-3.5 h-3.5 text-sky-400" />
                      <span>Desktop Controls: <strong>WASD / Arrows</strong> (Click for Mouse Follow)</span>
                    </>
                  ) : (
                    <>
                      <MousePointer className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Desktop Controls: <strong>Mouse Follow</strong> (Click for WASD)</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* In-Menu Controls Guide Accordion */}
            {isGuideOpen && (
              <div className="w-full text-left">
                <ControlsGuide onClose={() => setIsGuideOpen(false)} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paused Menu */}
      {gameState === 'paused' && (
        <div
          id="screen-pause-menu"
          className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        >
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 text-center text-slate-200">
            <h2 className="text-xl font-bold tracking-wider text-white uppercase">Mission Paused</h2>
            <span className="text-xs text-slate-400">All flight systems held in stasis</span>

            <div className="w-full flex flex-col gap-2.5 mt-2">
              <button
                id="btn-resume-mission"
                type="button"
                onClick={handleResumeGame}
                className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" /> Resume Flight
              </button>

              <button
                id="btn-pause-music-deck"
                type="button"
                onClick={() => setIsMusicModalOpen(true)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Music className="w-4 h-4 text-sky-400" /> Soundtrack Options
              </button>

              <button
                id="btn-restart-from-pause"
                type="button"
                onClick={handleStartGame}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-rose-400" /> Restart Mission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <GameOverModal stats={gameOverStats} onRestart={handleStartGame} />
      )}

      {/* Custom Music Upload Modal */}
      <MusicUploadModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
      />
    </div>
  );
}
