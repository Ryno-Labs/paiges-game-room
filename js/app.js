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
let deferredInstallPrompt = null;

// ADD NEW GAMES HERE. Each game gets its own module and card metadata.
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
    id: 'blockdrop',
    title: 'Tetris',
    subtitle: 'Classic falling blocks. Beat your high score.',
    art: './assets/blockdrop-card.jpg',
    module: './games/blockdrop.js',
    enabled: true
  },
  { id:'coming-1', title:'Next Game', subtitle:'Add anything Paige gets into next.', enabled:false },
  { id:'coming-2', title:'Next Game', subtitle:'One more empty slot ready to go.', enabled:false }
];

function escapeHtml(value='') {
  return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

function cleanupCurrent() {
  if (typeof currentCleanup === 'function') {
    try { currentCleanup(); } catch (e) { console.warn(e); }
  }
  currentCleanup = null;
  currentReplay = null;
}

function renderHome() {
  cleanupCurrent();
  history.replaceState(null, '', '#home');
  topbarTitle.textContent = "Paige's Game Room";
  backButton.classList.add('hidden');
  screen.innerHTML = `
    <section class="home-hero" aria-label="Paige's Game Room">
      <div class="home-hero-copy">
        <span class="section-kicker">PAIGE'S PRIVATE ARCADE</span>
        <p>Two games now. Zero ads forever. More games whenever you get bored.</p>
      </div>
    </section>
    <section class="home-section">
      <span class="section-kicker">PICK A GAME</span>
      <h1 class="section-title">What are we playing?</h1>
      <div class="game-grid">
        ${GAME_REGISTRY.map(game => game.enabled ? `
          <article class="game-card" role="button" tabindex="0" data-game="${escapeHtml(game.id)}" aria-label="Play ${escapeHtml(game.title)}">
            <img class="game-art" src="${game.art}" alt="" />
            <div class="game-card-body">
              <h3>${escapeHtml(game.title)}</h3>
              <p>${escapeHtml(game.subtitle)}</p>
              <span class="play-chip">Play →</span>
            </div>
          </article>
        ` : `
          <div class="placeholder-card">
            <div><strong>＋ More games</strong><br><small>${escapeHtml(game.subtitle)}</small></div>
          </div>
        `).join('')}
      </div>
    </section>
    <div class="home-note">Built for Paige. Everything saves on this device, works offline after the first load, and never shows an ad.</div>
  `;

  screen.querySelectorAll('[data-game]').forEach(card => {
    const open = () => openGame(card.dataset.game);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
  });
}

async function openGame(id) {
  const game = GAME_REGISTRY.find(g => g.id === id && g.enabled);
  if (!game) return;
  cleanupCurrent();
  history.replaceState(null, '', `#${id}`);
  topbarTitle.textContent = game.title;
  backButton.classList.remove('hidden');
  screen.innerHTML = '<div style="padding:40px;text-align:center;font-weight:900">Loading…</div>';
  try {
    const mod = await import(game.module);
    const api = {
      root: screen,
      toast,
      celebrate,
      goHome: renderHome,
      storage: {
        get(key, fallback=null) {
          try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
        },
        set(key, value) {
          try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
        },
        remove(key) { try { localStorage.removeItem(key); } catch {} }
      }
    };
    const result = await mod.mount(api);
    currentCleanup = result?.cleanup || null;
    currentReplay = result?.replay || null;
  } catch (err) {
    console.error(err);
    screen.innerHTML = `<div style="padding:24px"><h2>That game hit a snag.</h2><p>${escapeHtml(err.message || 'Unknown error')}</p><button class="button" id="goHomeError">Game room</button></div>`;
    document.querySelector('#goHomeError')?.addEventListener('click', renderHome);
  }
}

function celebrate({ title='You crushed it, Paige!', eyebrow='NICE WORK', message='Ryan, Link and Sketch approve.', stats=[] } = {}) {
  celebrationTitle.textContent = title;
  celebrationEyebrow.textContent = eyebrow;
  celebrationMessage.textContent = message;
  celebrationStats.innerHTML = stats.map(s => `<span>${escapeHtml(s)}</span>`).join('');
  celebration.classList.remove('hidden');
}

function closeCelebration() { celebration.classList.add('hidden'); }
celebrationAgain.addEventListener('click', () => { closeCelebration(); currentReplay?.(); });
celebrationHome.addEventListener('click', () => { closeCelebration(); renderHome(); });
backButton.addEventListener('click', renderHome);

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.title = 'Install Paige\'s Game Room';
});
installButton.addEventListener('click', async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
  } else {
    toast('On iPhone: Share → Add to Home Screen');
  }
});

window.addEventListener('hashchange', () => {
  const id = location.hash.replace('#','');
  if (!id || id === 'home') renderHome();
  else if (GAME_REGISTRY.some(g => g.id === id && g.enabled)) openGame(id);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.warn));
}

const initial = location.hash.replace('#','');
if (GAME_REGISTRY.some(g => g.id === initial && g.enabled)) openGame(initial); else renderHome();
