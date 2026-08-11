const board = document.querySelector('#board');
const roster = document.querySelector('#roster');
const detail = document.querySelector('#unit-detail');
const status = document.querySelector('#status');
const restart = document.querySelector('#restart');
const turnBadge = document.querySelector('#turn-badge');
const prisonerCount = document.querySelector('#prisoner-count');
const resultDialog = document.querySelector('#result-dialog');
const resultContent = document.querySelector('#result-content');

const TEAM_LABEL = { player: 'Jugador blanco', enemy: 'Jugador negro' };
const NEXT_TEAM = { player: 'enemy', enemy: 'player' };

const baseUnits = [
  { id:'warden', team:'player', name:'Guardia del Roble', type:'Torre', icon:'♜', x:1, y:6, range:'orthogonal', ability:'Baluarte', description:'Se mueve en líneas rectas por toda la longitud disponible del tablero.' },
  { id:'seer', team:'player', name:'Vidente de Musgo', type:'Alfil', icon:'♝', x:3, y:7, range:'diagonal', ability:'Enredadera', description:'Se mueve en diagonal por toda la longitud disponible del tablero.' },
  { id:'scout', team:'player', name:'Exploradora', type:'Peón arquero', icon:'♟', x:5, y:6, range:'pawn', ability:'Red de caza', description:'Avanza una casilla hacia el bando negro y captura en diagonal.' },
  { id:'brute', team:'enemy', name:'Bruto de Ceniza', type:'Torre', icon:'♜', x:6, y:1, range:'orthogonal', ability:'Carga brutal', description:'Se mueve en líneas rectas por toda la longitud disponible del tablero.' },
  { id:'hexer', team:'enemy', name:'Tejedora Escarlata', type:'Alfil', icon:'♝', x:4, y:0, range:'diagonal', ability:'Maldición', description:'Se mueve en diagonal por toda la longitud disponible del tablero.' },
  { id:'raider', team:'enemy', name:'Saqueador', type:'Peón', icon:'♟', x:2, y:1, range:'pawn', ability:'Golpe bajo', description:'Avanza una casilla hacia el bando blanco y captura en diagonal.' }
];

let units;
let selectedId;
let currentTurn;
let finished;
let pendingCapture;

const inside = (x, y) => x >= 0 && x < 8 && y >= 0 && y < 8;
const active = unit => !unit.captured && !unit.destroyed;
const activeAt = (x, y) => units.find(unit => active(unit) && unit.x === x && unit.y === y);
const prisonersAt = (x, y) => units.filter(unit => unit.captured && !unit.destroyed && unit.x === x && unit.y === y);
const selected = () => units.find(unit => unit.id === selectedId);
const unresolvedPrisoners = () => units.filter(unit => unit.captured && !unit.destroyed);

function reset() {
  units = structuredClone(baseUnits).map(unit => ({ ...unit, captured:false, destroyed:false, capturedBy:null }));
  selectedId = null;
  currentTurn = 'player';
  finished = false;
  pendingCapture = null;
  if (resultDialog.open) resultDialog.close();
  render();
  setStatus('Turno del jugador blanco. Selecciona una pieza. Verde = movimiento; dorado = captura.');
}

function setStatus(message) {
  status.textContent = message;
}

function squareOption(unit, x, y) {
  const occupant = activeAt(x, y);
  if (occupant) return occupant.team !== unit.team ? { x, y, kind:'capture' } : null;

  const frozen = prisonersAt(x, y);
  if (!frozen.length) return { x, y, kind:'move' };
  if (frozen.some(piece => piece.team === unit.team)) return { x, y, kind:'move-frozen' };
  return null;
}

function validLineMoves(unit, directions) {
  const moves = [];
  for (const [dx, dy] of directions) {
    for (let step = 1; step <= 7; step++) {
      const x = unit.x + dx * step;
      const y = unit.y + dy * step;
      if (!inside(x, y)) break;
      const option = squareOption(unit, x, y);
      if (!option) break;
      moves.push(option);
      if (option.kind !== 'move') break;
    }
  }
  return moves;
}

function pawnMoves(unit) {
  const moves = [];
  const dy = unit.team === 'player' ? -1 : 1;
  const forwardX = unit.x;
  const forwardY = unit.y + dy;

  if (inside(forwardX, forwardY) && !activeAt(forwardX, forwardY)) {
    const frozen = prisonersAt(forwardX, forwardY);
    if (!frozen.length) moves.push({ x:forwardX, y:forwardY, kind:'move' });
    else if (frozen.some(piece => piece.team === unit.team)) moves.push({ x:forwardX, y:forwardY, kind:'move-frozen' });
  }

  for (const dx of [-1, 1]) {
    const x = unit.x + dx;
    const y = unit.y + dy;
    if (!inside(x, y)) continue;
    const target = activeAt(x, y);
    if (target && target.team !== unit.team) moves.push({ x, y, kind:'capture' });
  }

  return moves;
}

function optionsFor(unit) {
  if (!unit || !active(unit) || unit.team !== currentTurn) return [];
  if (unit.range === 'orthogonal') return validLineMoves(unit, [[1,0],[-1,0],[0,1],[0,-1]]);
  if (unit.range === 'diagonal') return validLineMoves(unit, [[1,1],[1,-1],[-1,1],[-1,-1]]);
  return pawnMoves(unit);
}

function releaseFriendlyPrisonerFrom(x, y, team) {
  if (x == null || y == null) return [];
  const restored = prisonersAt(x, y).filter(piece => piece.team === team);
  restored.forEach(piece => {
    piece.captured = false;
    piece.capturedBy = null;
  });
  return restored;
}

function leaveOrigin(unit) {
  const originX = unit.x;
  const originY = unit.y;
  unit.x = null;
  unit.y = null;
  return releaseFriendlyPrisonerFrom(originX, originY, unit.team);
}

function finishMove(message, restored = []) {
  selectedId = null;
  const restoreText = restored.length
    ? ` ${restored.map(piece => piece.name).join(', ')} se recupera al quedar libre su casilla.`
    : '';
  setStatus(`${message}${restoreText}`);
  checkEnd();
  if (!finished) currentTurn = NEXT_TEAM[currentTurn];
  render();
  if (!finished) {
    const prefix = restoreText ? `${message}${restoreText} ` : '';
    setStatus(`${prefix}Turno de ${TEAM_LABEL[currentTurn].toLowerCase()}.`);
  }
}

function moveUnit(unit, option) {
  const restored = leaveOrigin(unit);
  unit.x = option.x;
  unit.y = option.y;
  finishMove(`${unit.name} se mueve.`, restored);
}

function chooseCaptureAction(unit, option) {
  const target = activeAt(option.x, option.y);
  if (!target || target.team === unit.team) return;

  pendingCapture = { unitId:unit.id, targetId:target.id, x:option.x, y:option.y };
  resultContent.innerHTML = `
    <div class="result-card capture-choice-card">
      <p class="eyebrow">PIEZA ENEMIGA ALCANZADA</p>
      <h2>${unit.icon} ${unit.name} → ${target.icon} ${target.name}</h2>
      <p>Elige qué hacer con la pieza rival. Esta elección forma parte del mismo movimiento.</p>
      <div class="capture-actions">
        <button class="primary-button" id="freeze-capture" type="button">Capturar · congelar</button>
        <button class="danger-button" id="destroy-capture" type="button">Destruir · retirar del tablero</button>
      </div>
    </div>`;
  resultDialog.showModal();
  document.querySelector('#freeze-capture').addEventListener('click', () => resolveCapture('capture'));
  document.querySelector('#destroy-capture').addEventListener('click', () => resolveCapture('destroy'));
}

function resolveCapture(action) {
  if (!pendingCapture || finished) return;
  const { unitId, targetId, x, y } = pendingCapture;
  const unit = units.find(piece => piece.id === unitId);
  const target = units.find(piece => piece.id === targetId);
  pendingCapture = null;
  if (!unit || !target || !active(unit) || !active(target)) {
    if (resultDialog.open) resultDialog.close();
    render();
    return;
  }

  const restored = leaveOrigin(unit);

  if (action === 'capture') {
    target.captured = true;
    target.capturedBy = unit.team;
    target.x = x;
    target.y = y;
  } else {
    target.destroyed = true;
    target.captured = false;
    target.capturedBy = null;
    target.x = null;
    target.y = null;
  }

  unit.x = x;
  unit.y = y;
  if (resultDialog.open) resultDialog.close();

  const message = action === 'capture'
    ? `${unit.name} captura a ${target.name}; queda congelada bajo la pieza atacante.`
    : `${unit.name} destruye a ${target.name}; queda fuera de la partida.`;
  finishMove(message, restored);
}

function perform(unit, option) {
  if (!unit || finished || pendingCapture) return;
  if (option.kind === 'capture') return chooseCaptureAction(unit, option);
  moveUnit(unit, option);
}

function checkEnd() {
  const white = units.filter(unit => active(unit) && unit.team === 'player');
  const black = units.filter(unit => active(unit) && unit.team === 'enemy');
  if (!white.length) finish('enemy');
  else if (!black.length) finish('player');
}

function finish(winner) {
  if (finished) return;
  finished = true;

  const capturedForWhite = unresolvedPrisoners().filter(unit => unit.capturedBy === 'player');
  const capturedForBlack = unresolvedPrisoners().filter(unit => unit.capturedBy === 'enemy');
  capturedForWhite.forEach(unit => { unit.recruitedBy = 'player'; });
  capturedForBlack.forEach(unit => { unit.recruitedBy = 'enemy'; });

  const list = pieces => pieces.length
    ? `<ul>${pieces.map(piece => `<li>${piece.icon} ${piece.name} (${piece.type})</li>`).join('')}</ul>`
    : '<p>Ninguna.</p>';

  resultContent.innerHTML = `
    <div class="result-card">
      <p class="eyebrow">PARTIDA TERMINADA</p>
      <h2>Victoria de ${winner === 'player' ? 'blancas' : 'negras'}</h2>
      <p>Las piezas que siguen congeladas al terminar la partida pasan a formar parte de la banda que las capturó. Las destruidas no se incorporan a ninguna banda.</p>
      <h3>Banda blanca incorpora</h3>${list(capturedForWhite)}
      <h3>Banda negra incorpora</h3>${list(capturedForBlack)}
      <button class="primary-button" id="play-again">Nueva escaramuza</button>
    </div>`;

  render();
  if (!resultDialog.open) resultDialog.showModal();
  document.querySelector('#play-again').addEventListener('click', reset);
}

function renderBoard() {
  board.innerHTML = '';
  const opts = optionsFor(selected());

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.dataset.label = `${String.fromCharCode(65+x)}${8-y}`;
      cell.setAttribute('role', 'gridcell');

      const option = opts.find(item => item.x === x && item.y === y);
      if (option) cell.classList.add(option.kind === 'move-frozen' ? 'rescue-target' : `${option.kind}-target`);

      const frozen = prisonersAt(x, y);
      frozen.forEach(piece => {
        const prisoner = document.createElement('div');
        prisoner.className = `prisoner ${piece.team}`;
        prisoner.title = `${piece.name} — congelada por ${TEAM_LABEL[piece.capturedBy]}`;
        prisoner.textContent = piece.icon;
        cell.append(prisoner);
      });

      const unit = activeAt(x, y);
      if (unit) {
        const el = document.createElement('div');
        el.className = `unit ${unit.team}`;
        el.textContent = unit.icon;
        cell.append(el);
      }

      cell.addEventListener('click', () => cellClick(x, y, option, unit));
      board.append(cell);
    }
  }
}

function cellClick(x, y, option, unit) {
  if (finished || pendingCapture) return;
  if (option) return perform(selected(), option);

  if (unit?.team === currentTurn) {
    selectedId = unit.id;
    setStatus(`${unit.name}: elige un destino.`);
  } else if (unit) {
    setStatus(`Esa pieza pertenece a ${TEAM_LABEL[unit.team].toLowerCase()}.`);
  } else {
    selectedId = null;
    setStatus(`Selecciona una pieza de ${TEAM_LABEL[currentTurn].toLowerCase()}.`);
  }
  render();
}

function render() {
  renderBoard();

  const people = units.filter(active);
  roster.innerHTML = people.map(unit => `
    <button class="roster-card ${unit.team} ${unit.id === selectedId ? 'selected' : ''}" data-unit="${unit.id}" ${unit.team !== currentTurn || finished || pendingCapture ? 'disabled' : ''}>
      <span class="roster-icon">${unit.icon}</span>
      <span><strong>${unit.name}</strong><small>${unit.type} · ${TEAM_LABEL[unit.team]}</small></span>
    </button>`).join('');

  roster.querySelectorAll('[data-unit]').forEach(button => button.addEventListener('click', () => {
    const unit = units.find(piece => piece.id === button.dataset.unit);
    if (unit && unit.team === currentTurn && active(unit) && !pendingCapture) {
      selectedId = unit.id;
      setStatus(`${unit.name}: elige un destino.`);
      render();
    }
  }));

  const unit = selected();
  detail.className = 'unit-detail' + (unit ? '' : ' empty');
  detail.innerHTML = unit
    ? `<h2>${unit.icon} ${unit.name}</h2>
       <div class="stat-row"><span>ARQUETIPO</span><strong>${unit.type}</strong></div>
       <div class="stat-row"><span>BANDO</span><strong>${TEAM_LABEL[unit.team]}</strong></div>
       <div class="ability"><strong>${unit.ability}</strong>${unit.description}</div>`
    : 'Selecciona una unidad para ver sus acciones.';

  turnBadge.textContent = currentTurn === 'player' ? 'Turno: blancas' : 'Turno: negras';
  prisonerCount.textContent = unresolvedPrisoners().length;
}

resultDialog.addEventListener('cancel', event => {
  if (pendingCapture) event.preventDefault();
});
restart.addEventListener('click', reset);
reset();
