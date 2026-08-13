export class AudioManager {
  constructor() {
    this.music = null;
    this.config = null;
    this.unlocked = false;
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

  playConfiguredMusic() {
    const track = this.config?.track;
    if (!track || this.music) return;

    const audio = new Audio(new URL(track, document.baseURI).href);
    audio.loop = this.config.loop !== false;
    audio.volume = this.config.volume ?? 0.45;
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
}
