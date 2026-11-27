// 設定：画面の大きさ・球種・チームの色・守備位置など（ゲーム中に変わらない値）

// =====================================================
//  設定
// =====================================================
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const W = 420, H = 640;
const REL = { x: 212, y: 282 };         // ピッチャーがボールを離す位置
const HIT = { x: 210, y: 505 };         // ストライクゾーンの中心
const ZW = 72, ZH = 84;                 // ストライクゾーンの大きさ
const AIM_W = ZW * 1.5, AIM_H = ZH * 1.5; // ねらえる範囲（ゾーンの外はボール球）
const WINDUP = 800;                     // 振りかぶる時間（ミリ秒）

// 球種：速さ・曲がり方（bx＝横、by＝縦）・ギリギリで曲がる度合い・出やすさ（CPU用）
const PITCHES = [
  { name: 'ストレート',   short: 'ストレート', min: 135, max: 156, bx: 0,  by: 0,  late: 2, rise: 0,  weight: 40 },
  { name: 'スライダー',   short: 'スライダー', min: 120, max: 136, bx: 28, by: 8,  late: 2, rise: 0,  weight: 20 },
  { name: 'カーブ',       short: 'カーブ',     min: 98,  max: 115, bx: 14, by: 30, late: 2, rise: 22, weight: 15 },
  { name: 'フォーク',     short: 'フォーク',   min: 125, max: 140, bx: 0,  by: 36, late: 5, rise: 0,  weight: 15 },
  { name: 'チェンジアップ', short: 'チェンジ',   min: 100, max: 118, bx: -6, by: 12, late: 2, rise: 0,  weight: 10 },
];

// チームの色（0＝先攻・赤、1＝後攻・青）
const TEAMS = [
  { color: '#c0392b', light: '#e8665a', dark: '#6e1a12' },
  { color: '#25459e', light: '#3d63d1', dark: '#0f2460' },
];

// 守備位置（画面上の足元の位置）
const OF = [[80, 232], [210, 222], [340, 232]];                    // レフト・センター・ライト
const IF = [[112, 345], [160, 300], [262, 300], [308, 345]];       // サード・ショート・セカンド・ファースト
const OF_NAME = ['レフト', 'センター', 'ライト'];
const IF_NAME = ['サード', 'ショート', 'セカンド', 'ファースト'];
const BASE_POS = [[322, 368], [210, 258], [98, 368]];             // 1塁・2塁・3塁
const RUNNER_POS = [[308, 374], [198, 264], [110, 380]];          // ランナーが立つ位置（少しリード）
