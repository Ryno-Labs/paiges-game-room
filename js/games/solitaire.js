const SUITS = ['♠','♥','♦','♣'];
const SUIT_KEYS = ['S','H','D','C'];
const RED = new Set(['♥','♦']);
const RANK_LABEL = {1:'A',11:'J',12:'Q',13:'K'};

function rankLabel(rank) { return RANK_LABEL[rank] || String(rank); }
function makeDeck() {
  let id = 0;
  return SUITS.flatMap((suit, si) => Array.from({length:13}, (_,i) => ({
    id: `${SUIT_KEYS[si]}${i+1}-${id++}`, suit, rank:i+1, faceUp:false
  })));
}
function shuffle(deck) {
  for (let i=deck.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
function freshState() {
  const deck = shuffle(makeDeck());
  const tableau = Array.from({length:7}, () => []);
  for (let col=0; col<7; col++) {
    for (let row=0; row<=col; row++) {
      const card = deck.pop();
      card.faceUp = row === col;
      tableau[col].push(card);
    }
  }
  return {
    stock: deck,
    waste: [],
    foundations: { '♠':[], '♥':[], '♦':[], '♣':[] },
    tableau,
    moves:0,
    elapsed:0,
    startedAt:Date.now(),
    won:false
  };
}
function cloneState(s) { return JSON.parse(JSON.stringify(s)); }
function cardColor(card) { return RED.has(card.suit) ? 'red' : 'black'; }
function canStackOnTableau(card, target) {
  if (!target) return card.rank === 13;
  return target.faceUp && target.rank === card.rank + 1 && cardColor(target) !== cardColor(card);
}
function validRun(cards) {
  if (!cards.length || !cards[0].faceUp) return false;
  for (let i=0;i<cards.length-1;i++) {
    if (!cards[i+1].faceUp || cards[i].rank !== cards[i+1].rank+1 || cardColor(cards[i])===cardColor(cards[i+1])) return false;
  }
  return true;
}

export async function mount({root, toast, celebrate, storage}) {
  let state = storage.get('paige.solitaire.state', null) || freshState();
  // Resume the timer from the saved elapsed time, but do not count time while the app was closed.
  state.startedAt = Date.now();
  let selected = null;
  let history = [];
  let timerId = null;

  root.innerHTML = `
    <section>
      <div class="game-header">
        <h1>Solitaire</h1>
        <div class="game-meta">
          <span class="stat-pill" id="solMoves">0 moves</span>
          <span class="stat-pill" id="solTime">0:00</span>
        </div>
      </div>
      <div class="toolbar">
        <button class="button small" id="solNew">New game</button>
        <button class="button small" id="solUndo">Undo</button>
        <button class="button small" id="solHint">Hint</button>
      </div>
      <div class="solitaire-wrap">
        <div class="solitaire-board">
          <div class="sol-top" id="solTop"></div>
          <div class="tableau" id="solTableau"></div>
          <p class="sol-help">Tap a card, then tap where you want it to go. Tap the deck to draw. Double-tap an exposed card to send it home.</p>
        </div>
      </div>
    </section>`;

  const topEl = root.querySelector('#solTop');
  const tabEl = root.querySelector('#solTableau');
  const movesEl = root.querySelector('#solMoves');
  const timeEl = root.querySelector('#solTime');

  const elapsedMs = () => state.won ? state.elapsed : (state.elapsed || 0) + (Date.now() - state.startedAt);
  const fmtTime = ms => {
    const total = Math.max(0, Math.floor(ms/1000));
    return `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;
  };
  function save() {
    const copy = cloneState(state);
    copy.elapsed = elapsedMs();
    copy.startedAt = Date.now();
    storage.set('paige.solitaire.state', copy);
  }
  function pushHistory() {
    history.push(cloneState({...state, elapsed:elapsedMs(), startedAt:Date.now()}));
    if (history.length > 40) history.shift();
  }
  function cardHtml(card, extra='') {
    if (!card.faceUp) return `<div class="playing-card back ${extra}" data-card-id="${card.id}"></div>`;
    const color = cardColor(card);
    return `<div class="playing-card ${color} ${extra}" data-card-id="${card.id}">
      <span class="rank">${rankLabel(card.rank)}</span><span class="suit">${card.suit}</span><span class="big-suit">${card.suit}</span>
    </div>`;
  }
  function isSelected(source, col, index, suit) {
    if (!selected) return false;
    return selected.source===source && selected.col===col && selected.index===index && selected.suit===suit;
  }
  function render() {
    movesEl.textContent = `${state.moves} move${state.moves===1?'':'s'}`;
    timeEl.textContent = fmtTime(elapsedMs());
    const stock = state.stock.length ? cardHtml({id:'stock',faceUp:false}, 'stock-card') : '<div class="slot" data-stock>↻</div>';
    const wasteCard = state.waste.at(-1);
    const waste = wasteCard ? cardHtml(wasteCard, isSelected('waste')?'selected':'') : '<div class="slot">☆</div>';
    const foundations = SUITS.map(suit => {
      const c = state.foundations[suit].at(-1);
      const inner = c ? cardHtml(c, isSelected('foundation',null,null,suit)?'selected':'') : `<div class="slot">${suit}</div>`;
      return `<div data-foundation="${suit}">${inner}</div>`;
    }).join('');
    topEl.innerHTML = `<div data-stock>${stock}</div><div data-waste>${waste}</div>${foundations}`;

    tabEl.innerHTML = state.tableau.map((col, ci) => {
      let y = 0;
      const cards = col.map((c, idx) => {
        const top = y;
        y += c.faceUp ? 28 : 16;
        return `<div data-tableau-card="${ci}:${idx}" style="top:${top}px">${cardHtml(c, isSelected('tableau',ci,idx)?'selected':'')}</div>`;
      }).join('');
      return `<div class="tableau-col" data-tableau="${ci}" style="min-height:${Math.max(360,y+100)}px">${cards}</div>`;
    }).join('');
  }

  function getSelectedCard() {
    if (!selected) return null;
    if (selected.source==='waste') return state.waste.at(-1) || null;
    if (selected.source==='foundation') return state.foundations[selected.suit].at(-1) || null;
    if (selected.source==='tableau') return state.tableau[selected.col][selected.index] || null;
    return null;
  }
  function removeSelectionCards() {
    if (selected.source==='waste') return [state.waste.pop()];
    if (selected.source==='foundation') return [state.foundations[selected.suit].pop()];
    if (selected.source==='tableau') return state.tableau[selected.col].splice(selected.index);
    return [];
  }
  function commitMove() { state.moves++; selected=null; save(); render(); checkWin(); }

  function drawStock() {
    pushHistory();
    if (state.stock.length) {
      const c = state.stock.pop(); c.faceUp=true; state.waste.push(c);
    } else if (state.waste.length) {
      state.stock = state.waste.reverse().map(c => ({...c, faceUp:false})); state.waste=[];
    } else return;
    selected=null; state.moves++; save(); render();
  }
  function tryMoveToTableau(ci) {
    const card = getSelectedCard();
    if (!card) return false;
    const targetCol = state.tableau[ci];
    const target = targetCol.at(-1);
    if (!canStackOnTableau(card, target)) return false;
    if (selected.source==='tableau' && selected.col===ci) return false;
    pushHistory();
    const moving = removeSelectionCards();
    targetCol.push(...moving);
    commitMove();
    return true;
  }
  function tryMoveToFoundation(suit) {
    const card = getSelectedCard();
    if (!card || card.suit !== suit) return false;
    const pile = state.foundations[suit];
    if (card.rank !== pile.length+1) return false;
    if (selected.source==='tableau' && state.tableau[selected.col].length - selected.index !== 1) return false;
    pushHistory();
    pile.push(removeSelectionCards()[0]);
    commitMove();
    return true;
  }
  function autoFoundation(cardRef) {
    selected = cardRef;
    const c = getSelectedCard();
    if (c && tryMoveToFoundation(c.suit)) return;
    selected=null; render();
  }
  function checkWin() {
    if (Object.values(state.foundations).reduce((n,p)=>n+p.length,0) !== 52 || state.won) return;
    state.won=true; state.elapsed=elapsedMs(); save();
    const stats = storage.get('paige.solitaire.stats',{wins:0,bestTime:null,fewestMoves:null});
    stats.wins++;
    stats.bestTime = stats.bestTime == null ? state.elapsed : Math.min(stats.bestTime,state.elapsed);
    stats.fewestMoves = stats.fewestMoves == null ? state.moves : Math.min(stats.fewestMoves,state.moves);
    storage.set('paige.solitaire.stats',stats);
    celebrate({
      eyebrow:'SOLITAIRE CLEARED',
      title:'You won, Paige!',
      message:'Ryan, Link and Sketch knew you had it.',
      stats:[`${state.moves} moves`, fmtTime(state.elapsed), `${stats.wins} total win${stats.wins===1?'':'s'}`]
    });
  }

  function onClick(e) {
    const stockHit = e.target.closest('[data-stock]');
    if (stockHit) { drawStock(); return; }

    const f = e.target.closest('[data-foundation]');
    if (f) {
      const suit=f.dataset.foundation;
      if (selected && tryMoveToFoundation(suit)) return;
      if (state.foundations[suit].length) selected={source:'foundation',suit};
      else selected=null;
      render(); return;
    }
    const w = e.target.closest('[data-waste]');
    if (w) { selected = state.waste.length ? {source:'waste'} : null; render(); return; }

    const cardWrap = e.target.closest('[data-tableau-card]');
    const colWrap = e.target.closest('[data-tableau]');
    if (!colWrap) return;
    const ci = Number(colWrap.dataset.tableau);
    if (selected && tryMoveToTableau(ci)) return;
    if (cardWrap) {
      const [c,i] = cardWrap.dataset.tableauCard.split(':').map(Number);
      const card = state.tableau[c][i];
      if (!card.faceUp) {
        if (i === state.tableau[c].length-1) {
          pushHistory(); card.faceUp=true; state.moves++; selected=null; save(); render();
        }
        return;
      }
      const run=state.tableau[c].slice(i);
      selected = validRun(run) ? {source:'tableau',col:c,index:i} : null;
      render();
    } else if (!state.tableau[ci].length && selected) {
      tryMoveToTableau(ci);
    }
  }

  function onDoubleClick(e) {
    const w=e.target.closest('[data-waste]');
    if (w && state.waste.length) return autoFoundation({source:'waste'});
    const c=e.target.closest('[data-tableau-card]');
    if (c) {
      const [col,index]=c.dataset.tableauCard.split(':').map(Number);
      if (index===state.tableau[col].length-1 && state.tableau[col][index].faceUp) autoFoundation({source:'tableau',col,index});
    }
  }

  function hint() {
    const waste=state.waste.at(-1);
    if (waste && waste.rank===state.foundations[waste.suit].length+1) return toast(`${rankLabel(waste.rank)}${waste.suit} can go to its foundation.`);
    for (let ci=0;ci<7;ci++) {
      const col=state.tableau[ci];
      const top=col.at(-1);
      if (top && !top.faceUp) return toast(`Flip the face-down card in column ${ci+1}.`);
      if (top && top.rank===state.foundations[top.suit].length+1) return toast(`${rankLabel(top.rank)}${top.suit} can go to its foundation.`);
    }
    if (state.stock.length) return toast('Try drawing a card from the deck.');
    toast('Try moving a descending alternating-color run.');
  }
  function newGame() { state=freshState(); selected=null; history=[]; save(); render(); }
  function undo() {
    const prev=history.pop();
    if (!prev) return toast('Nothing to undo yet.');
    state=prev; state.startedAt=Date.now(); selected=null; save(); render();
  }

  topEl.addEventListener('click', onClick);
  tabEl.addEventListener('click', onClick);
  topEl.addEventListener('dblclick', onDoubleClick);
  tabEl.addEventListener('dblclick', onDoubleClick);
  root.querySelector('#solNew').addEventListener('click', newGame);
  root.querySelector('#solUndo').addEventListener('click', undo);
  root.querySelector('#solHint').addEventListener('click', hint);
  timerId=setInterval(()=>{ if (!state.won) timeEl.textContent=fmtTime(elapsedMs()); },1000);
  render();

  return {
    cleanup(){ clearInterval(timerId); save(); },
    replay(){ newGame(); }
  };
}
