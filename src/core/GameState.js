const NEXT_TEAM = Object.freeze({ player: 'enemy', enemy: 'player' });
const OPPOSITE_FACING = Object.freeze({ north: 'south', south: 'north' });

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export class GameState {
  constructor(level) {
    this.level = level;
    this.reset();
  }

  reset() {
    this.units = clone(this.level.units).map(unit => ({
      ...unit,
      captured: false,
      destroyed: false,
      capturedBy: null,
      recruitedBy: null
    }));
    this.selectedId = null;
    this.currentTurn = 'player';
    this.finished = false;
    this.pendingCapture = null;
    this.phase = this.level.deployment ? 'deployment' : 'play';

    if (this.isDeploying()) {
      const team = this.deploymentTeam();
      this.units
        .filter(unit => unit.team === team)
        .forEach(unit => {
          unit.x = null;
          unit.y = null;
        });
    }
  }

  active(unit) {
    return Boolean(unit && !unit.captured && !unit.destroyed);
  }

  activeAt(x, y) {
    return this.units.find(unit => this.active(unit) && unit.x === x && unit.y === y) ?? null;
  }

  prisonersAt(x, y) {
    return this.units.filter(unit => unit.captured && !unit.destroyed && unit.x === x && unit.y === y);
  }

  selected() {
    return this.units.find(unit => unit.id === this.selectedId) ?? null;
  }

  unresolvedPrisoners() {
    return this.units.filter(unit => unit.captured && !unit.destroyed);
  }

  setSelected(unitId) {
    this.selectedId = unitId;
  }

  clearSelection() {
    this.selectedId = null;
  }

  setFacing(unit, facing) {
    if (!unit || !OPPOSITE_FACING[facing]) return false;
    unit.facing = facing;
    return true;
  }

  turnAround(unit) {
    if (!unit || !OPPOSITE_FACING[unit.facing]) return false;
    unit.facing = OPPOSITE_FACING[unit.facing];
    return true;
  }

  isDeploying() {
    return this.phase === 'deployment';
  }

  deploymentTeam() {
    return this.level.deployment?.team ?? 'player';
  }

  deploymentRows() {
    return Array.isArray(this.level.deployment?.rows) ? this.level.deployment.rows : [];
  }

  deploymentUnits() {
    const team = this.deploymentTeam();
    return this.units.filter(unit => this.active(unit) && unit.team === team);
  }

  isDeploymentCell(x, y) {
    const size = this.level.board.size ?? 8;
    return Number.isInteger(x) && Number.isInteger(y) &&
      x >= 0 && x < size && y >= 0 && y < size &&
      this.deploymentRows().includes(y);
  }

  deploymentCellBlocked(x, y, ignoredUnitId = null) {
    const occupied = this.activeAt(x, y);
    if (occupied && occupied.id !== ignoredUnitId) return true;
    return (this.level.boardElements ?? []).some(element => element.blocking && element.x === x && element.y === y);
  }

  canDeployAt(unit, x, y) {
    if (!this.isDeploying() || !unit || unit.team !== this.deploymentTeam()) return false;
    if (!this.isDeploymentCell(x, y)) return false;
    return !this.deploymentCellBlocked(x, y, unit.id);
  }

  placeDeploymentUnit(unit, x, y) {
    if (!this.canDeployAt(unit, x, y)) return false;
    unit.x = x;
    unit.y = y;
    return true;
  }

  deploymentComplete() {
    const units = this.deploymentUnits();
    if (!units.length) return false;
    if (!units.every(unit => this.isDeploymentCell(unit.x, unit.y) && !this.deploymentCellBlocked(unit.x, unit.y, unit.id))) return false;
    const occupiedCells = new Set(units.map(unit => `${unit.x},${unit.y}`));
    return occupiedCells.size === units.length;
  }

  beginPlay() {
    if (!this.isDeploying() || !this.deploymentComplete()) return false;
    this.phase = 'play';
    this.currentTurn = 'player';
    this.clearSelection();
    return true;
  }

  releaseFriendlyPrisonerFrom(x, y, team) {
    if (x == null || y == null) return;
    this.prisonersAt(x, y)
      .filter(piece => piece.team === team)
      .forEach(piece => {
        piece.captured = false;
        piece.capturedBy = null;
      });
  }

  leaveOrigin(unit) {
    const originX = unit.x;
    const originY = unit.y;
    this.level.behavior?.beforeLeaveOrigin?.({ state: this, unit, x: originX, y: originY });
    unit.x = null;
    unit.y = null;
    this.releaseFriendlyPrisonerFrom(originX, originY, unit.team);
  }

  changeTurn() {
    if (this.level.behavior?.beforeChangeTurn?.({ state: this }) === false) return;
    this.currentTurn = NEXT_TEAM[this.currentTurn];
  }
}
