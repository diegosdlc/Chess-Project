import { createFacingLab, facingLab } from './facing-lab.js';
import { createTutorial01, tutorial01 } from './tutorial-01.js';

const LEVEL_FACTORIES = new Map([
  [tutorial01.id, createTutorial01],
  [facingLab.id, createFacingLab]
]);

export function getLevel(levelId, options = {}) {
  const createLevel = LEVEL_FACTORIES.get(levelId);
  return createLevel ? createLevel(options) : null;
}

export function listLevels() {
  return [...LEVEL_FACTORIES.keys()].map(levelId => getLevel(levelId));
}

export function getNextLevel(level) {
  return level?.nextLevelId ? getLevel(level.nextLevelId, { playerFactionId: level.teams.player }) : null;
}
