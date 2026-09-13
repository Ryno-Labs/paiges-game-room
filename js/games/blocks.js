const PROFILE_KEY = 'paige.blocks.profile.v1';
const JOURNEY_KEY = 'paige.blocks.journey.current.v1';
const ENDLESS_KEY = 'paige.blocks.endless.current.v1';
const SIZE = 8;

const SHAPES = {
  dot: [[0, 0]],
  twoH: [[0, 0], [0, 1]],
  twoV: [[0, 0], [1, 0]],
  threeH: [[0, 0], [0, 1], [0, 2]],
  threeV: [[0, 0], [1, 0], [2, 0]],
  square: [[0, 0], [0, 1], [1, 0], [1, 1]],
  corner: [[0, 0], [1, 0], [1, 1]],
  cornerR: [[0, 1], [1, 0], [1, 1]],
  fourH: [[0, 0], [0, 1], [0, 2], [0, 3]],
  fourV: [[0, 0], [1, 0], [2, 0], [3, 0]],
  stair: [[0, 0], [0, 1], [1, 1], [1, 2]],
  tee: [[0, 0], [0, 1], [0, 2], [1, 1]],
  plus: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
  block3: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]
};
const SHAPE_POOL = ['dot','twoH','twoV','threeH','threeV','square','corner','cornerR','fourH','fourV','stair','tee','dot','twoH','twoV','square'];
const BLOCK_CLASSES = ['b-pink','b-blue','b-yellow','b-green','b-purple'];

const LEVELS = [
  { n:1, goal:{type:'lines',target:2}, moves:15, masteryMoves:10, bonus:{type:'double',target:1}, title:'First Clear' },
  { n:2, goal:{type:'lines',target:4}, moves:22, masteryMoves:16, bonus:{type:'combo',target:2}, title:'Keep It Open' },
  { n:3, goal:{type:'score',target:450}, moves:30, masteryMoves:22, bonus:{type:'lines',target:4}, title:'Make It Count' },
  { n:4, goal:{type:'lines',target:5}, moves:30, masteryMoves:22, bonus:{type:'double',target:1}, title:'Two at Once' },
  { n:5, goal:{type:'double',target:1}, moves:30, masteryMoves:22, bonus:{type:'lines',target:6}, title:'Double Clear' },
  { n:6, goal:{type:'lines',target:7}, moves:40, masteryMoves:30, bonus:{type:'combo',target:2}, title:'Find a Rhythm' },
  { n:7, goal:{type:'score',target:900}, moves:40, masteryMoves:30, bonus:{type:'double',target:1}, title:'Build the Score' },
  { n:8, goal:{type:'combo',target:2}, moves:44, masteryMoves:33, bonus:{type:'lines',target:8}, title:'Back to Back' },
  { n:9, goal:{type:'lines',target:9}, moves:48, masteryMoves:36, bonus:{type:'score',target:1200}, title:'Almost There' },
  { n:10, goal:{type:'lines',target:10}, moves:52, masteryMoves:40, bonus:{type:'double',target:2}, title:'Chapter Finale' }
];

function emptyBoard() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(null)); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function hashNumber(text) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < String(text).length; i++) {
    h ^= String(text).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seededFloat(text) {
  let t = hashNumber(text) + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shapeBounds(id) {
  const cells = SHAPES[id];
  return {
    h: Math.max(...cells.map(([r]) => r)) + 1,
    w: Math.max(...cells.map(([,c]) => c)) + 1
  };
}
function defaultProfile() {
  return { version:1, currentLevel:1, medals:Array(10).fill(0), endlessBest:0, endlessLinesBest:0, chapterOneComplete:false };
}
function normalizeProfile(value) {
  const base = defaultProfile();
  if (!value || typeof value !== 'object') return base;
  base.currentLevel = clamp(Number(value.currentLevel) || 1, 1, 10);
  base.medals = Array.from({length:10}, (_,i) => clamp(Number(value.medals?.[i]) || 0, 0, 3));
  base.endlessBest = Math.max(0, Number(value.endlessBest) || 0);
  base.endlessLinesBest = Math.max(0, Number(value.endlessLinesBest) || 0);
  base.chapterOneComplete = Boolean(value.chapterOneComplete);
  return base;
}
function validBoard(board) {
  return Array.isArray(board) && board.length === SIZE && board.every(row => Array.isArray(row) && row.length === SIZE);
}
function validState(state, kind) {
  return state && state.kind === kind && validBoard(state.board) && Array.isArray(state.tray) && state.tray.length === 3 && state.tray.every(x => x === null || SHAPES[x]);
}
function goalValue(state, goal) {
  if (goal.type === 'lines') return state.lines;
  if (goal.type === 'score') return state.score;
  if (goal.type === 'double') return state.doubleClears;
  if (goal.type === 'combo') return state.maxCombo;
  return 0;
}
function goalLabel(goal) {
  if (goal.type === 'lines') return `Clear ${goal.target} line${goal.target === 1 ? '' : 's'}`;
  if (goal.type === 'score') return `Score ${goal.target.toLocaleString()} points`;
  if (goal.type === 'double') return `Make ${goal.target} double clear${goal.target === 1 ? '' : 's'}`;
  if (goal.type === 'combo') return `Make a ${goal.target}-clear combo`;
  return 'Complete the goal';
}
function shortGoalLabel(goal) {
  if (goal.type === 'lines') return 'Lines';
  if (goal.type === 'score') return 'Score';
  if (goal.type === 'double') return 'Doubles';
  if (goal.type === 'combo') return 'Combo';
  return 'Goal';
}
function bonusLabel(level) {
  return goalLabel(level.bonus);
}
function canPlace(board, shapeId, row, col) {
  const cells = SHAPES[shapeId];
  return cells.every(([dr,dc]) => {
    const r = row + dr, c = col + dc;
    return r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r][c] == null;
  });
}
function placements(board, shapeId) {
  const result = [];
  const {h,w} = shapeBounds(shapeId);
  for (let r = 0; r <= SIZE - h; r++) for (let c = 0; c <= SIZE - w; c++) if (canPlace(board, shapeId, r, c)) result.push([r,c]);
  return result;
}
function anyTrayPlacement(state) {
  return state.tray.some(id => id && placements(state.board, id).length);
}

function rescueJourneyTray(state) {
  if (state.kind !== 'journey' || anyTrayPlacement(state)) return false;
  const fallbacks = ['dot','twoH','twoV','corner'];
  const fit = fallbacks.find(id => placements(state.board, id).length);
  if (!fit) return false;
  const index = state.tray.findIndex(Boolean);
  if (index < 0) return false;
  state.tray[index] = fit;
  return true;
}
function trayFor(state) {
  const tray = Array.from({length:3}, (_, slot) => {
    const f = seededFloat(`${state.seed}:${state.dealIndex}:${slot}`);
    return SHAPE_POOL[Math.floor(f * SHAPE_POOL.length) % SHAPE_POOL.length];
  });
  if (!tray.some(id => placements(state.board, id).length)) {
    const fallbacks = ['dot','twoH','twoV','corner'];
    const fit = fallbacks.find(id => placements(state.board, id).length);
    if (fit) tray[0] = fit;
  }
  state.dealIndex += 1;
  return tray;
}
function makeState(kind, levelNumber = null) {
  const level = levelNumber ? LEVELS[levelNumber - 1] : null;
  const state = {
    version:1, kind, level:levelNumber,
    board:emptyBoard(), tray:[null,null,null], dealIndex:0,
    seed: kind === 'journey' ? `paige-first-clears-${levelNumber}` : `paige-endless-${Date.now()}`,
    movesUsed:0, score:0, lines:0, combo:0, maxCombo:0, doubleClears:0,
    ended:false, won:false,
    moveLimit: level?.moves ?? null,
    selectedPiece:null
  };
  state.tray = trayFor(state);
  return state;
}
function simulatePlacement(board, shapeId, row, col) {
  if (!canPlace(board, shapeId, row, col)) return null;
  const next = board.map(r => [...r]);
  SHAPES[shapeId].forEach(([dr,dc]) => { next[row+dr][col+dc] = 1; });
  const fullRows = [];
  const fullCols = [];
  for (let r=0;r<SIZE;r++) if (next[r].every(Boolean)) fullRows.push(r);
  for (let c=0;c<SIZE;c++) if (next.every(r => Boolean(r[c]))) fullCols.push(c);
  return { lines: fullRows.length + fullCols.length, fullRows, fullCols };
}

export async function mount({ root, toast, storage }) {
  let profile = normalizeProfile(storage.get(PROFILE_KEY, null));
  let state = null;
  let history = [];
  let selectedIndex = null;
  let preview = null;
  let hintPreview = null;
  let drag = null;
  let currentView = 'hub';
  let resultData = null;

  root.classList.add('blocks-active');
  saveProfile();
  renderHub();

  function saveProfile() { storage.set(PROFILE_KEY, profile); }
  function saveState() {
    if (!state || state.ended) return;
    storage.set(state.kind === 'journey' ? JOURNEY_KEY : ENDLESS_KEY, state);
  }
  function clearState(kind) { storage.remove(kind === 'journey' ? JOURNEY_KEY : ENDLESS_KEY); }
  function loadSaved(kind) {
    const raw = storage.get(kind === 'journey' ? JOURNEY_KEY : ENDLESS_KEY, null);
    return validState(raw, kind) && !raw.ended ? raw : null;
  }
  function medalIcons(count) { return `${'★'.repeat(count)}${'☆'.repeat(3-count)}`; }
  function renderHub() {
    currentView = 'hub';
    state = null;
    selectedIndex = null;
    root.classList.remove('blocks-board-open');
    const savedJourney = loadSaved('journey');
    const savedEndless = loadSaved('endless');
    const medals = profile.medals.reduce((a,b) => a+b, 0);
    const current = LEVELS[profile.currentLevel - 1];
    root.innerHTML = `
      <section class="blocks-hub">
        <div class="blocks-hub-head">
          <span class="section-kicker">PAIGE’S BLOCKS</span>
          <h1>Clear a goal. Move forward.</h1>
          <p>No falling pieces. No timer. Think, place, clear.</p>
        </div>
        <button class="blocks-primary-card" id="journeyOpen" type="button">
          <span><small>JOURNEY · FIRST CLEARS</small><strong>Level ${profile.currentLevel}: ${current.title}</strong><em>${goalLabel(current.goal)}</em></span>
          <b>${savedJourney ? 'Resume →' : 'Play →'}</b>
        </button>
        <div class="chapter-progress">
          <div><span>Chapter progress</span><strong>${medals} / 30 medals</strong></div>
          <div class="medal-track">${LEVELS.map(level => `<button type="button" data-level="${level.n}" class="level-dot ${level.n === profile.currentLevel ? 'current' : ''} ${profile.medals[level.n-1] ? 'done' : ''} ${level.n > profile.currentLevel ? 'locked' : ''}" ${level.n > profile.currentLevel ? 'disabled' : ''}><b>${level.n}</b><small>${profile.medals[level.n-1] ? medalIcons(profile.medals[level.n-1]) : ''}</small></button>`).join('')}</div>
        </div>
        <button class="blocks-endless-card" id="endlessOpen" type="button">
          <span><small>ENDLESS</small><strong>Relax and chase your best</strong><em>Best ${profile.endlessBest.toLocaleString()} · ${profile.endlessLinesBest} lines</em></span>
          <b>${savedEndless ? 'Resume →' : 'Play →'}</b>
        </button>
        <div class="blocks-hub-note">Journey has one clear goal per level. Endless has no move limit and only ends when the board runs out of room.</div>
      </section>`;
    root.querySelector('#journeyOpen')?.addEventListener('click', () => {
      const saved = loadSaved('journey');
      if (saved && saved.level === profile.currentLevel) openBoard(saved);
      else showLevelIntro(profile.currentLevel);
    });
    root.querySelector('#endlessOpen')?.addEventListener('click', () => {
      const saved = loadSaved('endless');
      openBoard(saved || makeState('endless'));
    });
    root.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click', () => showLevelIntro(Number(button.dataset.level))));
  }

  function showLevelIntro(levelNumber) {
    const level = LEVELS[levelNumber - 1];
    const existing = loadSaved('journey');
    currentView = 'intro';
    root.innerHTML = `
      <section class="level-intro">
        <button class="text-back" id="levelBack" type="button">‹ Journey</button>
        <span class="section-kicker">FIRST CLEARS · LEVEL ${level.n}</span>
        <h1>${level.title}</h1>
        <div class="objective-card">
          <small>YOUR GOAL</small>
          <strong>${goalLabel(level.goal)}</strong>
          <span>${level.moves} moves available</span>
        </div>
        <div class="mastery-list">
          <div><b>★</b><span>Complete the level</span></div>
          <div><b>★</b><span>Finish in ${level.masteryMoves} moves or fewer</span></div>
          <div><b>★</b><span>${bonusLabel(level)}</span></div>
        </div>
        <button class="button primary big-action" id="startLevel" type="button">${existing?.level === levelNumber ? 'Resume level' : 'Start level'}</button>
        ${existing?.level === levelNumber ? `<button class="button secondary big-action" id="restartLevel" type="button">Restart this level</button>` : ''}
      </section>`;
    root.querySelector('#levelBack')?.addEventListener('click', renderHub);
    root.querySelector('#startLevel')?.addEventListener('click', () => openBoard(existing?.level === levelNumber ? existing : makeState('journey', levelNumber)));
    root.querySelector('#restartLevel')?.addEventListener('click', () => { clearState('journey'); openBoard(makeState('journey', levelNumber)); });
  }

  function boardMarkup() {
    const level = state.kind === 'journey' ? LEVELS[state.level - 1] : null;
    return `
      <section class="blocks-screen">
        <div class="blocks-topline">
          <button class="button small" id="blocksExit" type="button">${state.kind === 'journey' ? 'Journey' : 'Modes'}</button>
          <div class="blocks-goal-head">
            <strong>${state.kind === 'journey' ? `Level ${state.level}` : 'Endless'}</strong>
            <span id="blocksObjective">${state.kind === 'journey' ? goalLabel(level.goal) : `Best ${profile.endlessBest.toLocaleString()}`}</span>
          </div>
          <div class="toolbar-actions"><button class="button small" id="blocksUndo" type="button">Undo</button><button class="button small" id="blocksHint" type="button">Hint</button></div>
        </div>
        <div class="blocks-progress-row">
          ${state.kind === 'journey' ? `<div><small>${shortGoalLabel(level.goal)}</small><strong id="goalProgress"></strong></div><div><small>Moves left</small><strong id="movesLeft"></strong></div>` : `<div><small>Score</small><strong id="goalProgress"></strong></div><div><small>Lines</small><strong id="movesLeft"></strong></div>`}
          <div><small>Combo</small><strong id="comboValue"></strong></div>
        </div>
        <div class="blocks-play-area">
          <div class="blocks-board" id="blocksBoard" role="grid" aria-label="8 by 8 block board">
            ${Array.from({length:64}, (_,i) => `<button type="button" class="block-cell" data-cell="${Math.floor(i/SIZE)}:${i%SIZE}" aria-label="Row ${Math.floor(i/SIZE)+1}, column ${i%SIZE+1}"></button>`).join('')}
          </div>
          <div class="almost-cue hidden" id="almostCue">Almost there</div>
          <div class="piece-tray" id="pieceTray"></div>
          <div class="blocks-tip" id="blocksTip">Tap a piece, then tap the board — or drag it into place.</div>
        </div>
      </section>`;
  }

  function openBoard(nextState) {
    state = nextState;
    state.selectedPiece = null;
    history = [];
    selectedIndex = null;
    preview = null;
    hintPreview = null;
    resultData = null;
    currentView = 'board';
    root.classList.add('blocks-board-open');
    root.innerHTML = boardMarkup();
    root.querySelector('#blocksExit')?.addEventListener('click', () => { saveState(); renderHub(); });
    root.querySelector('#blocksUndo')?.addEventListener('click', undo);
    root.querySelector('#blocksHint')?.addEventListener('click', hint);
    root.querySelector('#blocksBoard')?.addEventListener('click', onBoardClick);
    renderAll();
    saveState();
  }

  function renderAll() {
    renderBoard();
    renderTray();
    renderProgress();
  }
  function renderBoard() {
    const boardEl = root.querySelector('#blocksBoard');
    if (!boardEl) return;
    boardEl.querySelectorAll('.block-cell').forEach(cell => {
      const [r,c] = cell.dataset.cell.split(':').map(Number);
      const value = state.board[r][c];
      cell.className = 'block-cell';
      if (value != null) cell.classList.add(BLOCK_CLASSES[value % BLOCK_CLASSES.length], 'filled');
    });
    applyPreview();
  }
  function pieceHtml(shapeId, index) {
    if (!shapeId) return `<div class="piece-slot used" aria-hidden="true"></div>`;
    const cells = SHAPES[shapeId];
    const {h,w} = shapeBounds(shapeId);
    const map = new Set(cells.map(([r,c]) => `${r}:${c}`));
    return `<button type="button" class="piece-slot ${selectedIndex === index ? 'selected' : ''}" data-piece="${index}" aria-label="Block piece ${index+1}">
      <span class="piece-grid" style="--rows:${h};--cols:${w}">${Array.from({length:h*w}, (_,i) => {
        const r = Math.floor(i/w), c = i%w;
        return `<i class="${map.has(`${r}:${c}`) ? `on ${BLOCK_CLASSES[index % BLOCK_CLASSES.length]}` : ''}"></i>`;
      }).join('')}</span>
    </button>`;
  }
  function renderTray() {
    const trayEl = root.querySelector('#pieceTray');
    if (!trayEl) return;
    trayEl.innerHTML = state.tray.map(pieceHtml).join('');
    trayEl.querySelectorAll('[data-piece]').forEach(button => {
      button.addEventListener('click', event => {
        if (drag?.moved) return;
        const index = Number(button.dataset.piece);
        selectedIndex = selectedIndex === index ? null : index;
        hintPreview = null;
        renderTray();
        renderBoard();
      });
      button.addEventListener('pointerdown', beginPieceDrag, { passive: true });
    });
  }
  function renderProgress() {
    const goalEl = root.querySelector('#goalProgress');
    const movesEl = root.querySelector('#movesLeft');
    const comboEl = root.querySelector('#comboValue');
    const almost = root.querySelector('#almostCue');
    if (state.kind === 'journey') {
      const level = LEVELS[state.level - 1];
      const value = goalValue(state, level.goal);
      goalEl.textContent = `${Math.min(value, level.goal.target)} / ${level.goal.target}`;
      movesEl.textContent = `${Math.max(0, level.moves - state.movesUsed)}`;
      comboEl.textContent = state.maxCombo ? `×${state.maxCombo}` : '—';
      const ratio = value / level.goal.target;
      almost.classList.toggle('hidden', !(ratio >= .8 && ratio < 1));
    } else {
      goalEl.textContent = state.score.toLocaleString();
      movesEl.textContent = state.lines;
      comboEl.textContent = state.maxCombo ? `×${state.maxCombo}` : '—';
      almost.classList.add('hidden');
    }
  }

  function nearestPlacement(shapeId, r, c) {
    const {h,w} = shapeBounds(shapeId);
    const baseR = r - Math.floor((h - 1) / 2);
    const baseC = c - Math.floor((w - 1) / 2);
    const candidates = [];
    for (let dr=-2;dr<=2;dr++) for (let dc=-2;dc<=2;dc++) candidates.push([baseR+dr, baseC+dc, Math.abs(dr)+Math.abs(dc)]);
    candidates.sort((a,b) => a[2]-b[2]);
    return candidates.find(([rr,cc]) => canPlace(state.board, shapeId, rr, cc))?.slice(0,2) || null;
  }
  function previewFor(shapeId, row, col, valid = true) {
    return { shapeId, row, col, valid };
  }
  function clearPreview() { preview = null; hintPreview = null; renderBoard(); }
  function applyPreview() {
    const boardEl = root.querySelector('#blocksBoard');
    const shown = preview || hintPreview;
    if (!boardEl || !shown) return;
    SHAPES[shown.shapeId].forEach(([dr,dc]) => {
      const cell = boardEl.querySelector(`[data-cell="${shown.row+dr}:${shown.col+dc}"]`);
      if (cell) cell.classList.add(shown.valid ? 'preview-ok' : 'preview-bad');
    });
  }
  function onBoardClick(event) {
    const cell = event.target.closest('[data-cell]');
    if (!cell || selectedIndex == null || !state.tray[selectedIndex]) return;
    const [r,c] = cell.dataset.cell.split(':').map(Number);
    const spot = nearestPlacement(state.tray[selectedIndex], r, c);
    if (!spot) return toast('That piece does not fit there.');
    placePiece(selectedIndex, spot[0], spot[1]);
  }

  function beginPieceDrag(event) {
    const button = event.currentTarget;
    const index = Number(button.dataset.piece);
    const shapeId = state.tray[index];
    if (!shapeId) return;
    const boardEl = root.querySelector('#blocksBoard');
    const rect = boardEl.getBoundingClientRect();
    drag = { id:event.pointerId, index, shapeId, startX:event.clientX, startY:event.clientY, moved:false, boardRect:rect, button };
    button.setPointerCapture?.(event.pointerId);
    button.addEventListener('pointermove', movePieceDrag, { passive:false });
    button.addEventListener('pointerup', endPieceDrag, { passive:false, once:true });
    button.addEventListener('pointercancel', cancelPieceDrag, { passive:false, once:true });
  }
  function dragSpot(event, dragState) {
    const {left,top,width,height} = dragState.boardRect;
    const cellW = width / SIZE, cellH = height / SIZE;
    const c = Math.floor((event.clientX - left) / cellW);
    const r = Math.floor((event.clientY - top) / cellH);
    if (r < -1 || c < -1 || r > SIZE || c > SIZE) return null;
    const {h,w} = shapeBounds(dragState.shapeId);
    const row = r - Math.floor((h - 1) / 2);
    const col = c - Math.floor((w - 1) / 2);
    return [row,col];
  }
  function movePieceDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const dist = Math.hypot(event.clientX-drag.startX, event.clientY-drag.startY);
    if (dist < 10 && !drag.moved) return;
    drag.moved = true;
    event.preventDefault();
    selectedIndex = drag.index;
    const spot = dragSpot(event, drag);
    if (!spot) { preview = null; renderBoard(); return; }
    preview = previewFor(drag.shapeId, spot[0], spot[1], canPlace(state.board, drag.shapeId, spot[0], spot[1]));
    renderBoard();
  }
  function endPieceDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    event.preventDefault();
    const d = drag;
    const spot = dragSpot(event, d);
    d.button?.removeEventListener('pointermove', movePieceDrag);
    drag = null;
    preview = null;
    if (d.moved && spot && canPlace(state.board, d.shapeId, spot[0], spot[1])) {
      placePiece(d.index, spot[0], spot[1]);
    } else {
      renderBoard();
      if (!d.moved) {
        selectedIndex = selectedIndex === d.index ? null : d.index;
        renderTray();
      }
    }
  }
  function cancelPieceDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    drag.button?.removeEventListener('pointermove', movePieceDrag);
    drag = null;
    preview = null;
    renderBoard();
  }

  function pushHistory() {
    history.push(clone(state));
    if (history.length > 30) history.shift();
  }
  function clearCompleted(board) {
    const fullRows = [];
    const fullCols = [];
    for (let r=0;r<SIZE;r++) if (board[r].every(v => v != null)) fullRows.push(r);
    for (let c=0;c<SIZE;c++) if (board.every(row => row[c] != null)) fullCols.push(c);
    fullRows.forEach(r => { for (let c=0;c<SIZE;c++) board[r][c] = null; });
    fullCols.forEach(c => { for (let r=0;r<SIZE;r++) board[r][c] = null; });
    return fullRows.length + fullCols.length;
  }
  function placePiece(index, row, col) {
    const shapeId = state.tray[index];
    if (!shapeId || !canPlace(state.board, shapeId, row, col)) return false;
    pushHistory();
    const color = (state.movesUsed + index) % BLOCK_CLASSES.length;
    SHAPES[shapeId].forEach(([dr,dc]) => { state.board[row+dr][col+dc] = color; });
    state.movesUsed += 1;
    state.tray[index] = null;
    const lines = clearCompleted(state.board);
    state.lines += lines;
    if (lines > 0) {
      state.combo += 1;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      if (lines >= 2) state.doubleClears += 1;
    } else state.combo = 0;
    const cells = SHAPES[shapeId].length;
    state.score += cells * 10 + lines * 120 + (lines >= 2 ? (lines - 1) * 90 : 0) + (state.combo > 1 ? state.combo * 45 : 0);
    selectedIndex = null;
    preview = null;
    hintPreview = null;

    if (state.kind === 'journey' && goalValue(state, LEVELS[state.level - 1].goal) >= LEVELS[state.level - 1].goal.target) {
      saveState();
      renderAll();
      return completeLevel();
    }
    if (state.kind === 'journey' && state.movesUsed >= LEVELS[state.level - 1].moves) {
      saveState();
      renderAll();
      return failLevel('You ran out of moves.');
    }
    if (state.tray.every(x => x == null)) state.tray = trayFor(state);
    if (!anyTrayPlacement(state)) {
      if (rescueJourneyTray(state)) {
        toast('Fresh piece — keep going.');
      } else {
        saveState();
        renderAll();
        return state.kind === 'journey' ? failLevel('No space remains for the current blocks.') : finishEndless();
      }
    }
    saveState();
    renderAll();
    return true;
  }

  function undo() {
    const prev = history.pop();
    if (!prev) return toast('Nothing to undo yet.');
    state = prev;
    selectedIndex = null;
    preview = null;
    hintPreview = null;
    saveState();
    renderAll();
  }
  function hint() {
    let best = null;
    state.tray.forEach((shapeId,index) => {
      if (!shapeId) return;
      placements(state.board, shapeId).forEach(([r,c]) => {
        const sim = simulatePlacement(state.board, shapeId, r, c);
        const centerPenalty = Math.abs(r-3.5) + Math.abs(c-3.5);
        const score = sim.lines * 100 - centerPenalty;
        if (!best || score > best.score) best = { index, shapeId, row:r, col:c, score };
      });
    });
    if (!best) return toast('No legal placement is left.');
    selectedIndex = best.index;
    hintPreview = previewFor(best.shapeId, best.row, best.col, true);
    renderTray();
    renderBoard();
    toast(best.score >= 100 ? 'This placement clears a line.' : 'This keeps the board open.');
    setTimeout(() => { hintPreview = null; renderBoard(); }, 2200);
  }

  function earnedMedals(level) {
    let count = 1;
    if (state.movesUsed <= level.masteryMoves) count += 1;
    if (goalValue(state, level.bonus) >= level.bonus.target) count += 1;
    return count;
  }
  function completeLevel() {
    const level = LEVELS[state.level - 1];
    state.won = true;
    state.ended = true;
    const medals = earnedMedals(level);
    profile.medals[level.n - 1] = Math.max(profile.medals[level.n - 1], medals);
    if (level.n < 10) profile.currentLevel = Math.max(profile.currentLevel, level.n + 1);
    else profile.chapterOneComplete = true;
    saveProfile();
    clearState('journey');
    resultData = { type:'win', level:level.n, medals, score:state.score, lines:state.lines, moves:state.movesUsed };
    showLevelResult(resultData);
  }
  function failLevel(reason) {
    state.ended = true;
    resultData = { type:'fail', level:state.level, reason, score:state.score, lines:state.lines, moves:state.movesUsed, rescue: history.length ? clone(history[history.length - 1]) : null };
    clearState('journey');
    showLevelResult(resultData);
  }
  function showLevelResult(result) {
    currentView = 'result';
    const level = LEVELS[result.level - 1];
    root.classList.remove('blocks-board-open');
    const isWin = result.type === 'win';
    root.innerHTML = `
      <section class="blocks-result ${isWin ? 'win' : 'fail'}">
        ${isWin && result.level === 10 ? `<img src="./assets/victory-team.jpg" class="blocks-finale-art" alt="Ryan, Link and Sketch celebrating Paige">` : ''}
        <span class="section-kicker">${isWin ? 'LEVEL COMPLETE' : 'TRY AGAIN'}</span>
        <h1>${isWin ? level.title : 'So close.'}</h1>
        ${isWin ? `<div class="result-medals">${medalIcons(result.medals)}</div><p>${goalLabel(level.goal)} complete.</p>` : `<p>${result.reason}</p><p>You reached ${goalValue(state, level.goal)} of ${level.goal.target} ${shortGoalLabel(level.goal).toLowerCase()}.</p>`}
        <div class="blocks-result-stats"><span>${result.lines} lines</span><span>${result.score.toLocaleString()} points</span><span>${result.moves} moves</span></div>
        ${isWin && result.level === 10 ? `<div class="chapter-unlock"><strong>First Clears complete.</strong><span>Link and Sketch consider this acceptable.</span></div>` : ''}
        <button class="button primary big-action" id="blocksPrimary" type="button">${isWin ? (result.level < 10 ? 'Next level' : 'Back to Journey') : 'Retry level'}</button>
        ${!isWin && result.rescue ? `<button class="button secondary big-action" id="blocksUndoFail" type="button">Undo last move</button>` : ''}
        ${!isWin ? `<button class="button secondary big-action" id="blocksResultExit" type="button">Journey</button>` : ''}
      </section>`;
    root.querySelector('#blocksPrimary')?.addEventListener('click', () => {
      if (isWin) {
        if (result.level < 10) showLevelIntro(result.level + 1); else renderHub();
      } else showLevelIntro(result.level);
    });
    root.querySelector('#blocksUndoFail')?.addEventListener('click', () => {
      const rescued = clone(result.rescue);
      rescued.ended = false;
      rescued.won = false;
      openBoard(rescued);
      saveState();
    });
    root.querySelector('#blocksResultExit')?.addEventListener('click', renderHub);
  }

  function finishEndless() {
    state.ended = true;
    const wasBest = state.score > profile.endlessBest;
    profile.endlessBest = Math.max(profile.endlessBest, state.score);
    profile.endlessLinesBest = Math.max(profile.endlessLinesBest, state.lines);
    saveProfile();
    clearState('endless');
    resultData = { type:'endless', score:state.score, lines:state.lines, combo:state.maxCombo };
    currentView = 'result';
    root.classList.remove('blocks-board-open');
    root.innerHTML = `
      <section class="blocks-result">
        <span class="section-kicker">ENDLESS COMPLETE</span>
        <h1>${wasBest ? 'New best.' : 'Nice run.'}</h1>
        <div class="endless-score">${state.score.toLocaleString()}</div>
        <div class="blocks-result-stats"><span>${state.lines} lines</span><span>Combo ×${state.maxCombo || 0}</span><span>Best ${profile.endlessBest.toLocaleString()}</span></div>
        <button class="button primary big-action" id="endlessAgain" type="button">Play again</button>
        <button class="button secondary big-action" id="endlessHome" type="button">Blocks home</button>
      </section>`;
    root.querySelector('#endlessAgain')?.addEventListener('click', () => openBoard(makeState('endless')));
    root.querySelector('#endlessHome')?.addEventListener('click', renderHub);
  }

  function onPageHide() { saveState(); }
  window.addEventListener('pagehide', onPageHide);

  return {
    cleanup() {
      saveState();
      window.removeEventListener('pagehide', onPageHide);
      root.classList.remove('blocks-active', 'blocks-board-open');
    },
    replay() {
      if (resultData?.type === 'endless') openBoard(makeState('endless'));
      else if (resultData?.level) showLevelIntro(Math.min(10, resultData.level + (resultData.type === 'win' ? 1 : 0)));
      else renderHub();
    }
  };
}
