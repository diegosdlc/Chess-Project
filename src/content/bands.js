import { getFaction } from './factions.js';

export const PIECES = Object.freeze({
  king: Object.freeze({ name: 'Rey', fallbackGlyph: '♚', moveProfile: 'king' }),
  queen: Object.freeze({ name: 'Reina', fallbackGlyph: '♛', moveProfile: 'queen' }),
  bishop: Object.freeze({ name: 'Alfil', fallbackGlyph: '♝', moveProfile: 'diagonal' }),
  knight: Object.freeze({ name: 'Caballo', fallbackGlyph: '♞', moveProfile: 'knight' }),
  rook: Object.freeze({ name: 'Torre', fallbackGlyph: '♜', moveProfile: 'orthogonal' }),
  pawn: Object.freeze({ name: 'Peón', fallbackGlyph: '♟', moveProfile: 'pawn' })
});

export function createInitialBand({ team, factionId, positions }) {
  const faction = getFaction(factionId);
  if (!faction) throw new Error(`Facción desconocida: ${factionId}`);

  const pieceTypes = ['king', 'queen', 'pawn', faction.specialPieceType];
  return pieceTypes.map(pieceType => createUnit({
    id: `${team}-${pieceType}`,
    team,
    faction: factionId,
    pieceType,
    position: positions[pieceType]
  }));
}

function createUnit({ id, team, faction, pieceType, position }) {
  const piece = PIECES[pieceType];
  if (!piece) throw new Error(`Tipo de pieza desconocido: ${pieceType}`);
  if (!position) throw new Error(`Falta la posición inicial de ${pieceType} para ${team}`);

  return {
    id,
    team,
    faction,
    name: piece.name,
    pieceType,
    fallbackGlyph: piece.fallbackGlyph,
    moveProfile: piece.moveProfile,
    x: position.x,
    y: position.y
  };
}
