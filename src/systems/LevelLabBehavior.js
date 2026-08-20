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

  shouldChangeTurn() {
    if (!this.enabled()) return true;
    return this.config.keepPlayerTurn !== true;
  }
}
