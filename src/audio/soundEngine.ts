// High-performance Web Audio Synthesizer & Music Track Engine

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Custom user audio
  private customAudio: HTMLAudioElement | null = null;
  private customSourceNode: MediaElementAudioSourceNode | null = null;
  private isCustomMusicPlaying = false;
  private customTrackName = '';

  // Generative synth soundtrack
  private isSynthMusicPlaying = false;
  private synthInterval: number | null = null;
  private synthStep = 0;

  // Volumes
  private sfxVolume = 0.7;
  private musicVolume = 0.6;
  private isMuted = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.musicGain.connect(this.analyser);
      this.analyser.connect(this.masterGain);

      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public ensureReady() {
    this.initContext();
  }

  // Setters
  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
    if (this.customAudio) {
      this.customAudio.volume = this.musicVolume;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  // Music spectrum visualization data
  public getSpectrumData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(32);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  // Load custom music track from file
  public loadCustomMusic(file: File): Promise<string> {
    this.initContext();
    return new Promise((resolve, reject) => {
      try {
        if (this.customAudio) {
          this.customAudio.pause();
          this.customAudio.src = '';
        }

        const url = URL.createObjectURL(file);
        const audio = new Audio();
        audio.src = url;
        audio.loop = true;
        audio.crossOrigin = 'anonymous';
        audio.volume = this.musicVolume;

        audio.oncanplaythrough = () => {
          this.customAudio = audio;
          this.customTrackName = file.name.replace(/\.[^/.]+$/, '');

          if (this.ctx && !this.customSourceNode) {
            try {
              this.customSourceNode = this.ctx.createMediaElementSource(audio);
              if (this.musicGain) {
                this.customSourceNode.connect(this.musicGain);
              }
            } catch (err) {
              // Fallback if already connected or context issue
              console.warn('Audio source node connection error:', err);
            }
          }

          this.stopSynthMusic();
          this.playCustomMusic();
          resolve(this.customTrackName);
        };

        audio.onerror = (e) => {
          reject(e);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  public playCustomMusic() {
    if (this.customAudio) {
      this.initContext();
      this.customAudio.play().then(() => {
        this.isCustomMusicPlaying = true;
      }).catch(err => {
        console.warn('Auto-play blocked or audio load error:', err);
      });
    } else {
      this.startSynthMusic();
    }
  }

  public pauseCustomMusic() {
    if (this.customAudio) {
      this.customAudio.pause();
      this.isCustomMusicPlaying = false;
    }
    this.stopSynthMusic();
  }

  public toggleMusicPlayback() {
    if (this.customAudio) {
      if (this.customAudio.paused) {
        this.playCustomMusic();
      } else {
        this.pauseCustomMusic();
      }
      return !this.customAudio.paused;
    } else {
      if (this.isSynthMusicPlaying) {
        this.stopSynthMusic();
        return false;
      } else {
        this.startSynthMusic();
        return true;
      }
    }
  }

  public getTrackInfo(): { name: string; isCustom: boolean; isPlaying: boolean } {
    return {
      name: this.customTrackName || 'Generative Synth: Stellar Odyssey',
      isCustom: Boolean(this.customAudio && this.customTrackName),
      isPlaying: this.isCustomMusicPlaying || this.isSynthMusicPlaying,
    };
  }

  // Generative Synth Soundtrack using Web Audio
  public startSynthMusic() {
    if (this.customAudio && !this.customAudio.paused) {
      return; // custom audio active
    }
    this.initContext();
    if (this.isSynthMusicPlaying) return;
    this.isSynthMusicPlaying = true;

    // Chords: Dm, Bb, F, C space progression
    const chords = [
      [146.83, 220.00, 261.63, 349.23], // D3, A3, C4, F4
      [116.54, 174.61, 233.08, 293.66], // Bb2, F3, Bb3, D4
      [174.61, 220.00, 261.63, 349.23], // F3, A3, C4, F4
      [130.81, 196.00, 261.63, 329.63], // C3, G3, C4, E4
    ];

    const arpeggioNotes = [
      293.66, 349.23, 440.00, 523.25, 587.33, 523.25, 440.00, 349.23, // Dm
      233.08, 293.66, 349.23, 466.16, 587.33, 466.16, 349.23, 293.66, // Bb
      349.23, 440.00, 523.25, 698.46, 523.25, 440.00, 349.23, 261.63, // F
      261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 392.00, 329.63, // C
    ];

    const tempoMs = 130; // ~115 BPM 16th notes
    this.synthStep = 0;

    this.synthInterval = window.setInterval(() => {
      if (!this.ctx || !this.isSynthMusicPlaying || this.isMuted) return;

      const chordIdx = Math.floor((this.synthStep / 16) % 4);
      const arpNote = arpeggioNotes[this.synthStep % arpeggioNotes.length];

      // Arpeggio blip
      this.playSynthNote(arpNote, 'sawtooth', 0.12, 0.08, 1200);

      // Bass drone on 1st & 9th 16th
      if (this.synthStep % 8 === 0) {
        const bassNote = chords[chordIdx][0] / 2;
        this.playSynthNote(bassNote, 'triangle', 0.45, 0.22, 400);
      }

      // Soft ambient chord pad every 16 steps
      if (this.synthStep % 16 === 0) {
        chords[chordIdx].forEach(f => {
          this.playSynthNote(f, 'sine', 1.2, 0.05, 800);
        });
      }

      // Cyber kick & hi-hat
      if (this.synthStep % 4 === 0) {
        this.playSynthKick();
      } else if (this.synthStep % 2 === 1) {
        this.playSynthHiHat();
      }

      this.synthStep = (this.synthStep + 1) % 64;
    }, tempoMs);
  }

  public stopSynthMusic() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    this.isSynthMusicPlaying = false;
  }

  private playSynthNote(freq: number, type: OscillatorType, duration: number, vol: number, filterFreq = 1000) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(vol * this.musicVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // ignore
    }
  }

  private playSynthKick() {
    if (!this.ctx || !this.musicGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3 * this.musicVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch {
      // ignore
    }
  }

  private playSynthHiHat() {
    if (!this.ctx || !this.musicGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.04;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.06 * this.musicVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      noise.start();
    } catch {
      // ignore
    }
  }

  // SFX API
  public playLaser(type: 'single' | 'spread' | 'plasma' | 'beam' = 'single') {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (type === 'plasma') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(580, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);
      } else if (type === 'spread') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(750, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.09);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
      }

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {
      // ignore
    }
  }

  public playMissileLaunch() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch {
      // ignore
    }
  }

  public playExplosion(size: 'small' | 'medium' | 'boss' = 'small') {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      const duration = size === 'boss' ? 1.2 : size === 'medium' ? 0.45 : 0.25;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const initialFreq = size === 'boss' ? 400 : 800;
      filter.frequency.setValueAtTime(initialFreq, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      const vol = size === 'boss' ? 0.6 : size === 'medium' ? 0.35 : 0.25;
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start();

      // Sub bass boom for boss
      if (size === 'boss') {
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(90, this.ctx.currentTime);
        sub.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.8);
        subGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
        sub.connect(subGain);
        subGain.connect(this.sfxGain);
        sub.start();
        sub.stop(this.ctx.currentTime + 0.85);
      }
    } catch {
      // ignore
    }
  }

  public playShieldHit() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.19);
    } catch {
      // ignore
    }
  }

  public playPowerUp() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.05 + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(this.ctx!.currentTime + idx * 0.05);
        osc.stop(this.ctx!.currentTime + idx * 0.05 + 0.16);
      });
    } catch {
      // ignore
    }
  }

  public playBomb() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.9);

      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.9);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.95);
      this.playExplosion('boss');
    } catch {
      // ignore
    }
  }

  public playAlarm() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      [0, 0.25, 0.5].forEach((offset) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now + offset);
        osc.frequency.setValueAtTime(440, now + offset + 0.1);

        gain.gain.setValueAtTime(0.25, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + offset);
        osc.stop(now + offset + 0.22);
      });
    } catch {
      // ignore
    }
  }

  public playWarp() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.45);
    } catch {
      // ignore
    }
  }
}

export const soundEngine = new SoundEngine();
