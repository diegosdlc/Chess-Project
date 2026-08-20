import { PIECES } from '../bands.js';

const BOARD = Object.freeze({
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
});

const TEST_ART = Object.freeze({
  bishop: {
    north: './assets/pieces/facing-lab/bishop-north.svg',
    south: './assets/pieces/facing-lab/bishop-south.svg'
  },
  rook: {
    north: './assets/pieces/facing-lab/rook-north.svg',
    south: './assets/pieces/facing-lab/rook-south.svg'
  },
  knight: {
    north: './assets/pieces/facing-lab/knight-north.svg',
    south: './assets/pieces/facing-lab/knight-south.svg'
  }
});

function unit({ id, faction, pieceType, facing, x, y }) {
  const piece = PIECES[pieceType];
  return {
    id,
    team: 'player',
    faction,
    name: `${piece.name} ${faction}`,
    pieceType,
    fallbackGlyph: piece.fallbackGlyph,
    moveProfile: piece.moveProfile,
    facing,
    pieceAssets: TEST_ART[pieceType],
    x,
    y
  };
}

function enemyAnchor() {
  const piece = PIECES.king;
  return {
    id: 'facing-lab-enemy-king',
    team: 'enemy',
    faction: 'green',
    name: 'Rey rival',
    pieceType: 'king',
    fallbackGlyph: piece.fallbackGlyph,
    moveProfile: piece.moveProfile,
    facing: 'south',
    x: 7,
    y: 0
  };
}

export function createFacingLab() {
  return Object.freeze({
    id: 'facing-lab',
    name: 'Laboratorio de orientación',
    nextLevelId: null,
    board: BOARD,
    teams: {
      player: 'green',
      enemy: 'green'
    },
    music: null,
    ai: null,
    rules: {
      victory: 'elimination',
      captureChoice: true
    },
    testing: {
      flipFacingOnMove: true
    },
    units: [
      unit({ id: 'lab-green-bishop-north', faction: 'green', pieceType: 'bishop', facing: 'north', x: 1, y: 6 }),
      unit({ id: 'lab-green-bishop-south', faction: 'green', pieceType: 'bishop', facing: 'south', x: 1, y: 4 }),
      unit({ id: 'lab-red-rook-north', faction: 'red', pieceType: 'rook', facing: 'north', x: 3, y: 6 }),
      unit({ id: 'lab-red-rook-south', faction: 'red', pieceType: 'rook', facing: 'south', x: 3, y: 4 }),
      unit({ id: 'lab-yellow-knight-north', faction: 'yellow', pieceType: 'knight', facing: 'north', x: 5, y: 6 }),
      unit({ id: 'lab-yellow-knight-south', faction: 'yellow', pieceType: 'knight', facing: 'south', x: 5, y: 4 }),
      enemyAnchor()
    ],
    boardElements: [],
    specialTiles: [],
    tutorial: {
      enabledByDefault: false,
      steps: []
    }
  });
}

export const facingLab = createFacingLab();
