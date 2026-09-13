const COLS = 10;
const ROWS = 20;
const BOARD_W = 300;
const BOARD_H = 600;
const NEXT_W = 100;
const NEXT_H = 100;
const LOCK_DELAY = 460;
const STATE_KEY = 'paige.tetris.state.v1';
const HIGH_KEY = 'paige.tetris.high';
const OLD_HIGH_KEY = 'paige.blockdrop.high';

const COLORS = {
  I: '#52c7dd', O: '#f0cf53', T: '#9a6fd2', S: '#63bc76',
  Z: '#e65e62', J: '#5b79d7', L: '#e68c4d'
};
const SHAPES = {
  I: [[1,1,1,1]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1]],
  S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]]
};
const TYPES = Object.keys(SHAPES);

const cloneMatrix = matrix => matrix.map(row => [...row]);
const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
function rotate(matrix) { return matrix[0].map((_, index) => matrix.map(row => row[index]).reverse()); }
function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function validBoard(board) {
  return Array.isArray(board) && board.length === ROWS && board.every(row =>
    Array.isArray(row) && row.length === COLS && row.every(cell => cell === null || TYPES.includes(cell))
  );
}

function validPiece(piece) {
  return Boolean(
    piece && TYPES.includes(piece.type) && Array.isArray(piece.matrix) && piece.matrix.length &&
    piece.matrix.every(row => Array.isArray(row) && row.length && row.every(cell => cell === 0 || cell === 1)) &&
    Number.isInteger(piece.x) && Number.isInteger(piece.y)
  );
}

export async function mount({ root, toast, celebrate, storage }) {
  let board = emptyBoard();
  let current = null;
  let nextType = null;
  let bag = [];
  let score = 0;
  let lines = 0;
  let level = 1;
  let running = true;
  let gameOver = false;
  let dropAcc = 0;
  let groundedAt = null;
  let last = performance.now();
  let raf = 0;
  let newConfirmAt = 0;
  let gesture = null;
  let repeatTimer = null;
  let repeatDelay = null;
  let dirty = true;
  const storedHigh = storage.get(HIGH_KEY, null);
  const legacyHigh = Number(storage.get(OLD_HIGH_KEY, 0)) || 0;
  let high = Math.max(0, Number(storedHigh ?? legacyHigh) || 0);
  if (storedHigh == null && legacyHigh > 0) {
    storage.set(HIGH_KEY, legacyHigh);
    storage.remove(OLD_HIGH_KEY);
  }

  root.innerHTML = `
    <section class="game-screen tetris-screen">
      <div class="game-toolbar">
        <div class="game-meta">
          <span class="stat-pill" id="bdHigh">Best ${high}</span>
          <span class="stat-pill" id="bdScore">Score 0</span>
        </div>
        <div class="toolbar-actions">
          <button class="button small" id="bdPause" type="button">Pause</button>
          <button class="button small" id="bdNew" type="button">New</button>
        </div>
      </div>
      <div class="blockdrop-wrap">
        <div class="blockdrop-stage">
          <div class="blockdrop-layout">
            <canvas id="blockCanvas" aria-label="Tetris game board"></canvas>
            <div class="block-side">
              <div class="side-box"><span class="label">NEXT</span><canvas id="nextCanvas" aria-label="Next piece"></canvas></div>
              <div class="side-box"><span class="label">LINES</span><strong id="bdLines">0</strong></div>
              <div class="side-box"><span class="label">LEVEL</span><strong id="bdLevel">1</strong></div>
            </div>
          </div>
          <div class="block-controls" aria-label="Tetris controls">
            <button class="control-btn" data-action="left" type="button" aria-label="Move left">←</button>
            <button class="control-btn" data-action="rotate" type="button" aria-label="Rotate piece">↻</button>
            <button class="control-btn" data-action="right" type="button" aria-label="Move right">→</button>
            <button class="control-btn" data-action="down" type="button" aria-label="Move down">↓</button>
            <button class="control-btn" data-action="drop" type="button" aria-label="Drop piece">⇣</button>
          </div>
          <p class="block-tip">Tap the board to rotate. Swipe sideways to move. Swipe down to drop fast.</p>
        </div>
      </div>
    </section>`;

  root.classList.add('tetris-active');

  const canvas = root.querySelector('#blockCanvas');
  const nextCanvas = root.querySelector('#nextCanvas');
  const layout = root.querySelector('.blockdrop-layout');
  const sidePanel = root.querySelector('.block-side');
  const scoreEl = root.querySelector('#bdScore');
  const highEl = root.querySelector('#bdHigh');
  const linesEl = root.querySelector('#bdLines');
  const levelEl = root.querySelector('#bdLevel');
  const pauseBtn = root.querySelector('#bdPause');
  const newBtn = root.querySelector('#bdNew');

  // 2x is plenty sharp on an iPhone and avoids pushing a 900×1800 canvas every frame.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(BOARD_W * dpr);
  canvas.height = Math.round(BOARD_H * dpr);
  nextCanvas.width = Math.round(NEXT_W * dpr);
  nextCanvas.height = Math.round(NEXT_H * dpr);
  const ctx = canvas.getContext('2d');
  const nctx = nextCanvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cell = BOARD_W / COLS;
  let resizeRaf = 0;
  let resizeObserver = null;

  // Keep the board physically locked inside the remaining iPhone viewport.
  // This prevents the page from becoming scrollable as Safari/PWA chrome changes.
  function fitBoard() {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      const rect = layout.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const sideWidth = sidePanel.getBoundingClientRect().width || 62;
      const styles = getComputedStyle(layout);
      const gap = parseFloat(styles.columnGap || styles.gap) || 6;
      const widthByLayout = rect.width - sideWidth - gap;
      const widthByHeight = rect.height / 2;
      const cssWidth = Math.max(118, Math.floor(Math.min(widthByLayout, widthByHeight)));
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssWidth * 2}px`;
      dirty = true;
    });
  }

  function refillBag() { bag = shuffle([...TYPES]); }
  function takeType() {
    if (!bag.length) refillBag();
    return bag.pop();
  }

  function saveState() {
    if (gameOver || !current) {
      storage.remove(STATE_KEY);
      return;
    }
    storage.set(STATE_KEY, {
      version: 1,
      board,
      current,
      nextType,
      bag,
      score,
      lines,
      level
    });
  }

  function restoreState() {
    const saved = storage.get(STATE_KEY, null);
    if (!saved || saved.version !== 1 || !validBoard(saved.board) || !validPiece(saved.current) || !TYPES.includes(saved.nextType)) return false;
    board = saved.board;
    current = saved.current;
    nextType = saved.nextType;
    bag = Array.isArray(saved.bag) ? saved.bag.filter(type => TYPES.includes(type)) : [];
    score = Math.max(0, Number(saved.score) || 0);
    lines = Math.max(0, Number(saved.lines) || 0);
    level = Math.max(1, Number(saved.level) || 1);
    running = false;
    gameOver = false;
    groundedAt = null;
    if (collides(current.matrix, current.x, current.y)) return false;
    pauseBtn.textContent = 'Resume';
    updateStats();
    drawNext();
    return true;
  }

  function collides(matrix, x, y) {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (!matrix[row][col]) continue;
        const bx = x + col;
        const by = y + row;
        if (bx < 0 || bx >= COLS || by >= ROWS) return true;
        if (by >= 0 && board[by][bx]) return true;
      }
    }
    return false;
  }

  function spawn() {
    const type = nextType || takeType();
    nextType = takeType();
    current = {
      type,
      matrix: cloneMatrix(SHAPES[type]),
      x: Math.floor((COLS - SHAPES[type][0].length) / 2),
      y: -1
    };
    groundedAt = null;
    drawNext();
    if (collides(current.matrix, current.x, current.y)) finishGame();
  }

  function merge() {
    let toppedOut = false;
    current.matrix.forEach((row, r) => row.forEach((value, c) => {
      if (!value) return;
      const y = current.y + r;
      const x = current.x + c;
      if (y < 0) toppedOut = true;
      else board[y][x] = current.type;
    }));
    return toppedOut;
  }

  function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every(Boolean)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(null));
        cleared += 1;
        y += 1;
      }
    }
    if (!cleared) return;
    lines += cleared;
    level = 1 + Math.floor(lines / 10);
    score += [0, 100, 300, 500, 800][cleared] * level;
    updateStats();
  }

  function isGrounded() {
    return current && collides(current.matrix, current.x, current.y + 1);
  }

  function resetLockDelay(now = performance.now()) {
    groundedAt = isGrounded() ? now : null;
  }

  function gravityStep(now = performance.now()) {
    if (!running || gameOver || !current) return false;
    if (!collides(current.matrix, current.x, current.y + 1)) {
      current.y += 1;
      dirty = true;
      resetLockDelay(now);
      return true;
    }
    if (groundedAt == null) groundedAt = now;
    return false;
  }

  function softDrop() {
    if (!running || gameOver || !current) return;
    if (!collides(current.matrix, current.x, current.y + 1)) {
      current.y += 1;
      dirty = true;
      score += 1;
      updateStats();
      resetLockDelay();
    } else if (groundedAt == null) {
      groundedAt = performance.now();
    }
  }

  function hardDrop() {
    if (!running || gameOver || !current) return;
    let distance = 0;
    while (!collides(current.matrix, current.x, current.y + 1)) {
      current.y += 1;
      distance += 1;
    }
    score += distance * 2;
    dirty = true;
    updateStats();
    lockPiece();
  }

  function move(dx) {
    if (!running || gameOver || !current) return false;
    if (collides(current.matrix, current.x + dx, current.y)) return false;
    current.x += dx;
    dirty = true;
    resetLockDelay();
    return true;
  }

  function rotatePiece() {
    if (!running || gameOver || !current) return false;
    const rotated = rotate(current.matrix);
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!collides(rotated, current.x + kick, current.y)) {
        current.matrix = rotated;
        current.x += kick;
        dirty = true;
        resetLockDelay();
        return true;
      }
    }
    return false;
  }

  function lockPiece() {
    if (!current || gameOver) return;
    if (merge()) {
      finishGame();
      return;
    }
    clearLines();
    spawn();
    dirty = true;
    saveState();
  }

  function updateStats() {
    scoreEl.textContent = `Score ${score}`;
    linesEl.textContent = lines;
    levelEl.textContent = level;
    highEl.textContent = score > high ? `Best ${score} ★` : `Best ${high}`;
  }

  function finishGame() {
    if (gameOver) return;
    gameOver = true;
    running = false;
    groundedAt = null;
    const previousHigh = high;
    if (score > high) {
      high = score;
      storage.set(HIGH_KEY, high);
      storage.remove(OLD_HIGH_KEY);
    }
    storage.remove(STATE_KEY);
    pauseBtn.textContent = 'Pause';
    updateStats();
    dirty = true;
    draw();
    dirty = false;

    if (score > previousHigh && score > 0) {
      celebrate({
        eyebrow: 'NEW HIGH SCORE',
        title: 'You crushed it, Paige!',
        message: 'Ryan, Link and Sketch are officially impressed.',
        stats: [`${score} points`, `${lines} lines`, `Level ${level}`]
      });
    } else {
      toast(`Game over · ${score} points`);
    }
  }

  function startFresh() {
    board = emptyBoard();
    current = null;
    bag = [];
    nextType = takeType();
    score = 0;
    lines = 0;
    level = 1;
    gameOver = false;
    running = true;
    dropAcc = 0;
    groundedAt = null;
    newConfirmAt = 0;
    last = performance.now();
    pauseBtn.textContent = 'Pause';
    updateStats();
    spawn();
    dirty = true;
    saveState();
  }

  function requestNewGame() {
    const hasProgress = score > 0 || lines > 0 || board.some(row => row.some(Boolean));
    if (!hasProgress || gameOver) {
      startFresh();
      return;
    }
    const now = Date.now();
    if (now - newConfirmAt <= 2400) startFresh();
    else {
      newConfirmAt = now;
      toast('Tap New again to start over.');
    }
  }

  function togglePause() {
    if (gameOver) return;
    running = !running;
    groundedAt = null;
    pauseBtn.textContent = running ? 'Pause' : 'Resume';
    dirty = true;
    if (running) {
      last = performance.now();
      dropAcc = 0;
    } else {
      saveState();
    }
  }

  function drawCell(context, x, y, color, size, alpha = 1) {
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = color;
    context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    context.fillStyle = 'rgba(255,255,255,.20)';
    context.fillRect(x * size + 2, y * size + 2, size - 4, 4);
    context.restore();
  }

  function ghostY() {
    if (!current) return null;
    let y = current.y;
    while (!collides(current.matrix, current.x, y + 1)) y += 1;
    return y;
  }

  function draw() {
    ctx.fillStyle = '#121522';
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);
    ctx.strokeStyle = 'rgba(255,255,255,.045)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, BOARD_H); ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * cell); ctx.lineTo(BOARD_W, y * cell); ctx.stroke();
    }

    board.forEach((row, y) => row.forEach((type, x) => {
      if (type) drawCell(ctx, x, y, COLORS[type], cell);
    }));

    if (current) {
      const landing = ghostY();
      if (landing != null && landing !== current.y) {
        current.matrix.forEach((row, r) => row.forEach((value, c) => {
          if (value && landing + r >= 0) drawCell(ctx, current.x + c, landing + r, COLORS[current.type], cell, .22);
        }));
      }
      current.matrix.forEach((row, r) => row.forEach((value, c) => {
        if (value && current.y + r >= 0) drawCell(ctx, current.x + c, current.y + r, COLORS[current.type], cell);
      }));
    }

    if (!running && !gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,.62)';
      ctx.fillRect(0, 0, BOARD_W, BOARD_H);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '800 27px -apple-system, system-ui, sans-serif';
      ctx.fillText('PAUSED', BOARD_W / 2, BOARD_H / 2 - 4);
      ctx.font = '700 13px -apple-system, system-ui, sans-serif';
      ctx.fillText('Tap Resume when you’re ready', BOARD_W / 2, BOARD_H / 2 + 22);
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,.66)';
      ctx.fillRect(0, 0, BOARD_W, BOARD_H);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '800 25px -apple-system, system-ui, sans-serif';
      ctx.fillText('GAME OVER', BOARD_W / 2, BOARD_H / 2 - 8);
      ctx.font = '700 14px -apple-system, system-ui, sans-serif';
      ctx.fillText('Tap New to go again', BOARD_W / 2, BOARD_H / 2 + 22);
    }
  }

  function drawNext() {
    nctx.fillStyle = '#121522';
    nctx.fillRect(0, 0, NEXT_W, NEXT_H);
    if (!nextType) return;
    const matrix = SHAPES[nextType];
    const size = Math.min(20, 80 / Math.max(matrix.length, matrix[0].length));
    const ox = (NEXT_W - matrix[0].length * size) / 2;
    const oy = (NEXT_H - matrix.length * size) / 2;
    matrix.forEach((row, r) => row.forEach((value, c) => {
      if (!value) return;
      nctx.fillStyle = COLORS[nextType];
      nctx.fillRect(ox + c * size + 1, oy + r * size + 1, size - 2, size - 2);
      nctx.fillStyle = 'rgba(255,255,255,.18)';
      nctx.fillRect(ox + c * size + 2, oy + r * size + 2, size - 4, 3);
    }));
  }

  function loop(now) {
    const dt = Math.min(100, Math.max(0, now - last));
    last = now;
    if (running && !gameOver && current) {
      dropAcc += dt;
      const interval = Math.max(105, 790 - (level - 1) * 58);
      while (dropAcc >= interval && running && !gameOver) {
        gravityStep(now);
        dropAcc -= interval;
      }
      if (groundedAt != null && now - groundedAt >= LOCK_DELAY) lockPiece();
    }
    if (dirty) {
      draw();
      dirty = false;
    }
    raf = requestAnimationFrame(loop);
  }

  function action(name) {
    if (name === 'left') move(-1);
    else if (name === 'right') move(1);
    else if (name === 'rotate') rotatePiece();
    else if (name === 'down') softDrop();
    else if (name === 'drop') hardDrop();
  }

  function clearRepeat() {
    clearTimeout(repeatDelay);
    clearInterval(repeatTimer);
    repeatDelay = null;
    repeatTimer = null;
    root.querySelectorAll('.control-btn.pressed').forEach(button => button.classList.remove('pressed'));
  }

  function beginControl(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const name = button.dataset.action;
    button.classList.add('pressed');
    action(name);
    if (!['left', 'right', 'down'].includes(name)) return;
    repeatDelay = setTimeout(() => {
      repeatTimer = setInterval(() => action(name), name === 'down' ? 70 : 88);
    }, 260);
  }

  function onCanvasPointerDown(event) {
    if (!running || gameOver) return;
    event.preventDefault();
    canvas.setPointerCapture?.(event.pointerId);
    gesture = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      anchorX: event.clientX,
      anchorY: event.clientY,
      startTime: performance.now(),
      axis: null,
      moved: false
    };
  }

  function onCanvasPointerMove(event) {
    if (!gesture || event.pointerId !== gesture.id || !running || gameOver) return;
    event.preventDefault();

    const totalX = event.clientX - gesture.startX;
    const totalY = event.clientY - gesture.startY;
    const absX = Math.abs(totalX);
    const absY = Math.abs(totalY);

    // Lock a gesture to one axis so a slightly diagonal thumb does not make
    // the piece jitter sideways while Paige is trying to move it down.
    if (!gesture.axis && Math.hypot(totalX, totalY) >= 11) {
      if (absX > absY * 1.12) gesture.axis = 'x';
      else if (absY > absX * 1.12) gesture.axis = 'y';
      else return;
      gesture.moved = true;
    }

    if (!gesture.axis) return;
    const rect = canvas.getBoundingClientRect();
    const cellPx = rect.width / COLS;

    if (gesture.axis === 'x') {
      const step = Math.max(24, cellPx * .92);
      let dx = event.clientX - gesture.anchorX;
      while (Math.abs(dx) >= step) {
        move(dx > 0 ? 1 : -1);
        gesture.anchorX += dx > 0 ? step : -step;
        dx = event.clientX - gesture.anchorX;
      }
    } else if (gesture.axis === 'y') {
      const step = Math.max(21, cellPx * .82);
      let dy = event.clientY - gesture.anchorY;
      while (dy >= step) {
        softDrop();
        gesture.anchorY += step;
        dy = event.clientY - gesture.anchorY;
      }
    }
  }

  function onCanvasPointerUp(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    event.preventDefault();
    const totalX = event.clientX - gesture.startX;
    const totalY = event.clientY - gesture.startY;
    const distance = Math.hypot(totalX, totalY);
    const duration = Math.max(1, performance.now() - gesture.startTime);
    const axis = gesture.axis;
    gesture = null;
    if (!running || gameOver) return;

    // A true tap rotates. Dragging never accidentally rotates.
    if (!axis && distance < 11) {
      rotatePiece();
      return;
    }

    // Only a deliberate fast downward flick hard-drops. A normal downward
    // drag simply soft-drops row by row and stops exactly where the thumb stops.
    const velocityY = totalY / duration;
    if (axis === 'y' && totalY > 72 && velocityY > .42) hardDrop();
  }

  function onCanvasPointerCancel(event) {
    if (gesture?.id === event.pointerId) gesture = null;
  }

  function handleVisibility() {
    if (document.visibilityState === 'hidden') {
      if (running && !gameOver) {
        running = false;
        pauseBtn.textContent = 'Resume';
      }
      saveState();
    }
  }
  function handlePageHide() { saveState(); }

  root.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('pointerdown', beginControl);
  });
  document.addEventListener('pointerup', clearRepeat);
  document.addEventListener('pointercancel', clearRepeat);
  canvas.addEventListener('pointerdown', onCanvasPointerDown, { passive: false });
  canvas.addEventListener('pointermove', onCanvasPointerMove, { passive: false });
  canvas.addEventListener('pointerup', onCanvasPointerUp, { passive: false });
  canvas.addEventListener('pointercancel', onCanvasPointerCancel, { passive: false });
  newBtn.addEventListener('click', requestNewGame);
  pauseBtn.addEventListener('click', togglePause);
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('pagehide', handlePageHide);

  resizeObserver = new ResizeObserver(fitBoard);
  resizeObserver.observe(layout);
  window.addEventListener('resize', fitBoard, { passive: true });
  window.visualViewport?.addEventListener('resize', fitBoard, { passive: true });
  fitBoard();

  if (!restoreState()) startFresh();
  else toast('Game restored. Tap Resume.');
  last = performance.now();
  raf = requestAnimationFrame(loop);

  return {
    cleanup() {
      cancelAnimationFrame(raf);
      clearRepeat();
      saveState();
      document.removeEventListener('pointerup', clearRepeat);
      document.removeEventListener('pointercancel', clearRepeat);
      canvas.removeEventListener('pointerdown', onCanvasPointerDown);
      canvas.removeEventListener('pointermove', onCanvasPointerMove);
      canvas.removeEventListener('pointerup', onCanvasPointerUp);
      canvas.removeEventListener('pointercancel', onCanvasPointerCancel);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('resize', fitBoard);
      window.visualViewport?.removeEventListener('resize', fitBoard);
      resizeObserver?.disconnect();
      cancelAnimationFrame(resizeRaf);
      root.classList.remove('tetris-active');
    },
    replay() { startFresh(); }
  };
}
