const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_KEYS = ['S', 'H', 'D', 'C'];
const RED = new Set(['♥', '♦']);
const RANK_LABEL = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
const STATE_KEY = 'paige.solitaire.state.v2';
const OLD_STATE_KEY = 'paige.solitaire.state';
const STATS_KEY = 'paige.solitaire.stats';

function rankLabel(rank) { return RANK_LABEL[rank] || String(rank); }
function cardColor(card) { return RED.has(card.suit) ? 'red' : 'black'; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }

function makeDeck() {
  let id = 0;
  return SUITS.flatMap((suit, suitIndex) => Array.from({ length: 13 }, (_, index) => ({
    id: `${SUIT_KEYS[suitIndex]}${index + 1}-${id++}`,
    suit,
    rank: index + 1,
    faceUp: false
  })));
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function freshState() {
  const deck = shuffle(makeDeck());
  const tableau = Array.from({ length: 7 }, () => []);
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck.pop();
      card.faceUp = row === col;
      tableau[col].push(card);
    }
  }
  return {
    version: 2,
    stock: deck,
    waste: [],
    foundations: { '♠': [], '♥': [], '♦': [], '♣': [] },
    tableau,
    moves: 0,
    elapsed: 0,
    startedAt: Date.now(),
    won: false
  };
}

function isCard(card) {
  return card && typeof card.id === 'string' && SUITS.includes(card.suit) && Number.isInteger(card.rank) && card.rank >= 1 && card.rank <= 13 && typeof card.faceUp === 'boolean';
}

function validState(state) {
  try {
    if (!state || !Array.isArray(state.stock) || !Array.isArray(state.waste) || !Array.isArray(state.tableau) || state.tableau.length !== 7) return false;
    if (!state.foundations || !SUITS.every(suit => Array.isArray(state.foundations[suit]))) return false;
    const cards = [
      ...state.stock,
      ...state.waste,
      ...state.tableau.flat(),
      ...SUITS.flatMap(suit => state.foundations[suit])
    ];
    if (cards.length !== 52 || !cards.every(isCard)) return false;
    return new Set(cards.map(card => card.id)).size === 52;
  } catch {
    return false;
  }
}

function canStackOnTableau(card, target) {
  if (!target) return card.rank === 13;
  return target.faceUp && target.rank === card.rank + 1 && cardColor(target) !== cardColor(card);
}

function validRun(cards) {
  if (!cards.length || !cards[0].faceUp) return false;
  for (let i = 0; i < cards.length - 1; i++) {
    if (!cards[i + 1].faceUp) return false;
    if (cards[i].rank !== cards[i + 1].rank + 1) return false;
    if (cardColor(cards[i]) === cardColor(cards[i + 1])) return false;
  }
  return true;
}

export async function mount({ root, toast, celebrate, storage }) {
  const saved = storage.get(STATE_KEY, null) || storage.get(OLD_STATE_KEY, null);
  let state = validState(saved) && !saved.won ? saved : freshState();
  state.version = 2;
  state.elapsed = Number(state.elapsed) || 0;
  state.startedAt = Date.now();
  state.won = Boolean(state.won);
  let selected = null;
  let history = [];
  let timerId = null;
  let newConfirmAt = 0;
  let lastTap = { key: '', at: 0 };
  let suppressClickUntil = 0;
  let drag = null;
  let layoutRaf = 0;
  let resizeObserver = null;

  root.classList.add('solitaire-active');

  root.innerHTML = `
    <section class="game-screen solitaire-screen">
      <div class="game-toolbar">
        <div class="game-meta">
          <span class="stat-pill" id="solMoves">0 moves</span>
          <span class="stat-pill" id="solTime">0:00</span>
        </div>
        <div class="toolbar-actions">
          <button class="button small iconish" id="solUndo" type="button" aria-label="Undo last move">Undo</button>
          <button class="button small iconish" id="solHint" type="button" aria-label="Show a hint">Hint</button>
          <button class="button small iconish" id="solNew" type="button" aria-label="Start a new game">New</button>
        </div>
      </div>
      <div class="solitaire-wrap">
        <div class="solitaire-board" id="solBoard">
          <div class="sol-top" id="solTop"></div>
          <div class="tableau" id="solTableau"></div>
          <p class="sol-help">Tap to select and tap again to place. Drag cards where you want them. Double-tap an exposed card to send it home.</p>
        </div>
      </div>
    </section>`;

  const boardEl = root.querySelector('#solBoard');
  const topEl = root.querySelector('#solTop');
  const tabEl = root.querySelector('#solTableau');
  const movesEl = root.querySelector('#solMoves');
  const timeEl = root.querySelector('#solTime');
  const newButton = root.querySelector('#solNew');

  const elapsedMs = () => state.won ? state.elapsed : state.elapsed + Math.max(0, Date.now() - state.startedAt);
  const fmtTime = ms => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = String(total % 60).padStart(2, '0');
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
  };

  function checkpointTime() {
    if (state.won) return;
    state.elapsed = elapsedMs();
    state.startedAt = Date.now();
  }

  function save() {
    checkpointTime();
    storage.set(STATE_KEY, state);
    storage.remove(OLD_STATE_KEY);
  }

  function snapshot() {
    const snap = clone(state);
    if (!state.won) {
      snap.elapsed = elapsedMs();
      snap.startedAt = Date.now();
    }
    return snap;
  }

  function pushHistory() {
    history.push(snapshot());
    if (history.length > 60) history.shift();
  }

  function cardHtml(card, extra = '') {
    if (!card.faceUp) return `<div class="playing-card back ${extra}" data-card-id="${card.id}"></div>`;
    return `<div class="playing-card ${cardColor(card)} ${extra}" data-card-id="${card.id}">
      <span class="rank">${rankLabel(card.rank)}</span>
      <span class="suit">${card.suit}</span>
      <span class="big-suit">${card.suit}</span>
    </div>`;
  }

  function selectedClass(source, col = null, index = null, suit = null) {
    if (!selected || selected.source !== source) return '';
    if (source === 'tableau') return selected.col === col && index >= selected.index ? 'selected' : '';
    if (source === 'foundation') return selected.suit === suit ? 'selected' : '';
    return source === 'waste' ? 'selected' : '';
  }

  function syncSelectionClasses() {
    topEl.querySelectorAll('.playing-card.selected').forEach(el => el.classList.remove('selected'));
    tabEl.querySelectorAll('.playing-card.selected').forEach(el => el.classList.remove('selected'));
    if (!selected) return;

    if (selected.source === 'waste') {
      topEl.querySelector('[data-waste] .playing-card')?.classList.add('selected');
      return;
    }
    if (selected.source === 'foundation') {
      topEl.querySelector(`[data-foundation="${selected.suit}"] .playing-card`)?.classList.add('selected');
      return;
    }
    if (selected.source === 'tableau') {
      for (let i = selected.index; i < state.tableau[selected.col].length; i++) {
        tabEl.querySelector(`[data-tableau-card="${selected.col}:${i}"] .playing-card`)?.classList.add('selected');
      }
    }
  }

  function fitSolitaireLayout() {
    cancelAnimationFrame(layoutRaf);
    layoutRaf = requestAnimationFrame(() => {
      const card = tabEl.querySelector('.playing-card');
      if (!card || !tabEl.clientHeight) return;

      const cardHeight = card.getBoundingClientRect().height;
      const hiddenGap = 13;
      const available = Math.max(cardHeight, tabEl.clientHeight - 2);
      let bestGap = 28;

      state.tableau.forEach(col => {
        if (col.length <= 1) return;
        let hiddenBeforeLast = 0;
        let faceUpBeforeLast = 0;
        for (let i = 0; i < col.length - 1; i++) {
          if (col[i].faceUp) faceUpBeforeLast += 1;
          else hiddenBeforeLast += 1;
        }
        if (faceUpBeforeLast > 0) {
          const allowed = (available - cardHeight - hiddenBeforeLast * hiddenGap) / faceUpBeforeLast;
          bestGap = Math.min(bestGap, allowed);
        }
      });

      const upGap = Math.max(12, Math.min(28, Math.floor(bestGap)));
      state.tableau.forEach((col, colIndex) => {
        let y = 0;
        col.forEach((cardData, index) => {
          const wrapper = tabEl.querySelector(`[data-tableau-card="${colIndex}:${index}"]`);
          if (wrapper) wrapper.style.top = `${Math.round(y)}px`;
          if (index < col.length - 1) y += cardData.faceUp ? upGap : hiddenGap;
        });
      });
    });
  }

  function render() {
    movesEl.textContent = `${state.moves} move${state.moves === 1 ? '' : 's'}`;
    timeEl.textContent = fmtTime(elapsedMs());

    const stock = state.stock.length
      ? cardHtml({ id: 'stock', faceUp: false }, 'stock-card')
      : '<div class="slot" data-stock aria-label="Recycle waste">↻</div>';
    const wasteCard = state.waste.at(-1);
    const waste = wasteCard ? cardHtml(wasteCard, selectedClass('waste')) : '<div class="slot">☆</div>';
    const foundations = SUITS.map(suit => {
      const card = state.foundations[suit].at(-1);
      const inner = card ? cardHtml(card, selectedClass('foundation', null, null, suit)) : `<div class="slot">${suit}</div>`;
      return `<div data-foundation="${suit}" aria-label="${suit} foundation">${inner}</div>`;
    }).join('');
    topEl.innerHTML = `<div data-stock aria-label="Draw from deck">${stock}</div><div data-waste aria-label="Waste pile">${waste}</div>${foundations}`;

    tabEl.innerHTML = state.tableau.map((col, colIndex) => {
      const cards = col.map((card, index) =>
        `<div data-tableau-card="${colIndex}:${index}" style="top:0">${cardHtml(card, selectedClass('tableau', colIndex, index))}</div>`
      ).join('');
      return `<div class="tableau-col" data-tableau="${colIndex}">${cards}</div>`;
    }).join('');
    fitSolitaireLayout();
  }

  function getSelectedCard() {
    if (!selected) return null;
    if (selected.source === 'waste') return state.waste.at(-1) || null;
    if (selected.source === 'foundation') return state.foundations[selected.suit].at(-1) || null;
    if (selected.source === 'tableau') return state.tableau[selected.col]?.[selected.index] || null;
    return null;
  }

  function cardsForRef(ref) {
    if (!ref) return [];
    if (ref.source === 'waste') return state.waste.length ? [state.waste.at(-1)] : [];
    if (ref.source === 'foundation') {
      const card = state.foundations[ref.suit]?.at(-1);
      return card ? [card] : [];
    }
    if (ref.source === 'tableau') return state.tableau[ref.col]?.slice(ref.index) || [];
    return [];
  }

  function revealTop(colIndex) {
    if (!Number.isInteger(colIndex)) return;
    const top = state.tableau[colIndex].at(-1);
    if (top && !top.faceUp) top.faceUp = true;
  }

  function removeSelectionCards() {
    if (!selected) return { cards: [], sourceCol: null };
    if (selected.source === 'waste') return { cards: [state.waste.pop()], sourceCol: null };
    if (selected.source === 'foundation') return { cards: [state.foundations[selected.suit].pop()], sourceCol: null };
    if (selected.source === 'tableau') {
      const sourceCol = selected.col;
      return { cards: state.tableau[sourceCol].splice(selected.index), sourceCol };
    }
    return { cards: [], sourceCol: null };
  }

  function commitMove(sourceCol = null) {
    revealTop(sourceCol);
    state.moves += 1;
    selected = null;
    save();
    render();
    checkWin();
  }

  function invalidMove() {
    boardEl.classList.remove('invalid');
    void boardEl.offsetWidth;
    boardEl.classList.add('invalid');
    setTimeout(() => boardEl.classList.remove('invalid'), 190);
  }

  function drawStock() {
    if (!state.stock.length && !state.waste.length) return;
    pushHistory();
    if (state.stock.length) {
      const card = state.stock.pop();
      card.faceUp = true;
      state.waste.push(card);
    } else {
      state.stock = state.waste.reverse().map(card => ({ ...card, faceUp: false }));
      state.waste = [];
    }
    selected = null;
    state.moves += 1;
    save();
    render();
  }

  function tryMoveToTableau(colIndex) {
    const card = getSelectedCard();
    if (!card) return false;
    const targetCol = state.tableau[colIndex];
    const target = targetCol.at(-1);
    if (!canStackOnTableau(card, target)) return false;
    if (selected.source === 'tableau' && selected.col === colIndex) return false;

    pushHistory();
    const { cards, sourceCol } = removeSelectionCards();
    targetCol.push(...cards);
    commitMove(sourceCol);
    return true;
  }

  function tryMoveToFoundation(suit) {
    const card = getSelectedCard();
    if (!card || card.suit !== suit) return false;
    const pile = state.foundations[suit];
    if (card.rank !== pile.length + 1) return false;
    if (selected.source === 'tableau' && state.tableau[selected.col].length - selected.index !== 1) return false;

    pushHistory();
    const { cards, sourceCol } = removeSelectionCards();
    pile.push(cards[0]);
    commitMove(sourceCol);
    return true;
  }

  function autoFoundation(ref) {
    selected = ref;
    const card = getSelectedCard();
    if (card && tryMoveToFoundation(card.suit)) return true;
    selected = null;
    syncSelectionClasses();
    invalidMove();
    return false;
  }

  function checkWin() {
    const foundationCount = Object.values(state.foundations).reduce((count, pile) => count + pile.length, 0);
    if (foundationCount !== 52 || state.won) return;

    const finalElapsed = elapsedMs();
    state.won = true;
    state.elapsed = finalElapsed;
    state.startedAt = Date.now();
    save();

    const stats = storage.get(STATS_KEY, { wins: 0, bestTime: null, fewestMoves: null });
    stats.wins = (Number(stats.wins) || 0) + 1;
    stats.bestTime = stats.bestTime == null ? finalElapsed : Math.min(stats.bestTime, finalElapsed);
    stats.fewestMoves = stats.fewestMoves == null ? state.moves : Math.min(stats.fewestMoves, state.moves);
    storage.set(STATS_KEY, stats);

    celebrate({
      eyebrow: 'SOLITAIRE CLEARED',
      title: 'You won, Paige!',
      message: 'Ryan, Link and Sketch knew you had it.',
      stats: [`${state.moves} moves`, fmtTime(finalElapsed), `${stats.wins} total win${stats.wins === 1 ? '' : 's'}`]
    });
  }

  function refFromTarget(target) {
    const waste = target.closest?.('[data-waste]');
    if (waste && state.waste.length) return { source: 'waste' };

    const foundation = target.closest?.('[data-foundation]');
    if (foundation) {
      const suit = foundation.dataset.foundation;
      if (state.foundations[suit]?.length) return { source: 'foundation', suit };
    }

    const wrapper = target.closest?.('[data-tableau-card]');
    if (wrapper) {
      const [col, index] = wrapper.dataset.tableauCard.split(':').map(Number);
      const card = state.tableau[col]?.[index];
      const run = state.tableau[col]?.slice(index) || [];
      if (card?.faceUp && validRun(run)) return { source: 'tableau', col, index };
    }
    return null;
  }

  function tapKeyAndRef(target) {
    const waste = target.closest?.('[data-waste]');
    if (waste && state.waste.length) return { key: 'waste', ref: { source: 'waste' } };

    const wrapper = target.closest?.('[data-tableau-card]');
    if (wrapper) {
      const [col, index] = wrapper.dataset.tableauCard.split(':').map(Number);
      const pile = state.tableau[col];
      if (index === pile.length - 1 && pile[index]?.faceUp) return { key: `t:${col}:${index}`, ref: { source: 'tableau', col, index } };
    }
    return null;
  }

  function maybeDoubleTap(target) {
    const hit = tapKeyAndRef(target);
    if (!hit) {
      lastTap = { key: '', at: 0 };
      return false;
    }
    const now = Date.now();
    if (lastTap.key === hit.key && now - lastTap.at <= 330) {
      lastTap = { key: '', at: 0 };
      autoFoundation(hit.ref);
      return true;
    }
    lastTap = { key: hit.key, at: now };
    return false;
  }

  function onClick(event) {
    if (Date.now() < suppressClickUntil) return;
    if (maybeDoubleTap(event.target)) return;

    const stockHit = event.target.closest('[data-stock]');
    if (stockHit) {
      drawStock();
      return;
    }

    const foundation = event.target.closest('[data-foundation]');
    if (foundation) {
      const suit = foundation.dataset.foundation;
      if (selected && tryMoveToFoundation(suit)) return;
      if (selected) invalidMove();
      if (state.foundations[suit].length) {
        selected = selected?.source === 'foundation' && selected.suit === suit ? null : { source: 'foundation', suit };
      } else {
        selected = null;
      }
      syncSelectionClasses();
      return;
    }

    const waste = event.target.closest('[data-waste]');
    if (waste) {
      if (state.waste.length) selected = selected?.source === 'waste' ? null : { source: 'waste' };
      else selected = null;
      syncSelectionClasses();
      return;
    }

    const cardWrap = event.target.closest('[data-tableau-card]');
    const colWrap = event.target.closest('[data-tableau]');
    if (!colWrap) return;
    const colIndex = Number(colWrap.dataset.tableau);

    if (selected) {
      const sameSelected = cardWrap && selected.source === 'tableau' && cardWrap.dataset.tableauCard === `${selected.col}:${selected.index}`;
      if (sameSelected) {
        selected = null;
        syncSelectionClasses();
        return;
      }
      if (tryMoveToTableau(colIndex)) return;
    }

    if (!cardWrap) {
      if (selected) invalidMove();
      return;
    }

    const [col, index] = cardWrap.dataset.tableauCard.split(':').map(Number);
    const card = state.tableau[col][index];
    if (!card.faceUp) {
      if (index === state.tableau[col].length - 1) {
        pushHistory();
        card.faceUp = true;
        state.moves += 1;
        selected = null;
        save();
        render();
      }
      return;
    }

    const run = state.tableau[col].slice(index);
    selected = validRun(run) ? { source: 'tableau', col, index } : null;
    syncSelectionClasses();
  }

  function canMoveCardToAnyTableau(card, fromCol = null) {
    for (let col = 0; col < 7; col++) {
      if (col === fromCol) continue;
      const target = state.tableau[col].at(-1);
      if (canStackOnTableau(card, target)) return col;
    }
    return -1;
  }

  function hint() {
    const waste = state.waste.at(-1);
    if (waste && waste.rank === state.foundations[waste.suit].length + 1) {
      return toast(`${rankLabel(waste.rank)}${waste.suit} can go home.`);
    }

    for (let col = 0; col < 7; col++) {
      const top = state.tableau[col].at(-1);
      if (top && !top.faceUp) return toast(`Flip the card in column ${col + 1}.`);
      if (top && top.rank === state.foundations[top.suit].length + 1) {
        return toast(`${rankLabel(top.rank)}${top.suit} can go home.`);
      }
    }

    if (waste) {
      const targetCol = canMoveCardToAnyTableau(waste);
      if (targetCol >= 0) return toast(`Move ${rankLabel(waste.rank)}${waste.suit} to column ${targetCol + 1}.`);
    }

    for (let col = 0; col < 7; col++) {
      const pile = state.tableau[col];
      for (let index = 0; index < pile.length; index++) {
        if (!pile[index].faceUp || !validRun(pile.slice(index))) continue;
        const targetCol = canMoveCardToAnyTableau(pile[index], col);
        if (targetCol >= 0) return toast(`Try column ${col + 1} → column ${targetCol + 1}.`);
      }
    }

    if (state.stock.length) return toast('Draw a card from the deck.');
    if (state.waste.length) return toast('Tap the empty deck to recycle the cards.');
    toast('No obvious move. Undo or move a foundation card back down.');
  }

  function startFresh() {
    state = freshState();
    selected = null;
    history = [];
    newConfirmAt = 0;
    save();
    render();
  }

  function requestNewGame() {
    if (state.moves === 0 || state.won) {
      startFresh();
      return;
    }
    const now = Date.now();
    if (now - newConfirmAt <= 2400) {
      startFresh();
    } else {
      newConfirmAt = now;
      toast('Tap New again to start over.');
    }
  }

  function undo() {
    const previous = history.pop();
    if (!previous) return toast('Nothing to undo yet.');
    state = previous;
    state.startedAt = Date.now();
    selected = null;
    save();
    render();
  }

  function createDragPreview(ref, sourceElement, x, y) {
    const cards = cardsForRef(ref);
    if (!cards.length) return null;
    const rect = sourceElement.getBoundingClientRect();
    const preview = document.createElement('div');
    preview.className = 'drag-preview';
    preview.style.width = `${rect.width}px`;
    preview.style.height = `${Math.max(rect.height, rect.height + (cards.length - 1) * 22)}px`;
    cards.forEach((card, index) => {
      const holder = document.createElement('div');
      holder.innerHTML = cardHtml(card);
      const cardEl = holder.firstElementChild;
      cardEl.style.top = `${index * 22}px`;
      preview.appendChild(cardEl);
    });
    document.body.appendChild(preview);
    placeDragPreview(preview, x, y);
    return preview;
  }

  function placeDragPreview(preview, x, y) {
    if (!preview) return;
    preview.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0) translate(-50%,-22%)`;
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
    const elements = [];
    if (ref.source === 'waste') {
      const el = topEl.querySelector('[data-waste] .playing-card');
      if (el) elements.push(el);
    } else if (ref.source === 'foundation') {
      const el = topEl.querySelector(`[data-foundation="${ref.suit}"] .playing-card`);
      if (el) elements.push(el);
    } else if (ref.source === 'tableau') {
      for (let i = ref.index; i < state.tableau[ref.col].length; i++) {
        const el = tabEl.querySelector(`[data-tableau-card="${ref.col}:${i}"] .playing-card`);
        if (el) elements.push(el);
      }
    }
    elements.forEach(el => el.classList.toggle('drag-source', active));
  }

  function onPointerDown(event) {
    if (event.button != null && event.button !== 0) return;
    const ref = refFromTarget(event.target);
    if (!ref) return;
    const sourceElement = event.target.closest('.playing-card');
    if (!sourceElement) return;
    drag = {
      pointerId: event.pointerId,
      ref,
      sourceElement,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      dragging: false,
      preview: null,
      previewRaf: 0,
      previewX: event.clientX,
      previewY: event.clientY
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
    if (!ref || !target) return false;
    if (ref.source === 'waste') return Boolean(target.closest?.('[data-waste]'));
    if (ref.source === 'foundation') return target.closest?.('[data-foundation]')?.dataset.foundation === ref.suit;
    if (ref.source === 'tableau') return Number(target.closest?.('[data-tableau]')?.dataset.tableau) === ref.col;
    return false;
  }

  function finishDrag(event, cancelled = false) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const currentDrag = drag;
    drag = null;

    if (currentDrag.dragging) {
      suppressClickUntil = Date.now() + 70;
      if (currentDrag.previewRaf) cancelAnimationFrame(currentDrag.previewRaf);
      markDragSource(currentDrag.ref, false);
      currentDrag.preview?.remove();
      selected = currentDrag.ref;

      let moved = false;
      let sourceDrop = false;
      if (!cancelled) {
        const target = document.elementFromPoint(event.clientX, event.clientY);
        sourceDrop = droppedOnSource(currentDrag.ref, target);
        if (!sourceDrop) {
          const foundation = target?.closest?.('[data-foundation]');
          const tableau = target?.closest?.('[data-tableau]');
          if (foundation) moved = tryMoveToFoundation(foundation.dataset.foundation);
          else if (tableau) moved = tryMoveToTableau(Number(tableau.dataset.tableau));
        }
      }

      if (!moved) {
        if (cancelled) {
          selected = null;
          syncSelectionClasses();
        } else if (sourceDrop) {
          // A slightly sloppy tap/drag back onto the same pile is a selection,
          // not a failed move. This makes thumb input feel forgiving on iPhone.
          selected = currentDrag.ref;
          syncSelectionClasses();
        } else {
          selected = null;
          syncSelectionClasses();
          invalidMove();
        }
      }
    }
  }

  function onPointerUp(event) { finishDrag(event, false); }
  function onPointerCancel(event) { finishDrag(event, true); }

  function handleVisibility() {
    if (document.visibilityState === 'hidden') save();
    else if (!state.won) state.startedAt = Date.now();
  }
  function handlePageHide() { save(); }

  resizeObserver = new ResizeObserver(fitSolitaireLayout);
  resizeObserver.observe(boardEl);
  window.addEventListener('resize', fitSolitaireLayout, { passive: true });
  window.visualViewport?.addEventListener('resize', fitSolitaireLayout, { passive: true });

  topEl.addEventListener('click', onClick);
  tabEl.addEventListener('click', onClick);
  topEl.addEventListener('pointerdown', onPointerDown);
  tabEl.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove, { passive: false });
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerCancel);
  root.querySelector('#solUndo').addEventListener('click', undo);
  root.querySelector('#solHint').addEventListener('click', hint);
  newButton.addEventListener('click', requestNewGame);
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('pagehide', handlePageHide);

  timerId = setInterval(() => {
    if (!state.won) timeEl.textContent = fmtTime(elapsedMs());
  }, 500);
  save();
  render();

  return {
    cleanup() {
      clearInterval(timerId);
      if (state.won) storage.remove(STATE_KEY);
      else save();
      topEl.removeEventListener('click', onClick);
      tabEl.removeEventListener('click', onClick);
      topEl.removeEventListener('pointerdown', onPointerDown);
      tabEl.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerCancel);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('resize', fitSolitaireLayout);
      window.visualViewport?.removeEventListener('resize', fitSolitaireLayout);
      resizeObserver?.disconnect();
      cancelAnimationFrame(layoutRaf);
      if (drag?.previewRaf) cancelAnimationFrame(drag.previewRaf);
      drag?.preview?.remove();
      drag = null;
      root.classList.remove('solitaire-active');
    },
    replay() { startFresh(); }
  };
}
