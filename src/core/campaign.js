import { evolveSurvivingBand } from './evolution.js?v=20260821-evolution-2';

export function buildNextPlayerBand(units, levelId) {
  const survivors = units.filter(unit => !unit.captured && !unit.destroyed && unit.team === 'player');
  const recruits = units.filter(unit => unit.captured && !unit.destroyed && unit.capturedBy === 'player');
  const members = [...survivors, ...recruits].map(unit => {
    const recruited = unit.team !== 'player';
    return {
      ...unit,
      id: recruited ? `player-recruit-${levelId}-${unit.id}` : unit.id,
      team: 'player',
      captured: false,
      destroyed: false,
      capturedBy: null,
      recruitedBy: recruited ? 'player' : unit.recruitedBy,
      evolutionState: undefined
    };
  });
  return evolveSurvivingBand(members);
}
