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
    subtitle: 'Classic, Challenge, Vegas and Paige’s Bankroll.',
    art: './assets/solitaire-card.jpg',
    module: './games/solitaire.js',
    enabled: true
  },
  {
    id: 'blocks',
    title: "Paige's Blocks",
    subtitle: '720 levels across 24 calm chapters, plus Endless play.',
    artType: 'blocks',
    module: './games/blocks.js',
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
            ${game.artType === 'blocks' ? `
              <span class="game-art blocks-home-art" aria-hidden="true">
                <span class="mini-blocks"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
                <strong>BLOCKS</strong>
                <small>Journey · Endless</small>
              </span>` : `<img class="game-art" src="${game.art}" alt="" draggable="false" />`}
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

  // If an update finished downloading during a game, this is the safe moment
  // to activate it. Paige never gets kicked out of active gameplay.
  applyPendingServiceWorkerUpdate();
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

function celebrate({ title = 'You crushed it, Paige!', eyebrow = 'NICE WORK', message = 'Ryan, Link and Sketch approve.', stats = [], primaryLabel = 'Play again', secondaryLabel = 'Game room' } = {}) {
  celebrationTitle.textContent = title;
  celebrationEyebrow.textContent = eyebrow;
  celebrationMessage.textContent = message;
  celebrationStats.innerHTML = stats.map(item => `<span>${escapeHtml(item)}</span>`).join('');
  celebrationAgain.textContent = primaryLabel;
  celebrationHome.textContent = secondaryLabel;
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

// Service-worker updates are intentionally game-safe on iPhone.
// A new version may download while Paige is playing, but it will not take
// control (or reload the PWA) until she is back on the Game Room home screen.
let serviceWorkerRegistration = null;
let pendingServiceWorker = null;
let updateReloadArmed = false;
let updateCheckInFlight = false;

function canApplyServiceWorkerUpdate() {
  return currentGameId === null;
}

function applyPendingServiceWorkerUpdate() {
  if (!pendingServiceWorker || !canApplyServiceWorkerUpdate() || updateReloadArmed) return;
  updateReloadArmed = true;
  pendingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
}

function queueServiceWorkerUpdate(worker) {
  if (!worker) return;
  pendingServiceWorker = worker;
  applyPendingServiceWorkerUpdate();
}

async function checkForServiceWorkerUpdate() {
  if (!serviceWorkerRegistration || updateCheckInFlight || !navigator.onLine) return;
  updateCheckInFlight = true;
  try {
    await serviceWorkerRegistration.update();
  } catch (error) {
    // Offline/transient update failures should never affect gameplay.
    console.debug('Service worker update check skipped:', error);
  } finally {
    updateCheckInFlight = false;
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!updateReloadArmed) return;
    // The new worker only reaches this point from the home screen. Reload once
    // so the newest app shell/code is used immediately.
    updateReloadArmed = false;
    location.reload();
  });

  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
    .then(registration => {
      serviceWorkerRegistration = registration;

      // A worker may already be waiting from an earlier launch.
      if (registration.waiting && navigator.serviceWorker.controller) {
        queueServiceWorkerUpdate(registration.waiting);
      }

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            queueServiceWorkerUpdate(worker);
          }
        });
      });

      checkForServiceWorkerUpdate();
    })
    .catch(error => console.warn('Service worker:', error));

  // iOS PWAs can stay suspended for a long time. Check when Paige returns,
  // but never activate an update in the middle of Solitaire or Blocks.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForServiceWorkerUpdate();
  });
  window.addEventListener('pageshow', checkForServiceWorkerUpdate);
  window.addEventListener('online', checkForServiceWorkerUpdate);
}

const initial = location.hash.replace('#','');
if (GAME_REGISTRY.some(game => game.id === initial && game.enabled)) openGame(initial);
else renderHome();
