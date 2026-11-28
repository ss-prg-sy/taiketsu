// 画面の表示：スコアボード・結果の文字・下の案内

// スコアボード（UIイメージの画像に合わせた紺色のパネル）
function drawBoard() {
  if (state === 'menu') return;
  const x = 64, y = 33, w = 293, h = 62;
  glossPanel(x, y, w, h, 12);

  ctx.textBaseline = 'middle';
  for (let t = 0; t < 2; t++) {
    const ry = y + 17 + t * 28;
    ctx.fillStyle = TEAMS[t].color === '#c0392b' ? '#e5453f' : '#3a8ef0';
    ctx.fillRect(x + 11, ry - 9, 5, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(shortName(t), x + 24, ry + 1);
    if (batTeam() === t) {   // 攻撃中のチームに小さい三角
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.moveTo(x + 86, ry - 4); ctx.lineTo(x + 92, ry); ctx.lineTo(x + 86, ry + 4); ctx.closePath(); ctx.fill();
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(String(runs[t]), x + 120, ry + 1);
  }
  ctx.strokeStyle = 'rgba(201,211,255,.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + 24, y + 31); ctx.lineTo(x + 122, y + 31); ctx.stroke();
  ctx.strokeStyle = '#c9d3ff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x + 133, y + 9); ctx.lineTo(x + 133, y + 53); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 213, y + 15); ctx.lineTo(x + 213, y + 47); ctx.stroke();

  // 回
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`${inning}回${half === 0 ? '表' : '裏'}`, x + 143, y + 13);
  // B S O
  ctx.font = 'bold 10px system-ui, sans-serif';
  countRows().forEach(({ label, n, max, col }, i) => {
    const ry = y + 29 + i * 11;
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
    ctx.fillText(label, x + 143, ry + 0.5);
    for (let k = 0; k < max; k++) {
      ctx.fillStyle = k < n ? col : '#3a4066';
      ctx.beginPath(); ctx.arc(x + 160 + k * 12, ry, 4.3, 0, Math.PI * 2); ctx.fill();
    }
  });
  // ランナー（ひし形）
  const cx = x + 252, cy = y + 31, d = 17;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cy + d); ctx.lineTo(cx + d, cy); ctx.lineTo(cx, cy - d); ctx.lineTo(cx - d, cy); ctx.closePath(); ctx.stroke();
  [[cx + d, cy], [cx, cy - d], [cx - d, cy]].forEach(([bx, by], i) => {
    if (!bases[i]) return;
    ctx.save();
    ctx.translate(bx, by); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  });
}

// 結果の大きい文字（ポンと飛び出すように出る）
function drawMessage(now, wide) {
  if (!msg || now < msgAt) return;
  const y1 = wide ? 136 : 150, y2 = wide ? 174 : 188;
  const isHR = msg.startsWith('ホームラン');
  const t0 = Math.max(msgAt, phaseStart);
  const k = Math.min(1, (now - t0) / 220);
  const pop = 1 + 0.7 * (1 - k) * (1 - k);
  const size = isHR ? 50 : 40;

  ctx.save();
  ctx.translate(W / 2, y1); ctx.scale(pop, pop);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `900 ${size}px system-ui, sans-serif`;
  const w = ctx.measureText(msg).width;
  if (w > 390) ctx.font = `900 ${Math.floor(size * 390 / w)}px system-ui, sans-serif`;
  ctx.lineJoin = 'round';
  ctx.lineWidth = isHR ? 10 : 7; ctx.strokeStyle = '#161a36';
  ctx.strokeText(msg, 0, 0);
  if (isHR) {
    const g = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
    g.addColorStop(0, '#fff3a0'); g.addColorStop(0.5, '#ffd23f'); g.addColorStop(1, '#ff9d2e');
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = msgColor;
  }
  ctx.fillText(msg, 0, 0);
  ctx.restore();

  if (msgSub) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5; ctx.strokeStyle = '#161a36';
    ctx.strokeText(msgSub, W / 2, y2);
    ctx.fillStyle = '#fff';
    ctx.fillText(msgSub, W / 2, y2);
  }
}

// 投げた球と、打者の読みの答え合わせ（画面の下に出す）
function pitchInfo() {
  const c = courseRead();
  const read = (guess < 0 ? '球種：張らず' : `球種：${PITCHES[guess].name}` + (guess === PITCHES.indexOf(pitch) ? '◎' : '×'))
    + '　' + (c === null ? 'コース：張らず' : c === 'hit' ? 'コース◎' : c === 'near' ? 'コース△' : 'コース×');
  const who = mode === 2 ? '打者の読み' : humanBats() ? 'あなたの読み' : 'CPUの読み';
  return { pitchText: `${pitch.name}　${speed} km/h`, readText: `${who}　${read}` };
}

// 画面の下に出す案内（スマホは指で押すのでパネルの場所に出す）
let lastHint = null;
function updateHint() {
  const el = document.getElementById('hint');
  let html = '';
  if (state === 'windup' || state === 'pitch') html = humanBats() ? '👆 画面をタップでスイング！' : 'CPUが打ちます…';
  else if (state === 'result' && speed) {
    const i = pitchInfo();
    html = `<span class="pdot" style="background:${PCOLORS[PITCHES.indexOf(pitch)]}"></span>${i.pitchText}<br><span class="read">${i.readText}</span>`;
  }
  if (html !== lastHint) { el.innerHTML = html || '&nbsp;'; lastHint = html; }
  el.style.display = (state === 'aim' || state === 'guess') ? 'none' : '';
}
