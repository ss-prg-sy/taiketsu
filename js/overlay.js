// 3D の画面の上に重ねて描くもの：配球の点・待ちコースの輪・ねらいの印・球の通り道・カウント・名札・打った瞬間の光・花火
//   ゾーンの上の点は、3D のゾーンの位置を画面に映して描く

// 決まった並びの乱数（毎回同じ絵になるように）
function seeded(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
function lerp2(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }

// 打ったあとのボールの位置（メートル。X＝右が＋、Y＝センター方向、Z＝高さ）
function playBall(tw) {
  let t = tw;
  for (const s of play.segs) {
    if (t <= s.dur) {
      const k = t / s.dur;
      return {
        X: s.from[0] + (s.to[0] - s.from[0]) * k,
        Y: s.from[1] + (s.to[1] - s.from[1]) * k,
        Z: s.h * 4 * k * (1 - k) + s.z0 * (1 - k),
      };
    }
    t -= s.dur;
  }
  const last = play.segs[play.segs.length - 1];
  return { X: last.to[0], Y: last.to[1], Z: 0 };
}

// 小さい名札（右投げ・左打ちなど）
function tag(text, x, y) {
  ctx.font = 'bold 10px system-ui, sans-serif';
  const w = ctx.measureText(text).width + 10;
  ctx.fillStyle = 'rgba(22,26,54,.8)';
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - 8, w, 16, 8); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 0.5);
}

// つやのある黒いパネル（スコアボード・カウント表示）
function glossPanel(x, y, w, h, rad) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#1d2448'); g.addColorStop(0.5, '#121735'); g.addColorStop(1, '#0b0f26');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, rad); ctx.fill();
  ctx.restore();
  const s = ctx.createLinearGradient(0, y, 0, y + h * 0.5);
  s.addColorStop(0, 'rgba(255,255,255,.12)'); s.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = s;
  ctx.beginPath(); ctx.roundRect(x + 2, y + 2, w - 4, h * 0.5, rad - 2); ctx.fill();
  ctx.save();
  ctx.shadowColor = 'rgba(140,170,255,.8)'; ctx.shadowBlur = 6;
  ctx.strokeStyle = '#9fb3f2'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, rad); ctx.stroke();
  ctx.restore();
}

// ボールゾーンの画面の上での位置と大きさ
function zoneScreenBox() {
  const a = zonePxToScreen(HIT.x - AIM_W / 2, HIT.y - AIM_H / 2), b = zonePxToScreen(HIT.x + AIM_W / 2, HIT.y + AIM_H / 2);
  return { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y) };
}
// ゾーンの上の長さ（ゲームの座標）→ 画面の上の長さ
function zoneScale() { return (zoneScreenBox().x1 - zoneScreenBox().x0) / AIM_W; }

// 「ボールゾーン」の文字
function drawZoneLabel() {
  if (state === 'menu') return;
  const z = zoneScreenBox();
  ctx.save();
  ctx.shadowColor = 'rgba(80,255,235,.9)'; ctx.shadowBlur = 10;
  ctx.fillStyle = '#7ff7ea';
  ctx.font = '900 13px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('ボールゾーン', (z.x0 + z.x1) / 2, z.y0 - 4);
  ctx.restore();
}

// 右（左打ちのときは左）のカウント表示：ゾーンの横に出す
function drawCount() {
  if (state === 'menu') return;
  const z = zoneScreenBox();
  const w = 86, h = 72;
  const x = batterHand === 'L' ? Math.max(6, z.x0 - w - 14) : Math.min(W - w - 6, z.x1 + 14);
  const y = (z.y0 + z.y1) / 2 - h / 2;
  glossPanel(x, y, w, h, 10);
  countRows().forEach(({ label, n, max, col }, i) => {
    const ry = y + 14 + i * 22;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 10, ry + 1);
    for (let k = 0; k < max; k++) {
      ctx.fillStyle = k < n ? col : '#3a4066';
      ctx.beginPath(); ctx.arc(x + 39 + k * 17, ry, 6.5, 0, Math.PI * 2); ctx.fill();
    }
  });
}

// 投手・打者の名札（右投げ・左打ちなど）
function drawHandTags() {
  // 投手の名札は、投げていないときだけ。ボールが出てくる腕とは反対（グラブ側）の横に出す
  if (state !== 'windup' && state !== 'pitch' && !(state === 'result' && !play)) {
    const p = toScreen(pitcherToWorld([-0.9, 1.0, 0]));
    tag(handName(pitHand(), '投げ'), p.x, p.y);
  }
  const b = toScreen(batterToWorld([0, 0, 0]));
  tag(handName(batterHand, '打ち'), Math.max(30, Math.min(W - 30, b.x)), Math.min(H - 14, b.y + 14));
}

// この打席の配球（球種ごとの色の点＋何球目か）
function drawHistory() {
  pitchLog.forEach((h, i) => {
    if (!h.done) return;
    const s = zonePxToScreen(h.x, h.y);
    const last = i === pitchLog.length - 1;
    ctx.fillStyle = PCOLORS[h.pi];
    ctx.globalAlpha = last ? 1 : 0.8;
    ctx.beginPath(); ctx.arc(s.x, s.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = last ? '#11152e' : 'rgba(17,21,46,.6)'; ctx.lineWidth = last ? 2.5 : 1.2;
    ctx.stroke();
    ctx.fillStyle = '#11152e';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), s.x, s.y + 0.5);
  });
}

// 直前の投球の通り道（3D の通り道を画面に映して点を並べる）
function drawTrail() {
  if (!lastTrail || (state !== 'result' && state !== 'aim' && state !== 'guess') || play) return;
  ctx.fillStyle = lastTrail.col;
  for (let i = 0; i <= 25; i++) {
    const p = i / 25;
    const w = pitch3D(p), s = toScreen(w);
    const r = Math.max(1.5, 0.055 * 0.6 * H / (2 * Math.tan(cam3.fov * Math.PI / 360) * w.distanceTo(cam3.position)));
    ctx.globalAlpha = 0.25 + 0.5 * p;
    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// バッターが待っているコース（輪っか）
function drawWaitSpot() {
  if (!waitSpot) return;
  const during = (state === 'windup' || state === 'pitch') && humanBats();
  if (!during && !(state === 'result' && !play)) return;
  const c = state === 'result' ? courseRead() : null;
  const s = zonePxToScreen(waitSpot.x, waitSpot.y), r = WAIT_NEAR * zoneScale();
  ctx.strokeStyle = c === 'hit' ? '#ffd23f' : c === 'miss' ? 'rgba(255,255,255,.6)' : 'rgba(255,210,63,.9)';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)';
  ctx.strokeText('待ち', s.x, s.y - r - 1);
  ctx.fillStyle = '#ffd23f';
  ctx.fillText('待ち', s.x, s.y - r - 1);
}

// コースを選ぶときの印（指の少し上に出す）
function drawAimGuide() {
  if (state !== 'aim' && state !== 'guess') { dragAim = null; return; }
  const mark = (x, y, col, size) => {
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size * 1.6, y); ctx.lineTo(x + size * 1.6, y);
    ctx.moveTo(x, y - size * 1.6); ctx.lineTo(x, y + size * 1.6);
    ctx.stroke();
  };
  if (dragAim) {
    const inside = insideAimArea(dragAim);
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(dragAim.fx, dragAim.fy); ctx.lineTo(dragAim.sx, dragAim.sy + 16); ctx.stroke();
    ctx.setLineDash([]);
    mark(dragAim.sx, dragAim.sy, inside ? '#ffd23f' : '#ff8080', 14);
    const text = state === 'aim'
      ? (inside ? '離すと投げる' : '枠の外：離すと取り消し')
      : (inside ? '離すとここで待つ' : '枠の外：コースは張らない');
    tag(text, Math.max(70, Math.min(W - 70, dragAim.sx)), dragAim.sy - 32);
    return;
  }
  if (hover) {
    const z = screenToZonePx(hover.x, hover.y);
    if (insideAimArea(z)) mark(hover.x, hover.y, '#ffd23f', 12);
  }
}

// 打った瞬間の光（強い当たりほど大きい）
function drawHitFlash(now) {
  if (!hitFlash || hitFlash.p === undefined) return;
  const k = (now - hitFlash.t) / 240;
  if (k > 1) return;
  const s = toScreen(pitch3D(hitFlash.p));
  const R = (hitFlash.big ? 95 : 50) * (0.35 + k);
  ctx.save();
  ctx.globalAlpha = 1 - k;
  const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, R);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, 'rgba(255,236,140,.9)'); g.addColorStop(1, 'rgba(255,236,140,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(s.x, s.y, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff6c8'; ctx.lineWidth = 3;
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(s.x + Math.cos(a) * R * 0.45, s.y + Math.sin(a) * R * 0.45);
    ctx.lineTo(s.x + Math.cos(a) * R * 1.1, s.y + Math.sin(a) * R * 1.1);
    ctx.stroke();
  }
  ctx.restore();
}

// ホームランの演出：スタンドに入った瞬間に画面が光って、花火が上がる
const FW_COLORS = ['#ffd23f', '#ff6b6b', '#7fd6ff', '#9dff8a', '#ff9df0', '#ffffff'];
function drawHomeRunShow(tw) {
  const land = play.segs[0].dur;
  const dt0 = tw - land;
  if (dt0 < 0) return;
  if (dt0 < 0.35) {
    ctx.fillStyle = `rgba(255,250,220,${0.6 * (1 - dt0 / 0.35)})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (!play.fireworks) {
    play.fireworks = [];
    for (let i = 0; i < 12; i++) {
      play.fireworks.push({
        t: i * 0.2 + Math.random() * 0.15,
        x: 30 + Math.random() * 360, y: 40 + Math.random() * 260,
        col: FW_COLORS[i % FW_COLORS.length], n: 26 + Math.floor(Math.random() * 10), R: 70 + Math.random() * 40,
      });
    }
  }
  ctx.lineCap = 'round';
  for (const f of play.fireworks) {
    const dt = dt0 - f.t;
    if (dt < 0 || dt > 1.4) continue;
    const k = dt / 1.4;
    const d = f.R * (1 - (1 - k) * (1 - k));
    ctx.globalAlpha = Math.min(1, 1.6 * (1 - k));
    ctx.strokeStyle = f.col; ctx.lineWidth = 3.5 * (1 - k * 0.5);
    for (let j = 0; j < f.n; j++) {
      const a = j / f.n * Math.PI * 2;
      const drop = 26 * k * k;
      ctx.beginPath();
      ctx.moveTo(f.x + Math.cos(a) * d * 0.7, f.y + Math.sin(a) * d * 0.7 + drop);
      ctx.lineTo(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d + drop);
      ctx.stroke();
    }
    if (k < 0.25) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(f.x, f.y, 8 * (1 - k * 4), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.lineCap = 'butt';
}
