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
