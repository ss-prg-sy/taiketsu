// ボールの動きと、毎フレームの時間の進み

// =====================================================
//  ボールの動き
// =====================================================

function ballPos(p) {
  const q = Math.min(p, 1);
  const s = 2 / (20 - 18 * q);        // 遠くは小さく、近くは大きく
  // ねらったコースに向かってまっすぐ進む線
  const hzx = (REL.x - aim.x * 0.1) / 0.9;
  const hzy = (REL.y - aim.y * 0.1) / 0.9;
  let x = hzx + (aim.x - hzx) * s;
  let y = hzy + (aim.y - hzy) * s;
  // 変化球：最初は曲がる分だけ外れた方向に見えて、手元で狙いのコースに曲がってくる
  const bend = Math.pow(q, pitch.late);
  x -= pitch.bx * 3 * (1 - bend) * s;
  y -= pitch.by * 3 * (1 - bend) * s;
  y -= pitch.rise * Math.sin(Math.PI * q) * (1 - q);   // カーブは一度浮く
  let r = Math.max(2, 13 * s);
  if (p > 1) { y += (p - 1) * 700; r += (p - 1) * 50; }
  return { x, y, r, s, hzy };
}

function startFlight(from, diff, kind) {
  let tx = Math.max(20, Math.min(W - 20, 210 - diff * 2.4)), ty, arc, dur;
  const ofi = diff < -25 ? 0 : diff > 25 ? 2 : 1;
  const ifi = diff < -40 ? 0 : diff < 0 ? 1 : diff < 40 ? 2 : 3;
  switch (kind) {
    case 'HR':   ty = rand(125, 170); arc = 260; dur = 1400; break;
    case '3B':
    case '2B':   tx = ofi === 0 ? rand(20, 60) : ofi === 2 ? rand(360, 400) : rand(140, 280); ty = rand(220, 240); arc = 130; dur = 1100; break;
    case '1B':   ty = rand(268, 315); arc = 50; dur = 800; break;
    case 'FLY':  [tx, ty] = OF[ofi]; ty -= 14; arc = 230; dur = 1400; break;
    case 'POP':  tx = rand(170, 250); ty = rand(390, 430); arc = 320; dur = 1400; break;
    case 'GO':   [tx, ty] = IF[ifi]; ty -= 4; arc = 6; dur = 600; break;
    default:     tx = diff < 0 ? -40 : W + 40; ty = rand(150, 260); arc = 200; dur = 900; break;
  }
  flight = { x0: from.x, y0: from.y, r0: from.r, tx, ty, arc, dur, t0: performance.now(), kind };
}

// =====================================================
//  毎フレームの更新
// =====================================================

function update(now) {
  if (state === 'windup' && now - phaseStart > WINDUP) {
    state = 'pitch';
    phaseStart += WINDUP;
  }
  if ((state === 'windup' || state === 'pitch') && cpuSwingAt !== null && now >= cpuSwingAt) {
    const t = cpuSwingAt;
    cpuSwingAt = null;
    doSwing(t);
  }
  if (state === 'pitch') {
    const p = (now - phaseStart) / travel;
    if (p > 1 + 170 / travel) {
      if (swingAt !== null) addStrike(true);
      else if (inZone) addStrike(false);
      else addBall();
    }
  }
  if (state === 'result' && now - phaseStart > resultDur) finishPlay();
}
