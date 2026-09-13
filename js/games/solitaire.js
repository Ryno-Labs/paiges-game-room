const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_KEYS = ['S', 'H', 'D', 'C'];
const RED = new Set(['♥', '♦']);
const RANK_LABEL = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
const CURRENT_KEY = 'paige.solitaire.current.v3';
const PROFILE_KEY = 'paige.solitaire.profile.v3';
const LEGACY_STATE_KEY = 'paige.solitaire.state.v2';
const LEGACY_STATS_KEY = 'paige.solitaire.stats';

const MODES = {
  classic: {
    id: 'classic', title: 'Classic', eyebrow: 'RELAXED', draw: 1, vegas: false, passLimit: Infinity,
    subtitle: 'Draw 1 · forgiving and familiar', detail: 'Easy rhythm, unlimited passes, undo and hints.'
  },
  challenge: {
    id: 'challenge', title: 'Challenge', eyebrow: 'DRAW 3', draw: 3, vegas: false, passLimit: Infinity,
    subtitle: 'Draw 3 · more decisions', detail: 'Same calm table, but the waste pile makes every move matter more.'
  },
  vegas: {
    id: 'vegas', title: 'Vegas', eyebrow: 'BANKROLL', draw: 1, vegas: true, passLimit: 1,
    subtitle: 'Build Paige’s bankroll', detail: '$52 buy-in · +$5 for every card banked · one stock pass.'
  },
  daily: {
    id: 'daily', title: 'Today’s Deal', eyebrow: 'DAILY VEGAS', draw: 1, vegas: true, passLimit: 1,
    subtitle: 'One shared deal for today', detail: 'A seeded Vegas hand that changes each day.'
  }
};

const THEMES = ['green', 'midnight', 'burgundy'];
const THEME_LABELS = { green: 'Classic Green', midnight: 'Midnight Casino', burgundy: 'Warm Burgundy' };

function rankLabel(rank) { return RANK_LABEL[rank] || String(rank); }
function cardColor(card) { return RED.has(card.suit) ? 'red' : 'black'; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function localDayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function seededRng(seedText) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeDeck() {
  let id = 0;
  return SUITS.flatMap((suit, suitIndex) => Array.from({ length: 13 }, (_, index) => ({
    id: `${SUIT_KEYS[suitIndex]}${index + 1}-${id++}`,
    suit,
    rank: index + 1,
    faceUp: false
  })));
}
function shuffle(deck, rng = Math.random) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
function blankStats() {
  return { played: 0, wins: 0, bestMoves: null, bestTime: null, profitable: 0, bestProfit: null, cardsBanked: 0 };
}
function defaultProfile() {
  return {
    version: 3,
    bankroll: 0,
    lastMode: 'classic',
    theme: 'green',
    stats: {
      classic: blankStats(), challenge: blankStats(), vegas: blankStats(), daily: blankStats()
    },
    daily: { lastDate: null, bestProfit: null }
  };
}
function normalizeProfile(value) {
  const base = defaultProfile();
  if (!value || typeof value !== 'object') return base;
  base.bankroll = Number.isFinite(value.bankroll) ? value.bankroll : 0;
  base.lastMode = MODES[value.lastMode] ? value.lastMode : 'classic';
  base.theme = THEMES.includes(value.theme) ? value.theme : 'green';
  for (const id of Object.keys(MODES)) {
    const source = value.stats?.[id] || {};
    base.stats[id] = { ...blankStats(), ...source };
  }
  base.daily = { ...base.daily, ...(value.daily || {}) };
  return base;
}
function isCard(card) {
  return card && typeof card.id === 'string' && SUITS.includes(card.suit) && Number.isInteger(card.rank) && card.rank >= 1 && card.rank <= 13 && typeof card.faceUp === 'boolean';
}
function validState(state) {
  try {
    if (!state || !MODES[state.mode] || !Array.isArray(state.stock) || !Array.isArray(state.waste) || !Array.isArray(state.tableau) || state.tableau.length !== 7) return false;
    if (!state.foundations || !SUITS.every(suit => Array.isArray(state.foundations[suit]))) return false;
    const cards = [...state.stock, ...state.waste, ...state.tableau.flat(), ...SUITS.flatMap(suit => state.foundations[suit])];
    return cards.length === 52 && cards.every(isCard) && new Set(cards.map(card => card.id)).size === 52;
  } catch { return false; }
}
function freshState(modeId) {
  const mode = MODES[modeId];
  const rng = mode.id === 'daily' ? seededRng(`paige-${localDayKey()}`) : Math.random;
  const deck = shuffle(makeDeck(), rng);
  const tableau = Array.from({ length: 7 }, () => []);
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck.pop();
      card.faceUp = row === col;
      tableau[col].push(card);
    }
  }
  return {
    version: 3,
    mode: mode.id,
    drawCount: mode.draw,
    passLimit: Number.isFinite(mode.passLimit) ? mode.passLimit : null,
    passNumber: 1,
    stock: deck,
    waste: [],
    foundations: { '♠': [], '♥': [], '♦': [], '♣': [] },
    tableau,
    moves: 0,
    elapsed: 0,
    startedAt: Date.now(),
    won: false,
    ended: false,
    handDelta: mode.vegas ? -52 : 0,
    dayKey: mode.id === 'daily' ? localDayKey() : null
  };
}
function canStackOnTableau(card, target) {
  if (!target) return card.rank === 13;
  return target.faceUp && target.rank === card.rank + 1 && cardColor(target) !== cardColor(card);
}
function validRun(cards) {
  if (!cards.length || !cards[0].faceUp) return false;
  for (let i = 0; i < cards.length - 1; i++) {
    if (!cards[i + 1].faceUp || cards[i].rank !== cards[i + 1].rank + 1 || cardColor(cards[i]) === cardColor(cards[i + 1])) return false;
  }
  return true;
}

export async function mount({ root, toast, celebrate, storage }) {
  let profile = normalizeProfile(storage.get(PROFILE_KEY, null));
  let state = storage.get(CURRENT_KEY, null);
  if (!validState(state) || state.won || state.ended || (state.mode === 'daily' && state.dayKey !== localDayKey())) {
    state = null;
    storage.remove(CURRENT_KEY);
  }

  // Migrate Paige's active v7 Klondike hand into Classic once, so an update
  // does not unnecessarily throw away the hand she was already playing.
  if (!state) {
    const legacy = storage.get(LEGACY_STATE_KEY, null);
    if (legacy && !legacy.won) {
      const candidate = {
        ...legacy,
        version: 3,
        mode: 'classic',
        drawCount: 1,
        passLimit: null,
        passNumber: 1,
        ended: false,
        handDelta: 0,
        dayKey: null
      };
      if (validState(candidate)) {
        state = candidate;
        storage.set(CURRENT_KEY, state);
      }
    }
  }

  const legacyStats = storage.get(LEGACY_STATS_KEY, null);
  if (legacyStats?.wins && profile.stats.classic.wins === 0) profile.stats.classic.wins = Number(legacyStats.wins) || 0;
  storage.remove(LEGACY_STATE_KEY);

  let selected = null;
  let history = [];
  let timerId = null;
  let newConfirmAt = 0;
  let suppressClickUntil = 0;
  let drag = null;
  let layoutRaf = 0;
  let resizeObserver = null;
  let currentView = 'hub';
  let lastPlayedMode = profile.lastMode;
  let dealResult = null;

  root.classList.add('solitaire-active');
  applyTheme();
  saveProfile();

  function saveProfile() { storage.set(PROFILE_KEY, profile); }
  function saveState() {
    if (!state || state.won || state.ended) {
      storage.remove(CURRENT_KEY);
      return;
    }
    checkpointTime();
    storage.set(CURRENT_KEY, state);
  }
  function elapsedMs() {
    if (!state) return 0;
    return state.won || state.ended ? state.elapsed : state.elapsed + Math.max(0, Date.now() - state.startedAt);
  }
  function fmtTime(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = String(total % 60).padStart(2, '0');
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
  }
  function money(value) {
    const sign = value < 0 ? '−' : '';
    return `${sign}$${Math.abs(Math.round(value)).toLocaleString()}`;
  }
  function signedMoney(value) {
    if (value > 0) return `+$${Math.round(value).toLocaleString()}`;
    if (value < 0) return `−$${Math.abs(Math.round(value)).toLocaleString()}`;
    return '$0';
  }
  function checkpointTime() {
    if (!state || state.won || state.ended) return;
    state.elapsed = elapsedMs();
    state.startedAt = Date.now();
  }
  function applyTheme() {
    THEMES.forEach(theme => root.classList.toggle(`sol-theme-${theme}`, profile.theme === theme));
  }
  function cycleTheme() {
    const index = THEMES.indexOf(profile.theme);
    profile.theme = THEMES[(index + 1) % THEMES.length];
    applyTheme();
    saveProfile();
    toast(THEME_LABELS[profile.theme]);
    if (currentView === 'hub') renderHub();
  }
  function snapshot() {
    return { state: clone(state), bankroll: profile.bankroll };
  }
  function pushHistory() {
    if (!state) return;
    checkpointTime();
    history.push(snapshot());
    if (history.length > 80) history.shift();
  }
  function restoreSnapshot(snap) {
    state = snap.state;
    state.startedAt = Date.now();
    profile.bankroll = snap.bankroll;
    saveProfile();
    saveState();
  }
  function modeForState() { return state ? MODES[state.mode] : MODES[profile.lastMode]; }
  function foundationCount() { return state ? SUITS.reduce((sum, suit) => sum + state.foundations[suit].length, 0) : 0; }
  function passLabel() {
    if (!state) return '';
    const mode = modeForState();
    if (!mode.vegas) return `Draw ${mode.draw}`;
    return mode.passLimit === 1 ? 'Pass 1 / 1' : `Pass ${state.passNumber} / ${mode.passLimit}`;
  }

  function renderHub() {
    currentView = 'hub';
    clearTableListeners();
    root.classList.remove('sol-table-open');
    root.innerHTML = `
      <section class="sol-hub">
        <div class="sol-hub-head">
          <span class="section-kicker">PAIGE’S SOLITAIRE</span>
          <h1>Pick your table.</h1>
          <p>Four ways to play. Same calm card table. No ads, ever.</p>
        </div>
        <div class="bankroll-card">
          <div><span class="bankroll-label">PAIGE’S BANKROLL</span><strong>${money(profile.bankroll)}</strong></div>
          <button class="theme-chip" id="solTheme" type="button">${THEME_LABELS[profile.theme]} ↻</button>
        </div>
        ${state ? `
          <button class="continue-card" id="solContinue" type="button">
            <span><small>CONTINUE</small><strong>${MODES[state.mode].title}</strong><em>${state.moves} moves · ${state.mode === 'vegas' || state.mode === 'daily' ? signedMoney(state.handDelta) : fmtTime(elapsedMs())}</em></span>
            <b>Resume →</b>
          </button>` : ''}
        <div class="sol-mode-grid">
          ${Object.values(MODES).map(mode => {
            const stat = profile.stats[mode.id];
            const foot = mode.vegas
              ? `${stat.profitable} profitable · best ${stat.bestProfit == null ? '$0' : signedMoney(stat.bestProfit)}`
              : `${stat.wins} win${stat.wins === 1 ? '' : 's'}${stat.bestMoves ? ` · best ${stat.bestMoves} moves` : ''}`;
            return `
              <button class="sol-mode-card mode-${mode.id}" type="button" data-sol-mode="${mode.id}">
                <span class="sol-mode-eyebrow">${mode.eyebrow}</span>
                <strong>${mode.title}</strong>
                <span>${mode.subtitle}</span>
                <small>${mode.detail}</small>
                <em>${foot}</em>
              </button>`;
          }).join('')}
        </div>
        <div class="sol-hub-note">Vegas is fake money only. The bankroll is just Paige’s running score.</div>
      </section>`;

    root.querySelector('#solTheme')?.addEventListener('click', cycleTheme);
    root.querySelector('#solContinue')?.addEventListener('click', () => openTable(false));
    root.querySelectorAll('[data-sol-mode]').forEach(button => {
      button.addEventListener('click', () => startMode(button.dataset.solMode));
    });
  }

  function startMode(modeId) {
    const mode = MODES[modeId];
    if (!mode) return;
    if (state && !state.ended && !state.won && state.moves > 0) {
      // Preserve the current hand until Paige deliberately starts another one.
      const sameMode = state.mode === modeId;
      if (sameMode) {
        openTable(false);
        return;
      }
    }
    beginFreshHand(modeId);
  }

  function beginFreshHand(modeId) {
    const mode = MODES[modeId];
    if (!mode) return;
    profile.lastMode = modeId;
    lastPlayedMode = modeId;
    profile.stats[modeId].played += 1;
    state = freshState(modeId);
    if (mode.vegas) profile.bankroll -= 52;
    history = [];
    selected = null;
    dealResult = null;
    saveProfile();
    saveState();
    openTable(true);
  }

  function tableMarkup() {
    const mode = modeForState();
    return `
      <section class="game-screen solitaire-screen">
        <div class="game-toolbar sol-toolbar">
          <button class="button small sol-modes-btn" id="solModes" type="button">Modes</button>
          <div class="sol-table-status">
            <strong>${mode.title}</strong>
            <span id="solModeMeta">${mode.vegas ? `${signedMoney(state.handDelta)} hand` : `Draw ${mode.draw}`}</span>
          </div>
          <div class="toolbar-actions">
            <button class="button small iconish" id="solUndo" type="button">Undo</button>
            <button class="button small iconish" id="solHint" type="button">Hint</button>
          </div>
        </div>
        <div class="sol-subbar">
          <span id="solMoves">0 moves</span>
          <span id="solTime">0:00</span>
          <span id="solPass">${passLabel()}</span>
          ${mode.vegas ? `<span class="sol-bankroll-live" id="solBankroll">${money(profile.bankroll)}</span>` : ''}
        </div>
        <div class="solitaire-wrap">
          <div class="solitaire-board" id="solBoard">
            <div class="sol-top" id="solTop"></div>
            <div class="tableau" id="solTableau"></div>
            <div class="sol-bottom-actions">
              <button class="sol-quiet-btn" id="solNew" type="button">New deal</button>
              <button class="sol-quiet-btn hidden" id="solFinish" type="button">Finish cards</button>
              ${mode.vegas ? `<button class="sol-quiet-btn" id="solEnd" type="button">End hand</button>` : ''}
            </div>
          </div>
        </div>
      </section>`;
  }

  let boardEl = null;
  let topEl = null;
  let tabEl = null;
  let movesEl = null;
  let timeEl = null;
  let passEl = null;
  let bankrollEl = null;
  let modeMetaEl = null;
  let newButton = null;

  function openTable(resetScroll = false) {
    if (!state || state.won || state.ended) return renderHub();
    currentView = 'table';
    root.classList.add('sol-table-open');
    root.innerHTML = tableMarkup();
    boardEl = root.querySelector('#solBoard');
    topEl = root.querySelector('#solTop');
    tabEl = root.querySelector('#solTableau');
    movesEl = root.querySelector('#solMoves');
    timeEl = root.querySelector('#solTime');
    passEl = root.querySelector('#solPass');
    bankrollEl = root.querySelector('#solBankroll');
    modeMetaEl = root.querySelector('#solModeMeta');
    newButton = root.querySelector('#solNew');

    root.querySelector('#solModes')?.addEventListener('click', () => { saveState(); renderHub(); });
    root.querySelector('#solUndo')?.addEventListener('click', undo);
    root.querySelector('#solHint')?.addEventListener('click', hint);
    root.querySelector('#solNew')?.addEventListener('click', requestNewHand);
    root.querySelector('#solEnd')?.addEventListener('click', () => finishHand(false));
    root.querySelector('#solFinish')?.addEventListener('click', autoComplete);

    boardEl.addEventListener('click', onClick);
    boardEl.addEventListener('pointerdown', onPointerDown, { passive: true });
    boardEl.addEventListener('pointermove', onPointerMove, { passive: false });
    boardEl.addEventListener('pointerup', onPointerUp, { passive: false });
    boardEl.addEventListener('pointercancel', onPointerCancel, { passive: false });

    resizeObserver = new ResizeObserver(fitSolitaireLayout);
    resizeObserver.observe(tabEl);
    window.addEventListener('resize', fitSolitaireLayout, { passive: true });
    window.visualViewport?.addEventListener('resize', fitSolitaireLayout, { passive: true });

    selected = null;
    renderTable();
    timerId = window.setInterval(updateLiveMeta, 1000);
    if (resetScroll) root.scrollTop = 0;
  }

  function clearTableListeners() {
    clearInterval(timerId);
    timerId = null;
    resizeObserver?.disconnect();
    resizeObserver = null;
    window.removeEventListener('resize', fitSolitaireLayout);
    window.visualViewport?.removeEventListener('resize', fitSolitaireLayout);
    cancelAnimationFrame(layoutRaf);
    if (drag?.preview) drag.preview.remove();
    if (drag?.previewRaf) cancelAnimationFrame(drag.previewRaf);
    drag = null;
  }

  function cardHtml(card, extra = '') {
    if (!card.faceUp) return `<div class="playing-card back ${extra}" data-card-id="${card.id}"></div>`;
    return `<div class="playing-card ${cardColor(card)} ${extra}" data-card-id="${card.id}">
      <span class="rank">${rankLabel(card.rank)}</span>
      <span class="suit">${card.suit}</span>
      <span class="big-suit">${card.suit}</span>
    </div>`;
  }

  function renderTable() {
    if (!state || !topEl || !tabEl) return;
    updateLiveMeta();
    const recycleLimit = state.passLimit == null ? Infinity : state.passLimit;
    const canRecycle = state.waste.length > 0 && state.passNumber < recycleLimit;
    const stock = state.stock.length ? cardHtml({ id: 'stock', faceUp: false }, 'stock-card') : `<div class="slot stock-empty" data-stock>${canRecycle ? '↻' : '×'}</div>`;
    const wasteCard = state.waste.at(-1);
    const waste = wasteCard ? cardHtml(wasteCard) : '<div class="slot">☆</div>';
    const foundations = SUITS.map(suit => {
      const card = state.foundations[suit].at(-1);
      return `<div data-foundation="${suit}">${card ? cardHtml(card) : `<div class="slot">${suit}</div>`}</div>`;
    }).join('');
    topEl.innerHTML = `<div data-stock>${stock}</div><div data-waste>${waste}</div>${foundations}`;
    tabEl.innerHTML = state.tableau.map((pile, col) => `
      <div class="tableau-col" data-tableau="${col}">
        ${pile.map((card, index) => `<div data-tableau-card="${col}:${index}">${cardHtml(card)}</div>`).join('')}
      </div>`).join('');
    syncSelectionClasses();
    root.querySelector('#solFinish')?.classList.toggle('hidden', !canOfferAutoComplete());
    requestAnimationFrame(fitSolitaireLayout);
  }

  function updateLiveMeta() {
    if (!state) return;
    if (movesEl) movesEl.textContent = `${state.moves} move${state.moves === 1 ? '' : 's'}`;
    if (timeEl) timeEl.textContent = fmtTime(elapsedMs());
    if (passEl) passEl.textContent = passLabel();
    if (bankrollEl) bankrollEl.textContent = money(profile.bankroll);
    if (modeMetaEl) modeMetaEl.textContent = modeForState().vegas ? `${signedMoney(state.handDelta)} hand` : `Draw ${modeForState().draw}`;
  }

  function fitSolitaireLayout() {
    if (!tabEl) return;
    cancelAnimationFrame(layoutRaf);
    layoutRaf = requestAnimationFrame(() => {
      const card = tabEl.querySelector('.playing-card');
      if (!card || !tabEl.clientHeight) return;
      const cardHeight = card.getBoundingClientRect().height;
      const hiddenGap = 12;
      const available = Math.max(cardHeight, tabEl.clientHeight - 2);
      let bestGap = 27;
      state.tableau.forEach(pile => {
        if (pile.length <= 1) return;
        let hidden = 0;
        let face = 0;
        for (let i = 0; i < pile.length - 1; i++) pile[i].faceUp ? face++ : hidden++;
        if (face > 0) bestGap = Math.min(bestGap, (available - cardHeight - hidden * hiddenGap) / face);
      });
      const upGap = Math.max(11, Math.min(27, Math.floor(bestGap)));
      state.tableau.forEach((pile, col) => {
        let y = 0;
        pile.forEach((cardData, index) => {
          const wrapper = tabEl.querySelector(`[data-tableau-card="${col}:${index}"]`);
          if (wrapper) wrapper.style.top = `${Math.round(y)}px`;
          if (index < pile.length - 1) y += cardData.faceUp ? upGap : hiddenGap;
        });
      });
    });
  }

  function syncSelectionClasses() {
    if (!topEl || !tabEl) return;
    root.querySelectorAll('.playing-card.selected').forEach(el => el.classList.remove('selected'));
    if (!selected) return;
    if (selected.source === 'waste') topEl.querySelector('[data-waste] .playing-card')?.classList.add('selected');
    else if (selected.source === 'foundation') topEl.querySelector(`[data-foundation="${selected.suit}"] .playing-card`)?.classList.add('selected');
    else if (selected.source === 'tableau') {
      for (let i = selected.index; i < state.tableau[selected.col].length; i++) {
        tabEl.querySelector(`[data-tableau-card="${selected.col}:${i}"] .playing-card`)?.classList.add('selected');
      }
    }
  }

  function cardsForRef(ref) {
    if (!ref || !state) return [];
    if (ref.source === 'waste') return state.waste.length ? [state.waste.at(-1)] : [];
    if (ref.source === 'foundation') return state.foundations[ref.suit].length ? [state.foundations[ref.suit].at(-1)] : [];
    if (ref.source === 'tableau') return state.tableau[ref.col].slice(ref.index);
    return [];
  }
  function removeRef(ref) {
    if (ref.source === 'waste') return [state.waste.pop()];
    if (ref.source === 'foundation') return [state.foundations[ref.suit].pop()];
    if (ref.source === 'tableau') return state.tableau[ref.col].splice(ref.index);
    return [];
  }
  function flipExposed(col) {
    if (col == null) return;
    const top = state.tableau[col].at(-1);
    if (top && !top.faceUp) top.faceUp = true;
  }
  function payoutFoundation(direction) {
    if (!modeForState().vegas) return;
    const delta = direction > 0 ? 5 : -5;
    state.handDelta += delta;
    profile.bankroll += delta;
    saveProfile();
    if (direction > 0) showMoneyPop(`+$5`);
  }
  function showMoneyPop(text) {
    if (!boardEl) return;
    const el = document.createElement('div');
    el.className = 'money-pop';
    el.textContent = text;
    boardEl.appendChild(el);
    setTimeout(() => el.remove(), 520);
  }
  function afterMove(fromCol = null) {
    flipExposed(fromCol);
    selected = null;
    state.moves += 1;
    saveProfile();
    saveState();
    renderTable();
    checkWin();
  }

  function canMoveRefToFoundation(ref, suit) {
    const cards = cardsForRef(ref);
    if (cards.length !== 1) return false;
    const card = cards[0];
    return card.suit === suit && card.rank === state.foundations[suit].length + 1;
  }
  function moveRefToFoundation(ref, suit) {
    if (!canMoveRefToFoundation(ref, suit)) return false;
    pushHistory();
    const fromCol = ref.source === 'tableau' ? ref.col : null;
    const [card] = removeRef(ref);
    card.faceUp = true;
    state.foundations[suit].push(card);
    payoutFoundation(1);
    afterMove(fromCol);
    return true;
  }
  function canMoveRefToTableau(ref, col) {
    const cards = cardsForRef(ref);
    if (!cards.length || !validRun(cards)) return false;
    if (ref.source === 'tableau' && ref.col === col) return false;
    const target = state.tableau[col].at(-1);
    return canStackOnTableau(cards[0], target);
  }
  function moveRefToTableau(ref, col) {
    if (!canMoveRefToTableau(ref, col)) return false;
    pushHistory();
    const fromCol = ref.source === 'tableau' ? ref.col : null;
    const wasFoundation = ref.source === 'foundation';
    const cards = removeRef(ref);
    cards.forEach(card => card.faceUp = true);
    state.tableau[col].push(...cards);
    if (wasFoundation) payoutFoundation(-1);
    afterMove(fromCol);
    return true;
  }
  function bestTableauTarget(ref) {
    const cards = cardsForRef(ref);
    if (!cards.length) return -1;
    const candidates = [];
    for (let col = 0; col < 7; col++) if (canMoveRefToTableau(ref, col)) candidates.push(col);
    if (!candidates.length) return -1;
    const nonEmpty = candidates.find(col => state.tableau[col].length > 0);
    return nonEmpty ?? candidates[0];
  }
  function logicalTap(ref) {
    const cards = cardsForRef(ref);
    if (!cards.length) return false;
    if (cards.length === 1 && moveRefToFoundation(ref, cards[0].suit)) return true;
    const target = bestTableauTarget(ref);
    if (target >= 0 && moveRefToTableau(ref, target)) return true;
    selected = selected && JSON.stringify(selected) === JSON.stringify(ref) ? null : ref;
    syncSelectionClasses();
    return false;
  }

  function drawStock() {
    if (!state) return;
    if (state.stock.length) {
      pushHistory();
      const n = Math.min(state.drawCount, state.stock.length);
      for (let i = 0; i < n; i++) {
        const card = state.stock.pop();
        card.faceUp = true;
        state.waste.push(card);
      }
      state.moves += 1;
      selected = null;
      saveState();
      renderTable();
      return;
    }
    if (!state.waste.length) return;
    const limit = state.passLimit == null ? Infinity : state.passLimit;
    if (state.passNumber >= limit) {
      toast('That was the last stock pass.');
      return;
    }
    pushHistory();
    state.stock = [...state.waste].reverse().map(card => ({ ...card, faceUp: false }));
    state.waste = [];
    state.passNumber += 1;
    state.moves += 1;
    selected = null;
    saveState();
    renderTable();
  }

  function refFromTarget(target) {
    const waste = target.closest?.('[data-waste]');
    if (waste && state.waste.length) return { source: 'waste' };
    const foundation = target.closest?.('[data-foundation]');
    if (foundation) {
      const suit = foundation.dataset.foundation;
      if (state.foundations[suit].length && !modeForState().vegas) return { source: 'foundation', suit };
    }
    const wrapper = target.closest?.('[data-tableau-card]');
    if (wrapper) {
      const [col, index] = wrapper.dataset.tableauCard.split(':').map(Number);
      const run = state.tableau[col]?.slice(index) || [];
      if (run[0]?.faceUp && validRun(run)) return { source: 'tableau', col, index };
    }
    return null;
  }

  function onClick(event) {
    if (!state || Date.now() < suppressClickUntil) return;
    if (event.target.closest('[data-stock]')) return drawStock();

    const foundation = event.target.closest('[data-foundation]');
    if (foundation) {
      const suit = foundation.dataset.foundation;
      if (selected && moveRefToFoundation(selected, suit)) return;
      if (!modeForState().vegas && state.foundations[suit].length) {
        selected = { source: 'foundation', suit };
        syncSelectionClasses();
      }
      return;
    }

    const waste = event.target.closest('[data-waste]');
    if (waste && state.waste.length) return void logicalTap({ source: 'waste' });

    const wrapper = event.target.closest('[data-tableau-card]');
    const colWrap = event.target.closest('[data-tableau]');
    if (!colWrap) return;
    const col = Number(colWrap.dataset.tableau);

    if (!wrapper) {
      if (selected && moveRefToTableau(selected, col)) return;
      selected = null;
      syncSelectionClasses();
      return;
    }
    const [sourceCol, index] = wrapper.dataset.tableauCard.split(':').map(Number);
    const card = state.tableau[sourceCol]?.[index];
    if (!card?.faceUp) return;
    const ref = { source: 'tableau', col: sourceCol, index };
    if (selected && !(selected.source === 'tableau' && selected.col === sourceCol && selected.index === index)) {
      if (moveRefToTableau(selected, col)) return;
    }
    logicalTap(ref);
  }

  function hint() {
    if (!state) return;
    const waste = state.waste.at(-1);
    if (waste) {
      const ref = { source: 'waste' };
      if (canMoveRefToFoundation(ref, waste.suit)) return toast(`${rankLabel(waste.rank)}${waste.suit} can go home.`);
      const target = bestTableauTarget(ref);
      if (target >= 0) return toast(`Move ${rankLabel(waste.rank)}${waste.suit} to column ${target + 1}.`);
    }
    for (let col = 0; col < 7; col++) {
      const pile = state.tableau[col];
      const top = pile.at(-1);
      if (top?.faceUp && canMoveRefToFoundation({ source: 'tableau', col, index: pile.length - 1 }, top.suit)) {
        return toast(`${rankLabel(top.rank)}${top.suit} can go home.`);
      }
    }
    for (let col = 0; col < 7; col++) {
      const pile = state.tableau[col];
      for (let index = 0; index < pile.length; index++) {
        if (!pile[index].faceUp || !validRun(pile.slice(index))) continue;
        const target = bestTableauTarget({ source: 'tableau', col, index });
        if (target >= 0) return toast(`Try column ${col + 1} → column ${target + 1}.`);
      }
    }
    if (state.stock.length) return toast('Draw from the deck.');
    const limit = state.passLimit == null ? Infinity : state.passLimit;
    if (state.waste.length && state.passNumber < limit) return toast('Recycle the deck for another pass.');
    if (modeForState().vegas) return toast('No obvious move. You can end this hand and deal again.');
    toast('No obvious move. Try Undo or move a foundation card back down.');
  }

  function undo() {
    const previous = history.pop();
    if (!previous) return toast('Nothing to undo yet.');
    restoreSnapshot(previous);
    selected = null;
    renderTable();
  }

  function requestNewHand() {
    if (!state || state.moves === 0) return beginFreshHand(state?.mode || profile.lastMode);
    const now = Date.now();
    if (now - newConfirmAt <= 2200) {
      if (modeForState().vegas) recordFinishedHand(false, false);
      beginFreshHand(state.mode);
    } else {
      newConfirmAt = now;
      toast('Tap New deal again to leave this hand.');
    }
  }

  function canOfferAutoComplete() {
    if (!state || state.won) return false;
    return state.stock.length === 0 && state.tableau.every(pile => pile.every(card => card.faceUp));
  }
  function autoComplete() {
    if (!canOfferAutoComplete()) return;
    let moved = true;
    let safety = 0;
    while (moved && safety++ < 80) {
      moved = false;
      const waste = state.waste.at(-1);
      if (waste && canMoveRefToFoundation({ source: 'waste' }, waste.suit)) {
        moveRefToFoundation({ source: 'waste' }, waste.suit);
        moved = true;
        continue;
      }
      for (let col = 0; col < 7; col++) {
        const pile = state.tableau[col];
        const top = pile.at(-1);
        if (top && canMoveRefToFoundation({ source: 'tableau', col, index: pile.length - 1 }, top.suit)) {
          moveRefToFoundation({ source: 'tableau', col, index: pile.length - 1 }, top.suit);
          moved = true;
          break;
        }
      }
    }
    if (!state.won) toast('A few decisions are still yours.');
  }

  function recordFinishedHand(won, showResult = true) {
    if (!state || state.ended) return;
    checkpointTime();
    state.ended = true;
    state.won = won;
    const stat = profile.stats[state.mode];
    if (won) {
      stat.wins += 1;
      stat.bestMoves = stat.bestMoves == null ? state.moves : Math.min(stat.bestMoves, state.moves);
      stat.bestTime = stat.bestTime == null ? state.elapsed : Math.min(stat.bestTime, state.elapsed);
    }
    if (modeForState().vegas) {
      stat.cardsBanked += foundationCount();
      if (state.handDelta > 0) stat.profitable += 1;
      stat.bestProfit = stat.bestProfit == null ? state.handDelta : Math.max(stat.bestProfit, state.handDelta);
      if (state.mode === 'daily') {
        profile.daily.lastDate = state.dayKey;
        profile.daily.bestProfit = profile.daily.bestProfit == null ? state.handDelta : Math.max(profile.daily.bestProfit, state.handDelta);
      }
    }
    saveProfile();
    storage.remove(CURRENT_KEY);
    const result = {
      mode: state.mode,
      won,
      moves: state.moves,
      elapsed: state.elapsed,
      handDelta: state.handDelta,
      foundations: foundationCount(),
      bankroll: profile.bankroll
    };
    dealResult = result;
    if (showResult) showHandResult(result);
  }

  function finishHand(won = false) {
    if (!state) return;
    recordFinishedHand(won, !won);
  }

  function checkWin() {
    if (!state || state.won || foundationCount() !== 52) return;
    const modeId = state.mode;
    recordFinishedHand(true, false);
    const stat = profile.stats[modeId];
    celebrate({
      eyebrow: modeId === 'vegas' || modeId === 'daily' ? 'TABLE CLEARED' : 'SOLITAIRE WIN',
      title: 'You crushed it, Paige!',
      message: modeId === 'vegas' || modeId === 'daily'
        ? `Full clear. ${signedMoney(dealResult.handDelta)} on the hand.`
        : 'Ryan, Link and Sketch knew you had it.',
      stats: modeId === 'vegas' || modeId === 'daily'
        ? [`${signedMoney(dealResult.handDelta)} hand`, `${money(profile.bankroll)} bankroll`, `${dealResult.moves} moves`]
        : [`${dealResult.moves} moves`, fmtTime(dealResult.elapsed), `${stat.wins} ${MODES[modeId].title.toLowerCase()} win${stat.wins === 1 ? '' : 's'}`],
      primaryLabel: 'Deal again',
      secondaryLabel: 'Game room'
    });
  }

  function showHandResult(result) {
    currentView = 'result';
    clearTableListeners();
    root.classList.remove('sol-table-open');
    root.innerHTML = `
      <section class="sol-result-screen">
        <span class="section-kicker">${MODES[result.mode].title.toUpperCase()} HAND</span>
        <h1>${result.handDelta > 0 ? 'Profitable hand.' : result.handDelta === 0 ? 'Even hand.' : 'Deal complete.'}</h1>
        <div class="sol-result-money ${result.handDelta >= 0 ? 'positive' : 'negative'}">${signedMoney(result.handDelta)}</div>
        <div class="sol-result-grid">
          <div><small>Cards banked</small><strong>${result.foundations} / 52</strong></div>
          <div><small>Bankroll</small><strong>${money(result.bankroll)}</strong></div>
          <div><small>Moves</small><strong>${result.moves}</strong></div>
          <div><small>Time</small><strong>${fmtTime(result.elapsed)}</strong></div>
        </div>
        <p>${result.handDelta > 0 ? 'You beat the $52 buy-in. Bank it and go again.' : 'Every card you banked still counted. One more deal?'}</p>
        <button class="button primary big-action" id="solDealAgain" type="button">Deal again</button>
        <button class="button secondary big-action" id="solBackModes" type="button">Solitaire modes</button>
      </section>`;
    root.querySelector('#solDealAgain')?.addEventListener('click', () => beginFreshHand(result.mode));
    root.querySelector('#solBackModes')?.addEventListener('click', renderHub);
  }

  function createDragPreview(ref, sourceElement, x, y) {
    const cards = cardsForRef(ref);
    if (!cards.length) return null;
    const rect = sourceElement.getBoundingClientRect();
    const preview = document.createElement('div');
    preview.className = 'drag-preview';
    preview.style.width = `${rect.width}px`;
    preview.style.height = `${Math.max(rect.height, rect.height + (cards.length - 1) * 21)}px`;
    cards.forEach((card, index) => {
      const holder = document.createElement('div');
      holder.innerHTML = cardHtml(card);
      const cardEl = holder.firstElementChild;
      cardEl.style.top = `${index * 21}px`;
      preview.appendChild(cardEl);
    });
    document.body.appendChild(preview);
    placeDragPreview(preview, x, y);
    return preview;
  }
  function placeDragPreview(preview, x, y) {
    if (preview) preview.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0) translate(-50%,-22%)`;
  }
  function scheduleDragPreview(dragState, x, y) {
    if (!dragState?.preview) return;
    dragState.previewX = x;
    dragState.previewY = y;
    if (dragState.previewRaf) return;
    dragState.previewRaf = requestAnimationFrame(() => {
      dragState.previewRaf = 0;
      placeDragPreview(dragState.preview, dragState.previewX, dragState.previewY);
    });
  }
  function markDragSource(ref, active) {
    if (!ref) return;
    const els = [];
    if (ref.source === 'waste') {
      const el = topEl?.querySelector('[data-waste] .playing-card');
      if (el) els.push(el);
    } else if (ref.source === 'foundation') {
      const el = topEl?.querySelector(`[data-foundation="${ref.suit}"] .playing-card`);
      if (el) els.push(el);
    } else if (ref.source === 'tableau') {
      for (let i = ref.index; i < state.tableau[ref.col].length; i++) {
        const el = tabEl?.querySelector(`[data-tableau-card="${ref.col}:${i}"] .playing-card`);
        if (el) els.push(el);
      }
    }
    els.forEach(el => el.classList.toggle('drag-source', active));
  }
  function onPointerDown(event) {
    const ref = refFromTarget(event.target);
    if (!ref) return;
    const sourceElement = event.target.closest('.playing-card');
    if (!sourceElement) return;
    drag = {
      pointerId: event.pointerId, ref, sourceElement,
      startX: event.clientX, startY: event.clientY,
      x: event.clientX, y: event.clientY,
      dragging: false, preview: null, previewRaf: 0
    };
  }
  function onPointerMove(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.x = event.clientX;
    drag.y = event.clientY;
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (!drag.dragging && distance >= 14) {
      drag.dragging = true;
      selected = drag.ref;
      syncSelectionClasses();
      markDragSource(drag.ref, true);
      drag.preview = createDragPreview(drag.ref, drag.sourceElement, event.clientX, event.clientY);
    }
    if (drag.dragging) {
      event.preventDefault();
      scheduleDragPreview(drag, event.clientX, event.clientY);
    }
  }
  function droppedOnSource(ref, target) {
    if (ref.source === 'waste') return Boolean(target.closest?.('[data-waste]'));
    if (ref.source === 'foundation') return target.closest?.('[data-foundation]')?.dataset.foundation === ref.suit;
    if (ref.source === 'tableau') return Number(target.closest?.('[data-tableau]')?.dataset.tableau) === ref.col;
    return false;
  }
  function finishDrag(event, cancelled = false) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const current = drag;
    drag = null;
    if (current.previewRaf) cancelAnimationFrame(current.previewRaf);
    current.preview?.remove();
    markDragSource(current.ref, false);
    if (!current.dragging || cancelled) return;
    suppressClickUntil = Date.now() + 70;
    event.preventDefault();
    const target = document.elementFromPoint(event.clientX, event.clientY);
    if (!target || droppedOnSource(current.ref, target)) {
      logicalTap(current.ref);
      return;
    }
    const foundation = target.closest?.('[data-foundation]');
    if (foundation && moveRefToFoundation(current.ref, foundation.dataset.foundation)) return;
    const colWrap = target.closest?.('[data-tableau]');
    if (colWrap && moveRefToTableau(current.ref, Number(colWrap.dataset.tableau))) return;
    selected = null;
    syncSelectionClasses();
  }
  function onPointerUp(event) { finishDrag(event, false); }
  function onPointerCancel(event) { finishDrag(event, true); }

  function onVisibility() {
    if (document.visibilityState === 'hidden') saveState();
  }
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', saveState);

  renderHub();

  return {
    cleanup() {
      saveState();
      clearTableListeners();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', saveState);
      root.classList.remove('solitaire-active', 'sol-table-open', 'sol-theme-green', 'sol-theme-midnight', 'sol-theme-burgundy');
    },
    replay() {
      const mode = dealResult?.mode || state?.mode || lastPlayedMode || profile.lastMode;
      beginFreshHand(mode);
    }
  };
}
