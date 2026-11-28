// 選手のポーズ（関節の位置）と、時間に合わせたポーズの決め方。計算だけで、絵は描かない（3D の道具がなくても動く）
//   長さはメートル。打者は自分の体の向きで [ホームベース側へ, 上へ, 投手側へ]、投手は [投げる腕の側へ, 上へ, ホームの方へ]

// なめらかな動き（ゆっくり始まって、すっと止まる）
function ease(k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); }
function easeOut(k) { k = Math.max(0, Math.min(1, k)); return 1 - (1 - k) * (1 - k); }

// 2つのポーズを k の割合で混ぜる（k=0 で a、k=1 で b）
function mixPose3(a, b, k) {
  const o = {};
  for (const key in a) o[key] = a[key].map((v, i) => v + (b[key][i] - v) * k);
  return o;
}

// ---------------- 打者 ----------------
// A＝後ろ側（キャッチャー側）、B＝前側（投手側）。hand＝両手の位置、bat＝バットの向き
const BP = {
  STANCE:  { ankleA: [0, .07, -.36], ankleB: [0, .07, .34], kneeA: [.12, .48, -.3], kneeB: [.12, .48, .3], hipA: [0, .92, -.13], hipB: [0, .92, .13],
             shA: [.02, 1.42, -.19], shB: [.06, 1.43, .17], head: [.08, 1.66, 0], hand: [.2, 1.4, -.24], bat: [-.15, .9, -.4] },
  LOAD:    { ankleA: [0, .07, -.36], ankleB: [.02, .22, .24], kneeA: [.12, .48, -.3], kneeB: [.18, .6, .28], hipA: [0, .92, -.14], hipB: [0, .92, .12],
             shA: [.02, 1.42, -.2], shB: [.06, 1.43, .15], head: [.07, 1.66, -.02], hand: [.17, 1.45, -.34], bat: [-.2, .9, -.38] },
  STRIDE:  { ankleA: [0, .07, -.36], ankleB: [0, .07, .56], kneeA: [.14, .46, -.28], kneeB: [.14, .46, .5], hipA: [0, .88, -.12], hipB: [0, .88, .16],
             shA: [.02, 1.39, -.18], shB: [.06, 1.4, .19], head: [.08, 1.63, .02], hand: [.18, 1.37, -.3], bat: [-.2, .88, -.42] },
  CONTACT: { ankleA: [.06, .1, -.33], ankleB: [0, .07, .56], kneeA: [.22, .45, -.18], kneeB: [.08, .46, .5], hipA: [.12, .88, -.06], hipB: [-.08, .88, .12],
             shA: [.18, 1.37, -.02], shB: [-.08, 1.4, .12], head: [.1, 1.62, .06], hand: [.42, .95, .2], bat: [1, .04, .22] },
  EXT:     { ankleA: [.08, .12, -.3], ankleB: [0, .07, .56], kneeA: [.24, .45, -.12], kneeB: [.08, .46, .5], hipA: [.15, .88, 0], hipB: [-.1, .88, .08],
             shA: [.2, 1.38, .08], shB: [-.12, 1.4, .06], head: [.08, 1.62, .06], hand: [.25, 1.15, .45], bat: [.25, .2, 1] },
  FINISH:  { ankleA: [.1, .14, -.28], ankleB: [0, .07, .56], kneeA: [.24, .46, -.08], kneeB: [.08, .46, .5], hipA: [.15, .88, .04], hipB: [-.1, .88, .04],
             shA: [.2, 1.4, .12], shB: [-.14, 1.41, 0], head: [.06, 1.63, .06], hand: [-.12, 1.5, .05], bat: [-.35, .35, -.87] },
};

// ゾーンの上の位置（画面の点の座標）→ 地面からの高さ（メートル）
const ZONE_W_M = 0.432, ZONE_H_M = 0.55, ZONE_MID_Y = 0.775;
function zoneHeightM(py) { return ZONE_MID_Y - (py - HIT.y) * ZONE_H_M / ZH; }

// スイングしていないときの打者（投手の動きに合わせてタイミングをとる）
function batterBasePose(now) {
  if (state === 'windup') return mixPose3(BP.STANCE, BP.LOAD, ease((now - phaseStart) / (WINDUP * 0.6)));
  if (state === 'pitch') return mixPose3(BP.LOAD, BP.STRIDE, ease((now - phaseStart) / (travel * 0.35)));
  if (state === 'result' && swingAt === null) return mixPose3(BP.STRIDE, BP.STANCE, ease((now - phaseStart) / 500));
  const p = mixPose3(BP.STANCE, BP.STANCE, 0);
  const bob = Math.sin(now / 320) * 0.012;                // 構え：小さくゆれてタイミングをとる
  p.hand[1] += bob; p.head[1] += bob * 0.5; p.shA[1] += bob * 0.5; p.shB[1] += bob * 0.5;
  p.bat[0] += Math.sin(now / 220) * 0.06;
  return p;
}

// 今の打者のポーズ。打つ瞬間はボールの高さにバットを合わせる
function batterPoseNow(now) {
  if (swingAt === null || now < swingAt || !swingBase) return batterBasePose(now);
  const y = Math.max(0.45, Math.min(1.15, zoneHeightM(aim.y)));
  const contact = mixPose3(BP.CONTACT, BP.CONTACT, 0);
  contact.hand[1] = y + 0.02;
  contact.bat[1] = (y - 0.85) * 0.35;                       // 低めはバットの先を少し下げる
  contact.shA[1] -= (0.95 - y) * 0.25; contact.shB[1] -= (0.95 - y) * 0.25;   // 低めは体も沈む
  contact.head[1] -= (0.95 - y) * 0.2;
  const t = now - swingAt;
  if (t < 60) return mixPose3(swingBase, contact, (t / 60) ** 2);
  if (t < 130) return mixPose3(contact, BP.EXT, easeOut((t - 60) / 70));
  if (t < 300) return mixPose3(BP.EXT, BP.FINISH, easeOut((t - 130) / 170));
  return BP.FINISH;
}

// ---------------- 投手 ----------------
// A＝グラブ側、B＝投げる側
const PP = {
  SET:     { ankleA: [-.15, .07, 0], ankleB: [.15, .07, 0], kneeA: [-.15, .5, .03], kneeB: [.15, .5, .03], hipA: [-.13, .93, 0], hipB: [.13, .93, 0],
             shA: [-.19, 1.43, 0], shB: [.19, 1.43, 0], head: [0, 1.67, .01], handA: [-.04, 1.2, .16], handB: [.04, 1.2, .16] },
  LIFT:    { ankleA: [-.1, .55, .05], ankleB: [.15, .07, 0], kneeA: [-.12, .98, .2], kneeB: [.15, .5, .03], hipA: [-.13, .95, 0], hipB: [.13, .95, 0],
             shA: [-.19, 1.45, 0], shB: [.19, 1.45, 0], head: [0, 1.69, 0], handA: [-.02, 1.3, .15], handB: [.03, 1.3, .15] },
  COCK:    { ankleA: [-.22, .07, .85], ankleB: [.16, .07, 0], kneeA: [-.2, .45, .72], kneeB: [.2, .46, .05], hipA: [-.13, .86, .28], hipB: [.14, .86, .2],
             shA: [-.18, 1.36, .32], shB: [.2, 1.4, .05], head: [0, 1.6, .25], handA: [-.3, 1.32, .62], handB: [.5, 1.62, -.25] },
  RELEASE: { ankleA: [-.22, .07, .85], ankleB: [.2, .15, -.05], kneeA: [-.2, .45, .72], kneeB: [.2, .48, .2], hipA: [-.12, .86, .45], hipB: [.13, .86, .4],
             shA: [-.18, 1.3, .6], shB: [.16, 1.34, .55], head: [0, 1.52, .65], handA: [-.25, 1.05, .4], handB: [.22, 1.75, .75] },
  FOLLOW:  { ankleA: [-.22, .07, .85], ankleB: [.25, .62, -.35], kneeA: [-.2, .45, .75], kneeB: [.2, .62, .15], hipA: [-.12, .8, .55], hipB: [.12, .82, .5],
             shA: [-.16, 1.12, .78], shB: [.1, 1.14, .8], head: [-.02, 1.32, .88], handA: [-.22, .95, .45], handB: [-.25, .72, .85] },
};

function pitcherPoseNow(now) {
  if (state === 'windup') {
    const k = Math.max(0, (now - phaseStart) / WINDUP);
    return k < 0.45 ? mixPose3(PP.SET, PP.LIFT, ease(k / 0.45)) : mixPose3(PP.LIFT, PP.COCK, ease((k - 0.45) / 0.55));
  }
  if (state === 'pitch') {
    const p = (now - phaseStart) / travel;
    return p < 0.08 ? mixPose3(PP.COCK, PP.RELEASE, ease(p / 0.08)) : mixPose3(PP.RELEASE, PP.FOLLOW, easeOut((p - 0.08) / 0.3));
  }
  if (state === 'result') return mixPose3(PP.FOLLOW, PP.SET, ease((now - phaseStart - 600) / 700));
  return PP.SET;
}

// ---------------- 守備・ランナー（小さな動き） ----------------
// [横, 上, 前]。READY＝構え、RUN1/RUN2＝走る（交互に混ぜる）
const FP = {
  READY: { ankleA: [-.22, .07, 0], ankleB: [.22, .07, 0], kneeA: [-.22, .45, .12], kneeB: [.22, .45, .12], hipA: [-.13, .82, -.05], hipB: [.13, .82, -.05],
           shA: [-.19, 1.3, .12], shB: [.19, 1.3, .12], head: [0, 1.53, .2], handA: [-.2, .85, .35], handB: [.2, .85, .35] },
  RUN1:  { ankleA: [-.1, .25, -.45], ankleB: [.1, .07, .4], kneeA: [-.1, .5, -.15], kneeB: [.1, .5, .3], hipA: [-.13, .92, 0], hipB: [.13, .92, 0],
           shA: [-.19, 1.42, .12], shB: [.19, 1.42, .12], head: [0, 1.66, .18], handA: [-.22, 1.15, .35], handB: [.22, 1.0, -.25] },
  RUN2:  { ankleA: [-.1, .07, .4], ankleB: [.1, .25, -.45], kneeA: [-.1, .5, .3], kneeB: [.1, .5, -.15], hipA: [-.13, .92, 0], hipB: [.13, .92, 0],
           shA: [-.19, 1.42, .12], shB: [.19, 1.42, .12], head: [0, 1.66, .18], handA: [-.22, 1.0, -.25], handB: [.22, 1.15, .35] },
};
function runPose(t) { return mixPose3(FP.RUN1, FP.RUN2, 0.5 + 0.5 * Math.sin(t * 11)); }
