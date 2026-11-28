// 描画（近い視点）：投手と打者の対決の画面
// 絵柄はUIイメージの画像に合わせた「フラット」なスタイル（グラデーションは控えめ、くっきりした色の面）

// =====================================================
//  色
// =====================================================
const COL = {
  skyTop: '#2b2d6b', skyBottom: '#5a3f86',
  cloud: '#e9707a',
  city: '#232650', cityWin: '#f3c94a',
  stand1: '#2c3260', stand2: '#363d70',
  wall: '#1f5e45', fence: '#f2d03b',
  grass1: '#3f9147', grass2: '#4a9e50',
  dirt: '#c2714f', dirtDark: '#b0623f', mound: '#c98762',
  line: '#ffffff', plate: '#f4eee6',
  zoneFill: 'rgba(130,205,215,.38)', zoneEdge: '#9edbe3',
  panel: '#1a1f3d', panelEdge: '#c9d3ff',
  skin: '#f2c4a0', hair: '#2b211d',
};

// 背景の飾り（毎回同じ形になるように最初に作っておく）
const CLOUDS = [
  [[0, 98, 44, 7], [12, 91, 30, 7]],
  [[80, 120, 64, 7], [96, 113, 40, 7], [134, 127, 34, 6]],
  [[260, 120, 66, 7], [276, 113, 44, 7], [250, 127, 30, 6]],
  [[376, 98, 44, 7], [392, 91, 28, 7]],
];
const CITY = [];
{
  let x = 0;
  while (x < W) {
    const w = 18 + Math.random() * 26, h = 14 + Math.random() * 30;
    const wins = [];
    for (let k = 0; k < 3; k++) if (Math.random() < 0.6) wins.push([x + 4 + Math.random() * (w - 10), 200 - h + 5 + Math.random() * (h - 12)]);
    CITY.push({ x, w, h, wins });
    x += w + 2;
  }
}
const FANS = [];
for (let i = 0; i < 70; i++) {
  const left = Math.random() < 0.5;
  FANS.push({ x: left ? Math.random() * 160 : 262 + Math.random() * 158, y: 182 + Math.random() * 22, col: ['#f2c94a', '#e9707a', '#7fb7ff', '#f4eee6', '#f08a4b'][i % 5] });
}

// =====================================================
//  背景（空・街・観客席・外野・内野）
// =====================================================

// 背景は細かく描くので重い → 最初に1回だけ別の画用紙（オフスクリーン）に描いて、毎フレームはそれを貼るだけ
let bgCanvas = null;

function drawField() {
  if (!bgCanvas) bgCanvas = buildBackground();
  ctx.drawImage(bgCanvas, 0, 0, W, H);
}

// 決まった並びの乱数（毎回同じ背景になるように）
function seeded(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function buildBackground() {
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const cnv = document.createElement('canvas');
  cnv.width = W * dpr; cnv.height = H * dpr;
  const g = cnv.getContext('2d');
  g.scale(dpr, dpr);
  const rnd = seeded(7);
  const R = (a, b) => a + rnd() * (b - a);

  // ---- 夜空 ----
  let gr = g.createLinearGradient(0, 0, 0, 205);
  gr.addColorStop(0, '#0a1236'); gr.addColorStop(0.45, '#232a72'); gr.addColorStop(0.8, '#5b3a8a'); gr.addColorStop(1, '#a64f7e');
  g.fillStyle = gr; g.fillRect(0, 0, W, 205);
  // 星
  for (let i = 0; i < 60; i++) {
    g.fillStyle = `rgba(255,255,255,${R(0.2, 0.7)})`;
    g.fillRect(R(0, W), R(0, 120), 1.2, 1.2);
  }
  // ふんわりした雲（紫・ピンクのぼかし）
  const cloud = (x, y, rx, ry, col) => {
    const c = g.createRadialGradient(x, y, 0, x, y, rx);
    c.addColorStop(0, col); c.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y);
    g.fillStyle = c; g.beginPath(); g.arc(x, y, rx, 0, Math.PI * 2); g.fill();
    g.restore();
  };
  for (let i = 0; i < 26; i++) {
    const y = R(95, 175);
    cloud(R(-20, W + 20), y, R(30, 80), R(5, 12), y > 140 ? 'rgba(214,104,150,.32)' : 'rgba(126,92,190,.30)');
  }

  // ---- 街と木のシルエット ----
  let x = 0;
  while (x < W) {
    const w = R(14, 30), h = R(12, 40);
    g.fillStyle = '#121838';
    g.fillRect(x, 192 - h, w, h + 12);
    g.fillStyle = 'rgba(255,214,120,.85)';
    for (let k = 0; k < 6; k++) if (rnd() < 0.45) g.fillRect(x + R(2, w - 4), 192 - h + R(3, h - 4), 2, 2);
    x += w + R(0, 6);
  }
  g.fillStyle = '#0d2220';
  for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(R(0, W), R(178, 192), R(5, 11), 0, Math.PI * 2); g.fill(); }

  // ---- 観客席（左右）----
  const stand = (x0, x1, slant) => {
    // 屋根
    g.fillStyle = '#1a2448';
    g.beginPath(); g.moveTo(x0, 166); g.lineTo(x1, 166); g.lineTo(x1 + slant, 172); g.lineTo(x0, 172); g.closePath(); g.fill();
    for (let xx = x0 + 4; xx < x1; xx += 9) { g.fillStyle = 'rgba(255,240,200,.9)'; g.fillRect(xx, 168, 3, 1.6); }
    // 段々の席
    for (let r = 0; r < 7; r++) {
      const y = 172 + r * 5;
      g.fillStyle = r % 2 ? '#1c2a5c' : '#22336c';
      g.beginPath(); g.moveTo(x0, y); g.lineTo(x1 + slant * (1 + r * 0.25), y); g.lineTo(x1 + slant * (1 + (r + 1) * 0.25), y + 5); g.lineTo(x0, y + 5); g.closePath(); g.fill();
    }
    // 観客
    const cols = ['#f2d8c0', '#e9b48f', '#f6f1e8', '#5f8fe8', '#f2c94a', '#d9536a', '#9fc0ff'];
    for (let i = 0; i < 900; i++) {
      const yy = R(173, 206);
      const xx = R(x0, x1 + slant * (1 + (yy - 172) / 20));
      g.fillStyle = cols[Math.floor(rnd() * cols.length)];
      g.globalAlpha = R(0.55, 1);
      g.fillRect(xx, yy, 1.6, 1.8);
    }
    g.globalAlpha = 1;
    // 通路
    g.strokeStyle = 'rgba(10,16,40,.55)'; g.lineWidth = 1.2;
    for (let xx = x0 + 22; xx < x1; xx += 34) { g.beginPath(); g.moveTo(xx, 172); g.lineTo(xx + 4, 207); g.stroke(); }
  };
  stand(0, 152, 10);
  stand(268, 420, -10);

  // ---- 照明塔（光のにじみ）----
  for (const lx of [37, 383]) {
    g.strokeStyle = '#8f96b8'; g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(lx - 4, 198); g.lineTo(lx - 2, 136); g.moveTo(lx + 4, 198); g.lineTo(lx + 2, 136);
    for (let yy = 140; yy < 196; yy += 8) { g.moveTo(lx - 3.5, yy); g.lineTo(lx + 3.5, yy + 8); g.moveTo(lx + 3.5, yy); g.lineTo(lx - 3.5, yy + 8); }
    g.stroke();
    const glow = g.createRadialGradient(lx, 127, 0, lx, 127, 70);
    glow.addColorStop(0, 'rgba(255,246,214,.75)'); glow.addColorStop(0.25, 'rgba(255,236,190,.35)'); glow.addColorStop(1, 'rgba(255,236,190,0)');
    g.fillStyle = glow; g.beginPath(); g.arc(lx, 127, 70, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#dfe3f5'; g.fillRect(lx - 19, 116, 38, 20);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) {
      g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(lx - 15 + k * 6, 120 + r * 6, 2.3, 0, Math.PI * 2); g.fill();
    }
  }

  // ---- センターの壁と旗 ----
  gr = g.createLinearGradient(0, 176, 0, 208);
  gr.addColorStop(0, '#1f4c47'); gr.addColorStop(1, '#163a37');
  g.fillStyle = gr; g.fillRect(166, 176, 92, 32);
  g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1;
  for (let xx = 170; xx < 258; xx += 8) { g.beginPath(); g.moveTo(xx, 177); g.lineTo(xx, 207); g.stroke(); }
  for (const { fx, f1, f2 } of [{ fx: 197, f1: '#f4f4f4', f2: '#d23b3b' }, { fx: 211, f1: '#3f7de8', f2: '#3f7de8' }, { fx: 227, f1: '#2f6fd8', f2: '#2f6fd8' }]) {
    g.fillStyle = '#d9dcea'; g.fillRect(fx, 150, 1.2, 27);
    g.fillStyle = f1; g.fillRect(fx + 1.2, 151, 9, 6);
    if (f1 !== f2) { g.fillStyle = f2; g.beginPath(); g.arc(fx + 5.7, 154, 1.7, 0, Math.PI * 2); g.fill(); }
  }

  // ---- フェンス ----
  gr = g.createLinearGradient(0, 207, 0, 223);
  gr.addColorStop(0, '#1f5650'); gr.addColorStop(1, '#123b37');
  g.fillStyle = gr; g.fillRect(0, 207, W, 16);
  g.fillStyle = '#e8c547'; g.fillRect(0, 206.5, W, 1.6);
  g.fillStyle = '#fff'; g.font = 'bold 8px system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle';
  g.fillText('122m', W - 6, 215);

  // ---- 芝（チェック柄の刈りあと＋質感）----
  gr = g.createLinearGradient(0, 223, 0, 430);
  gr.addColorStop(0, '#24592c'); gr.addColorStop(1, '#3a8a3c');
  g.fillStyle = gr; g.fillRect(0, 223, W, H - 223);
  g.save();
  g.beginPath(); g.rect(0, 223, W, H - 223); g.clip();
  // 横のしま（手前ほど太い）
  for (let k = 0; k < 14; k++) {
    const y0 = 223 + Math.pow(k, 1.7) * 3.2, y1 = 223 + Math.pow(k + 1, 1.7) * 3.2;
    if (k % 2) { g.fillStyle = 'rgba(255,255,255,.055)'; g.fillRect(0, y0, W, y1 - y0); }
  }
  // 縦のしま（奥の一点に集まる）
  g.fillStyle = 'rgba(0,0,0,.06)';
  for (let i = -12; i < 12; i += 2) {
    g.beginPath();
    g.moveTo(217 + i * 6, 150); g.lineTo(217 + i * 80, H + 200); g.lineTo(217 + (i + 1) * 80, H + 200); g.lineTo(217 + (i + 1) * 6, 150);
    g.closePath(); g.fill();
  }
  // 芝の質感（細かい線）
  for (let i = 0; i < 7000; i++) {
    const yy = R(223, 430), s = 0.4 + (yy - 223) / 200;
    g.strokeStyle = rnd() < 0.5 ? 'rgba(0,0,0,.10)' : 'rgba(190,255,170,.08)';
    g.lineWidth = 0.6 * s;
    const xx = R(0, W);
    g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + R(-0.6, 0.6), yy - 2.2 * s); g.stroke();
  }
  g.restore();

  // ---- 土（マウンドの奥の帯・マウンド・手前）----
  const dirtTex = (path, base1, base2, y0, y1, n) => {
    g.save(); path(); g.clip();
    const d = g.createLinearGradient(0, y0, 0, y1);
    d.addColorStop(0, base1); d.addColorStop(1, base2);
    g.fillStyle = d; g.fillRect(0, y0 - 20, W, y1 - y0 + 40);
    for (let i = 0; i < n; i++) {
      g.fillStyle = rnd() < 0.5 ? 'rgba(60,20,8,.18)' : 'rgba(255,200,160,.12)';
      const yy = R(y0, y1), s = 0.5 + (yy - y0) / 140;
      g.fillRect(R(0, W), yy, R(0.6, 1.6) * s, R(0.6, 1.4) * s);
    }
    g.restore();
  };
  dirtTex(() => { g.beginPath(); g.moveTo(0, 262); g.quadraticCurveTo(217, 243, W, 262); g.lineTo(W, 270); g.quadraticCurveTo(217, 252, 0, 270); g.closePath(); },
    '#8a4a2c', '#9a5633', 240, 272, 900);
  dirtTex(() => { g.beginPath(); g.ellipse(210, 268, 62, 11, 0, 0, Math.PI * 2); },
    '#a7613a', '#8f4f2e', 256, 280, 500);
  g.fillStyle = '#f2ece2'; g.fillRect(200, 263, 18, 2.5);    // プレート
  dirtTex(() => { g.beginPath(); g.moveTo(0, 418); g.quadraticCurveTo(217, 396, W, 418); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); },
    '#8c4a2d', '#6e3720', 396, H, 9000);
  // 芝と土の境目を少しぼかす
  gr = g.createLinearGradient(0, 400, 0, 425);
  gr.addColorStop(0, 'rgba(40,80,40,0)'); gr.addColorStop(1, 'rgba(40,24,12,.25)');
  g.fillStyle = gr; g.fillRect(0, 400, W, 25);

  // ---- 白線（チョークのかすれ）・バッターボックス・ホームベース ----
  const chalk = (pts, closed) => {
    g.strokeStyle = 'rgba(245,242,235,.92)'; g.lineWidth = 5; g.lineJoin = 'miter';
    g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); if (closed) g.closePath(); g.stroke();
    // かすれ：線の上に土色の点を散らす
    const segs = closed ? [...pts, pts[0]] : pts;
    for (let i = 0; i < segs.length - 1; i++) {
      const [ax, ay] = segs[i], [bx, by] = segs[i + 1];
      const len = Math.hypot(bx - ax, by - ay);
      for (let k = 0; k < len * 0.9; k++) {
        const t = rnd();
        g.fillStyle = rnd() < 0.7 ? 'rgba(120,60,30,.55)' : 'rgba(255,255,255,.9)';
        g.fillRect(ax + (bx - ax) * t + R(-2.6, 2.6), ay + (by - ay) * t + R(-2.6, 2.6), 1.2, 1.2);
      }
    }
  };
  chalk([[0, 425], [42, 455]]);
  chalk([[W, 425], [378, 455]]);
  chalk([[42, 455], [174, 455], [166, 544], [0, 544]], true);
  chalk([[260, 455], [378, 455], [W + 2, 544], [268, 544]], true);
  g.fillStyle = '#b79f80';
  g.beginPath(); g.moveTo(192, 480); g.lineTo(242, 480); g.lineTo(242, 493); g.lineTo(217, 506); g.lineTo(192, 493); g.closePath(); g.fill();
  gr = g.createLinearGradient(0, 477, 0, 503);
  gr.addColorStop(0, '#f3e9d8'); gr.addColorStop(1, '#dccbb0');
  g.fillStyle = gr;
  g.beginPath(); g.moveTo(192, 477); g.lineTo(242, 477); g.lineTo(242, 490); g.lineTo(217, 503); g.lineTo(192, 490); g.closePath(); g.fill();

  // ---- 全体の光の当たり方（下と端を少し暗く）----
  gr = g.createLinearGradient(0, 430, 0, H);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.25)');
  g.fillStyle = gr; g.fillRect(0, 430, W, H - 430);
  return cnv;
}

function drawShadow(x, y, rx, alpha) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.32, 0, 0, Math.PI * 2); ctx.fill();
}

// 小さい選手（外野手、引きのカメラの守備・ランナー）：丸い頭・角の丸い体・先の丸い手足
function drawPerson(x, y, s, team) {
  const c = TEAMS[team];
  drawShadow(x + 1 * s, y, 8 * s, 0.25);
  limb([[x - 2.6 * s, y - 12 * s], [x - 3 * s, y - 1.5 * s]], 4.2 * s, '#f4eee6');   // 足
  limb([[x + 2.6 * s, y - 12 * s], [x + 3 * s, y - 1.5 * s]], 4.2 * s, '#f4eee6');
  ctx.fillStyle = '#2b3150';
  ctx.beginPath(); ctx.ellipse(x - 3.4 * s, y - 0.5 * s, 3 * s, 1.6 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 3.4 * s, y - 0.5 * s, 3 * s, 1.6 * s, 0, 0, Math.PI * 2); ctx.fill();
  limb([[x - 6 * s, y - 22 * s], [x - 7.5 * s, y - 14 * s]], 3.2 * s, c.color);    // 腕
  limb([[x + 6 * s, y - 22 * s], [x + 7.5 * s, y - 14 * s]], 3.2 * s, c.color);
  const bg = ctx.createLinearGradient(x - 6.5 * s, 0, x + 6.5 * s, 0);              // 体（左右で明るさを変えて立体に）
  bg.addColorStop(0, c.light); bg.addColorStop(0.55, c.color); bg.addColorStop(1, c.dark);
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(x - 6.5 * s, y - 25 * s, 13 * s, 15 * s, 4.5 * s); ctx.fill();
  ctx.fillStyle = COL.skin;                                                        // 頭
  ctx.beginPath(); ctx.arc(x, y - 29.5 * s, 4.6 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = c.dark;                                                          // 帽子
  ctx.beginPath(); ctx.arc(x, y - 30.5 * s, 4.8 * s, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 3 * s, y - 30.5 * s, 3.2 * s, 1.1 * s, 0, 0, Math.PI * 2); ctx.fill();
}

// 外野手（画像どおり左右の2人）
function drawFielders() {
  const ft = fieldTeam();
  drawPerson(OF[0][0], OF[0][1], 0.9, ft);
  drawPerson(OF[2][0], OF[2][1], 0.9, ft);
}

// ランナーは上のスコアボードのひし形で見せる（フィールドには描かない）
function drawRunners() {}

// 投手（正面から見たフラットな人）
function drawPitcher(now) {
  // 投手はこちらを向いているので、右投げは投げる腕が画面の左側に見える（絵を左右反転）
  // ※ drawPitcherBody は「投げる腕が画面の右」の形で描いてある＝左投げの見え方
  ctx.save();
  if (pitHand() === 'R') { ctx.translate(432, 0); ctx.scale(-1, 1); }
  drawPitcherBody(now);
  ctx.restore();
  tag(handName(pitHand(), '投げ'), 256, MOUND_Y - 30);
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

// ボールゾーン（水色の枠）とストライクゾーン（点線の枠＋3×3のマス）
function drawZone() {
  const ax = HIT.x - AIM_W / 2, ay = HIT.y - AIM_H / 2;
  const zx = HIT.x - ZW / 2, zy = HIT.y - ZH / 2;
  // 水色にふわっと光る枠
  const fill = ctx.createLinearGradient(0, ay, 0, ay + AIM_H);
  fill.addColorStop(0, 'rgba(40,200,190,.30)'); fill.addColorStop(1, 'rgba(40,170,170,.18)');
  ctx.fillStyle = fill;
  ctx.fillRect(ax, ay, AIM_W, AIM_H);
  ctx.save();
  ctx.shadowColor = 'rgba(80,255,235,.9)'; ctx.shadowBlur = 14;
  ctx.strokeStyle = '#5ff2e2'; ctx.lineWidth = 2.2;
  ctx.strokeRect(ax, ay, AIM_W, AIM_H);
  ctx.fillStyle = '#7ff7ea';
  ctx.font = '900 14px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('ボールゾーン', HIT.x, ay - 5);
  ctx.restore();
  // マス目
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 1; i < 3; i++) {
    ctx.moveTo(zx + ZW * i / 3, zy); ctx.lineTo(zx + ZW * i / 3, zy + ZH);
    ctx.moveTo(zx, zy + ZH * i / 3); ctx.lineTo(zx + ZW, zy + ZH * i / 3);
  }
  ctx.stroke();
  // 点線の枠
  ctx.lineWidth = 3; ctx.setLineDash([9, 6]);
  ctx.strokeRect(zx, zy, ZW, ZH);
  ctx.setLineDash([]);
}

// コースを選ぶときのカーソル
function drawAimGuide() {
  if (state !== 'aim' && state !== 'guess') { dragAim = null; return; }
  if (dragAim) {
    // 指でなぞっている途中：印（＋指からの線）と、離すとどうなるかを出す
    const inside = insideAimArea(dragAim);
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(dragAim.fx, dragAim.fy); ctx.lineTo(dragAim.x, dragAim.y + 16); ctx.stroke();
    ctx.setLineDash([]);
    const col = inside ? '#ffd23f' : '#ff8080';
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(dragAim.x, dragAim.y, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dragAim.x - 22, dragAim.y); ctx.lineTo(dragAim.x + 22, dragAim.y);
    ctx.moveTo(dragAim.x, dragAim.y - 22); ctx.lineTo(dragAim.x, dragAim.y + 22);
    ctx.stroke();
    const text = state === 'aim'
      ? (inside ? '離すと投げる' : '枠の外：離すと取り消し')
      : (inside ? '離すとここで待つ' : '枠の外：コースは張らない');
    tag(text, Math.max(70, Math.min(W - 70, dragAim.x)), dragAim.y - 32);
    return;
  }
  if (hover && insideAimArea(hover)) {
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(hover.x, hover.y, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hover.x - 18, hover.y); ctx.lineTo(hover.x + 18, hover.y);
    ctx.moveTo(hover.x, hover.y - 18); ctx.lineTo(hover.x, hover.y + 18);
    ctx.stroke();
  }
}

// この打席の配球（球種ごとの色の点＋何球目か）
function drawHistory() {
  pitchLog.forEach((h, i) => {
    if (!h.done) return;
    const last = i === pitchLog.length - 1;
    ctx.fillStyle = PCOLORS[h.pi];
    ctx.globalAlpha = last ? 1 : 0.8;
    ctx.beginPath(); ctx.arc(h.x, h.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = last ? '#11152e' : 'rgba(17,21,46,.6)'; ctx.lineWidth = last ? 2.5 : 1.2;
    ctx.stroke();
    ctx.fillStyle = '#11152e';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), h.x, h.y + 0.5);
  });
}

// 直前の投球の通り道（球種の色の点を並べる）
function drawTrail() {
  if (!lastTrail || (state !== 'result' && state !== 'aim' && state !== 'guess')) return;
  ctx.fillStyle = lastTrail.col;
  lastTrail.pts.forEach((b, i) => {
    ctx.globalAlpha = 0.25 + 0.5 * (i / lastTrail.pts.length);
    ctx.beginPath(); ctx.arc(b.x, b.y, Math.max(1.5, b.r * 0.45), 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// バッターが待っているコース（輪っか）
function drawWaitSpot() {
  if (!waitSpot) return;
  const during = (state === 'windup' || state === 'pitch') && humanBats();
  if (!during && state !== 'result') return;
  const c = state === 'result' ? courseRead() : null;
  ctx.strokeStyle = c === 'hit' ? '#ffd23f' : c === 'miss' ? 'rgba(255,255,255,.6)' : 'rgba(255,210,63,.9)';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.arc(waitSpot.x, waitSpot.y, WAIT_NEAR, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)';
  ctx.strokeText('待ち', waitSpot.x, waitSpot.y - WAIT_NEAR - 1);
  ctx.fillStyle = '#ffd23f';
  ctx.fillText('待ち', waitSpot.x, waitSpot.y - WAIT_NEAR - 1);
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
  // 上半分のつや
  const s = ctx.createLinearGradient(0, y, 0, y + h * 0.5);
  s.addColorStop(0, 'rgba(255,255,255,.12)'); s.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = s;
  ctx.beginPath(); ctx.roundRect(x + 2, y + 2, w - 4, h * 0.5, rad - 2); ctx.fill();
  // ふちの光
  ctx.save();
  ctx.shadowColor = 'rgba(140,170,255,.8)'; ctx.shadowBlur = 6;
  ctx.strokeStyle = '#9fb3f2'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, rad); ctx.stroke();
  ctx.restore();
}

// 右のカウント表示
function drawCount() {
  if (state === 'menu') return;
  const x = batterHand === 'L' ? 27 : 307, y = 322, w = 86, h = 72;   // 打者と重ならない側に出す
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

// =====================================================
//  ボール
// =====================================================

function drawBall(x, y, r) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  // 下側を少し暗くして丸く見せる
  ctx.fillStyle = 'rgba(120,120,140,.35)';
  ctx.beginPath(); ctx.arc(x, y, r, 0.15 * Math.PI, 0.85 * Math.PI); ctx.fill();
  if (r > 5) {
    ctx.strokeStyle = '#e04848'; ctx.lineWidth = Math.max(1, r * 0.1);
    ctx.beginPath(); ctx.arc(x - r * 0.95, y, r * 0.6, -0.9, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + r * 0.95, y, r * 0.6, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
  }
}

function drawPitchedBall(now) {
  if (state !== 'pitch') return;
  const p = (now - phaseStart) / travel;
  const b = ballPos(p);
  if (p <= 1) drawShadow(b.x, b.groundY, b.r * 0.9, 0.22);
  for (const [dp, al] of [[0.06, 0.15], [0.03, 0.3]]) {
    if (p - dp < 0) continue;
    const t = ballPos(p - dp);
    ctx.globalAlpha = al;
    drawBall(t.x, t.y, t.r);
    ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = p > 1 ? Math.max(0, 1 - (p - 1) * 8) : 1;
  drawBall(b.x, b.y, b.r);
  ctx.globalAlpha = 1;
}

// =====================================================
//  バッター（画像のような大きいフラットな人）
// =====================================================
// 太い線で手足を描く
function limb(points, width, color) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

function drawBatter(now) {
  // 左打ちはゾーンの真ん中を軸に左右反転（ホームベースの右側に立つ）
  ctx.save();
  if (batterHand === 'L') { ctx.translate(HIT.x * 2, 0); ctx.scale(-1, 1); }
  drawBatterBody(now);
  ctx.restore();
  tag(handName(batterHand, '打ち'), batterHand === 'L' ? HIT.x * 2 - 86 : 86, 538);
}

// =====================================================
//  打った瞬間・打球
// =====================================================

// 打った瞬間の光（強い当たりほど大きい）
function drawHitFlash(now) {
  if (!hitFlash) return;
  const k = (now - hitFlash.t) / 240;
  if (k > 1) return;
  const R = (hitFlash.big ? 95 : 50) * (0.35 + k);
  ctx.save();
  ctx.globalAlpha = 1 - k;
  const g = ctx.createRadialGradient(hitFlash.x, hitFlash.y, 0, hitFlash.x, hitFlash.y, R);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, 'rgba(255,236,140,.9)'); g.addColorStop(1, 'rgba(255,236,140,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(hitFlash.x, hitFlash.y, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff6c8'; ctx.lineWidth = 3;
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(hitFlash.x + Math.cos(a) * R * 0.45, hitFlash.y + Math.sin(a) * R * 0.45);
    ctx.lineTo(hitFlash.x + Math.cos(a) * R * 1.1, hitFlash.y + Math.sin(a) * R * 1.1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFlight(now) {
  if (!flight) return;
  const t = Math.min(1, (now - flight.t0) / flight.dur);
  const x = flight.x0 + (flight.tx - flight.x0) * t;
  const y = flight.y0 + (flight.ty - flight.y0) * t - Math.sin(Math.PI * t) * flight.arc;
  const r = flight.r0 + (Math.max(2, flight.kind === 'POP' ? 6 : 2) - flight.r0) * t;
  const gy = PLATE_Y + (flight.ty + 12 - PLATE_Y) * t;
  if (gy > 224) drawShadow(x, gy, Math.max(2, r * 0.9), 0.25);
  if (t < 1 || flight.ty < 208) drawBall(x, y, r);
}

// 画面の端を少しだけ暗く
function drawVignette() {
  const g = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.4, W / 2, H * 0.55, H * 0.85);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
