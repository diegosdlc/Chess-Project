export class AssetRegistry {
  constructor(factions) {
    this.factions = factions;
  }

  faction(factionId) {
    return this.factions[factionId] ?? null;
  }

  pieceAsset(unit) {
    return this.faction(unit.faction)?.pieceAssets?.[unit.pieceType] ?? null;
  }

  piecePalette(unit) {
    return this.faction(unit.faction)?.palette ?? null;
  }

  resolve(path) {
    if (!path) return null;
    return new URL(path, document.baseURI).href;
  }
}
