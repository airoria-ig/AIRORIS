import { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Maximize, Check } from 'lucide-react';

export const PWAInstallBanner = () => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        // Request landscape orientation lock if supported on Android
        if ('orientation' in screen && 'lock' in (screen.orientation as unknown as { lock: (o: string) => Promise<void> })) {
          try {
            await (screen.orientation as unknown as { lock: (o: string) => Promise<void> }).lock('landscape');
          } catch {
            // ignore orientation lock failure if unsupported
          }
        }
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  };

  // If installed and already in fullscreen or dismissed
  if (dismissed && !isInstallable) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
      {/* Install on Android Button */}
      {isInstallable && !isInstalled && (
        <button
          id="btn-install-android-pwa"
          type="button"
          onClick={install}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-950/50 active:scale-95 transition-all"
        >
          <Smartphone className="w-4 h-4 text-emerald-200" />
          <span>Install Android App</span>
          <Download className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Fullscreen Edge-to-Edge Toggle */}
      <button
        id="btn-toggle-fullscreen"
        type="button"
        onClick={handleToggleFullscreen}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition-all"
        title="Toggle Fullscreen Mode"
      >
        <Maximize className="w-3.5 h-3.5 text-sky-400" />
        <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
      </button>
    </div>
  );
};
