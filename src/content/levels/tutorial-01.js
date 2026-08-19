import { createInitialBand } from '../bands.js';

const PLAYER_POSITIONS = Object.freeze({
  king: { x: 2, y: 7 },
  queen: { x: 3, y: 7 },
  pawn: { x: 3, y: 6 },
  bishop: { x: 0, y: 7 },
  knight: { x: 0, y: 7 },
  rook: { x: 0, y: 7 }
});

const ENEMY_POSITIONS = Object.freeze({
  king: { x: 5, y: 0 },
  queen: { x: 4, y: 0 },
  pawn: { x: 4, y: 1 },
  bishop: { x: 6, y: 0 }
});

export function createTutorial01({ playerFactionId = 'green' } = {}) {
  return Object.freeze({
  id: 'tutorial-01',
  name: 'Tutorial',
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
    player: playerFactionId,
    enemy: 'green'
  },
  music: {
    track: './assets/music/magiksolo-pirate-tavern-full-version-167990.mp3',
    volume: 0.45,
    loop: true
  },
  ai: {
    team: 'enemy',
    depth: 2,
    thinkDelayMs: 450
  },
  rules: {
    victory: 'elimination',
    captureChoice: true
  },
  units: [
    ...createInitialBand({ team: 'player', factionId: playerFactionId, positions: PLAYER_POSITIONS }),
    ...createInitialBand({ team: 'enemy', factionId: 'green', positions: ENEMY_POSITIONS })
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
        anchor: { type: 'unit', id: 'player-king' },
        advanceOn: 'unit-selected'
      },
      {
        id: 'move-piece',
        text: 'Las casillas verdes son movimientos disponibles. Toca una para mover.',
        anchor: { type: 'cell', x: 2, y: 6 },
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
}

export const tutorial01 = createTutorial01();
