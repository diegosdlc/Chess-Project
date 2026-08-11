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
  { id:'warden', team:'player', name:'Guardia del Roble', type:'Torre', icon:'♜', x:1, y:6, range:'orthogonal', ability:'Baluarte', description:'Se mueve en líneas rectas.' },
  { id:'seer', team:'player', name:'Vidente de Musgo', type:'Alfil', icon:'♝', x:3, y:7, range:'diagonal', ability:'Enredadera', description:'Se mueve en diagonal.' },
  { id:'scout', team:'player', name:'Exploradora', type:'Peón arquero', icon:'♟', x:5, y:6, range:'scout', ability:'Red de caza', description:'Avanza una casilla y puede capturar en sus casillas de ataque.' },
  { id:'brute', team:'enemy', name:'Bruto de Ceniza', type:'Torre', icon:'♜', x:6, y:1, range:'orthogonal', ability:'Carga brutal', description:'Un guerrero pesado de la banda rival.' },
  { id:'hexer', team:'enemy', name:'Tejedora Escarlata', type:'Alfil', icon:'♝', x:4, y:0, range:'diagonal', ability:'Maldición', description:'Se mueve por las diagonales.' },
  { id:'raider', team:'enemy', name:'Saqueador', type:'Peón', icon:'♟', x:2, y:1, range:'scout', ability:'Golpe bajo', description:'Un explorador que busca flancos.' }
];

let units;
let selectedId;
let currentTurn;
let finished;

const inside = (x, y) => x >= 0 && x < 8 && y >= 0 && y < 8;
const active = unit => !unit.captured && !unit.rescued;
const activeAt = (x, y) => units.find(unit => active(unit) && unit.x === x && unit.y === y);
const prisonersAt = (x, y) => units.filter(unit => unit.captured && !unit.rescued && unit.x === x && unit.y === y);
const selected = () => units.find(unit => unit.id === selectedId);
const unresolvedPrisoners = () => units.filter(unit => unit.captured && !unit.rescued);

function reset() {
  units = structuredClone(baseUnits).map(unit => ({ ...unit, captured:false, rescued:false, capturedBy:null }));
  selectedId = null;
  currentTurn = 'player';
  finished = false;
  if (resultDialog.open) resultDialog.close();
  render();
  setStatus('Turno del jugador blanco. Selecciona una pieza. Verde = movimiento; dorado = captura o rescate.');
}

function setStatus(message) {
  status.textContent = message;
}

function squareOption(unit, x, y) {
  const occupant = activeAt(x, y);
  if (occupant) {
    return occupant.team !== unit.team ? { x, y, kind:'capture' } : null;
  }

  const frozen = prisonersAt(x, y);
  if (!frozen.length) return { x, y, kind:'move' };

  const friendlyPrisoner = frozen.find(piece => piece.team === unit.team);
  if (friendlyPrisoner) return { x, y, kind:'rescue', prisonerId:friendlyPrisoner.id };

  // Una pieza enemiga que ya es prisionera de este bando permanece congelada y bloquea la casilla.
  return null;
}

function validLineMoves(unit, directions, max=7) {
  const moves = [];
  for (const [dx, dy] of directions) {
    for (let step = 1; step <= max; step++) {
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

function optionsFor(unit) {
  if (!unit || !active(unit) || unit.team !== currentTurn) return [];

  if (unit.range === 'orthogonal') {
    return validLineMoves(unit, [[1,0],[-1,0],[0,1],[0,-1]], 3);
  }
  if (unit.range === 'diagonal') {
    return validLineMoves(unit, [[1,1],[1,-1],[-1,1],[-1,-1]], 3);
  }

  const moves = [];
  [[0,-1],[1,-1],[-1,-1],[1,0],[-1,0]].forEach(([dx,dy]) => {
    const x = unit.x + dx;
    const y = unit.y + dy;
    if (!inside(x,y)) return;
    const option = squareOption(unit, x, y);
    if (option) moves.push(option);
  });

  [[1,-1],[-1,-1],[1,1],[-1,1]].forEach(([dx,dy]) => {
    const x = unit.x + dx * 2;
    const y = unit.y + dy * 2;
    if (!inside(x,y)) return;
    const occupant = activeAt(x,y);
    if (occupant && occupant.team !== unit.team) moves.push({ x, y, kind:'capture' });
  });

  return moves;
}

function rescueFriendlyPrisonersAt(x, y, team) {
  const rescued = prisonersAt(x, y).filter(piece => piece.team === team);
  rescued.forEach(piece => {
    piece.rescued = true;
    piece.captured = false;
    piece.capturedBy = null;
    piece.x = null;
    piece.y = null;
  });
  return rescued;
}

function perform(unit, option) {
  if (!unit || finished) return;

  if (option.kind === 'move') {
    unit.x = option.x;
    unit.y = option.y;
    setStatus(`${unit.name} se mueve.`);
  }

  if (option.kind === 'rescue') {
    const prisoner = units.find(piece => piece.id === option.prisonerId);
    unit.x = option.x;
    unit.y = option.y;
    if (prisoner) {
      prisoner.rescued = true;
      prisoner.captured = false;
      prisoner.capturedBy = null;
      prisoner.x = null;
      prisoner.y = null;
      setStatus(`${unit.name} recupera a ${prisoner.name}. La pieza queda a salvo para su banda.`);
    }
  }

  if (option.kind === 'capture') {
    const target = activeAt(option.x, option.y);
    if (!target || target.team === unit.team) return;

    target.captured = true;
    target.capturedBy = unit.team;
    target.rescued = false;
    unit.x = option.x;
    unit.y = option.y;

    const rescued = rescueFriendlyPrisonersAt(option.x, option.y, unit.team);
    const rescueText = rescued.length
      ? ` Además, ${rescued.map(piece => piece.name).join(', ')} vuelve a salvo con su banda.`
      : '';
    setStatus(`${unit.name} captura a ${target.name} al primer contacto. La pieza queda congelada en esa casilla.${rescueText}`);
  }

  selectedId = null;
  checkEnd();

  if (!finished) {
    currentTurn = NEXT_TEAM[currentTurn];
  }

  render();
  if (!finished) {
    setStatus(`Turno de ${TEAM_LABEL[currentTurn].toLowerCase()}. Selecciona una de sus piezas.`);
  }
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
      <p>Las piezas que siguen congeladas al terminar la partida pasan a formar parte de la banda que las capturó.</p>
      <h3>Banda blanca incorpora</h3>${list(capturedForWhite)}
      <h3>Banda negra incorpora</h3>${list(capturedForBlack)}
      <button class="primary-button" id="play-again">Nueva escaramuza</button>
    </div>`;

  render();
  resultDialog.showModal();
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
      if (option) cell.classList.add(`${option.kind}-target`);

      const frozen = prisonersAt(x, y);
      frozen.forEach(piece => {
        const prisoner = document.createElement('div');
        prisoner.className = `prisoner ${piece.team}`;
        prisoner.title = `${piece.name} — prisionero de ${TEAM_LABEL[piece.capturedBy]}`;
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
  if (finished) return;
  if (option) return perform(selected(), option);

  if (unit?.team === currentTurn) {
    selectedId = unit.id;
    setStatus(`${unit.name}: elige movimiento, captura o rescate.`);
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
    <button class="roster-card ${unit.team} ${unit.id === selectedId ? 'selected' : ''}" data-unit="${unit.id}" ${unit.team !== currentTurn || finished ? 'disabled' : ''}>
      <span class="roster-icon">${unit.icon}</span>
      <span><strong>${unit.name}</strong><small>${unit.type} · ${TEAM_LABEL[unit.team]}</small></span>
    </button>`).join('');

  roster.querySelectorAll('[data-unit]').forEach(button => button.addEventListener('click', () => {
    const unit = units.find(piece => piece.id === button.dataset.unit);
    if (unit && unit.team === currentTurn && active(unit)) {
      selectedId = unit.id;
      setStatus(`${unit.name}: elige movimiento, captura o rescate.`);
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

restart.addEventListener('click', reset);
reset();
