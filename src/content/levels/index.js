import { tutorial01 } from './tutorial-01.js';

const LEVELS = new Map([
  [tutorial01.id, tutorial01]
]);

export function getLevel(levelId) {
  return LEVELS.get(levelId) ?? null;
}

export function listLevels() {
  return [...LEVELS.values()];
}

export function getNextLevel(level) {
  return level?.nextLevelId ? getLevel(level.nextLevelId) : null;
}
