// 試合の流れ：攻守交代・投球・スイングの判定・打球の結果・ランナーの進み方

// =====================================================
//  試合の流れ
// =====================================================

function startGame(m) {
  mode = m;
  inning = 1;
  runs = [0, 0];
  show('menu', false); show('end', false);
  startHalf(0);
}

function startHalf(h) {
  half = h;
  outs = 1; bases = [false, true, true]; balls = 0; strikes = 0;
  batterDone = false; flight = null; msg = ''; history = [];
  newBatter();
  state = 'intro';
  show('panel', false); show('guessPanel', false);
  document.getElementById('introTitle').textContent = `${inning}回${half === 0 ? '表' : '裏'}${inning > 1 ? '（延長）' : ''}`;
  document.getElementById('introTeam').textContent = `${teamName(batTeam())} の攻撃`;
  let role;
  if (mode === 1) {
    role = humanBats()
      ? 'あなたはバッター：ボールが来たらタップ！'
      : 'あなたはピッチャー：球種とコースを選んで投げよう';
  } else {
    role = `バッター：${teamName(batTeam())}　／　ピッチャー：${teamName(fieldTeam())}`;
  }
  document.getElementById('introRole').textContent = role;
  document.getElementById('introScore').textContent =
    `${teamName(0)} ${runs[0]} － ${runs[1]} ${teamName(1)}` + (half === 1 ? `（${runs[0] - runs[1] + 1}点取ったらサヨナラ）` : '');
  show('intro', true);
}

function nextPitch() {
  swingAt = null; swungMiss = false; cpuSwingAt = null;
  flight = null; msg = ''; msgSub = '';
  guess = -1; waitSpot = null;
  selectGuess(-1);
  if (humanPitches()) {
    state = 'aim';
    show('panel', true);
  } else if (humanBats()) {
    openGuess();          // 1人用でバッターのとき：先に狙い球を選ぶ
  } else {
    cpuChoosePitch();
    startWindup();
  }
}

function openGuess() {
  state = 'guess';
  updateHandBtn();
  document.getElementById('guessLabel').textContent =
    `${mode === 2 ? teamName(batTeam()) + '：' : ''}① 狙い球 → ② 待つコースをなぞって離す（枠の外＝張らない）`;
  show('guessPanel', true);
}

// 狙い球ボタンを押したとき（選ぶだけ。投球はコースをタップしてから）
function selectGuess(i) {
  guess = i;
  [...document.getElementById('guessButtons').children].forEach((c, k) => c.classList.toggle('sel', k === i + 1));
}

// 待つコースをタップしたら投球開始
function startBatting(spot) {
  waitSpot = spot;
  show('guessPanel', false);
  if (!humanPitches()) cpuChoosePitch();   // CPUピッチャーはここで球を決める（狙いは見ていない）
  startWindup();
}

// CPUバッターの狙い球（ストレート狙いが多め、追い込まれると狙わない）
function cpuGuess() {
  // 待つコース：半分くらいは張る。前の球と同じあたりを待つことも多い
  waitSpot = null;
  if (Math.random() < 0.55) {
    const last = history[history.length - 1];
    if (last && Math.random() < 0.4) waitSpot = { x: last.x, y: last.y };
    else waitSpot = { x: HIT.x + rand(-0.4, 0.4) * ZW, y: HIT.y + rand(-0.4, 0.4) * ZH };
  }
  if (strikes === 2 && Math.random() < 0.6) return -1;
  const r = Math.random();
  if (r < 0.35) return 0;
  if (r < 0.55) return -1;
  return 1 + Math.floor(Math.random() * 4);
}

// 狙いが当たれば打ちやすく、外れると打ちにくい（ズレのミリ秒に足す）
function guessBonus() {
  let b = 0;
  if (guess >= 0) b += guess === PITCHES.indexOf(pitch) ? -28 : 30;
  const c = courseRead();
  if (c === 'hit') b -= 28;
  if (c === 'miss') b += 28;
  return b;
}

// 読みの当たり外れで「バットに当たる範囲」が変わる（ミリ秒）
// 次の打者の右左を決める（CPUは投手と反対側が多め）
function newBatter() {
  if (humanBats()) { batterHand = batHandPref[batTeam()]; return; }
  const opp = pitHand() === 'R' ? 'L' : 'R';
  batterHand = Math.random() < 0.6 ? opp : pitHand();
}

function contactBonus() {
  let b = 0;
  // 右左の相性：同じ側だと逃げていくスライダー・カーブが打ちにくい、反対側だと少し見やすい
  if (batterHand === pitHand()) { if (pitch === PITCHES[1] || pitch === PITCHES[2]) b -= 12; }
  else b += 6;
  if (guess >= 0) b += guess === PITCHES.indexOf(pitch) ? 15 : -35;
  const c = courseRead();
  if (c === 'hit') b += 15;
  if (c === 'miss') b -= 35;
  return b;
}

// 待っていたコースとの近さ：'hit'＝的中、'near'＝まあまあ、'miss'＝ハズレ、null＝張っていない
function courseRead() {
  if (!waitSpot) return null;
  const d = Math.hypot(waitSpot.x - aim.x, waitSpot.y - aim.y);
  return d <= WAIT_NEAR ? 'hit' : d <= WAIT_FAR ? 'near' : 'miss';
}

function setPitchSpeed() {
  speed = Math.round(rand(pitch.min, pitch.max));
  travel = 18.44 / (speed / 3.6) * 1000 * 2.2;   // 本物より2.2倍ゆっくり
}

// 人間のピッチャーがコースをタップしたとき
function chooseAim(x, y) {
  x = Math.max(HIT.x - AIM_W / 2, Math.min(HIT.x + AIM_W / 2, x));
  y = Math.max(HIT.y - AIM_H / 2, Math.min(HIT.y + AIM_H / 2, y));
  // 少しだけ狙いがズレる（コントロールのブレ）
  aim = { x: x + gauss() * 5, y: y + gauss() * 5 };
  pitch = PITCHES[selPitch];
  setPitchSpeed();
  computeZone();
  show('panel', false); show('guessPanel', false);
  if (mode === 2) {
    state = 'handoff';
    document.getElementById('handoffTitle').textContent = `${teamName(batTeam())} の番！`;
    show('handoff', true);
  } else {
    startWindup();
  }
}

function cpuChoosePitch() {
  let r = Math.random() * PITCHES.reduce((s, p) => s + p.weight, 0);
  pitch = PITCHES[0];
  for (const p of PITCHES) { if ((r -= p.weight) < 0) { pitch = p; break; } }
  setPitchSpeed();
  const zoneRate = balls === 3 ? 0.85 : strikes === 2 ? 0.5 : 0.65;
  if (Math.random() < zoneRate) {
    aim = { x: HIT.x + rand(-0.45, 0.45) * ZW, y: HIT.y + rand(-0.45, 0.45) * ZH };
  } else {
    // ゾーンの少し外（ボール球）
    const side = Math.floor(Math.random() * 4);
    const ox = side === 0 ? -1 : side === 1 ? 1 : rand(-0.8, 0.8);
    const oy = side === 2 ? -1 : side === 3 ? 1 : rand(-0.8, 0.8);
    aim = {
      x: HIT.x + ox * rand(ZW / 2 + 6, AIM_W / 2),
      y: HIT.y + oy * rand(ZH / 2 + 6, AIM_H / 2),
    };
  }
  computeZone();
}

function computeZone() {
  const dx = Math.abs(aim.x - HIT.x), dy = Math.abs(aim.y - HIT.y);
  inZone = dx <= ZW / 2 + 3 && dy <= ZH / 2 + 3;
  corner = inZone && (dx > ZW * 0.3 || dy > ZH * 0.3);
}

function startWindup() {
  state = 'windup';
  phaseStart = performance.now() + (humanPitches() ? 0 : rand(0, 400));
  lastTrail = null;
  if (!humanBats()) { guess = cpuGuess(); cpuDecideSwing(); }
  history.push({ x: aim.x, y: aim.y, pi: PITCHES.indexOf(pitch), done: false });
}

// CPUバッターが振るかどうか・どのタイミングで振るか
function cpuDecideSwing() {
  const breaking = pitch !== PITCHES[0];
  let p = inZone ? (strikes === 2 ? 0.9 : 0.75) : (breaking ? 0.38 : 0.25) * (strikes === 2 ? 1.4 : 1);
  if (balls === 3 && !inZone) p *= 0.6;
  if (Math.random() >= p) return;
  const sd = 85 + (breaking ? 22 : 0);
  const diff = gauss() * sd;
  cpuSwingAt = phaseStart + WINDUP + travel + diff;
}

// =====================================================
//  スイングと結果
// =====================================================

function humanSwing() {
  if (!humanBats()) return;
  if (state !== 'windup' && state !== 'pitch') return;
  doSwing(performance.now());
}

function doSwing(t) {
  if (swingAt !== null) return;
  swingAt = t;
  if (state === 'windup') { swungMiss = true; return; }   // 投げる前に振った
  const diff = t - (phaseStart + travel);
  const dirDiff = batterHand === 'L' ? -diff : diff;     // 左打ちは引っぱる方向が逆（ライト方向）                // マイナス＝早い、プラス＝遅い
  // ① 当たるかどうかはタイミングで決まる（ボール球・コーナーは少し当てにくい）
  //    読みが当たるとバットに当たる範囲が広がり、外れるとせまくなる（空振りしやすい）
  const contact = Math.abs(diff) + (inZone ? 0 : 30) + (corner ? 8 : 0);
  if (contact > 125 + contactBonus()) { swungMiss = true; return; }
  // ② 当たったら、読みの当たり外れで打球の強さが変わる
  //    読みが外れても空振りにはならない（弱い当たり＝ファウルや凡打になりやすい）
  const eff = Math.max(0, Math.min(148, contact + 15 * (inZone ? 0 : 1) + guessBonus()));
  const kind = battedBall(eff);
  const from = ballPos((t - phaseStart) / travel);
  hitFlash = { t: performance.now(), x: from.x, y: from.y, big: kind === 'HR' || kind === '2B' || kind === '3B' };
  if (kind === 'FOUL') {
    startFlight(from, dirDiff, 'FOUL');
    if (strikes < 2) strikes++;
    showResult('ファウル', diff < 0 ? '早い！' : '振り遅れ！', '#ddd', 1300);
    return;
  }
  inPlay(kind, dirDiff, from);
}

// 当たりの良さ（ズレのミリ秒）から打球の種類を決める
function battedBall(e) {
  const r = Math.random();
  if (e <= 30)  return r < .32 ? 'HR' : r < .52 ? '2B' : r < .57 ? '3B' : r < .82 ? '1B' : 'FLY';
  if (e <= 65)  return r < .04 ? 'HR' : r < .12 ? '2B' : r < .40 ? '1B' : r < .70 ? 'FLY' : 'GO';
  if (e <= 105) return r < .14 ? '1B' : r < .60 ? 'GO' : r < .80 ? 'FLY' : 'POP';
  if (e <= 150) return r < .55 ? 'FOUL' : r < .82 ? 'GO' : 'POP';   // 弱い当たり
  return 'MISS';
}

function inPlay(kind, diff, from) {
  const before = outs;
  const [b1, b2, b3] = bases;
  prevBases = bases.slice();
  // 打球の方向（マイナス＝レフト側、プラス＝ライト側）
  const ang = Math.max(-0.75, Math.min(0.75, diff / 150 * 0.75 + gauss() * 0.08));
  const ofi = ang < -0.22 ? 0 : ang > 0.22 ? 2 : 1;
  const ifi = ang < -0.4 ? 0 : ang < 0 ? 1 : ang < 0.4 ? 2 : 3;
  // ランナーの動き [どこから, どこへ, アウトか]  0＝バッター、1〜3＝塁、4＝ホームイン
  const mv = [];
  let r = 0, title = '', sub = '', col = '#7fe0ff', dpThrow = null;

  switch (kind) {
    case 'HR':
      if (b1) mv.push([1, 4]); if (b2) mv.push([2, 4]); if (b3) mv.push([3, 4]);
      mv.push([0, 4]);
      r = 1 + b1 + b2 + b3;
      bases = [false, false, false];
      title = 'ホームラン！！'; sub = `${OF_NAME[ofi]}スタンドへ`; col = '#ffd23f';
      break;
    case '3B':
      if (b1) mv.push([1, 4]); if (b2) mv.push([2, 4]); if (b3) mv.push([3, 4]);
      mv.push([0, 3]);
      r = b1 + b2 + b3;
      bases = [false, false, true];
      title = 'スリーベース！';
      break;
    case '2B': {
      if (b3) mv.push([3, 4]); if (b2) mv.push([2, 4]);
      r = b2 + b3;
      let n3 = false;
      if (b1) { if (Math.random() < 0.5) { r++; mv.push([1, 4]); } else { n3 = true; mv.push([1, 3]); } }
      mv.push([0, 2]);
      bases = [false, true, n3];
      title = 'ツーベース！';
      break;
    }
    case '1B': {
      r = +b3; if (b3) mv.push([3, 4]);
      const n = [true, false, false];
      if (b2) { if (Math.random() < 0.65) { r++; mv.push([2, 4]); } else { n[2] = true; mv.push([2, 3]); } }
      if (b1) { n[1] = true; mv.push([1, 2]); }
      mv.push([0, 1]);
      bases = n;
      title = `${OF_NAME[ofi]}前ヒット`;
      break;
    }
    case 'FLY':
      outs++;
      mv.push([0, 1, true]);
      title = `${OF_NAME[ofi]}フライ`; col = '#ffb070';
      if (outs < 3) {
        if (b3 && Math.random() < 0.7) { r = 1; bases[2] = false; mv.push([3, 4]); title = '犠牲フライ！'; col = '#7fe0ff'; }
        if (b2 && !bases[2] && Math.random() < 0.4) { bases[1] = false; bases[2] = true; mv.push([2, 3]); }
      }
      break;
    case 'POP':
      outs++;
      mv.push([0, 1, true]);
      title = 'ポップフライ'; col = '#ffb070';
      break;
    case 'GO': {
      const anyRunner = b1 || b2 || b3;
      const dp = before < 2 && ((b1 && Math.random() < 0.55) || (!b1 && anyRunner && Math.random() < 0.18));
      mv.push([0, 1, true]);
      if (dp) {
        outs += 2;
        title = `${IF_NAME[ifi]}ゴロ`; sub = 'ゲッツー！'; col = '#ff8080';
        if (b1)      { bases[0] = false; mv.push([1, 2, true]); dpThrow = 2; }
        else if (b3) { bases[2] = false; mv.push([3, 4, true]); dpThrow = 0; }
        else         { bases[1] = false; mv.push([2, 3, true]); dpThrow = 3; }
      } else {
        outs++;
        title = `${IF_NAME[ifi]}ゴロ`; col = '#ffb070';
        if (outs < 3) {
          let n1 = false, n2 = false, n3 = false;
          if (b3) { if (Math.random() < 0.5) { r++; mv.push([3, 4]); } else n3 = true; }
          if (b2) { if (!n3) { n3 = true; mv.push([2, 3]); } else n2 = true; }
          if (b1) { if (!n2) { n2 = true; mv.push([1, 2]); } else n1 = true; }
          bases = [n1, n2, n3];
        }
      }
      break;
    }
  }
  // 動かなかったランナーもその場に表示
  for (let b = 1; b <= 3; b++) {
    if (prevBases[b - 1] && !mv.some(m => m[0] === b)) mv.push([b, b]);
  }
  if (outs > 3) outs = 3;
  runs[half] += r;
  batterDone = true;

  const parts = [];
  if (sub) parts.push(sub);
  if (r > 0) parts.push(`${r}点！`);
  if (outs >= 3) parts.push('スリーアウト');
  else if (outs > before) parts.push(`${outs}アウト`);
  if (half === 1 && runs[1] > runs[0]) { parts.push('サヨナラ！'); col = '#ffd23f'; }

  startFlight(from, diff, kind);                // 最初の一瞬は近い視点で打球を見せる
  play = makePlay(kind, ang, ofi, ifi, mv, dpThrow);
  const total = 300 + Math.max(play.ballEnd, play.runEnd) * 1000 + 1200;
  showResult(title, parts.join('　'), col, total);
  wideAt = performance.now() + 300;             // 0.3秒後に引きのカメラへ
  msgAt = wideAt + play.segs[0].dur * 1000;     // ボールが落ちた（捕った）ら文字を出す
}

// 引きのカメラで見せる打球・守備・ランナーの動きを作る
function makePlay(kind, ang, ofi, ifi, mv, dpThrow) {
  const segs = [];          // ボールの動き（区間ごと）
  let chaser = null;        // ボールを追いかける野手
  let runDelay = 0.1;
  const start = [0, 1];
  const nearOF = a => (a < -0.22 ? 0 : a > 0.22 ? 2 : 1);
  const seg = (from, to, h, dur, z0 = 0) => segs.push({ from, to, h, dur, z0 });

  switch (kind) {
    case 'HR': {
      const land = polar(rand(112, 135), ang);
      seg(start, land, rand(28, 36), 2.3, 1);
      chaser = { g: 'OF', i: nearOF(ang), to: polar(fenceR(ang) - 3, ang), t: 2.0 };
      break;
    }
    case '3B':
    case '2B': {
      let a = kind === '3B' ? (ang < 0 ? -0.66 : 0.66)
            : ofi === 1 ? (ang < 0 ? -0.2 : 0.2) : (ang < 0 ? -0.5 : 0.5);
      const land = polar(rand(80, 90), a);
      const roll = polar(fenceR(a) - 2, a);
      seg(start, land, kind === '3B' ? 9 : 12, 1.6, 1);
      seg(land, roll, 0, 0.7);
      chaser = { g: 'OF', i: nearOF(a), to: roll, t: 2.5 };
      break;
    }
    case '1B': {
      const a = ofi === 1 ? (ang < 0 ? -0.12 : 0.12) : (ang < 0 ? -0.45 : 0.45);
      const land = polar(rand(50, 60), a);
      const roll = polar(68, a);
      seg(start, land, 5, 1.0, 1);
      seg(land, roll, 0, 0.6);
      chaser = { g: 'OF', i: nearOF(a), to: roll, t: 1.6 };
      break;
    }
    case 'FLY': {
      const land = [OFW[ofi][0] + rand(-8, 8), OFW[ofi][1] + rand(-10, 4)];
      seg(start, land, rand(22, 30), 2.0, 1);
      chaser = { g: 'OF', i: ofi, to: land, t: 2.0 };
      if (mv.some(m => m[0] === 3 && m[1] === 4)) seg(land, [0, 1], 4, 1.1);   // バックホーム
      runDelay = 2.0;                                                          // タッチアップ
      break;
    }
    case 'POP': {
      const land = polar(rand(15, 30), rand(-0.6, 0.6));
      seg(start, land, rand(30, 38), 2.2, 1);
      let best = 0, bd = 1e9;
      IFW.forEach((f, i) => { const d = Math.hypot(f[0] - land[0], f[1] - land[1]); if (d < bd) { bd = d; best = i; } });
      chaser = { g: 'IF', i: best, to: land, t: 2.2 };
      break;
    }
    case 'GO': {
      const f = IFW[ifi];
      const land = polar(Math.hypot(f[0], f[1]), ang);
      seg(start, land, 0.5, 0.75, 0.5);
      chaser = { g: 'IF', i: ifi, to: land, t: 0.75 };
      if (dpThrow !== null) {
        seg(land, BASES_W[dpThrow], 1.5, 0.45);
        seg(BASES_W[dpThrow], BASES_W[1], 1.5, 0.5);
      } else {
        seg(land, BASES_W[1], 1.5, 0.5);
      }
      break;
    }
  }
  const ballEnd = segs.reduce((s, g) => s + g.dur, 0);
  const runEnd = mv.reduce((m, [a, b]) => Math.max(m, runDelay + (b - a) * 1.0), 0);
  return { segs, chaser, mv, ballEnd, runEnd, runDelay, kind };
}

function addStrike(swinging) {
  strikes++;
  if (strikes >= 3) {
    outs++;
    batterDone = true;
    showResult('三振！', (swinging ? '空振り三振' : '見逃し三振') + (outs >= 3 ? '　スリーアウト' : `　${outs}アウト`), '#ff8080', 1800);
  } else {
    showResult(swinging ? '空振り' : 'ストライク', '', '#ff8080', 1000);
  }
}

function addBall() {
  balls++;
  if (balls >= 4) {
    let r = 0;
    if (bases[0] && bases[1] && bases[2]) r = 1;
    else if (bases[0] && bases[1]) bases[2] = true;
    else if (bases[0]) bases[1] = true;
    bases[0] = true;
    runs[half] += r;
    batterDone = true;
    let sub = r ? '押し出し 1点！' : bases.every(b => b) ? '満塁！' : '';
    if (half === 1 && runs[1] > runs[0]) sub += '　サヨナラ！';
    showResult('フォアボール', sub, '#9fe', 1800);
  } else {
    showResult('ボール', '', '#9fe', 1000);
  }
}

function showResult(m, sub, col, dur) {
  msg = m; msgSub = sub; msgColor = col;
  msgAt = 0;
  if (history.length) history[history.length - 1].done = true;
  resultDur = dur;
  state = 'result';
  phaseStart = performance.now();
}

// 結果を見せ終わったら次へ
function finishPlay() {
  play = null; prevBases = null;
  if (half === 1 && runs[1] > runs[0]) { endGame(true); return; }
  if (outs >= 3) {
    if (half === 0) { startHalf(1); return; }
    if (runs[0] !== runs[1]) { endGame(false); return; }
    inning++;
    startHalf(0);
    return;
  }
  if (batterDone) { balls = 0; strikes = 0; batterDone = false; history = []; newBatter(); }
  nextPitch();
}

function endGame(sayonara) {
  state = 'end';
  show('panel', false); show('guessPanel', false);
  const win = runs[0] > runs[1] ? 0 : 1;
  let title;
  if (mode === 1) title = win === 0 ? '🎉 あなたの勝ち！' : '😢 あなたの負け…';
  else title = `🎉 ${teamName(win)} の勝ち！`;
  document.getElementById('endTitle').textContent = title;
  document.getElementById('endScore').textContent = `${teamName(0)} ${runs[0]} － ${runs[1]} ${teamName(1)}`;
  document.getElementById('endSub').textContent =
    (sayonara ? 'サヨナラ決着！' : '') + (inning > 1 ? `（${inning}回まで延長）` : '');
  show('end', true);
}

// 打者パネルの「右打ち⇄左打ち」ボタン
function updateHandBtn() {
  document.getElementById('handBtn').textContent = `${handName(batterHand, '打ち')} ⇄`;
}
function toggleBatterHand() {
  batterHand = batterHand === 'R' ? 'L' : 'R';
  batHandPref[batTeam()] = batterHand;
  updateHandBtn();
}
