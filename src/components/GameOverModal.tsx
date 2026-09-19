import { RotateCcw, Trophy, Skull, Crosshair, Sparkles } from 'lucide-react';

interface GameOverModalProps {
  stats: {
    score: number;
    highscore: number;
    enemiesKilled: number;
    asteroidsDestroyed: number;
    sectorReached: number;
  } | null;
  onRestart: () => void;
}

export const GameOverModal = ({ stats, onRestart }: GameOverModalProps) => {
  if (!stats) return null;

  const isNewHighScore = stats.score >= stats.highscore && stats.score > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
      <div
        id="modal-gameover"
        className="w-full max-w-md bg-slate-900 border border-slate-700/90 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-5 text-center text-slate-200"
      >
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.4)]">
            <Skull className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-wider text-white uppercase mt-1">
            Starfighter Destroyed
          </h2>
          <span className="text-xs text-slate-400">Mission Terminated in Sector {stats.sectorReached}</span>
        </div>

        {/* High Score Badge */}
        {isNewHighScore && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-300 text-xs font-bold animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> NEW HIGH SCORE RECORD!
          </div>
        )}

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-2.5">
          <div className="flex flex-col items-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> FINAL SCORE
            </span>
            <span className="text-xl font-mono font-bold text-white mt-0.5">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col items-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-sky-400" /> ALL-TIME BEST
            </span>
            <span className="text-xl font-mono font-bold text-sky-300 mt-0.5">
              {stats.highscore.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col items-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-rose-400" /> HOSTILES NEUTRALIZED
            </span>
            <span className="text-lg font-mono font-bold text-slate-200 mt-0.5">
              {stats.enemiesKilled}
            </span>
          </div>

          <div className="flex flex-col items-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400">ASTEROIDS MINED</span>
            <span className="text-lg font-mono font-bold text-slate-200 mt-0.5">
              {stats.asteroidsDestroyed}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          id="btn-restart-game"
          type="button"
          onClick={onRestart}
          className="w-full py-3.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500 hover:from-sky-400 hover:to-indigo-400 text-white font-bold text-sm rounded-2xl shadow-xl hover:shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-4 h-4" /> Deploy Next Starfighter
        </button>
      </div>
    </div>
  );
};
