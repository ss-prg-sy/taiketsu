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

function drawField() {
  // 夜空
  let g = ctx.createLinearGradient(0, 0, 0, 210);
  g.addColorStop(0, COL.skyTop); g.addColorStop(1, COL.skyBottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 210);
  // ピクセル風の雲
  ctx.fillStyle = COL.cloud;
  for (const c of CLOUDS) for (const [x, y, w, h] of c) ctx.fillRect(x, y, w, h);
  // 街のシルエット
  ctx.fillStyle = COL.city;
  for (const b of CITY) ctx.fillRect(b.x, 200 - b.h, b.w, b.h + 10);
  ctx.fillStyle = COL.cityWin;
  for (const b of CITY) for (const [x, y] of b.wins) ctx.fillRect(x, y, 3, 3);
  // 照明塔
  for (const lx of [35, 385]) {
    ctx.fillStyle = '#c9cbe0'; ctx.fillRect(lx - 2, 132, 4, 52);
    ctx.fillStyle = '#e8e9f4'; ctx.fillRect(lx - 16, 116, 32, 18);
    ctx.fillStyle = '#fffbe2';
    for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) ctx.fillRect(lx - 14 + k * 7.5, 118 + r * 8, 6, 6);
  }
  // 観客席（左右）
  ctx.fillStyle = COL.stand1;
  ctx.beginPath(); ctx.moveTo(0, 176); ctx.lineTo(150, 176); ctx.lineTo(166, 208); ctx.lineTo(0, 208); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(W, 176); ctx.lineTo(270, 176); ctx.lineTo(258, 208); ctx.lineTo(W, 208); ctx.closePath(); ctx.fill();
  ctx.fillStyle = COL.stand2;
  ctx.fillRect(0, 176, 150, 6); ctx.fillRect(270, 176, 150, 6);
  for (const f of FANS) { ctx.fillStyle = f.col; ctx.beginPath(); ctx.arc(f.x, f.y, 2.2, 0, Math.PI * 2); ctx.fill(); }
  // センターの緑の壁と旗
  ctx.fillStyle = COL.wall; ctx.fillRect(166, 176, 92, 32);
  for (const [fx, fc] of [[197, '#f4eee6'], [211, '#4f8df0'], [227, '#4f8df0']]) {
    ctx.fillStyle = '#e8e9f4'; ctx.fillRect(fx, 150, 1.5, 27);
    ctx.fillStyle = fc;
    ctx.beginPath(); ctx.moveTo(fx + 1.5, 151); ctx.lineTo(fx + 10, 155); ctx.lineTo(fx + 1.5, 159); ctx.closePath(); ctx.fill();
  }
  // フェンス
  ctx.fillStyle = COL.fence; ctx.fillRect(0, 207, W, 2);
  ctx.fillStyle = COL.wall; ctx.fillRect(0, 209, W, 14);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 8px system-ui, sans-serif';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('122m', W - 6, 216);

  // 外野の芝（奥の一点に向かうしま模様）
  ctx.fillStyle = COL.grass1; ctx.fillRect(0, 223, W, H - 223);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 223, W, H - 223); ctx.clip();
  ctx.fillStyle = COL.grass2;
  for (let i = -12; i < 12; i += 2) {
    ctx.beginPath();
    ctx.moveTo(217 + i * 6, 150);
    ctx.lineTo(217 + i * 75, H + 200);
    ctx.lineTo(217 + (i + 1) * 75, H + 200);
    ctx.lineTo(217 + (i + 1) * 6, 150);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // 内野の土の帯（マウンドの奥）
  ctx.fillStyle = COL.dirt;
  ctx.beginPath();
  ctx.moveTo(0, 262); ctx.quadraticCurveTo(217, 244, W, 262);
  ctx.lineTo(W, 268); ctx.quadraticCurveTo(217, 252, 0, 268);
  ctx.closePath(); ctx.fill();
  // マウンド
  ctx.fillStyle = COL.mound;
  ctx.beginPath(); ctx.ellipse(210, 268, 57, 9, 0, 0, Math.PI * 2); ctx.fill();
  // 手前の土（ホームベースのまわり）
  ctx.fillStyle = COL.dirt;
  ctx.beginPath();
  ctx.moveTo(0, 416); ctx.quadraticCurveTo(217, 398, W, 416);
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  ctx.fillStyle = COL.dirtDark; ctx.fillRect(0, 560, W, H - 560);

  // ファウルライン・バッターボックス・ホームベース
  ctx.strokeStyle = COL.line; ctx.lineWidth = 4; ctx.lineJoin = 'miter';
  ctx.beginPath(); ctx.moveTo(0, 425); ctx.lineTo(42, 455); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W, 425); ctx.lineTo(378, 455); ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(42, 455); ctx.lineTo(174, 455); ctx.lineTo(166, 544); ctx.lineTo(0, 544); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(260, 455); ctx.lineTo(378, 455); ctx.lineTo(W + 2, 544); ctx.lineTo(268, 544); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = COL.plate;
  ctx.beginPath();
  ctx.moveTo(192, 477); ctx.lineTo(242, 477); ctx.lineTo(242, 490); ctx.lineTo(217, 503); ctx.lineTo(192, 490);
  ctx.closePath(); ctx.fill();
}

function drawShadow(x, y, rx, alpha) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.32, 0, 0, Math.PI * 2); ctx.fill();
}

// 小さい選手（外野手、引きのカメラの守備・ランナー）
function drawPerson(x, y, s, team) {
  const c = TEAMS[team];
  drawShadow(x + 1 * s, y, 8 * s, 0.25);
  ctx.fillStyle = '#f4eee6';
  ctx.fillRect(x - 5 * s, y - 11 * s, 4 * s, 11 * s);
  ctx.fillRect(x + 1 * s, y - 11 * s, 4 * s, 11 * s);
  ctx.fillStyle = c.color;
  ctx.fillRect(x - 6 * s, y - 25 * s, 12 * s, 15 * s);
  ctx.fillStyle = COL.skin;
  ctx.fillRect(x - 3.5 * s, y - 32 * s, 7 * s, 7 * s);
  ctx.fillStyle = c.dark;
  ctx.fillRect(x - 4.5 * s, y - 35 * s, 9 * s, 4 * s);
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
  // 左投げは左右反転して描く
  ctx.save();
  if (pitHand() === 'L') { ctx.translate(432, 0); ctx.scale(-1, 1); }
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

function drawPitcherBody(now) {
  const x = 216, y = MOUND_Y, c = TEAMS[fieldTeam()];
  let armUp = 0;
  if (state === 'windup') armUp = Math.min(1, Math.max(0, (now - phaseStart) / WINDUP));
  drawShadow(x + 3, y - 1, 13, 0.25);
  // 足とズボン
  ctx.fillStyle = '#f4eee6';
  ctx.fillRect(x - 6, y - 26, 5, 24); ctx.fillRect(x + 1, y - 26, 5, 24);
  ctx.fillStyle = '#26305a';
  ctx.fillRect(x - 7, y - 4, 7, 4); ctx.fillRect(x + 1, y - 4, 7, 4);
  // 体
  ctx.fillStyle = c.color;
  ctx.fillRect(x - 8, y - 46, 16, 21);
  // グラブ（左手）
  ctx.fillStyle = '#9a5a2e';
  ctx.beginPath(); ctx.arc(x - 11, y - 30, 5, 0, Math.PI * 2); ctx.fill();
  // 投げる腕（振りかぶると上がる）
  const hx = x + 10, hy = y - 40 - armUp * 14;
  ctx.strokeStyle = c.color; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + 7, y - 42); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.lineCap = 'butt';
  // 顔と帽子
  ctx.fillStyle = COL.skin;
  ctx.fillRect(x - 5, y - 56, 10, 10);
  ctx.fillStyle = c.color;
  ctx.beginPath(); ctx.arc(x, y - 56, 6, Math.PI, 0); ctx.fill();
  ctx.fillRect(x - 2, y - 57, 10, 2.5);
  // 振りかぶり中のボール
  if (state === 'windup' && now >= phaseStart) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(hx, hy, 2.4, 0, Math.PI * 2); ctx.fill();
  }
}

// ボールゾーン（水色の枠）とストライクゾーン（点線の枠＋3×3のマス）
function drawZone() {
  const ax = HIT.x - AIM_W / 2, ay = HIT.y - AIM_H / 2;
  const zx = HIT.x - ZW / 2, zy = HIT.y - ZH / 2;
  ctx.fillStyle = COL.zoneFill;
  ctx.fillRect(ax, ay, AIM_W, AIM_H);
  ctx.strokeStyle = COL.zoneEdge; ctx.lineWidth = 2;
  ctx.strokeRect(ax, ay, AIM_W, AIM_H);
  ctx.fillStyle = 'rgba(230,236,255,.85)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('ボールゾーン', HIT.x, ay - 4);
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
  if (state !== 'aim' && state !== 'guess') return;
  if (hover && Math.abs(hover.x - HIT.x) <= AIM_W / 2 + 10 && Math.abs(hover.y - HIT.y) <= AIM_H / 2 + 10) {
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
  history.forEach((h, i) => {
    if (!h.done) return;
    const last = i === history.length - 1;
    ctx.fillStyle = PCOLORS[h.pi];
    ctx.globalAlpha = last ? 1 : 0.8;
    ctx.beginPath(); ctx.arc(h.x, h.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = last ? '#11152e' : 'rgba(17,21,46,.6)'; ctx.lineWidth = last ? 2.5 : 1.2;
    ctx.stroke();
    ctx.fillStyle = '#11152e';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(i + 1, h.x, h.y + 0.5);
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

// 右のカウント表示
function drawCount() {
  if (state === 'menu') return;
  const x = batterHand === 'L' ? 27 : 307, y = 322, w = 86, h = 72;   // 打者と重ならない側に出す
  ctx.fillStyle = COL.panel;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 9); ctx.fill();
  ctx.strokeStyle = COL.panelEdge; ctx.lineWidth = 1.5; ctx.stroke();
  const rows = [['B', balls, 3, '#3ddc84'], ['S', strikes, 2, '#ffd23f'], ['O', outs, 2, '#ff4d4d']];
  rows.forEach(([label, n, max, col], i) => {
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
// バットは立体で動かして、画面に映したときの形を計算する
//   turn = 体のまわりを回る向き / lift = バットの立ち具合 / hx,hy = 手の位置
const POSE_READY   = { turn: -2.3, lift: 1.05, hx: 134, hy: 346 };   // 構え：肩の上でバットを立てる
const POSE_CONTACT = { turn: 0.0,  lift: 0.04, hx: 142, hy: 372 };   // 打つ瞬間：バットが水平にゾーンを横切る
const POSE_FINISH  = { turn: 3.0,  lift: 0.85, hx: 104, hy: 330 };   // フォロースルー：肩に巻きつく
const BAT_L = 150;

function swingPose(now) {
  if (swingAt === null || now < swingAt) {
    const w = Math.sin(now / 220) * 0.06;
    return { ...POSE_READY, turn: POSE_READY.turn + w };
  }
  const t = now - swingAt;
  const T1 = 55, T2 = 230;
  if (t < T1) return mixPose(POSE_READY, POSE_CONTACT, (t / T1) ** 2);
  if (t < T2) return mixPose(POSE_CONTACT, POSE_FINISH, 1 - (1 - (t - T1) / (T2 - T1)) ** 2);
  return POSE_FINISH;
}
function mixPose(a, b, k) {
  return { turn: a.turn + (b.turn - a.turn) * k, lift: a.lift + (b.lift - a.lift) * k, hx: a.hx + (b.hx - a.hx) * k, hy: a.hy + (b.hy - a.hy) * k };
}
function batTip(p) {
  return {
    dx: BAT_L * Math.cos(p.turn) * Math.cos(p.lift),
    dy: -BAT_L * Math.sin(p.lift) - BAT_L * Math.sin(p.turn) * Math.cos(p.lift) * 0.35,
  };
}

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

function drawBatterBody(now) {
  const c = TEAMS[batTeam()];
  const pose = swingPose(now);
  const t = swingAt === null ? 0 : Math.min(1, (now - swingAt) / 230);
  const twist = t * 10;                                // 振ると体が少し前に回る

  // 足元の影
  ctx.fillStyle = 'rgba(90,40,20,.45)';
  ctx.beginPath(); ctx.ellipse(86, 520, 64, 13, 0, 0, Math.PI * 2); ctx.fill();

  // 足（白いズボン＋チーム色のライン、ソックス、スパイク）
  limb([[70, 402], [52, 452], [50, 500]], 24, '#f4eee6');
  limb([[100 + twist * 0.3, 402], [120 + twist, 446], [106 + twist * 0.5, 500]], 24, '#f4eee6');
  limb([[64, 404], [46, 452]], 3, c.color);
  limb([[108 + twist * 0.3, 404], [128 + twist, 446]], 3, c.color);
  limb([[50, 474], [50, 500]], 20, c.color);
  limb([[106 + twist * 0.5, 474], [106 + twist * 0.5, 500]], 20, c.color);
  ctx.fillStyle = '#3b3f52';
  ctx.beginPath(); ctx.roundRect(30, 500, 44, 15, 6); ctx.fill();
  ctx.beginPath(); ctx.roundRect(88 + twist * 0.5, 504, 46, 15, 6); ctx.fill();
  ctx.fillStyle = '#f4eee6';
  ctx.fillRect(32, 512, 40, 3); ctx.fillRect(90 + twist * 0.5, 516, 42, 3);

  // 体（ユニフォーム）
  ctx.fillStyle = c.color;
  ctx.beginPath();
  ctx.moveTo(60, 340); ctx.lineTo(112 + twist, 332); ctx.lineTo(110 + twist * 0.6, 400); ctx.lineTo(64, 404);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = c.dark;                               // ベルト
  ctx.fillRect(64, 396, 46 + twist * 0.6, 7);
  ctx.fillStyle = '#f4eee6';                            // 胸のライン
  ctx.beginPath(); ctx.moveTo(96 + twist, 336); ctx.lineTo(102 + twist, 335); ctx.lineTo(92 + twist * 0.6, 396); ctx.lineTo(86 + twist * 0.6, 396); ctx.closePath(); ctx.fill();

  // バット
  const hx = pose.hx, hy = pose.hy;
  const { dx, dy } = batTip(pose);
  const blen = Math.hypot(dx, dy) || 1;
  const ux = dx / blen, uy = dy / blen, nx = -uy, ny = ux;
  const gripW = 3.5, barrelW = 7.5;
  ctx.fillStyle = '#f2b84b';
  ctx.beginPath();
  ctx.moveTo(hx + nx * gripW, hy + ny * gripW);
  ctx.lineTo(hx + dx * 0.4 + nx * barrelW * 0.75, hy + dy * 0.4 + ny * barrelW * 0.75);
  ctx.lineTo(hx + dx + nx * barrelW, hy + dy + ny * barrelW);
  ctx.arc(hx + dx, hy + dy, barrelW, Math.atan2(ny, nx), Math.atan2(-ny, -nx));
  ctx.lineTo(hx + dx * 0.4 - nx * barrelW * 0.75, hy + dy * 0.4 - ny * barrelW * 0.75);
  ctx.lineTo(hx - nx * gripW, hy - ny * gripW);
  ctx.closePath(); ctx.fill();
  limb([[hx - ux * 8, hy - uy * 8], [hx + dx * 0.18, hy + dy * 0.18]], 6, '#3b2a1e');   // グリップ

  // 振っている途中はバットの通り道をうっすら残す
  if (swingAt !== null && now >= swingAt && now - swingAt < 160) {
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 14; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k <= 6; k++) {
      const p2 = swingPose(now - k * 12);
      const tip = batTip(p2);
      if (k === 0) ctx.moveTo(p2.hx + tip.dx, p2.hy + tip.dy); else ctx.lineTo(p2.hx + tip.dx, p2.hy + tip.dy);
    }
    ctx.stroke();
  }

  // 腕（そで＝チーム色、ひじから先＝肌）
  const sh1 = [72, 346], sh2 = [106 + twist, 342];
  for (const sh of [sh1, sh2]) {
    const el = [(sh[0] + hx) / 2 - 4, (sh[1] + hy) / 2 + 10];
    limb([sh, el], 15, c.color);
    limb([el, [hx, hy]], 11, COL.skin);
  }
  // 手袋
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(hx - 2, hy + 3, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + 4, hy - 4, 8, 0, Math.PI * 2); ctx.fill();

  // 頭（顔・髪・ヘルメット）
  const fx = 92 + twist * 0.4, fy = 318;
  ctx.fillStyle = COL.hair;
  ctx.beginPath(); ctx.arc(fx - 10, fy + 6, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COL.skin;
  ctx.beginPath(); ctx.arc(fx + 4, fy + 6, 17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b211d';
  ctx.beginPath(); ctx.ellipse(fx + 13, fy + 4, 2.2, 3.6, 0, 0, Math.PI * 2); ctx.fill();   // 目
  ctx.fillStyle = c.color;
  ctx.beginPath(); ctx.arc(fx - 2, fy - 2, 27, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();   // ヘルメット
  ctx.fillRect(fx - 29, fy - 4, 54, 6);
  ctx.beginPath(); ctx.ellipse(fx + 26, fy + 1, 13, 4.5, -0.1, 0, Math.PI * 2); ctx.fill();   // つば
  ctx.fillStyle = c.dark;
  ctx.beginPath(); ctx.arc(fx - 16, fy + 8, 10, 0, Math.PI * 2); ctx.fill();   // 耳あて
  ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
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
