export class ProgressionStore {
  constructor(storageKey, defaultLevelId) {
    this.storageKey = storageKey;
    this.defaultLevelId = defaultLevelId;
    this.state = this.load();
  }

  load() {
    const fallback = {
      completedLevelIds: [],
      unlockedLevelIds: [this.defaultLevelId],
      recruitedUnitIds: [],
      playerBand: null
    };

    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey));
      if (!saved) return fallback;
      return {
        completedLevelIds: saved.completedLevelIds ?? [],
        unlockedLevelIds: saved.unlockedLevelIds?.length ? saved.unlockedLevelIds : fallback.unlockedLevelIds,
        recruitedUnitIds: saved.recruitedUnitIds ?? [],
        playerBand: Array.isArray(saved.playerBand) ? saved.playerBand : null
      };
    } catch {
      return fallback;
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch {
      // Storage is optional; gameplay should continue in restricted contexts.
    }
  }

  completeLevel(levelId, { nextLevelId = null, recruitedUnitIds = [], playerBand = null } = {}) {
    this.state.completedLevelIds = unique([...this.state.completedLevelIds, levelId]);
    if (nextLevelId) {
      this.state.unlockedLevelIds = unique([...this.state.unlockedLevelIds, nextLevelId]);
    }
    this.state.recruitedUnitIds = unique([...this.state.recruitedUnitIds, ...recruitedUnitIds]);
    if (Array.isArray(playerBand)) this.state.playerBand = playerBand;
    this.save();
  }

  getPlayerBand() {
    return Array.isArray(this.state.playerBand) ? this.state.playerBand : null;
  }
}

function unique(values) {
  return [...new Set(values)];
}
