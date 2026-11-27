// 描画（近い視点）：投手と打者の対決の画面

// =====================================================
//  描画
// =====================================================

function drawField() {
  let g = ctx.createLinearGradient(0, 0, 0, 200);
  g.addColorStop(0, '#081233'); g.addColorStop(1, '#23447f');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 200);
  for (const lx of [30, 390]) {
    ctx.fillStyle = 'rgba(255,255,220,.25)';
    ctx.beginPath(); ctx.arc(lx, 30, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fffbe0'; ctx.fillRect(lx - 12, 25, 24, 10);
    ctx.fillStyle = '#556'; ctx.fillRect(lx - 2, 35, 4, 75);
  }
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = `hsl(232, 22%, ${15 + i * 5}%)`;
    ctx.fillRect(0, 108 + i * 17, W, 17);
  }
  for (const c of crowd) { ctx.fillStyle = c.col; ctx.fillRect(c.x, c.y, 3, 3); }
  g = ctx.createLinearGradient(0, 190, 0, 212);
  g.addColorStop(0, '#2f8550'); g.addColorStop(1, '#0f3a1f');
  ctx.fillStyle = g; ctx.fillRect(0, 190, W, 22);
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(0, 190, W, 3);
  g = ctx.createLinearGradient(0, 212, 0, H);
  g.addColorStop(0, '#1d6531'); g.addColorStop(1, '#4cc068');
  ctx.fillStyle = g; ctx.fillRect(0, 212, W, H - 212);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 212, W, H - 212); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  for (let i = -14; i < 14; i += 2) {
    ctx.beginPath();
    ctx.moveTo(210, 120);
    ctx.lineTo(210 + i * 55, H + 300);
    ctx.lineTo(210 + (i + 1) * 55, H + 300);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  g = ctx.createLinearGradient(0, 240, 0, H);
  g.addColorStop(0, '#9a6537'); g.addColorStop(1, '#d9a068');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(210, 240); ctx.lineTo(W, 400); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.lineTo(0, 400);
  ctx.closePath(); ctx.fill();
  g = ctx.createLinearGradient(0, 262, 0, 520);
  g.addColorStop(0, '#26793c'); g.addColorStop(1, '#45b45f');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(210, 262); ctx.lineTo(318, 368); ctx.lineTo(210, 520); ctx.lineTo(102, 368);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  for (const fx of [22, 398]) {
    ctx.beginPath();
    ctx.moveTo(208, 600); ctx.lineTo(212, 600);
    ctx.lineTo(fx + 0.6, 212); ctx.lineTo(fx - 0.6, 212);
    ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
  ctx.strokeRect(112, 548, 58, 80);
  ctx.strokeRect(250, 548, 58, 80);
  for (const [bx, by, s] of [[210, 258, 0.6], [322, 368, 0.85], [98, 368, 0.85]]) {
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.fillRect(bx - 6 * s, by - 1, 12 * s, 5 * s);
    ctx.fillStyle = '#fff';
    ctx.fillRect(bx - 6 * s, by - 4 * s, 12 * s, 5 * s);
  }
  ctx.fillStyle = '#aaa';
  ctx.beginPath();
  ctx.moveTo(180, 601); ctx.lineTo(240, 601); ctx.lineTo(240, 615); ctx.lineTo(210, 630); ctx.lineTo(180, 615);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(180, 595); ctx.lineTo(240, 595); ctx.lineTo(240, 610); ctx.lineTo(210, 625); ctx.lineTo(180, 610);
  ctx.closePath(); ctx.fill();
  g = ctx.createRadialGradient(210, 300, 4, 210, 305, 36);
  g.addColorStop(0, '#d29a62'); g.addColorStop(1, '#8f5d32');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(210, 305, 36, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(204, 301, 12, 2);
}

function drawShadow(x, y, rx, alpha) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.32, 0, 0, Math.PI * 2); ctx.fill();
}

// 小さい選手（守備・ランナー）
function drawPerson(x, y, s, team) {
  const c = TEAMS[team];
  drawShadow(x + 2 * s, y, 9 * s, 0.3);
  ctx.fillStyle = '#eee';
  ctx.fillRect(x - 5 * s, y - 9 * s, 4 * s, 9 * s);
  ctx.fillRect(x + 1 * s, y - 9 * s, 4 * s, 9 * s);
  const g = ctx.createLinearGradient(x - 6 * s, 0, x + 6 * s, 0);
  g.addColorStop(0, c.light); g.addColorStop(1, c.dark);
  ctx.fillStyle = g;
  ctx.fillRect(x - 6 * s, y - 25 * s, 12 * s, 17 * s);
  ctx.fillStyle = '#f3c9a0';
  ctx.beginPath(); ctx.arc(x, y - 29 * s, 4.5 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = c.dark;
  ctx.fillRect(x - 5 * s, y - 35 * s, 10 * s, 4 * s);
}

function drawFielders() {
  ctx.globalAlpha = 0.55;     // 守備は控えめに
  const ft = fieldTeam();
  for (const [x, y] of OF) drawPerson(x, y, 0.6, ft);
  for (const [x, y] of IF) drawPerson(x, y, 0.8, ft);
  ctx.globalAlpha = 1;
}

// この打席の配球（球種ごとの色の点＋何球目か）
function drawHistory() {
  history.forEach((h, i) => {
    if (!h.done) return;
    const last = i === history.length - 1;
    ctx.fillStyle = PCOLORS[h.pi];
    ctx.globalAlpha = last ? 1 : 0.75;
    ctx.beginPath(); ctx.arc(h.x, h.y, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = last ? '#000' : 'rgba(0,0,0,.6)'; ctx.lineWidth = last ? 2 : 1;
    ctx.stroke();
    ctx.fillStyle = '#111';
    ctx.font = 'bold 8px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(i + 1, h.x, h.y + 0.5);
  });
}

// バッターが待っているコース（輪っか）
function drawWaitSpot() {
  if (!waitSpot) return;
  const during = (state === 'windup' || state === 'pitch') && humanBats();
  if (!during && state !== 'result') return;
  const c = state === 'result' ? courseRead() : null;
  ctx.strokeStyle = c === 'hit' ? '#ffd23f' : c === 'miss' ? 'rgba(255,255,255,.6)' : 'rgba(255,210,63,.85)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.arc(waitSpot.x, waitSpot.y, WAIT_NEAR, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)';
  ctx.strokeText('待ち', waitSpot.x, waitSpot.y - WAIT_NEAR - 1);
  ctx.fillStyle = '#ffd23f';
  ctx.fillText('待ち', waitSpot.x, waitSpot.y - WAIT_NEAR - 1);
}

// 大きいカウント表示（右下）
function drawCount() {
  if (state === 'menu') return;
  const x = 318, y = 372;
  ctx.fillStyle = 'rgba(8,12,28,.75)';
  ctx.beginPath(); ctx.roundRect(x, y, 92, 82, 10); ctx.fill();
  const rows = [['B', balls, 3, '#3ddc84'], ['S', strikes, 2, '#ffd23f'], ['O', outs, 2, '#ff5a5a']];
  rows.forEach(([label, n, max, col], i) => {
    const ry = y + 16 + i * 25;
    ctx.fillStyle = '#ccd';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 10, ry);
    for (let k = 0; k < max; k++) {
      ctx.fillStyle = k < n ? col : '#2a2f45';
      ctx.beginPath(); ctx.arc(x + 38 + k * 19, ry, 7.5, 0, Math.PI * 2); ctx.fill();
    }
  });
}

function drawRunners() {
  const b = prevBases || bases;    // 打った直後は、まだ打つ前の位置
  for (let i = 0; i < 3; i++) {
    if (b[i]) drawPerson(RUNNER_POS[i][0], RUNNER_POS[i][1], 0.85, batTeam());
  }
}

function drawPitcher(now) {
  const x = 210, y = 303, c = TEAMS[fieldTeam()];
  let armUp = 0;
  if (state === 'windup') armUp = Math.min(1, Math.max(0, (now - phaseStart) / WINDUP));
  drawShadow(x + 4, y, 10, 0.35);
  ctx.fillStyle = '#eee';
  ctx.fillRect(x - 5, y - 8, 4, 8);
  ctx.fillRect(x + 1, y - 8, 4, 8);
  ctx.fillStyle = c.color;
  ctx.fillRect(x - 5, y - 26, 10, 18);
  ctx.fillStyle = c.dark;
  ctx.beginPath(); ctx.arc(x, y - 31, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = c.color; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 22);
  ctx.lineTo(x + 9, y - 22 - armUp * 12);
  ctx.stroke();
  if (state === 'windup' && now >= phaseStart) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + 9, y - 23 - armUp * 12, 2, 0, Math.PI * 2); ctx.fill();
  }
}

function drawZone() {
  ctx.strokeStyle = 'rgba(255,255,255,.75)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.strokeRect(HIT.x - ZW / 2, HIT.y - ZH / 2, ZW, ZH);
  ctx.setLineDash([]);
}

// ピッチャーがコースを選ぶときのガイド
function drawAimGuide() {
  if (state !== 'aim' && state !== 'guess') return;
  ctx.fillStyle = 'rgba(120,200,255,.10)';
  ctx.fillRect(HIT.x - AIM_W / 2, HIT.y - AIM_H / 2, AIM_W, AIM_H);
  ctx.strokeStyle = 'rgba(120,200,255,.6)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(HIT.x - AIM_W / 2, HIT.y - AIM_H / 2, AIM_W, AIM_H);
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.fillRect(HIT.x - ZW / 2, HIT.y - ZH / 2, ZW, ZH);
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(HIT.x - ZW / 2 + ZW * i / 3, HIT.y - ZH / 2); ctx.lineTo(HIT.x - ZW / 2 + ZW * i / 3, HIT.y + ZH / 2);
    ctx.moveTo(HIT.x - ZW / 2, HIT.y - ZH / 2 + ZH * i / 3); ctx.lineTo(HIT.x + ZW / 2, HIT.y - ZH / 2 + ZH * i / 3);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(160,220,255,.9)';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('ボールゾーン', HIT.x, HIT.y - AIM_H / 2 - 2);
  if (hover && Math.abs(hover.x - HIT.x) <= AIM_W / 2 + 10 && Math.abs(hover.y - HIT.y) <= AIM_H / 2 + 10) {
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(hover.x, hover.y, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hover.x - 15, hover.y); ctx.lineTo(hover.x + 15, hover.y);
    ctx.moveTo(hover.x, hover.y - 15); ctx.lineTo(hover.x, hover.y + 15);
    ctx.stroke();
  }
}

function drawBall(x, y, r) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#ececec'); g.addColorStop(1, '#8d8d8d');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  if (r > 6) {
    ctx.strokeStyle = '#d33'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x - r * 0.9, y, r * 0.6, -0.9, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + r * 0.9, y, r * 0.6, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
  }
}

function drawPitchedBall(now) {
  if (state !== 'pitch') return;
  const p = (now - phaseStart) / travel;
  const b = ballPos(p);
  if (p <= 1) drawShadow(b.x, b.hzy + (aim.y + 62 - b.hzy) * b.s, b.r, 0.28);
  for (const [dp, al] of [[0.06, 0.15], [0.03, 0.3]]) {
    if (p - dp < 0) continue;
    const t = ballPos(p - dp);
    ctx.globalAlpha = al;
    drawBall(t.x, t.y, t.r);
    ctx.globalAlpha = 1;
  }
  drawBall(b.x, b.y, b.r);
}

// ---- バッター ----
const POSE_READY   = { turn: -2.0, lift: 1.1,  hx: 114, hy: 520 };
const POSE_CONTACT = { turn: 0.0,  lift: 0.05, hx: 150, hy: 510 };
const POSE_FINISH  = { turn: 3.0,  lift: 0.85, hx: 118, hy: 498 };

function swingPose(now) {
  if (swingAt === null || now < swingAt) {
    const w = Math.sin(now / 220) * 0.08;
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
  const L = 112;
  return {
    dx: L * Math.cos(p.turn) * Math.cos(p.lift),
    dy: -L * Math.sin(p.lift) - L * Math.sin(p.turn) * Math.cos(p.lift) * 0.35,
  };
}

function drawBatter(now) {
  const c = TEAMS[batTeam()];
  const px = 140, py = 560;
  drawShadow(px - 32, py + 38, 42, 0.35);
  ctx.fillStyle = '#e8e8ee';
  ctx.fillRect(px - 52, py + 10, 13, 28);
  ctx.fillRect(px - 31, py + 10, 13, 28);
  ctx.fillStyle = '#222';
  ctx.fillRect(px - 54, py + 34, 16, 6);
  ctx.fillRect(px - 32, py + 34, 16, 6);
  let g = ctx.createLinearGradient(px - 54, 0, px - 16, 0);
  g.addColorStop(0, c.light); g.addColorStop(0.5, c.color); g.addColorStop(1, c.dark);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.roundRect(px - 54, py - 42, 38, 56, 12); ctx.fill();
  g = ctx.createRadialGradient(px - 41, py - 60, 2, px - 35, py - 52, 17);
  g.addColorStop(0, c.light); g.addColorStop(0.5, c.color); g.addColorStop(1, c.dark);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(px - 35, py - 52, 17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = c.dark;
  ctx.beginPath(); ctx.ellipse(px - 20, py - 46, 9, 4, 0.3, 0, Math.PI * 2); ctx.fill();

  const pose = swingPose(now);
  const hx = pose.hx, hy = pose.hy;
  const { dx, dy } = batTip(pose);
  const tx = hx + dx, ty = hy + dy;

  ctx.strokeStyle = c.color; ctx.lineCap = 'round'; ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(px - 46, py - 32); ctx.lineTo(hx, hy);
  ctx.moveTo(px - 24, py - 32); ctx.lineTo(hx, hy);
  ctx.stroke();

  const blen = Math.hypot(dx, dy) || 1;
  const ux = dx / blen, uy = dy / blen;
  const nx = -uy, ny = ux;
  const gripW = 2.5, barrelW = 6;
  const g2 = ctx.createLinearGradient(hx + nx * barrelW, hy + ny * barrelW, hx - nx * barrelW, hy - ny * barrelW);
  g2.addColorStop(0, '#f5d49a'); g2.addColorStop(0.5, '#d9a35b'); g2.addColorStop(1, '#8a5a2b');
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.moveTo(hx + nx * gripW, hy + ny * gripW);
  ctx.lineTo(hx + dx * 0.45 + nx * barrelW * 0.8, hy + dy * 0.45 + ny * barrelW * 0.8);
  ctx.lineTo(tx + nx * barrelW, ty + ny * barrelW);
  ctx.arc(tx, ty, barrelW, Math.atan2(ny, nx), Math.atan2(-ny, -nx));
  ctx.lineTo(hx + dx * 0.45 - nx * barrelW * 0.8, hy + dy * 0.45 - ny * barrelW * 0.8);
  ctx.lineTo(hx - nx * gripW, hy - ny * gripW);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(hx - ux * 6, hy - uy * 6);
  ctx.lineTo(hx + dx * 0.22, hy + dy * 0.22);
  ctx.stroke();
  ctx.lineCap = 'butt';

  if (swingAt !== null && now - swingAt < 160 && now >= swingAt) {
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k <= 6; k++) {
      const p2 = swingPose(now - k * 12);
      const tip = batTip(p2);
      if (k === 0) ctx.moveTo(p2.hx + tip.dx, p2.hy + tip.dy); else ctx.lineTo(p2.hx + tip.dx, p2.hy + tip.dy);
    }
    ctx.stroke();
    ctx.lineCap = 'butt';
  }
  ctx.fillStyle = '#eee';
  ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.fill();
}

function drawFlight(now) {
  if (!flight) return;
  const t = Math.min(1, (now - flight.t0) / flight.dur);
  const x = flight.x0 + (flight.tx - flight.x0) * t;
  const y = flight.y0 + (flight.ty - flight.y0) * t - Math.sin(Math.PI * t) * flight.arc;
  const r = flight.r0 + (Math.max(2, flight.kind === 'POP' ? 6 : 2) - flight.r0) * t;
  const gy = flight.y0 + 60 + (flight.ty + 20 - flight.y0 - 60) * t;
  if (gy > 214) drawShadow(x, gy, Math.max(2, r * 0.9), 0.3);
  if (t < 1 || flight.ty < 200) drawBall(x, y, r);
}

function drawVignette() {
  const g = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.3, W / 2, H * 0.55, H * 0.8);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.5)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
