const STORAGE_NS = 'pgr90five:v1:';
const MAX_GUESSES = 6;
const WORD_LEN = 5;
const CHALLENGE_HOURS = 24;
const PUZZLES = [
  {"id": 1, "answer": "SONIC", "category": "Video Games", "clue": "Blue, fast, and very Sega."},
  {"id": 2, "answer": "MARIO", "category": "Video Games", "clue": "Nintendo plumber with a red cap."},
  {"id": 3, "answer": "ZELDA", "category": "Video Games", "clue": "The princess at the center of a legendary Nintendo series."},
  {"id": 4, "answer": "KIRBY", "category": "Video Games", "clue": "Pink Nintendo hero with a huge appetite."},
  {"id": 5, "answer": "CRASH", "category": "Video Games", "clue": "Bandicoot who became a PlayStation mascot."},
  {"id": 6, "answer": "SPYRO", "category": "Video Games", "clue": "Small purple dragon from the original PlayStation era."},
  {"id": 7, "answer": "YOSHI", "category": "Video Games", "clue": "Mario’s green dinosaur pal."},
  {"id": 8, "answer": "PEACH", "category": "Video Games", "clue": "Princess of the Mushroom Kingdom."},
  {"id": 9, "answer": "WARIO", "category": "Video Games", "clue": "Mario’s greedy yellow-and-purple rival."},
  {"id": 10, "answer": "SAMUS", "category": "Video Games", "clue": "Armored bounty hunter from Metroid."},
  {"id": 11, "answer": "CLOUD", "category": "Video Games", "clue": "Spiky-haired hero of Final Fantasy VII."},
  {"id": 12, "answer": "QUAKE", "category": "Video Games", "clue": "1996 PC shooter from id Software."},
  {"id": 13, "answer": "WORMS", "category": "Video Games", "clue": "Tiny teams, big weapons, turn-based chaos."},
  {"id": 14, "answer": "BANJO", "category": "Video Games", "clue": "Bear half of a famous N64 duo."},
  {"id": 15, "answer": "SOLID", "category": "Video Games", "clue": "The middle word in a huge 1998 stealth-game title."},
  {"id": 16, "answer": "DARIA", "category": "TV & Cartoons", "clue": "Deadpan teen who spun off from Beavis and Butt-Head."},
  {"id": 17, "answer": "URKEL", "category": "TV & Cartoons", "clue": "Family Matters neighbor known for suspenders and “Did I do that?”"},
  {"id": 18, "answer": "BUFFY", "category": "TV & Cartoons", "clue": "Sunnydale’s vampire slayer."},
  {"id": 19, "answer": "ANGEL", "category": "TV & Cartoons", "clue": "Buffy’s brooding vampire with a soul."},
  {"id": 20, "answer": "PINKY", "category": "TV & Cartoons", "clue": "One half of a lab-mouse duo trying to take over the world."},
  {"id": 21, "answer": "BRAIN", "category": "TV & Cartoons", "clue": "The ambitious half of Pinky’s lab-mouse duo."},
  {"id": 22, "answer": "KELSO", "category": "TV & Cartoons", "clue": "Ashton Kutcher’s lovable doofus on That ’70s Show."},
  {"id": 23, "answer": "KENAN", "category": "TV & Cartoons", "clue": "Nickelodeon star paired with Kel."},
  {"id": 24, "answer": "ROCKO", "category": "TV & Cartoons", "clue": "Wallaby with a Modern Life."},
  {"id": 25, "answer": "SAVED", "category": "TV & Cartoons", "clue": "First word of the Bayside High sitcom title."},
  {"id": 26, "answer": "FRESH", "category": "TV & Cartoons", "clue": "First word of Will Smith’s Bel-Air sitcom title."},
  {"id": 27, "answer": "POWER", "category": "TV & Cartoons", "clue": "First word in the 1993 team of color-coded Rangers."},
  {"id": 28, "answer": "GOOSE", "category": "TV & Cartoons", "clue": "First half of R.L. Stine’s kid-horror series title."},
  {"id": 29, "answer": "PARTY", "category": "TV & Cartoons", "clue": "First word of the Fox drama about five siblings."},
  {"id": 30, "answer": "OPRAH", "category": "TV & Cartoons", "clue": "Daytime talk-show powerhouse of the decade."},
  {"id": 31, "answer": "RICKI", "category": "TV & Cartoons", "clue": "First name of a major 90s daytime talk-show host."},
  {"id": 32, "answer": "ROSIE", "category": "TV & Cartoons", "clue": "First name of the comedian whose daytime show began in 1996."},
  {"id": 33, "answer": "JESSE", "category": "TV & Cartoons", "clue": "Uncle ____ on Full House."},
  {"id": 34, "answer": "BECKY", "category": "TV & Cartoons", "clue": "Aunt ____ on Full House."},
  {"id": 35, "answer": "DYLAN", "category": "TV & Cartoons", "clue": "Luke Perry’s Beverly Hills, 90210 character."},
  {"id": 36, "answer": "GHOST", "category": "Movies", "clue": "1990 romance with pottery and a supernatural twist."},
  {"id": 37, "answer": "SPEED", "category": "Movies", "clue": "1994 action movie built around a city bus."},
  {"id": 38, "answer": "SEVEN", "category": "Movies", "clue": "1995 thriller whose title is often stylized with a number."},
  {"id": 39, "answer": "FARGO", "category": "Movies", "clue": "1996 snowy crime film from the Coen brothers."},
  {"id": 40, "answer": "BLADE", "category": "Movies", "clue": "1998 vampire-hunter superhero movie."},
  {"id": 41, "answer": "SPAWN", "category": "Movies", "clue": "1997 comic-book antihero movie."},
  {"id": 42, "answer": "HOCUS", "category": "Movies", "clue": "First word of the 1993 Sanderson-sisters movie."},
  {"id": 43, "answer": "MULAN", "category": "Movies", "clue": "Disney heroine who takes her father’s place in the army."},
  {"id": 44, "answer": "WOODY", "category": "Movies", "clue": "Cowboy toy voiced by Tom Hanks."},
  {"id": 45, "answer": "SIMBA", "category": "Movies", "clue": "Young lion who becomes king."},
  {"id": 46, "answer": "BELLE", "category": "Movies", "clue": "Book-loving heroine of Beauty and the Beast."},
  {"id": 47, "answer": "BEAST", "category": "Movies", "clue": "Cursed prince in a 1991 Disney classic."},
  {"id": 48, "answer": "GENIE", "category": "Movies", "clue": "Blue wish-granter in Aladdin."},
  {"id": 49, "answer": "JAFAR", "category": "Movies", "clue": "Aladdin villain with a cobra staff."},
  {"id": 50, "answer": "ROBIN", "category": "Movies", "clue": "Batman’s sidekick shared the title of a 1997 movie."},
  {"id": 51, "answer": "JUICE", "category": "Movies", "clue": "1992 crime drama starring Tupac Shakur."},
  {"id": 52, "answer": "RONIN", "category": "Movies", "clue": "1998 action thriller with famous car chases."},
  {"id": 53, "answer": "BOUND", "category": "Movies", "clue": "1996 neo-noir crime thriller from the Wachowskis."},
  {"id": 54, "answer": "KEVIN", "category": "Movies", "clue": "First name of the kid left Home Alone."},
  {"id": 55, "answer": "ETHAN", "category": "Movies", "clue": "Tom Cruise’s Mission: Impossible character."},
  {"id": 56, "answer": "SPICE", "category": "Music", "clue": "The Girls who told everyone what they really, really wanted."},
  {"id": 57, "answer": "OASIS", "category": "Music", "clue": "Britpop band behind “Wonderwall.”"},
  {"id": 58, "answer": "JEWEL", "category": "Music", "clue": "Singer-songwriter behind “You Were Meant for Me.”"},
  {"id": 59, "answer": "USHER", "category": "Music", "clue": "R&B singer who broke out as a teen in the 90s."},
  {"id": 60, "answer": "SNOOP", "category": "Music", "clue": "Rapper who debuted with Doggystyle."},
  {"id": 61, "answer": "JANET", "category": "Music", "clue": "Jackson sibling behind the janet. era."},
  {"id": 62, "answer": "TUPAC", "category": "Music", "clue": "Rapper also known as 2Pac."},
  {"id": 63, "answer": "BJORK", "category": "Music", "clue": "Icelandic artist behind Debut and Post."},
  {"id": 64, "answer": "STING", "category": "Music", "clue": "Former Police frontman with a huge 90s solo career."},
  {"id": 65, "answer": "FAITH", "category": "Music", "clue": "First name of country star Hill."},
  {"id": 66, "answer": "TONIC", "category": "Music", "clue": "Band behind “If You Could Only See.”"},
  {"id": 67, "answer": "BLINK", "category": "Music", "clue": "First word in the pop-punk trio’s name ending in 182."},
  {"id": 68, "answer": "CREEP", "category": "Music", "clue": "A 90s hit title shared by TLC and Radiohead."},
  {"id": 69, "answer": "LOSER", "category": "Music", "clue": "Beck’s breakout 1994 hit."},
  {"id": 70, "answer": "ALIVE", "category": "Music", "clue": "Pearl Jam song from Ten."},
  {"id": 71, "answer": "VOGUE", "category": "Music", "clue": "Madonna hit that became a dance-floor command."},
  {"id": 72, "answer": "CREAM", "category": "Music", "clue": "Prince hit released in 1991."},
  {"id": 73, "answer": "MAMBO", "category": "Music", "clue": "First word in Lou Bega’s 1999 “No. 5” hit."},
  {"id": 74, "answer": "NSYNC", "category": "Music", "clue": "Boy band featuring Justin Timberlake."},
  {"id": 75, "answer": "FIONA", "category": "Music", "clue": "First name of singer-songwriter Apple."},
  {"id": 76, "answer": "FURBY", "category": "Toys & Trends", "clue": "Big-eyed electronic pet that became a 1998 craze."},
  {"id": 77, "answer": "BOPIT", "category": "Toys & Trends", "clue": "Toy that tells you to twist it, pull it, and do this."},
  {"id": 78, "answer": "KOOSH", "category": "Toys & Trends", "clue": "Rubbery ball made of colorful strands."},
  {"id": 79, "answer": "POLLY", "category": "Toys & Trends", "clue": "First name of the tiny-pocket playset doll."},
  {"id": 80, "answer": "TROLL", "category": "Toys & Trends", "clue": "Wild-haired dolls that came roaring back in the 90s."},
  {"id": 81, "answer": "SURGE", "category": "Snacks & Drinks", "clue": "Neon-green citrus soda Coca-Cola launched in 1997."},
  {"id": 82, "answer": "NOKIA", "category": "Tech", "clue": "Phone brand famous for nearly indestructible handsets."},
  {"id": 83, "answer": "PAGER", "category": "Tech", "clue": "Pocket device that told you who needed a callback."},
  {"id": 84, "answer": "MODEM", "category": "Tech", "clue": "Noisy box that got the family computer online."},
  {"id": 85, "answer": "YAHOO", "category": "Tech", "clue": "Purple web portal and search brand launched in the 90s."},
  {"id": 86, "answer": "EMAIL", "category": "Tech", "clue": "The message format that started replacing letters and faxes."},
  {"id": 87, "answer": "CDROM", "category": "Tech", "clue": "Shiny computer disc format used for games and encyclopedias."},
  {"id": 88, "answer": "PLAID", "category": "Fashion", "clue": "Pattern strongly tied to grunge shirts."},
  {"id": 89, "answer": "FLARE", "category": "Fashion", "clue": "Jeans shape that widened toward the ankle."},
  {"id": 90, "answer": "KHAKI", "category": "Fashion", "clue": "Mall-era pants color that became office-casual shorthand."},
  {"id": 91, "answer": "CARGO", "category": "Fashion", "clue": "Pocket-heavy pants that were everywhere late in the decade."},
  {"id": 92, "answer": "BAGGY", "category": "Fashion", "clue": "The fit of a lot of 90s jeans and streetwear."},
  {"id": 93, "answer": "FROST", "category": "Fashion", "clue": "What happened to the tips of plenty of 90s hair."},
  {"id": 94, "answer": "LEVIS", "category": "Fashion", "clue": "Classic denim brand with a huge 90s presence."},
  {"id": 95, "answer": "GUESS", "category": "Fashion", "clue": "Denim-and-fashion brand known for black-and-white ads."},
  {"id": 96, "answer": "TYSON", "category": "Sports", "clue": "Heavyweight boxer whose name dominated 90s headlines."},
  {"id": 97, "answer": "TIGER", "category": "Sports", "clue": "First name/nickname of Woods, who won the 1997 Masters."},
  {"id": 98, "answer": "VENUS", "category": "Sports", "clue": "Williams sister who reached the 1997 U.S. Open final."},
  {"id": 99, "answer": "VIPER", "category": "Cars", "clue": "Dodge supercar that became a 90s poster favorite."},
  {"id": 100, "answer": "SUPRA", "category": "Cars", "clue": "Toyota performance icon made famous by 90s tuner culture."},
];

function evaluateGuess(guess, answer) {
  const out = Array(WORD_LEN).fill('absent');
  const remaining = answer.split('');
  for (let i = 0; i < WORD_LEN; i++) {
    if (guess[i] === answer[i]) { out[i] = 'exact'; remaining[i] = null; }
  }
  for (let i = 0; i < WORD_LEN; i++) {
    if (out[i] === 'exact') continue;
    const hit = remaining.indexOf(guess[i]);
    if (hit !== -1) { out[i] = 'present'; remaining[hit] = null; }
  }
  return out;
}

function dailyPuzzleId() {
  const epoch = Date.UTC(2026, 0, 1);
  const today = new Date();
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const day = Math.floor((utcToday - epoch) / 86400000);
  return ((day % PUZZLES.length) + PUZZLES.length) % PUZZLES.length + 1;
}

function numericScore(raw) {
  if (!raw) return null;
  if (String(raw).toLowerCase() === 'x') return 7;
  const n = parseInt(raw, 10);
  return Number.isInteger(n) && n >= 1 && n <= 6 ? n : null;
}

export async function mount({ root, toast, storage }) {
  root.classList.add('five90-active');
  root.innerHTML = `
    <section class="five90-screen game-screen" aria-label="90s Five">
      <div class="five90-brand-row">
        <div>
          <span class="five90-eyebrow">PAIGE'S GAME ROOM</span>
          <h1><b>90s</b> FIVE</h1>
          <p id="five90ModeLine">Five letters. Pure 90s.</p>
        </div>
        <button class="five90-help" id="five90Help" type="button" aria-label="How to play">?</button>
      </div>

      <div id="five90ChallengeBanner" class="five90-challenge hidden" aria-live="polite"></div>

      <div class="five90-meta" aria-live="polite">
        <div><small>PUZZLE</small><strong id="five90PuzzleNumber">#001</strong></div>
        <div><small>CATEGORY</small><strong id="five90Category">90s</strong></div>
      </div>

      <div class="five90-board-wrap">
        <div id="five90Board" class="five90-board" role="grid" aria-label="Guess board"></div>
      </div>

      <div id="five90Message" class="five90-message" aria-live="assertive"></div>

      <div class="five90-hint-row">
        <button id="five90Hint" class="five90-text-button" type="button">Need a clue?</button>
        <span id="five90HintText" class="five90-hint-text hidden"></span>
      </div>

      <div id="five90Keyboard" class="five90-keyboard" aria-label="On-screen keyboard"></div>

      <section id="five90Result" class="five90-result hidden" aria-live="polite">
        <span>FINAL SCORE</span>
        <strong id="five90ResultScore">4/6</strong>
        <p id="five90ResultAnswer"></p>
        <div id="five90Comparison" class="five90-comparison hidden"></div>
        <div class="five90-result-actions">
          <button id="five90Challenge" class="button primary" type="button">Challenge Someone</button>
          <button id="five90Next" class="button secondary" type="button">Play Another</button>
        </div>
      </section>

      <div class="five90-footnote">100 handcrafted 90s puzzles · saves separately from Paige's other games</div>

      <div id="five90HelpSheet" class="five90-help-sheet hidden" role="dialog" aria-modal="true" aria-labelledby="five90HelpTitle">
        <button id="five90HelpClose" class="five90-help-close" type="button" aria-label="Close help">×</button>
        <span class="five90-eyebrow">HOW TO PLAY</span>
        <h2 id="five90HelpTitle">Guess the 90s answer.</h2>
        <p>Six tries. Five letters. Proper names, brands, titles, characters, tech and slang are all fair game.</p>
        <div class="five90-example"><i class="exact">S</i><span>Right letter, right spot.</span></div>
        <div class="five90-example"><i class="present">P</i><span>In the answer, wrong spot.</span></div>
        <div class="five90-example"><i class="absent">A</i><span>Not in the answer.</span></div>
        <p class="five90-small">Use the clue whenever you want. Your Solitaire and Blocks saves are never touched.</p>
      </div>
    </section>`;

  const els = {
    board: root.querySelector('#five90Board'), keyboard: root.querySelector('#five90Keyboard'),
    message: root.querySelector('#five90Message'), puzzleNumber: root.querySelector('#five90PuzzleNumber'),
    category: root.querySelector('#five90Category'), hintBtn: root.querySelector('#five90Hint'),
    hintText: root.querySelector('#five90HintText'), resultCard: root.querySelector('#five90Result'),
    resultScore: root.querySelector('#five90ResultScore'), resultAnswer: root.querySelector('#five90ResultAnswer'),
    challengeBtn: root.querySelector('#five90Challenge'), nextBtn: root.querySelector('#five90Next'),
    challengeBanner: root.querySelector('#five90ChallengeBanner'), comparison: root.querySelector('#five90Comparison'),
    modeLine: root.querySelector('#five90ModeLine'), helpBtn: root.querySelector('#five90Help'),
    helpSheet: root.querySelector('#five90HelpSheet'), helpClose: root.querySelector('#five90HelpClose')
  };

  let puzzleId = dailyPuzzleId();
  let puzzle = PUZZLES[puzzleId - 1];
  let state = null;
  let current = '';
  let locked = false;
  let challengerScoreRaw = null;
  let challengeExpired = false;
  let isChallenge = false;
  let messageTimer = null;
  let revealTimers = [];

  const keyRows = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','⌫']
  ];

  const stateKey = id => `${STORAGE_NS}puzzle:${id}`;
  const defaultState = () => ({ guesses: [], result: null, hintShown: false, updatedAt: Date.now() });
  const loadState = id => {
    const parsed = storage.get(stateKey(id), null);
    if (!parsed || !Array.isArray(parsed.guesses)) return defaultState();
    return { ...defaultState(), ...parsed };
  };
  const saveState = () => { state.updatedAt = Date.now(); storage.set(stateKey(puzzleId), state); };
  const scoreLabel = (result = state?.result) => result ? (result.won ? `${result.tries}/6` : 'X/6') : '';

  function parseRoute() {
    const params = new URLSearchParams(location.search);
    const requested = parseInt(params.get('p') || '', 10);
    const valid = Number.isInteger(requested) && requested >= 1 && requested <= PUZZLES.length;
    puzzleId = valid ? requested : dailyPuzzleId();
    puzzle = PUZZLES[puzzleId - 1];
    challengerScoreRaw = params.get('s');
    const stamp = parseInt(params.get('t') || '', 10);
    isChallenge = valid && params.has('s') && params.has('t');
    challengeExpired = isChallenge && Number.isFinite(stamp) && (Date.now() - stamp > CHALLENGE_HOURS * 60 * 60 * 1000);
    state = loadState(puzzleId);
    current = '';
    locked = false;
  }

  function updateRouteForPuzzle(id) {
    const u = new URL(location.href);
    u.search = '';
    u.searchParams.set('p', String(id));
    u.hash = '90sfive';
    history.replaceState(null, '', `${u.pathname}${u.search}${u.hash}`);
  }

  function buildBoard() {
    els.board.innerHTML = '';
    for (let r = 0; r < MAX_GUESSES; r++) {
      const row = document.createElement('div');
      row.className = 'five90-board-row';
      row.setAttribute('role','row');
      for (let c = 0; c < WORD_LEN; c++) {
        const tile = document.createElement('div');
        tile.className = 'five90-tile';
        tile.setAttribute('role','gridcell');
        tile.dataset.row = r; tile.dataset.col = c;
        row.appendChild(tile);
      }
      els.board.appendChild(row);
    }
  }

  function buildKeyboard() {
    els.keyboard.innerHTML = '';
    keyRows.forEach(keys => {
      const row = document.createElement('div');
      row.className = 'five90-key-row';
      keys.forEach(key => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'five90-key' + ((key === 'ENTER' || key === '⌫') ? ' wide' : '');
        button.textContent = key;
        button.dataset.key = key;
        button.addEventListener('click', () => handleKey(key));
        row.appendChild(button);
      });
      els.keyboard.appendChild(row);
    });
  }

  const boardTile = (r,c) => els.board.querySelector(`[data-row="${r}"][data-col="${c}"]`);

  function paintState() {
    const strength = { absent:1, present:2, exact:3 };
    const keyboardState = {};
    state.guesses.forEach((guess, r) => {
      const result = evaluateGuess(guess, puzzle.answer);
      guess.split('').forEach((letter,c) => {
        const tile = boardTile(r,c);
        tile.textContent = letter;
        tile.classList.add('filled', result[c]);
        if (!keyboardState[letter] || strength[result[c]] > strength[keyboardState[letter]]) keyboardState[letter] = result[c];
      });
    });
    const row = state.guesses.length;
    if (!state.result && row < MAX_GUESSES) current.split('').forEach((letter,c) => {
      const tile = boardTile(row,c); tile.textContent = letter; tile.classList.add('filled');
    });
    Object.entries(keyboardState).forEach(([letter,status]) => {
      els.keyboard.querySelector(`[data-key="${letter}"]`)?.classList.add(status);
    });
  }

  function showMessage(text, ms=1600) {
    els.message.textContent = text;
    clearTimeout(messageTimer);
    if (ms) messageTimer = setTimeout(() => { if (els.message.textContent === text) els.message.textContent = ''; }, ms);
  }

  function clearRevealTimers() { revealTimers.forEach(clearTimeout); revealTimers = []; }

  function handleKey(key) {
    if (locked || state.result || challengeExpired || !puzzle) return;
    if (key === 'ENTER') { submitGuess(); return; }
    if (key === '⌫' || key === 'BACKSPACE') { current = current.slice(0,-1); render(); return; }
    if (/^[A-Z]$/.test(key) && current.length < WORD_LEN) { current += key; render(); }
  }

  function submitGuess() {
    if (current.length !== WORD_LEN) { showMessage('Five letters first.'); return; }
    const guess = current.toUpperCase();
    state.guesses.push(guess); current = '';
    const won = guess === puzzle.answer;
    if (won || state.guesses.length >= MAX_GUESSES) state.result = { won, tries: won ? state.guesses.length : 7, finishedAt: Date.now() };
    saveState();
    locked = true;
    animateReveal(state.guesses.length - 1, () => { locked = false; render(); if (state.result) showResult(); });
  }

  function animateReveal(row, done) {
    clearRevealTimers();
    const guess = state.guesses[row];
    const result = evaluateGuess(guess, puzzle.answer);
    for (let c=0;c<WORD_LEN;c++) {
      const tile=boardTile(row,c); tile.textContent=guess[c];
      revealTimers.push(setTimeout(() => {
        tile.classList.add('reveal', result[c]);
        if (c === WORD_LEN-1) revealTimers.push(setTimeout(done, 300));
      }, c*105));
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
    els.resultAnswer.textContent = `The answer was ${puzzle.answer}.`;
    const compare = comparisonText();
    if (compare) {
      els.comparison.textContent = compare; els.comparison.classList.remove('hidden'); els.challengeBtn.textContent = 'Send Result Back';
    } else {
      els.comparison.classList.add('hidden'); els.challengeBtn.textContent = 'Challenge Someone';
    }
    requestAnimationFrame(() => els.resultCard.scrollIntoView({behavior:'smooth',block:'nearest'}));
  }

  function resultGrid() {
    return state.guesses
      .map(g => evaluateGuess(g, puzzle.answer)
        .map(x => x === 'exact' ? '🟩' : x === 'present' ? '🟨' : '⬛')
        .join(''))
      .join('\n');
  }

  function challengeUrl() {
    const u = new URL(location.href);
    u.search = '';
    u.searchParams.set('p', String(puzzleId));
    u.searchParams.set('s', state.result?.won ? String(state.result.tries) : 'x');
    u.searchParams.set('t', String(Date.now()));
    u.hash = '90sfive';
    return u.toString();
  }

  async function shareChallenge() {
    if (!state.result) return;
    const their = numericScore(challengerScoreRaw);
    const myScore = scoreLabel();
    const intro = their
      ? `90s Five #${String(puzzleId).padStart(3,'0')} — result back
Challenge: ${their===7?'X/6':their+'/6'}
Me: ${myScore}`
      : `90s Five #${String(puzzleId).padStart(3,'0')} — ${myScore}
Think you can beat it?`;
    const text = `${intro}

${resultGrid()}

${challengeUrl()}`;
    try {
      if (navigator.share) await navigator.share({ title:'90s Five', text });
      else { await navigator.clipboard.writeText(text); toast('Challenge copied.'); }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        try { await navigator.clipboard.writeText(text); toast('Challenge copied.'); }
        catch { toast('Could not share this time.'); }
      }
    }
  }

  function playAnother() {
    const next = puzzleId >= PUZZLES.length ? 1 : puzzleId + 1;
    updateRouteForPuzzle(next);
    parseRoute();
    renderHeader();
    render();
    root.scrollTop = 0;
  }

  function renderHeader() {
    els.puzzleNumber.textContent = `#${String(puzzleId).padStart(3,'0')}`;
    els.category.textContent = puzzle.category;
    if (isChallenge) {
      els.modeLine.textContent = 'One puzzle. One score to beat.';
      els.challengeBanner.classList.remove('hidden');
      if (challengeExpired) {
        els.challengeBanner.textContent = 'This challenge expired after 24 hours. Ask for a fresh one.';
      } else {
        const n = numericScore(challengerScoreRaw);
        els.challengeBanner.textContent = n ? `Challenge score to beat: ${n===7?'X/6':n+'/6'}` : 'You were challenged to this exact puzzle.';
      }
    } else {
      els.modeLine.textContent = new URLSearchParams(location.search).has('p') ? 'Keep the 90s streak going.' : "Today's five-letter trip back.";
      els.challengeBanner.classList.add('hidden');
    }
  }

  function renderHint() {
    if (state.hintShown) {
      els.hintText.textContent = puzzle.clue; els.hintText.classList.remove('hidden'); els.hintBtn.textContent = 'Clue:'; els.hintBtn.disabled = true;
    } else {
      els.hintText.textContent = ''; els.hintText.classList.add('hidden'); els.hintBtn.textContent = 'Need a clue?'; els.hintBtn.disabled = false;
    }
  }

  function render() {
    els.resultCard.classList.add('hidden');
    els.comparison.classList.add('hidden');
    [...els.board.querySelectorAll('.five90-tile')].forEach(t => { t.textContent=''; t.className='five90-tile'; });
    [...els.keyboard.querySelectorAll('.five90-key')].forEach(k => k.classList.remove('exact','present','absent'));
    paintState(); renderHint(); if (state.result) showResult();
    if (challengeExpired) showMessage('Challenge expired.', 0);
    else if (!state.result) showMessage('', 0);
  }

  function openHelp() { els.helpSheet.classList.remove('hidden'); document.body.classList.add('modal-open'); }
  function closeHelp() { els.helpSheet.classList.add('hidden'); document.body.classList.remove('modal-open'); }

  const onKeydown = event => {
    if (!els.helpSheet.classList.contains('hidden')) return;
    if (event.key === 'Enter') handleKey('ENTER');
    else if (event.key === 'Backspace') handleKey('BACKSPACE');
    else if (/^[a-zA-Z]$/.test(event.key)) handleKey(event.key.toUpperCase());
  };

  els.hintBtn.addEventListener('click', () => { state.hintShown = true; saveState(); renderHint(); });
  els.challengeBtn.addEventListener('click', shareChallenge);
  els.nextBtn.addEventListener('click', playAnother);
  els.helpBtn.addEventListener('click', openHelp);
  els.helpClose.addEventListener('click', closeHelp);
  document.addEventListener('keydown', onKeydown);

  parseRoute();
  buildBoard();
  buildKeyboard();
  renderHeader();
  render();

  return {
    cleanup() {
      clearTimeout(messageTimer); clearRevealTimers(); document.removeEventListener('keydown', onKeydown); closeHelp(); root.classList.remove('five90-active');
    },
    replay() { playAnother(); }
  };
}
