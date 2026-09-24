/**
 * =========================================================================
 * SISTEMA SONORO PEDAGÓGICO VIA WEB AUDIO API (SINE WAVE SINTETIZADO)
 * =========================================================================
 * Sons sintetizados em tempo real diretamente pelo navegador sem arquivos externos:
 * - Clique no mascote: 784 Hz com suave subida de frequência (0,3s)
 * - Clique nas notas: fórmula 520 + (valor * 2.8) Hz
 * - Suporte a ativação / desativação de som (persistido)
 */

const SOUND_PREF_KEY = 'bcem_sound_enabled';

class SoundService {
  private audioCtx: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SOUND_PREF_KEY);
      this.isEnabled = stored !== null ? stored === 'true' : true;
    }
  }

  public isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem(SOUND_PREF_KEY, String(enabled));
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Toca o som oficial do mascote (784 Hz subindo suavemente, 0.3s)
   */
  public playMascotSound(): void {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.31);
    } catch (err) {
      console.warn('Falha ao reproduzir áudio do mascote', err);
    }
  }

  /**
   * Toca o som oficial de nota Queimacash: 520 + (valor * 2.8) Hz
   */
  public playNoteSound(valor: number): void {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freq = 520 + valor * 2.8;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.04, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.29);
    } catch (err) {
      console.warn('Falha ao reproduzir som de nota', err);
    }
  }

  /**
   * Som de sucesso / confirmação suave
   */
  public playSuccessSound(): void {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [587.33, 739.99, 880.0].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.21);
      });
    } catch (err) {
      console.warn('Falha ao tocar som de sucesso', err);
    }
  }
}

export const soundService = new SoundService();
