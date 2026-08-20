import { createFacingLab, facingLab } from '../facing-lab.js';

export const MECHANIC_LABS = Object.freeze([
  Object.freeze({
    id: facingLab.id,
    name: 'Orientación de piezas',
    description: 'Prueba frontal/espalda y cambios de encaramiento.',
    createLevel: createFacingLab
  })
]);

export function listMechanicLabs() {
  return MECHANIC_LABS.map(({ id, name, description }) => ({ id, name, description }));
}

export function getMechanicLabFactory(levelId) {
  return MECHANIC_LABS.find(lab => lab.id === levelId)?.createLevel ?? null;
}
