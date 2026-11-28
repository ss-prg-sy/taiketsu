// 状態：試合の進み具合・今の投球・打球など（ゲーム中に変わる値）と小さな便利関数

// =====================================================
//  ゲームの状態
// =====================================================
let mode = 1;                 // 1＝1人で、2＝2人で
let inning = 1, half = 0;     // half: 0＝表（先攻の攻撃）、1＝裏（後攻の攻撃）
let runs = [0, 0];
let outs = 1, bases = [true, true, false], balls = 0, strikes = 0;
let batterDone = false;
let state = 'menu';
// menu → intro → aim（投手が選ぶ）→ handoff（2人用）→ windup → pitch → result → ...

let guess = -1;           // バッターの狙い球（-1＝狙わない）
let waitSpot = null;      // バッターが待つコース（null＝張らない）
const WAIT_NEAR = 31, WAIT_FAR = 62;   // この近さなら「読み的中」、これより遠いと「ハズレ」
let pitchLog = [];        // この打席で投げた球の記録（※ history はブラウザに元からある名前なので使わない）
const PCOLORS = ['#ffffff', '#4fd8ff', '#5ee07a', '#ff6bd5', '#ffa23f'];   // 球種ごとの色
let pitch = PITCHES[0], speed = 0, travel = 1000, phaseStart = 0;
let aim = { x: HIT.x, y: HIT.y }, inZone = true, corner = false;
let selPitch = 0;
let swingAt = null, swungMiss = false, cpuSwingAt = null;
let flight = null;
let msg = '', msgSub = '', msgColor = '#fff', resultDur = 1500;
let hover = null;
let dragAim = null;       // コースを指でなぞっている途中（離すまで決まらない）

// 右投げ・左投げ、右打ち・左打ち（'R' か 'L'）
let pitcherHand = ['R', 'R'];   // チームごとの投手（メニューで選ぶ）
let batHandPref = ['R', 'R'];   // 人が打つときの右左（前の打席の選び方を覚えておく）
let batterHand = 'R';           // 今の打者
function pitHand() { return pitcherHand[fieldTeam()]; }
function handName(h, kind) { return (h === 'R' ? '右' : '左') + kind; }
let lastTrail = null;     // 直前の投球の通り道
let hitFlash = null;      // 打った瞬間の光

// 打ったあとの「引きのカメラ」用
let play = null;          // 打球・守備・ランナーの動き
let wideAt = 0;           // 引きのカメラに切り替わる時刻
let msgAt = 0;            // 結果の文字を出す時刻
let prevBases = null;     // 打つ前のランナー

// グラウンドの実際の位置（メートル）。ホームが (0,0)、センター方向が +Y
const BASES_W = [[0, 0], [19.4, 19.4], [0, 38.8], [-19.4, 19.4], [0, 0]];  // 本塁・1塁・2塁・3塁・本塁
const IFW = [[-22, 28], [-10, 42], [10, 42], [22, 28]];   // サード・ショート・セカンド・ファースト
const OFW = [[-30, 80], [0, 95], [30, 80]];               // レフト・センター・ライト
const PW = [0, 18.4], CW = [0, -3];                        // ピッチャー・キャッチャー

// メートルの位置 → 画面の位置（高い所から見下ろすカメラ）
function wp(X, Y, Z = 0) {
  const s = 1 - Y / 400;                     // 奥ほど少し細く
  return { x: 210 + X * 3.45 * s, y: 615 - Y * 3.54 - Z * 2.6, s };
}
function polar(d, a) { return [d * Math.sin(a), d * Math.cos(a)]; }
function fenceR(a) { return 96 + 24 * Math.cos(a * 2); }   // 両翼96m・センター120m

const crowdW = [];
const crowdWColors = ['#e74c3c', '#f1c40f', '#ecf0f1', '#3498db', '#e67e22', '#9b59b6'];
for (let i = 0; i < 1400; i++) {
  crowdW.push({ x: Math.random() * W, y: 96 + Math.random() * (H - 96), col: crowdWColors[Math.floor(Math.random() * crowdWColors.length)] });
}

// 観客（点々）
const crowd = [];
const crowdColors = ['#e74c3c', '#f1c40f', '#ecf0f1', '#3498db', '#e67e22', '#9b59b6'];
for (let i = 0; i < 380; i++) {
  crowd.push({ x: Math.random() * W, y: 112 + Math.random() * 76, col: crowdColors[Math.floor(Math.random() * crowdColors.length)] });
}

function rand(a, b) { return a + Math.random() * (b - a); }
function gauss() {   // 真ん中に集まりやすい乱数
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function teamName(t) { return mode === 1 ? (t === 0 ? 'あなた' : 'CPU') : (t === 0 ? 'プレイヤー1' : 'プレイヤー2'); }
function shortName(t) { return mode === 1 ? (t === 0 ? 'あなた' : 'CPU') : (t === 0 ? 'P1' : 'P2'); }
function batTeam() { return half; }
function fieldTeam() { return 1 - half; }
function humanBats() { return mode === 2 || half === 0; }
function humanPitches() { return mode === 2 || half === 1; }
// B・S・O のランプ（文字・今の数・ランプの数・色）
function countRows() {
  return [
    { label: 'B', n: balls, max: 3, col: '#3ddc84' },
    { label: 'S', n: strikes, max: 2, col: '#ffd23f' },
    { label: 'O', n: outs, max: 2, col: '#ff4d4d' },
  ];
}
function show(id, on) { document.getElementById(id).classList.toggle('hidden', !on); }
