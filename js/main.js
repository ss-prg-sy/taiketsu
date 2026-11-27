// 起動と操作：毎フレームの描画ループ・タップ/キー操作・ボタン

// スマホの細かい画面でもくっきり描く：画面のドットの細かさ（DPR）に合わせて内部の解像度を上げる
const DPR = Math.min(3, window.devicePixelRatio || 1);
cv.width = W * DPR;
cv.height = H * DPR;

function frame(now) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);   // 描くときは今までどおり 420×640 の座標で考える
  update(now);
  const wide = state === 'result' && play && now >= wideAt;
  if (wide) {
    drawWide(now);
  } else {
    // 対決の画面：奥から手前の順に描く
    drawField();
    drawFielders();
    drawRunners();
    drawPitcher(now);
    drawZone();
    drawTrail();
    drawHistory();
    drawWaitSpot();
    drawAimGuide();
    drawPitchedBall(now);
    drawBatter(now);
    drawFlight(now);
    drawHitFlash(now);
    drawVignette();
    drawCount();
  }
  drawBoard();
  drawMessage(now, wide);
  updateHint();
  requestAnimationFrame(frame);
}

// =====================================================
//  操作
// =====================================================

function canvasPoint(e) {
  const r = cv.getBoundingClientRect();
  const sx = (e.clientX - r.left) * W / r.width, sy = (e.clientY - r.top) * H / r.height;
  // 拡大している分を元に戻す
  return { x: sx, y: sy };
}

cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (state === 'aim' || state === 'guess') {
    const p = canvasPoint(e);
    const inside = Math.abs(p.x - HIT.x) <= AIM_W / 2 + 10 && Math.abs(p.y - HIT.y) <= AIM_H / 2 + 10;
    if (state === 'aim') { if (inside) chooseAim(p.x, p.y); }
    else startBatting(inside ? { x: p.x, y: p.y } : null);
    return;
  }
  humanSwing();
});
cv.addEventListener('pointermove', e => { hover = canvasPoint(e); });
cv.addEventListener('pointerleave', () => { hover = null; });
document.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); humanSwing(); }
});

// 球種ボタン
const pb = document.getElementById('pitchButtons');
PITCHES.forEach((p, i) => {
  const b = document.createElement('button');
  b.textContent = p.short;
  if (i === 0) b.classList.add('sel');
  b.addEventListener('click', () => {
    selPitch = i;
    [...pb.children].forEach((c, k) => c.classList.toggle('sel', k === i));
  });
  pb.appendChild(b);
});

document.getElementById('btn1p').addEventListener('click', () => startGame(1));
document.getElementById('btn2p').addEventListener('click', () => startGame(2));
document.getElementById('introBtn').addEventListener('click', () => { show('intro', false); nextPitch(); });
document.getElementById('handoffBtn').addEventListener('click', () => { show('handoff', false); openGuess(); });

// 狙い球ボタン
const gb = document.getElementById('guessButtons');
['狙わない', ...PITCHES.map(p => p.short)].forEach((label, k) => {
  const b = document.createElement('button');
  b.textContent = label;
  if (k > 0) b.style.borderBottomColor = PCOLORS[k - 1];
  b.addEventListener('click', () => selectGuess(k - 1));
  gb.appendChild(b);
});
selectGuess(-1);
// 球種ボタンにも色の目印
[...pb.children].forEach((b, i) => { b.style.borderBottomColor = PCOLORS[i]; });
document.getElementById('retryBtn').addEventListener('click', () => startGame(mode));
document.getElementById('menuBtn').addEventListener('click', () => { show('end', false); state = 'menu'; show('menu', true); });

requestAnimationFrame(frame);
