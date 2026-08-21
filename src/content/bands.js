import { getFaction } from './factions.js';

export const FACINGS = Object.freeze({
  NORTH: 'north',
  SOUTH: 'south'
});

export const PIECES = Object.freeze({
  king: Object.freeze({ name: 'Rey', fallbackGlyph: '♚', moveProfile: 'king' }),
  queen: Object.freeze({ name: 'Reina', fallbackGlyph: '♛', moveProfile: 'queen' }),
  bishop: Object.freeze({ name: 'Alfil', fallbackGlyph: '♝', moveProfile: 'diagonal' }),
  knight: Object.freeze({ name: 'Caballo', fallbackGlyph: '♞', moveProfile: 'knight' }),
  rook: Object.freeze({ name: 'Torre', fallbackGlyph: '♜', moveProfile: 'orthogonal' }),
  pawn: Object.freeze({ name: 'Peón', fallbackGlyph: '♟', moveProfile: 'pawn', evolutionProfile: 'pawn' })
});

export function createInitialBand({ team, factionId, positions, facing }) {
  const faction = getFaction(factionId);
  if (!faction) throw new Error(`Facción desconocida: ${factionId}`);
  if (!Object.values(FACINGS).includes(facing)) throw new Error(`Orientación desconocida: ${facing}`);

  const pieceTypes = ['king', 'queen', 'pawn', faction.specialPieceType];
  return pieceTypes.map(pieceType => createUnit({
    id: `${team}-${pieceType}`,
    team,
    faction: factionId,
    pieceType,
    position: positions[pieceType],
    facing
  }));
}

function createUnit({ id, team, faction, pieceType, position, facing }) {
  const piece = PIECES[pieceType];
  if (!piece) throw new Error(`Tipo de pieza desconocido: ${pieceType}`);
  if (!position) throw new Error(`Falta la posición inicial de ${pieceType} para ${team}`);

  return {
    id,
    team,
    faction,
    facing,
    name: piece.name,
    pieceType,
    fallbackGlyph: piece.fallbackGlyph,
    moveProfile: piece.moveProfile,
    evolutionProfile: piece.evolutionProfile ?? null,
    evolutionStage: piece.evolutionProfile ? 'base' : null,
    x: position.x,
    y: position.y
  };
}
