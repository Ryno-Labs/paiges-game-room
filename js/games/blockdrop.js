const COLS=10, ROWS=20;
const COLORS={
  I:'#52c7dd', O:'#f0cf53', T:'#9a6fd2', S:'#63bc76', Z:'#e65e62', J:'#5b79d7', L:'#e68c4d'
};
const SHAPES={
  I:[[1,1,1,1]],
  O:[[1,1],[1,1]],
  T:[[0,1,0],[1,1,1]],
  S:[[0,1,1],[1,1,0]],
  Z:[[1,1,0],[0,1,1]],
  J:[[1,0,0],[1,1,1]],
  L:[[0,0,1],[1,1,1]]
};
const TYPES=Object.keys(SHAPES);
const clone=m=>m.map(r=>[...r]);
const emptyBoard=()=>Array.from({length:ROWS},()=>Array(COLS).fill(null));
const randomType=()=>TYPES[Math.floor(Math.random()*TYPES.length)];
function rotate(matrix){ return matrix[0].map((_,i)=>matrix.map(row=>row[i]).reverse()); }

export async function mount({root, toast, celebrate, storage}) {
  let board=emptyBoard();
  let current=null, nextType=randomType();
  let score=0, lines=0, level=1;
  let running=true, gameOver=false, dropAcc=0, last=performance.now(), raf=0;
  let high=storage.get('paige.blockdrop.high',0) || 0;

  root.innerHTML=`
    <section>
      <div class="game-header">
        <h1>Tetris</h1>
        <div class="game-meta"><span class="stat-pill" id="bdHigh">High ${high}</span><span class="stat-pill" id="bdScore">Score 0</span></div>
      </div>
      <div class="toolbar"><button class="button small" id="bdNew">New game</button><button class="button small" id="bdPause">Pause</button></div>
      <div class="blockdrop-wrap">
        <div class="blockdrop-stage">
          <div class="blockdrop-layout">
            <canvas id="blockCanvas" width="300" height="600" aria-label="Falling block game board"></canvas>
            <div class="block-side">
              <div class="side-box"><span class="label">NEXT</span><canvas id="nextCanvas" width="100" height="100"></canvas></div>
              <div class="side-box"><span class="label">LINES</span><strong id="bdLines">0</strong></div>
              <div class="side-box"><span class="label">LEVEL</span><strong id="bdLevel">1</strong></div>
            </div>
          </div>
          <div class="block-controls">
            <button class="control-btn" data-action="left" aria-label="Move left">←</button>
            <button class="control-btn" data-action="rotate" aria-label="Rotate">↻</button>
            <button class="control-btn" data-action="right" aria-label="Move right">→</button>
            <button class="control-btn" data-action="down" aria-label="Move down">↓</button>
            <button class="control-btn" data-action="drop" aria-label="Hard drop">⇣</button>
          </div>
          <p class="block-tip">Keyboard works too: arrows to move, ↑ to rotate, space to drop. On phone, use the big controls.</p>
        </div>
      </div>
    </section>`;

  const canvas=root.querySelector('#blockCanvas'), ctx=canvas.getContext('2d');
  const nextCanvas=root.querySelector('#nextCanvas'), nctx=nextCanvas.getContext('2d');
  const scoreEl=root.querySelector('#bdScore'), highEl=root.querySelector('#bdHigh'), linesEl=root.querySelector('#bdLines'), levelEl=root.querySelector('#bdLevel');
  const pauseBtn=root.querySelector('#bdPause');
  const cell=canvas.width/COLS;

  function spawn(){
    const type=nextType; nextType=randomType();
    current={type, matrix:clone(SHAPES[type]), x:Math.floor((COLS-SHAPES[type][0].length)/2), y:-1};
    drawNext();
    if (collides(current.matrix,current.x,current.y)) finishGame();
  }
  function collides(matrix,x,y){
    for(let r=0;r<matrix.length;r++) for(let c=0;c<matrix[r].length;c++) if(matrix[r][c]){
      const bx=x+c, by=y+r;
      if(bx<0||bx>=COLS||by>=ROWS) return true;
      if(by>=0&&board[by][bx]) return true;
    }
    return false;
  }
  function merge(){
    current.matrix.forEach((row,r)=>row.forEach((v,c)=>{ if(v&&current.y+r>=0) board[current.y+r][current.x+c]=current.type; }));
  }
  function clearLines(){
    let cleared=0;
    for(let y=ROWS-1;y>=0;y--){
      if(board[y].every(Boolean)){ board.splice(y,1); board.unshift(Array(COLS).fill(null)); cleared++; y++; }
    }
    if(cleared){
      lines+=cleared; level=1+Math.floor(lines/10);
      score += [0,100,300,500,800][cleared]*level;
      updateStats();
    }
  }
  function softDrop(){
    if(!running||gameOver) return;
    if(!collides(current.matrix,current.x,current.y+1)){ current.y++; score+=1; updateStats(); }
    else lockPiece();
  }
  function gravityDrop(){
    if(!running||gameOver) return;
    if(!collides(current.matrix,current.x,current.y+1)) current.y++;
    else lockPiece();
  }
  function hardDrop(){
    if(!running||gameOver) return;
    let n=0;
    while(!collides(current.matrix,current.x,current.y+1)){ current.y++; n++; }
    score += n*2; lockPiece(); updateStats();
  }
  function move(dx){ if(running&&!gameOver&&!collides(current.matrix,current.x+dx,current.y)) current.x+=dx; }
  function rotatePiece(){
    if(!running||gameOver) return;
    const rot=rotate(current.matrix);
    for(const kick of [0,-1,1,-2,2]){ if(!collides(rot,current.x+kick,current.y)){ current.matrix=rot; current.x+=kick; return; } }
  }
  function lockPiece(){ merge(); clearLines(); spawn(); }
  function updateStats(){ scoreEl.textContent=`Score ${score}`; linesEl.textContent=lines; levelEl.textContent=level; highEl.textContent=`High ${Math.max(high,score)}`; }
  function finishGame(){
    gameOver=true; running=false;
    const oldHigh=high;
    if(score>high){ high=score; storage.set('paige.blockdrop.high',high); }
    updateStats(); draw();
    if(score>oldHigh && score>0){
      celebrate({eyebrow:'NEW HIGH SCORE',title:'You crushed it, Paige!',message:'Ryan, Link and Sketch are officially impressed.',stats:[`${score} points`,`${lines} lines`,`Level ${level}`]});
    } else toast(`Game over. Score: ${score}`);
  }
  function reset(){
    board=emptyBoard(); score=0; lines=0; level=1; gameOver=false; running=true; nextType=randomType(); updateStats(); spawn(); pauseBtn.textContent='Pause'; last=performance.now(); dropAcc=0;
  }
  function togglePause(){ if(gameOver) return; running=!running; pauseBtn.textContent=running?'Pause':'Resume'; if(running) last=performance.now(); }

  function drawCell(context,x,y,color,size){
    context.fillStyle=color; context.fillRect(x*size+1,y*size+1,size-2,size-2);
    context.fillStyle='rgba(255,255,255,.20)'; context.fillRect(x*size+2,y*size+2,size-4,4);
  }
  function draw(){
    ctx.fillStyle='#121522'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle='rgba(255,255,255,.04)'; ctx.lineWidth=1;
    for(let x=0;x<=COLS;x++){ ctx.beginPath(); ctx.moveTo(x*cell,0);ctx.lineTo(x*cell,canvas.height);ctx.stroke(); }
    for(let y=0;y<=ROWS;y++){ ctx.beginPath();ctx.moveTo(0,y*cell);ctx.lineTo(canvas.width,y*cell);ctx.stroke(); }
    board.forEach((row,y)=>row.forEach((type,x)=>{ if(type) drawCell(ctx,x,y,COLORS[type],cell); }));
    if(current) current.matrix.forEach((row,r)=>row.forEach((v,c)=>{ if(v&&current.y+r>=0) drawCell(ctx,current.x+c,current.y+r,COLORS[current.type],cell); }));
    if(!running&&!gameOver){ ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='white';ctx.textAlign='center';ctx.font='bold 28px system-ui';ctx.fillText('PAUSED',canvas.width/2,canvas.height/2); }
    if(gameOver){ ctx.fillStyle='rgba(0,0,0,.64)';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='white';ctx.textAlign='center';ctx.font='bold 26px system-ui';ctx.fillText('GAME OVER',canvas.width/2,canvas.height/2-8);ctx.font='bold 16px system-ui';ctx.fillText('New game to go again',canvas.width/2,canvas.height/2+24); }
  }
  function drawNext(){
    nctx.fillStyle='#121522';nctx.fillRect(0,0,100,100);
    const m=SHAPES[nextType], size=Math.min(20,80/Math.max(m.length,m[0].length));
    const ox=(100-m[0].length*size)/2, oy=(100-m.length*size)/2;
    m.forEach((row,r)=>row.forEach((v,c)=>{ if(v){ nctx.fillStyle=COLORS[nextType];nctx.fillRect(ox+c*size+1,oy+r*size+1,size-2,size-2); } }));
  }
  function loop(now){
    const dt=now-last; last=now;
    if(running&&!gameOver){
      dropAcc+=dt;
      const interval=Math.max(110,800-(level-1)*60);
      if(dropAcc>=interval){ gravityDrop();dropAcc=0; }
    }
    draw(); raf=requestAnimationFrame(loop);
  }
  function action(name){
    ({left:()=>move(-1),right:()=>move(1),rotate:rotatePiece,down:softDrop,drop:hardDrop}[name]||(()=>{}))();
  }
  function keyHandler(e){
    const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rotate',ArrowDown:'down',' ':'drop'};
    if(map[e.key]){ e.preventDefault(); action(map[e.key]); }
    if(e.key==='p'||e.key==='P') togglePause();
  }

  root.querySelectorAll('[data-action]').forEach(btn=>{
    let repeat;
    const start=e=>{ e.preventDefault(); const a=btn.dataset.action; action(a); if(['left','right','down'].includes(a)) repeat=setInterval(()=>action(a),110); };
    const end=()=>clearInterval(repeat);
    btn.addEventListener('pointerdown',start); btn.addEventListener('pointerup',end); btn.addEventListener('pointercancel',end); btn.addEventListener('pointerleave',end);
  });
  root.querySelector('#bdNew').addEventListener('click',reset);
  pauseBtn.addEventListener('click',togglePause);
  window.addEventListener('keydown',keyHandler,{passive:false});
  reset(); raf=requestAnimationFrame(loop);

  return {
    cleanup(){ cancelAnimationFrame(raf); window.removeEventListener('keydown',keyHandler); },
    replay(){ reset(); }
  };
}
