import { GAME_CONFIG } from './config/gameConfig.js';
import { FACTIONS } from './content/factions.js';
import { getLevel, getNextLevel } from './content/levels/index.js';
import { GameState } from './core/GameState.js';
import { AssetRegistry } from './systems/AssetRegistry.js';
import { AudioManager } from './systems/AudioManager.js';
import { ProgressionStore } from './systems/ProgressionStore.js';
import { TutorialSystem } from './systems/TutorialSystem.js';
import { BoardRenderer } from './render/BoardRenderer.js';
import { AIController } from './ai/AIController.js';
import { legalActionsFor } from './core/rules.js';

class GameSessionStore {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey));
      return saved?.levelId && saved?.state ? saved : null;
    } catch {
      return null;
    }
  }

  save(levelId, state) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        levelId,
        state: { units: state.units, currentTurn: state.currentTurn, finished: state.finished }
      }));
    } catch {
      // Storage is optional.
    }
  }

  clear() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Storage is optional.
    }
  }
}

class GameApp {
  constructor() {
    this.board = document.querySelector('#board');
    this.gameShell = document.querySelector('#game-shell');
    this.homeScreen = document.querySelector('#home-screen');
    this.resultDialog = document.querySelector('#result-dialog');
    this.resultContent = document.querySelector('#result-content');
    this.settingsDialog = document.querySelector('#settings-dialog');
    this.assets = new AssetRegistry(FACTIONS);
    this.audio = new AudioManager();
    this.progression = new ProgressionStore(GAME_CONFIG.progressionStorageKey, GAME_CONFIG.defaultLevelId);
    this.session = new GameSessionStore(GAME_CONFIG.sessionStorageKey ?? 'bandas-del-tablero:session:v1');
    this.tutorial = new TutorialSystem({ storagePrefix: GAME_CONFIG.tutorialStoragePrefix });
    this.level = null;
    this.state = null;
    this.renderer = null;
    this.ai = null;
    this.aiTimer = null;
  }

  start() {
    const params = new URLSearchParams(location.search);
    const requestedLevelId = params.get(GAME_CONFIG.levelQueryParam);
    const forceTutorial = params.get(GAME_CONFIG.tutorialQueryParam) === '1';
    this.bindMenu();
    if (requestedLevelId) this.startGame(getLevel(requestedLevelId) ?? getLevel(GAME_CONFIG.defaultLevelId), { forceTutorial });
    else this.showHome();

    document.addEventListener('keydown', event => {
      if (this.state && (event.key === 'r' || event.key === 'R') && !this.state.pendingCapture) this.resetLevel();
    });

    document.addEventListener('pointerdown', () => this.audio.unlock(), { once: true, passive: true });
  }

  bindMenu() {
    document.querySelector('#new-game').addEventListener('click', () => { this.session.clear(); this.startGame(getLevel(GAME_CONFIG.defaultLevelId)); });
    document.querySelector('#continue-game').addEventListener('click', () => this.continueGame());
    document.querySelector('#home-settings').addEventListener('click', () => this.openSettings());
    document.querySelector('#game-settings').addEventListener('click', () => this.openSettings());
    document.querySelector('#close-settings').addEventListener('click', () => this.settingsDialog.close());
  }

  showHome() {
    this.cancelAiTurn();
    this.gameShell.hidden = true;
    this.homeScreen.hidden = false;
    document.querySelector('#continue-game').disabled = !this.session.load();
  }

  startGame(level, options = {}) {
    this.homeScreen.hidden = true;
    this.gameShell.hidden = false;
    this.loadLevel(level, options);
  }

  continueGame() {
    const saved = this.session.load();
    const level = saved && getLevel(saved.levelId);
    if (!level) { this.session.clear(); this.showHome(); return; }
    this.startGame(level, { savedState: saved.state });
  }

  openSettings() {
    if (!this.settingsDialog.open) this.settingsDialog.showModal();
  }

  loadLevel(level, { forceTutorial = false, savedState = null } = {}) {
    if (!level) throw new Error('No hay ningún nivel disponible.');
    this.cancelAiTurn();
    this.level = level;
    this.state = new GameState(level);
    if (savedState) this.restoreSavedState(savedState);
    this.ai = level.ai ? new AIController(level.ai) : null;
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
    this.resolveTurn();
    this.saveSession();
  }

  restoreSavedState(savedState) {
    if (!Array.isArray(savedState.units)) return;
    this.state.units = savedState.units;
    this.state.currentTurn = savedState.currentTurn === 'enemy' ? 'enemy' : 'player';
    this.state.finished = Boolean(savedState.finished);
    this.state.selectedId = null;
    this.state.pendingCapture = null;
  }

  saveSession() {
    if (this.level && this.state && !this.state.finished) this.session.save(this.level.id, this.state);
  }

  resetLevel() {
    this.cancelAiTurn();
    this.state.reset();
    this.saveSession();
    if (this.resultDialog.open) this.resultDialog.close();
    this.resolveTurn();
  }

  render() {
    this.renderer.render();
    this.tutorial.render(this.board, anchor => this.renderer.resolveTutorialAnchor(anchor));
  }

  cellClick(option, unit) {
    if (this.state.finished || this.state.pendingCapture || this.ai?.isTurn(this.state)) return;
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
    if (!this.state.finished) {
      this.state.changeTurn();
      this.saveSession();
      this.resolveTurn();
    }
  }

  resolveTurn() {
    this.cancelAiTurn();
    if (this.state.finished) return;

    if (legalActionsFor(this.state, this.level).length) {
      this.render();
      this.scheduleAiTurn();
      return;
    }

    const skippedTeam = this.state.currentTurn;
    this.state.clearSelection();
    this.state.changeTurn();
    if (legalActionsFor(this.state, this.level).length) {
      this.render();
      this.showTurnPassed(skippedTeam);
      return;
    }

    this.finishDraw();
  }

  showTurnPassed(team) {
    this.resultContent.innerHTML = '';
    const card = document.createElement('section');
    card.className = 'modal-card end-card';
    const title = document.createElement('h2');
    title.textContent = 'Turno perdido';
    const explanation = document.createElement('p');
    explanation.textContent = `${this.factionName(team)} no tiene movimientos legales y pierde el turno.`;

    const actions = document.createElement('div');
    actions.className = 'result-actions';
    const continueTurn = document.createElement('button');
    continueTurn.type = 'button';
    continueTurn.className = 'primary-button';
    continueTurn.textContent = 'Continuar';
    continueTurn.addEventListener('click', () => {
      if (this.resultDialog.open) this.resultDialog.close();
      this.render();
      this.scheduleAiTurn();
    });
    actions.append(continueTurn);

    card.append(title, explanation, actions);
    this.resultContent.append(card);
    if (!this.resultDialog.open) this.resultDialog.showModal();
  }

  scheduleAiTurn() {
    this.cancelAiTurn();
    if (!this.ai?.isTurn(this.state)) return;

    this.aiTimer = window.setTimeout(() => {
      this.aiTimer = null;
      this.playAiTurn();
    }, this.ai.thinkDelayMs);
  }

  cancelAiTurn() {
    if (this.aiTimer != null) window.clearTimeout(this.aiTimer);
    this.aiTimer = null;
  }

  playAiTurn() {
    if (!this.ai?.isTurn(this.state)) return;
    const action = this.ai.chooseAction(this.state, this.level);
    if (!action) {
      this.resolveTurn();
      return;
    }

    const unit = this.state.units.find(piece => piece.id === action.unitId);
    if (!unit || !this.state.active(unit)) return;

    if (action.kind === 'move') {
      this.moveUnit(unit, action);
      return;
    }

    const target = this.state.units.find(piece => piece.id === action.targetId);
    if (!target || !this.state.active(target)) return;
    this.state.leaveOrigin(unit);

    if (action.kind === 'capture') {
      target.captured = true;
      target.destroyed = false;
      target.capturedBy = unit.team;
      target.x = action.x;
      target.y = action.y;
    } else {
      target.destroyed = true;
      target.captured = false;
      target.capturedBy = null;
      target.x = null;
      target.y = null;
    }

    unit.x = action.x;
    unit.y = action.y;
    this.finishMove();
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
    this.session.clear();

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

  finishDraw() {
    if (this.state.finished) return;
    this.state.finished = true;
    this.session.clear();
    this.cancelAiTurn();
    this.render();

    this.resultContent.innerHTML = '';
    const card = document.createElement('section');
    card.className = 'modal-card end-card';
    const title = document.createElement('h2');
    title.textContent = 'Tablas';
    const explanation = document.createElement('p');
    explanation.textContent = 'Ninguna banda tiene movimientos legales.';

    const actions = document.createElement('div');
    actions.className = 'result-actions';
    const restart = document.createElement('button');
    restart.type = 'button';
    restart.className = 'primary-button';
    restart.textContent = 'Reiniciar encuentro';
    restart.addEventListener('click', () => this.resetLevel());
    actions.append(restart);

    card.append(title, explanation, actions);
    this.resultContent.append(card);
    if (!this.resultDialog.open) this.resultDialog.showModal();
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
