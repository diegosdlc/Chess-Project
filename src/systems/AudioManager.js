export class AudioManager {
  constructor({ storageKey = 'chess-project-music-volume' } = {}) {
    this.music = null;
    this.config = null;
    this.unlocked = false;
    this.storageKey = storageKey;
    this.volumeOverride = this.readStoredVolume();
  }

  configure(config) {
    this.stopMusic();
    this.config = config ?? null;
    if (this.unlocked) this.playConfiguredMusic();
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    this.playConfiguredMusic();
  }

  getVolume() {
    return this.volumeOverride ?? this.config?.volume ?? 0.45;
  }

  setVolume(value) {
    const volume = Math.min(1, Math.max(0, Number(value) || 0));
    this.volumeOverride = volume;
    if (this.music) this.music.volume = volume;
    try {
      localStorage.setItem(this.storageKey, String(volume));
    } catch {
      // Volume still applies for the current session if storage is unavailable.
    }
    return volume;
  }

  playConfiguredMusic() {
    const track = this.config?.track;
    if (!track || this.music) return;

    const audio = new Audio(new URL(track, document.baseURI).href);
    audio.loop = this.config.loop !== false;
    audio.volume = this.getVolume();
    audio.play().catch(() => {
      // Browser autoplay policies may still require another explicit interaction.
      this.music = null;
    });
    this.music = audio;
  }

  playSfx(path, volume = 0.65) {
    if (!this.unlocked || !path) return;
    const audio = new Audio(new URL(path, document.baseURI).href);
    audio.volume = volume;
    audio.play().catch(() => {});
  }

  stopMusic() {
    if (!this.music) return;
    this.music.pause();
    this.music.currentTime = 0;
    this.music = null;
  }

  readStoredVolume() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored == null) return null;
      const volume = Number(stored);
      return Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : null;
    } catch {
      return null;
    }
  }
}
