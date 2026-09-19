import { Keyboard, Mouse, Shield, Zap, Crosshair, Bomb, Sparkles } from 'lucide-react';

interface ControlsGuideProps {
  onClose?: () => void;
}

export const ControlsGuide = ({ onClose }: ControlsGuideProps) => {
  return (
    <div id="controls-guide-panel" className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-slate-200 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-sky-400" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">Flight & Combat Systems</h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800"
          >
            Close
          </button>
        )}
      </div>

      {/* Control mappings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-start gap-2.5 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg shrink-0">
            <Keyboard className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sky-300">W / A / S / D or Arrows</span>
            <span className="text-[11px] text-slate-400">Directional navigation thrusters</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
            <Mouse className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-indigo-300">Android Touch / Thumbstick</span>
            <span className="text-[11px] text-slate-400">Left virtual joystick to steer; Right buttons for Fire/Boost/EMP</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-amber-300">Left Shift / Boost Button</span>
            <span className="text-[11px] text-slate-400">Afterburner boost drive (energy gauge at bottom)</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg shrink-0">
            <Crosshair className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-rose-300">Spacebar / FIRE Button</span>
            <span className="text-[11px] text-slate-400">Fire plasma & laser cannons (weapon gauge at bottom)</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="p-1.5 bg-yellow-500/10 text-yellow-400 rounded-lg shrink-0">
            <Bomb className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-yellow-300">E / Q / Smart Bomb button</span>
            <span className="text-[11px] text-slate-400">Deploy screen-clearing EMP bomb</span>
          </div>
        </div>
      </div>

      {/* Power-ups legend */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
        <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
          Tactical Salvage & Power-Ups
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[9px] border border-sky-500/40">S</span>
            <span className="text-slate-300">Shield Matrix</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-[9px] border border-pink-500/40">W</span>
            <span className="text-slate-300">Weapon Upgrade</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-[9px] border border-orange-500/40">M</span>
            <span className="text-slate-300">Homing Missiles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold text-[9px] border border-yellow-500/40">B</span>
            <span className="text-slate-300">+1 Smart Bomb</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px] border border-emerald-500/40">+</span>
            <span className="text-slate-300">Hull Repair</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[9px] border border-purple-500/40">O</span>
            <span className="text-slate-300">Overcharge Beam</span>
          </div>
        </div>
      </div>
    </div>
  );
};
