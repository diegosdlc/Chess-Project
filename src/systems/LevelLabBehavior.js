export class LevelLabBehavior {
  constructor(level) {
    this.config = level?.lab ?? null;
  }

  enabled() {
    return Boolean(this.config?.enabled);
  }

  beforeLeaveOrigin({ state, unit }) {
    if (!this.enabled()) return;
    if (this.config.flipFacingOnMove) state.turnAround(unit);
  }

  changeTurn(state) {
    if (!state) return;
    if (this.enabled() && this.config.keepPlayerTurn === true) return;
    state.changeTurn();
  }
}
