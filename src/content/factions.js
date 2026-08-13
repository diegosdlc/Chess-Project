export const FACTIONS = Object.freeze({
  verdant: {
    id: 'verdant',
    name: 'Guardia del Roble',
    palette: {
      primary: '#6d8574',
      secondary: '#253229',
      text: '#f7f7f4'
    },
    // Add faction-specific piece artwork here when it exists.
    // Example: rook: './assets/pieces/verdant/rook.webp'
    pieceAssets: {}
  },
  cinder: {
    id: 'cinder',
    name: 'Banda de Ceniza',
    palette: {
      primary: '#9f5252',
      secondary: '#461818',
      text: '#f7f7f4'
    },
    pieceAssets: {}
  }
});

export function getFaction(factionId) {
  return FACTIONS[factionId] ?? null;
}
