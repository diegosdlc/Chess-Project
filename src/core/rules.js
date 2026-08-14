export function inside(level, x, y) {
  const size = level.board.size ?? 8;
  return x >= 0 && x < size && y >= 0 && y < size;
}

export function blockingElementAt(level, x, y) {
  return level.boardElements?.find(element => element.blocking && element.x === x && element.y === y) ?? null;
}

function squareOption(state, level, unit, x, y) {
  if (blockingElementAt(level, x, y)) return null;

  const occupant = state.activeAt(x, y);
  if (occupant) return occupant.team !== unit.team ? { x, y, kind: 'capture' } : null;

  const frozen = state.prisonersAt(x, y);
  if (!frozen.length) return { x, y, kind: 'move' };
  if (frozen.some(piece => piece.team === unit.team)) return { x, y, kind: 'move-frozen' };
  return null;
}

function blocksLineMovement(state, level, x, y) {
  return Boolean(blockingElementAt(level, x, y) || state.activeAt(x, y));
}

function validLineMoves(state, level, unit, directions) {
  const moves = [];
  const maxSteps = (level.board.size ?? 8) - 1;

  for (const [dx, dy] of directions) {
    for (let step = 1; step <= maxSteps; step += 1) {
      const x = unit.x + dx * step;
      const y = unit.y + dy * step;
      if (!inside(level, x, y)) break;

      const option = squareOption(state, level, unit, x, y);
      if (option) moves.push(option);
      if (blocksLineMovement(state, level, x, y)) break;
    }
  }

  return moves;
}

function pawnMoves(state, level, unit) {
  const moves = [];
  const dy = unit.team === 'player' ? -1 : 1;
  const forwardY = unit.y + dy;

  if (
    inside(level, unit.x, forwardY) &&
    !blockingElementAt(level, unit.x, forwardY) &&
    !state.activeAt(unit.x, forwardY)
  ) {
    const frozen = state.prisonersAt(unit.x, forwardY);
    if (!frozen.length) moves.push({ x: unit.x, y: forwardY, kind: 'move' });
    else if (frozen.some(piece => piece.team === unit.team)) {
      moves.push({ x: unit.x, y: forwardY, kind: 'move-frozen' });
    }
  }

  for (const dx of [-1, 1]) {
    const x = unit.x + dx;
    const y = unit.y + dy;
    if (!inside(level, x, y) || blockingElementAt(level, x, y)) continue;
    const target = state.activeAt(x, y);
    if (target && target.team !== unit.team) moves.push({ x, y, kind: 'capture' });
  }

  return moves;
}

export function optionsFor(state, level, unit) {
  if (!unit || !state.active(unit) || unit.team !== state.currentTurn) return [];

  switch (unit.moveProfile) {
    case 'orthogonal':
      return validLineMoves(state, level, unit, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
    case 'diagonal':
      return validLineMoves(state, level, unit, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
    case 'pawn':
      return pawnMoves(state, level, unit);
    default:
      return [];
  }
}

export function legalActionsFor(state, level) {
  const actions = [];
  for (const unit of state.units) {
    if (!state.active(unit) || unit.team !== state.currentTurn) continue;

    for (const option of optionsFor(state, level, unit)) {
      if (option.kind === 'capture') {
        const target = state.activeAt(option.x, option.y);
        if (!target) continue;
        actions.push({ unitId: unit.id, targetId: target.id, kind: 'capture', x: option.x, y: option.y });
        actions.push({ unitId: unit.id, targetId: target.id, kind: 'destroy', x: option.x, y: option.y });
      } else {
        actions.push({ unitId: unit.id, kind: 'move', x: option.x, y: option.y });
      }
    }
  }
  return actions;
}
