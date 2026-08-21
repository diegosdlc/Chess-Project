export const EVOLUTION_STAGES = Object.freeze({
  BASE: 'base',
  EVOLVED: 'evolved'
});

const EMPTY_CAPABILITIES = Object.freeze({});

const EVOLUTION_PROFILES = Object.freeze({
  pawn: Object.freeze({
    capabilities: Object.freeze({ moveProfile: 'evolved-pawn' }),
    shouldEvolve({ level, unit, event }) {
      if (event.type !== 'move-completed') return false;
      const oppositeEdge = unit.team === 'player' ? 0 : (level.board.size ?? 8) - 1;
      return event.y === oppositeEdge;
    }
  }),
  knight: Object.freeze({
    capabilities: Object.freeze({ deploymentDepth: 4 })
  }),
  bishop: Object.freeze({
    capabilities: Object.freeze({ moveProfile: 'evolved-bishop' })
  }),
  rook: Object.freeze({
    capabilities: Object.freeze({ rejectsFirstAttack: true }),
    initialState: Object.freeze({ shieldCharges: 1 })
  }),
  royal: Object.freeze({
    capabilities: Object.freeze({ royalSwap: true })
  })
});

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export function normalizeEvolutionStage(unit) {
  if (!unit?.evolutionProfile) return null;
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

export function initialEvolutionState(unit) {
  if (!isEvolved(unit)) return null;
  const defaults = EVOLUTION_PROFILES[unit.evolutionProfile]?.initialState ?? EMPTY_CAPABILITIES;
  return { ...clone(defaults), ...clone(unit.evolutionState ?? {}) };
}

export function activateEvolution(unit) {
  if (!unit?.evolutionProfile) return false;
  unit.evolutionStage = EVOLUTION_STAGES.EVOLVED;
  unit.evolutionState = initialEvolutionState(unit);
  return true;
}

export function applyEvolutionEvent({ state, level, unit, event }) {
  if (!unit?.evolutionProfile || isEvolved(unit)) return false;
  const profile = EVOLUTION_PROFILES[unit.evolutionProfile];
  if (!profile?.shouldEvolve?.({ state, level, unit, event })) return false;
  return activateEvolution(unit);
}

export function evolveSurvivingBand(units) {
  const survivors = clone(units ?? []);
  const royalPairSurvived = survivors.some(unit => unit.pieceType === 'king') &&
    survivors.some(unit => unit.pieceType === 'queen');

  survivors.forEach(unit => {
    delete unit.evolutionState;
    const isRoyal = unit.evolutionProfile === 'royal';
    if (!isRoyal || royalPairSurvived) activateEvolution(unit);
  });
  return survivors;
}

export function createTeamEvolutionState(units) {
  const state = {};
  for (const team of ['player', 'enemy']) {
    const king = units.find(unit => unit.team === team && unit.pieceType === 'king' && isEvolved(unit));
    const queen = units.find(unit => unit.team === team && unit.pieceType === 'queen' && isEvolved(unit));
    state[team] = { royalSwapCharges: king && queen ? 1 : 0 };
  }
  return state;
}
