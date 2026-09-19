import { useState, useRef } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { Upload, Music, CheckCircle2, X, Disc, Volume2 } from 'lucide-react';

interface MusicUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MusicUploadModal = ({ isOpen, onClose }: MusicUploadModalProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [loadedTrackName, setLoadedTrackName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    if (!file || !file.type.startsWith('audio/')) {
      alert('Please select an audio file (MP3, WAV, OGG, FLAC, AAC).');
      return;
    }
    setIsLoading(true);
    try {
      const name = await soundEngine.loadCustomMusic(file);
      setLoadedTrackName(name);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      alert('Could not load audio file. Please try another track.');
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUseSynthMusic = () => {
    soundEngine.startSynthMusic();
    setLoadedTrackName('Generative Synth: Stellar Odyssey');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="modal-music-loader"
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-sky-400 animate-spin-slow" />
            <h2 className="text-base font-bold text-white tracking-wide">Soundtrack Audio Deck</h2>
          </div>
          <button
            id="btn-close-music-modal"
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Upload your custom MP3, WAV, or OGG space soundtrack. The game will automatically loop your track and synchronize the HUD audio spectrum visualizer to your music!
        </p>

        {/* Drag and Drop Zone */}
        <div
          id="dropzone-music"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
            dragActive
              ? 'border-sky-400 bg-sky-500/10 scale-[1.01]'
              : 'border-slate-700 hover:border-slate-500 bg-slate-950/50'
          }`}
        >
          <input
            id="file-input-music"
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="p-3 bg-sky-500/20 text-sky-400 rounded-full">
            <Upload className="w-6 h-6" />
          </div>

          <span className="text-xs font-semibold text-sky-300">
            {isLoading ? 'Loading audio stream...' : 'Click to select audio or drag & drop here'}
          </span>
          <span className="text-[10px] text-slate-400">Supports MP3, WAV, OGG, FLAC, M4A</span>
        </div>

        {/* Status Confirmation */}
        {loadedTrackName && (
          <div className="flex items-center gap-2.5 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold truncate">{loadedTrackName}</span>
              <span className="text-[10px] text-emerald-400/80">Track loaded and set to loop seamlessly</span>
            </div>
          </div>
        )}

        {/* Generative Synth Option */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Music className="w-3.5 h-3.5" />
            <span>Don't have music ready?</span>
          </div>
          <button
            id="btn-use-synth-ost"
            type="button"
            onClick={handleUseSynthMusic}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium hover:underline"
          >
            Use Built-in Space Synth OST
          </button>
        </div>

        {/* Action Button */}
        <button
          id="btn-done-music-modal"
          type="button"
          onClick={onClose}
          className="w-full mt-2 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
        >
          Return to Cockpit
        </button>
      </div>
    </div>
  );
};
