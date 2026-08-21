import { evolveSurvivingBand } from './evolution.js?v=20260821-evolution-3';

export function buildNextPlayerBand(units, levelId) {
  const survivors = units.filter(unit => !unit.captured && !unit.destroyed && unit.team === 'player');
  const recruits = units.filter(unit => unit.captured && !unit.destroyed && unit.capturedBy === 'player');
  const evolvedSurvivors = evolveSurvivingBand(survivors.map(unit => ({
    ...unit,
    captured: false,
    destroyed: false,
    capturedBy: null,
    evolutionState: undefined
  })));
  const newRecruits = recruits.map(unit => ({
    ...unit,
    id: `player-recruit-${levelId}-${unit.id}`,
    team: 'player',
    captured: false,
    destroyed: false,
    capturedBy: null,
    recruitedBy: 'player',
    evolutionState: undefined
  }));
  return [...evolvedSurvivors, ...newRecruits];
}
