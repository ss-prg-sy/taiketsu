// 投手と打者：関節（骨組み）の位置を「ポーズ」として決めておき、ポーズからポーズへなめらかに動かして描く
//   ・ポーズ＝肩・腰・ひざ・足首・手・頭などの位置（画面の座標）
//   ・2つのポーズのあいだを少しずつ混ぜると、動いて見える

// なめらかな動き（ゆっくり始まって、すっと止まる）
function ease(k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); }
function easeOut(k) { k = Math.max(0, Math.min(1, k)); return 1 - (1 - k) * (1 - k); }

// 2つのポーズを k の割合で混ぜる（k=0 で a、k=1 で b）
function mixPoses(a, b, k) {
  const out = {};
  for (const key in a) {
    const va = a[key], vb = b[key];
    out[key] = Array.isArray(va) ? [va[0] + (vb[0] - va[0]) * k, va[1] + (vb[1] - va[1]) * k] : va + (vb - va) * k;
  }
  return out;
}

// 根元が太く先が細い手足（両はしは丸い）
function taper(a, b, w1, w2, color) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d, ny = dx / d;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(a[0] + nx * w1 / 2, a[1] + ny * w1 / 2);
  ctx.lineTo(b[0] + nx * w2 / 2, b[1] + ny * w2 / 2);
  ctx.lineTo(b[0] - nx * w2 / 2, b[1] - ny * w2 / 2);
  ctx.lineTo(a[0] - nx * w1 / 2, a[1] - ny * w1 / 2);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(a[0], a[1], w1 / 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(b[0], b[1], w2 / 2, 0, Math.PI * 2); ctx.fill();
}

// 肩から手までの腕：ひじの位置を自動で決める（腕の長さが決まっているので、手が近いほどひじが曲がる）
//   bendSign：ひじを線のどちら側に曲げるか（+1 / -1）
function elbowOf(sh, hand, upper, fore, bendSign) {
  const dx = hand[0] - sh[0], dy = hand[1] - sh[1];
  const d = Math.min(Math.hypot(dx, dy), upper + fore - 0.01) || 1;
  const a = (upper * upper - fore * fore + d * d) / (2 * d);   // 肩からひじの「線の上の位置」
  const h = Math.sqrt(Math.max(0, upper * upper - a * a));     // 線からひじまでの「はみ出し」
  const ux = dx / (Math.hypot(dx, dy) || 1), uy = dy / (Math.hypot(dx, dy) || 1);
  return [sh[0] + ux * a - uy * h * bendSign, sh[1] + uy * a + ux * h * bendSign];
}

// =====================================================
//  打者（右打ちの形で描く。左打ちは drawBatter で左右反転）
// =====================================================
// 打者のポーズ。hand・turn・lift はバットの持ち方（turn＝体のまわりの向き、lift＝バットの立ち具合）
// heel＝後ろ足のかかとの上がり具合（0〜1）
const B_STANCE = {
  hipB: [72, 402], hipF: [100, 402], kneeB: [55, 452], kneeF: [117, 449], ankleB: [50, 500], ankleF: [108, 503], heel: 0,
  shB: [66, 344], shF: [108, 338], head: [94, 318], hand: [134, 346], turn: -2.3, lift: 1.05,
};
const B_LOAD = {      // ため：前の足を上げて、手を後ろへ
  hipB: [68, 404], hipF: [96, 400], kneeB: [51, 455], kneeF: [113, 431], ankleB: [48, 500], ankleF: [104, 479], heel: 0,
  shB: [62, 346], shF: [103, 341], head: [90, 320], hand: [122, 338], turn: -2.55, lift: 1.15,
};
const B_STRIDE = {    // 踏み出し：足を前に下ろして、少し沈む
  hipB: [74, 409], hipF: [104, 407], kneeB: [57, 457], kneeF: [127, 452], ankleB: [50, 500], ankleF: [123, 504], heel: 0,
  shB: [68, 349], shF: [110, 343], head: [96, 323], hand: [126, 342], turn: -2.45, lift: 1.1,
};
const B_CONTACT = {   // 打つ瞬間：腰と肩が回り、後ろ足のかかとが上がる。バットはゾーンを水平に横切る
  hipB: [84, 409], hipF: [108, 405], kneeB: [80, 458], kneeF: [130, 452], ankleB: [60, 498], ankleF: [123, 504], heel: 0.7,
  shB: [90, 350], shF: [117, 344], head: [99, 323], hand: [142, 372], turn: 0.0, lift: 0.04,
};
const B_FINISH = {    // 振り終わり：体が回りきって、バットが肩に巻きつく
  hipB: [90, 407], hipF: [110, 403], kneeB: [90, 460], kneeF: [128, 452], ankleB: [68, 496], ankleF: [123, 504], heel: 1,
  shB: [104, 348], shF: [114, 340], head: [99, 322], hand: [104, 330], turn: 3.0, lift: 0.85,
};
const BAT_L = 150;

// スイングしていないときの体の動き（投手の動きに合わせてタイミングをとる）
function batterBasePose(now) {
  if (state === 'windup') return mixPoses(B_STANCE, B_LOAD, ease((now - phaseStart) / (WINDUP * 0.6)));
  if (state === 'pitch') return mixPoses(B_LOAD, B_STRIDE, ease((now - phaseStart) / (travel * 0.35)));
  if (state === 'result') return mixPoses(B_STRIDE, B_STANCE, ease((now - phaseStart) / 500));   // 見送ったら構えに戻る
  // 構え：小さく体をゆらしてタイミングをとる
  const bob = Math.sin(now / 320);
  const p = { ...B_STANCE };
  for (const k of ['shB', 'shF', 'head', 'hand']) p[k] = [p[k][0] + bob * 0.8, p[k][1] + bob * 1.2];
  p.turn += Math.sin(now / 220) * 0.06;
  return p;
}

// 今のポーズ（スイング中はスイングの動き）
function batterPose(now) {
  if (swingAt === null || now < swingAt || !swingBase) return batterBasePose(now);
  const t = now - swingAt;
  const T1 = 55, T2 = 240;     // 打つ瞬間まで55ミリ秒、振り終わりまで240ミリ秒
  if (t < T1) return mixPoses(swingBase, B_CONTACT, (t / T1) ** 2);
  if (t < T2) return mixPoses(B_CONTACT, B_FINISH, easeOut((t - T1) / (T2 - T1)));
  return B_FINISH;
}

// バットの先の位置（立体の向き → 画面に映した形）
function batTip(p) {
  return {
    dx: BAT_L * Math.cos(p.turn) * Math.cos(p.lift),
    dy: -BAT_L * Math.sin(p.lift) - BAT_L * Math.sin(p.turn) * Math.cos(p.lift) * 0.35,
  };
}

// 足1本（もも → すね → スパイク）。heel はかかとの上がり具合
function drawLeg(hip, knee, ankle, heel, c) {
  const pants = '#f4eee6';
  taper(hip, knee, 25, 21, pants);
  // すねの下半分はソックス（チーム色）
  const mid = [knee[0] + (ankle[0] - knee[0]) * 0.45, knee[1] + (ankle[1] - knee[1]) * 0.45];
  taper(knee, mid, 21, 19, pants);
  taper(mid, ankle, 18, 15, c.color);
  // ズボンのライン（外側）
  ctx.strokeStyle = c.color; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(hip[0] - 9, hip[1]); ctx.lineTo(knee[0] - 8, knee[1]); ctx.stroke();
  // ひざの影
  ctx.fillStyle = 'rgba(120,110,120,.18)';
  ctx.beginPath(); ctx.ellipse(knee[0] + 3, knee[1] + 2, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
  // スパイク（かかとが上がるとつま先を軸に傾く）
  ctx.save();
  ctx.translate(ankle[0] + 18, ankle[1] + 10);      // つま先
  ctx.rotate(-heel * 0.55);
  ctx.fillStyle = '#3b3f52';
  ctx.beginPath(); ctx.roundRect(-40, -9, 44, 15, 6); ctx.fill();
  ctx.fillStyle = '#f4eee6'; ctx.fillRect(-38, 3, 40, 3);
  ctx.restore();
}

// 腕1本（そで＝チーム色、ひじから先＝肌）
function drawArm(sh, hand, c, bendSign) {
  const el = elbowOf(sh, hand, 30, 31, bendSign);
  taper(sh, el, 15, 12, c.color);
  taper(el, hand, 11, 9, COL.skin);
}

function drawBatterBody(now) {
  const c = TEAMS[batTeam()];
  const P = batterPose(now);
  const hand = P.hand;

  // 足元の影
  const cx = (P.ankleB[0] + P.ankleF[0]) / 2 + 8;
  const sh = ctx.createRadialGradient(cx, 518, 4, cx, 518, 70);
  sh.addColorStop(0, 'rgba(40,12,4,.55)'); sh.addColorStop(1, 'rgba(40,12,4,0)');
  ctx.save(); ctx.translate(cx, 518); ctx.scale(1, 0.22); ctx.translate(-cx, -518);
  ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(cx, 518, 70, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // 足（後ろ足 → 前足）
  drawLeg(P.hipB, P.kneeB, P.ankleB, P.heel, c);
  drawLeg(P.hipF, P.kneeF, P.ankleF, 0, c);

  // 体（ユニフォーム）：光の当たる側を明るく
  const body = ctx.createLinearGradient(P.shB[0] - 8, 0, P.shF[0] + 8, 0);
  body.addColorStop(0, c.dark); body.addColorStop(0.45, c.color); body.addColorStop(1, c.light);
  ctx.fillStyle = body; ctx.strokeStyle = body; ctx.lineWidth = 12; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(P.shB[0] - 4, P.shB[1]); ctx.lineTo(P.shF[0] + 4, P.shF[1]);
  ctx.lineTo(P.hipF[0] + 6, P.hipF[1] - 4); ctx.lineTo(P.hipB[0] - 6, P.hipB[1] - 4);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // 胸のライン・ベルト
  ctx.fillStyle = '#f4eee6';
  const lx0 = P.shF[0] - 10, lx1 = P.hipF[0] - 12;
  ctx.beginPath(); ctx.moveTo(lx0, P.shF[1] + 2); ctx.lineTo(lx0 + 6, P.shF[1] + 1); ctx.lineTo(lx1 + 6, P.hipF[1] - 8); ctx.lineTo(lx1, P.hipF[1] - 8); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = c.dark; ctx.lineWidth = 7; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(P.hipB[0] - 6, P.hipB[1] - 6); ctx.lineTo(P.hipF[0] + 6, P.hipF[1] - 6); ctx.stroke();

  // バット
  const { dx, dy } = batTip(P);
  const hx = hand[0], hy = hand[1];
  const blen = Math.hypot(dx, dy) || 1;
  const ux = dx / blen, uy = dy / blen, nx = -uy, ny = ux;
  const bat = ctx.createLinearGradient(hx + nx * 8, hy + ny * 8, hx - nx * 8, hy - ny * 8);
  bat.addColorStop(0, '#ffd889'); bat.addColorStop(0.5, '#f2b84b'); bat.addColorStop(1, '#c98a2e');
  ctx.fillStyle = bat;
  ctx.beginPath();
  ctx.moveTo(hx + nx * 3.5, hy + ny * 3.5);
  ctx.lineTo(hx + dx * 0.4 + nx * 5.6, hy + dy * 0.4 + ny * 5.6);
  ctx.lineTo(hx + dx + nx * 7.5, hy + dy + ny * 7.5);
  ctx.arc(hx + dx, hy + dy, 7.5, Math.atan2(ny, nx), Math.atan2(-ny, -nx));
  ctx.lineTo(hx + dx * 0.4 - nx * 5.6, hy + dy * 0.4 - ny * 5.6);
  ctx.lineTo(hx - nx * 3.5, hy - ny * 3.5);
  ctx.closePath(); ctx.fill();
  taper([hx - ux * 8, hy - uy * 8], [hx + dx * 0.18, hy + dy * 0.18], 6, 6, '#3b2a1e');   // グリップ

  // 振っている途中はバットの通り道をうっすら残す
  if (swingAt !== null && now >= swingAt && now - swingAt < 170) {
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 14; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let k = 0; k <= 6; k++) {
      const p2 = batterPose(now - k * 12);
      const tip = batTip(p2);
      if (k === 0) ctx.moveTo(p2.hand[0] + tip.dx, p2.hand[1] + tip.dy); else ctx.lineTo(p2.hand[0] + tip.dx, p2.hand[1] + tip.dy);
    }
    ctx.stroke();
  }

  // 腕（両手でバットを持つ）
  drawArm([P.shB[0] + 4, P.shB[1] + 4], hand, c, 1);
  drawArm([P.shF[0] - 2, P.shF[1] + 4], hand, c, 1);
  // 手袋
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(hx - 2, hy + 3, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + 4, hy - 4, 8, 0, Math.PI * 2); ctx.fill();

  // 頭（髪・顔・ヘルメット）
  const fx = P.head[0], fy = P.head[1];
  ctx.fillStyle = COL.hair;
  ctx.beginPath(); ctx.arc(fx - 10, fy + 6, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COL.skin;
  ctx.beginPath(); ctx.arc(fx + 4, fy + 6, 17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.beginPath(); ctx.arc(fx + 4, fy + 6, 17, Math.PI * 0.55, Math.PI * 1.1); ctx.lineTo(fx + 4, fy + 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2b211d';
  ctx.beginPath(); ctx.ellipse(fx + 13, fy + 4, 2.2, 3.6, 0, 0, Math.PI * 2); ctx.fill();   // 目
  ctx.fillStyle = c.color;
  ctx.beginPath(); ctx.arc(fx - 2, fy - 2, 27, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();   // ヘルメット
  ctx.fillRect(fx - 29, fy - 4, 54, 6);
  ctx.beginPath(); ctx.ellipse(fx + 26, fy + 1, 13, 4.5, -0.1, 0, Math.PI * 2); ctx.fill();   // つば
  ctx.fillStyle = c.dark;
  ctx.beginPath(); ctx.arc(fx - 16, fy + 8, 10, 0, Math.PI * 2); ctx.fill();                // 耳あて
  const hl = ctx.createRadialGradient(fx + 4, fy - 16, 1, fx + 4, fy - 16, 16);
  hl.addColorStop(0, 'rgba(255,255,255,.55)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.beginPath(); ctx.arc(fx - 2, fy - 2, 27, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
  ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
}

// =====================================================
//  投手（こちらを向いている。投げる腕が画面の右にある形で描く＝左投げの見え方。右投げは drawPitcher で左右反転）
// =====================================================
//   G＝グラブ側（画面の左）、T＝投げる側（画面の右）
const P_SET = {      // セット：グラブを胸の前に
  ankleG: [210, 262], kneeG: [210, 249], hipG: [211, 236], ankleT: [222, 262], kneeT: [222, 249], hipT: [221, 236],
  shG: [208, 216], shT: [224, 216], head: [216, 206], handG: [213, 226], handT: [219, 226],
};
const P_LIFT = {     // 足を上げる：グラブ側のひざを高く
  ankleG: [208, 241], kneeG: [204, 230], hipG: [211, 234], ankleT: [222, 262], kneeT: [222, 248], hipT: [221, 234],
  shG: [208, 214], shT: [224, 214], head: [216, 204], handG: [214, 222], handT: [218, 222],
};
const P_COCK = {     // 踏み出し：前に足を下ろしながら、投げる腕を後ろから上へ（この手の位置からボールが出る）
  ankleG: [202, 266], kneeG: [203, 252], hipG: [210, 238], ankleT: [224, 262], kneeT: [226, 250], hipT: [222, 238],
  shG: [207, 218], shT: [225, 217], head: [215, 208], handG: [198, 222], handT: [226, 204],
};
const P_RELEASE = {  // 投げる：腕を振り下ろし、体が前にかぶさる
  ankleG: [202, 266], kneeG: [203, 253], hipG: [211, 241], ankleT: [226, 258], kneeT: [226, 250], hipT: [221, 241],
  shG: [208, 222], shT: [223, 221], head: [214, 213], handG: [206, 236], handT: [218, 206],
};
const P_FOLLOW = {   // 振り抜き：腕が体の前を通り、後ろ足が浮く
  ankleG: [202, 266], kneeG: [204, 254], hipG: [211, 243], ankleT: [233, 246], kneeT: [227, 248], hipT: [221, 243],
  shG: [209, 226], shT: [222, 226], head: [213, 218], handG: [208, 240], handT: [206, 244],
};

function pitcherPoseNow(now) {
  if (state === 'windup') {
    const k = Math.max(0, (now - phaseStart) / WINDUP);
    if (k < 0.45) return mixPoses(P_SET, P_LIFT, ease(k / 0.45));
    return mixPoses(P_LIFT, P_COCK, ease((k - 0.45) / 0.55));
  }
  if (state === 'pitch') {
    const p = (now - phaseStart) / travel;
    if (p < 0.08) return mixPoses(P_COCK, P_RELEASE, ease(p / 0.08));
    return mixPoses(P_RELEASE, P_FOLLOW, easeOut((p - 0.08) / 0.3));
  }
  if (state === 'result' && !play) return mixPoses(P_FOLLOW, P_SET, ease(((now - phaseStart) - 500) / 600));
  return P_SET;
}

function drawPitcherBody(now) {
  const c = TEAMS[fieldTeam()];
  const P = pitcherPoseNow(now);
  drawShadow((P.ankleG[0] + P.ankleT[0]) / 2 + 2, 263, 15, 0.25);
  // 足
  for (const [hip, knee, ankle] of [[P.hipT, P.kneeT, P.ankleT], [P.hipG, P.kneeG, P.ankleG]]) {
    taper(hip, knee, 6.5, 5.5, '#f4eee6');
    taper(knee, ankle, 5.5, 4.5, '#f4eee6');
    ctx.fillStyle = '#26305a';
    ctx.beginPath(); ctx.ellipse(ankle[0], ankle[1] - 0.5, 4.5, 2.3, 0, 0, Math.PI * 2); ctx.fill();
  }
  // 体
  const pg = ctx.createLinearGradient(P.shG[0] - 2, 0, P.shT[0] + 2, 0);
  pg.addColorStop(0, c.light); pg.addColorStop(0.6, c.color); pg.addColorStop(1, c.dark);
  ctx.fillStyle = pg; ctx.strokeStyle = pg; ctx.lineWidth = 4; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(P.shG[0], P.shG[1]); ctx.lineTo(P.shT[0], P.shT[1]); ctx.lineTo(P.hipT[0] + 1, P.hipT[1]); ctx.lineTo(P.hipG[0] - 1, P.hipG[1]);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = c.dark;
  ctx.fillRect(P.hipG[0] - 2, P.hipG[1] - 3, P.hipT[0] - P.hipG[0] + 4, 2.5);   // ベルト
  // グラブの腕
  const elG = elbowOf(P.shG, P.handG, 9, 9, -1);
  taper(P.shG, elG, 4.6, 4, c.color);
  taper(elG, P.handG, 3.6, 3.2, COL.skin);
  ctx.fillStyle = '#9a5a2e';
  ctx.beginPath(); ctx.arc(P.handG[0], P.handG[1], 4.6, 0, Math.PI * 2); ctx.fill();
  // 投げる腕（ひじは体の外側に曲げる）
  const elT = elbowOf(P.shT, P.handT, 9, 9.5, 1);
  taper(P.shT, elT, 4.6, 4, c.color);
  taper(elT, P.handT, 3.6, 3.2, COL.skin);
  // 顔と帽子
  const [hx, hy] = P.head;
  ctx.fillStyle = COL.skin;
  ctx.beginPath(); ctx.arc(hx, hy + 1, 6.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = c.color;
  ctx.beginPath(); ctx.arc(hx, hy - 1, 6.5, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx, hy - 0.5, 6.5, 2, 0, 0, Math.PI * 2); ctx.fill();   // つば（こちら向き）
  // 振りかぶり中のボール
  if (state === 'windup' && now >= phaseStart) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(P.handT[0], P.handT[1], 2.4, 0, Math.PI * 2); ctx.fill();
  }
}
