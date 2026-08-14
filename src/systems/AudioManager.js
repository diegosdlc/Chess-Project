export class AudioManager {
  constructor({ storageKey = 'chess-project-music-volume' } = {}) {
    this.music = null;
    this.config = null;
    this.unlocked = false;
    this.storageKey = storageKey;
    this.volumeOverride = this.readStoredVolume();
    this.bindVolumeControl();
  }

  configure(config) {
    this.stopMusic();
    this.config = config ?? null;
    this.syncVolumeControl();
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
    this.syncVolumeControl();
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

  bindVolumeControl() {
    this.menuToggle = document.querySelector('#audio-menu-toggle');
    this.menu = document.querySelector('#audio-menu');
    this.volumeInput = document.querySelector('#music-volume');
    this.volumeValue = document.querySelector('#music-volume-value');
    if (!this.menuToggle || !this.menu || !this.volumeInput || !this.volumeValue) return;

    this.menuToggle.addEventListener('click', event => {
      event.stopPropagation();
      const willOpen = this.menu.hidden;
      this.menu.hidden = !willOpen;
      this.menuToggle.setAttribute('aria-expanded', String(willOpen));
      if (willOpen) this.volumeInput.focus({ preventScroll: true });
    });

    this.menu.addEventListener('pointerdown', event => event.stopPropagation());
    this.volumeInput.addEventListener('input', () => this.setVolume(Number(this.volumeInput.value) / 100));
    document.addEventListener('pointerdown', () => this.closeVolumeMenu());
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') this.closeVolumeMenu();
    });
    this.syncVolumeControl();
  }

  syncVolumeControl() {
    if (!this.volumeInput || !this.volumeValue || !this.menuToggle) return;
    const percent = Math.round(this.getVolume() * 100);
    this.volumeInput.value = String(percent);
    this.volumeValue.value = `${percent}%`;
    this.menuToggle.textContent = percent === 0 ? '♩' : '♪';
    this.menuToggle.setAttribute('aria-label', percent === 0 ? 'Abrir control de volumen, música silenciada' : `Abrir control de volumen, ${percent}%`);
  }

  closeVolumeMenu() {
    if (!this.menu || !this.menuToggle || this.menu.hidden) return;
    this.menu.hidden = true;
    this.menuToggle.setAttribute('aria-expanded', 'false');
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
