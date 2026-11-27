// 起動と操作：毎フレームの描画ループ・タップ/キー操作・ボタン

function frame(now) {
  update(now);
  const wide = state === 'result' && play && now >= wideAt;
  if (wide) {
    drawWide(now);
  } else {
    // 対決中はピッチャー・バッター・ゾーンを大きく映す（下の真ん中を中心に拡大）
    ctx.save();
    ctx.translate(210, ZOOM_Y); ctx.scale(ZOOM, ZOOM); ctx.translate(-210, -ZOOM_Y);
    drawField();
    drawFielders();
    drawRunners();
    drawPitcher(now);
    drawZone();
    drawHistory();
    drawWaitSpot();
    drawAimGuide();
    drawPitchedBall(now);
    drawFlight(now);
    drawBatter(now);
    ctx.restore();
    drawVignette();
    drawCount();
  }
  ctx.save(); ctx.translate(0, -28); drawBoard(); ctx.restore();   // スコアボードは上に詰める
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
  return { x: (sx - 210) / ZOOM + 210, y: (sy - ZOOM_Y) / ZOOM + ZOOM_Y };
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
