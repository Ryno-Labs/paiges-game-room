(() => {
  'use strict';

  // IMPORTANT: This game only reads/writes keys beginning with this namespace.
  // It never clears localStorage and never touches Paige's existing save data.
  const STORAGE_NS = 'pgr90five:v1:';
  const MAX_GUESSES = 6;
  const WORD_LEN = 5;
  const PUZZLES = window.PGR90S_PUZZLES || [];
  const challengeHours = 24;

  const els = {
    board: document.getElementById('board'),
    keyboard: document.getElementById('keyboard'),
    message: document.getElementById('message'),
    puzzleNumber: document.getElementById('puzzleNumber'),
    category: document.getElementById('category'),
    hintBtn: document.getElementById('hintBtn'),
    hintText: document.getElementById('hintText'),
    resultCard: document.getElementById('resultCard'),
    resultScore: document.getElementById('resultScore'),
    resultAnswer: document.getElementById('resultAnswer'),
    challengeBtn: document.getElementById('challengeBtn'),
    nextBtn: document.getElementById('nextBtn'),
    challengeBanner: document.getElementById('challengeBanner'),
    comparison: document.getElementById('comparison'),
    modeLine: document.getElementById('modeLine'),
    helpBtn: document.getElementById('helpBtn'),
    helpDialog: document.getElementById('helpDialog')
  };

  const params = new URLSearchParams(location.search);
  const challengePuzzle = parseInt(params.get('p') || '', 10);
  const challengerScoreRaw = params.get('s');
  const challengeTimestamp = parseInt(params.get('t') || '', 10);
  const hasPuzzleParam = Number.isInteger(challengePuzzle) && challengePuzzle >= 1 && challengePuzzle <= PUZZLES.length;
  const isChallenge = hasPuzzleParam && params.has('s') && params.has('t');
  const challengeExpired = isChallenge && Number.isFinite(challengeTimestamp) && (Date.now() - challengeTimestamp > challengeHours * 60 * 60 * 1000);

  function dailyPuzzleId() {
    const epoch = Date.UTC(2026, 0, 1);
    const today = new Date();
    const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const day = Math.floor((utcToday - epoch) / 86400000);
    return ((day % PUZZLES.length) + PUZZLES.length) % PUZZLES.length + 1;
  }

  let puzzleId = hasPuzzleParam ? challengePuzzle : dailyPuzzleId();
  let puzzle = PUZZLES[puzzleId - 1];
  let state = loadState(puzzleId);
  let current = '';
  let locked = false;

  function stateKey(id) { return `${STORAGE_NS}puzzle:${id}`; }
  function defaultState() { return { guesses: [], result: null, hintShown: false, updatedAt: Date.now() }; }
  function loadState(id) {
    try {
      const raw = localStorage.getItem(stateKey(id));
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.guesses)) return defaultState();
      return { ...defaultState(), ...parsed };
    } catch { return defaultState(); }
  }
  function saveState() {
    try {
      state.updatedAt = Date.now();
      localStorage.setItem(stateKey(puzzleId), JSON.stringify(state));
    } catch (_) {}
  }

  function scoreLabel(result = state.result) {
    if (!result) return '';
    return result.won ? `${result.tries}/6` : 'X/6';
  }

  function numericScore(raw) {
    if (!raw) return null;
    if (raw.toLowerCase() === 'x') return 7;
    const n = parseInt(raw, 10);
    return Number.isInteger(n) && n >= 1 && n <= 6 ? n : null;
  }

  function evaluateGuess(guess, answer) {
    const out = Array(WORD_LEN).fill('absent');
    const remaining = answer.split('');
    for (let i = 0; i < WORD_LEN; i++) {
      if (guess[i] === answer[i]) {
        out[i] = 'exact';
        remaining[i] = null;
      }
    }
    for (let i = 0; i < WORD_LEN; i++) {
      if (out[i] === 'exact') continue;
      const hit = remaining.indexOf(guess[i]);
      if (hit !== -1) {
        out[i] = 'present';
        remaining[hit] = null;
      }
    }
    return out;
  }

  function buildBoard() {
    els.board.innerHTML = '';
    for (let r = 0; r < MAX_GUESSES; r++) {
      const row = document.createElement('div');
      row.className = 'board-row';
      row.setAttribute('role','row');
      for (let c = 0; c < WORD_LEN; c++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.setAttribute('role','gridcell');
        tile.dataset.row = r;
        tile.dataset.col = c;
        row.appendChild(tile);
      }
      els.board.appendChild(row);
    }
  }

  const keyRows = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','⌫']
  ];

  function buildKeyboard() {
    els.keyboard.innerHTML = '';
    keyRows.forEach(keys => {
      const row = document.createElement('div');
      row.className = 'key-row';
      keys.forEach(k => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'key' + ((k === 'ENTER' || k === '⌫') ? ' wide' : '');
        b.textContent = k;
        b.dataset.key = k;
        b.addEventListener('click', () => handleKey(k));
        row.appendChild(b);
      });
      els.keyboard.appendChild(row);
    });
  }

  function boardTile(r,c) { return els.board.querySelector(`[data-row="${r}"][data-col="${c}"]`); }

  function paintState() {
    const keyStrength = { absent:1, present:2, exact:3 };
    const keyboardState = {};
    state.guesses.forEach((guess, r) => {
      const result = evaluateGuess(guess, puzzle.answer);
      guess.split('').forEach((letter,c) => {
        const tile = boardTile(r,c);
        tile.textContent = letter;
        tile.classList.add('filled', result[c]);
        if (!keyboardState[letter] || keyStrength[result[c]] > keyStrength[keyboardState[letter]]) keyboardState[letter] = result[c];
      });
    });
    const row = state.guesses.length;
    if (!state.result && row < MAX_GUESSES) current.split('').forEach((letter,c) => {
      const tile = boardTile(row,c);
      tile.textContent = letter;
      tile.classList.add('filled');
    });
    Object.entries(keyboardState).forEach(([letter,status]) => {
      const key = els.keyboard.querySelector(`[data-key="${letter}"]`);
      if (key) key.classList.add(status);
    });
  }

  function showMessage(text, ms=1600) {
    els.message.textContent = text;
    clearTimeout(showMessage.timer);
    if (ms) showMessage.timer = setTimeout(() => { if (els.message.textContent === text) els.message.textContent=''; }, ms);
  }

  function handleKey(key) {
    if (locked || state.result || challengeExpired) return;
    if (key === 'ENTER') return submitGuess();
    if (key === '⌫' || key === 'BACKSPACE') {
      current = current.slice(0,-1);
      render();
      return;
    }
    if (/^[A-Z]$/.test(key) && current.length < WORD_LEN) {
      current += key;
      render();
    }
  }

  function submitGuess() {
    if (current.length !== WORD_LEN) return showMessage('Five letters first.');
    const guess = current.toUpperCase();
    state.guesses.push(guess);
    current = '';
    const won = guess === puzzle.answer;
    if (won || state.guesses.length >= MAX_GUESSES) {
      state.result = { won, tries: won ? state.guesses.length : 7, finishedAt: Date.now() };
    }
    saveState();
    locked = true;
    animateReveal(state.guesses.length - 1, () => {
      locked = false;
      render();
      if (state.result) showResult();
    });
  }

  function animateReveal(row, done) {
    const guess = state.guesses[row];
    const result = evaluateGuess(guess, puzzle.answer);
    for (let c=0;c<WORD_LEN;c++) {
      const tile=boardTile(row,c);
      tile.textContent=guess[c];
      setTimeout(() => {
        tile.classList.add('reveal', result[c]);
        if (c === WORD_LEN-1) setTimeout(done, 380);
      }, c*130);
    }
  }

  function comparisonText() {
    const challenger = numericScore(challengerScoreRaw);
    if (!challenger || !state.result) return '';
    const mine = state.result.won ? state.result.tries : 7;
    const theirLabel = challenger === 7 ? 'X/6' : `${challenger}/6`;
    const myLabel = mine === 7 ? 'X/6' : `${mine}/6`;
    if (mine < challenger) return `You beat the challenge: ${myLabel} vs ${theirLabel}.`;
    if (mine > challenger) return `Challenge score wins: ${theirLabel} vs ${myLabel}.`;
    return `Tie game: ${myLabel} vs ${theirLabel}.`;
  }

  function showResult() {
    if (!state.result) return;
    els.resultCard.classList.remove('hidden');
    els.resultScore.textContent = scoreLabel();
    els.resultAnswer.textContent = state.result.won ? `Nice. The answer was ${puzzle.answer}.` : `The answer was ${puzzle.answer}.`;
    const compare = comparisonText();
    if (compare) {
      els.comparison.textContent = compare;
      els.comparison.classList.remove('hidden');
      els.challengeBtn.textContent = 'Send Result Back';
    } else {
      els.comparison.classList.add('hidden');
      els.challengeBtn.textContent = 'Challenge Someone';
    }
    setTimeout(() => els.resultCard.scrollIntoView({behavior:'smooth',block:'nearest'}), 100);
  }

  function resultGrid() {
    return state.guesses.map(g => evaluateGuess(g,puzzle.answer).map(x => x==='exact'?'🟩':x==='present'?'🟨':'⬛').join('')).join('\n');
  }

  function challengeUrl() {
    const u = new URL(location.href);
    u.search = '';
    u.searchParams.set('p', String(puzzleId));
    u.searchParams.set('s', state.result && state.result.won ? String(state.result.tries) : 'x');
    u.searchParams.set('t', String(Date.now()));
    return u.toString();
  }

  async function shareChallenge() {
    if (!state.result) return;
    const their = numericScore(challengerScoreRaw);
    const myScore = scoreLabel();
    const intro = their ? `90s Five #${String(puzzleId).padStart(3,'0')} — result back\nChallenge: ${their===7?'X/6':their+'/6'}\nMe: ${myScore}` : `90s Five #${String(puzzleId).padStart(3,'0')} — ${myScore}\nThink you can beat it?`;
    const text = `${intro}\n\n${resultGrid()}\n\n${challengeUrl()}`;
    try {
      if (navigator.share) await navigator.share({ title:'90s Five', text });
      else {
        await navigator.clipboard.writeText(text);
        showMessage('Challenge copied.');
      }
    } catch (err) {
      if (err && err.name !== 'AbortError') {
        try { await navigator.clipboard.writeText(text); showMessage('Challenge copied.'); } catch (_) { showMessage('Could not share.'); }
      }
    }
  }

  function playAnother() {
    let next = puzzleId + 1;
    if (next > PUZZLES.length) next = 1;
    const u = new URL(location.href);
    u.search = '';
    u.searchParams.set('p', String(next));
    location.href = u.toString();
  }

  function renderHeader() {
    els.puzzleNumber.textContent = `#${String(puzzleId).padStart(3,'0')}`;
    els.category.textContent = puzzle.category;
    if (isChallenge) {
      els.modeLine.textContent = 'One puzzle. One score to beat.';
      els.challengeBanner.classList.remove('hidden');
      if (challengeExpired) {
        els.challengeBanner.textContent = 'This challenge expired after 24 hours. Open a fresh challenge to play head-to-head.';
      } else {
        const n = numericScore(challengerScoreRaw);
        els.challengeBanner.textContent = n ? `Challenge score to beat: ${n===7?'X/6':n+'/6'}` : 'You were challenged to this exact puzzle.';
      }
    } else {
      els.modeLine.textContent = 'Five letters. Pure 90s.';
      els.challengeBanner.classList.add('hidden');
    }
  }

  function renderHint() {
    if (state.hintShown) {
      els.hintText.textContent = puzzle.clue;
      els.hintText.classList.remove('hidden');
      els.hintBtn.textContent = 'Clue:';
      els.hintBtn.disabled = true;
    }
  }

  function render() {
    // clear only board/key visual classes, never browser storage
    [...els.board.querySelectorAll('.tile')].forEach(t => { t.textContent=''; t.className='tile'; });
    [...els.keyboard.querySelectorAll('.key')].forEach(k => { k.classList.remove('exact','present','absent'); });
    paintState();
    renderHint();
    if (state.result) showResult();
  }

  els.hintBtn.addEventListener('click', () => {
    state.hintShown = true;
    saveState();
    renderHint();
  });
  els.challengeBtn.addEventListener('click', shareChallenge);
  els.nextBtn.addEventListener('click', playAnother);
  els.helpBtn.addEventListener('click', () => els.helpDialog.showModal());

  document.addEventListener('keydown', e => {
    if (els.helpDialog.open) return;
    if (e.key === 'Enter') handleKey('ENTER');
    else if (e.key === 'Backspace') handleKey('BACKSPACE');
    else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
  });

  buildBoard();
  buildKeyboard();
  renderHeader();
  render();
  if (challengeExpired) showMessage('Challenge expired.', 0);
})();
