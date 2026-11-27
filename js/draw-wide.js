// 描画（引きのカメラ）：打ったあとのグラウンド全体・打球・守備・ランナー

// =====================================================
//  引きのカメラ（打ったあと）
// =====================================================

function worldPoly(pts) {
  ctx.beginPath();
  pts.forEach(([X, Y], i) => { const p = wp(X, Y); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
  ctx.closePath();
}
function circlePts(cx, cy, r, n = 24) {
  const pts = [];
  for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return pts;
}
function fieldOutline() {
  const pts = [];
  for (let k = 0; k <= 36; k++) {
    const a = -Math.PI / 4 + k * (Math.PI / 2) / 36;
    pts.push(polar(fenceR(a), a));
  }
  pts.push([76, 66], [42, -6], [12, -16], [-12, -16], [-42, -6], [-76, 66]);
  return pts;
}

function drawWideField() {
  // 空とスタンド
  let g = ctx.createLinearGradient(0, 0, 0, 110);
  g.addColorStop(0, '#081233'); g.addColorStop(1, '#23447f');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 110);
  g = ctx.createLinearGradient(0, 96, 0, H);
  g.addColorStop(0, '#2a2e48'); g.addColorStop(1, '#4a4f6e');
  ctx.fillStyle = g; ctx.fillRect(0, 96, W, H - 96);
  for (const c of crowdW) { ctx.fillStyle = c.col; ctx.fillRect(c.x, c.y, 2.5, 2.5); }

  // グラウンド（芝）
  const outline = fieldOutline();
  g = ctx.createLinearGradient(0, 180, 0, H);
  g.addColorStop(0, '#2a7d40'); g.addColorStop(1, '#46b862');
  ctx.fillStyle = g;
  worldPoly(outline); ctx.fill();
  // 芝刈りの縞
  ctx.save();
  worldPoly(outline); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.05)';
  for (let Y = -20; Y < 130; Y += 12) worldPoly([[-120, Y], [120, Y], [120, Y + 6], [-120, Y + 6]]), ctx.fill();
  ctx.restore();

  // 内野の土
  const dirt = [];
  for (let k = 0; k <= 24; k++) { const a = -1.1 + k * 2.2 / 24; dirt.push([29 * Math.sin(a), 18.4 + 29 * Math.cos(a)]); }
  dirt.push([25, 16], [5, -4], [-5, -4], [-25, 16]);
  ctx.fillStyle = '#c48a52';
  worldPoly(dirt); ctx.fill();
  // 内野の芝
  ctx.fillStyle = '#3aa556';
  worldPoly([[0, 4], [16.2, 19.4], [0, 35], [-16.2, 19.4]]); ctx.fill();
  // マウンド・ホーム周り
  ctx.fillStyle = '#c48a52';
  worldPoly(circlePts(0, 18.4, 2.8)); ctx.fill();
  worldPoly(circlePts(0, 0, 4)); ctx.fill();

  // ファウルライン
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2;
  for (const sgn of [-1, 1]) {
    const a = wp(0, 0), b = wp(sgn * 67.9, 67.9);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  // フェンス
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#14502b'; ctx.lineWidth = 7;
  ctx.beginPath();
  for (let k = 0; k <= 36; k++) {
    const a = -Math.PI / 4 + k * (Math.PI / 2) / 36;
    const [X, Y] = polar(fenceR(a), a); const p = wp(X, Y);
    k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let k = 0; k <= 36; k++) {
    const a = -Math.PI / 4 + k * (Math.PI / 2) / 36;
    const [X, Y] = polar(fenceR(a), a); const p = wp(X, Y, 3);
    k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
  }
  ctx.stroke();
  // ポール
  for (const sgn of [-1, 1]) {
    const p = wp(sgn * 67.9, 67.9);
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 30); ctx.stroke();
  }
  // ベース
  ctx.fillStyle = '#fff';
  for (let i = 1; i <= 3; i++) {
    const p = wp(BASES_W[i][0], BASES_W[i][1]);
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.75); ctx.rotate(Math.PI / 4);
    ctx.fillRect(-3.5, -3.5, 7, 7);
    ctx.restore();
  }
  const h = wp(0, 0);
  ctx.beginPath();
  ctx.moveTo(h.x - 4, h.y - 2); ctx.lineTo(h.x + 4, h.y - 2); ctx.lineTo(h.x + 4, h.y + 1); ctx.lineTo(h.x, h.y + 4); ctx.lineTo(h.x - 4, h.y + 1);
  ctx.closePath(); ctx.fill();
}

// その時刻のボールの位置（メートル）
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

function lerp2(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }

function drawWide(now) {
  drawWideField();
  const tw = (now - wideAt) / 1000;
  const people = [];   // 奥から順に描くために一度ためる

  // 守備
  const ft = fieldTeam();
  const spots = [
    ...OFW.map((p, i) => ({ g: 'OF', i, p })),
    ...IFW.map((p, i) => ({ g: 'IF', i, p })),
    { g: 'P', i: 0, p: PW }, { g: 'C', i: 0, p: CW },
  ];
  for (const s of spots) {
    let p = s.p;
    const c = play.chaser;
    if (c && c.g === s.g && c.i === s.i) p = lerp2(s.p, c.to, Math.min(1, tw / c.t));
    people.push({ X: p[0], Y: p[1], team: ft });
  }

  // ランナー
  const bt = batTeam();
  for (const [from, to, out] of play.mv) {
    const delay = from === 0 ? 0.1 : play.runDelay;
    const u = Math.max(0, Math.min(to - from, (tw - delay) / 1.0));
    if (out && tw > play.ballEnd) continue;          // アウトになったら消える
    if (to === 4 && u >= to - from && tw - delay - (to - from) > 0.4) continue;   // ホームインしたら消える
    const pos = from + u;
    const i = Math.min(3, Math.floor(pos));
    const p = lerp2(BASES_W[i], BASES_W[i + 1], pos - i);
    people.push({ X: p[0], Y: p[1], team: bt });
  }

  people.sort((a, b) => b.Y - a.Y);
  for (const m of people) {
    const p = wp(m.X, m.Y);
    drawPerson(p.x, p.y, 0.55 * p.s, m.team);
  }

  // ボール
  const b = playBall(tw);
  const g = wp(b.X, b.Y), p = wp(b.X, b.Y, b.Z);
  drawShadow(g.x, g.y, 2.5 + b.Z * 0.03, 0.35);
  drawBall(p.x, p.y, 2.8 + b.Z * 0.06);
}
