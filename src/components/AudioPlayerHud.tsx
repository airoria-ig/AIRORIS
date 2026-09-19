import { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { Music, Play, Pause, Volume2, VolumeX, Upload, Sparkles } from 'lucide-react';

interface AudioPlayerHudProps {
  onOpenUploadModal: () => void;
}

export const AudioPlayerHud = ({ onOpenUploadModal }: AudioPlayerHudProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackInfo, setTrackInfo] = useState({ name: 'Generative Synth: Stellar Odyssey', isCustom: false });
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [showControls, setShowControls] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  // Audio spectrum visualization loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderSpectrum = () => {
      const freqData = soundEngine.getSpectrumData();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 16;
      const barWidth = (canvas.width / numBars) - 2;

      for (let i = 0; i < numBars; i++) {
        // Sample frequency bins
        const val = freqData[i * 2] || 0;
        const barHeight = Math.max(2, (val / 255) * canvas.height);

        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;

        const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(1, '#6366f1');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animRef.current = requestAnimationFrame(renderSpectrum);
    };

    animRef.current = requestAnimationFrame(renderSpectrum);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Update track info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const info = soundEngine.getTrackInfo();
      setTrackInfo({ name: info.name, isCustom: info.isCustom });
      setIsPlaying(info.isPlaying);
      setIsMuted(soundEngine.getMuted());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleTogglePlay = () => {
    const playing = soundEngine.toggleMusicPlayback();
    setIsPlaying(playing);
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundEngine.setMusicVolume(val);
  };

  return (
    <div id="audio-deck-container" className="relative flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-lg text-slate-200">
      {/* Visualizer Canvas */}
      <div className="flex items-center gap-2">
        <canvas
          id="audio-spectrum-canvas"
          ref={canvasRef}
          width={64}
          height={22}
          className="rounded bg-slate-950/60 border border-slate-800"
          title="Live Music Spectrum Analyzer"
        />

        {/* Track Title & Custom Tag */}
        <div className="flex flex-col min-w-[130px] max-w-[200px] select-none">
          <div className="flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-xs font-semibold text-sky-200 truncate" title={trackInfo.name}>
              {trackInfo.name}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {trackInfo.isCustom ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> User Music Active
              </span>
            ) : (
              'Synthesizer OST'
            )}
          </span>
        </div>
      </div>

      {/* Play/Pause Button */}
      <button
        id="btn-toggle-music"
        type="button"
        onClick={handleTogglePlay}
        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
        title={isPlaying ? 'Pause Music' : 'Play Music'}
      >
        {isPlaying ? <Pause className="w-4 h-4 text-sky-400" /> : <Play className="w-4 h-4 text-slate-400" />}
      </button>

      {/* Load Custom Music Button */}
      <button
        id="btn-upload-music-trigger"
        type="button"
        onClick={onOpenUploadModal}
        className="flex items-center gap-1 px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 hover:text-sky-200 border border-sky-500/40 rounded-lg text-xs font-medium transition-colors"
        title="Load Your Own Music (MP3, WAV, OGG)"
      >
        <Upload className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Load Music</span>
      </button>

      {/* Volume / Mute popover toggle */}
      <div className="relative">
        <button
          id="btn-volume-options"
          type="button"
          onClick={() => setShowControls(!showControls)}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          title="Audio Volume Settings"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
        </button>

        {showControls && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl z-50 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Master Sound</span>
              <button
                type="button"
                onClick={handleToggleMute}
                className="text-sky-400 hover:underline text-[11px]"
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>Music Volume</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                id="slider-music-volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
