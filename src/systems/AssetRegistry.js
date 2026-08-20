export class AssetRegistry {
  constructor(factions) {
    this.factions = factions;
  }

  faction(factionId) {
    return this.factions[factionId] ?? null;
  }

  pieceAsset(unit) {
    const unitArtwork = unit.pieceAssets;
    if (typeof unitArtwork === 'string') return unitArtwork;
    if (unitArtwork) return unitArtwork[unit.facing] ?? null;

    const artwork = this.faction(unit.faction)?.pieceAssets?.[unit.pieceType];
    if (typeof artwork === 'string') return artwork;
    return artwork?.[unit.facing] ?? null;
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
