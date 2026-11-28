// 3D の球場と選手（three.js）。キャッチャー目線のカメラで撮る。打ったあとはカメラがボールを追いかける
//   長さはメートル。ホームベースが原点、ピッチャーの方向が +z、上が +y、キャッチャーから見て左（3塁側）が +x

const V3 = THREE.Vector3;
const UP3 = new V3(0, 1, 0);

// ---------------- 画面の準備 ----------------
const cv3 = /** @type {HTMLCanvasElement} */ (document.getElementById('c3'));
const renderer = new THREE.WebGLRenderer({ canvas: cv3, antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x2a2d6e, 90, 260);
const cam3 = new THREE.PerspectiveCamera(50, W / H, 0.1, 600);

// キャッチャー目線のカメラ（ゾーンが真ん中、打者が左、投手が奥）
const CAM_DUEL = { pos: new V3(0.3, 1.42, -3.15), look: new V3(-0.05, 0.92, 10) };
const camPos = CAM_DUEL.pos.clone(), camLook = CAM_DUEL.look.clone();

function resize3() {
  const r = cv.getBoundingClientRect();
  renderer.setSize(r.width, r.height, true);
  cv3.style.width = r.width + 'px'; cv3.style.height = r.height + 'px';
}
window.addEventListener('resize', resize3);

// 絵（テクスチャ）を作る小さな道具
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = 4;
  return t;
}
const rnd3 = seeded(5);

// ---------------- 空と光 ----------------
scene.background = canvasTex(16, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#0a1236'); gr.addColorStop(0.5, '#262c78'); gr.addColorStop(0.78, '#6b3f8c'); gr.addColorStop(1, '#b0587e');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
scene.add(new THREE.HemisphereLight(0xb0b8ff, 0x1e2e1a, 0.6));
const sun = new THREE.DirectionalLight(0xfff2dc, 0.95);
sun.position.set(-10, 30, -14);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 34, bottom: -6, near: 1, far: 90 });
sun.target.position.set(0, 0, 10);
scene.add(sun, sun.target);

// ---------------- グラウンド ----------------
const grassTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#2f7a35'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3a8c3e'; g.fillRect(0, 0, w, h / 2);
  for (let i = 0; i < 2500; i++) { g.fillStyle = rnd3() < 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(200,255,180,.08)'; g.fillRect(rnd3() * w, rnd3() * h, 1, 2); }
}, [1, 40]);
const dirtTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#9a5432'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6000; i++) { g.fillStyle = rnd3() < 0.5 ? 'rgba(60,20,8,.25)' : 'rgba(255,200,160,.15)'; g.fillRect(rnd3() * w, rnd3() * h, 1.5, 1.5); }
}, [10, 10]);
const M3 = {
  grass: new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.95 }),
  dirt: new THREE.MeshStandardMaterial({ map: dirtTex, roughness: 1 }),
  chalk: new THREE.MeshBasicMaterial({ color: 0xf5f2ea }),
  wall: new THREE.MeshStandardMaterial({ color: 0x1d4f4a, roughness: 0.8, side: THREE.DoubleSide }),
  yellow: new THREE.MeshBasicMaterial({ color: 0xf2d03b }),
};
function flat(geo, m, y = 0) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = y; mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
flat(new THREE.CircleGeometry(122, 64, Math.PI / 4, Math.PI / 2 * 3), M3.grass);
flat(new THREE.CircleGeometry(122, 64, -Math.PI / 4 + 0.001, Math.PI / 2), M3.grass);
flat(new THREE.CircleGeometry(29, 48), M3.dirt, 0.01).position.z = 18.4;
const diamondGrass = flat(new THREE.PlaneGeometry(24.5, 24.5), M3.grass, 0.02);
diamondGrass.rotation.z = Math.PI / 4; diamondGrass.position.z = 19.4;
flat(new THREE.CircleGeometry(4.2, 32), M3.dirt, 0.03);
const mound = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.9, 0.25, 32), M3.dirt);
mound.position.set(0, 0.125, 18.44); mound.receiveShadow = true; scene.add(mound);
const rubber = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.15), M3.chalk);
rubber.position.set(0, 0.26, 18.44); scene.add(rubber);
for (const [x, z] of [[-19.4, 19.4], [0, 38.8], [19.4, 19.4]]) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.38), M3.chalk);
  b.position.set(x, 0.04, z); b.rotation.y = Math.PI / 4; scene.add(b);
}
const plateShape = new THREE.Shape();
plateShape.moveTo(-0.216, 0); plateShape.lineTo(0.216, 0); plateShape.lineTo(0.216, -0.216); plateShape.lineTo(0, -0.43); plateShape.lineTo(-0.216, -0.216);
flat(new THREE.ShapeGeometry(plateShape), new THREE.MeshStandardMaterial({ color: 0xf3e9d8 }), 0.04).position.z = 0.215;
function chalkLine(x1, z1, x2, z2, w = 0.08) {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const m = flat(new THREE.PlaneGeometry(w, len), M3.chalk, 0.045);
  m.position.x = (x1 + x2) / 2; m.position.z = (z1 + z2) / 2;
  m.rotation.z = -Math.atan2(x2 - x1, z2 - z1);
}
chalkLine(0, 0, 70, 70); chalkLine(0, 0, -70, 70);
for (const s of [1, -1]) {
  const x0 = s * 0.35, x1 = s * 1.55;
  chalkLine(x0, -0.9, x1, -0.9); chalkLine(x1, -0.9, x1, 0.9); chalkLine(x1, 0.9, x0, 0.9); chalkLine(x0, 0.9, x0, -0.9);
}
const FENCE_R = 104;
const fence = new THREE.Mesh(new THREE.CylinderGeometry(FENCE_R, FENCE_R, 3.2, 72, 1, true, -Math.PI / 4, Math.PI / 2), M3.wall);
fence.position.y = 1.6; scene.add(fence);
const fenceTop = new THREE.Mesh(new THREE.CylinderGeometry(FENCE_R - 0.05, FENCE_R - 0.05, 0.18, 72, 1, true, -Math.PI / 4, Math.PI / 2), M3.yellow);
fenceTop.position.y = 3.2; scene.add(fenceTop);
const crowdTex = canvasTex(512, 128, (g, w, h) => {
  g.fillStyle = '#1e2a5c'; g.fillRect(0, 0, w, h);
  const cols = ['#f2d8c0', '#e9b48f', '#f6f1e8', '#5f8fe8', '#f2c94a', '#d9536a', '#9fc0ff'];
  for (let i = 0; i < 2600; i++) { g.fillStyle = cols[Math.floor(rnd3() * cols.length)]; g.fillRect(rnd3() * w, rnd3() * h, 2, 2.5); }
  g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 4);
}, [18, 1]);
const crowdMat = new THREE.MeshStandardMaterial({ map: crowdTex, roughness: 1, side: THREE.DoubleSide, emissive: 0x111833 });
for (let k = 0; k < 4; k++) {
  const r = FENCE_R + 4 + k * 9;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(r + 3, r, 4.5, 72, 1, true, -Math.PI * 0.62, Math.PI * 1.24), crowdMat);
  ring.position.y = 3 + k * 4; scene.add(ring);
}
const glowTex = canvasTex(128, 128, (g, w, h) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,250,225,1)'); gr.addColorStop(0.25, 'rgba(255,240,200,.5)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
for (const a of [-1.0, 1.0]) {
  const x = Math.sin(a) * 125, z = Math.cos(a) * 125;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 48, 8), new THREE.MeshStandardMaterial({ color: 0x8f96b8 }));
  pole.position.set(x, 24, z); scene.add(pole);
  const head = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 1), new THREE.MeshBasicMaterial({ color: 0xfff8e0 }));
  head.position.set(x, 50, z); head.lookAt(0, 0, 0); scene.add(head);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  glow.position.copy(head.position); glow.scale.set(60, 60, 1); scene.add(glow);
}

// ---------------- ゾーン（光る枠）：ゲームの「画面の点の座標」とメートルを対応させる ----------------
const ZONE_Z = 0.1;
// ゾーンの上の点（ゲームが使っている画面の座標）→ 3D の位置
function zonePxToWorld(px, py) {
  return new V3(-(px - HIT.x) * ZONE_W_M / ZW, zoneHeightM(py), ZONE_Z);
}
// 3D の位置（ゾーンの面の上）→ ゲームの座標
function worldToZonePx(v) {
  return { x: HIT.x - v.x * ZW / ZONE_W_M, y: HIT.y - (v.y - ZONE_MID_Y) * ZH / ZONE_H_M };
}
const zoneGroup = new THREE.Group(); scene.add(zoneGroup);
{
  const a = zonePxToWorld(HIT.x - AIM_W / 2, HIT.y - AIM_H / 2), b = zonePxToWorld(HIT.x + AIM_W / 2, HIT.y + AIM_H / 2);
  const z1 = zonePxToWorld(HIT.x - ZW / 2, HIT.y - ZH / 2), z2 = zonePxToWorld(HIT.x + ZW / 2, HIT.y + ZH / 2);
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(a.x - b.x), Math.abs(a.y - b.y)),
    new THREE.MeshBasicMaterial({ color: 0x35d6c8, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
  fill.position.set(0, (a.y + b.y) / 2, ZONE_Z); zoneGroup.add(fill);
  const rect = (arr, p, q) => arr.push(p.x, p.y, ZONE_Z, q.x, p.y, ZONE_Z, q.x, p.y, ZONE_Z, q.x, q.y, ZONE_Z, q.x, q.y, ZONE_Z, p.x, q.y, ZONE_Z, p.x, q.y, ZONE_Z, p.x, p.y, ZONE_Z);
  const outer = []; rect(outer, a, b);
  const g1 = new THREE.BufferGeometry(); g1.setAttribute('position', new THREE.Float32BufferAttribute(outer, 3));
  zoneGroup.add(new THREE.LineSegments(g1, new THREE.LineBasicMaterial({ color: 0x5ff2e2 })));
  const inner = []; rect(inner, z1, z2);
  for (let i = 1; i < 3; i++) {
    const x = z1.x + (z2.x - z1.x) * i / 3, y = z1.y + (z2.y - z1.y) * i / 3;
    inner.push(x, z1.y, ZONE_Z, x, z2.y, ZONE_Z, z1.x, y, ZONE_Z, z2.x, y, ZONE_Z);
  }
  const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(inner, 3));
  zoneGroup.add(new THREE.LineSegments(g2, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })));
}

// =====================================================================
//  人形：丸（関節）と筒（手足）をつないで作る
// =====================================================================
function makeFigure(opts) {
  const group = new THREE.Group(); scene.add(group);
  const m = {
    shirt: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 }),
    pants: new THREE.MeshStandardMaterial({ color: 0xf2ece3, roughness: 0.7 }),
    skin: new THREE.MeshStandardMaterial({ color: 0xf0c29e, roughness: 0.7 }),
    shoe: new THREE.MeshStandardMaterial({ color: 0x2f3346, roughness: 0.5 }),
    cap: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.15 }),
    glove: new THREE.MeshStandardMaterial({ color: 0x9a5a2e, roughness: 0.6 }),
    hair: new THREE.MeshStandardMaterial({ color: 0x2b211d, roughness: 0.8 }),
  };
  const shadow = !!opts.shadow;
  const mk = (geo, material) => { const x = new THREE.Mesh(geo, material); x.castShadow = shadow; group.add(x); return x; };
  const seg = (r1, r2, material) => mk(new THREE.CylinderGeometry(r2, r1, 1, 10), material);
  const ball = (r, material) => mk(new THREE.SphereGeometry(r, 12, 9), material);
  const f = {
    group, m,
    thighA: seg(0.075, 0.09, m.pants), thighB: seg(0.075, 0.09, m.pants),
    shinA: seg(0.05, 0.07, m.pants), shinB: seg(0.05, 0.07, m.pants),
    sockA: seg(0.048, 0.055, m.shirt), sockB: seg(0.048, 0.055, m.shirt),
    kneeA: ball(0.072, m.pants), kneeB: ball(0.072, m.pants),
    footA: mk(new THREE.BoxGeometry(0.11, 0.08, 0.27), m.shoe), footB: mk(new THREE.BoxGeometry(0.11, 0.08, 0.27), m.shoe),
    hips: ball(0.17, m.pants),
    torso: mk(new THREE.CylinderGeometry(0.5, 0.42, 1, 14), m.shirt),
    shA: ball(0.075, m.shirt), shB: ball(0.075, m.shirt),
    upperA: seg(0.05, 0.065, m.shirt), upperB: seg(0.05, 0.065, m.shirt),
    foreA: seg(0.035, 0.045, m.skin), foreB: seg(0.035, 0.045, m.skin),
    elbowA: ball(0.05, m.skin), elbowB: ball(0.05, m.skin),
    handA: ball(opts.glove ? 0.065 : 0.05, opts.glove ? m.glove : m.skin), handB: ball(0.045, m.skin),
    neck: seg(0.05, 0.05, m.skin),
    head: new THREE.Group(),
  };
  f.torso.matrixAutoUpdate = false;
  group.add(f.head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), m.skin); face.castShadow = shadow; f.head.add(face);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.112, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), m.hair); hair.rotation.x = -0.5; hair.position.z = -0.01; f.head.add(hair);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), m.cap); cap.position.y = 0.02; cap.castShadow = shadow; f.head.add(cap);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.015, 16, 1, false, -Math.PI / 2, Math.PI), m.cap);
  brim.position.set(0, 0.03, 0.06); f.head.add(brim);
  if (opts.helmet) { f.flap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), m.cap); f.flap.position.set(0.1, -0.03, -0.01); f.head.add(f.flap); }
  return f;
}
function setTeam(f, team) {
  const c = TEAMS[team].color;
  f.m.shirt.color.set(c); f.m.cap.color.set(TEAMS[team].dark);
}
// 筒を a から b に伸ばす
function setSeg(mesh, a, b) {
  const d = new V3().subVectors(b, a); const len = d.length() || 0.001;
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.scale.set(1, len, 1);
  mesh.quaternion.setFromUnitVectors(UP3, d.divideScalar(len));
}
// ひじ・ひざの位置：長さが決まっているので、先が近いほど曲がる。曲がる向きは hint の方
function joint3(a, c, l1, l2, hint) {
  const ac = new V3().subVectors(c, a); const d = Math.min(ac.length(), l1 + l2 - 0.001) || 0.001;
  const dir = ac.clone().normalize();
  const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const side = hint.clone().sub(dir.clone().multiplyScalar(hint.dot(dir))).normalize();
  return a.clone().addScaledVector(dir, x).addScaledVector(side, h);
}
// ポーズ（関節の位置。すでに 3D の位置になったもの）を人形に当てはめる
function applyPose3(f, P, face) {
  for (const s of ['A', 'B']) {
    const hip = P['hip' + s], knee = P['knee' + s], ankle = P['ankle' + s];
    setSeg(f['thigh' + s], knee, hip);
    const mid = knee.clone().lerp(ankle, 0.5);
    setSeg(f['shin' + s], mid, knee);
    setSeg(f['sock' + s], ankle, mid);
    f['knee' + s].position.copy(knee);
    const foot = f['foot' + s];
    foot.position.set(ankle.x + face.x * 0.07, Math.max(0.04, ankle.y - 0.03), ankle.z + face.z * 0.07);
    foot.rotation.set(0, Math.atan2(face.x, face.z), 0);
  }
  const pelvis = P.hipA.clone().lerp(P.hipB, 0.5);
  const chest = P.shA.clone().lerp(P.shB, 0.5);
  f.hips.position.copy(pelvis); f.hips.scale.set(1, 0.7, 0.8);
  const up = new V3().subVectors(chest, pelvis); const len = up.length(); up.normalize();
  const right = new V3().subVectors(P.shB, P.shA); right.sub(up.clone().multiplyScalar(right.dot(up))).normalize();
  const fwd = new V3().crossVectors(right, up);
  const mtx = new THREE.Matrix4().makeBasis(right, up, fwd);
  mtx.scale(new V3(0.36, len * 1.05, 0.22));
  mtx.setPosition(pelvis.clone().lerp(chest, 0.52));
  f.torso.matrix.copy(mtx);
  f.shA.position.copy(P.shA); f.shB.position.copy(P.shB);
  for (const s of ['A', 'B']) {
    const sh = P['sh' + s], hand = P['hand' + s];
    const el = joint3(sh, hand, 0.29, 0.28, new V3(0, -1, 0).addScaledVector(right, s === 'A' ? -0.8 : 0.8));
    setSeg(f['upper' + s], el, sh);
    setSeg(f['fore' + s], hand, el);
    f['elbow' + s].position.copy(el);
    f['hand' + s].position.copy(hand);
  }
  setSeg(f.neck, chest, P.head.clone().add(new V3(0, -0.1, 0)));
  f.head.position.copy(P.head);
  f.head.lookAt(P.head.clone().add(face));
}

// ---------------- 打者・投手・バット・ボール ----------------
const batter3 = makeFigure({ shadow: true, helmet: true });
const pitcher3 = makeFigure({ shadow: true, glove: true });
const bat3 = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.016, 0.86, 14), new THREE.MeshStandardMaterial({ color: 0xe9b35a, roughness: 0.35 }));
bat3.castShadow = true; scene.add(bat3);
const ball3 = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x777777, roughness: 0.4 }));
ball3.castShadow = true; scene.add(ball3);
const ghosts = [0.35, 0.18].map(o => {
  const g = new THREE.Mesh(ball3.geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: o, depthWrite: false }));
  scene.add(g); return g;
});
const ballShadow3 = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }));
ballShadow3.rotation.x = -Math.PI / 2; scene.add(ballShadow3);

// 打者：右打ちは +x 側（キャッチャーから見て左）、左打ちは -x 側
function batterToWorld(l) {
  const s = batterHand === 'L' ? -1 : 1;
  return new V3(s * (0.82 - l[0]), l[1], l[2]);
}
// 投手：右投げの投げる右手は +x 側（こちらを向いているので、キャッチャーから見て左）
function pitcherToWorld(l) {
  const s = pitHand() === 'L' ? -1 : 1;
  return new V3(s * l[0], 0.25 + l[1], 18.44 - l[2]);
}
function poseToWorld(P, fn) {
  const o = {};
  for (const k in P) if (k !== 'bat') o[k] = fn(P[k]);
  return o;
}

// 投げた球の 3D の位置（p＝0 で手を離れる、1 でゾーン）
function releasePoint() { return pitcherToWorld(PP.RELEASE.handB); }
function pitch3D(p) {
  const q = Math.min(p, 1);
  const from = releasePoint(), to = zonePxToWorld(aim.x, aim.y);
  const pos = from.clone().lerp(to, q);
  const hs = pitHand() === 'L' ? -1 : 1;
  const bend = Math.pow(q, pitch.late);
  // 変化球：途中まで曲がる方向とは反対に見えて、手元で曲がってくる（画面の座標の曲がり幅をメートルに）
  pos.x += hs * pitch.bx * 0.011 * (1 - bend) * q * 2;
  pos.y += pitch.by * 0.011 * (1 - bend) * q * 2;
  pos.y += pitch.rise * 0.008 * Math.sin(Math.PI * q) * (1 - q);
  pos.y += Math.sin(Math.PI * q) * 0.22;                    // 少し山なり
  if (p > 1) pos.z -= (p - 1) * 30;                         // ゾーンを過ぎたら手前へ抜けていく
  return pos;
}

// ---------------- 守備とランナー ----------------
const fielders3 = [];
for (let i = 0; i < 7; i++) fielders3.push(makeFigure({ glove: true }));     // 外野3人＋内野4人
const runners3 = [];
for (let i = 0; i < 4; i++) runners3.push(makeFigure({ helmet: true }));     // 塁上の走者＋打者走者
// 2D の引きのカメラで使っていた位置（X＝右が＋、Y＝センター方向）→ 3D
const wide2world = (X, Y, Z = 0) => new V3(-X, Z, Y);
function placeFigure(f, pos, faceDir, pose) {
  // 自分の向き（faceDir）で書いたポーズ [横, 上, 前] を 3D に
  const fwd = faceDir.clone().setY(0).normalize();
  const side = new V3().crossVectors(UP3, fwd).multiplyScalar(-1);
  const P = {};
  for (const k in pose) P[k] = pos.clone().addScaledVector(side, pose[k][0]).add(new V3(0, pose[k][1], 0)).addScaledVector(fwd, pose[k][2]);
  applyPose3(f, P, fwd);
  f.group.visible = true;
}

// =====================================================================
//  毎フレームの 3D の描画
// =====================================================================
let lastNow3 = 0;
function render3D(now) {
  const dt = Math.min(0.05, (now - (lastNow3 || now)) / 1000); lastNow3 = now;
  const replay = state === 'result' && play;
  const tw = replay ? (now - wideAt) / 1000 : 0;

  // チームの色
  setTeam(batter3, batTeam()); setTeam(pitcher3, fieldTeam());
  fielders3.forEach(f => setTeam(f, fieldTeam()));
  runners3.forEach(f => setTeam(f, batTeam()));

  // 投手
  const pp = poseToWorld(pitcherPoseNow(now), pitcherToWorld);
  applyPose3(pitcher3, pp, new V3(0, 0, -1));

  // 打者とバット（打ったあとの追いかけ中は、打者は走者として描く）
  batter3.group.visible = !replay; bat3.visible = !replay;
  if (!replay) {
    const bp = batterPoseNow(now);
    const bw = poseToWorld(bp, batterToWorld);
    bw.handA = bw.hand; bw.handB = bw.hand;
    const s = batterHand === 'L' ? -1 : 1;
    applyPose3(batter3, bw, new V3(-s, 0, 0.15).normalize());
    if (batter3.flap) batter3.flap.position.x = 0.1;
    const bd = new V3(-s * bp.bat[0], bp.bat[1], bp.bat[2]).normalize();
    bat3.position.copy(bw.hand).addScaledVector(bd, 0.36);
    bat3.quaternion.setFromUnitVectors(UP3, bd);
  }

  // 守備：構え（打ったら、追いかける野手が走る）
  const spots = [...OFW.map((p, i) => ({ g: 'OF', i, p })), ...IFW.map((p, i) => ({ g: 'IF', i, p }))];
  spots.forEach((s, k) => {
    let p = s.p, moving = false;
    const c = replay ? play.chaser : null;
    if (c && c.g === s.g && c.i === s.i) { p = lerp2(s.p, c.to, Math.min(1, tw / c.t)); moving = tw < c.t; }
    const pos = wide2world(p[0], p[1]);
    const toHome = new V3(-pos.x, 0, -pos.z);
    const face = moving ? wide2world(c.to[0] - s.p[0], c.to[1] - s.p[1]) : toHome;
    placeFigure(fielders3[k], pos, face, moving ? runPose(now / 1000) : FP.READY);
  });

  // ランナー
  runners3.forEach(f => { f.group.visible = false; });
  if (!replay) {
    let n = 0;
    for (let i = 0; i < 3; i++) {
      if (!bases[i]) continue;
      const b = BASES_W[i + 1], nx = BASES_W[i + 2] || BASES_W[0];
      const lead = lerp2(b, nx, 0.12);
      const pos = wide2world(lead[0], lead[1]);
      placeFigure(runners3[n++], pos, wide2world(nx[0] - b[0], nx[1] - b[1]), FP.READY);
    }
  } else {
    let n = 0;
    for (const [from, to, out] of play.mv) {
      if (n >= runners3.length) break;
      const delay = from === 0 ? 0.1 : play.runDelay;
      const u = Math.max(0, Math.min(to - from, (tw - delay) / 1.0));
      if (out && tw > play.ballEnd) continue;
      if (to === 4 && u >= to - from && tw - delay - (to - from) > 0.4) continue;
      const pos2 = from + u, i = Math.min(3, Math.floor(pos2));
      const a = BASES_W[i], b = BASES_W[i + 1];
      const p = lerp2(a, b, pos2 - i);
      const running = u > 0 && u < to - from;
      placeFigure(runners3[n++], wide2world(p[0], p[1]), wide2world(b[0] - a[0], b[1] - a[1]), running ? runPose(now / 1000 + n) : FP.READY);
    }
  }

  // ボール
  let ballPos = null;
  if (state === 'windup' && now >= phaseStart) ballPos = pp.handB;
  else if (state === 'pitch') ballPos = pitch3D((now - phaseStart) / travel);
  else if (replay) { const b = playBall(Math.max(0, tw)); ballPos = wide2world(b.X, b.Y, Math.max(0.05, b.Z)); }
  ball3.visible = !!ballPos;
  if (ballPos) ball3.position.copy(ballPos);
  const showGhosts = state === 'pitch';
  ghosts.forEach((g, i) => {
    g.visible = showGhosts && (now - phaseStart) / travel > (i + 1) * 0.04;
    if (g.visible) g.position.copy(pitch3D((now - phaseStart) / travel - (i + 1) * 0.04));
  });
  ballShadow3.visible = ball3.visible;
  if (ballPos) ballShadow3.position.set(ballPos.x, 0.05, ballPos.z);

  // カメラ：対決はキャッチャー目線、打ったらボールを追いかける
  let wantPos = CAM_DUEL.pos, wantLook = CAM_DUEL.look;
  if (replay && ballPos) {
    // テレビ中継のように、ホームの後ろの高いところから。ボールより少し下を見て、グラウンド（野手・走者）も入れる
    wantLook = new V3(ballPos.x * 0.8, ballPos.y * 0.35, Math.max(14, ballPos.z * 0.85));
    wantPos = new V3(ballPos.x * 0.25, 13 + ballPos.y * 0.25, Math.min(-12, ballPos.z * 0.35 - 20));
  }
  const k = replay ? 1 - Math.pow(0.03, dt) : 1 - Math.pow(0.0005, dt);
  camPos.lerp(wantPos, k);
  camLook.lerp(wantLook, replay ? Math.min(1, k * 2) : k);
  const wantFov = replay ? 62 : 50;
  if (Math.abs(cam3.fov - wantFov) > 0.05) { cam3.fov += (wantFov - cam3.fov) * k; cam3.updateProjectionMatrix(); }
  cam3.position.copy(camPos); cam3.lookAt(camLook);
  zoneGroup.visible = !replay;

  renderer.render(scene, cam3);
}

// ---------------- 3D の位置 ⇔ 画面（上に重ねる絵の座標 420×640） ----------------
function toScreen(v) {
  const p = v.clone().project(cam3);
  return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H, front: p.z < 1 };
}
// 画面の点 → ゾーンの面（z＝ZONE_Z）の上の点 → ゲームの座標
const ray3 = new THREE.Raycaster();
function screenToZonePx(sx, sy) {
  ray3.setFromCamera(new THREE.Vector2(sx / W * 2 - 1, 1 - sy / H * 2), cam3);
  const o = ray3.ray.origin, d = ray3.ray.direction;
  if (Math.abs(d.z) < 1e-6) return { x: -9999, y: -9999 };
  const t = (ZONE_Z - o.z) / d.z;
  return worldToZonePx(o.clone().addScaledVector(d, t));
}
// ゲームの座標（ゾーンの上）→ 画面
function zonePxToScreen(px, py) { return toScreen(zonePxToWorld(px, py)); }
