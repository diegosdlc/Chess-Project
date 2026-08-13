import { GAME_CONFIG } from './config/gameConfig.js';
import { FACTIONS } from './content/factions.js';
import { getLevel, getNextLevel } from './content/levels/index.js';
import { GameState } from './core/GameState.js';
import { AssetRegistry } from './systems/AssetRegistry.js';
import { AudioManager } from './systems/AudioManager.js';
import { ProgressionStore } from './systems/ProgressionStore.js';
import { TutorialSystem } from './systems/TutorialSystem.js';
import { BoardRenderer } from './render/BoardRenderer.js';

class GameApp {
  constructor() {
    this.board = document.querySelector('#board');
    this.resultDialog = document.querySelector('#result-dialog');
    this.resultContent = document.querySelector('#result-content');
    this.assets = new AssetRegistry(FACTIONS);
    this.audio = new AudioManager();
    this.progression = new ProgressionStore(GAME_CONFIG.progressionStorageKey, GAME_CONFIG.defaultLevelId);
    this.tutorial = new TutorialSystem({ storagePrefix: GAME_CONFIG.tutorialStoragePrefix });
    this.level = null;
    this.state = null;
    this.renderer = null;
  }

  start() {
    const params = new URLSearchParams(location.search);
    const requestedLevelId = params.get(GAME_CONFIG.levelQueryParam) ?? GAME_CONFIG.defaultLevelId;
    const level = getLevel(requestedLevelId) ?? getLevel(GAME_CONFIG.defaultLevelId);
    const forceTutorial = params.get(GAME_CONFIG.tutorialQueryParam) === '1';
    this.loadLevel(level, { forceTutorial });

    document.addEventListener('keydown', event => {
      if ((event.key === 'r' || event.key === 'R') && !this.state.pendingCapture) this.resetLevel();
    });

    document.addEventListener('pointerdown', () => this.audio.unlock(), { once: true, passive: true });
  }

  loadLevel(level, { forceTutorial = false } = {}) {
    if (!level) throw new Error('No hay ningún nivel disponible.');
    this.level = level;
    this.state = new GameState(level);
    this.renderer = new BoardRenderer({
      board: this.board,
      level,
      state: this.state,
      assets: this.assets,
      onCellClick: (option, unit) => this.cellClick(option, unit),
      onCaptureAction: action => this.resolveCapture(action)
    });
    this.audio.configure(level.music);
    this.tutorial.configure(level.id, level.tutorial, { forceEnabled: forceTutorial });
    if (this.resultDialog.open) this.resultDialog.close();
    this.render();
  }

  resetLevel() {
    this.state.reset();
    if (this.resultDialog.open) this.resultDialog.close();
    this.render();
  }

  render() {
    this.renderer.render();
    this.tutorial.render(this.board, anchor => this.renderer.resolveTutorialAnchor(anchor));
  }

  cellClick(option, unit) {
    if (this.state.finished || this.state.pendingCapture) return;
    if (option) {
      this.perform(this.state.selected(), option);
      return;
    }

    if (unit?.team === this.state.currentTurn) {
      this.state.setSelected(unit.id);
      this.tutorial.notify('unit-selected');
    } else {
      this.state.clearSelection();
    }
    this.render();
  }

  perform(unit, option) {
    if (!unit || this.state.finished || this.state.pendingCapture) return;
    if (option.kind === 'capture') {
      this.chooseCaptureAction(unit, option);
      return;
    }
    this.moveUnit(unit, option);
  }

  moveUnit(unit, option) {
    this.state.leaveOrigin(unit);
    unit.x = option.x;
    unit.y = option.y;
    this.tutorial.notify('move-completed');
    this.finishMove();
  }

  chooseCaptureAction(unit, option) {
    const target = this.state.activeAt(option.x, option.y);
    if (!target || target.team === unit.team) return;
    this.state.pendingCapture = { unitId: unit.id, targetId: target.id, x: option.x, y: option.y };
    this.render();
  }

  resolveCapture(action) {
    const pending = this.state.pendingCapture;
    if (!pending || this.state.finished) return;

    const unit = this.state.units.find(piece => piece.id === pending.unitId);
    const target = this.state.units.find(piece => piece.id === pending.targetId);
    this.state.pendingCapture = null;

    if (!unit || !target || !this.state.active(unit) || !this.state.active(target)) {
      this.render();
      return;
    }

    this.state.leaveOrigin(unit);

    if (action === 'capture') {
      target.captured = true;
      target.capturedBy = unit.team;
      target.x = pending.x;
      target.y = pending.y;
    } else {
      target.destroyed = true;
      target.captured = false;
      target.capturedBy = null;
      target.x = null;
      target.y = null;
    }

    unit.x = pending.x;
    unit.y = pending.y;
    this.tutorial.notify('capture-resolved');
    this.finishMove();
  }

  finishMove() {
    this.state.clearSelection();
    this.checkEnd();
    if (!this.state.finished) this.state.changeTurn();
    this.render();
  }

  checkEnd() {
    const playerUnits = this.state.units.filter(unit => this.state.active(unit) && unit.team === 'player');
    const enemyUnits = this.state.units.filter(unit => this.state.active(unit) && unit.team === 'enemy');
    if (!playerUnits.length) this.finish('enemy');
    else if (!enemyUnits.length) this.finish('player');
  }

  finish(winner) {
    if (this.state.finished) return;
    this.state.finished = true;

    const playerRecruits = this.state.unresolvedPrisoners().filter(unit => unit.capturedBy === 'player');
    const enemyRecruits = this.state.unresolvedPrisoners().filter(unit => unit.capturedBy === 'enemy');
    playerRecruits.forEach(unit => { unit.recruitedBy = 'player'; });
    enemyRecruits.forEach(unit => { unit.recruitedBy = 'enemy'; });

    if (winner === 'player') {
      this.progression.completeLevel(this.level.id, {
        nextLevelId: this.level.nextLevelId,
        recruitedUnitIds: playerRecruits.map(unit => unit.id)
      });
    }

    this.render();
    this.showResult(winner, playerRecruits, enemyRecruits);
  }

  showResult(winner, playerRecruits, enemyRecruits) {
    this.resultContent.innerHTML = '';
    const card = document.createElement('section');
    card.className = 'modal-card end-card';

    const title = document.createElement('h2');
    title.textContent = `Gana ${this.factionName(winner)}`;

    const explanation = document.createElement('p');
    explanation.textContent = 'Las piezas congeladas que siguen en el tablero pasan a la banda que las capturó.';

    const grid = document.createElement('div');
    grid.className = 'results-grid';
    grid.append(
      this.recruitColumn(`${this.factionName('player')} incorpora`, playerRecruits),
      this.recruitColumn(`${this.factionName('enemy')} incorpora`, enemyRecruits)
    );

    const actions = document.createElement('div');
    actions.className = 'result-actions';

    const replay = document.createElement('button');
    replay.type = 'button';
    replay.className = 'primary-button';
    replay.textContent = 'Jugar otra vez';
    replay.addEventListener('click', () => this.resetLevel());
    actions.append(replay);

    const nextLevel = winner === 'player' ? getNextLevel(this.level) : null;
    if (nextLevel) {
      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'primary-button';
      next.textContent = 'Siguiente nivel';
      next.addEventListener('click', () => this.loadLevel(nextLevel));
      actions.append(next);
    }

    card.append(title, explanation, grid, actions);
    this.resultContent.append(card);
    if (!this.resultDialog.open) this.resultDialog.showModal();
  }

  recruitColumn(titleText, pieces) {
    const column = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = titleText;
    column.append(title);

    if (!pieces.length) {
      const empty = document.createElement('p');
      empty.textContent = 'Ninguna.';
      column.append(empty);
      return column;
    }

    const list = document.createElement('ul');
    for (const piece of pieces) {
      const item = document.createElement('li');
      item.textContent = `${piece.fallbackGlyph} ${piece.name}`;
      list.append(item);
    }
    column.append(list);
    return column;
  }

  factionName(team) {
    const factionId = this.level.teams[team];
    return FACTIONS[factionId]?.name ?? team;
  }
}

new GameApp().start();
