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
    const faction = this.faction(unit.faction);
    return faction?.palettes?.[unit.team] ?? faction?.palette ?? null;
  }

  resolve(path) {
    if (!path) return null;
    return new URL(path, document.baseURI).href;
  }
}
