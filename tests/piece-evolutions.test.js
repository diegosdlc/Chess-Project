import test from 'node:test';
import assert from 'node:assert/strict';

import { PIECES } from '../src/content/bands.js';
import { AIController } from '../src/ai/AIController.js';
import { GameState, applyRookShieldRejection, applyRoyalSwap } from '../src/core/GameState.js';
import { evolveSurvivingBand, isEvolved } from '../src/core/evolution.js';
import { optionsFor } from '../src/core/rules.js';

function unit(pieceType, overrides = {}) {
  const piece = PIECES[pieceType];
  return {
    id: overrides.id ?? pieceType,
    team: overrides.team ?? 'player',
    faction: overrides.faction ?? 'green',
    name: piece.name,
    pieceType,
    fallbackGlyph: piece.fallbackGlyph,
    moveProfile: piece.moveProfile,
    evolutionProfile: piece.evolutionProfile,
    evolutionStage: overrides.evolutionStage ?? 'base',
    facing: overrides.team === 'enemy' ? 'south' : 'north',
    x: overrides.x ?? 3,
    y: overrides.y ?? 3
  };
}

function level(units, extra = {}) {
  return {
    id: 'evolution-test',
    board: { size: 8 },
    units,
    boardElements: extra.boardElements ?? [],
    specialTiles: [],
    deployment: extra.deployment
  };
}

function optionKeys(options) {
  return new Set(options.map(option => `${option.kind}:${option.x},${option.y}`));
}

test('surviving pieces evolve between encounters and the royal pair evolves jointly', () => {
  const completeBand = ['king', 'queen', 'pawn', 'bishop', 'knight', 'rook'].map(pieceType => unit(pieceType));
  const evolved = evolveSurvivingBand(completeBand);
  assert.ok(evolved.every(isEvolved));
  assert.equal(evolved.find(piece => piece.pieceType === 'rook').evolutionState.shieldCharges, 1);

  const kingWithoutQueen = evolveSurvivingBand([unit('king'), unit('pawn')]);
  assert.equal(isEvolved(kingWithoutQueen.find(piece => piece.pieceType === 'king')), false);
  assert.equal(isEvolved(kingWithoutQueen.find(piece => piece.pieceType === 'pawn')), true);
});

test('Knight+ may deploy in the first four friendly rows', () => {
  const state = new GameState(level([
    unit('knight', { evolutionStage: 'evolved' }),
    unit('pawn', { id: 'base-pawn' })
  ], { deployment: { team: 'player', rows: [6, 7] } }));
  const knight = state.units[0];
  const pawn = state.units[1];

  assert.equal(state.canDeployAt(knight, 2, 4), true);
  assert.equal(state.canDeployAt(knight, 2, 3), false);
  assert.equal(state.canDeployAt(pawn, 2, 4), false);
});

test('Bishop+ may reflect once from a non-corner board edge', () => {
  const evolvedState = new GameState(level([unit('bishop', { evolutionStage: 'evolved', x: 2, y: 2 })]));
  const baseState = new GameState(level([unit('bishop', { x: 2, y: 2 })]));

  assert.ok(optionKeys(optionsFor(evolvedState, evolvedState.level, evolvedState.units[0])).has('move:5,1'));
  assert.equal(optionKeys(optionsFor(baseState, baseState.level, baseState.units[0])).has('move:5,1'), false);
});

test('a blocker on the edge prevents Bishop+ from bouncing through it', () => {
  const state = new GameState(level(
    [unit('bishop', { evolutionStage: 'evolved', x: 2, y: 2 })],
    { boardElements: [{ x: 4, y: 0, blocking: true }] }
  ));
  assert.equal(optionKeys(optionsFor(state, state.level, state.units[0])).has('move:5,1'), false);
});

test('Rook+ rejects the first attack beyond its square and then spends its shield', () => {
  const state = new GameState(level([
    unit('queen', { id: 'attacker', team: 'enemy', x: 0, y: 3 }),
    unit('rook', { id: 'shielded-rook', evolutionStage: 'evolved', x: 3, y: 3 })
  ]));
  const [attacker, rook] = state.units;

  assert.equal(applyRookShieldRejection(state, state.level, attacker, rook), true);
  assert.deepEqual({ x: attacker.x, y: attacker.y }, { x: 4, y: 3 });
  assert.deepEqual({ x: rook.x, y: rook.y }, { x: 3, y: 3 });
  assert.equal(rook.evolutionState.shieldCharges, 0);
  assert.equal(applyRookShieldRejection(state, state.level, attacker, rook), false);
});

test('King+ and Queen+ expose and consume one shared position swap', () => {
  const state = new GameState(level([
    unit('king', { evolutionStage: 'evolved', x: 1, y: 1 }),
    unit('queen', { evolutionStage: 'evolved', x: 5, y: 4 })
  ]));
  const [king, queen] = state.units;

  assert.ok(optionsFor(state, state.level, king).some(option => option.kind === 'royal-swap' && option.targetId === queen.id));
  assert.equal(applyRoyalSwap(state, king, queen), true);
  assert.deepEqual({ x: king.x, y: king.y }, { x: 5, y: 4 });
  assert.deepEqual({ x: queen.x, y: queen.y }, { x: 1, y: 1 });
  assert.equal(state.teamEvolution.player.royalSwapCharges, 0);
  assert.equal(applyRoyalSwap(state, king, queen), false);
});

test('AI analysis does not spend the real royal swap charge', () => {
  const state = new GameState(level([
    unit('pawn', { id: 'player-pawn', x: 7, y: 7 }),
    unit('king', { id: 'enemy-king', team: 'enemy', evolutionStage: 'evolved', x: 1, y: 1 }),
    unit('queen', { id: 'enemy-queen', team: 'enemy', evolutionStage: 'evolved', x: 5, y: 4 })
  ]));
  state.currentTurn = 'enemy';

  new AIController({ team: 'enemy', depth: 1, randomness: 0 }).chooseAction(state, state.level);

  assert.equal(state.teamEvolution.enemy.royalSwapCharges, 1);
});
