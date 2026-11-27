// 画面の表示：スコアボード・結果の文字・下の案内

// スコアボード
function drawBoard() {
  if (state === 'menu') return;
  ctx.fillStyle = 'rgba(8,12,28,.88)';
  ctx.beginPath(); ctx.roundRect(62, 36, 296, 66, 8); ctx.fill();
  ctx.strokeStyle = '#4a5070'; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.textBaseline = 'middle';
  for (let t = 0; t < 2; t++) {
    const y = 56 + t * 26;
    ctx.fillStyle = TEAMS[t].color;
    ctx.fillRect(72, y - 7, 6, 14);
    ctx.fillStyle = batTeam() === t ? '#fff' : '#99a';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(shortName(t) + (batTeam() === t ? ' ▶' : ''), 84, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(runs[t], 182, y);
  }
  // 回
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(`${inning}回${half === 0 ? '表' : '裏'}`, 216, 56);
  // B S O
  const rows = [['B', balls, 3, '#3ddc84'], ['S', strikes, 2, '#ffd23f'], ['O', outs, 2, '#ff5a5a']];
  ctx.font = 'bold 11px system-ui, sans-serif';
  rows.forEach(([label, n, max, col], i) => {
    const y = 72 + i * 10;
    ctx.fillStyle = '#aab'; ctx.textAlign = 'left';
    ctx.fillText(label, 196, y);
    for (let k = 0; k < max; k++) {
      ctx.fillStyle = k < n ? col : '#2a2f45';
      ctx.beginPath(); ctx.arc(212 + k * 11, y, 4, 0, Math.PI * 2); ctx.fill();
    }
  });
  // ミニダイヤモンド（ランナー）
  const cx = 310, cy = 70;
  const pts = [[cx + 16, cy], [cx, cy - 16], [cx - 16, cy]];
  ctx.strokeStyle = '#667'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy + 16); ctx.lineTo(cx + 16, cy); ctx.lineTo(cx, cy - 16); ctx.lineTo(cx - 16, cy); ctx.closePath(); ctx.stroke();
  pts.forEach(([x, y], i) => {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = bases[i] ? '#ffd23f' : '#2a2f45';
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  });
}

function drawMessage(now, wide) {
  if (!msg || now < msgAt) return;
  const y1 = wide ? 136 : 262, y2 = wide ? 172 : 300;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 40px system-ui, sans-serif';
  const w = ctx.measureText(msg).width;
  if (w > 380) ctx.font = `bold ${Math.floor(40 * 380 / w)}px system-ui, sans-serif`;
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,.75)';
  ctx.strokeText(msg, W / 2, y1);
  ctx.fillStyle = msgColor;
  ctx.fillText(msg, W / 2, y1);
  if (msgSub) {
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.lineWidth = 4;
    ctx.strokeText(msgSub, W / 2, y2);
    ctx.fillStyle = '#fff';
    ctx.fillText(msgSub, W / 2, y2);
  }
  if (wide) return;
  // 投げた球種と速さ
  if (state === 'result' && speed) {
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.lineWidth = 3;
    const t = `${pitch.name}　${speed} km/h`;
    ctx.strokeText(t, W - 10, 94);
    ctx.fillStyle = PCOLORS[PITCHES.indexOf(pitch)];
    ctx.fillText(t, W - 10, 94);
    // バッターの狙い球（答え合わせ）
    const c = courseRead();
    const g = (guess < 0 ? '球種：張らず' : `球種：${PITCHES[guess].name}` + (guess === PITCHES.indexOf(pitch) ? '◎' : '×'))
      + '　' + (c === null ? 'コース：張らず' : c === 'hit' ? 'コース◎' : c === 'near' ? 'コース△' : 'コース×');
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.strokeText((mode === 2 ? '' : humanBats() ? 'あなたの読み ' : 'CPUの読み ') + g, W - 10, 113);
    ctx.fillStyle = (guess === PITCHES.indexOf(pitch) || c === 'hit') ? '#ffd23f' : '#ddd';
    const who = mode === 2 ? '' : humanBats() ? 'あなたの読み ' : 'CPUの読み ';
    ctx.fillText(who + g, W - 10, 113);
  }
}

// 画面の下に出す案内（スマホは指で押すのでパネルの場所に出す）
let lastHint = null;
function updateHint() {
  let t = '';
  if (state === 'windup' || state === 'pitch') t = humanBats() ? '👆 画面をタップでスイング！' : 'CPUが打ちます…';
  else if (state === 'result') t = '　';
  if (t !== lastHint) { document.getElementById('hint').textContent = t; lastHint = t; }
  document.getElementById('hint').style.display = (state === 'aim' || state === 'guess') ? 'none' : '';
}

function drawHelp() {
  if (state === 'windup' || state === 'pitch') {
    const t = humanBats() ? 'タップ / スペースで スイング！' : 'CPUが打ちます…';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.6)';
    ctx.strokeText(t, W / 2, 620);
    ctx.fillStyle = '#fff';
    ctx.fillText(t, W / 2, 620);
  }
}
