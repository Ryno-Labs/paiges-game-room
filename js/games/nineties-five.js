import { VALID_GUESSES } from './five-letter-words.js';

const STORAGE_NS = 'pgr90five:v1:';
const MAX_GUESSES = 6;
const WORD_LEN = 5;
const CHALLENGE_HOURS = 24;
const PUZZLES = [
  {"id": 1, "answer": "SONIC", "category": "Video Games", "clue": "A mascot who made speed feel like attitude."},
  {"id": 2, "answer": "MARIO", "category": "Video Games", "clue": "He spent the decade jumping into new dimensions."},
  {"id": 3, "answer": "ZELDA", "category": "Video Games", "clue": "A royal name attached to a legend bigger than herself."},
  {"id": 4, "answer": "KIRBY", "category": "Video Games", "clue": "Small, round, and surprisingly hard to classify."},
  {"id": 5, "answer": "CRASH", "category": "Video Games", "clue": "A console-era mascot with more spin than subtlety."},
  {"id": 6, "answer": "SPYRO", "category": "Video Games", "clue": "A late-decade hero who made collecting feel fiery."},
  {"id": 7, "answer": "YOSHI", "category": "Video Games", "clue": "A sidekick who became a star in his own right."},
  {"id": 8, "answer": "PEACH", "category": "Video Games", "clue": "A royal regular in one of gaming's busiest kingdoms."},
  {"id": 9, "answer": "WARIO", "category": "Video Games", "clue": "The antihero version of someone much more famous."},
  {"id": 10, "answer": "SAMUS", "category": "Video Games", "clue": "A reveal changed how players saw this armored hero."},
  {"id": 11, "answer": "CLOUD", "category": "Video Games", "clue": "An oversized sword became part of the silhouette."},
  {"id": 12, "answer": "QUAKE", "category": "Video Games", "clue": "PC players knew the name before online shooters became normal."},
  {"id": 13, "answer": "WORMS", "category": "Video Games", "clue": "Cute characters, wildly disproportionate firepower."},
  {"id": 14, "answer": "BANJO", "category": "Video Games", "clue": "One half of an oddball duo built for collecting."},
  {"id": 15, "answer": "SOLID", "category": "Video Games", "clue": "A single adjective turned up in a stealth classic's title."},
  {"id": 16, "answer": "DARIA", "category": "TV & Cartoons", "clue": "A monotone voice for anyone unimpressed by high school."},
  {"id": 17, "answer": "URKEL", "category": "TV & Cartoons", "clue": "A neighbor who could derail an entire room by walking in."},
  {"id": 18, "answer": "BUFFY", "category": "TV & Cartoons", "clue": "Homework by day, much stranger responsibilities after dark."},
  {"id": 19, "answer": "ANGEL", "category": "TV & Cartoons", "clue": "A dark romantic lead whose past was much older than he looked."},
  {"id": 20, "answer": "PINKY", "category": "TV & Cartoons", "clue": "The less strategic half of a very ambitious partnership."},
  {"id": 21, "answer": "BRAIN", "category": "TV & Cartoons", "clue": "He had a plan every night, whether it worked or not."},
  {"id": 22, "answer": "KELSO", "category": "TV & Cartoons", "clue": "Good looks consistently outran good judgment."},
  {"id": 23, "answer": "KENAN", "category": "TV & Cartoons", "clue": "A Nickelodeon pairing worked better because of this first name."},
  {"id": 24, "answer": "ROCKO", "category": "TV & Cartoons", "clue": "Adult problems, cartoon packaging."},
  {"id": 25, "answer": "SAVED", "category": "TV & Cartoons", "clue": "A school bell and a knowing look at the camera."},
  {"id": 26, "answer": "FRESH", "category": "TV & Cartoons", "clue": "A cross-country move turned into prime-time comedy."},
  {"id": 27, "answer": "POWER", "category": "TV & Cartoons", "clue": "Five colors made after-school TV feel like an event."},
  {"id": 28, "answer": "GOOSE", "category": "TV & Cartoons", "clue": "You probably judged these books by the cover art."},
  {"id": 29, "answer": "PARTY", "category": "TV & Cartoons", "clue": "Five siblings had to figure out adulthood too early."},
  {"id": 30, "answer": "OPRAH", "category": "TV & Cartoons", "clue": "An afternoon name that became bigger than television."},
  {"id": 31, "answer": "RICKI", "category": "TV & Cartoons", "clue": "Daytime got louder when this first name hit the schedule."},
  {"id": 32, "answer": "ROSIE", "category": "TV & Cartoons", "clue": "A talk show built around comedy, conversation, and a desk."},
  {"id": 33, "answer": "JESSE", "category": "TV & Cartoons", "clue": "A leather jacket, good hair, and a very crowded house."},
  {"id": 34, "answer": "BECKY", "category": "TV & Cartoons", "clue": "A morning-show professional who married into a packed house."},
  {"id": 35, "answer": "DYLAN", "category": "TV & Cartoons", "clue": "Brooding was practically a zip code in this teen drama."},
  {"id": 36, "answer": "GHOST", "category": "Movies", "clue": "A love story where one person had a serious availability problem."},
  {"id": 37, "answer": "SPEED", "category": "Movies", "clue": "Public transportation came with an unusually strict rule."},
  {"id": 38, "answer": "SEVEN", "category": "Movies", "clue": "A detective story organized around a very old list."},
  {"id": 39, "answer": "FARGO", "category": "Movies", "clue": "Snow, accents, and a plan that unravels badly."},
  {"id": 40, "answer": "BLADE", "category": "Movies", "clue": "A comic-book hero who worked nights for obvious reasons."},
  {"id": 41, "answer": "SPAWN", "category": "Movies", "clue": "A deal after death came with terrible benefits."},
  {"id": 42, "answer": "HOCUS", "category": "Movies", "clue": "Three sisters made one Massachusetts town regret the evening."},
  {"id": 43, "answer": "MULAN", "category": "Movies", "clue": "Family duty required a very convincing disguise."},
  {"id": 44, "answer": "WOODY", "category": "Movies", "clue": "One toy had a badge and a fear of being replaced."},
  {"id": 45, "answer": "SIMBA", "category": "Movies", "clue": "A childhood mistake sent a future ruler away from home."},
  {"id": 46, "answer": "BELLE", "category": "Movies", "clue": "A library card would have been her ideal gift."},
  {"id": 47, "answer": "BEAST", "category": "Movies", "clue": "Bad manners were only part of the curse."},
  {"id": 48, "answer": "GENIE", "category": "Movies", "clue": "Unlimited personality, very limited contractual freedom."},
  {"id": 49, "answer": "JAFAR", "category": "Movies", "clue": "Ambition, robes, and a terrible interest in magical power."},
  {"id": 50, "answer": "ROBIN", "category": "Movies", "clue": "A colorful partner sharing the spotlight with a much darker hero."},
  {"id": 51, "answer": "JUICE", "category": "Movies", "clue": "Friendship and power turn dangerous in Harlem."},
  {"id": 52, "answer": "RONIN", "category": "Movies", "clue": "Professionals, shifting loyalties, and a very good reason to watch the driving."},
  {"id": 53, "answer": "BOUND", "category": "Movies", "clue": "A plan involving money, trust, and the people next door."},
  {"id": 54, "answer": "KEVIN", "category": "Movies", "clue": "Holiday travel improved dramatically once everyone noticed who was missing."},
  {"id": 55, "answer": "ETHAN", "category": "Movies", "clue": "A spy whose career repeatedly depends on impossible assignments."},
  {"id": 56, "answer": "SPICE", "category": "Music", "clue": "Five personalities turned friendship into a global brand."},
  {"id": 57, "answer": "OASIS", "category": "Music", "clue": "Sibling tension somehow produced enormous sing-alongs."},
  {"id": 58, "answer": "JEWEL", "category": "Music", "clue": "Coffeehouse sincerity crossed over to radio."},
  {"id": 59, "answer": "USHER", "category": "Music", "clue": "A teenager entered R&B and did not stay small for long."},
  {"id": 60, "answer": "SNOOP", "category": "Music", "clue": "A laid-back voice became instantly recognizable on the West Coast."},
  {"id": 61, "answer": "JANET", "category": "Music", "clue": "One surname was famous already; the first name stood on its own."},
  {"id": 62, "answer": "TUPAC", "category": "Music", "clue": "A stage name and a number became equally recognizable."},
  {"id": 63, "answer": "BJORK", "category": "Music", "clue": "Art-pop from Iceland rarely sounded this fearless."},
  {"id": 64, "answer": "STING", "category": "Music", "clue": "A former band frontman kept the one-word name."},
  {"id": 65, "answer": "FAITH", "category": "Music", "clue": "Country radio knew this first name before a famous last name followed."},
  {"id": 66, "answer": "TONIC", "category": "Music", "clue": "A band name that sounds medicinal, even when the song wasn't."},
  {"id": 67, "answer": "BLINK", "category": "Music", "clue": "Three digits finished the name."},
  {"id": 68, "answer": "CREEP", "category": "Music", "clue": "Two very different artists had a hit with this same title."},
  {"id": 69, "answer": "LOSER", "category": "Music", "clue": "A self-insult became an unlikely alternative anthem."},
  {"id": 70, "answer": "ALIVE", "category": "Music", "clue": "One word from a debut album that refused to stay underground."},
  {"id": 71, "answer": "VOGUE", "category": "Music", "clue": "A magazine title became a dance-floor instruction."},
  {"id": 72, "answer": "CREAM", "category": "Music", "clue": "A dessert word became a Prince single."},
  {"id": 73, "answer": "MAMBO", "category": "Music", "clue": "A dance name came with a number and a lot of names."},
  {"id": 74, "answer": "NSYNC", "category": "Music", "clue": "An asterisk and harmonies helped define late-decade pop."},
  {"id": 75, "answer": "FIONA", "category": "Music", "clue": "A first name paired with fruit in the alternative era."},
  {"id": 76, "answer": "FURBY", "category": "Toys & Trends", "clue": "It seemed to learn just enough to make adults suspicious."},
  {"id": 77, "answer": "BOPIT", "category": "Toys & Trends", "clue": "Following shouted instructions was the entire point."},
  {"id": 78, "answer": "KOOSH", "category": "Toys & Trends", "clue": "A toy that looked like a handful of rubber noodles."},
  {"id": 79, "answer": "POLLY", "category": "Toys & Trends", "clue": "A whole world had to fit inside something tiny."},
  {"id": 80, "answer": "TROLL", "category": "Toys & Trends", "clue": "The hair was doing most of the work."},
  {"id": 81, "answer": "SURGE", "category": "Snacks & Drinks", "clue": "A soda arrived looking like the decade had designed it."},
  {"id": 82, "answer": "NOKIA", "category": "Tech", "clue": "Dropping one was usually more dangerous to the floor."},
  {"id": 83, "answer": "PAGER", "category": "Tech", "clue": "A tiny screen could suddenly make you find a phone."},
  {"id": 84, "answer": "MODEM", "category": "Tech", "clue": "The sound meant the internet was about to happen."},
  {"id": 85, "answer": "YAHOO", "category": "Tech", "clue": "Before search became one box, this name was a front door to the web."},
  {"id": 86, "answer": "EMAIL", "category": "Tech", "clue": "A mailbox moved onto the family computer."},
  {"id": 87, "answer": "CDROM", "category": "Tech", "clue": "An encyclopedia could suddenly come on one shiny disc."},
  {"id": 88, "answer": "PLAID", "category": "Fashion", "clue": "A pattern that could make a shirt look instantly more alternative."},
  {"id": 89, "answer": "FLARE", "category": "Fashion", "clue": "The hem got wider as the decade went on."},
  {"id": 90, "answer": "KHAKI", "category": "Fashion", "clue": "A neutral color became almost a dress code."},
  {"id": 91, "answer": "CARGO", "category": "Fashion", "clue": "Extra pockets became the whole point."},
  {"id": 92, "answer": "BAGGY", "category": "Fashion", "clue": "Fit mattered, and less fitting was often better."},
  {"id": 93, "answer": "FROST", "category": "Fashion", "clue": "A salon effect that lived mostly at the ends."},
  {"id": 94, "answer": "LEVIS", "category": "Fashion", "clue": "A red tab carried decades of denim history into the 90s."},
  {"id": 95, "answer": "GUESS", "category": "Fashion", "clue": "A question word doubled as a denim label."},
  {"id": 96, "answer": "TYSON", "category": "Sports", "clue": "A heavyweight name that could dominate headlines before the bell."},
  {"id": 97, "answer": "TIGER", "category": "Sports", "clue": "A young golfer made this nickname feel inevitable."},
  {"id": 98, "answer": "VENUS", "category": "Sports", "clue": "A planet name started showing up deep in tennis tournaments."},
  {"id": 99, "answer": "VIPER", "category": "Cars", "clue": "A snake name belonged on bedroom-wall car posters."},
  {"id": 100, "answer": "SUPRA", "category": "Cars", "clue": "A Japanese coupe became much larger than its sales brochure."}
];

const THEMED_GUESSES = new Set(PUZZLES.map(item => item.answer));
function isValidGuess(word) { return VALID_GUESSES.has(word.toLowerCase()) || THEMED_GUESSES.has(word.toUpperCase()); }

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

      <div class="five90-context" aria-live="polite">
        <div class="five90-category-banner">
          <small>TODAY'S CATEGORY</small>
          <strong id="five90Category">90s</strong>
        </div>
        <button id="five90PickPuzzle" class="five90-meta-card five90-puzzle-pick" type="button" aria-label="Choose a puzzle number">
          <span><small>PUZZLE</small><strong id="five90PuzzleNumber">#001</strong></span><em>Pick</em>
        </button>
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
        <p>Six tries. Five letters. Guesses must be real words. 90s names, brands, titles and characters used in this game are also valid.</p>
        <div class="five90-example"><i class="exact">S</i><span>Right letter, right spot.</span></div>
        <div class="five90-example"><i class="present">P</i><span>In the answer, wrong spot.</span></div>
        <div class="five90-example"><i class="absent">A</i><span>Not in the answer.</span></div>
        <p class="five90-small">The clue is only a nudge — not a giveaway. Your Solitaire and Blocks saves are never touched.</p>
      </div>

      <div id="five90PickerSheet" class="five90-help-sheet five90-picker-sheet hidden" role="dialog" aria-modal="true" aria-labelledby="five90PickerTitle">
        <button id="five90PickerClose" class="five90-help-close" type="button" aria-label="Close puzzle picker">×</button>
        <span class="five90-eyebrow">PLAY THE SAME ONE</span>
        <h2 id="five90PickerTitle">Pick a puzzle number.</h2>
        <p>Puzzle numbers never change. If you play <strong>#042</strong>, anyone who chooses <strong>#042</strong> gets the exact same answer.</p>
        <label class="five90-picker-label" for="five90PickerInput">Puzzle 1–${PUZZLES.length}</label>
        <div class="five90-picker-controls">
          <input id="five90PickerInput" class="five90-picker-input" type="number" inputmode="numeric" min="1" max="${PUZZLES.length}" step="1" value="1" />
          <button id="five90PickerGo" class="button primary" type="button">Play Puzzle</button>
        </div>
        <div id="five90PickerPreview" class="five90-picker-preview" aria-live="polite"></div>
        <p class="five90-small">Already played that number? Your saved guesses and result reopen exactly where you left them.</p>
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
    helpSheet: root.querySelector('#five90HelpSheet'), helpClose: root.querySelector('#five90HelpClose'),
    pickPuzzleBtn: root.querySelector('#five90PickPuzzle'), pickerSheet: root.querySelector('#five90PickerSheet'),
    pickerClose: root.querySelector('#five90PickerClose'), pickerInput: root.querySelector('#five90PickerInput'),
    pickerGo: root.querySelector('#five90PickerGo'), pickerPreview: root.querySelector('#five90PickerPreview')
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
    if (!isValidGuess(guess)) {
      showMessage('Not in the word list.');
      const row = els.board.querySelectorAll('.five90-board-row')[state.guesses.length];
      row?.classList.remove('invalid-word');
      requestAnimationFrame(() => row?.classList.add('invalid-word'));
      setTimeout(() => row?.classList.remove('invalid-word'), 380);
      return;
    }
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
Think you can beat it? Pick the same puzzle number and give it a shot.`;
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
      els.hintText.textContent = ''; els.hintText.classList.add('hidden'); els.hintBtn.textContent = 'Need a nudge?'; els.hintBtn.disabled = false;
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

  function pickerValue() {
    const n = parseInt(els.pickerInput.value || '', 10);
    return Number.isInteger(n) && n >= 1 && n <= PUZZLES.length ? n : null;
  }

  function updatePickerPreview() {
    const n = pickerValue();
    if (!n) {
      els.pickerPreview.textContent = `Enter a number from 1 to ${PUZZLES.length}.`;
      els.pickerGo.disabled = true;
      return;
    }
    els.pickerGo.disabled = false;
    const picked = PUZZLES[n - 1];
    const saved = loadState(n);
    const status = saved.result ? ` · ${saved.result.won ? `${saved.result.tries}/6` : 'X/6'} saved` : saved.guesses.length ? ` · ${saved.guesses.length} guess${saved.guesses.length === 1 ? '' : 'es'} saved` : '';
    els.pickerPreview.textContent = `#${String(n).padStart(3,'0')} · ${picked.category}${status}`;
  }

  function openPicker() {
    closeHelp();
    els.pickerInput.value = String(puzzleId);
    updatePickerPreview();
    els.pickerSheet.classList.remove('hidden');
    document.body.classList.add('modal-open');
    setTimeout(() => { els.pickerInput.focus({ preventScroll:true }); els.pickerInput.select?.(); }, 60);
  }

  function closePicker() {
    els.pickerSheet.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }

  function choosePuzzle() {
    const n = pickerValue();
    if (!n) { updatePickerPreview(); return; }
    closePicker();
    updateRouteForPuzzle(n);
    parseRoute();
    renderHeader();
    render();
    root.scrollTop = 0;
  }

  function openHelp() { closePicker(); els.helpSheet.classList.remove('hidden'); document.body.classList.add('modal-open'); }
  function closeHelp() { els.helpSheet.classList.add('hidden'); document.body.classList.remove('modal-open'); }

  const onKeydown = event => {
    if (!els.helpSheet.classList.contains('hidden') || !els.pickerSheet.classList.contains('hidden')) return;
    if (event.key === 'Enter') handleKey('ENTER');
    else if (event.key === 'Backspace') handleKey('BACKSPACE');
    else if (/^[a-zA-Z]$/.test(event.key)) handleKey(event.key.toUpperCase());
  };

  els.hintBtn.addEventListener('click', () => { state.hintShown = true; saveState(); renderHint(); });
  els.challengeBtn.addEventListener('click', shareChallenge);
  els.nextBtn.addEventListener('click', playAnother);
  els.helpBtn.addEventListener('click', openHelp);
  els.helpClose.addEventListener('click', closeHelp);
  els.pickPuzzleBtn.addEventListener('click', openPicker);
  els.pickerClose.addEventListener('click', closePicker);
  els.pickerInput.addEventListener('input', updatePickerPreview);
  els.pickerInput.addEventListener('keydown', event => { if (event.key === 'Enter') choosePuzzle(); });
  els.pickerGo.addEventListener('click', choosePuzzle);
  document.addEventListener('keydown', onKeydown);

  parseRoute();
  buildBoard();
  buildKeyboard();
  renderHeader();
  render();

  return {
    cleanup() {
      clearTimeout(messageTimer); clearRevealTimers(); document.removeEventListener('keydown', onKeydown); closeHelp(); closePicker(); root.classList.remove('five90-active');
    },
    replay() { playAnother(); }
  };
}
