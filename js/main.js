// 起動と操作：毎フレームの描画ループ・タップ/キー操作・ボタン

// スマホの細かい画面でもくっきり描く：画面のドットの細かさ（DPR）に合わせて内部の解像度を上げる
const DPR = Math.min(3, window.devicePixelRatio || 1);
cv.width = W * DPR;
cv.height = H * DPR;

resize3();

function frame(now) {
  update(now);
  render3D(now);                            // 下の画面：3D の球場と選手
  // 上の画面：スコアボードや文字（420×640 の座標で描く。何も描かないところは透明）
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const wide = state === 'result' && play && now >= wideAt;
  if (wide) {
    if (play.kind === 'HR') drawHomeRunShow((now - wideAt) / 1000);
  } else if (state !== 'menu') {
    drawZoneLabel();
    drawTrail();
    drawHistory();
    drawWaitSpot();
    drawAimGuide();
    drawHitFlash(now);
    drawHandTags();
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
  return { x: sx, y: sy };
}

// コース選び：指で触れてなぞる → 離したところで決定（触れた瞬間には決まらない）
// 指で印が隠れないように、指で触っているときは印を指の少し上に出す
const FINGER_OFFSET = 45;
function setDrag(e) {
  const f = canvasPoint(e);
  const off = e.pointerType === 'mouse' ? 0 : FINGER_OFFSET;
  const z = screenToZonePx(f.x, f.y - off);           // 画面の点 → 3D のゾーンの上のどこか
  dragAim = { x: z.x, y: z.y, sx: f.x, sy: f.y - off, fx: f.x, fy: f.y };
}
function insideAimArea(p) {
  return Math.abs(p.x - HIT.x) <= AIM_W / 2 + 10 && Math.abs(p.y - HIT.y) <= AIM_H / 2 + 10;
}

cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (state === 'aim' || state === 'guess') {
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}   // 指が画面の外に出ても追いかける
    setDrag(e);
    return;
  }
  humanSwing();     // スイングは触れた瞬間（タイミングがずれないように）
});
cv.addEventListener('pointermove', e => {
  hover = canvasPoint(e);
  if (dragAim) setDrag(e);
});
cv.addEventListener('pointerup', e => {
  if (!dragAim) return;
  const p = { x: dragAim.x, y: dragAim.y };
  dragAim = null;
  const inside = insideAimArea(p);
  if (state === 'aim') { if (inside) chooseAim(p.x, p.y); }          // 枠の外で離したら取り消し
  else if (state === 'guess') startBatting(inside ? p : null);        // 枠の外＝コースは張らない
});
cv.addEventListener('pointercancel', () => { dragAim = null; });
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
    document.getElementById('pitchDesc').textContent = PITCHES[i].desc;
  });
  pb.appendChild(b);
});

document.getElementById('btn1p').addEventListener('click', () => startGame(1));
document.getElementById('btn2p').addEventListener('click', () => startGame(2));
document.getElementById('creditBtn').addEventListener('click', () => { show('menu', false); show('credits', true); });
document.getElementById('creditClose').addEventListener('click', () => { show('credits', false); show('menu', true); });
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
document.getElementById('pitchDesc').textContent = PITCHES[0].desc;
// 球種ボタンにも色の目印
[...pb.children].forEach((b, i) => { /** @type {HTMLElement} */ (b).style.borderBottomColor = PCOLORS[i]; });
document.getElementById('retryBtn').addEventListener('click', () => startGame(mode));
document.getElementById('menuBtn').addEventListener('click', () => { show('end', false); state = 'menu'; show('menu', true); });

// 右投げ・左投げ（メニュー）と、右打ち・左打ち（打者パネル）
document.querySelectorAll('.handRow button').forEach(el => { const b = /** @type {HTMLButtonElement} */ (el); b.addEventListener('click', () => {
  const t = +b.dataset.team;
  pitcherHand[t] = b.dataset.hand;
  document.querySelectorAll(`.handRow button[data-team="${t}"]`).forEach(x => x.classList.toggle('sel', x === b));
}); });
document.getElementById('handBtn').addEventListener('click', toggleBatterHand);

requestAnimationFrame(frame);
