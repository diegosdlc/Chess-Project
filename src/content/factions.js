export const FACTIONS = Object.freeze({
  verdant: {
    id: 'verdant',
    name: 'Guardia del Roble',
    palette: {
      primary: '#6d8574',
      secondary: '#253229',
      text: '#f7f7f4'
    },
    pieceAssets: {
      rook: './assets/pieces/paper/rook.png',
      bishop: './assets/pieces/paper/bishop.png',
      pawn: './assets/pieces/paper/pawn.png'
    }
  },
  cinder: {
    id: 'cinder',
    name: 'Banda de Ceniza',
    palette: {
      primary: '#9f5252',
      secondary: '#461818',
      text: '#f7f7f4'
    },
    pieceAssets: {
      rook: './assets/pieces/paper/rook.png',
      bishop: './assets/pieces/paper/bishop.png',
      pawn: './assets/pieces/paper/pawn.png'
    }
  }
});

export function getFaction(factionId) {
  return FACTIONS[factionId] ?? null;
}
