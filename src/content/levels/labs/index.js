import { createFacingLab, facingLab } from '../facing-lab.js';
import { createPawnEvolutionLab, pawnEvolutionLab } from '../pawn-evolution-lab.js';

export const MECHANIC_LABS = Object.freeze([
  Object.freeze({
    id: facingLab.id,
    name: 'Orientación de piezas',
    description: 'Prueba frontal/espalda y cambios de encaramiento.',
    createLevel: createFacingLab
  }),
  Object.freeze({
    id: pawnEvolutionLab.id,
    name: 'Evolución del peón',
    description: 'Evoluciona un peón y prueba movimiento bidireccional y captura en cuatro diagonales.',
    createLevel: createPawnEvolutionLab
  })
]);

export function listMechanicLabs() {
  return MECHANIC_LABS.map(({ id, name, description }) => ({ id, name, description }));
}

export function getMechanicLabFactory(levelId) {
  return MECHANIC_LABS.find(lab => lab.id === levelId)?.createLevel ?? null;
}
