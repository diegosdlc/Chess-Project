export const EVOLUTION_STAGES = Object.freeze({
  BASE: 'base',
  EVOLVED: 'evolved'
});

const EMPTY_CAPABILITIES = Object.freeze({});

const EVOLUTION_PROFILES = Object.freeze({
  pawn: Object.freeze({
    capabilities: Object.freeze({
      moveProfile: 'evolved-pawn'
    }),
    shouldEvolve({ level, unit, event }) {
      if (event.type !== 'move-completed') return false;
      const oppositeEdge = unit.team === 'player' ? 0 : (level.board.size ?? 8) - 1;
      return event.y === oppositeEdge;
    }
  })
});

export function normalizeEvolutionStage(unit) {
  if (!unit.evolutionProfile) return null;
  return unit.evolutionStage === EVOLUTION_STAGES.EVOLVED
    ? EVOLUTION_STAGES.EVOLVED
    : EVOLUTION_STAGES.BASE;
}

export function isEvolved(unit) {
  return unit?.evolutionStage === EVOLUTION_STAGES.EVOLVED;
}

export function evolutionCapabilitiesFor(unit) {
  if (!isEvolved(unit)) return EMPTY_CAPABILITIES;
  return EVOLUTION_PROFILES[unit.evolutionProfile]?.capabilities ?? EMPTY_CAPABILITIES;
}

export function moveProfileFor(unit) {
  return evolutionCapabilitiesFor(unit).moveProfile ?? unit?.moveProfile;
}

export function applyEvolutionEvent({ state, level, unit, event }) {
  if (!unit?.evolutionProfile || isEvolved(unit)) return false;
  const profile = EVOLUTION_PROFILES[unit.evolutionProfile];
  if (!profile?.shouldEvolve({ state, level, unit, event })) return false;
  unit.evolutionStage = EVOLUTION_STAGES.EVOLVED;
  return true;
}
