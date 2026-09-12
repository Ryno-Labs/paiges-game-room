const screen = document.querySelector('#screen');
const backButton = document.querySelector('#backButton');
const topbarTitle = document.querySelector('#topbarTitle');
const installButton = document.querySelector('#installButton');
const toastEl = document.querySelector('#toast');
const celebration = document.querySelector('#celebration');
const celebrationTitle = document.querySelector('#celebrationTitle');
const celebrationEyebrow = document.querySelector('#celebrationEyebrow');
const celebrationMessage = document.querySelector('#celebrationMessage');
const celebrationStats = document.querySelector('#celebrationStats');
const celebrationAgain = document.querySelector('#celebrationAgain');
const celebrationHome = document.querySelector('#celebrationHome');

let currentCleanup = null;
let currentReplay = null;
let currentGameId = null;

// Add future games here. Each game stays isolated in its own module.
export const GAME_REGISTRY = [
  {
    id: 'solitaire',
    title: 'Solitaire',
    subtitle: 'Klondike. No ads. No coins. Just cards.',
    art: './assets/solitaire-card.jpg',
    module: './games/solitaire.js',
    enabled: true
  },
  {
    id: 'tetris',
    title: 'Tetris',
    subtitle: 'Tap, swipe, stack, clear. Beat your best.',
    art: './assets/blockdrop-card.jpg',
    module: './games/blockdrop.js',
    enabled: true
  },
  { id: 'coming-1', title: 'Next Game', subtitle: 'Add anything Paige gets into next.', enabled: false },
  { id: 'coming-2', title: 'Next Game', subtitle: 'Another game slot is ready whenever she wants it.', enabled: false }
];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function storageApi() {
  return {
    get(key, fallback = null) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch {}
    }
  };
}

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function toast(message, ms = 2100) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toastEl.classList.remove('show'), ms);
}

function cleanupCurrent() {
  if (typeof currentCleanup === 'function') {
    try { currentCleanup(); } catch (error) { console.warn(error); }
  }
  currentCleanup = null;
  currentReplay = null;
  currentGameId = null;
}

function setChrome({ title, showBack, showInstall }) {
  topbarTitle.textContent = title;
  backButton.classList.toggle('hidden', !showBack);
  installButton.classList.toggle('hidden', !showInstall || isStandalone());
}

function renderHome() {
  cleanupCurrent();
  closeCelebration();
  history.replaceState(null, '', '#home');
  setChrome({ title: "Paige's Game Room", showBack: false, showInstall: true });
  screen.scrollTop = 0;
  screen.innerHTML = `
    <section class="home-hero" aria-label="Paige's Game Room">
      <div class="home-hero-copy">
        <span class="section-kicker">PAIGE'S PRIVATE ARCADE</span>
        <p>Two games now. Zero ads forever. More whenever you get bored.</p>
      </div>
    </section>
    <section class="home-section">
      <span class="section-kicker">PICK A GAME</span>
      <h1 class="section-title">What are we playing?</h1>
      <div class="game-grid">
        ${GAME_REGISTRY.map(game => game.enabled ? `
          <button class="game-card" type="button" data-game="${escapeHtml(game.id)}" aria-label="Play ${escapeHtml(game.title)}">
            <img class="game-art" src="${game.art}" alt="" draggable="false" />
            <span class="game-card-body">
              <span role="heading" aria-level="2" class="game-card-heading">${escapeHtml(game.title)}</span>
              <span class="game-card-description">${escapeHtml(game.subtitle)}</span>
              <span class="play-chip">Play →</span>
            </span>
          </button>
        ` : `
          <div class="placeholder-card" aria-hidden="true">
            <div><strong>＋ More games</strong><br><small>${escapeHtml(game.subtitle)}</small></div>
          </div>
        `).join('')}
      </div>
    </section>
    <div class="home-note">Built for Paige. It saves on this iPhone, works offline after the first load, and never shows an ad.</div>
  `;

  screen.querySelectorAll('[data-game]').forEach(card => {
    card.addEventListener('click', () => openGame(card.dataset.game));
  });
}

async function openGame(id) {
  const game = GAME_REGISTRY.find(item => item.id === id && item.enabled);
  if (!game || currentGameId === id) return;
  cleanupCurrent();
  closeCelebration();
  currentGameId = id;
  history.replaceState(null, '', `#${id}`);
  setChrome({ title: game.title, showBack: true, showInstall: false });
  screen.scrollTop = 0;
  screen.innerHTML = '<div style="padding:32px 18px;text-align:center;font-weight:900">Loading…</div>';

  try {
    const mod = await import(game.module);
    const result = await mod.mount({
      root: screen,
      toast,
      celebrate,
      goHome: renderHome,
      storage: storageApi()
    });
    currentCleanup = result?.cleanup || null;
    currentReplay = result?.replay || null;
    requestAnimationFrame(() => { screen.scrollTop = 0; });
  } catch (error) {
    console.error(error);
    currentGameId = null;
    screen.innerHTML = `<div style="padding:22px"><h2>That game hit a snag.</h2><p>${escapeHtml(error?.message || 'Unknown error')}</p><button class="button" id="goHomeError" type="button">Game room</button></div>`;
    screen.querySelector('#goHomeError')?.addEventListener('click', renderHome);
  }
}

function celebrate({ title = 'You crushed it, Paige!', eyebrow = 'NICE WORK', message = 'Ryan, Link and Sketch approve.', stats = [] } = {}) {
  celebrationTitle.textContent = title;
  celebrationEyebrow.textContent = eyebrow;
  celebrationMessage.textContent = message;
  celebrationStats.innerHTML = stats.map(item => `<span>${escapeHtml(item)}</span>`).join('');
  celebration.classList.remove('hidden');
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => celebrationAgain.focus({ preventScroll: true }));
}

function closeCelebration() {
  celebration.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

celebrationAgain.addEventListener('click', () => {
  closeCelebration();
  currentReplay?.();
});
celebrationHome.addEventListener('click', () => {
  closeCelebration();
  renderHome();
});
backButton.addEventListener('click', renderHome);

installButton.addEventListener('click', () => {
  toast('On iPhone: tap Share, then Add to Home Screen.', 3000);
});

window.addEventListener('hashchange', () => {
  const id = location.hash.replace('#','');
  if (!id || id === 'home') renderHome();
  else if (GAME_REGISTRY.some(game => game.id === id && game.enabled)) openGame(id);
});

if ('serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let refreshingForUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshingForUpdate) return;
    refreshingForUpdate = true;
    location.reload();
  });
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
    .then(registration => registration.update().catch(() => {}))
    .catch(error => console.warn('Service worker:', error));
}

const initial = location.hash.replace('#','');
if (GAME_REGISTRY.some(game => game.id === initial && game.enabled)) openGame(initial);
else renderHome();
