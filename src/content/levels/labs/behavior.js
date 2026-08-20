export function createLabBehavior({ flipFacingOnMove = false, keepPlayerTurn = false } = {}) {
  return Object.freeze({
    beforeLeaveOrigin({ state, unit }) {
      if (flipFacingOnMove) state.turnAround(unit);
    },
    beforeChangeTurn() {
      return keepPlayerTurn ? false : true;
    }
  });
}
