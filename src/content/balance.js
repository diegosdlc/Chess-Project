const BALANCE_URL = new URL('../../docs/BALANCE.md', import.meta.url);
const BALANCE_BLOCK = /<!--\s*balance-data:start\s*-->\s*```json\s*([\s\S]*?)```\s*<!--\s*balance-data:end\s*-->/i;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

export function parseBalanceMarkdown(markdown) {
  const match = String(markdown ?? '').match(BALANCE_BLOCK);
  if (!match) throw new Error('docs/BALANCE.md no contiene el bloque balance-data requerido.');

  const parsed = JSON.parse(match[1]);
  if (!parsed?.pieceCosts || !parsed?.levelPointLimits) {
    throw new Error('docs/BALANCE.md debe definir pieceCosts y levelPointLimits.');
  }

  for (const [pieceType, costs] of Object.entries(parsed.pieceCosts)) {
    const base = costs?.base;
    const evolved = costs?.evolved;
    if (!Number.isFinite(base) || base < 0 || !Number.isFinite(evolved) || evolved <= base) {
      throw new Error(`Coste inválido para ${pieceType}: evolved debe ser mayor que base.`);
    }
  }

  for (const [levelId, limit] of Object.entries(parsed.levelPointLimits)) {
    if (!Number.isFinite(limit) || limit < 1) {
      throw new Error(`Límite de puntos inválido para ${levelId}.`);
    }
  }

  return deepFreeze(parsed);
}

async function loadBalance() {
  const response = await fetch(BALANCE_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`No se pudo cargar el balance: ${response.status}`);
  return parseBalanceMarkdown(await response.text());
}

export const BALANCE = await loadBalance();

function costStage(unit) {
  return unit?.evolutionStage === 'evolved' ? 'evolved' : 'base';
}

export function pointCostForUnit(unit) {
  const stage = costStage(unit);
  const cost = BALANCE.pieceCosts?.[unit?.pieceType]?.[stage];
  if (!Number.isFinite(cost) || cost < 0) {
    throw new Error(`Falta un coste válido para ${unit?.pieceType ?? 'pieza desconocida'} (${stage}).`);
  }
  return cost;
}

export function bandPointValue(units = []) {
  return units.reduce((total, unit) => total + pointCostForUnit(unit), 0);
}

export function levelPointLimit(levelId, enemyUnits = []) {
  const configured = BALANCE.levelPointLimits?.[levelId];
  const enemyValue = bandPointValue(enemyUnits);

  if (configured == null) return enemyValue;
  if (!Number.isFinite(configured) || configured < 1) {
    throw new Error(`El límite de puntos de ${levelId} no es válido.`);
  }
  if (enemyUnits.length && configured !== enemyValue) {
    console.warn(`[balance] ${levelId}: límite ${configured}, banda rival ${enemyValue}.`);
  }
  return configured;
}
