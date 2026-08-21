import test from 'node:test';
import assert from 'node:assert/strict';

import { GameState } from '../src/core/GameState.js';
import { isEvolved, moveProfileFor } from '../src/core/evolution.js';
import { optionsFor } from '../src/core/rules.js';
import { getLevel, listMechanicLabs } from '../src/content/levels/index.js';

function pawn(overrides = {}) {
  return {
    id: overrides.id ?? 'pawn',
    team: overrides.team ?? 'player',
    faction: 'green',
    name: 'Peón de prueba',
    pieceType: 'pawn',
    fallbackGlyph: '♟',
    moveProfile: 'pawn',
    evolutionProfile: 'pawn',
    evolutionStage: overrides.evolutionStage ?? 'base',
    facing: overrides.team === 'enemy' ? 'south' : 'north',
    x: overrides.x ?? 3,
    y: overrides.y ?? 3
  };
}

function level(units) {
  return {
    id: 'test-level',
    board: { size: 8 },
    units,
    boardElements: [],
    specialTiles: []
  };
}

function optionKeys(options) {
  return new Set(options.map(option => `${option.kind}:${option.x},${option.y}`));
}

test('a base pawn still moves and captures only toward the opposite edge', () => {
  const subject = pawn({ x: 3, y: 3 });
  const state = new GameState(level([
    subject,
    pawn({ id: 'forward-target', team: 'enemy', x: 2, y: 2 }),
    pawn({ id: 'back-target', team: 'enemy', x: 4, y: 4 })
  ]));
  const options = optionKeys(optionsFor(state, state.level, state.units[0]));

  assert.deepEqual(options, new Set(['move:3,2', 'capture:2,2']));
});

test('reaching the opposite edge no longer activates evolution during a match', () => {
  const state = new GameState(level([pawn({ x: 3, y: 1 })]));
  const subject = state.units[0];

  state.leaveOrigin(subject);
  state.completeMove(subject, { kind: 'move', x: 3, y: 0 });

  assert.equal(isEvolved(subject), false);
  assert.equal(moveProfileFor(subject), 'pawn');
  assert.equal(optionsFor(state, state.level, subject).length, 0);
});

test('enemy pawns also wait until the next encounter to evolve', () => {
  const state = new GameState(level([pawn({ team: 'enemy', x: 4, y: 6 })]));
  state.currentTurn = 'enemy';
  const subject = state.units[0];

  state.leaveOrigin(subject);
  state.completeMove(subject, { kind: 'move', x: 4, y: 7 });

  assert.equal(isEvolved(subject), false);
  assert.equal(optionsFor(state, state.level, subject).length, 0);
});

test('an evolved pawn moves both ways and captures on all four diagonals', () => {
  const units = [
    pawn({ evolutionStage: 'evolved', x: 3, y: 3 }),
    pawn({ id: 'north-west', team: 'enemy', x: 2, y: 2 }),
    pawn({ id: 'north-east', team: 'enemy', x: 4, y: 2 }),
    pawn({ id: 'south-west', team: 'enemy', x: 2, y: 4 }),
    pawn({ id: 'south-east', team: 'enemy', x: 4, y: 4 })
  ];
  const state = new GameState(level(units));
  const options = optionKeys(optionsFor(state, state.level, state.units[0]));

  assert.deepEqual(options, new Set([
    'move:3,2',
    'move:3,4',
    'capture:2,2',
    'capture:4,2',
    'capture:2,4',
    'capture:4,4'
  ]));
});

test('evolution remains active after the pawn leaves the evolution edge', () => {
  const state = new GameState(level([pawn({ evolutionStage: 'evolved', x: 3, y: 0 })]));
  const subject = state.units[0];

  state.leaveOrigin(subject);
  state.completeMove(subject, { kind: 'move', x: 3, y: 1 });

  assert.equal(isEvolved(subject), true);
  const options = optionKeys(optionsFor(state, state.level, subject));
  assert.ok(options.has('move:3,0'));
  assert.ok(options.has('move:3,2'));
});

test('the pawn evolution lab is registered with ready-to-test scenarios', () => {
  assert.ok(listMechanicLabs().some(lab => lab.id === 'pawn-evolution-lab'));
  const lab = getLevel('pawn-evolution-lab');
  assert.ok(lab);
  assert.equal(lab.behavior.beforeChangeTurn(), false);
  assert.equal(lab.units.filter(unit => unit.evolutionStage === 'evolved').length, 5);
  assert.ok(lab.units.some(unit => unit.id === 'pawn-evolved-edge' && unit.y === 0));
});
