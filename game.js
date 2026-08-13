const board = document.querySelector('#board');
const resultDialog = document.querySelector('#result-dialog');
const resultContent = document.querySelector('#result-content');

const NEXT_TEAM = { player: 'enemy', enemy: 'player' };

// Calibrated against the isometric board artwork (940 x 580).
// The logical board remains a normal 8x8 grid; only its projection is isometric.
const ISO = {
  width: 940,
  height: 580,
  origin: { x: 466, y: 44 },
  xAxis: { x: 53.75, y: 31.5 },
  yAxis: { x: -53.625, y: 31.375 }
};

const baseUnits = [
  { id:'warden', team:'player', name:'Guardia del Roble', type:'Torre', icon:'♜', x:1, y:6, range:'orthogonal' },
  { id:'seer', team:'player', name:'Vidente de Musgo', type:'Alfil', icon:'♝', x:3, y:7, range:'diagonal' },
  { id:'scout', team:'player', name:'Exploradora', type:'Peón', icon:'♟', x:5, y:6, range:'pawn' },
  { id:'brute', team:'enemy', name:'Bruto de Ceniza', type:'Torre', icon:'♜', x:6, y:1, range:'orthogonal' },
  { id:'hexer', team:'enemy', name:'Tejedora Escarlata', type:'Alfil', icon:'♝', x:4, y:0, range:'diagonal' },
  { id:'raider', team:'enemy', name:'Saqueador', type:'Peón', icon:'♟', x:2, y:1, range:'pawn' }
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

function point(x, y) {
  return {
    x: ISO.origin.x + x * ISO.xAxis.x + y * ISO.yAxis.x,
    y: ISO.origin.y + x * ISO.xAxis.y + y * ISO.yAxis.y
  };
}

function cellBox(x, y) {
  const a = point(x, y);
  const b = point(x + 1, y);
  const c = point(x + 1, y + 1);
  const d = point(x, y + 1);
  const xs = [a.x, b.x, c.x, d.x];
  const ys = [a.y, b.y, c.y, d.y];
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);
  return { left, top, width:right-left, height:bottom-top };
}

function pct(value, total) {
  return `${(value / total) * 100}%`;
}

function place(element, box) {
  element.style.left = pct(box.left, ISO.width);
  element.style.top = pct(box.top, ISO.height);
  element.style.width = pct(box.width, ISO.width);
  element.style.height = pct(box.height, ISO.height);
}

function insetBox(box, horizontal, vertical) {
  return {
    left: box.left + box.width * horizontal,
    top: box.top + box.height * vertical,
    width: box.width * (1 - horizontal * 2),
    height: box.height * (1 - vertical * 2)
  };
}

function reset() {
  units = structuredClone(baseUnits).map(unit => ({ ...unit, captured:false, destroyed:false, capturedBy:null }));
  selectedId = null;
  currentTurn = 'player';
  finished = false;
  pendingCapture = null;
  if (resultDialog.open) resultDialog.close();
  render();
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
  const forwardY = unit.y + dy;

  if (inside(unit.x, forwardY) && !activeAt(unit.x, forwardY)) {
    const frozen = prisonersAt(unit.x, forwardY);
    if (!frozen.length) moves.push({ x:unit.x, y:forwardY, kind:'move' });
    else if (frozen.some(piece => piece.team === unit.team)) {
      moves.push({ x:unit.x, y:forwardY, kind:'move-frozen' });
    }
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
  if (x == null || y == null) return;
  prisonersAt(x, y)
    .filter(piece => piece.team === team)
    .forEach(piece => {
      piece.captured = false;
      piece.capturedBy = null;
    });
}

function leaveOrigin(unit) {
  const originX = unit.x;
  const originY = unit.y;
  unit.x = null;
  unit.y = null;
  releaseFriendlyPrisonerFrom(originX, originY, unit.team);
}

function finishMove() {
  selectedId = null;
  checkEnd();
  if (!finished) currentTurn = NEXT_TEAM[currentTurn];
  render();
}

function moveUnit(unit, option) {
  leaveOrigin(unit);
  unit.x = option.x;
  unit.y = option.y;
  finishMove();
}

function chooseCaptureAction(unit, option) {
  const target = activeAt(option.x, option.y);
  if (!target || target.team === unit.team) return;

  pendingCapture = { unitId:unit.id, targetId:target.id, x:option.x, y:option.y };
  resultContent.innerHTML = `
    <div class="modal-card capture-choice-card">
      <h2>${unit.icon} ${unit.name}</h2>
      <p>ha alcanzado a</p>
      <h3>${target.icon} ${target.name}</h3>
      <div class="capture-actions">
        <button class="primary-button" id="freeze-capture" type="button">Capturar</button>
        <button class="danger-button" id="destroy-capture" type="button">Destruir</button>
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

  leaveOrigin(unit);

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
  finishMove();
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
    ? `<ul>${pieces.map(piece => `<li>${piece.icon} ${piece.name}</li>`).join('')}</ul>`
    : '<p>Ninguna.</p>';

  resultContent.innerHTML = `
    <div class="modal-card end-card">
      <h2>Ganan ${winner === 'player' ? 'las blancas' : 'las negras'}</h2>
      <p>Las piezas congeladas que siguen en el tablero pasan a su banda.</p>
      <div class="results-grid">
        <div><h3>Blancas incorporan</h3>${list(capturedForWhite)}</div>
        <div><h3>Negras incorporan</h3>${list(capturedForBlack)}</div>
      </div>
      <button class="primary-button" id="play-again">Jugar otra vez</button>
    </div>`;

  render();
  if (!resultDialog.open) resultDialog.showModal();
  document.querySelector('#play-again').addEventListener('click', reset);
}

function renderCell(x, y, option, unit) {
  const box = cellBox(x, y);
  const cell = document.createElement('button');
  cell.type = 'button';
  cell.className = 'iso-cell';
  cell.setAttribute('aria-label', `Casilla ${x + 1},${y + 1}`);
  place(cell, box);

  if (option) {
    cell.classList.add(option.kind === 'move-frozen' ? 'rescue-target' : `${option.kind}-target`);
  }

  cell.addEventListener('click', () => cellClick(option, unit));
  board.append(cell);

  const frozen = prisonersAt(x, y);
  frozen.forEach((piece, index) => {
    const prisoner = document.createElement('div');
    prisoner.className = `prisoner ${piece.team}`;
    prisoner.textContent = piece.icon;

    const prisonerBox = insetBox(box, 0.31, 0.25);
    prisonerBox.left += box.width * (0.18 + index * 0.05);
    prisonerBox.top += box.height * 0.28;
    prisonerBox.width *= 0.58;
    prisonerBox.height *= 0.72;
    place(prisoner, prisonerBox);
    board.append(prisoner);
  });

  if (unit) {
    const piece = document.createElement('button');
    piece.type = 'button';
    piece.className = `unit ${unit.team} ${unit.id === selectedId ? 'selected' : ''}`;
    piece.textContent = unit.icon;
    piece.setAttribute('aria-label', unit.name);

    const pieceBox = insetBox(box, 0.23, 0.03);
    pieceBox.top -= box.height * 0.23;
    pieceBox.height *= 1.18;
    place(piece, pieceBox);

    piece.addEventListener('click', event => {
      event.stopPropagation();
      cellClick(option, unit);
    });
    board.append(piece);
  }
}

function renderBoard() {
  board.innerHTML = '';
  const opts = optionsFor(selected());

  for (let diagonal = 0; diagonal <= 14; diagonal++) {
    for (let y = 0; y < 8; y++) {
      const x = diagonal - y;
      if (!inside(x, y)) continue;
      const unit = activeAt(x, y);
      const option = opts.find(item => item.x === x && item.y === y);
      renderCell(x, y, option, unit);
    }
  }
}

function cellClick(option, unit) {
  if (finished || pendingCapture) return;
  if (option) return perform(selected(), option);

  if (unit?.team === currentTurn) selectedId = unit.id;
  else selectedId = null;

  render();
}

function render() {
  renderBoard();
  board.dataset.turn = currentTurn;
}

resultDialog.addEventListener('cancel', event => {
  if (pendingCapture) event.preventDefault();
});

document.addEventListener('keydown', event => {
  if ((event.key === 'r' || event.key === 'R') && !pendingCapture) reset();
});

reset();
