import { createInitialBand, FACINGS } from '../bands.js';
import { STANDARD_BOARD } from './shared.js';

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

const TUTORIAL_OBSTACLE_ASSET = './assets/board-elements/tutorial/blocker-placeholder.svg';

const TUTORIAL_OBSTACLES = Object.freeze([
  {
    id: 'tutorial-blocker-c4',
    type: 'blocker',
    name: 'Obstáculo',
    x: 2,
    y: 3,
    blocking: true,
    asset: TUTORIAL_OBSTACLE_ASSET,
    className: 'tutorial-blocker',
    scale: 1.28,
    yOffset: -0.32
  },
  {
    id: 'tutorial-blocker-d4',
    type: 'blocker',
    name: 'Obstáculo',
    x: 3,
    y: 3,
    blocking: true,
    asset: TUTORIAL_OBSTACLE_ASSET,
    className: 'tutorial-blocker',
    scale: 1.28,
    yOffset: -0.32
  },
  {
    id: 'tutorial-blocker-f6',
    type: 'blocker',
    name: 'Obstáculo',
    x: 5,
    y: 5,
    blocking: true,
    asset: TUTORIAL_OBSTACLE_ASSET,
    className: 'tutorial-blocker',
    scale: 1.28,
    yOffset: -0.32
  }
]);

export function createTutorial01({ playerFactionId = 'green' } = {}) {
  return Object.freeze({
    id: 'tutorial-01',
    name: 'Tutorial',
    nextLevelId: null,
    board: STANDARD_BOARD,
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
      ...createInitialBand({
        team: 'player',
        factionId: playerFactionId,
        positions: PLAYER_POSITIONS,
        facing: FACINGS.NORTH
      }),
      ...createInitialBand({
        team: 'enemy',
        factionId: 'green',
        positions: ENEMY_POSITIONS,
        facing: FACINGS.SOUTH
      })
    ],
    boardElements: TUTORIAL_OBSTACLES,
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
