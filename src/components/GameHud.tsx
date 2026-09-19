import { Player } from '../types';
import { Shield, Zap, Bomb, Flame, Crosshair, Pause, Award, Gauge, Rocket } from 'lucide-react';
import { AudioPlayerHud } from './AudioPlayerHud';

interface GameHudProps {
  player: Player | null;
  sectorProgress: number;
  distance: number;
  maxDistance: number;
  sectorName: string;
  onPause: () => void;
  onBomb: () => void;
  onOpenUploadModal: () => void;
}

const WEAPON_NAMES = [
  'DUAL LASERS',
  'TRIPLE SPREAD',
  'QUAD PLASMA',
  'HOMING MISSILES',
  'HYPER BEAM',
];

export const GameHud = ({
  player,
  sectorProgress,
  distance,
  maxDistance,
  sectorName,
  onPause,
  onBomb,
  onOpenUploadModal,
}: GameHudProps) => {
  if (!player) return null;

  const healthPct = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
  const shieldPct = Math.max(0, Math.min(100, (player.shield / player.maxShield) * 100));
  const boostPct = Math.max(0, Math.min(100, (player.boost / player.maxBoost) * 100));
  const weaponTitle = WEAPON_NAMES[Math.min(player.weaponLevel - 1, WEAPON_NAMES.length - 1)];

  return (
    <div
      id="game-hud-overlay"
      className="pointer-events-none absolute inset-0 flex flex-col justify-between select-none z-20"
      style={{
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
      }}
    >
      {/* ========================================================================= */}
      {/* TOP GAGES BAR: SHIELD MATRIX, HULL INTEGRITY, SECTOR PROGRESS & SCORE     */}
      {/* ========================================================================= */}
      <header
        id="hud-top-gages-bar"
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl pointer-events-auto"
      >
        {/* Top-Left: Shield Matrix & Hull Armor Gages */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-[200px] sm:min-w-[260px]">
          {/* Shield Gage */}
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-sky-400">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="hidden sm:inline">SHIELD MATRIX</span>
                <span className="sm:hidden">SHIELD</span>
              </span>
              <span className="font-mono">{Math.round(player.shield)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-sky-900/60 p-[1px]">
              <div
                className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-300 rounded-full transition-all duration-150 shadow-[0_0_8px_rgba(56,189,248,0.7)]"
                style={{ width: `${shieldPct}%` }}
              />
            </div>
          </div>

          {/* Hull Integrity Gage */}
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    healthPct < 30 ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'
                  }`}
                />
                <span className="hidden sm:inline">HULL ARMOR</span>
                <span className="sm:hidden">HULL</span>
              </span>
              <span
                className={`font-mono ${
                  healthPct < 30 ? 'text-rose-400 font-extrabold animate-pulse' : 'text-emerald-400'
                }`}
              >
                {Math.round(player.health)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-[1px]">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  healthPct < 30
                    ? 'bg-gradient-to-r from-rose-600 to-red-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                }`}
                style={{ width: `${healthPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top-Center: Sector Progression Navigation Gage */}
        <div className="flex flex-col items-center flex-1 max-w-xs sm:max-w-md px-2">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-300 tracking-wider uppercase truncate">
            <Rocket className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="truncate">{sectorName}</span>
          </div>

          <div className="flex items-center gap-2 w-full mt-1">
            <span className="text-[9px] font-mono text-slate-400 shrink-0">0%</span>
            <div className="relative flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-rose-500 rounded-full transition-all duration-200"
                style={{ width: `${sectorProgress * 100}%` }}
              />
            </div>
            <span className="text-[9px] font-mono font-black text-rose-400 shrink-0">BOSS</span>
          </div>

          <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 mt-0.5 hidden xs:inline">
            SECTOR TELEMETRY: {distance.toLocaleString()} / {maxDistance.toLocaleString()} LY
          </span>
        </div>

        {/* Top-Right: Score Counter & Audio Visualizer & Pause */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Tactical Score Gage */}
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">MISSION SCORE</span>
              <span className="sm:hidden">SCORE</span>
            </span>
            <span className="text-sm sm:text-lg font-mono font-black text-white tracking-wider">
              {player.score.toLocaleString()}
            </span>
          </div>

          <div className="hidden sm:block">
            <AudioPlayerHud onOpenUploadModal={onOpenUploadModal} />
          </div>

          <button
            id="btn-pause-cockpit"
            type="button"
            onClick={onPause}
            className="p-2 sm:p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-colors shadow-lg active:scale-95"
            title="Pause Flight"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* BOTTOM GAGES BAR: AFTERBURNER BOOST, WEAPONS POWER & EMP BOMBS ARSENAL    */}
      {/* ========================================================================= */}
      <footer
        id="hud-bottom-gages-bar"
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl pointer-events-auto"
      >
        {/* Bottom-Left: Afterburner Boost Energy Gage & Impulse Readout */}
        <div className="flex items-center gap-3 min-w-[170px] sm:min-w-[220px]">
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-amber-400">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">AFTERBURNER BOOST</span>
                <span className="sm:hidden">BOOST</span>
              </span>
              <span className="font-mono">{Math.round(player.boost)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-amber-900/60 p-[1px]">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-100 shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                style={{ width: `${boostPct}%` }}
              />
            </div>
            <span className="text-[8px] font-mono text-slate-400 hidden sm:inline">
              IMPULSE: {player.isBoosting ? '440 KM/S (BOOST)' : '280 KM/S (CRUISE)'}
            </span>
          </div>
        </div>

        {/* Bottom-Center: Weapon Power Tier Gage & Active Weapon Specs */}
        <div className="flex flex-col items-center justify-center px-2">
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">
            <Crosshair className="w-3 h-3 text-sky-400" />
            <span>WEAPON LVL {player.weaponLevel}: {weaponTitle}</span>
          </div>

          {/* 5-Segmented Power Cells Gage */}
          <div className="flex items-center gap-1 sm:gap-1.5 mt-1">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <div
                key={lvl}
                className={`h-2.5 w-4 sm:w-6 rounded-sm border transition-all ${
                  player.weaponLevel >= lvl
                    ? 'bg-sky-400 border-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.9)]'
                    : 'bg-slate-900 border-slate-800'
                }`}
                title={`Armament Level ${lvl}`}
              />
            ))}
          </div>

          {/* Combo Multiplier indicator */}
          {player.combo > 1 ? (
            <div className="flex items-center gap-1 mt-0.5 animate-bounce">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-[10px] font-black text-orange-400 font-mono tracking-wider">
                {player.combo}x COMBO MULTIPLIER
              </span>
            </div>
          ) : (
            <span className="text-[8px] font-mono text-slate-500 mt-0.5 hidden xs:inline">
              CONTINUOUS AUTO-FIRE ARMED
            </span>
          )}
        </div>

        {/* Bottom-Right: Smart EMP Bombs Arsenal Gage */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] sm:text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
              <Bomb className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">EMP BOMBS</span>
              <span className="sm:hidden">BOMBS</span>
              <span className="text-white">[{player.bombs}/{player.maxBombs}]</span>
            </span>

            {/* Bomb Pod Icons Gage */}
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: player.maxBombs }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={onBomb}
                  disabled={idx >= player.bombs}
                  className={`p-1 rounded-lg border transition-all ${
                    idx < player.bombs
                      ? 'bg-amber-500/20 border-amber-400/80 text-amber-300 hover:scale-110 active:scale-95 shadow-[0_0_6px_rgba(245,158,11,0.6)] cursor-pointer'
                      : 'bg-slate-900/60 border-slate-800 text-slate-700 cursor-not-allowed'
                  }`}
                  title="Detonate Smart EMP Bomb"
                >
                  <Bomb className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
