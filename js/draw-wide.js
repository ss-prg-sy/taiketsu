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

// 引きのカメラの背景も、対決の画面と同じ雰囲気で細かく描く。重いので最初に1回だけ描いてとっておく
let wideBg = null;
function drawWideField() {
  if (!wideBg) wideBg = buildWideBackground();
  ctx.drawImage(wideBg, 0, 0, W, H);
}

function buildWideBackground() {
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const cnv = document.createElement('canvas');
  cnv.width = W * dpr; cnv.height = H * dpr;
  const g = cnv.getContext('2d');
  g.scale(dpr, dpr);
  const rnd = seeded(11);
  const R = (a, b) => a + rnd() * (b - a);
  const poly = pts => { g.beginPath(); pts.forEach(([X, Y], i) => { const p = wp(X, Y); i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); }); g.closePath(); };
  const outline = fieldOutline();

  // ---- 夜空 ----
  let gr = g.createLinearGradient(0, 0, 0, 120);
  gr.addColorStop(0, '#0a1236'); gr.addColorStop(0.55, '#2a2d78'); gr.addColorStop(1, '#7a4288');
  g.fillStyle = gr; g.fillRect(0, 0, W, 120);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${R(0.2, 0.7)})`; g.fillRect(R(0, W), R(0, 70), 1.2, 1.2); }
  for (let i = 0; i < 14; i++) {
    const x = R(-20, W + 20), y = R(40, 100), rx = R(30, 70), ry = R(4, 9);
    const c = g.createRadialGradient(x, y, 0, x, y, rx);
    c.addColorStop(0, y > 75 ? 'rgba(214,104,150,.3)' : 'rgba(126,92,190,.28)'); c.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y);
    g.fillStyle = c; g.beginPath(); g.arc(x, y, rx, 0, Math.PI * 2); g.fill(); g.restore();
  }

  // ---- 観客席（グラウンドのまわり全部）----
  gr = g.createLinearGradient(0, 100, 0, H);
  gr.addColorStop(0, '#1a2456'); gr.addColorStop(1, '#2a3570');
  g.fillStyle = gr; g.fillRect(0, 100, W, H - 100);
  g.fillStyle = 'rgba(255,255,255,.04)';
  for (let y = 104; y < H; y += 7) g.fillRect(0, y, W, 3);          // 席の段
  const cols = ['#f2d8c0', '#e9b48f', '#f6f1e8', '#5f8fe8', '#f2c94a', '#d9536a', '#9fc0ff'];
  for (let i = 0; i < 4200; i++) {
    g.fillStyle = cols[Math.floor(rnd() * cols.length)];
    g.globalAlpha = R(0.45, 0.95);
    g.fillRect(R(0, W), R(102, H), 1.7, 1.9);
  }
  g.globalAlpha = 1;
  g.fillStyle = '#121a3e'; g.fillRect(0, 98, W, 6);                 // 屋根の明かり
  for (let x = 3; x < W; x += 8) { g.fillStyle = 'rgba(255,240,200,.9)'; g.fillRect(x, 100, 3, 1.5); }

  // ---- グラウンドの影（観客席とのさかい）----
  g.save();
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 14;
  g.fillStyle = '#2a6a32'; poly(outline); g.fill();
  g.restore();

  // ---- 芝（チェック柄＋質感）----
  g.save();
  poly(outline); g.clip();
  gr = g.createLinearGradient(0, 120, 0, H);
  gr.addColorStop(0, '#25602e'); gr.addColorStop(1, '#3d8f40');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.06)';                            // 横のしま
  for (let Y = -20; Y < 130; Y += 12) { poly([[-140, Y], [140, Y], [140, Y + 6], [-140, Y + 6]]); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,.07)';                                  // ホームから広がるしま
  for (let k = -6; k < 6; k += 2) { poly([[0, 0], polar(160, k * 0.13), polar(160, (k + 1) * 0.13)]); g.fill(); }
  for (let i = 0; i < 6000; i++) {                                 // 芝の質感
    g.strokeStyle = rnd() < 0.5 ? 'rgba(0,0,0,.10)' : 'rgba(190,255,170,.07)';
    g.lineWidth = 0.6;
    const x = R(0, W), y = R(110, H);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + R(-0.5, 0.5), y - 1.8); g.stroke();
  }
  const track = [];                                                // フェンス際の土
  for (let k = 0; k <= 36; k++) { const a = -Math.PI / 4 + k * (Math.PI / 2) / 36; track.push(polar(fenceR(a), a)); }
  for (let k = 36; k >= 0; k--) { const a = -Math.PI / 4 + k * (Math.PI / 2) / 36; track.push(polar(fenceR(a) - 5, a)); }
  g.fillStyle = '#8a4a2c'; poly(track); g.fill();
  g.restore();

  // ---- 内野の土（ざらざら）----
  const dirtShape = [];
  for (let k = 0; k <= 24; k++) { const a = -1.1 + k * 2.2 / 24; dirtShape.push([29 * Math.sin(a), 18.4 + 29 * Math.cos(a)]); }
  dirtShape.push([25, 16], [5, -4], [-5, -4], [-25, 16]);
  g.save(); poly(dirtShape); g.clip();
  gr = g.createLinearGradient(0, 380, 0, 620);
  gr.addColorStop(0, '#8e4c2d'); gr.addColorStop(1, '#a05a35');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(60,20,8,.2)' : 'rgba(255,200,160,.12)';
    g.fillRect(R(60, 360), R(380, 630), R(0.6, 1.4), R(0.6, 1.2));
  }
  g.restore();
  g.save(); poly([[0, 4], [16.2, 19.4], [0, 35], [-16.2, 19.4]]); g.clip();   // 内野の芝
  gr = g.createLinearGradient(0, 470, 0, 600);
  gr.addColorStop(0, '#2f7434'); gr.addColorStop(1, '#3d8f40');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.06)';
  for (let Y = 4; Y < 36; Y += 6) { poly([[-30, Y], [30, Y], [30, Y + 3], [-30, Y + 3]]); g.fill(); }
  g.restore();
  g.fillStyle = '#a0592f'; poly(circlePts(0, 18.4, 2.8)); g.fill();         // マウンド
  g.fillStyle = '#93502c'; poly(circlePts(0, 0, 4)); g.fill();              // ホームのまわり

  // ---- 白線・フェンス・ポール・ベース ----
  g.strokeStyle = 'rgba(245,242,235,.9)'; g.lineWidth = 2;
  for (const sgn of [-1, 1]) {
    const a = wp(0, 0), b = wp(sgn * 67.9, 67.9);
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
  }
  const fenceLine = (z, col, w) => {
    g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'round';
    g.beginPath();
    for (let k = 0; k <= 36; k++) {
      const a = -Math.PI / 4 + k * (Math.PI / 2) / 36;
      const [X, Y] = polar(fenceR(a), a); const p = wp(X, Y, z);
      k ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y);
    }
    g.stroke();
  };
  fenceLine(1.5, '#1d4f4a', 7);
  fenceLine(3, '#e8c547', 1.8);
  for (const sgn of [-1, 1]) {
    const p = wp(sgn * 67.9, 67.9);
    g.strokeStyle = '#f2d03b'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x, p.y - 32); g.stroke();
  }
  g.fillStyle = '#fbf8f2';
  for (let i = 1; i <= 3; i++) {
    const p = wp(BASES_W[i][0], BASES_W[i][1]);
    g.save(); g.translate(p.x, p.y); g.scale(1, 0.75); g.rotate(Math.PI / 4);
    g.fillRect(-3.5, -3.5, 7, 7); g.restore();
  }
  const h = wp(0, 0);
  g.beginPath();
  g.moveTo(h.x - 4, h.y - 2); g.lineTo(h.x + 4, h.y - 2); g.lineTo(h.x + 4, h.y + 1); g.lineTo(h.x, h.y + 4); g.lineTo(h.x - 4, h.y + 1);
  g.closePath(); g.fill();

  // ---- 照明（上の両すみ、光のにじみ）----
  for (const lx of [26, 394]) {
    const glow = g.createRadialGradient(lx, 70, 0, lx, 70, 90);
    glow.addColorStop(0, 'rgba(255,246,214,.6)'); glow.addColorStop(0.3, 'rgba(255,236,190,.22)'); glow.addColorStop(1, 'rgba(255,236,190,0)');
    g.fillStyle = glow; g.beginPath(); g.arc(lx, 70, 90, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#dfe3f5'; g.fillRect(lx - 16, 62, 32, 16);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) {
      g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(lx - 12 + k * 6, 66 + r * 7, 2.2, 0, Math.PI * 2); g.fill();
    }
  }
  return cnv;
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

  if (play.kind === 'HR') drawHomeRunShow(tw);
}

// ホームランの演出：ボールがスタンドに入った瞬間に画面が光って、花火が上がる
const FW_COLORS = ['#ffd23f', '#ff6b6b', '#7fd6ff', '#9dff8a', '#ff9df0', '#ffffff'];
function drawHomeRunShow(tw) {
  const land = play.segs[0].dur;
  const dt0 = tw - land;
  if (dt0 < 0) return;
  // 光る
  if (dt0 < 0.35) {
    ctx.fillStyle = `rgba(255,250,220,${0.6 * (1 - dt0 / 0.35)})`;
    ctx.fillRect(0, 0, W, H);
  }
  // 花火（最初に位置と色を決めておく）
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
    // 真ん中のきらめき
    if (k < 0.25) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(f.x, f.y, 8 * (1 - k * 4), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.lineCap = 'butt';
}
