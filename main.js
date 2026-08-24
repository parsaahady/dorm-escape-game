/* ============================================================
   فرار از خوابگاه 🚬 — main.js
   بازی دوندهٔ بی‌پایان دانشجویی • Canvas 2.5D • بدون وابستگی
   ============================================================ */
'use strict';
(function () {

/* ---------------- helpers ---------------- */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const choice = a => a[(Math.random() * a.length) | 0];
const TAU = Math.PI * 2;
function rr(g, x, y, w, h, r) { // rounded rect path
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function circle(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mix(c1, c2, t) {
  const a = hex2rgb(c1), b = hex2rgb(c2);
  return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)) + ')';
}

/* ---------------- storage (safe) ---------------- */
const mem = {};
const store = {
  get(k, d) {
    try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); }
    catch (e) { return (k in mem) ? mem[k] : d; }
  },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { mem[k] = v; }
  }
};

/* ---------------- DOM ---------------- */
const $ = id => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const el = {
  hud: $('hud'), cigs: $('hudCigs'), score: $('hudScore'), dist: $('hudDist'),
  pows: $('hudPows'), dangerFill: $('dangerFill'),
  menu: $('menu'), select: $('select'), records: $('records'), over: $('over'),
  cards: $('cards'), recList: $('recList'),
  tutorial: $('tutorial'), pauseOv: $('pauseOv'), toast: $('toast'),
  ovScore: $('ovScore'), ovCigs: $('ovCigs'), ovDist: $('ovDist'), ovBest: $('ovBest'),
  newRec: $('newRec'), btnMute: $('btnMute')
};

/* ---------------- شخصیت‌ها (از روی عکس‌ها) ---------------- */
const CHARS = [
  { id: 'parsa',  name: 'پارسا',  hair: 'wavy',  hairCol: '#33261d', beard: 'trimmed', glasses: 'round', mouth: 'smile', skin: '#eeb98d', shade: '#d99b6c', hoodie: '#6ec1ff', hoodDark: '#4aa3e8', letter: 'پ', browW: 7 },
  { id: 'mahyar', name: 'مهیار', hair: 'afro',  hairCol: '#241a12', beard: 'stubble', glasses: null,    mouth: 'smile', skin: '#e8b184', shade: '#cf9262', hoodie: '#d35400', hoodDark: '#a83f00', letter: 'م', scarf: '#3b3b46', browW: 10 },
  { id: 'arsham', name: 'آرشام', hair: 'short', hairCol: '#20170f', beard: 'stubble', glasses: null,    mouth: 'smile', skin: '#edbd92', shade: '#d6a172', hoodie: '#37474f', hoodDark: '#22303a', letter: 'آ', browW: 8 },
  { id: 'mohsen', name: 'محسن',  hair: 'short', hairCol: '#2a1c12', beard: 'mustache', glasses: 'thin', mouth: 'smile', skin: '#eab68b', shade: '#d29a6c', hoodie: '#27ae60', hoodDark: '#1b8a4a', letter: 'م', browW: 7 },
  { id: 'farham', name: 'فرهام', hair: 'curly', hairCol: '#2b201a', beard: 'full',    glasses: null,    mouth: 'wavy',  skin: '#e5ad7e', shade: '#cc9060', hoodie: '#e84393', hoodDark: '#c22a77', letter: 'ف', browW: 8 }
];

/* ---------------- ساخت چهرهٔ کارتونی (اسپرایت سر) ---------------- */
function makeHead(ch) {
  const c = document.createElement('canvas'); c.width = c.height = 220;
  const g = c.getContext('2d');
  const x = 110, y = 122, r = 74;
  // گوش‌ها
  g.fillStyle = ch.skin; circle(g, x - r + 2, y + 10, 14); circle(g, x + r - 2, y + 10, 14);
  g.fillStyle = ch.shade; circle(g, x - r + 2, y + 10, 7); circle(g, x + r - 2, y + 10, 7);
  // صورت
  g.fillStyle = ch.skin; circle(g, x, y, r);
  // مو — لایهٔ بالای سر (بیضیِ صاف‌تر تا شبیه کلاه نشود)
  const HR = { short: [r + 3, 0.58], wavy: [r + 5, 0.68], curly: [r + 7, 0.76], afro: [r + 11, 0.86] }[ch.hair];
  g.fillStyle = ch.hairCol;
  g.beginPath(); g.ellipse(x, y - 30, HR[0], r * HR[1], 0, Math.PI, 0); g.fill();
  const bump = (bx, by, br) => { g.fillStyle = ch.hairCol; circle(g, bx, by, br); };
  if (ch.hair === 'short') { bump(x - 44, y - 40, 16); bump(x - 14, y - 48, 18); bump(x + 18, y - 48, 18); bump(x + 46, y - 40, 16); }
  else if (ch.hair === 'wavy') { bump(x - 48, y - 36, 19); bump(x - 16, y - 46, 21); bump(x + 18, y - 46, 21); bump(x + 48, y - 36, 19); bump(x - 62, y - 8, 14); bump(x + 62, y - 8, 14); }
  else if (ch.hair === 'curly') { bump(x - 52, y - 30, 20); bump(x - 26, y - 48, 21); bump(x + 4, y - 52, 21); bump(x + 32, y - 44, 20); bump(x + 56, y - 26, 19); bump(x - 66, y - 2, 15); bump(x + 66, y - 2, 15); }
  else if (ch.hair === 'afro') { bump(x - 56, y - 28, 26); bump(x - 28, y - 50, 27); bump(x + 6, y - 54, 27); bump(x + 38, y - 44, 26); bump(x + 60, y - 22, 24); bump(x - 70, y + 2, 20); bump(x + 70, y + 2, 20); }
  // ابرو
  g.strokeStyle = ch.hairCol; g.lineCap = 'round'; g.lineWidth = ch.browW || 7;
  g.beginPath(); g.moveTo(x - 44, y - 26); g.lineTo(x - 18, y - 18); g.stroke();
  g.beginPath(); g.moveTo(x + 44, y - 26); g.lineTo(x + 18, y - 18); g.stroke();
  // چشم‌ها (نگران به پشت!)
  g.fillStyle = '#fff'; circle(g, x - 30, y - 2, 12); circle(g, x + 30, y - 2, 12);
  g.fillStyle = '#26140b'; circle(g, x - 30 + 4, y - 1, 5.5); circle(g, x + 30 + 4, y - 1, 5.5);
  // بینی
  g.fillStyle = ch.shade; circle(g, x, y + 18, 7);
  // ریش
  const bc = ch.hairCol;
  if (ch.beard === 'full' || ch.beard === 'trimmed') {
    g.strokeStyle = bc; g.lineWidth = ch.beard === 'full' ? 26 : 18;
    g.beginPath(); g.arc(x, y + 2, r - 9, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke();
    g.fillStyle = bc; circle(g, x - (r - 12), y + 20, 12); circle(g, x + (r - 12), y + 20, 12);
  } else if (ch.beard === 'stubble') {
    g.strokeStyle = bc; g.lineWidth = 11;
    g.beginPath(); g.arc(x, y + 2, r - 7, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  }
  if (ch.beard) { // سبیل
    g.fillStyle = bc;
    g.beginPath(); g.ellipse(x - 14, y + 34, 15, 7, -0.15, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(x + 14, y + 34, 15, 7, 0.15, 0, TAU); g.fill();
  }
  // دهان
  g.strokeStyle = '#7c4a2d'; g.lineWidth = 5; g.lineCap = 'round';
  if (ch.mouth === 'smile') { g.beginPath(); g.arc(x, y + 42, 15, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
  else if (ch.mouth === 'wavy') { g.beginPath(); g.moveTo(x - 16, y + 52); g.quadraticCurveTo(x - 8, y + 46, x, y + 52); g.quadraticCurveTo(x + 8, y + 58, x + 16, y + 52); g.stroke(); }
  else { g.beginPath(); g.arc(x + 3, y + 44, 13, 0.2 * Math.PI, 0.9 * Math.PI); g.stroke(); }
  // عینک
  if (ch.glasses) {
    g.strokeStyle = '#2e2e38'; g.lineWidth = 5;
    if (ch.glasses === 'round') {
      g.beginPath(); g.arc(x - 30, y - 2, 21, 0, TAU); g.stroke();
      g.beginPath(); g.arc(x + 30, y - 2, 21, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(x - 9, y - 4); g.lineTo(x + 9, y - 4); g.stroke();
    } else {
      rr(g, x - 52, y - 16, 44, 30, 8); g.stroke();
      rr(g, x + 8, y - 16, 44, 30, 8); g.stroke();
      g.beginPath(); g.moveTo(x - 8, y - 4); g.lineTo(x + 8, y - 4); g.stroke();
    }
    g.beginPath(); g.moveTo(x - 51, y - 6); g.lineTo(x - r + 4, y - 2); g.stroke();
    g.beginPath(); g.moveTo(x + 51, y - 6); g.lineTo(x + r - 4, y - 2); g.stroke();
  }
  // شال‌گردن (مهیار)
  if (ch.scarf) {
    g.fillStyle = ch.scarf; rr(g, x - 62, y + r - 16, 124, 30, 14); g.fill();
    g.fillStyle = 'rgba(255,255,255,.14)';
    for (let i = 0; i < 5; i++) circle(g, x - 44 + i * 22, y + r - 2, 4);
  }
  return c;
}

/* ---------------- اسپرایت نگهبان (انتظامات) ---------------- */
function makeGuard() {
  const c = document.createElement('canvas'); c.width = 260; c.height = 330;
  const g = c.getContext('2d');
  const x = 130;
  // پاها
  g.fillStyle = '#23305e';
  rr(g, x - 44, 230, 36, 80, 14); g.fill();
  rr(g, x + 8, 230, 36, 80, 14); g.fill();
  g.fillStyle = '#111'; rr(g, x - 50, 300, 48, 22, 10); g.fill(); rr(g, x + 4, 300, 48, 22, 10); g.fill();
  // تنه
  g.fillStyle = '#2e3f7a'; rr(g, x - 62, 130, 124, 112, 26); g.fill();
  g.fillStyle = '#1d2a56'; rr(g, x - 62, 196, 124, 18, 8); g.fill(); // کمربند
  g.fillStyle = '#ffd93d'; circle(g, x, 205, 7);
  g.fillStyle = '#ffd93d'; circle(g, x - 20, 158, 4); circle(g, x - 20, 178, 4); circle(g, x + 20, 158, 4); circle(g, x + 20, 178, 4);
  // بازوبند
  g.fillStyle = '#e74c3c'; rr(g, x + 40, 140, 26, 34, 8); g.fill();
  // دست بالا با باتوم
  g.strokeStyle = '#2e3f7a'; g.lineWidth = 22; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - 52, 150); g.lineTo(x - 92, 96); g.stroke();
  g.beginPath(); g.moveTo(x + 52, 150); g.lineTo(x + 92, 190); g.stroke();
  g.fillStyle = '#eeb98d'; circle(g, x - 92, 96, 13); circle(g, x + 92, 190, 13);
  g.strokeStyle = '#6d4c33'; g.lineWidth = 10;
  g.beginPath(); g.moveTo(x - 92, 96); g.lineTo(x - 116, 40); g.stroke();
  // چراغ قوه
  g.fillStyle = '#555'; rr(g, x + 84, 176, 30, 16, 6); g.fill();
  // سر
  g.fillStyle = '#eeb98d'; circle(g, x, 84, 46);
  g.fillStyle = '#eeb98d'; circle(g, x - 46, 88, 10); circle(g, x + 46, 88, 10);
  // کلاه
  g.fillStyle = '#1d2a56'; g.beginPath(); g.arc(x, 70, 50, Math.PI, 0); g.fill();
  rr(g, x - 52, 62, 104, 16, 8); g.fill();
  g.fillStyle = '#11182f'; rr(g, x - 56, 74, 112, 10, 5); g.fill();
  g.fillStyle = '#ffd93d'; circle(g, x, 56, 7);
  // صورت عصبانی
  g.strokeStyle = '#3a2a1a'; g.lineWidth = 7; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - 34, 78); g.lineTo(x - 12, 88); g.stroke();
  g.beginPath(); g.moveTo(x + 34, 78); g.lineTo(x + 12, 88); g.stroke();
  g.fillStyle = '#fff'; circle(g, x - 20, 94, 9); circle(g, x + 20, 94, 9);
  g.fillStyle = '#26140b'; circle(g, x - 20, 96, 4); circle(g, x + 20, 96, 4);
  g.fillStyle = '#4a2f1d';
  g.beginPath(); g.ellipse(x - 12, 116, 14, 7, -0.12, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(x + 12, 116, 14, 7, 0.12, 0, TAU); g.fill();
  g.strokeStyle = '#7c4a2d'; g.lineWidth = 5;
  g.beginPath(); g.arc(x, 136, 12, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); // اخم
  return c;
}

/* ---------------- اسپرایت موانع ---------------- */
const OB_DEFS = {}; // kind -> {img, type, hMul}
function obCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function buildObstacles() {
  // سطل زباله (کامل)
  {
    const [c, g] = obCanvas(200, 240);
    g.fillStyle = '#1f8a70'; rr(g, 30, 60, 140, 160, 18); g.fill();
    g.fillStyle = '#157059'; rr(g, 46, 84, 20, 116, 8); g.fill(); rr(g, 90, 84, 20, 116, 8); g.fill(); rr(g, 134, 84, 20, 116, 8); g.fill();
    g.fillStyle = '#25a184'; rr(g, 20, 42, 160, 26, 12); g.fill();
    g.fillStyle = '#111'; circle(g, 60, 226, 12); circle(g, 140, 226, 12);
    g.strokeStyle = '#7aa77a'; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(60, 30); g.quadraticCurveTo(70, 18, 62, 8); g.stroke();
    g.beginPath(); g.moveTo(120, 28); g.quadraticCurveTo(132, 16, 124, 6); g.stroke();
    g.fillStyle = '#333'; circle(g, 96, 20, 3); circle(g, 140, 12, 3);
    OB_DEFS.bin = { img: c, type: 'full', hMul: 1.05 };
  }
  // چرخ نظافت (کامل)
  {
    const [c, g] = obCanvas(240, 250);
    g.fillStyle = '#f2b632'; rr(g, 30, 110, 180, 110, 16); g.fill();
    g.fillStyle = '#d99a17'; rr(g, 30, 150, 180, 22, 8); g.fill();
    g.fillStyle = '#2f8fe6'; rr(g, 52, 52, 80, 62, 12); g.fill();
    g.fillStyle = '#2570b8'; rr(g, 46, 44, 92, 16, 8); g.fill();
    g.strokeStyle = '#8d6e4a'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(170, 110); g.lineTo(210, 30); g.stroke();
    g.fillStyle = '#cfd8dc'; circle(g, 212, 26, 14);
    g.fillStyle = '#111'; circle(g, 60, 232, 14); circle(g, 180, 232, 14);
    OB_DEFS.cart = { img: c, type: 'full', hMul: 1.05 };
  }
  // در نیمه‌باز (کامل)
  {
    const [c, g] = obCanvas(210, 280);
    g.fillStyle = '#5d4037'; rr(g, 20, 10, 170, 260, 10); g.fill();
    g.fillStyle = '#26160f'; rr(g, 36, 26, 138, 244, 8); g.fill();
    g.save(); g.translate(40, 30); g.transform(1, 0, -0.35, 1, 0, 0);
    g.fillStyle = '#8d6e63'; rr(g, 0, 0, 90, 236, 8); g.fill();
    g.fillStyle = '#ffd93d'; circle(g, 76, 120, 7); g.restore();
    g.fillStyle = '#fff8e1'; rr(g, 70, 60, 70, 34, 8); g.fill();
    g.fillStyle = '#c62828'; g.font = 'bold 24px Vazirmatn, Tahoma'; g.textAlign = 'center'; g.fillText('۳۰۶', 105, 85);
    OB_DEFS.door = { img: c, type: 'full', hMul: 1.2 };
  }
  // نگهبان جهنده از در (کامل)
  {
    const [c, g] = obCanvas(220, 280);
    g.fillStyle = '#5d4037'; rr(g, 15, 10, 190, 260, 10); g.fill();
    g.fillStyle = '#1a0f08'; rr(g, 30, 26, 160, 244, 8); g.fill();
    const gu = makeGuard();
    g.drawImage(gu, 40, 40, 140, 178);
    g.fillStyle = '#ffd93d'; g.font = '900 44px Vazirmatn, Tahoma'; g.textAlign = 'center'; g.fillText('!', 190, 60);
    OB_DEFS.guardpop = { img: c, type: 'full', hMul: 1.2 };
  }
  // بند رخت (سرخوردن)
  {
    const [c, g] = obCanvas(260, 300);
    g.fillStyle = '#90a4ae'; rr(g, 16, 40, 14, 250, 6); g.fill(); rr(g, 230, 40, 14, 250, 6); g.fill();
    g.strokeStyle = '#eceff1'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(20, 78); g.lineTo(240, 78); g.stroke();
    // لباس‌ها
    g.fillStyle = '#f06292'; rr(g, 48, 80, 62, 78, 10); g.fill();
    g.fillStyle = '#f06292'; rr(g, 36, 82, 16, 34, 7); g.fill(); rr(g, 106, 82, 16, 34, 7); g.fill();
    g.fillStyle = '#fff'; rr(g, 128, 80, 26, 44, 8); g.fill(); rr(g, 160, 80, 26, 44, 8); g.fill();
    g.fillStyle = '#4dd0e1'; rr(g, 196, 80, 40, 66, 8); g.fill();
    g.fillStyle = '#fff'; for (let i = 0; i < 3; i++) rr(g, 200, 92 + i * 18, 32, 7, 3), g.fill();
    g.strokeStyle = '#b0bec5'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(79, 78); g.lineTo(79, 70); g.stroke();
    OB_DEFS.laundry = { img: c, type: 'high', hMul: 1.3 };
  }
  // دوربین مداربسته (سرخوردن)
  {
    const [c, g] = obCanvas(250, 290);
    g.fillStyle = '#78909c'; rr(g, 14, 30, 14, 250, 6); g.fill(); rr(g, 222, 30, 14, 250, 6); g.fill();
    g.fillStyle = '#546e7a'; rr(g, 14, 40, 222, 16, 8); g.fill();
    g.fillStyle = '#37474f'; rr(g, 92, 56, 66, 44, 10); g.fill();
    g.fillStyle = '#263238'; circle(g, 146, 78, 14);
    g.fillStyle = '#4fc3f7'; circle(g, 146, 78, 7);
    g.fillStyle = '#ff1744'; circle(g, 100, 66, 5);
    g.strokeStyle = 'rgba(255,23,68,.5)'; g.lineWidth = 3; g.beginPath(); g.arc(100, 66, 10, 0, TAU); g.stroke();
    OB_DEFS.cctv = { img: c, type: 'high', hMul: 1.3 };
  }
  // جعبه پیتزا (پرش)
  {
    const [c, g] = obCanvas(220, 130);
    g.fillStyle = '#e8e0d0'; rr(g, 20, 70, 180, 44, 8); g.fill();
    g.fillStyle = '#d7cdb8'; rr(g, 20, 70, 180, 12, 6); g.fill();
    g.fillStyle = '#f4f0e6'; rr(g, 34, 28, 152, 44, 8); g.fill();
    g.fillStyle = '#e05038'; g.font = 'bold 26px Vazirmatn, Tahoma'; g.textAlign = 'center'; g.fillText('🍕', 110, 60);
    g.fillStyle = '#c9bfa8'; circle(g, 60, 100, 5); circle(g, 160, 96, 4);
    OB_DEFS.box = { img: c, type: 'low', hMul: 0.5 };
  }
  // صندلی افتاده (پرش)
  {
    const [c, g] = obCanvas(220, 140);
    g.fillStyle = '#8d6e63';
    rr(g, 20, 84, 150, 22, 10); g.fill(); // نشیمن خوابیده
    rr(g, 150, 30, 20, 80, 8); g.fill(); // پشتی
    g.strokeStyle = '#6d4c41'; g.lineWidth = 12; g.lineCap = 'round';
    g.beginPath(); g.moveTo(40, 100); g.lineTo(30, 132); g.stroke();
    g.beginPath(); g.moveTo(140, 100); g.lineTo(150, 132); g.stroke();
    g.beginPath(); g.moveTo(70, 96); g.lineTo(64, 128); g.stroke();
    OB_DEFS.chair = { img: c, type: 'low', hMul: 0.5 };
  }
  // سطل و تی (پرش)
  {
    const [c, g] = obCanvas(180, 140);
    g.fillStyle = '#f07f2e'; g.beginPath(); g.moveTo(30, 50); g.lineTo(150, 50); g.lineTo(136, 130); g.lineTo(44, 130); g.closePath(); g.fill();
    g.fillStyle = '#d96a17'; rr(g, 24, 40, 132, 16, 8); g.fill();
    g.strokeStyle = '#8d6e4a'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(110, 46); g.lineTo(160, -6 + 20); g.stroke();
    g.fillStyle = '#cfd8dc'; circle(g, 158, 16, 13);
    OB_DEFS.bucket = { img: c, type: 'low', hMul: 0.5 };
  }
}

/* ---------------- اسپرایت آیتم‌ها ---------------- */
let CIG_IMG = null;
function buildCig() {
  const [c, g] = obCanvas(64, 28);
  g.save(); g.translate(32, 14); g.rotate(-0.12);
  g.fillStyle = '#f7f3ea'; rr(g, -30, -7, 44, 14, 7); g.fill();
  g.fillStyle = '#ff8c42'; rr(g, 6, -7, 10, 14, 4); g.fill();
  g.fillStyle = '#9e9e9e'; rr(g, 16, -7, 12, 14, 6); g.fill();
  g.fillStyle = '#ffd93d'; circle(g, -20, -12, 3); circle(g, 24, -12, 2.5);
  g.restore();
  CIG_IMG = c;
}
const POW_DEFS = {};
function buildPows() {
  const mk = (col, draw) => {
    const [c, g] = obCanvas(96, 96);
    const gr = g.createRadialGradient(48, 48, 6, 48, 48, 46);
    gr.addColorStop(0, 'rgba(255,255,255,.95)');
    gr.addColorStop(0.35, col);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; circle(g, 48, 48, 46);
    draw(g);
    return c;
  };
  POW_DEFS.boost = mk('rgba(255,140,66,.9)', g => {
    g.fillStyle = '#ff6d00';
    g.beginPath(); g.moveTo(48, 18); g.quadraticCurveTo(68, 42, 60, 62); g.quadraticCurveTo(56, 74, 48, 78); g.quadraticCurveTo(40, 74, 36, 62); g.quadraticCurveTo(28, 42, 48, 18); g.fill();
    g.fillStyle = '#ffd93d';
    g.beginPath(); g.moveTo(48, 38); g.quadraticCurveTo(58, 52, 52, 66); g.quadraticCurveTo(50, 72, 48, 74); g.quadraticCurveTo(46, 72, 44, 66); g.quadraticCurveTo(38, 52, 48, 38); g.fill();
  });
  POW_DEFS.magnet = mk('rgba(255,94,94,.9)', g => {
    g.strokeStyle = '#e53935'; g.lineWidth = 14; g.lineCap = 'butt';
    g.beginPath(); g.arc(48, 44, 20, Math.PI, 0); g.stroke();
    g.fillStyle = '#e53935'; g.fillRect(28, 44, 14, 20); g.fillRect(54, 44, 14, 20);
    g.fillStyle = '#eceff1'; g.fillRect(28, 62, 14, 10); g.fillRect(54, 62, 14, 10);
  });
  POW_DEFS.x2 = mk('rgba(255,217,61,.95)', g => {
    g.fillStyle = '#7a4d00'; g.font = '900 40px Vazirmatn, Tahoma'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('×۲', 48, 52);
  });
  POW_DEFS.shield = mk('rgba(79,195,247,.9)', g => {
    g.fillStyle = '#1e88e5';
    g.beginPath(); g.moveTo(48, 18); g.lineTo(74, 30); g.lineTo(70, 58); g.quadraticCurveTo(64, 74, 48, 80); g.quadraticCurveTo(32, 74, 26, 58); g.lineTo(22, 30); g.closePath(); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(38, 50); g.lineTo(46, 60); g.lineTo(62, 40); g.stroke();
  });
  POW_DEFS.high = mk('rgba(126,227,138,.9)', g => {
    g.fillStyle = '#fff'; rr(g, 24, 48, 48, 18, 9); g.fill();
    g.fillStyle = '#263238'; rr(g, 22, 62, 52, 8, 4); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(20, 38); g.lineTo(34, 38); g.stroke();
    g.beginPath(); g.moveTo(16, 28); g.lineTo(38, 28); g.stroke();
  });
}

/* ---------------- منطقه‌های محیطی ---------------- */
const ZONES = [
  { name: 'سالن خوابگاه', skyTop: '#241a4e', skyBot: '#3c2a6e', ground: '#4a3f66', road: '#3a3153', wall: '#5d4a86', prop: 'hall' },
  { name: 'حیاط خوابگاه', skyTop: '#101439', skyBot: '#27356e', ground: '#2e4a3f', road: '#333a52', wall: '#3f5a4a', prop: 'yard' },
  { name: 'کوچه‌های اطراف', skyTop: '#1a1030', skyBot: '#43206e', ground: '#4a3a52', road: '#3b3048', wall: '#6e4a5a', prop: 'alley' }
];
const ZONE_LEN = 380;

/* ---------------- صدا (Web Audio سینتتیک) ---------------- */
const AU = {
  ctx: null, master: null, muted: store.get('fed_muted', false),
  noise: null, musTimer: null, step: 0, nextT: 0,
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.5;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; return false; }
    return true;
  },
  setMuted(m) {
    this.muted = m; store.set('fed_muted', m);
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
  },
  blip(f, dur, type, vol, slide) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + dur);
    g.gain.setValueAtTime(vol || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },
  noiseHit(dur, vol, freq) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 900;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t); s.stop(t + dur);
  },
  click() { this.blip(760, 0.07, 'square', 0.12); },
  collect(combo) { this.blip(520 + Math.min(combo, 14) * 45, 0.09, 'square', 0.12, 900 + combo * 40); },
  jump() { this.blip(280, 0.18, 'sine', 0.2, 640); },
  slide() { this.noiseHit(0.22, 0.18, 700); },
  lane() { this.blip(420, 0.06, 'triangle', 0.1); },
  crash() { this.noiseHit(0.5, 0.45, 500); this.blip(160, 0.4, 'sawtooth', 0.25, 60); },
  power() { [660, 880, 1100].forEach((f, i) => setTimeout(() => this.blip(f, 0.1, 'square', 0.14), i * 70)); },
  shieldPop() { this.blip(1200, 0.2, 'triangle', 0.2, 300); },
  whistle() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    for (let k = 0; k < 2; k++) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'sine';
      const st = t + k * 0.22;
      o.frequency.setValueAtTime(1900, st);
      o.frequency.linearRampToValueAtTime(2400, st + 0.09);
      o.frequency.linearRampToValueAtTime(1900, st + 0.18);
      g.gain.setValueAtTime(0.0001, st);
      g.gain.linearRampToValueAtTime(0.12, st + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.2);
      o.connect(g); g.connect(this.master); o.start(st); o.stop(st + 0.22);
    }
  },
  overJingle() { [500, 400, 300, 220].forEach((f, i) => setTimeout(() => this.blip(f, 0.22, 'triangle', 0.2), i * 140)); },
  /* موسیقی پس‌زمینه — لوپ شاد */
  MELODY: [0, -1, 3, -1, 5, -1, 3, -1, 7, -1, 5, 3, 0, -1, 3, -1, 10, -1, 7, -1, 5, -1, 3, -1, 12, -1, 10, 7, 5, 3, 0, -1],
  startMusic() {
    if (!this.ctx || this.musTimer) return;
    this.step = 0; this.nextT = this.ctx.currentTime + 0.1;
    this.musTimer = setInterval(() => this.sched(), 40);
  },
  stopMusic() { if (this.musTimer) { clearInterval(this.musTimer); this.musTimer = null; } },
  sched() {
    if (!this.ctx || this.muted) { if (this.ctx) this.nextT = this.ctx.currentTime + 0.1; return; }
    const spb = 60 / 118 / 2; // هشتم نت
    while (this.nextT < this.ctx.currentTime + 0.15) {
      const s = this.step % 32;
      const m = this.MELODY[s];
      if (m >= 0) this.note(440 * Math.pow(2, m / 12), this.nextT, spb * 0.9, 'triangle', 0.07);
      if (s % 8 === 0) this.note(110 * (s % 16 === 8 ? 1.26 : 1), this.nextT, spb * 3, 'square', 0.06);
      if (s % 4 === 2) this.hat(this.nextT);
      this.nextT += spb; this.step++;
    }
  },
  note(f, t, dur, type, vol) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  hat(t) {
    const s = this.ctx.createBufferSource(); s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + 0.06);
  }
};

/* ---------------- متغیرهای صحنه ---------------- */
let W = 0, H = 0, DPR = 1, CX = 0;
let LANEW = 120, CH = 140, HOR = 100, BASEY = 300;
const CAMD = 7, MAXZ = 80;
let skyCan = null, cityCan = null;
let guardImg = null;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  CX = W / 2;
  LANEW = clamp(W * 0.26, 80, 240);
  CH = clamp(H * 0.18, 100, 190);
  HOR = H * 0.30; BASEY = H * 0.87;
  buildSky(); buildCity();
}
function buildSky() {
  skyCan = document.createElement('canvas'); skyCan.width = W; skyCan.height = Math.ceil(HOR + 60);
  const g = skyCan.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, HOR + 60);
  gr.addColorStop(0, '#0d0b2a'); gr.addColorStop(0.6, '#241a4e'); gr.addColorStop(1, '#3c2a6e');
  g.fillStyle = gr; g.fillRect(0, 0, W, HOR + 60);
  for (let i = 0; i < 70; i++) {
    g.fillStyle = 'rgba(255,255,255,' + rand(0.3, 1) + ')';
    circle(g, rand(0, W), rand(0, HOR * 0.9), rand(0.6, 1.8));
  }
  // ماه
  const mx = W * 0.8, my = HOR * 0.32;
  const mg = g.createRadialGradient(mx, my, 4, mx, my, 60);
  mg.addColorStop(0, 'rgba(255,244,200,.9)'); mg.addColorStop(0.35, 'rgba(255,244,200,.25)'); mg.addColorStop(1, 'rgba(255,244,200,0)');
  g.fillStyle = mg; circle(g, mx, my, 60);
  g.fillStyle = '#fff4c8'; circle(g, mx, my, 22);
  g.fillStyle = 'rgba(210,190,140,.6)'; circle(g, mx - 7, my - 4, 5); circle(g, mx + 6, my + 7, 4);
}
function buildCity() {
  cityCan = document.createElement('canvas'); cityCan.width = W; cityCan.height = Math.ceil(H * 0.24);
  const g = cityCan.getContext('2d');
  const bh = cityCan.height;
  g.fillStyle = '#191338';
  let x = -10;
  while (x < W + 10) {
    const bw = rand(40, 90), bhh = rand(bh * 0.4, bh * 0.95);
    g.fillRect(x, bh - bhh, bw, bhh);
    g.fillStyle = '#ffd93d';
    for (let wy = bh - bhh + 8; wy < bh - 8; wy += 14)
      for (let wx = x + 6; wx < x + bw - 8; wx += 13)
        if (Math.random() < 0.28) { g.globalAlpha = rand(0.4, 1); g.fillRect(wx, wy, 5, 7); }
    g.globalAlpha = 1; g.fillStyle = '#191338';
    x += bw + rand(4, 18);
  }
}

/* ---------------- وضعیت بازی ---------------- */
let S = null;
let selectedChar = store.get('fed_char', 'parsa');
if (!CHARS.some(c => c.id === selectedChar)) selectedChar = 'parsa';
CHARS.forEach(ch => { ch._head = makeHead(ch); });
buildObstacles(); buildCig(); buildPows();
guardImg = makeGuard();

function newState() {
  return {
    mode: 'idle', paused: false,
    t: 0, dist: 0, speed: 13,
    x: 0, targetLane: 0,
    jumpY: 0, vy: 0, airborne: false, jumpBuf: 0,
    slideT: 0, fastFall: false,
    cigs: 0, cigScore: 0, combo: 0, lastCollect: -9,
    pows: { boost: 0, magnet: 0, x2: 0, high: 0 }, shield: false,
    inv: 0, danger: 0.18, shake: 0, whistleCd: 0,
    ents: [], parts: [], floats: [],
    nextRowZ: 30, nextPowT: 6, rowId: 0,
    catchT: 0, guardX: 0,
    charId: selectedChar,
    lastDangerInt: -1, lastHud: ''
  };
}
S = newState();
const charOf = () => CHARS.find(c => c.id === S.charId) || CHARS[0];

/* ---------------- رکوردها ---------------- */
function getRecords() { return store.get('fed_records_v1', {}); }
function getBest(id) { const r = getRecords(); return r[id] || { score: 0, cigs: 0, dist: 0 }; }
function saveRun() {
  const r = getRecords();
  const score = finalScore();
  const prev = r[S.charId] || { score: 0, cigs: 0, dist: 0 };
  const isRec = score > prev.score;
  if (isRec) r[S.charId] = { score, cigs: S.cigs, dist: Math.floor(S.dist) };
  store.set('fed_records_v1', r);
  return { isRec, best: Math.max(score, prev.score) };
}
const finalScore = () => Math.floor(S.dist) + S.cigScore;

/* ---------------- اسپاون ---------------- */
const OBS_KINDS = { low: ['box', 'chair', 'bucket'], high: ['laundry', 'cctv'], full: ['bin', 'cart', 'door', 'guardpop'] };
function pickObs(diff) {
  const r = Math.random();
  let type;
  if (diff < 0.25) type = r < 0.45 ? 'low' : r < 0.8 ? 'high' : 'full';
  else if (diff < 0.6) type = r < 0.38 ? 'low' : r < 0.68 ? 'high' : 'full';
  else type = r < 0.32 ? 'low' : r < 0.6 ? 'high' : 'full';
  let kinds = OBS_KINDS[type];
  if (type === 'full' && (S.dist < 250 || Math.random() < 0.5)) kinds = ['bin', 'cart', 'door'];
  let kind = choice(kinds);
  if (kind === 'guardpop' && S.dist < 350) kind = 'door';
  return { kind, type };
}
function spawnRow() {
  const diff = clamp(S.dist / 2500, 0, 1);
  const lanes = [-1, 0, 1].map(() => Math.random() < 0.62 ? pickObs(diff) : null);
  // تضمین مسیر باز: هرگز هر ۳ لاین «کامل» نشود
  const types = lanes.map(l => l ? l.type : 'open');
  if (types.every(t => t === 'full')) {
    const i = randi(0, 2);
    lanes[i] = Math.random() < 0.5 ? { kind: choice(OBS_KINDS.low), type: 'low' } : null;
  }
  if (diff < 0.3) { // اوایل بازی: حداکثر یک مانع کامل
    let fulls = lanes.filter(l => l && l.type === 'full').length;
    for (let i = 0; i < 3 && fulls > 1; i++) if (lanes[i] && lanes[i].type === 'full') { lanes[i].type = 'low'; lanes[i].kind = choice(OBS_KINDS.low); fulls--; }
  }
  const z = S.nextRowZ;
  lanes.forEach((o, i) => {
    if (!o) return;
    S.ents.push(getEnt('obs', i - 1, z, o.kind, o.type));
  });
  // نخ‌سیگارها
  if (Math.random() < 0.7) {
    const li = randi(0, 2);
    const o = lanes[li];
    const n = randi(4, 7);
    const arc = (o && o.type === 'low') ? 1 : 0;
    for (let k = 0; k < n; k++) {
      const e = getEnt('cig', li - 1, z + 4 + k * 2.4, null, null);
      e.yOff = arc ? Math.sin(Math.PI * k / (n - 1)) * 0.85 : 0;
      S.ents.push(e);
    }
  }
  const gap = clamp(S.speed * 1.05, 12, 30) + rand(2, 8);
  S.nextRowZ += gap;
  S.rowId++;
}
const entPool = [];
function getEnt(kind, lane, z, okind, otype) {
  const e = entPool.pop() || {};
  e.kind = kind; e.lane = lane; e.z = z; e.okind = okind; e.otype = otype;
  e.yOff = 0; e.dead = false; e.spin = rand(0, TAU);
  return e;
}
function spawnPow() {
  const active = S.pows;
  const opts = ['boost', 'magnet', 'x2', 'high'];
  if (!S.shield) opts.push('shield', 'shield');
  let kind = choice(opts);
  const lane = randi(-1, 1);
  // تداخل با مانع کامل همان لاین نداشته باشد
  const z = S.dist + MAXZ - 4;
  for (const e of S.ents) if (e.kind === 'obs' && e.otype === 'full' && e.lane === lane && Math.abs(e.z - z) < 5) return;
  S.ents.push(getEnt('pow', lane, z, kind, null));
}

/* ---------------- ورودی ---------------- */
const queue = [];
function queueAction(a) { if (queue.length < 2) queue.push(a); }
let pDown = null;
canvas.addEventListener('pointerdown', e => {
  pDown = { x: e.clientX, y: e.clientY, id: e.pointerId };
  e.preventDefault();
});
canvas.addEventListener('pointermove', e => {
  if (!pDown || e.pointerId !== pDown.id) return;
  const dx = e.clientX - pDown.x, dy = e.clientY - pDown.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 26) return;
  if (Math.abs(dx) > Math.abs(dy)) queueAction(dx > 0 ? 'R' : 'L');
  else queueAction(dy > 0 ? 'D' : 'U');
  pDown.x = e.clientX; pDown.y = e.clientY; // اجازهٔ سوائپ پشت‌سرهم
});
['pointerup', 'pointercancel'].forEach(ev => canvas.addEventListener(ev, () => { pDown = null; }));
window.addEventListener('keydown', e => {
  const k = e.key;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault();
  if (S.mode !== 'play' || S.paused) return;
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') queueAction('L');
  else if (k === 'ArrowRight' || k === 'd' || k === 'D') queueAction('R');
  else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') queueAction('U');
  else if (k === 'ArrowDown' || k === 's' || k === 'S') queueAction('D');
  else if (k === 'p' || k === 'P' || k === 'Escape') togglePause();
});

/* ---------------- ذرات ---------------- */
function burst(x, y, col, n, spd) {
  for (let i = 0; i < n && S.parts.length < 220; i++) {
    S.parts.push({ x, y, vx: rand(-spd, spd), vy: rand(-spd, spd * 0.4), life: rand(0.3, 0.7), max: 0.7, col, r: rand(2, 5) });
  }
}
function floatText(x, y, txt, col) {
  if (S.floats.length < 12) S.floats.push({ x, y, txt, col, life: 1 });
}

/* ---------------- بروزرسانی ---------------- */
function update(dt) {
  if (S.mode === 'play') updatePlay(dt);
  else if (S.mode === 'catch') {
    S.catchT += dt;
    S.shake = Math.max(S.shake, 0.4 * (1 - S.catchT));
    updateParts(dt);
    if (S.catchT > 1.15) showOver();
  }
}
function updatePlay(dt) {
  S.t += dt;
  const base = Math.min(28, 13 + S.dist * 0.0045);
  S.speed = Math.min(34, base * (S.pows.boost > 0 ? 1.45 : 1));
  if (!isFinite(S.speed) || S.speed <= 0) S.speed = 13;
  S.dist += S.speed * dt;

  // تایمرها
  for (const k in S.pows) S.pows[k] = Math.max(0, S.pows[k] - dt);
  S.inv = Math.max(0, S.inv - dt);
  S.slideT = Math.max(0, S.slideT - dt);
  S.jumpBuf = Math.max(0, S.jumpBuf - dt);
  S.shake = Math.max(0, S.shake - dt * 1.6);
  S.whistleCd -= dt;

  // پردازش صف ورودی (حداکثر ۲ در هر فریم — ضد multi-swipe)
  let n = 0;
  while (queue.length && n < 2) {
    const a = queue.shift(); n++;
    if (a === 'L') { if (S.targetLane > -1) { S.targetLane--; AU.lane(); } }
    else if (a === 'R') { if (S.targetLane < 1) { S.targetLane++; AU.lane(); } }
    else if (a === 'U') { if (!S.airborne) doJump(); else S.jumpBuf = 0.18; }
    else if (a === 'D') {
      if (S.airborne) { S.vy = -14; S.fastFall = true; }
      else if (S.slideT <= 0) { S.slideT = 0.72; AU.slide(); }
    }
  }
  // حرکت نرم بین لاین‌ها
  S.x += (S.targetLane - S.x) * Math.min(1, dt * 13);
  if (Math.abs(S.targetLane - S.x) < 0.01) S.x = S.targetLane;
  S.x = clamp(S.x, -1, 1);

  // فیزیک پرش
  if (S.airborne) {
    S.jumpY += S.vy * dt;
    S.vy -= 15 * dt;
    if (S.jumpY <= 0) {
      S.jumpY = 0; S.vy = 0; S.airborne = false; S.fastFall = false;
      if (S.jumpBuf > 0) { S.jumpBuf = 0; doJump(); }
    }
  }

  // اسپاون
  while (S.nextRowZ < S.dist + MAXZ) spawnRow();
  S.nextPowT -= dt;
  if (S.nextPowT <= 0) { S.nextPowT = rand(8, 14); spawnPow(); }

  // موجودیت‌ها
  const magnet = S.pows.magnet > 0;
  for (let i = S.ents.length - 1; i >= 0; i--) {
    const e = S.ents[i];
    const rel = e.z - S.dist;
    if (rel < -3 || e.dead) { entPool.push(e); S.ents.splice(i, 1); continue; }
    if (e.kind === 'cig') {
      if (magnet && rel < 16 && rel > -1 && Math.abs(e.lane - S.x) <= 1.3) {
        e.lane += (S.x - e.lane) * Math.min(1, dt * 9);
        e.yOff += (0 - e.yOff) * Math.min(1, dt * 9);
      }
      if (rel < 0.7 && rel > -0.5 && Math.abs(e.lane - S.x) < 0.5) {
        e.dead = true;
        S.cigs++;
        const mul = S.pows.x2 > 0 ? 2 : 1;
        S.cigScore += 5 * mul;
        S.combo = (S.t - S.lastCollect < 1.2) ? S.combo + 1 : 0;
        S.lastCollect = S.t;
        AU.collect(S.combo);
        const px = laneX(e.lane, 1), py = BASEY - CH * 0.5;
        burst(px, py, '#ffd93d', 6, 160);
        if (mul === 2) floatText(px, py - 30, '+۱۰', '#ffe9a8');
      }
    } else if (e.kind === 'pow') {
      if (rel < 0.8 && rel > -0.5 && Math.abs(e.lane - S.x) < 0.55) {
        e.dead = true; applyPow(e.okind);
      }
    } else if (e.kind === 'obs') {
      if (S.mode === 'play' && rel < 0.55 && rel > -0.45 && Math.abs(e.lane - S.x) < 0.5 && S.inv <= 0) {
        const safe =
          (e.otype === 'low' && S.jumpY > 0.45) ||
          (e.otype === 'high' && S.slideT > 0 && S.jumpY < 0.2);
        if (!safe) { e.dead = true; hitObstacle(); }
      }
    }
  }

  // خطر انتظامات
  S.danger = clamp(0.18 + Math.min(0.55, S.dist / 2600) + 0.06 * Math.sin(S.t * 0.8), 0, 0.92);
  if (S.danger > 0.72 && S.whistleCd <= 0) { S.whistleCd = 6; AU.whistle(); S.shake = Math.max(S.shake, 0.22); }

  // شعلهٔ بوست
  if (S.pows.boost > 0 && S.parts.length < 200) {
    S.parts.push({ x: laneX(S.x, 1) + rand(-8, 8), y: BASEY - rand(0, CH * 0.4), vx: rand(-30, 30), vy: rand(60, 160), life: 0.4, max: 0.4, col: choice(['#ff6d00', '#ffd93d', '#ff9e40']), r: rand(3, 7) });
  }
  updateParts(dt);
}
function updateParts(dt) {
  for (let i = S.parts.length - 1; i >= 0; i--) {
    const p = S.parts[i];
    p.life -= dt; if (p.life <= 0) { S.parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt;
  }
  for (let i = S.floats.length - 1; i >= 0; i--) {
    const f = S.floats[i];
    f.life -= dt * 1.1; f.y -= 50 * dt;
    if (f.life <= 0) S.floats.splice(i, 1);
  }
}
function doJump() {
  S.airborne = true; S.slideT = 0;
  S.vy = 5.6 * (S.pows.high > 0 ? 1.32 : 1);
  AU.jump();
}
function applyPow(kind) {
  AU.power();
  const px = laneX(S.x, 1), py = BASEY - CH * 0.7;
  if (kind === 'shield') { S.shield = true; floatText(px, py, 'سپر! 🛡️', '#8fd3ff'); }
  else {
    S.pows[kind] = kind === 'boost' ? 4 : kind === 'magnet' ? 7 : kind === 'x2' ? 6 : 6;
    const names = { boost: 'بوست سرعت! 🔥', magnet: 'آهنربا! 🧲', x2: 'امتیاز ×۲! ✨', high: 'پرش بلند! 👟' };
    floatText(px, py, names[kind], '#aef3ff');
  }
  burst(px, py, '#aef3ff', 12, 220);
}
function hitObstacle() {
  if (S.shield) {
    S.shield = false; S.inv = 1.3;
    AU.shieldPop();
    burst(laneX(S.x, 1), BASEY - CH * 0.6, '#4fc3f7', 16, 260);
    floatText(laneX(S.x, 1), BASEY - CH, 'نجات یافتی! 🛡️', '#8fd3ff');
    S.shake = Math.max(S.shake, 0.35);
    return;
  }
  S.mode = 'catch'; S.catchT = 0;
  AU.crash(); setTimeout(() => AU.whistle(), 250);
  S.shake = 0.7;
  burst(laneX(S.x, 1), BASEY - CH * 0.5, '#ff8a80', 20, 300);
}

/* ----------------投影 تصویر ---------------- */
const proj = z => CAMD / (CAMD + z);
const gy = s => HOR + (BASEY - HOR) * s;
const laneX = (l, s) => CX + l * LANEW * s;

/* ---------------- ترسیم ---------------- */
function zoneBlend() {
  const az = S.dist;
  const zi = Math.floor(az / ZONE_LEN) % 3;
  const ni = (zi + 1) % 3;
  const f = az % ZONE_LEN;
  const t = f > ZONE_LEN - 50 ? (f - (ZONE_LEN - 50)) / 50 : 0;
  return [ZONES[zi], ZONES[ni], t];
}
function draw() {
  const [za, zb, zt] = zoneBlend();
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (S.shake > 0) ctx.translate(rand(-1, 1) * S.shake * 10, rand(-1, 1) * S.shake * 8);

  // آسمان
  if (skyCan) ctx.drawImage(skyCan, 0, 0);
  // سیلوئت شهر
  if (cityCan) ctx.drawImage(cityCan, 0, HOR - cityCan.height + 6);

  // زمین
  const gcol = zt > 0 ? mix(za.ground, zb.ground, zt) : za.ground;
  ctx.fillStyle = gcol;
  ctx.fillRect(0, HOR, W, H - HOR);

  // جاده
  const sFar = proj(MAXZ), sNear = 1.35;
  const rw = 1.62;
  ctx.fillStyle = zt > 0 ? mix(za.road, zb.road, zt) : za.road;
  ctx.beginPath();
  ctx.moveTo(laneX(-rw, sFar), gy(sFar));
  ctx.lineTo(laneX(rw, sFar), gy(sFar));
  ctx.lineTo(laneX(rw, sNear), gy(sNear));
  ctx.lineTo(laneX(-rw, sNear), gy(sNear));
  ctx.closePath(); ctx.fill();
  // پیاده‌رو کناری
  ctx.fillStyle = 'rgba(255,255,255,.09)';
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(laneX(sgn * rw, sFar), gy(sFar));
    ctx.lineTo(laneX(sgn * (rw + 0.5), sFar), gy(sFar));
    ctx.lineTo(laneX(sgn * (rw + 0.5), sNear), gy(sNear));
    ctx.lineTo(laneX(sgn * rw, sNear), gy(sNear));
    ctx.closePath(); ctx.fill();
  }
  // دیوارهای کناری
  const wallCol = zt > 0 ? mix(za.wall, zb.wall, zt) : za.wall;
  ctx.fillStyle = wallCol;
  for (const sgn of [-1, 1]) {
    const wx = 2.15;
    ctx.beginPath();
    ctx.moveTo(laneX(sgn * wx, sFar), gy(sFar));
    ctx.lineTo(laneX(sgn * wx, sFar), gy(sFar) - H * 0.42 * sFar);
    ctx.lineTo(laneX(sgn * wx, sNear), gy(sNear) - H * 0.42 * sNear);
    ctx.lineTo(laneX(sgn * wx, sNear), gy(sNear));
    ctx.closePath(); ctx.fill();
  }
  // خط‌کشی لاین‌ها
  ctx.fillStyle = 'rgba(255,235,150,.5)';
  const dash = 5;
  const off = S.dist % dash;
  for (let z = MAXZ - ((MAXZ + off) % dash); z > -1; z -= dash) {
    const s = proj(Math.max(z, 0.01));
    for (const b of [-0.5, 0.5]) {
      const wq = Math.max(2, LANEW * 0.06 * s);
      ctx.fillRect(laneX(b, s) - wq / 2, gy(s) - 2 * s, wq, Math.max(3, 14 * s));
    }
  }
  // اشیای کناری (در/درخت/تیر چراغ) + ریسمان چراغ سالن
  const propStep = 16;
  const poff = S.dist % propStep;
  for (let z = MAXZ - poff; z > 0; z -= propStep) {
    const az2 = S.dist + z;
    const zn = ZONES[Math.floor(az2 / ZONE_LEN) % 3];
    const s = proj(z);
    const y = gy(s);
    for (const sgn of [-1, 1]) {
      const px = laneX(sgn * 2.5, s);
      drawProp(zn.prop, px, y, s, az2);
    }
    if (zn.prop === 'hall') { // ریسمان چراغ
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = Math.max(1, 2 * s);
      ctx.beginPath(); ctx.moveTo(laneX(-2.1, s), y - H * 0.4 * s);
      ctx.quadraticCurveTo(CX, y - H * 0.34 * s, laneX(2.1, s), y - H * 0.4 * s);
      ctx.stroke();
      ctx.fillStyle = '#ffe9a8';
      for (let b = -1.5; b <= 1.5; b += 1) circle(ctx, laneX(b, s), y - H * 0.365 * s, Math.max(1.5, 6 * s));
      ctx.fillStyle = 'rgba(255,233,168,.14)';
      circle(ctx, CX, y - H * 0.36 * s, Math.max(3, 26 * s));
    }
  }

  // موجودیت‌ها — دور به نزدیک
  const list = S.ents.slice().sort((a, b) => b.z - a.z);
  for (const e of list) {
    const rel = e.z - S.dist;
    if (rel > 0) drawEnt(e, rel);
  }
  // بازیکن
  if (S.mode !== 'idle') drawPlayer();
  for (const e of list) {
    const rel = e.z - S.dist;
    if (rel <= 0 && rel > -2) drawEnt(e, rel);
  }
  // نگهبان
  if (S.mode === 'play' || S.mode === 'catch') drawGuard();

  // ذرات
  for (const p of S.parts) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.col;
    circle(ctx, p.x, p.y, p.r);
  }
  ctx.globalAlpha = 1;
  // متن‌های شناور
  ctx.textAlign = 'center';
  for (const f of S.floats) {
    ctx.globalAlpha = clamp(f.life, 0, 1);
    ctx.font = '900 ' + Math.round(CH * 0.16) + 'px Vazirmatn, Tahoma';
    ctx.fillStyle = f.col;
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 4;
    ctx.strokeText(f.txt, f.x, f.y); ctx.fillText(f.txt, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  updateHud();
}
function drawProp(kind, x, y, s, seed) {
  const h = H * 0.3 * s;
  if (kind === 'hall') {
    ctx.fillStyle = '#4a3a70';
    const dw = LANEW * 0.5 * s;
    rr(ctx, x - dw / 2, y - h, dw, h, 3 * s); ctx.fill();
    ctx.fillStyle = '#332a56';
    rr(ctx, x - dw * 0.36, y - h * 0.86, dw * 0.72, h * 0.86, 2 * s); ctx.fill();
    ctx.fillStyle = '#ffd93d'; circle(ctx, x + dw * 0.24, y - h * 0.45, Math.max(1, 3 * s));
  } else if (kind === 'yard') {
    ctx.strokeStyle = '#4a3626'; ctx.lineWidth = Math.max(1, 8 * s);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h * 0.8); ctx.stroke();
    ctx.fillStyle = '#2e6b46'; circle(ctx, x, y - h * 0.95, h * 0.42);
    ctx.fillStyle = '#3a8256'; circle(ctx, x - h * 0.2, y - h * 0.8, h * 0.28);
    ctx.fillStyle = '#46996a'; circle(ctx, x + h * 0.2, y - h * 0.85, h * 0.26);
  } else {
    ctx.strokeStyle = '#3d3d4d'; ctx.lineWidth = Math.max(1, 6 * s);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x - Math.sign(x - CX) * h * 0.3, y - h); ctx.stroke();
    ctx.fillStyle = '#ffe9a8'; circle(ctx, x - Math.sign(x - CX) * h * 0.3, y - h + 4 * s, Math.max(1.5, 6 * s));
    ctx.fillStyle = 'rgba(255,233,168,.12)'; circle(ctx, x - Math.sign(x - CX) * h * 0.3, y - h * 0.6, h * 0.35);
  }
}
function drawEnt(e, rel) {
  const s = proj(Math.max(rel, -1.5));
  const x = laneX(e.lane, s);
  const y = gy(s);
  if (e.kind === 'obs') {
    const d = OB_DEFS[e.okind];
    if (!d) return;
    const h = CH * d.hMul * s;
    const w = h * (d.img.width / d.img.height);
    // سایه
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(x, y, w * 0.45, Math.max(2, 8 * s), 0, 0, TAU); ctx.fill();
    ctx.drawImage(d.img, x - w / 2, y - h, w, h);
  } else if (e.kind === 'cig') {
    const bob = Math.sin(S.t * 5 + e.spin) * 4 * s;
    const h = CH * 0.16 * s;
    const w = h * (CIG_IMG.width / CIG_IMG.height);
    const yy = y - CH * 0.28 * s - e.yOff * CH * s + bob;
    ctx.fillStyle = 'rgba(255,217,61,.14)'; circle(ctx, x, yy, w * 0.65);
    ctx.save(); ctx.translate(x, yy); ctx.rotate(Math.sin(S.t * 3 + e.spin) * 0.2);
    ctx.drawImage(CIG_IMG, -w / 2, -h / 2, w, h);
    ctx.restore();
  } else if (e.kind === 'pow') {
    const img = POW_DEFS[e.okind];
    if (!img) return;
    const bob = Math.sin(S.t * 4 + e.spin) * 6 * s;
    const h = CH * 0.5 * s;
    const yy = y - CH * 0.55 * s + bob;
    ctx.drawImage(img, x - h / 2, yy - h / 2, h, h);
  }
}

/* ---------------- ترسیم کاراکتر ---------------- */
function drawChibi(g, ch, x, y, hgt, o) {
  // o: {phase, jump(0..1), slide, back, idle, tilt, fall}
  o = o || {};
  const phase = o.phase || 0;
  const headS = hgt * 0.52;
  const bodyH = hgt * 0.40;
  const bodyW = hgt * 0.42;
  const slide = o.slide || 0;
  const squash = slide > 0 ? 0.62 : 1;
  const bh = bodyH * squash;
  const bob = o.idle ? Math.sin(phase) * hgt * 0.015 : Math.abs(Math.sin(phase)) * hgt * 0.04;
  g.save();
  g.translate(x, y);
  if (o.fall) g.rotate(o.fall);
  // سایه
  g.fillStyle = 'rgba(0,0,0,.32)';
  g.beginPath(); g.ellipse(0, 2, hgt * 0.3 * (1 - (o.jump || 0) * 0.4), hgt * 0.06, 0, 0, TAU); g.fill();
  const air = (o.jump || 0) > 0;
  // پاها
  const legL = air ? -0.5 : Math.sin(phase);
  const legR = air ? 0.6 : Math.sin(phase + Math.PI);
  g.strokeStyle = '#4a4a60'; g.lineCap = 'round'; g.lineWidth = hgt * 0.09;
  const hipY = -bh * 0.9;
  g.beginPath(); g.moveTo(-bodyW * 0.22, hipY); g.lineTo(-bodyW * 0.26 + legL * hgt * 0.06, hipY + hgt * 0.16 * (air ? 0.6 : 1) - Math.max(0, legL) * hgt * 0.12); g.stroke();
  g.beginPath(); g.moveTo(bodyW * 0.22, hipY); g.lineTo(bodyW * 0.26 + legR * hgt * 0.06, hipY + hgt * 0.16 * (air ? 0.6 : 1) - Math.max(0, legR) * hgt * 0.12); g.stroke();
  // کفش‌ها
  g.fillStyle = '#f5f5f5';
  circle(g, -bodyW * 0.26 + legL * hgt * 0.06, hipY + hgt * 0.16 * (air ? 0.6 : 1) - Math.max(0, legL) * hgt * 0.12, hgt * 0.06);
  circle(g, bodyW * 0.26 + legR * hgt * 0.06, hipY + hgt * 0.16 * (air ? 0.6 : 1) - Math.max(0, legR) * hgt * 0.12, hgt * 0.06);
  // بدنهٔ هودی
  g.fillStyle = ch.hoodie;
  rr(g, -bodyW / 2, -bh - bob, bodyW, bh, bodyW * 0.35); g.fill();
  // هود پشت یقه
  g.fillStyle = ch.hoodDark;
  g.beginPath(); g.ellipse(0, -bh - bob + bodyH * 0.06, bodyW * 0.34, bodyH * 0.16, 0, 0, TAU); g.fill();
  if (o.back) {
    g.fillStyle = 'rgba(255,255,255,.92)';
    g.font = '900 ' + Math.round(hgt * 0.17) + 'px Vazirmatn, Tahoma';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(ch.letter, 0, -bh * 0.5 - bob);
  } else {
    g.strokeStyle = ch.hoodDark; g.lineWidth = hgt * 0.02;
    g.beginPath(); g.moveTo(0, -bh - bob + bodyH * 0.12); g.lineTo(0, -bob - 2); g.stroke();
    g.fillStyle = ch.hoodDark; circle(g, -bodyW * 0.12, -bh * 0.35, hgt * 0.02); circle(g, bodyW * 0.12, -bh * 0.35, hgt * 0.02);
  }
  // دست‌ها
  const armL = air ? -0.9 : Math.sin(phase + Math.PI);
  const armR = air ? -0.9 : Math.sin(phase);
  g.strokeStyle = ch.hoodDark; g.lineWidth = hgt * 0.08;
  g.beginPath(); g.moveTo(-bodyW * 0.5, -bh * 0.85 - bob); g.lineTo(-bodyW * 0.62, -bh * 0.85 - bob + armL * hgt * 0.1 + hgt * 0.1); g.stroke();
  g.beginPath(); g.moveTo(bodyW * 0.5, -bh * 0.85 - bob); g.lineTo(bodyW * 0.62, -bh * 0.85 - bob + armR * hgt * 0.1 + hgt * 0.1); g.stroke();
  g.fillStyle = ch.skin;
  circle(g, -bodyW * 0.62, -bh * 0.85 - bob + armL * hgt * 0.1 + hgt * 0.1, hgt * 0.05);
  circle(g, bodyW * 0.62, -bh * 0.85 - bob + armR * hgt * 0.1 + hgt * 0.1, hgt * 0.05);
  // سر (برگشته به پشت — نگاه نگران!)
  const tilt = (o.tilt || 0) + Math.sin(phase * 0.5) * 0.03;
  g.save();
  g.translate(0, -bh - headS * 0.42 - bob);
  g.rotate(tilt);
  g.drawImage(ch._head, -headS / 2, -headS / 2, headS, headS);
  g.restore();
  // سپر حبابی
  if (o.shield) {
    g.strokeStyle = 'rgba(79,195,247,.8)'; g.lineWidth = 3;
    g.fillStyle = 'rgba(79,195,247,.15)';
    g.beginPath(); g.arc(0, -hgt * 0.5, hgt * 0.62, 0, TAU); g.fill(); g.stroke();
  }
  g.restore();
}
function drawPlayer() {
  const ch = charOf();
  const x = laneX(S.x, 1);
  const jumpN = clamp(S.jumpY / 1.0, 0, 1.6);
  const y = BASEY - jumpN * CH * 0.85;
  let fall = 0;
  if (S.mode === 'catch') fall = Math.min(1.4, S.catchT * 2.2);
  drawChibi(ctx, ch, x, y, CH, {
    phase: S.dist * 0.55,
    jump: S.airborne ? 1 : 0,
    slide: S.slideT > 0 ? 1 : 0,
    back: true,
    tilt: (S.targetLane - S.x) * 0.18,
    fall,
    shield: S.shield
  });
  if (S.inv > 0 && Math.floor(S.t * 14) % 2 === 0) {
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff';
    circle(ctx, x, y - CH * 0.5, CH * 0.6);
    ctx.globalAlpha = 1;
  }
}
function drawGuard() {
  const d = S.mode === 'catch' ? 1 : S.danger;
  const gh = CH * lerp(1.1, 1.9, d);
  const gw = gh * (guardImg.width / guardImg.height);
  const bob = Math.sin(S.t * 9) * gh * 0.02;
  const rise = S.mode === 'catch' ? Math.min(1, S.catchT * 2.5) : (d - 0.45) / 0.55;
  if (rise <= 0) return;
  const y = H + gh * 0.28 - rise * gh * 0.62 + bob;
  const gx = CX + Math.sin(S.t * 1.7) * W * 0.03 + S.guardX;
  // پرتو چراغ قوه
  if (d > 0.5) {
    ctx.fillStyle = 'rgba(255,244,180,' + (0.10 + d * 0.1) + ')';
    ctx.beginPath();
    ctx.moveTo(gx + gw * 0.3, y - gh * 0.55);
    ctx.lineTo(laneX(S.x, 1) - CH * 0.5, BASEY - CH);
    ctx.lineTo(laneX(S.x, 1) + CH * 0.5, BASEY - CH * 0.2);
    ctx.closePath(); ctx.fill();
  }
  ctx.drawImage(guardImg, gx - gw / 2, y - gh, gw, gh);
}

/* ---------------- HUD ---------------- */
function faNum(n) { return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]); }
function updateHud() {
  if (S.mode !== 'play' && S.mode !== 'catch') return;
  const key = S.cigs + '|' + Math.floor(S.dist) + '|' + finalScore();
  if (key !== S.lastHud) {
    S.lastHud = key;
    el.cigs.textContent = faNum(S.cigs);
    el.dist.textContent = faNum(Math.floor(S.dist));
    el.score.textContent = faNum(finalScore());
  }
  const di = Math.round(S.danger * 100);
  if (di !== S.lastDangerInt) { S.lastDangerInt = di; el.dangerFill.style.width = di + '%'; }
  // پاورآپ‌ها
  let chips = '';
  if (S.pows.boost > 0) chips += powChip('🔥', S.pows.boost);
  if (S.pows.magnet > 0) chips += powChip('🧲', S.pows.magnet);
  if (S.pows.x2 > 0) chips += powChip('✨', S.pows.x2);
  if (S.pows.high > 0) chips += powChip('👟', S.pows.high);
  if (S.shield) chips += powChip('🛡️', -1);
  if (chips !== S.lastChips) { S.lastChips = chips; el.pows.innerHTML = chips; }
}
function powChip(ic, t) {
  return '<div class="powChip">' + ic + (t >= 0 ? ' ' + faNum(Math.ceil(t)) + 'ث' : '') + '</div>';
}

/* ---------------- صفحه‌ها ---------------- */
function showScreen(name) {
  ['menu', 'select', 'records', 'over'].forEach(s => el[s].classList.toggle('hidden', s !== name));
  el.hud.classList.toggle('hidden', !(name === 'play'));
}
function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.toast.classList.add('hidden'), 1800);
}

/* ---------------- انتخاب کاراکتر ---------------- */
function buildCards() {
  el.cards.innerHTML = '';
  const recs = getRecords();
  CHARS.forEach(ch => {
    const card = document.createElement('div');
    card.className = 'card' + (ch.id === selectedChar ? ' sel' : '');
    card.dataset.id = ch.id;
    const best = recs[ch.id] ? recs[ch.id].score : 0;
    card.innerHTML =
      '<img class="photo" src="assets/characters/' + ch.id + '.jpg" alt="' + ch.name + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
      '<div class="phFallback" style="display:none">' + ch.name[0] + '</div>' +
      '<canvas width="172" height="208"></canvas>' +
      '<div class="cname">' + ch.name + '</div>' +
      '<div class="cbest">🏆 ' + faNum(best) + '</div>';
    card.addEventListener('click', () => {
      selectedChar = ch.id; store.set('fed_char', ch.id);
      AU.ensure(); AU.click();
      buildCards();
    });
    el.cards.appendChild(card);
    const cv = card.querySelector('canvas');
    const g = cv.getContext('2d');
    drawChibi(g, ch, 86, 196, 150, { idle: true, phase: rand(0, 6), back: false });
  });
}
function buildRecords() {
  const recs = getRecords();
  const medals = ['🥇', '🥈', '', '️', '️'];
  const sorted = CHARS.slice().sort((a, b) => (recs[b.id] ? recs[b.id].score : 0) - (recs[a.id] ? recs[a.id].score : 0));
  el.recList.innerHTML = sorted.map((ch, i) => {
    const r = recs[ch.id] || { score: 0, cigs: 0, dist: 0 };
    return '<div class="recRow"><span class="rk">' + medals[i] + '</span><span class="rn">' + ch.name +
      ' <small style="color:#9d92d9">🚬' + faNum(r.cigs) + ' • ' + faNum(r.dist) + 'م</small></span><span class="rs">' + faNum(r.score) + '</span></div>';
  }).join('');
}

/* ---------------- شروع / پایان ---------------- */
let pendingStart = false;
function tryStart() {
  AU.ensure(); AU.click();
  if (!store.get('fed_tut', false)) {
    pendingStart = true;
    el.tutorial.classList.remove('hidden');
    return;
  }
  startRun();
}
function startRun() {
  S = newState();
  S.mode = 'play';
  queue.length = 0;
  showScreen('play');
  AU.ensure();
  AU.startMusic();
}
function showOver() {
  S.mode = 'over';
  AU.stopMusic();
  AU.overJingle();
  const res = saveRun();
  el.ovScore.textContent = faNum(finalScore());
  el.ovCigs.textContent = faNum(S.cigs);
  el.ovDist.textContent = faNum(Math.floor(S.dist)) + ' م';
  el.ovBest.textContent = faNum(res.best);
  el.newRec.classList.toggle('hidden', !res.isRec);
  showScreen('over');
}
function toMenu() {
  S.mode = 'idle';
  AU.stopMusic();
  showScreen('menu');
}
function togglePause() {
  if (S.mode !== 'play') return;
  S.paused = !S.paused;
  el.pauseOv.classList.toggle('hidden', !S.paused);
  if (S.paused) AU.stopMusic(); else AU.startMusic();
}

/* ---------------- دکمه‌ها ---------------- */
$('btnStart').addEventListener('click', tryStart);
$('btnSelect').addEventListener('click', () => { AU.ensure(); AU.click(); buildCards(); showScreen('select'); });
$('btnRecords').addEventListener('click', () => { AU.ensure(); AU.click(); buildRecords(); showScreen('records'); });
$('btnHelp').addEventListener('click', () => { AU.ensure(); AU.click(); pendingStart = false; el.tutorial.classList.remove('hidden'); });
$('btnTutOk').addEventListener('click', () => {
  AU.click();
  store.set('fed_tut', true);
  el.tutorial.classList.add('hidden');
  if (pendingStart) { pendingStart = false; startRun(); }
});
$('btnPlaySel').addEventListener('click', tryStart);
$('btnBackSel').addEventListener('click', () => { AU.click(); showScreen('menu'); });
$('btnBackRec').addEventListener('click', () => { AU.click(); showScreen('menu'); });
$('btnRetry').addEventListener('click', () => { AU.click(); startRun(); });
$('btnMenuOver').addEventListener('click', () => { AU.click(); toMenu(); });
$('btnShare').addEventListener('click', () => {
  AU.click();
  const ch = charOf();
  const txt = '🚬 فرار از خوابگاه! من با ' + ch.name + ' ' + faNum(S.cigs) + ' نخ سیگار جمع کردم و ' + faNum(Math.floor(S.dist)) + ' متر دویدم — امتیاز: ' + faNum(finalScore()) + ' 😎 تو می‌تونی؟';
  const done = () => toast('متن امتیاز کپی شد! 📋');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(() => fallbackCopy(txt, done));
  else fallbackCopy(txt, done);
});
function fallbackCopy(txt, done) {
  try {
    const ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    done();
  } catch (e) { toast('کپی نشد 😅'); }
}
$('btnPause').addEventListener('click', togglePause);
$('btnResume').addEventListener('click', togglePause);
$('btnRestartP').addEventListener('click', () => { AU.click(); S.paused = false; el.pauseOv.classList.add('hidden'); startRun(); });
$('btnMenuP').addEventListener('click', () => { AU.click(); S.paused = false; el.pauseOv.classList.add('hidden'); toMenu(); });
el.btnMute.addEventListener('click', () => {
  AU.ensure();
  AU.setMuted(!AU.muted);
  el.btnMute.textContent = AU.muted ? '🔇' : '🔊';
  if (!AU.muted && S.mode === 'play') AU.startMusic();
});
el.btnMute.textContent = AU.muted ? '🔇' : '🔊';
document.addEventListener('visibilitychange', () => {
  if (document.hidden && S.mode === 'play' && !S.paused) togglePause();
});
window.addEventListener('resize', resize);

/* ---------------- حلقهٔ اصلی ---------------- */
let lastT = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = clamp((now - lastT) / 1000, 0, 0.05);
  lastT = now;
  if (!S.paused && (S.mode === 'play' || S.mode === 'catch')) update(dt);
  if (S.mode === 'play' || S.mode === 'catch' || S.paused) draw();
}

/* ---------------- راه‌اندازی ---------------- */
resize();
showScreen('menu');
requestAnimationFrame(t => { lastT = t; loop(t); });

/* ---------------- قلاب تست (headless) ---------------- */
window.__FE = {
  start: id => { if (id) S.charId = id; startRun(); },
  step: dt => { update(dt); draw(); },
  input: a => queueAction(a),
  state: () => S,
  entities: () => S.ents,
  chars: CHARS
};

})();
