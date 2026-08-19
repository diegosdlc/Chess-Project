export class AssetRegistry {
  constructor(factions) {
    this.factions = factions;
  }

  faction(factionId) {
    return this.factions[factionId] ?? null;
  }

  pieceAsset(unit) {
    const asset = this.faction(unit.faction)?.pieceAssets?.[unit.pieceType] ?? null;
    if (!asset) return null;
    if (typeof asset === 'string') return asset;
    return asset?.[unit.facing] ?? null;
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
