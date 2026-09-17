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
  fiveH: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  fiveV: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  stair: [[0, 0], [0, 1], [1, 1], [1, 2]],
  stairR: [[0, 1], [0, 2], [1, 0], [1, 1]],
  tee: [[0, 0], [0, 1], [0, 2], [1, 1]],
  teeDown: [[0, 1], [1, 0], [1, 1], [1, 2]],
  plus: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
  block3: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],
  square3: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
  ell5: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
  ell5R: [[0, 2], [1, 2], [2, 0], [2, 1], [2, 2]]
};
const BASIC_POOL = ['dot','twoH','twoV','threeH','threeV','square','corner','cornerR','dot','twoH','twoV','square'];
const MID_POOL = [...BASIC_POOL,'fourH','fourV','stair','stairR','tee','teeDown'];
const HARD_POOL = [...MID_POOL,'plus','block3','fiveH','fiveV'];
const EXPERT_POOL = [...HARD_POOL,'square3','ell5','ell5R'];
const BLOCK_CLASSES = ['b-pink','b-blue','b-yellow','b-green','b-purple'];

const LEVELS_PER_CHAPTER = 30;
const CHAPTERS = [
  { title:'First Clears', focus:'lines', secondary:'score', note:'Learn the board and make room.' },
  { title:'Score Street', focus:'score', secondary:'lines', note:'Turn clean placements into points.' },
  { title:'Double Trouble', focus:'double', secondary:'lines', note:'Set up two-line clears.' },
  { title:'Combo Lane', focus:'combo', secondary:'score', note:'Clear on back-to-back moves.' },
  { title:'Row House', focus:'rows', secondary:'lines', note:'Work across the board.' },
  { title:'Column Club', focus:'cols', secondary:'lines', note:'Build vertical openings.' },
  { title:'Open Space', focus:'lines', secondary:'combo', note:'Keep the center breathable.' },
  { title:'Line Garden', focus:'lines', secondary:'rows', note:'Grow clears without crowding the board.' },
  { title:'Point Park', focus:'score', secondary:'double', note:'Make every placement count.' },
  { title:'Double Down', focus:'double', secondary:'score', note:'Build bigger payoffs.' },
  { title:'Rhythm Road', focus:'combo', secondary:'lines', note:'Find a clearing rhythm.' },
  { title:'Row by Row', focus:'rows', secondary:'score', note:'Sweep the board from side to side.' },
  { title:'Column Crossing', focus:'cols', secondary:'combo', note:'Read the vertical lanes.' },
  { title:'Clear Creek', focus:'lines', secondary:'double', note:'Stay loose under pressure.' },
  { title:'Score Studio', focus:'score', secondary:'combo', note:'Build efficient scoring patterns.' },
  { title:'Two at Once', focus:'double', secondary:'rows', note:'Set up bigger clears.' },
  { title:'Combo Corner', focus:'combo', secondary:'score', note:'Protect the next clear.' },
  { title:'Grid Grove', focus:'rows', secondary:'cols', note:'Control the whole board.' },
  { title:'Precision Place', focus:'cols', secondary:'double', note:'Tighter moves, cleaner choices.' },
  { title:'High Stakes', focus:'score', secondary:'lines', note:'Efficiency matters now.' },
  { title:'Long Game', focus:'lines', secondary:'combo', note:'Stay open through longer levels.' },
  { title:'Master Moves', focus:'double', secondary:'score', note:'Build deliberate multi-line clears.' },
  { title:'Final Stretch', focus:'combo', secondary:'lines', note:'Hold the rhythm when space gets tight.' },
  { title:"Paige's Master Table", focus:'lines', secondary:'score', note:'Everything you learned comes together.' }
];
const TOTAL_LEVELS = CHAPTERS.length * LEVELS_PER_CHAPTER;

const LEGACY_LEVELS = [
  { n:1, goal:{type:'lines',target:2}, moves:15, masteryMoves:10, bonus:{type:'double',target:1}, title:'First Clear' },
  { n:2, goal:{type:'lines',target:4}, moves:22, masteryMoves:16, bonus:{type:'combo',target:2}, title:'Keep It Open' },
  { n:3, goal:{type:'score',target:450}, moves:30, masteryMoves:22, bonus:{type:'lines',target:4}, title:'Make It Count' },
  { n:4, goal:{type:'lines',target:5}, moves:30, masteryMoves:22, bonus:{type:'double',target:1}, title:'Two at Once' },
  { n:5, goal:{type:'double',target:1}, moves:30, masteryMoves:22, bonus:{type:'lines',target:6}, title:'Double Clear' },
  { n:6, goal:{type:'lines',target:7}, moves:40, masteryMoves:30, bonus:{type:'combo',target:2}, title:'Find a Rhythm' },
  { n:7, goal:{type:'score',target:900}, moves:40, masteryMoves:30, bonus:{type:'double',target:1}, title:'Build the Score' },
  { n:8, goal:{type:'combo',target:2}, moves:44, masteryMoves:33, bonus:{type:'lines',target:8}, title:'Back to Back' },
  { n:9, goal:{type:'lines',target:9}, moves:48, masteryMoves:36, bonus:{type:'score',target:1200}, title:'Almost There' },
  { n:10, goal:{type:'lines',target:10}, moves:52, masteryMoves:40, bonus:{type:'double',target:2}, title:'Chapter Checkpoint' }
];

const TITLE_BANK = {
  lines:['Clear Path','Open Lane','Clean Sweep','Room to Move','Fresh Space','Make a Lane'],
  score:['Make It Count','Point Run','Stack Value','Big Finish','Score Builder','Points on the Board'],
  double:['Two at Once','Double Take','Twin Clear','Pair It Up','Double Vision','Set Up Two'],
  combo:['Keep the Rhythm','Back to Back','Stay in Flow','Chain Reaction','One More Clear','Keep It Going'],
  rows:['Across the Board','Row Runner','Side to Side','Clean Across','Row Work','Sweep Across'],
  cols:['Down the Line','Column Climb','Vertical Path','Straight Down','Column Work','Tall Order']
};

function chapterIndexForLevel(levelNumber) { return Math.floor((levelNumber - 1) / LEVELS_PER_CHAPTER); }
function chapterForLevel(levelNumber) { return CHAPTERS[chapterIndexForLevel(levelNumber)]; }
function chapterStart(index) { return index * LEVELS_PER_CHAPTER + 1; }
function chapterEnd(index) { return chapterStart(index) + LEVELS_PER_CHAPTER - 1; }
function difficultyForLevel(levelNumber) { return (levelNumber - 1) / Math.max(1, TOTAL_LEVELS - 1); }
function shapePoolForLevel(levelNumber) {
  if (!levelNumber || levelNumber <= 90) return BASIC_POOL;
  if (levelNumber <= 270) return MID_POOL;
  if (levelNumber <= 510) return HARD_POOL;
  return EXPERT_POOL;
}
function levelGoalType(levelNumber, chapter, within) {
  let type;
  if (within % 10 === 0) type = within === 30 ? 'lines' : chapter.secondary;
  else if (within % 7 === 0) type = 'score';
  else if (within % 5 === 0) type = chapter.secondary;
  else type = chapter.focus;
  // Doubles and combos stay as mastery goals. They are fun skill targets, but should not block Journey progress.
  if (type === 'double') return within % 2 ? 'lines' : 'score';
  if (type === 'combo') return within % 2 ? 'score' : 'lines';
  return type;
}
function goalForType(type, levelNumber, moves, within) {
  const d = difficultyForLevel(levelNumber);
  const stage = Math.floor((within - 1) / 10);
  if (type === 'lines') return { type, target: Math.max(4, Math.round(5 + d * 9 + stage * 2 + (within % 4))) };
  if (type === 'score') return { type, target: Math.round((900 + d * 3100 + stage * 450 + (within % 5) * 120) / 50) * 50 };
  if (type === 'double') return { type, target: Math.min(3, 1 + Math.floor(d * 2.4) + (stage >= 2 ? 1 : 0)) };
  if (type === 'combo') return { type, target: Math.min(3, 2 + (d > .58 ? 1 : 0)) };
  if (type === 'rows' || type === 'cols') return { type, target: d < .30 ? 2 : (d < .72 ? 3 : 4) };
  return { type:'lines', target:8 };
}
function bonusForLevel(primary, levelNumber, within, chapter) {
  const d = difficultyForLevel(levelNumber);
  const candidates = [chapter.secondary, 'lines', 'score', 'double', 'combo', 'rows', 'cols'].filter(type => type !== primary);
  const type = candidates[(levelNumber + within) % candidates.length];
  if (type === 'lines') return { type, target: Math.max(4, Math.round(5 + d * 7)) };
  if (type === 'score') return { type, target: Math.round((1100 + d * 2600) / 50) * 50 };
  if (type === 'double') return { type, target: d > .65 ? 2 : 1 };
  if (type === 'combo') return { type, target: d > .72 ? 3 : 2 };
  if (type === 'rows' || type === 'cols') return { type, target: Math.max(3, Math.round(3 + d * 4)) };
  return { type:'lines', target:6 };
}
function generatedTitle(type, levelNumber, within, chapter) {
  if (within === 30) return `${chapter.title} Finale`;
  if (within % 10 === 0) return `${chapter.title} Checkpoint`;
  const bank = TITLE_BANK[type] || TITLE_BANK.lines;
  return bank[(levelNumber + within) % bank.length];
}
function getLevel(levelNumber) {
  const n = Math.max(1, Math.min(TOTAL_LEVELS, Number(levelNumber) || 1));
  if (n <= LEGACY_LEVELS.length) return { ...clone(LEGACY_LEVELS[n - 1]), chapter:1, within:n, finale:false, milestone:n === 10 };
  const ci = chapterIndexForLevel(n);
  const chapter = CHAPTERS[ci];
  const within = n - chapterStart(ci) + 1;
  const d = difficultyForLevel(n);
  const stage = Math.floor((within - 1) / 10);
  const milestone = within % 10 === 0;
  const finale = within === LEVELS_PER_CHAPTER;
  let moves = Math.round(35 + d * 25 + stage * 7 + ((within - 1) % 5));
  if (milestone) moves += 7;
  const type = levelGoalType(n, chapter, within);
  let goal = goalForType(type, n, moves, within);
  if (milestone) {
    if (goal.type === 'lines') goal = { ...goal, target: goal.target + 2 };
    if (goal.type === 'score') goal = { ...goal, target: goal.target + 450 };
  }
  const masteryRatio = .76 - d * .05;
  return {
    n,
    chapter:ci + 1,
    within,
    milestone,
    finale,
    title:generatedTitle(type, n, within, chapter),
    goal,
    moves,
    masteryMoves:Math.max(12, Math.floor(moves * masteryRatio)),
    bonus:bonusForLevel(goal.type, n, within, chapter)
  };
}

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
  return { version:2, currentLevel:1, medals:Array(TOTAL_LEVELS).fill(0), endlessBest:0, endlessLinesBest:0, journeyComplete:false };
}
function normalizeProfile(value) {
  const base = defaultProfile();
  if (!value || typeof value !== 'object') return base;
  const oldMedals = Array.isArray(value.medals) ? value.medals : [];
  base.medals = Array.from({length:TOTAL_LEVELS}, (_,i) => clamp(Number(oldMedals[i]) || 0, 0, 3));
  let current = clamp(Number(value.currentLevel) || 1, 1, TOTAL_LEVELS);
  // v8 ended at Level 10. If Paige already finished that chapter, continue at 11 instead of resetting her.
  if (value.chapterOneComplete && current <= 10) current = 11;
  const highestMedaled = base.medals.reduce((max, medals, i) => medals > 0 ? i + 1 : max, 0);
  if (highestMedaled >= current && highestMedaled < TOTAL_LEVELS) current = highestMedaled + 1;
  base.currentLevel = current;
  base.endlessBest = Math.max(0, Number(value.endlessBest) || 0);
  base.endlessLinesBest = Math.max(0, Number(value.endlessLinesBest) || 0);
  base.journeyComplete = Boolean(value.journeyComplete) || highestMedaled >= TOTAL_LEVELS;
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
  if (goal.type === 'rows') return state.rowClears || 0;
  if (goal.type === 'cols') return state.colClears || 0;
  return 0;
}
function goalLabel(goal) {
  if (goal.type === 'lines') return `Clear ${goal.target} line${goal.target === 1 ? '' : 's'}`;
  if (goal.type === 'score') return `Score ${goal.target.toLocaleString()} points`;
  if (goal.type === 'double') return `Make ${goal.target} double clear${goal.target === 1 ? '' : 's'}`;
  if (goal.type === 'combo') return `Make a ${goal.target}-clear combo`;
  if (goal.type === 'rows') return `Clear ${goal.target} row${goal.target === 1 ? '' : 's'}`;
  if (goal.type === 'cols') return `Clear ${goal.target} column${goal.target === 1 ? '' : 's'}`;
  return 'Complete the goal';
}
function shortGoalLabel(goal) {
  if (goal.type === 'lines') return 'Lines';
  if (goal.type === 'score') return 'Score';
  if (goal.type === 'double') return 'Doubles';
  if (goal.type === 'combo') return 'Combo';
  if (goal.type === 'rows') return 'Rows';
  if (goal.type === 'cols') return 'Columns';
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
  const pool = state.kind === 'journey' ? shapePoolForLevel(state.level) : EXPERT_POOL;
  const tray = Array.from({length:3}, (_, slot) => {
    const f = seededFloat(`${state.seed}:${state.dealIndex}:${slot}`);
    return pool[Math.floor(f * pool.length) % pool.length];
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
  const level = levelNumber ? getLevel(levelNumber) : null;
  const state = {
    version:2, kind, level:levelNumber,
    board:emptyBoard(), tray:[null,null,null], dealIndex:0,
    seed: kind === 'journey' ? `paige-blocks-v9-${levelNumber}` : `paige-endless-${Date.now()}`,
    movesUsed:0, score:0, lines:0, rowClears:0, colClears:0, combo:0, maxCombo:0, doubleClears:0,
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
  let viewedChapter = chapterIndexForLevel(profile.currentLevel);

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
  function renderHub(chapterIndex = viewedChapter) {
    currentView = 'hub';
    state = null;
    selectedIndex = null;
    root.classList.remove('blocks-board-open');
    const savedJourney = loadSaved('journey');
    const savedEndless = loadSaved('endless');
    const current = getLevel(profile.currentLevel);
    const unlockedChapter = profile.journeyComplete ? CHAPTERS.length - 1 : chapterIndexForLevel(profile.currentLevel);
    viewedChapter = clamp(Number(chapterIndex) || 0, 0, unlockedChapter);
    const chapter = CHAPTERS[viewedChapter];
    const start = chapterStart(viewedChapter);
    const end = chapterEnd(viewedChapter);
    const chapterLevels = Array.from({length:LEVELS_PER_CHAPTER}, (_,i) => getLevel(start + i));
    const chapterMedals = profile.medals.slice(start - 1, end).reduce((a,b) => a+b, 0);
    const completedLevels = profile.medals.filter(Boolean).length;
    const overallPct = Math.round((completedLevels / TOTAL_LEVELS) * 100);
    const primaryCopy = profile.journeyComplete ? 'Journey complete' : `Level ${profile.currentLevel}: ${current.title}`;
    const primaryGoal = profile.journeyComplete ? `${TOTAL_LEVELS} levels cleared · replay any chapter` : goalLabel(current.goal);
    root.innerHTML = `
      <section class="blocks-hub">
        <div class="blocks-hub-head">
          <span class="section-kicker">PAIGE’S BLOCKS · ${TOTAL_LEVELS} LEVELS</span>
          <h1>Clear a goal. Move forward.</h1>
          <p>24 chapters. No timer. No streak punishment. Just a long road of puzzles.</p>
        </div>
        <button class="blocks-primary-card" id="journeyOpen" type="button">
          <span><small>JOURNEY · CHAPTER ${chapterIndexForLevel(profile.currentLevel)+1} OF ${CHAPTERS.length}</small><strong>${primaryCopy}</strong><em>${primaryGoal}</em></span>
          <b>${savedJourney ? 'Resume →' : (profile.journeyComplete ? 'Replay →' : 'Play →')}</b>
        </button>
        <div class="journey-overall">
          <div><span>Journey progress</span><strong>${completedLevels} / ${TOTAL_LEVELS}</strong></div>
          <div class="journey-bar"><i style="width:${overallPct}%"></i></div>
          <small>${overallPct}% complete</small>
        </div>
        <div class="chapter-progress">
          <div class="chapter-heading">
            <button type="button" id="chapterPrev" class="chapter-arrow" ${viewedChapter <= 0 ? 'disabled' : ''} aria-label="Previous chapter">‹</button>
            <span><small>CHAPTER ${viewedChapter+1}</small><strong>${chapter.title}</strong><em>${chapter.note}</em></span>
            <button type="button" id="chapterNext" class="chapter-arrow" ${viewedChapter >= unlockedChapter ? 'disabled' : ''} aria-label="Next chapter">›</button>
          </div>
          <div class="chapter-medals"><span>Chapter medals</span><strong>${chapterMedals} / ${LEVELS_PER_CHAPTER * 3}</strong></div>
          <div class="medal-track">${chapterLevels.map(level => {
            const unlocked = profile.journeyComplete || level.n <= profile.currentLevel || profile.medals[level.n-1] > 0;
            return `<button type="button" data-level="${level.n}" class="level-dot ${level.n === profile.currentLevel && !profile.journeyComplete ? 'current' : ''} ${profile.medals[level.n-1] ? 'done' : ''} ${!unlocked ? 'locked' : ''} ${level.milestone ? 'milestone' : ''}" ${!unlocked ? 'disabled' : ''}><b>${level.within}</b><small>${profile.medals[level.n-1] ? medalIcons(profile.medals[level.n-1]) : (level.milestone ? '◆' : '')}</small></button>`;
          }).join('')}</div>
        </div>
        <button class="blocks-endless-card" id="endlessOpen" type="button">
          <span><small>ENDLESS</small><strong>Relax and chase your best</strong><em>Best ${profile.endlessBest.toLocaleString()} · ${profile.endlessLinesBest} lines</em></span>
          <b>${savedEndless ? 'Resume →' : 'Play →'}</b>
        </button>
        <div class="blocks-hub-note">The Journey is built as a long-form path: 720 levels across 24 chapters. Every 10th level is a checkpoint and every 30th level finishes a chapter.</div>
      </section>`;
    root.querySelector('#journeyOpen')?.addEventListener('click', () => {
      const saved = loadSaved('journey');
      if (saved && saved.level === profile.currentLevel && !profile.journeyComplete) openBoard(saved);
      else showLevelIntro(profile.journeyComplete ? TOTAL_LEVELS : profile.currentLevel);
    });
    root.querySelector('#chapterPrev')?.addEventListener('click', () => renderHub(viewedChapter - 1));
    root.querySelector('#chapterNext')?.addEventListener('click', () => renderHub(viewedChapter + 1));
    root.querySelector('#endlessOpen')?.addEventListener('click', () => {
      const saved = loadSaved('endless');
      openBoard(saved || makeState('endless'));
    });
    root.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click', () => showLevelIntro(Number(button.dataset.level))));
  }

  function showLevelIntro(levelNumber) {
    const level = getLevel(levelNumber);
    const chapter = chapterForLevel(level.n);
    const existing = loadSaved('journey');
    const canResume = existing?.level === level.n;
    currentView = 'intro';
    root.innerHTML = `
      <section class="level-intro">
        <button class="text-back" id="levelBack" type="button">‹ Journey</button>
        <span class="section-kicker">${chapter.title.toUpperCase()} · LEVEL ${level.n} OF ${TOTAL_LEVELS}</span>
        <h1>${level.title}</h1>
        ${level.milestone ? `<div class="milestone-chip">${level.finale ? 'CHAPTER FINALE' : 'CHECKPOINT'}</div>` : ''}
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
        <button class="button primary big-action" id="startLevel" type="button">${canResume ? 'Resume level' : 'Start level'}</button>
        ${canResume ? `<button class="button secondary big-action" id="restartLevel" type="button">Restart this level</button>` : ''}
      </section>`;
    root.querySelector('#levelBack')?.addEventListener('click', () => renderHub(chapterIndexForLevel(level.n)));
    root.querySelector('#startLevel')?.addEventListener('click', () => openBoard(canResume ? existing : makeState('journey', level.n)));
    root.querySelector('#restartLevel')?.addEventListener('click', () => { clearState('journey'); openBoard(makeState('journey', level.n)); });
  }

  function boardMarkup() {
    const level = state.kind === 'journey' ? getLevel(state.level) : null;
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
    state.rowClears = Math.max(0, Number(state.rowClears) || 0);
    state.colClears = Math.max(0, Number(state.colClears) || 0);
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
      const level = getLevel(state.level);
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
    return { lines:fullRows.length + fullCols.length, rows:fullRows.length, cols:fullCols.length };
  }
  function placePiece(index, row, col) {
    const shapeId = state.tray[index];
    if (!shapeId || !canPlace(state.board, shapeId, row, col)) return false;
    pushHistory();
    const color = (state.movesUsed + index) % BLOCK_CLASSES.length;
    SHAPES[shapeId].forEach(([dr,dc]) => { state.board[row+dr][col+dc] = color; });
    state.movesUsed += 1;
    state.tray[index] = null;
    const cleared = clearCompleted(state.board);
    const lines = cleared.lines;
    state.lines += lines;
    state.rowClears += cleared.rows;
    state.colClears += cleared.cols;
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

    if (state.kind === 'journey' && goalValue(state, getLevel(state.level).goal) >= getLevel(state.level).goal.target) {
      saveState();
      renderAll();
      return completeLevel();
    }
    if (state.kind === 'journey' && state.movesUsed >= getLevel(state.level).moves) {
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
    const level = state.kind === 'journey' ? getLevel(state.level) : null;
    const goalType = level?.goal?.type || 'lines';
    state.tray.forEach((shapeId,index) => {
      if (!shapeId) return;
      placements(state.board, shapeId).forEach(([r,c]) => {
        const sim = simulatePlacement(state.board, shapeId, r, c);
        const centerPenalty = Math.abs(r-3.5) + Math.abs(c-3.5);
        let goalBoost = sim.lines * 120;
        if (goalType === 'rows') goalBoost += sim.fullRows.length * 220;
        if (goalType === 'cols') goalBoost += sim.fullCols.length * 220;
        if (goalType === 'double' && sim.lines >= 2) goalBoost += 450;
        if (goalType === 'combo' && sim.lines > 0) goalBoost += state.combo > 0 ? 360 : 180;
        if (goalType === 'score') goalBoost += sim.lines * 80 + SHAPES[shapeId].length * 4;
        const score = goalBoost - centerPenalty * 2;
        if (!best || score > best.score) best = { index, shapeId, row:r, col:c, score, lines:sim.lines };
      });
    });
    if (!best) return toast('No legal placement is left.');
    selectedIndex = best.index;
    hintPreview = previewFor(best.shapeId, best.row, best.col, true);
    renderTray();
    renderBoard();
    toast(best.lines > 0 ? 'This move helps the goal.' : 'This keeps the board open.');
    setTimeout(() => { hintPreview = null; renderBoard(); }, 2200);
  }

  function earnedMedals(level) {
    let count = 1;
    if (state.movesUsed <= level.masteryMoves) count += 1;
    if (goalValue(state, level.bonus) >= level.bonus.target) count += 1;
    return count;
  }
  function completeLevel() {
    const level = getLevel(state.level);
    state.won = true;
    state.ended = true;
    const medals = earnedMedals(level);
    profile.medals[level.n - 1] = Math.max(profile.medals[level.n - 1], medals);
    if (level.n < TOTAL_LEVELS) {
      profile.currentLevel = Math.max(profile.currentLevel, level.n + 1);
    } else {
      profile.currentLevel = TOTAL_LEVELS;
      profile.journeyComplete = true;
    }
    viewedChapter = chapterIndexForLevel(profile.currentLevel);
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
    const level = getLevel(result.level);
    const chapterIndex = chapterIndexForLevel(level.n);
    const chapter = CHAPTERS[chapterIndex];
    const nextChapter = CHAPTERS[chapterIndex + 1] || null;
    root.classList.remove('blocks-board-open');
    const isWin = result.type === 'win';
    const journeyFinished = isWin && result.level === TOTAL_LEVELS;
    const chapterFinished = isWin && level.finale;
    const checkpoint = isWin && level.milestone && !level.finale;
    let unlockCopy = '';
    if (journeyFinished) unlockCopy = `<div class="chapter-unlock"><strong>All ${TOTAL_LEVELS} levels complete.</strong><span>Ryan, Link and Sketch have officially run out of objections.</span></div>`;
    else if (chapterFinished) unlockCopy = `<div class="chapter-unlock"><strong>${chapter.title} complete.</strong><span>${nextChapter ? `Next up: ${nextChapter.title}.` : 'Master table complete.'}</span></div>`;
    else if (checkpoint) unlockCopy = `<div class="chapter-unlock"><strong>Checkpoint cleared.</strong><span>${LEVELS_PER_CHAPTER - level.within} levels remain in ${chapter.title}.</span></div>`;
    const primaryLabel = !isWin ? 'Retry level' : journeyFinished ? 'Back to Journey' : chapterFinished ? 'Next chapter' : 'Next level';
    root.innerHTML = `
      <section class="blocks-result ${isWin ? 'win' : 'fail'}">
        ${chapterFinished ? `<img src="./assets/victory-team.jpg" class="blocks-finale-art" alt="Ryan, Link and Sketch celebrating Paige">` : ''}
        <span class="section-kicker">${isWin ? (journeyFinished ? 'JOURNEY COMPLETE' : chapterFinished ? 'CHAPTER COMPLETE' : checkpoint ? 'CHECKPOINT COMPLETE' : 'LEVEL COMPLETE') : 'TRY AGAIN'}</span>
        <h1>${isWin ? level.title : 'So close.'}</h1>
        ${isWin ? `<div class="result-medals">${medalIcons(result.medals)}</div><p>${goalLabel(level.goal)} complete.</p>` : `<p>${result.reason}</p><p>You reached ${goalValue(state, level.goal)} of ${level.goal.target} ${shortGoalLabel(level.goal).toLowerCase()}.</p>`}
        <div class="blocks-result-stats"><span>${result.lines} lines</span><span>${result.score.toLocaleString()} points</span><span>${result.moves} moves</span></div>
        ${unlockCopy}
        <button class="button primary big-action" id="blocksPrimary" type="button">${primaryLabel}</button>
        ${!isWin && result.rescue ? `<button class="button secondary big-action" id="blocksUndoFail" type="button">Undo last move</button>` : ''}
        ${!isWin ? `<button class="button secondary big-action" id="blocksResultExit" type="button">Journey</button>` : ''}
      </section>`;
    root.querySelector('#blocksPrimary')?.addEventListener('click', () => {
      if (isWin) {
        if (journeyFinished) renderHub(CHAPTERS.length - 1);
        else showLevelIntro(result.level + 1);
      } else showLevelIntro(result.level);
    });
    root.querySelector('#blocksUndoFail')?.addEventListener('click', () => {
      const rescued = clone(result.rescue);
      rescued.ended = false;
      rescued.won = false;
      openBoard(rescued);
      saveState();
    });
    root.querySelector('#blocksResultExit')?.addEventListener('click', () => renderHub(chapterIndex));
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
    root.querySelector('#endlessHome')?.addEventListener('click', () => renderHub());
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
      else if (resultData?.level) showLevelIntro(Math.min(TOTAL_LEVELS, resultData.level + (resultData.type === 'win' ? 1 : 0)));
      else renderHub();
    }
  };
}
