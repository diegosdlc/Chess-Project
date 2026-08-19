const NOTEBOOK_SECTIONS = {
  band: [
    {
      title: 'Banda',
      html: '<p>Tu banda se gestionará desde aquí.</p><p>Esta sección queda preparada para el despliegue inicial de piezas sobre las dos filas más cercanas al jugador.</p>'
    },
    {
      title: 'Banda · despliegue',
      html: '<p>El flujo de despliegue se conectará al estado de partida en la siguiente iteración.</p><p>La interfaz ya reserva este espacio para el roster, selección de pieza y confirmación del despliegue.</p>'
    }
  ],
  mission: [
    {
      title: 'Misión',
      html: '<p>Objetivo del encuentro.</p><p>El contenido de cada nivel podrá definir aquí una o varias páginas de misión, condiciones especiales y objetivos secundarios.</p>'
    },
    {
      title: 'Misión · notas',
      html: '<p>Página adicional preparada para instrucciones o condiciones especiales del escenario.</p>'
    }
  ],
  rules: [
    {
      title: 'Reglas',
      html: '<ul><li>Selecciona una pieza de tu banda.</li><li>Las casillas legales se resaltan sobre el tablero.</li><li>Una captura puede congelar o destruir la pieza rival.</li></ul>'
    },
    {
      title: 'Reglas · turno',
      html: '<p>Si una banda no dispone de movimientos legales, pierde el turno. Si ninguna puede moverse, el encuentro termina en tablas.</p>'
    }
  ],
  settings: [
    {
      title: 'Ajustes',
      html: '<div class="notebook-settings-row"><label for="notebook-volume">Música</label><input id="notebook-volume" type="range" min="0" max="100" step="1" value="45" aria-label="Volumen de la música"></div><p>El botón de altavoz junto al cuaderno permite silenciar o recuperar el volumen con una sola pulsación.</p><button id="notebook-main-menu" class="notebook-menu-button" type="button">Volver al menú principal</button>'
    }
  ]
};

class NotebookUI {
  constructor(root) {
    this.root = root;
    this.pageContent = root?.querySelector('#notebook-page-content');
    this.indicator = root?.querySelector('#notebook-page-indicator');
    this.previous = root?.querySelector('#notebook-page-prev');
    this.next = root?.querySelector('#notebook-page-next');
    this.tabs = [...(root?.querySelectorAll('.notebook-tab') ?? [])];
    this.section = 'band';
    this.page = 0;
  }

  start() {
    if (!this.root || !this.pageContent) return;
    this.tabs.forEach(tab => tab.addEventListener('click', () => this.open(tab.dataset.section)));
    this.previous?.addEventListener('click', () => this.turn(-1));
    this.next?.addEventListener('click', () => this.turn(1));
    this.render();
  }

  open(section) {
    if (!NOTEBOOK_SECTIONS[section]) return;
    this.section = section;
    this.page = 0;
    this.render();
  }

  turn(offset) {
    const pages = NOTEBOOK_SECTIONS[this.section] ?? [];
    const nextPage = this.page + offset;
    if (nextPage < 0 || nextPage >= pages.length) return;
    this.page = nextPage;
    this.render();
  }

  render() {
    const pages = NOTEBOOK_SECTIONS[this.section] ?? [];
    const current = pages[this.page] ?? pages[0];
    if (!current) return;

    this.tabs.forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.section === this.section)));
    this.pageContent.innerHTML = `<h2>${current.title}</h2>${current.html}`;
    if (this.indicator) this.indicator.textContent = `${this.page + 1} / ${pages.length}`;
    if (this.previous) this.previous.disabled = this.page === 0;
    if (this.next) this.next.disabled = this.page >= pages.length - 1;
    this.bindSettingsControls();
  }

  bindSettingsControls() {
    const mainMenu = this.root.querySelector('#notebook-main-menu');
    mainMenu?.addEventListener('click', () => window.dispatchEvent(new Event('game:return-home')));

    const volume = this.root.querySelector('#notebook-volume');
    const legacy = document.querySelector('#music-volume');
    if (!volume || !legacy) return;
    volume.value = legacy.value;
    volume.addEventListener('input', () => {
      legacy.value = volume.value;
      legacy.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
}

class LevelControls {
  constructor() {
    this.shell = document.querySelector('#game-shell');
    this.mute = document.querySelector('#mute-toggle');
    this.pause = document.querySelector('#pause-toggle');
    this.pauseDialog = document.querySelector('#pause-dialog');
    this.resume = document.querySelector('#resume-game');
    this.legacyVolume = document.querySelector('#music-volume');
    this.previousVolume = Number(this.legacyVolume?.value ?? 45) || 45;
  }

  start() {
    this.mute?.addEventListener('click', () => this.toggleMute());
    this.pause?.addEventListener('click', () => this.openPause());
    this.resume?.addEventListener('click', () => this.closePause());
    this.pauseDialog?.addEventListener('cancel', event => {
      event.preventDefault();
      this.closePause();
    });
    this.legacyVolume?.addEventListener('input', () => this.syncMute());
    this.syncMute();
  }

  toggleMute() {
    if (!this.legacyVolume) return;
    const current = Number(this.legacyVolume.value);
    if (current > 0) {
      this.previousVolume = current;
      this.legacyVolume.value = '0';
    } else {
      this.legacyVolume.value = String(this.previousVolume || 45);
    }
    this.legacyVolume.dispatchEvent(new Event('input', { bubbles: true }));
    this.syncMute();
  }

  syncMute() {
    if (!this.mute || !this.legacyVolume) return;
    const muted = Number(this.legacyVolume.value) === 0;
    this.mute.textContent = muted ? '🔇' : '🔊';
    this.mute.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar música');
    this.mute.setAttribute('aria-pressed', String(muted));
    const notebookVolume = document.querySelector('#notebook-volume');
    if (notebookVolume) notebookVolume.value = this.legacyVolume.value;
  }

  openPause() {
    if (!this.pauseDialog || this.pauseDialog.open) return;
    this.shell?.classList.add('is-ui-paused');
    this.pauseDialog.showModal();
  }

  closePause() {
    this.shell?.classList.remove('is-ui-paused');
    if (this.pauseDialog?.open) this.pauseDialog.close();
  }
}

new NotebookUI(document.querySelector('#notebook-ui')).start();
new LevelControls().start();
