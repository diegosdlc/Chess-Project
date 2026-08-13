export const tutorial01 = Object.freeze({
  id: 'tutorial-01',
  name: 'Encuentro en el bosque',
  nextLevelId: null,
  board: {
    size: 8,
    artwork: './assets/boards/Tablero (20260812071431).webp',
    projection: {
      width: 940,
      height: 580,
      origin: { x: 466, y: 44 },
      xAxis: { x: 53.75, y: 31.5 },
      yAxis: { x: -53.625, y: 31.375 }
    },
    artworkFrame: {
      width: '163.404255%',
      height: '171.724138%',
      left: '-26.595745%',
      top: '-51.724138%'
    }
  },
  teams: {
    player: 'verdant',
    enemy: 'cinder'
  },
  music: {
    track: null,
    volume: 0.45,
    loop: true
  },
  rules: {
    victory: 'elimination',
    captureChoice: true
  },
  units: [
    { id: 'warden', team: 'player', faction: 'verdant', name: 'Guardia del Roble', pieceType: 'rook', fallbackGlyph: '♜', x: 1, y: 6, moveProfile: 'orthogonal' },
    { id: 'seer', team: 'player', faction: 'verdant', name: 'Vidente de Musgo', pieceType: 'bishop', fallbackGlyph: '♝', x: 3, y: 7, moveProfile: 'diagonal' },
    { id: 'scout', team: 'player', faction: 'verdant', name: 'Exploradora', pieceType: 'pawn', fallbackGlyph: '♟', x: 5, y: 6, moveProfile: 'pawn' },
    { id: 'brute', team: 'enemy', faction: 'cinder', name: 'Bruto de Ceniza', pieceType: 'rook', fallbackGlyph: '♜', x: 6, y: 1, moveProfile: 'orthogonal' },
    { id: 'hexer', team: 'enemy', faction: 'cinder', name: 'Tejedora Escarlata', pieceType: 'bishop', fallbackGlyph: '♝', x: 4, y: 0, moveProfile: 'diagonal' },
    { id: 'raider', team: 'enemy', faction: 'cinder', name: 'Saqueador', pieceType: 'pawn', fallbackGlyph: '♟', x: 2, y: 1, moveProfile: 'pawn' }
  ],
  // Blocking elements participate in movement rules. Add an `asset` path to render artwork.
  boardElements: [],
  // Special tiles are visual/content hooks for future mechanics and can also use assets.
  specialTiles: [],
  tutorial: {
    enabledByDefault: false,
    steps: [
      {
        id: 'select-piece',
        text: 'Toca una de tus piezas para ver sus movimientos posibles.',
        anchor: { type: 'unit', id: 'warden' },
        advanceOn: 'unit-selected'
      },
      {
        id: 'move-piece',
        text: 'Las casillas verdes son movimientos disponibles. Toca una para mover.',
        anchor: { type: 'cell', x: 1, y: 5 },
        advanceOn: 'move-completed'
      },
      {
        id: 'capture-choice',
        text: 'Al atacar una pieza puedes capturarla o destruirla desde los botones que emergen de ella.',
        anchor: { type: 'board' },
        advanceOn: 'capture-resolved'
      }
    ]
  }
});
