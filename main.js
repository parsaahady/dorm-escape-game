/* ============================================================
   فرار از خوابگاه 🚬 — main.js (نسخهٔ ۲: گرافیک ارتقایافته)
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
function rr(g, x, y, w, h, r) {
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
const shade = (c, t) => mix(c, '#000000', t);   // تیره‌تر
const tint = (c, t) => mix(c, '#ffffff', t);   // روشن‌تر
function rgba(c, a) { const v = hex2rgb(c); return 'rgba(' + v[0] + ',' + v[1] + ',' + v[2] + ',' + a + ')'; }

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

/* ---------------- شخصیت‌ها (ویژگی‌ها از روی عکس‌ها) ---------------- */
const CHARS = [
  { id: 'parsa',  name: 'پارسا',  hair: 'wavy',  quiff: true, hairCol: '#2e2117', beard: 'trimmed', glasses: 'round', mouth: 'soft', skin: '#eeb98d', hoodie: '#6ec1ff', hoodDark: '#3f95dd', pants: '#2f3d63', shoe: '#e74c3c', letter: 'پ', browW: 8,  iris: '#4a2f1d', faceW: 0.92, chain: true, watch: true },
  { id: 'mahyar', name: 'مهیار', hair: 'short', part: true,  hairCol: '#241a10', beard: 'mustache', chin: true, glasses: 'thin', mouth: 'soft', skin: '#eab68b', hoodie: '#eef2f7', hoodDark: '#c3ccd8', pants: '#2b3648', shoe: '#2f6fd0', letter: 'م', browW: 7,  iris: '#402a18', faceW: 0.92, watch: true },
  { id: 'arsham', name: 'آرشام', hair: 'afro',  hairCol: '#221812', beard: 'stubble', glasses: null, mouth: 'soft', skin: '#e8b184', hoodie: '#c65a2e', hoodDark: '#9c4421', pants: '#23272e', shoe: '#f5f5f5', letter: 'آ', scarf: '#3b3b46', browW: 12, uni: true, iris: '#3a2415', faceW: 0.97 },
  { id: 'mohsen', name: 'محسن',  hair: 'quiff', hairCol: '#1e150e', beard: 'trimmed', glasses: null, mouth: 'grin',  skin: '#edbd92', hoodie: '#26282e', hoodDark: '#17181d', pants: '#1d232b', shoe: '#ffd93d', letter: 'م', browW: 9,  iris: '#2e1c10', faceW: 0.95 },
  { id: 'farham', name: 'فرهام', hair: 'curly', messy: true, hairCol: '#2b201a', beard: 'full', glasses: null, mouth: 'wavy', scrunch: true, skin: '#e5ad7e', hoodie: '#3a3f46', hoodDark: '#262a30', pants: '#20242c', shoe: '#9b59b6', letter: 'ف', browW: 9,  iris: '#332012', faceW: 1.0, lanyard: true }
];

/* ---------------- ساخت چهرهٔ کارتونی با جزئیات (۳ حالت) ---------------- */
function makeHead(ch, mood) {
  const S2 = 260, c = document.createElement('canvas'); c.width = c.height = S2;
  const g = c.getContext('2d');
  const x = 130, y = 146, r = 86;
  // گوش‌ها
  g.fillStyle = ch.skin; circle(g, x - r + 2, y + 12, 16); circle(g, x + r - 2, y + 12, 16);
  g.fillStyle = shade(ch.skin, 0.25); circle(g, x - r + 2, y + 12, 8); circle(g, x + r - 2, y + 12, 8);
  // صورت با گرادیان ملایم
  const fw = ch.faceW || 0.94;
  const fg = g.createLinearGradient(0, y - r, 0, y + r);
  fg.addColorStop(0, tint(ch.skin, 0.14)); fg.addColorStop(0.55, ch.skin); fg.addColorStop(1, shade(ch.skin, 0.14));
  g.fillStyle = fg;
  g.beginPath(); g.ellipse(x, y, r * fw, r, 0, 0, TAU); g.fill();
  // سایهٔ ملایم دو طرف صورت
  g.fillStyle = 'rgba(0,0,0,.06)';
  g.beginPath(); g.ellipse(x - r * fw * 0.78, y + 8, r * 0.28, r * 0.62, 0.2, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(x + r * fw * 0.78, y + 8, r * 0.28, r * 0.62, -0.2, 0, TAU); g.fill();
  // مو — لایهٔ پشتی تیره + لایهٔ اصلی + هایلایت
  const HR = { short: [r * 0.99, 0.56], quiff: [r * 1.0, 0.62], wavy: [r * 1.02, 0.66], curly: [r * 1.06, 0.74], afro: [r * 1.14, 0.86] }[ch.hair];
  const bump = (bx, by, br, col) => { g.fillStyle = col; circle(g, bx, by, br); };
  const backCol = shade(ch.hairCol, 0.3);
  g.fillStyle = backCol;
  g.beginPath(); g.ellipse(x, y - 34, HR[0] + 5, r * HR[1] + 5, 0, Math.PI, 0); g.fill();
  if (ch.hair === 'curly' || ch.hair === 'afro') {
    const n = ch.hair === 'afro' ? 8 : 6, rr2 = ch.hair === 'afro' ? 30 : 24;
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i + 0.5) / n * Math.PI;
      bump(x + Math.cos(a) * (HR[0] - 4), y - 34 + Math.sin(a) * (r * HR[1] - 2), rr2, backCol);
    }
    bump(x - HR[0] + 6, y + 2, 18, backCol); bump(x + HR[0] - 6, y + 2, 18, backCol);
  }
  g.fillStyle = ch.hairCol;
  g.beginPath(); g.ellipse(x, y - 32, HR[0], r * HR[1], 0, Math.PI, 0); g.fill();
  if (ch.hair === 'quiff') { bump(x - 44, y - 44, 16, ch.hairCol); bump(x - 10, y - 58, 22, ch.hairCol); bump(x + 24, y - 52, 19, ch.hairCol); bump(x + 48, y - 40, 15, ch.hairCol); }
  else if (ch.hair === 'short') { bump(x - 46, y - 46, 17, ch.hairCol); bump(x - 14, y - 56, 19, ch.hairCol); bump(x + 20, y - 56, 19, ch.hairCol); bump(x + 48, y - 46, 17, ch.hairCol); }
  else if (ch.hair === 'wavy') { bump(x - 50, y - 42, 20, ch.hairCol); bump(x - 17, y - 52, 22, ch.hairCol); bump(x + 19, y - 52, 22, ch.hairCol); bump(x + 50, y - 42, 20, ch.hairCol); bump(x - 66, y - 8, 15, ch.hairCol); bump(x + 66, y - 8, 15, ch.hairCol); }
  else if (ch.hair === 'curly') { for (let i = 0; i < 6; i++) { const a = Math.PI + (i + 0.5) / 6 * Math.PI; bump(x + Math.cos(a) * (HR[0] - 8), y - 34 + Math.sin(a) * (r * HR[1] - 6), 21, ch.hairCol); } bump(x - HR[0] + 8, y - 2, 16, ch.hairCol); bump(x + HR[0] - 8, y - 2, 16, ch.hairCol); }
  else if (ch.hair === 'afro') { for (let i = 0; i < 8; i++) { const a = Math.PI + (i + 0.5) / 8 * Math.PI; bump(x + Math.cos(a) * (HR[0] - 8), y - 34 + Math.sin(a) * (r * HR[1] - 6), 26, ch.hairCol); } bump(x - HR[0] + 8, y + 4, 20, ch.hairCol); bump(x + HR[0] - 8, y + 4, 20, ch.hairCol); }
  if (ch.quiff) bump(x + 4, y - 68, 24, ch.hairCol); // موهای حجیم جلوی سر پارسا
  if (ch.messy) { bump(x - 72, y - 44, 11, ch.hairCol); bump(x + 68, y - 56, 10, ch.hairCol); bump(x + 6, y - 82, 11, ch.hairCol); bump(x - 40, y - 74, 10, ch.hairCol); } // موهای وزِ فرهام
  if (ch.part) { // فرقِ سمتِ مهیار
    g.strokeStyle = shade(ch.hairCol, 0.45); g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 16, y - 84); g.quadraticCurveTo(x - 26, y - 66, x - 30, y - 48); g.stroke();
  }
  // هایلایت مو
  g.strokeStyle = tint(ch.hairCol, 0.22); g.lineCap = 'round'; g.lineWidth = 5;
  g.beginPath(); g.arc(x - 18, y - 46, r * 0.5, Math.PI * 1.15, Math.PI * 1.5); g.stroke();
  g.beginPath(); g.arc(x + 26, y - 42, r * 0.42, Math.PI * 1.2, Math.PI * 1.55); g.stroke();
  // ریش پایه
  const bc = ch.hairCol;
  if (ch.beard === 'full' || ch.beard === 'trimmed') {
    g.strokeStyle = bc; g.lineWidth = ch.beard === 'full' ? 30 : 20;
    g.beginPath(); g.arc(x, y + 2, r * 0.86, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke();
    g.fillStyle = bc; circle(g, x - (r * 0.8), y + 24, 14); circle(g, x + (r * 0.8), y + 24, 14);
    // بغل‌ریش اتصال به مو
    g.fillStyle = bc;
    rr(g, x - r * 0.98, y - 16, 14, 44, 6); g.fill();
    rr(g, x + r * 0.98 - 14, y - 16, 14, 44, 6); g.fill();
  } else if (ch.beard === 'stubble') {
    g.strokeStyle = rgba(bc, 0.8); g.lineWidth = 13;
    g.beginPath(); g.arc(x, y + 2, r * 0.84, 0.16 * Math.PI, 0.84 * Math.PI); g.stroke();
  }
  if (ch.beard) { // سبیل با هایلایت
    g.fillStyle = bc;
    g.beginPath(); g.ellipse(x - 16, y + 38, 17, 8, -0.14, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(x + 16, y + 38, 17, 8, 0.14, 0, TAU); g.fill();
    g.strokeStyle = tint(bc, 0.2); g.lineWidth = 3;
    g.beginPath(); g.moveTo(x - 24, y + 36); g.lineTo(x - 8, y + 34); g.stroke();
    g.beginPath(); g.moveTo(x + 24, y + 36); g.lineTo(x + 8, y + 34); g.stroke();
  }
  // بافت ریش
  if (ch.beard === 'full' || ch.beard === 'trimmed') {
    g.strokeStyle = tint(bc, 0.16); g.lineWidth = 3; g.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a = 0.25 * Math.PI + i * 0.1 * Math.PI;
      const bx = x + Math.cos(a) * r * 0.8, by = y + 2 + Math.sin(a) * r * 0.8;
      g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(a) * 10, by + Math.sin(a) * 10); g.stroke();
    }
  }
  // ابروها
  g.strokeStyle = ch.hairCol; g.lineCap = 'round'; g.lineWidth = ch.browW;
  const browY = mood === 'scared' ? y - 40 : y - 30;
  if (ch.scrunch) { // ابروهای جمع‌شدهٔ فرهام هنگام قیافهٔ شیطنت
    g.beginPath(); g.moveTo(x - 52, browY - 8); g.quadraticCurveTo(x - 32, browY - 8, x - 16, browY + 4); g.stroke();
    g.beginPath(); g.moveTo(x + 52, browY - 8); g.quadraticCurveTo(x + 32, browY - 8, x + 16, browY + 4); g.stroke();
    g.strokeStyle = shade(ch.skin, 0.3); g.lineWidth = 3;
    g.beginPath(); g.arc(x - 14, y + 8, 8, Math.PI * 1.2, Math.PI * 1.8); g.stroke();
    g.beginPath(); g.arc(x + 14, y + 8, 8, Math.PI * 1.2, Math.PI * 1.8); g.stroke();
  } else {
    g.beginPath(); g.moveTo(x - 52, browY - 4); g.quadraticCurveTo(x - 34, browY - 10, x - 18, browY - 2); g.stroke();
    g.beginPath(); g.moveTo(x + 52, browY - 4); g.quadraticCurveTo(x + 34, browY - 10, x + 18, browY - 2); g.stroke();
  }
  if (ch.uni) { g.lineWidth = ch.browW * 0.7; g.beginPath(); g.moveTo(x - 18, browY - 4); g.lineTo(x + 18, browY - 4); g.stroke(); }
  // چشم‌ها
  const ey = y - 4;
  if (mood === 'blink') {
    g.strokeStyle = shade(ch.skin, 0.55); g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.arc(x - 34, ey + 4, 13, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    g.beginPath(); g.arc(x + 34, ey + 4, 13, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  } else {
    const er = mood === 'scared' ? 16 : 13;
    g.fillStyle = '#fff';
    g.beginPath(); g.ellipse(x - 34, ey, er * 0.92, er, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(x + 34, ey, er * 0.92, er, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(0,0,0,.12)';
    g.beginPath(); g.ellipse(x - 34, ey - er * 0.5, er * 0.85, er * 0.4, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(x + 34, ey - er * 0.5, er * 0.85, er * 0.4, 0, 0, TAU); g.fill();
    const pr = mood === 'scared' ? 3.4 : 5.6;
    g.fillStyle = ch.iris; circle(g, x - 34 + 4, ey + 1, pr + 1.5); circle(g, x + 34 + 4, ey + 1, pr + 1.5);
    g.fillStyle = '#170d06'; circle(g, x - 34 + 4, ey + 1, pr); circle(g, x + 34 + 4, ey + 1, pr);
    g.fillStyle = '#fff'; circle(g, x - 34 + 2, ey - 2, 2.2); circle(g, x + 34 + 2, ey - 2, 2.2);
  }
  // بینی
  g.fillStyle = shade(ch.skin, 0.18);
  g.beginPath(); g.ellipse(x, y + 22, 9, 7, 0, 0, TAU); g.fill();
  g.fillStyle = shade(ch.skin, 0.35);
  g.beginPath(); g.ellipse(x - 5, y + 25, 2.6, 1.8, 0, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(x + 5, y + 25, 2.6, 1.8, 0, 0, TAU); g.fill();
  // دهان
  if (mood === 'scared') {
    g.fillStyle = '#5b2f22'; g.beginPath(); g.ellipse(x, y + 52, 12, 15, 0, 0, TAU); g.fill();
    g.fillStyle = '#c96a5a'; g.beginPath(); g.ellipse(x, y + 58, 8, 6, 0, 0, TAU); g.fill();
  } else if (ch.mouth === 'smile' || ch.mouth === 'grin') {
    g.fillStyle = '#5b2f22';
    g.beginPath(); g.arc(x, y + 46, 16, 0.12 * Math.PI, 0.88 * Math.PI); g.closePath(); g.fill();
    g.fillStyle = '#fff'; rr(g, x - 12, y + 48, 24, 6, 3); g.fill();
    if (ch.mouth === 'grin') { g.strokeStyle = shade(ch.skin, 0.4); g.lineWidth = 3; g.beginPath(); g.moveTo(x + 18, y + 44); g.lineTo(x + 24, y + 40); g.stroke(); }
  } else if (ch.mouth === 'soft') { // لبخند ملایم بسته
    g.strokeStyle = '#7c4a2d'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.arc(x, y + 44, 14, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.22)';
    g.beginPath(); g.ellipse(x, y + 56, 8, 3, 0, 0, TAU); g.fill();
  } else { // wavy — قیافٔ شیطنت‌آمیز فرهام (لب‌های فشرده)
    g.strokeStyle = '#7c4a2d'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 18, y + 56); g.quadraticCurveTo(x - 9, y + 50, x, y + 56); g.quadraticCurveTo(x + 9, y + 62, x + 18, y + 54); g.stroke();
    g.strokeStyle = shade(ch.skin, 0.35); g.lineWidth = 3;
    g.beginPath(); g.moveTo(x - 8, y + 64); g.quadraticCurveTo(x, y + 67, x + 8, y + 64); g.stroke();
  }
  if (ch.chin) { // ریش چانهٔ مهیار
    g.fillStyle = bc;
    g.beginPath(); g.ellipse(x, y + 66, 13, 9, 0, 0, TAU); g.fill();
  }
  // گونه
  g.fillStyle = 'rgba(230,120,110,.14)';
  circle(g, x - 50, y + 26, 11); circle(g, x + 50, y + 26, 11);
  // عینک
  if (ch.glasses) {
    const lens = () => { g.fillStyle = 'rgba(190,225,255,.22)'; };
    if (ch.glasses === 'round') {
      lens(); g.beginPath(); g.arc(x - 34, ey, 24, 0, TAU); g.fill();
      g.beginPath(); g.arc(x + 34, ey, 24, 0, TAU); g.fill();
      g.strokeStyle = '#7a6434'; g.lineWidth = 4.5;
      g.beginPath(); g.arc(x - 34, ey, 24, 0, TAU); g.stroke();
      g.beginPath(); g.arc(x + 34, ey, 24, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(x - 10, ey - 4); g.quadraticCurveTo(x, ey - 10, x + 10, ey - 4); g.stroke();
    } else {
      lens(); rr(g, x - 58, ey - 17, 46, 32, 9); g.fill(); rr(g, x + 12, ey - 17, 46, 32, 9); g.fill();
      g.strokeStyle = '#23232d'; g.lineWidth = 4.5;
      rr(g, x - 58, ey - 17, 46, 32, 9); g.stroke(); rr(g, x + 12, ey - 17, 46, 32, 9); g.stroke();
      g.beginPath(); g.moveTo(x - 12, ey - 4); g.lineTo(x + 12, ey - 4); g.stroke();
    }
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x - 46, ey - 10); g.lineTo(x - 30, ey + 8); g.stroke();
    g.beginPath(); g.moveTo(x + 22, ey - 10); g.lineTo(x + 38, ey + 8); g.stroke();
    g.strokeStyle = ch.glasses === 'round' ? '#7a6434' : '#23232d';
    g.beginPath(); g.moveTo(x - 58, ey - 4); g.lineTo(x - r + 6, ey + 2); g.stroke();
    g.beginPath(); g.moveTo(x + 58, ey - 4); g.lineTo(x + r - 6, ey + 2); g.stroke();
  }
  // شال‌گردن
  if (ch.scarf) {
    g.fillStyle = ch.scarf; rr(g, x - 70, y + r - 18, 140, 34, 16); g.fill();
    g.fillStyle = tint(ch.scarf, 0.14);
    for (let i = 0; i < 6; i++) circle(g, x - 55 + i * 22, y + r - 4, 4.5);
    g.fillStyle = shade(ch.scarf, 0.25); rr(g, x + 18, y + r + 8, 26, 26, 8); g.fill();
  }
  // عرق ترس
  if (mood === 'scared') {
    g.fillStyle = 'rgba(140,200,255,.9)';
    g.beginPath(); g.ellipse(x - r * 0.78, y - 26, 6, 9, 0.3, 0, TAU); g.fill();
  }
  return c;
}

/* ---------------- اسپرایت نگهبان ---------------- */
function makeGuard() {
  const c = document.createElement('canvas'); c.width = 260; c.height = 330;
  const g = c.getContext('2d');
  const x = 130;
  g.fillStyle = '#23305e';
  rr(g, x - 44, 230, 36, 80, 14); g.fill();
  rr(g, x + 8, 230, 36, 80, 14); g.fill();
  g.fillStyle = '#111'; rr(g, x - 50, 300, 48, 22, 10); g.fill(); rr(g, x + 4, 300, 48, 22, 10); g.fill();
  g.fillStyle = '#2e3f7a'; rr(g, x - 62, 130, 124, 112, 26); g.fill();
  g.fillStyle = 'rgba(0,0,0,.2)'; rr(g, x + 20, 130, 42, 112, 20); g.fill();
  g.fillStyle = '#1d2a56'; rr(g, x - 62, 196, 124, 18, 8); g.fill();
  g.fillStyle = '#ffd93d'; circle(g, x, 205, 7);
  g.fillStyle = '#ffd93d'; circle(g, x - 20, 158, 4); circle(g, x - 20, 178, 4); circle(g, x + 20, 158, 4); circle(g, x + 20, 178, 4);
  g.fillStyle = '#e74c3c'; rr(g, x + 40, 140, 26, 34, 8); g.fill();
  g.strokeStyle = '#2e3f7a'; g.lineWidth = 22; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - 52, 150); g.lineTo(x - 92, 96); g.stroke();
  g.beginPath(); g.moveTo(x + 52, 150); g.lineTo(x + 92, 190); g.stroke();
  g.fillStyle = '#eeb98d'; circle(g, x - 92, 96, 13); circle(g, x + 92, 190, 13);
  g.strokeStyle = '#6d4c33'; g.lineWidth = 10;
  g.beginPath(); g.moveTo(x - 92, 96); g.lineTo(x - 116, 40); g.stroke();
  g.fillStyle = '#555'; rr(g, x + 84, 176, 30, 16, 6); g.fill();
  g.fillStyle = '#eeb98d'; circle(g, x, 84, 46);
  g.fillStyle = '#eeb98d'; circle(g, x - 46, 88, 10); circle(g, x + 46, 88, 10);
  g.fillStyle = '#1d2a56'; g.beginPath(); g.arc(x, 70, 50, Math.PI, 0); g.fill();
  rr(g, x - 52, 62, 104, 16, 8); g.fill();
  g.fillStyle = '#11182f'; rr(g, x - 56, 74, 112, 10, 5); g.fill();
  g.fillStyle = '#ffd93d'; circle(g, x, 56, 7);
  g.strokeStyle = '#3a2a1a'; g.lineWidth = 7; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - 34, 78); g.lineTo(x - 12, 88); g.stroke();
  g.beginPath(); g.moveTo(x + 34, 78); g.lineTo(x + 12, 88); g.stroke();
  g.fillStyle = '#fff'; circle(g, x - 20, 94, 9); circle(g, x + 20, 94, 9);
  g.fillStyle = '#26140b'; circle(g, x - 20, 96, 4); circle(g, x + 20, 96, 4);
  g.fillStyle = '#4a2f1d';
  g.beginPath(); g.ellipse(x - 12, 116, 14, 7, -0.12, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(x + 12, 116, 14, 7, 0.12, 0, TAU); g.fill();
  g.strokeStyle = '#7c4a2d'; g.lineWidth = 5;
  g.beginPath(); g.arc(x, 136, 12, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke();
  return c;
}

/* ---------------- اسپرایت هالهٔ نور ---------------- */
let GLOW = null;
function buildGlow() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, 'rgba(255,240,190,.9)');
  gr.addColorStop(0.4, 'rgba(255,220,140,.35)');
  gr.addColorStop(1, 'rgba(255,220,140,0)');
  g.fillStyle = gr; circle(g, 64, 64, 62);
  GLOW = c;
}

/* ---------------- اسپرایت موانع ---------------- */
const OB_DEFS = {};
function obCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function buildObstacles() {
  { // سطل زباله
    const [c, g] = obCanvas(200, 240);
    const bg = g.createLinearGradient(30, 0, 170, 0);
    bg.addColorStop(0, '#2aa189'); bg.addColorStop(0.5, '#1f8a70'); bg.addColorStop(1, '#13614e');
    g.fillStyle = bg; rr(g, 30, 60, 140, 160, 18); g.fill();
    g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, 46, 84, 20, 116, 8); g.fill(); rr(g, 90, 84, 20, 116, 8); g.fill(); rr(g, 134, 84, 20, 116, 8); g.fill();
    g.fillStyle = '#25a184'; rr(g, 20, 42, 160, 26, 12); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; rr(g, 26, 46, 148, 7, 4); g.fill();
    g.fillStyle = '#111'; circle(g, 60, 226, 12); circle(g, 140, 226, 12);
    g.fillStyle = '#333'; circle(g, 60, 226, 5); circle(g, 140, 226, 5);
    g.strokeStyle = 'rgba(160,220,160,.7)'; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(60, 30); g.quadraticCurveTo(70, 18, 62, 8); g.stroke();
    g.beginPath(); g.moveTo(120, 28); g.quadraticCurveTo(132, 16, 124, 6); g.stroke();
    OB_DEFS.bin = { img: c, type: 'full', hMul: 1.05 };
  }
  { // چرخ نظافت
    const [c, g] = obCanvas(240, 250);
    const bg = g.createLinearGradient(30, 0, 210, 0);
    bg.addColorStop(0, '#ffd35c'); bg.addColorStop(1, '#d99a17');
    g.fillStyle = bg; rr(g, 30, 110, 180, 110, 16); g.fill();
    g.fillStyle = 'rgba(0,0,0,.2)'; rr(g, 30, 150, 180, 22, 8); g.fill();
    g.fillStyle = 'rgba(255,255,255,.25)'; rr(g, 38, 116, 164, 8, 4); g.fill();
    const bb = g.createLinearGradient(52, 0, 132, 0);
    bb.addColorStop(0, '#5aa9ee'); bb.addColorStop(1, '#2570b8');
    g.fillStyle = bb; rr(g, 52, 52, 80, 62, 12); g.fill();
    g.fillStyle = '#2570b8'; rr(g, 46, 44, 92, 16, 8); g.fill();
    g.strokeStyle = '#8d6e4a'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(170, 110); g.lineTo(210, 30); g.stroke();
    g.fillStyle = '#cfd8dc'; circle(g, 212, 26, 14);
    g.strokeStyle = '#90a4ae'; g.lineWidth = 3;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(204 + i * 4, 34); g.lineTo(200 + i * 5, 52); g.stroke(); }
    g.fillStyle = '#111'; circle(g, 60, 232, 14); circle(g, 180, 232, 14);
    g.fillStyle = '#444'; circle(g, 60, 232, 6); circle(g, 180, 232, 6);
    OB_DEFS.cart = { img: c, type: 'full', hMul: 1.05 };
  }
  { // در نیمه‌باز
    const [c, g] = obCanvas(210, 280);
    g.fillStyle = '#6d4c41'; rr(g, 20, 10, 170, 260, 10); g.fill();
    g.fillStyle = 'rgba(255,255,255,.12)'; rr(g, 24, 14, 162, 8, 4); g.fill();
    g.fillStyle = '#20120b'; rr(g, 36, 26, 138, 244, 8); g.fill();
    g.save(); g.translate(40, 30); g.transform(1, 0, -0.35, 1, 0, 0);
    const dg = g.createLinearGradient(0, 0, 90, 0);
    dg.addColorStop(0, '#9c7b6d'); dg.addColorStop(1, '#7a5a4d');
    g.fillStyle = dg; rr(g, 0, 0, 90, 236, 8); g.fill();
    g.fillStyle = 'rgba(0,0,0,.2)'; rr(g, 12, 20, 66, 90, 6); g.fill(); rr(g, 12, 130, 66, 90, 6); g.fill();
    g.fillStyle = '#ffd93d'; circle(g, 76, 120, 7); g.restore();
    g.fillStyle = '#fff8e1'; rr(g, 116, 56, 58, 32, 8); g.fill();
    g.fillStyle = '#c62828'; g.font = 'bold 22px Vazirmatn, Tahoma'; g.textAlign = 'center'; g.fillText('۳۰۶', 145, 80);
    OB_DEFS.door = { img: c, type: 'full', hMul: 1.2 };
  }
  { // نگهبان جهنده
    const [c, g] = obCanvas(220, 280);
    g.fillStyle = '#6d4c41'; rr(g, 15, 10, 190, 260, 10); g.fill();
    g.fillStyle = '#170d07'; rr(g, 30, 26, 160, 244, 8); g.fill();
    g.drawImage(makeGuard(), 40, 40, 140, 178);
    g.fillStyle = '#ffd93d'; g.font = '900 44px Vazirmatn, Tahoma'; g.textAlign = 'center'; g.fillText('!', 192, 62);
    OB_DEFS.guardpop = { img: c, type: 'full', hMul: 1.2 };
  }
  { // بند رخت
    const [c, g] = obCanvas(260, 300);
    const pg = g.createLinearGradient(16, 0, 30, 0);
    pg.addColorStop(0, '#b0bec5'); pg.addColorStop(1, '#78909c');
    g.fillStyle = pg; rr(g, 16, 40, 14, 250, 6); g.fill(); rr(g, 230, 40, 14, 250, 6); g.fill();
    g.strokeStyle = '#eceff1'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(20, 78); g.quadraticCurveTo(130, 88, 240, 78); g.stroke();
    g.fillStyle = '#f06292'; rr(g, 48, 82, 62, 78, 10); g.fill();
    g.fillStyle = '#e91e63'; rr(g, 48, 82, 62, 14, 7); g.fill();
    g.fillStyle = '#f06292'; rr(g, 36, 84, 16, 34, 7); g.fill(); rr(g, 106, 84, 16, 34, 7); g.fill();
    g.fillStyle = '#fafafa'; rr(g, 128, 82, 26, 44, 8); g.fill(); rr(g, 160, 82, 26, 44, 8); g.fill();
    g.fillStyle = 'rgba(0,0,0,.12)'; rr(g, 128, 118, 26, 8, 4); g.fill(); rr(g, 160, 118, 26, 8, 4); g.fill();
    g.fillStyle = '#4dd0e1'; rr(g, 196, 82, 40, 66, 8); g.fill();
    g.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { rr(g, 200, 94 + i * 18, 32, 7, 3); g.fill(); }
    OB_DEFS.laundry = { img: c, type: 'high', hMul: 1.3 };
  }
  { // دوربین مداربسته
    const [c, g] = obCanvas(250, 290);
    g.fillStyle = '#78909c'; rr(g, 14, 30, 14, 250, 6); g.fill(); rr(g, 222, 30, 14, 250, 6); g.fill();
    g.fillStyle = '#546e7a'; rr(g, 14, 40, 222, 16, 8); g.fill();
    g.fillStyle = 'rgba(255,255,255,.2)'; rr(g, 14, 42, 222, 5, 3); g.fill();
    const cg = g.createLinearGradient(92, 56, 158, 100);
    cg.addColorStop(0, '#4a5b66'); cg.addColorStop(1, '#263238');
    g.fillStyle = cg; rr(g, 92, 56, 66, 44, 10); g.fill();
    g.fillStyle = '#263238'; circle(g, 146, 78, 14);
    g.fillStyle = '#4fc3f7'; circle(g, 146, 78, 7);
    g.fillStyle = '#fff'; circle(g, 143, 75, 2.5);
    g.fillStyle = '#ff1744'; circle(g, 100, 66, 5);
    OB_DEFS.cctv = { img: c, type: 'high', hMul: 1.3 };
  }
  { // جعبه پیتزا
    const [c, g] = obCanvas(220, 130);
    g.fillStyle = '#e8e0d0'; rr(g, 20, 70, 180, 44, 8); g.fill();
    g.fillStyle = 'rgba(0,0,0,.15)'; rr(g, 20, 70, 180, 10, 5); g.fill();
    g.fillStyle = '#f4f0e6'; rr(g, 34, 28, 152, 44, 8); g.fill();
    g.fillStyle = '#e05038'; rr(g, 34, 44, 152, 10, 5); g.fill();
    g.fillStyle = '#e05038'; g.font = 'bold 22px Vazirmatn, Tahoma'; g.textAlign = 'center'; g.fillText('پیتزا', 110, 40 + 2);
    g.fillStyle = 'rgba(160,140,90,.5)'; circle(g, 60, 100, 5); circle(g, 160, 96, 4); circle(g, 120, 108, 3);
    OB_DEFS.box = { img: c, type: 'low', hMul: 0.5 };
  }
  { // صندلی افتاده
    const [c, g] = obCanvas(220, 140);
    const wg = g.createLinearGradient(20, 84, 170, 106);
    wg.addColorStop(0, '#a1887f'); wg.addColorStop(1, '#6d4c41');
    g.fillStyle = wg;
    rr(g, 20, 84, 150, 22, 10); g.fill();
    rr(g, 150, 30, 20, 80, 8); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; rr(g, 154, 36, 12, 68, 5); g.fill();
    g.strokeStyle = '#5d4037'; g.lineWidth = 12; g.lineCap = 'round';
    g.beginPath(); g.moveTo(40, 100); g.lineTo(30, 132); g.stroke();
    g.beginPath(); g.moveTo(140, 100); g.lineTo(150, 132); g.stroke();
    g.beginPath(); g.moveTo(70, 96); g.lineTo(64, 128); g.stroke();
    OB_DEFS.chair = { img: c, type: 'low', hMul: 0.5 };
  }
  { // سطل و تی
    const [c, g] = obCanvas(180, 140);
    const bg = g.createLinearGradient(30, 0, 150, 0);
    bg.addColorStop(0, '#ff9a4d'); bg.addColorStop(1, '#d96a17');
    g.fillStyle = bg; g.beginPath(); g.moveTo(30, 50); g.lineTo(150, 50); g.lineTo(136, 130); g.lineTo(44, 130); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(48, 54); g.lineTo(64, 54); g.lineTo(58, 126); g.lineTo(46, 126); g.closePath(); g.fill();
    g.fillStyle = '#d96a17'; rr(g, 24, 40, 132, 16, 8); g.fill();
    g.strokeStyle = '#8d6e4a'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(110, 46); g.lineTo(158, 14); g.stroke();
    g.fillStyle = '#cfd8dc'; circle(g, 158, 14, 13);
    g.strokeStyle = '#90a4ae'; g.lineWidth = 3;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(150 + i * 5, 22); g.lineTo(146 + i * 6, 38); g.stroke(); }
    OB_DEFS.bucket = { img: c, type: 'low', hMul: 0.5 };
  }
}

/* ---------------- آیتم‌ها ---------------- */
let CIG_IMG = null;
function buildCig() {
  const [c, g] = obCanvas(64, 28);
  g.save(); g.translate(32, 14); g.rotate(-0.12);
  g.fillStyle = '#f7f3ea'; rr(g, -30, -7, 44, 14, 7); g.fill();
  g.fillStyle = 'rgba(0,0,0,.12)'; rr(g, -30, 1, 44, 6, 3); g.fill();
  g.fillStyle = '#ff8c42'; rr(g, 6, -7, 10, 14, 4); g.fill();
  g.fillStyle = '#9e9e9e'; rr(g, 16, -7, 12, 14, 6); g.fill();
  g.fillStyle = '#616161'; circle(g, 26, 0, 3);
  g.restore();
  CIG_IMG = c;
}
const POW_DEFS = {};
function buildPows() {
  const mk = (col, draw) => {
    const [c, g] = obCanvas(96, 96);
    const gr = g.createRadialGradient(48, 44, 4, 48, 48, 44);
    gr.addColorStop(0, 'rgba(255,255,255,.95)');
    gr.addColorStop(0.4, col);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; circle(g, 48, 48, 44);
    draw(g);
    return c;
  };
  POW_DEFS.boost = mk('rgba(255,140,66,.9)', g => {
    g.fillStyle = '#ff6d00';
    g.beginPath(); g.moveTo(48, 16); g.quadraticCurveTo(70, 42, 60, 62); g.quadraticCurveTo(56, 76, 48, 80); g.quadraticCurveTo(40, 76, 36, 62); g.quadraticCurveTo(26, 42, 48, 16); g.fill();
    g.fillStyle = '#ffd93d';
    g.beginPath(); g.moveTo(48, 36); g.quadraticCurveTo(58, 52, 52, 66); g.quadraticCurveTo(50, 72, 48, 74); g.quadraticCurveTo(46, 72, 44, 66); g.quadraticCurveTo(38, 52, 48, 36); g.fill();
  });
  POW_DEFS.magnet = mk('rgba(255,94,94,.9)', g => {
    g.strokeStyle = '#e53935'; g.lineWidth = 14;
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
    g.beginPath(); g.moveTo(48, 16); g.lineTo(74, 28); g.lineTo(70, 58); g.quadraticCurveTo(64, 74, 48, 82); g.quadraticCurveTo(32, 74, 26, 58); g.lineTo(22, 28); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.25)';
    g.beginPath(); g.moveTo(48, 16); g.lineTo(74, 28); g.lineTo(72, 44); g.lineTo(48, 36); g.closePath(); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(38, 50); g.lineTo(46, 60); g.lineTo(62, 40); g.stroke();
  });
  POW_DEFS.high = mk('rgba(126,227,138,.9)', g => {
    g.fillStyle = '#fff'; rr(g, 24, 48, 48, 18, 9); g.fill();
    g.fillStyle = '#263238'; rr(g, 22, 62, 52, 8, 4); g.fill();
    g.fillStyle = '#e53935'; rr(g, 30, 52, 12, 6, 3); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(20, 38); g.lineTo(34, 38); g.stroke();
    g.beginPath(); g.moveTo(16, 28); g.lineTo(38, 28); g.stroke();
  });
}

/* ---------------- اسپرایت‌های محیط ---------------- */
let PROP_DOOR = null, PROP_TREE = null, PROP_LAMP = null, PROP_BUSH = null, PROP_POSTER = null, PROP_NEON = null, CLOUD = null;
function buildProps() {
  { // درِ سالن + پوستر کنارش
    const [c, g] = obCanvas(150, 260);
    const wg = g.createLinearGradient(0, 0, 150, 0);
    wg.addColorStop(0, '#5d4a86'); wg.addColorStop(1, '#463668');
    g.fillStyle = wg; rr(g, 0, 0, 150, 260, 6); g.fill();
    g.fillStyle = '#3a2d5c'; rr(g, 30, 40, 90, 220, 6); g.fill();
    const dg = g.createLinearGradient(38, 0, 112, 0);
    dg.addColorStop(0, '#8d6e63'); dg.addColorStop(1, '#6d4c41');
    g.fillStyle = dg; rr(g, 38, 48, 74, 212, 5); g.fill();
    g.fillStyle = 'rgba(0,0,0,.22)'; rr(g, 46, 60, 58, 84, 4); g.fill(); rr(g, 46, 158, 58, 84, 4); g.fill();
    g.fillStyle = '#ffd93d'; circle(g, 104, 156, 5);
    g.fillStyle = '#fff8e1'; rr(g, 52, 20, 46, 16, 4); g.fill();
    g.fillStyle = '#5b3b00'; g.font = 'bold 12px Vazirmatn, Tahoma'; g.textAlign = 'center'; g.fillText('خوابگاه ۲', 75, 32);
    g.fillStyle = '#e8f4ff'; rr(g, 4, 70, 22, 34, 3); g.fill();
    g.fillStyle = '#e57373'; rr(g, 6, 74, 18, 10, 2); g.fill();
    g.fillStyle = '#90a4ae'; rr(g, 6, 88, 18, 4, 2); g.fill(); rr(g, 6, 95, 14, 4, 2); g.fill();
    PROP_DOOR = c;
  }
  { // درخت حیاط
    const [c, g] = obCanvas(180, 300);
    const tg = g.createLinearGradient(80, 140, 100, 300);
    tg.addColorStop(0, '#6d4c41'); tg.addColorStop(1, '#4a3626');
    g.fillStyle = tg;
    g.beginPath(); g.moveTo(82, 300); g.quadraticCurveTo(86, 200, 78, 150); g.lineTo(98, 150); g.quadraticCurveTo(96, 210, 104, 300); g.closePath(); g.fill();
    g.strokeStyle = '#5d4037'; g.lineWidth = 10; g.lineCap = 'round';
    g.beginPath(); g.moveTo(88, 170); g.quadraticCurveTo(60, 140, 48, 118); g.stroke();
    g.beginPath(); g.moveTo(92, 160); g.quadraticCurveTo(120, 130, 132, 112); g.stroke();
    g.fillStyle = '#1f5236'; circle(g, 90, 92, 58); circle(g, 48, 116, 36); circle(g, 132, 110, 38);
    g.fillStyle = '#2e6b46'; circle(g, 74, 80, 40); circle(g, 116, 86, 36);
    g.fillStyle = '#3a8256'; circle(g, 96, 66, 30); circle(g, 60, 100, 24);
    g.fillStyle = 'rgba(255,255,255,.12)'; circle(g, 84, 60, 14); circle(g, 116, 78, 10);
    PROP_TREE = c;
  }
  { // تیر چراغ کوچه
    const [c, g] = obCanvas(120, 320);
    const pg = g.createLinearGradient(52, 0, 68, 0);
    pg.addColorStop(0, '#565668'); pg.addColorStop(1, '#33333f');
    g.fillStyle = pg; rr(g, 54, 40, 12, 280, 5); g.fill();
    g.fillStyle = '#444452'; rr(g, 48, 300, 24, 14, 5); g.fill();
    g.strokeStyle = '#444452'; g.lineWidth = 10; g.lineCap = 'round';
    g.beginPath(); g.moveTo(60, 48); g.quadraticCurveTo(60, 24, 88, 24); g.stroke();
    g.fillStyle = '#33333f'; rr(g, 80, 16, 34, 16, 7); g.fill();
    g.fillStyle = '#fff4c8'; circle(g, 97, 32, 9);
    PROP_LAMP = c;
  }
  { // بوته
    const [c, g] = obCanvas(120, 70);
    g.fillStyle = '#245c3c'; circle(g, 34, 44, 24); circle(g, 62, 38, 28); circle(g, 90, 46, 22);
    g.fillStyle = '#2e6b46'; circle(g, 48, 32, 20); circle(g, 78, 30, 18);
    g.fillStyle = 'rgba(255,255,255,.1)'; circle(g, 56, 24, 9);
    PROP_BUSH = c;
  }
  { // نئون کوچه
    const [c, g] = obCanvas(110, 150);
    g.fillStyle = '#201a2e'; rr(g, 8, 8, 94, 134, 10); g.fill();
    g.strokeStyle = '#ff4fa0'; g.lineWidth = 6; g.lineCap = 'round';
    rr(g, 20, 22, 70, 106, 8); g.stroke();
    g.strokeStyle = '#4fd8ff'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(34, 48); g.lineTo(76, 48); g.stroke();
    g.beginPath(); g.moveTo(34, 72); g.lineTo(66, 72); g.stroke();
    g.beginPath(); g.moveTo(34, 96); g.lineTo(76, 96); g.stroke();
    PROP_NEON = c;
  }
  { // ابر
    const [c, g] = obCanvas(220, 70);
    g.fillStyle = 'rgba(120,110,190,.35)';
    circle(g, 50, 44, 22); circle(g, 90, 34, 28); circle(g, 135, 42, 24); circle(g, 172, 48, 18);
    g.fillStyle = 'rgba(150,140,220,.25)';
    circle(g, 70, 30, 18); circle(g, 115, 26, 20);
    CLOUD = c;
  }
  PROP_POSTER = PROP_DOOR; // استفادهٔ داخلی ندارد
}

/* ---------------- منطقه‌ها ---------------- */
const ZONES = [
  { name: 'سالن خوابگاه', ground: '#463c63', road: '#393153', wall: '#5d4a86', prop: 'hall' },
  { name: 'حیاط خوابگاه', ground: '#2c473c', road: '#31384f', wall: '#3f5a4a', prop: 'yard' },
  { name: 'کوچه‌های اطراف', ground: '#47394f', road: '#3a2f47', wall: '#6e4a5a', prop: 'alley' }
];
const ZONE_LEN = 380;

/* ---------------- صدا ---------------- */
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
  setMuted(m) { this.muted = m; store.set('fed_muted', m); if (this.master) this.master.gain.value = m ? 0 : 0.9; },
  blip(f, dur, type, vol, slide) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + dur);
    g.gain.setValueAtTime(vol || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  noiseHit(dur, vol, freq) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 900;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur);
  },
  click() { this.blip(760, 0.07, 'square', 0.12); },
  collect(combo) { this.blip(520 + Math.min(combo, 14) * 45, 0.09, 'square', 0.12, 900 + combo * 40); },
  perfect() { [700, 900, 1200, 1500].forEach((f, i) => setTimeout(() => this.blip(f, 0.12, 'triangle', 0.16), i * 70)); },
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
  MELODY: [0, -1, 3, -1, 5, -1, 3, -1, 7, -1, 5, 3, 0, -1, 3, -1, 10, -1, 7, -1, 5, -1, 3, -1, 12, -1, 10, 7, 5, 3, 0, -1],
  startMusic() { if (!this.ctx || this.musTimer) return; this.step = 0; this.nextT = this.ctx.currentTime + 0.1; this.musTimer = setInterval(() => this.sched(), 40); },
  stopMusic() { if (this.musTimer) { clearInterval(this.musTimer); this.musTimer = null; } },
  sched() {
    if (!this.ctx || this.muted) { if (this.ctx) this.nextT = this.ctx.currentTime + 0.1; return; }
    const spb = 60 / 118 / 2;
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

/* ---------------- صحنه ---------------- */
let W = 0, H = 0, DPR = 1, CX = 0;
let LANEW = 120, CH = 140, HOR = 100, BASEY = 300;
const CAMD = 7, MAXZ = 80;
let skyCan = null, cityFar = null, cityNear = null, vigCan = null;
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
  buildSky(); buildCity(); buildVignette();
}
function buildSky() {
  skyCan = document.createElement('canvas'); skyCan.width = W; skyCan.height = Math.ceil(HOR + 60);
  const g = skyCan.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, HOR + 60);
  gr.addColorStop(0, '#070618'); gr.addColorStop(0.45, '#1a1440'); gr.addColorStop(0.8, '#33235e'); gr.addColorStop(1, '#4a2f6e');
  g.fillStyle = gr; g.fillRect(0, 0, W, HOR + 60);
  for (let i = 0; i < 110; i++) {
    const a = rand(0.25, 1);
    g.fillStyle = 'rgba(255,255,255,' + a + ')';
    const s = rand(0.5, 1.9);
    circle(g, rand(0, W), rand(0, HOR * 0.92), s);
    if (Math.random() < 0.06) { // ستارهٔ درخشان
      const sx = rand(0, W), sy = rand(0, HOR * 0.8);
      g.strokeStyle = 'rgba(255,255,255,' + a * 0.5 + ')'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(sx - 4, sy); g.lineTo(sx + 4, sy); g.stroke();
      g.beginPath(); g.moveTo(sx, sy - 4); g.lineTo(sx, sy + 4); g.stroke();
    }
  }
  const mx = W * 0.8, my = HOR * 0.30;
  const mg = g.createRadialGradient(mx, my, 4, mx, my, 90);
  mg.addColorStop(0, 'rgba(255,244,200,.85)'); mg.addColorStop(0.3, 'rgba(255,244,200,.22)'); mg.addColorStop(1, 'rgba(255,244,200,0)');
  g.fillStyle = mg; circle(g, mx, my, 90);
  const mrg = g.createRadialGradient(mx - 6, my - 6, 4, mx, my, 24);
  mrg.addColorStop(0, '#fffbe0'); mrg.addColorStop(1, '#f0dfae');
  g.fillStyle = mrg; circle(g, mx, my, 23);
  g.fillStyle = 'rgba(200,180,130,.55)'; circle(g, mx - 8, my - 3, 5); circle(g, mx + 6, my + 8, 4); circle(g, mx + 2, my - 9, 3);
}
function buildCity() {
  // لایهٔ دور
  cityFar = document.createElement('canvas'); cityFar.width = W; cityFar.height = Math.ceil(H * 0.2);
  let g = cityFar.getContext('2d');
  g.fillStyle = '#241c4e';
  let x = -10;
  while (x < W + 10) { const bw = rand(50, 110), bh = rand(cityFar.height * 0.35, cityFar.height * 0.8); g.fillRect(x, cityFar.height - bh, bw, bh); x += bw + rand(2, 10); }
  // لایهٔ نزدیک با پنجره‌ها
  cityNear = document.createElement('canvas'); cityNear.width = W; cityNear.height = Math.ceil(H * 0.24);
  g = cityNear.getContext('2d');
  const bh2 = cityNear.height;
  x = -10;
  while (x < W + 10) {
    const bw = rand(44, 92), bhh = rand(bh2 * 0.4, bh2 * 0.95);
    const bg = g.createLinearGradient(x, bh2 - bhh, x, bh2);
    bg.addColorStop(0, '#1c1540'); bg.addColorStop(1, '#141031');
    g.fillStyle = bg;
    g.fillRect(x, bh2 - bhh, bw, bhh);
    g.fillStyle = '#0e0b26'; g.fillRect(x + bw * 0.3, bh2 - bhh - 6, bw * 0.4, 6); // لبهٔ بام
    if (Math.random() < 0.3) { g.strokeStyle = '#0e0b26'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + bw * 0.7, bh2 - bhh); g.lineTo(x + bw * 0.7, bh2 - bhh - 14); g.stroke(); } // آنتن
    for (let wy = bh2 - bhh + 8; wy < bh2 - 8; wy += 13)
      for (let wx = x + 6; wx < x + bw - 8; wx += 12)
        if (Math.random() < 0.3) {
          g.fillStyle = Math.random() < 0.75 ? 'rgba(255,217,61,' + rand(0.35, 0.95) + ')' : 'rgba(140,220,255,' + rand(0.3, 0.8) + ')';
          g.fillRect(wx, wy, 5, 7);
        }
    x += bw + rand(4, 18);
  }
}
function buildVignette() {
  vigCan = document.createElement('canvas'); vigCan.width = W; vigCan.height = H;
  const g = vigCan.getContext('2d');
  const vg = g.createRadialGradient(CX, H * 0.55, Math.min(W, H) * 0.42, CX, H * 0.55, Math.max(W, H) * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,4,18,.5)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
}

/* ---------------- وضعیت ---------------- */
let S = null;
let selectedChar = store.get('fed_char', 'parsa');
if (!CHARS.some(c => c.id === selectedChar)) selectedChar = 'parsa';
CHARS.forEach(ch => { ch._heads = { norm: makeHead(ch, 'norm'), blink: makeHead(ch, 'blink'), scared: makeHead(ch, 'scared') }; });
buildGlow(); buildObstacles(); buildCig(); buildPows(); buildProps();
guardImg = makeGuard();

function newState() {
  return {
    mode: 'idle', paused: false,
    t: 0, dist: 0, speed: 13,
    x: 0, vx: 0, targetLane: 0, landT: 0,
    jumpY: 0, vy: 0, airborne: false, jumpBuf: 0,
    slideT: 0,
    cigs: 0, cigScore: 0, combo: 0, lastCollect: -9,
    perfects: 0, perfectStreak: 0, lines: {},
    pows: { boost: 0, magnet: 0, x2: 0, high: 0 }, shield: false,
    inv: 0, danger: 0.18, shake: 0, whistleCd: 0,
    ents: [], parts: [], floats: [],
    nextRowZ: 30, nextPowT: 6, rowId: 0, lineSeq: 0,
    catchT: 0, dustT: 0,
    charId: selectedChar,
    lastDangerInt: -1, lastHud: '', lastChips: ''
  };
}
S = newState();
const charOf = () => CHARS.find(c => c.id === S.charId) || CHARS[0];

/* ---------------- رکوردها ---------------- */
function getRecords() { return store.get('fed_records_v1', {}); }
function getBest(id) { const r = getRecords(); return r[id] || { score: 0, cigs: 0, dist: 0 }; }
const finalScore = () => Math.floor(S.dist) + S.cigScore;
function saveRun() {
  const r = getRecords();
  const score = finalScore();
  const prev = r[S.charId] || { score: 0, cigs: 0, dist: 0 };
  const isRec = score > prev.score;
  if (isRec) r[S.charId] = { score, cigs: S.cigs, dist: Math.floor(S.dist) };
  store.set('fed_records_v1', r);
  return { isRec, best: Math.max(score, prev.score) };
}

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
  const types = lanes.map(l => l ? l.type : 'open');
  if (types.every(t => t === 'full')) {
    const i = randi(0, 2);
    lanes[i] = Math.random() < 0.5 ? { kind: choice(OBS_KINDS.low), type: 'low' } : null;
  }
  if (diff < 0.3) {
    let fulls = lanes.filter(l => l && l.type === 'full').length;
    for (let i = 0; i < 3 && fulls > 1; i++) if (lanes[i] && lanes[i].type === 'full') { lanes[i].type = 'low'; lanes[i].kind = choice(OBS_KINDS.low); fulls--; }
  }
  const z = S.nextRowZ;
  lanes.forEach((o, i) => { if (o) S.ents.push(getEnt('obs', i - 1, z, o.kind, o.type)); });
  if (Math.random() < 0.72) {
    const li = randi(0, 2);
    const o = lanes[li];
    const n = randi(4, 7);
    const arc = (o && o.type === 'low') ? 1 : 0;
    const lineId = ++S.lineSeq;
    S.lines[lineId] = { total: n, got: 0, missed: 0, done: false };
    for (let k = 0; k < n; k++) {
      const e = getEnt('cig', li - 1, z + 4 + k * 2.4, null, null);
      e.yOff = arc ? Math.sin(Math.PI * k / (n - 1)) * 0.85 : 0;
      e.line = lineId;
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
  e.yOff = 0; e.dead = false; e.counted = false; e.line = 0; e.spin = rand(0, TAU);
  return e;
}
function spawnPow() {
  const opts = ['boost', 'magnet', 'x2', 'high'];
  if (!S.shield) opts.push('shield', 'shield');
  const kind = choice(opts);
  const lane = randi(-1, 1);
  const z = S.dist + MAXZ - 4;
  for (const e of S.ents) if (e.kind === 'obs' && e.otype === 'full' && e.lane === lane && Math.abs(e.z - z) < 5) return;
  S.ents.push(getEnt('pow', lane, z, kind, null));
}

/* ---------------- ورودی (هر ژست لمسی = حداکثر یک فرمان) ---------------- */
const queue = [];
function queueAction(a) { if (queue.length < 2) queue.push(a); }
let pDown = null, lastTouchAct = 0;
canvas.addEventListener('pointerdown', e => {
  if (e.isPrimary === false) return; // فقط انگشت اصلی — مولتی‌تاچ فرمان اضافه نمی‌سازد
  pDown = { x: e.clientX, y: e.clientY, id: e.pointerId, used: false };
  e.preventDefault();
});
canvas.addEventListener('pointermove', e => {
  if (!pDown || e.pointerId !== pDown.id || pDown.used) return;
  const dx = e.clientX - pDown.x, dy = e.clientY - pDown.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
  pDown.used = true; // هر ژست لمسی = حداکثر یک فرمان
  const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  if (now - lastTouchAct < 90) return; // ضد لرزش/ضد دو فرمانِ پشت‌سرهم
  lastTouchAct = now;
  if (Math.abs(dx) > Math.abs(dy)) queueAction(dx > 0 ? 'R' : 'L');
  else queueAction(dy > 0 ? 'D' : 'U');
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
  for (let i = 0; i < n && S.parts.length < 220; i++)
    S.parts.push({ x, y, vx: rand(-spd, spd), vy: rand(-spd, spd * 0.4), life: rand(0.3, 0.7), max: 0.7, col, r: rand(2, 5) });
}
function dust(x, y) {
  if (S.parts.length < 220)
    S.parts.push({ x: x + rand(-10, 10), y, vx: rand(-40, 40), vy: rand(-70, -20), life: rand(0.25, 0.45), max: 0.45, col: 'rgba(200,190,230,.5)', r: rand(2, 4) });
}
function floatText(x, y, txt, col) { if (S.floats.length < 12) S.floats.push({ x, y, txt, col, life: 1 }); }

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
  // سرعت: رشد تندتر با مسافت
  const base = Math.min(34, 13.5 + S.dist * 0.008);
  S.speed = Math.min(40, base * (S.pows.boost > 0 ? 1.4 : 1));
  if (!isFinite(S.speed) || S.speed <= 0) S.speed = 13;
  S.dist += S.speed * dt;

  for (const k in S.pows) S.pows[k] = Math.max(0, S.pows[k] - dt);
  S.inv = Math.max(0, S.inv - dt);
  S.slideT = Math.max(0, S.slideT - dt);
  S.landT = Math.max(0, S.landT - dt);
  S.jumpBuf = Math.max(0, S.jumpBuf - dt);
  S.shake = Math.max(0, S.shake - dt * 1.6);
  S.whistleCd -= dt;

  let n = 0;
  while (queue.length && n < 2) {
    const a = queue.shift(); n++;
    if (a === 'L') { if (S.targetLane > -1) { S.targetLane--; AU.lane(); } }
    else if (a === 'R') { if (S.targetLane < 1) { S.targetLane++; AU.lane(); } }
    else if (a === 'U') { if (!S.airborne) doJump(); else S.jumpBuf = 0.18; }
    else if (a === 'D') {
      if (S.airborne) S.vy = -14;
      else if (S.slideT <= 0) { S.slideT = 0.72; AU.slide(); dust(laneX(S.x, 1), BASEY); }
    }
  }
  // فنر میراگر: شتاب‌گیری/توقف نرم + کمی overshoot طبیعی
  S.vx += ((S.targetLane - S.x) * 110 - S.vx * 14) * dt;
  S.x += S.vx * dt;
  if (S.x < -1) { S.x = -1; S.vx = 0; }
  if (S.x > 1) { S.x = 1; S.vx = 0; }
  if (Math.abs(S.targetLane - S.x) < 0.005 && Math.abs(S.vx) < 0.05) { S.x = S.targetLane; S.vx = 0; }

  if (S.airborne) {
    S.jumpY += S.vy * dt;
    S.vy -= 15 * dt;
    if (S.jumpY <= 0) {
      S.jumpY = 0; S.vy = 0; S.airborne = false; S.landT = 0.14;
      dust(laneX(S.x, 1), BASEY); dust(laneX(S.x, 1), BASEY);
      if (S.jumpBuf > 0) { S.jumpBuf = 0; doJump(); }
    }
  } else {
    S.dustT -= dt;
    if (S.dustT <= 0) { S.dustT = 0.16; dust(laneX(S.x, 1) + rand(-14, 14), BASEY - 2); }
  }

  while (S.nextRowZ < S.dist + MAXZ) spawnRow();
  S.nextPowT -= dt;
  if (S.nextPowT <= 0) { S.nextPowT = rand(8, 14); spawnPow(); }

  const magnet = S.pows.magnet > 0;
  for (let i = S.ents.length - 1; i >= 0; i--) {
    const e = S.ents[i];
    const rel = e.z - S.dist;
    if (rel < -3 || e.dead) {
      if (e.kind === 'cig' && !e.counted) cigMissed(e);
      entPool.push(e); S.ents.splice(i, 1); continue;
    }
    if (e.kind === 'cig') {
      if (!e.counted && rel < -0.7) { e.counted = true; cigMissed(e); }
      if (magnet && rel < 16 && rel > -1 && Math.abs(e.lane - S.x) <= 1.3) {
        e.lane += (S.x - e.lane) * Math.min(1, dt * 9);
        e.yOff += (0 - e.yOff) * Math.min(1, dt * 9);
      }
      if (!e.dead && rel < 0.7 && rel > -0.5 && Math.abs(e.lane - S.x) < 0.5) {
        e.dead = true; e.counted = true;
        S.cigs++;
        const mul = S.pows.x2 > 0 ? 2 : 1;
        S.cigScore += 5 * mul;
        S.combo = (S.t - S.lastCollect < 1.2) ? S.combo + 1 : 0;
        S.lastCollect = S.t;
        AU.collect(S.combo);
        const px = laneX(e.lane, 1), py = BASEY - CH * 0.5;
        burst(px, py, '#ffd93d', 6, 160);
        if (mul === 2) floatText(px, py - 30, '+۱۰', '#ffe9a8');
        cigGot(e);
      }
    } else if (e.kind === 'pow') {
      if (rel < 0.8 && rel > -0.5 && Math.abs(e.lane - S.x) < 0.55) { e.dead = true; applyPow(e.okind); }
    } else if (e.kind === 'obs') {
      if (S.mode === 'play' && rel < 0.55 && rel > -0.45 && Math.abs(e.lane - S.x) < 0.5 && S.inv <= 0) {
        const safe =
          (e.otype === 'low' && S.jumpY > 0.45) ||
          (e.otype === 'high' && S.slideT > 0 && S.jumpY < 0.2);
        if (!safe) { e.dead = true; hitObstacle(); }
      }
    }
  }

  S.danger = clamp(0.18 + Math.min(0.55, S.dist / 2600) + 0.06 * Math.sin(S.t * 0.8), 0, 0.92);
  if (S.danger > 0.72 && S.whistleCd <= 0) { S.whistleCd = 6; AU.whistle(); S.shake = Math.max(S.shake, 0.22); }

  if (S.pows.boost > 0 && S.parts.length < 200)
    S.parts.push({ x: laneX(S.x, 1) + rand(-8, 8), y: BASEY - rand(0, CH * 0.4), vx: rand(-30, 30), vy: rand(60, 160), life: 0.4, max: 0.4, col: choice(['#ff6d00', '#ffd93d', '#ff9e40']), r: rand(3, 7) });
  updateParts(dt);
}
/* پاداش جمع کامل یک خط سیگار */
function cigGot(e) {
  const L = S.lines[e.line];
  if (!L) return;
  L.got++;
  resolveLine(L);
}
function cigMissed(e) {
  const L = S.lines[e.line];
  if (!L || e.dead) return;
  L.missed++;
  resolveLine(L);
}
function resolveLine(L) {
  if (L.done || L.got + L.missed < L.total) return;
  L.done = true;
  if (L.missed === 0) {
    S.perfects++;
    S.perfectStreak++;
    const bonus = (20 + Math.min(S.perfectStreak, 10) * 5) * (S.pows.x2 > 0 ? 2 : 1);
    S.cigScore += bonus;
    AU.perfect();
    floatText(laneX(S.x, 1), BASEY - CH * 1.15, 'پرفکت! +' + faNum(bonus) + ' ✨', '#7ef2c0');
    burst(laneX(S.x, 1), BASEY - CH * 0.7, '#7ef2c0', 14, 240);
  } else {
    S.perfectStreak = 0;
  }
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
    S.pows[kind] = kind === 'boost' ? 4 : kind === 'magnet' ? 7 : 6;
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

/* ---------------- تصویر ---------------- */
const proj = z => CAMD / (CAMD + z);
const gy = s => HOR + (BASEY - HOR) * s;
const laneX = (l, s) => CX + l * LANEW * s;

function zoneBlend() {
  const zi = Math.floor(S.dist / ZONE_LEN) % 3;
  const ni = (zi + 1) % 3;
  const f = S.dist % ZONE_LEN;
  const t = f > ZONE_LEN - 50 ? (f - (ZONE_LEN - 50)) / 50 : 0;
  return [ZONES[zi], ZONES[ni], t];
}
function draw() {
  const [za, zb, zt] = zoneBlend();
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (S.shake > 0) ctx.translate(rand(-1, 1) * S.shake * 10, rand(-1, 1) * S.shake * 8);

  // پارالاکس: پس‌زمینه با جابه‌جایی لاین کمی حرکت می‌کند = حس عمق
  const par = -S.x * 12;
  ctx.fillStyle = '#070618'; ctx.fillRect(0, 0, W, HOR + 60);
  if (skyCan) ctx.drawImage(skyCan, par * 0.4, 0);
  // ابرهای در حال حرکت
  if (CLOUD) {
    for (let i = 0; i < 3; i++) {
      const cw = W * 0.3;
      const cx2 = ((S.t * (4 + i * 2) + i * 331) % (W + cw * 2)) - cw;
      ctx.globalAlpha = 0.5 + i * 0.15;
      ctx.drawImage(CLOUD, cx2 + par * 0.4, HOR * (0.12 + i * 0.14), cw, cw * (CLOUD.height / CLOUD.width));
    }
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#241c4e'; ctx.fillRect(0, HOR - (cityFar ? cityFar.height : 0), W, (cityFar ? cityFar.height : 0) + 4);
  if (cityFar) ctx.drawImage(cityFar, par * 0.7, HOR - cityFar.height + 2);
  if (cityNear) ctx.drawImage(cityNear, par * 1.2, HOR - cityNear.height + 6);

  const gcol = zt > 0 ? mix(za.ground, zb.ground, zt) : za.ground;
  ctx.fillStyle = gcol;
  ctx.fillRect(0, HOR, W, H - HOR);

  const sFar = proj(MAXZ), sNear = 1.35;
  const rw = 1.62;
  ctx.fillStyle = zt > 0 ? mix(za.road, zb.road, zt) : za.road;
  ctx.beginPath();
  ctx.moveTo(laneX(-rw, sFar), gy(sFar));
  ctx.lineTo(laneX(rw, sFar), gy(sFar));
  ctx.lineTo(laneX(rw, sNear), gy(sNear));
  ctx.lineTo(laneX(-rw, sNear), gy(sNear));
  ctx.closePath(); ctx.fill();
  // برق آسفالت
  ctx.fillStyle = 'rgba(255,255,255,.05)';
  ctx.beginPath();
  ctx.moveTo(laneX(-0.4, sFar), gy(sFar));
  ctx.lineTo(laneX(0.4, sFar), gy(sFar));
  ctx.lineTo(laneX(0.4, sNear), gy(sNear));
  ctx.lineTo(laneX(-0.4, sNear), gy(sNear));
  ctx.closePath(); ctx.fill();
  // جدول کنار جاده
  ctx.fillStyle = 'rgba(230,225,255,.28)';
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(laneX(sgn * rw, sFar), gy(sFar));
    ctx.lineTo(laneX(sgn * (rw + 0.12), sFar), gy(sFar));
    ctx.lineTo(laneX(sgn * (rw + 0.12), sNear), gy(sNear));
    ctx.lineTo(laneX(sgn * rw, sNear), gy(sNear));
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,.09)';
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(laneX(sgn * (rw + 0.12), sFar), gy(sFar));
    ctx.lineTo(laneX(sgn * (rw + 0.62), sFar), gy(sFar));
    ctx.lineTo(laneX(sgn * (rw + 0.62), sNear), gy(sNear));
    ctx.lineTo(laneX(sgn * (rw + 0.12), sNear), gy(sNear));
    ctx.closePath(); ctx.fill();
  }
  // دیوارها
  const wallCol = zt > 0 ? mix(za.wall, zb.wall, zt) : za.wall;
  ctx.fillStyle = wallCol;
  for (const sgn of [-1, 1]) {
    const wx = 2.2;
    ctx.beginPath();
    ctx.moveTo(laneX(sgn * wx, sFar), gy(sFar));
    ctx.lineTo(laneX(sgn * wx, sFar), gy(sFar) - H * 0.44 * sFar);
    ctx.lineTo(laneX(sgn * wx, sNear), gy(sNear) - H * 0.44 * sNear);
    ctx.lineTo(laneX(sgn * wx, sNear), gy(sNear));
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.beginPath();
    ctx.moveTo(laneX(sgn * wx, sFar), gy(sFar) - H * 0.44 * sFar);
    ctx.lineTo(laneX(sgn * wx, sFar), gy(sFar) - H * 0.42 * sFar);
    ctx.lineTo(laneX(sgn * wx, sNear), gy(sNear) - H * 0.42 * sNear);
    ctx.lineTo(laneX(sgn * wx, sNear), gy(sNear) - H * 0.44 * sNear);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = wallCol;
  }
  // سایهٔ تماس پایهٔ دیوارها (AO)
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(laneX(sgn * 2.2, sFar), gy(sFar));
    ctx.lineTo(laneX(sgn * 2.2, sNear), gy(sNear));
    ctx.lineTo(laneX(sgn * 2.02, sNear), gy(sNear));
    ctx.lineTo(laneX(sgn * 2.02, sFar), gy(sFar));
    ctx.closePath(); ctx.fill();
  }
  // باندهای متحرک کف = حس حرکت و عمق زمین
  ctx.fillStyle = 'rgba(0,0,0,.08)';
  const bstep = 9, boff = S.dist % bstep;
  for (let z = MAXZ - ((MAXZ + boff) % bstep); z > 0; z -= bstep) {
    const s2 = proj(z);
    ctx.fillRect(laneX(-1.62, s2), gy(s2), LANEW * 3.24 * s2, Math.max(1.5, 9 * s2 * s2));
  }
  // خط‌کشی لاین‌ها
  ctx.fillStyle = 'rgba(255,235,150,.45)';
  const dash = 5, off = S.dist % dash;
  for (let z = MAXZ - ((MAXZ + off) % dash); z > -1; z -= dash) {
    const s = proj(Math.max(z, 0.01));
    for (const b of [-0.5, 0.5]) {
      const wq = Math.max(2, LANEW * 0.06 * s);
      ctx.fillRect(laneX(b, s) - wq / 2, gy(s) - 2 * s, wq, Math.max(3, 14 * s));
    }
  }
  // اشیای کناری + نورها
  const propStep = 16, poff = S.dist % propStep;
  for (let z = MAXZ - poff; z > 0; z -= propStep) {
    const az2 = S.dist + z;
    const zn = ZONES[Math.floor(az2 / ZONE_LEN) % 3];
    const s = proj(z);
    const y = gy(s);
    ctx.globalAlpha = clamp(1 - z / MAXZ * 0.6, 0.4, 1);
    for (const sgn of [-1, 1]) {
      const px = laneX(sgn * 2.55, s);
      drawProp(zn.prop, px, y, s, az2, sgn);
    }
    ctx.globalAlpha = 1;
    if (zn.prop === 'hall') {
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = Math.max(1, 2 * s);
      ctx.beginPath(); ctx.moveTo(laneX(-2.1, s), y - H * 0.4 * s);
      ctx.quadraticCurveTo(CX, y - H * 0.34 * s, laneX(2.1, s), y - H * 0.4 * s);
      ctx.stroke();
      for (let b = -1.5; b <= 1.5; b += 1) {
        const bx = laneX(b, s), by = y - H * 0.365 * s;
        if (GLOW) { ctx.globalAlpha = 0.7; ctx.drawImage(GLOW, bx - 14 * s, by - 14 * s, 28 * s, 28 * s); ctx.globalAlpha = 1; }
        ctx.fillStyle = '#fff2c0'; circle(ctx, bx, by, Math.max(1.5, 4.5 * s));
      }
      // حوضچهٔ نور کف
      if (GLOW) {
        ctx.globalAlpha = 0.22;
        ctx.drawImage(GLOW, CX - LANEW * 2.2 * s, y - LANEW * 0.7 * s, LANEW * 4.4 * s, LANEW * 1.4 * s);
        ctx.globalAlpha = 1;
      }
    }
    if (zn.prop === 'alley' && GLOW) {
      for (const sgn of [-1, 1]) {
        const lx = laneX(sgn * 2.55, s) - Math.sign(sgn) * H * 0.09 * s;
        ctx.globalAlpha = 0.3;
        ctx.drawImage(GLOW, lx - LANEW * 1.1 * s, y - LANEW * 0.45 * s, LANEW * 2.2 * s, LANEW * 0.9 * s);
        ctx.globalAlpha = 1;
      }
    }
  }

  // موجودیت‌ها
  const list = S.ents.slice().sort((a, b) => b.z - a.z);
  for (const e of list) { const rel = e.z - S.dist; if (rel > 0) drawEnt(e, rel); }
  if (S.mode !== 'idle') drawPlayer();
  for (const e of list) { const rel = e.z - S.dist; if (rel <= 0 && rel > -2) drawEnt(e, rel); }
  if (S.mode === 'play' || S.mode === 'catch') drawGuard();

  for (const p of S.parts) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.col;
    circle(ctx, p.x, p.y, p.r);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  for (const f of S.floats) {
    ctx.globalAlpha = clamp(f.life, 0, 1);
    ctx.font = '900 ' + Math.round(CH * 0.16) + 'px Vazirmatn, Tahoma';
    ctx.fillStyle = f.col;
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 4;
    ctx.strokeText(f.txt, f.x, f.y); ctx.fillText(f.txt, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  // خطوط سرعت
  if (S.speed > 24 || S.pows.boost > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + S.t * 2;
      const r1 = Math.min(W, H) * 0.42, r2 = r1 + 40 + (i % 3) * 30;
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(a) * r1, H * 0.5 + Math.sin(a) * r1);
      ctx.lineTo(CX + Math.cos(a) * r2, H * 0.5 + Math.sin(a) * r2);
      ctx.stroke();
    }
  }
  // فلاش پلیس هنگام گیر افتادن
  if (S.mode === 'catch') {
    ctx.fillStyle = Math.floor(S.catchT * 8) % 2 ? 'rgba(255,60,60,.14)' : 'rgba(70,130,255,.14)';
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
  if (vigCan) ctx.drawImage(vigCan, 0, 0);
  updateHud();
}
function drawProp(kind, x, y, s, seed, sgn) {
  const h = H * 0.3 * s;
  if (kind === 'hall') {
    const w = h * (PROP_DOOR.width / PROP_DOOR.height);
    ctx.drawImage(PROP_DOOR, x - w / 2, y - h, w, h);
  } else if (kind === 'yard') {
    const w = h * (PROP_TREE.width / PROP_TREE.height);
    ctx.drawImage(PROP_TREE, x - w / 2, y - h, w, h);
    if (Math.floor(seed / 16) % 2 === 0) {
      const bw = h * 0.5;
      ctx.drawImage(PROP_BUSH, x - bw / 2 + sgn * h * 0.3, y - bw * (PROP_BUSH.height / PROP_BUSH.width), bw, bw * (PROP_BUSH.height / PROP_BUSH.width));
    }
  } else {
    const w = h * (PROP_LAMP.width / PROP_LAMP.height);
    ctx.save();
    if (sgn > 0) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
    ctx.drawImage(PROP_LAMP, x - w / 2, y - h, w, h);
    ctx.restore();
    if (Math.floor(seed / 16) % 3 === 0) {
      const nw = h * 0.42;
      ctx.drawImage(PROP_NEON, x - nw / 2, y - h * 0.75, nw, nw * (PROP_NEON.height / PROP_NEON.width));
    }
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
    const fade = clamp(1 - rel / MAXZ * 0.65, 0.35, 1); // محوشدگی فاصله
    ctx.globalAlpha = fade;
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    ctx.beginPath(); ctx.ellipse(x, y, w * 0.45, Math.max(2, 8 * s), 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.15)';
    ctx.beginPath(); ctx.ellipse(x, y, w * 0.6, Math.max(3, 11 * s), 0, 0, TAU); ctx.fill();
    // کج‌شدن پرسپکتیو: موانع لاین‌های کناری کمی به مرکز متمایل می‌شوند
    ctx.save();
    ctx.translate(x, y);
    ctx.transform(1, 0, -e.lane * 0.07, 1, 0, 0);
    ctx.drawImage(d.img, -w / 2, -h, w, h);
    ctx.restore();
    ctx.globalAlpha = 1;
  } else if (e.kind === 'cig') {
    const bob = Math.sin(S.t * 5 + e.spin) * 4 * s;
    const h = CH * 0.16 * s;
    const w = h * (CIG_IMG.width / CIG_IMG.height);
    const yy = y - CH * 0.28 * s - e.yOff * CH * s + bob;
    const fade = clamp(1 - rel / MAXZ * 0.7, 0.3, 1);
    const pulse = 0.2 + 0.1 * Math.sin(S.t * 6 + e.spin);
    if (GLOW) { ctx.globalAlpha = pulse * fade; ctx.drawImage(GLOW, x - w, yy - w, w * 2, w * 2); }
    ctx.globalAlpha = fade;
    ctx.save(); ctx.translate(x, yy);
    ctx.rotate(Math.sin(S.t * 3 + e.spin) * 0.18);
    const sx = 0.55 + 0.45 * Math.abs(Math.sin(S.t * 4 + e.spin)); // چرخش سه‌بعدی
    ctx.scale(sx, 1);
    ctx.drawImage(CIG_IMG, -w / 2, -h / 2, w, h);
    ctx.restore();
    ctx.globalAlpha = 1;
  } else if (e.kind === 'pow') {
    const img = POW_DEFS[e.okind];
    if (!img) return;
    const bob = Math.sin(S.t * 4 + e.spin) * 6 * s;
    const h = CH * 0.5 * s;
    const yy = y - CH * 0.55 * s + bob;
    const fade = clamp(1 - rel / MAXZ * 0.7, 0.3, 1);
    if (GLOW) { ctx.globalAlpha = (0.5 + 0.2 * Math.sin(S.t * 5)) * fade; ctx.drawImage(GLOW, x - h * 0.9, yy - h * 0.9, h * 1.8, h * 1.8); }
    ctx.globalAlpha = fade;
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = Math.max(1.5, 3 * s);
    for (let k = 0; k < 6; k++) { // حلقهٔ چرخان
      const a0 = S.t * 2.4 + k * TAU / 6;
      ctx.beginPath(); ctx.arc(x, yy, h * 0.62, a0, a0 + 0.6); ctx.stroke();
    }
    ctx.drawImage(img, x - h / 2, yy - h / 2, h, h);
    ctx.globalAlpha = 1;
  }
}

/* ---------------- کاراکتر ---------------- */
function drawChibi(g, ch, x, y, hgt, o) {
  o = o || {};
  const phase = o.phase || 0;
  const headS = hgt * 0.56;
  const bodyH = hgt * 0.40;
  const bodyW = hgt * 0.44;
  const slide = o.slide || 0;
  const squash = slide > 0 ? 0.6 : 1;
  const bh = bodyH * squash;
  const air = (o.jump || 0) > 0;
  const bob = o.idle ? Math.sin(phase * 2) * hgt * 0.015 : Math.abs(Math.sin(phase)) * hgt * 0.04;
  const head = ch._heads ? (o.mood || 'norm') : null;
  g.save();
  g.translate(x, y);
  if (o.fall) g.rotate(o.fall);
  // سایه
  g.fillStyle = 'rgba(0,0,0,.34)';
  g.beginPath(); g.ellipse(0, 2, hgt * 0.3 * (1 - (air ? 0.4 : 0)), hgt * 0.06, 0, 0, TAU); g.fill();
  // squash & stretch برای حس جاندارِ پرش/فرود
  const st = o.stretch || 0;
  if (st) g.scale(1 - st * 0.5, 1 + st);
  // پاها (دوبخشی با زانو)
  const legSw = air ? 0.7 : Math.sin(phase);
  const legSw2 = air ? -0.5 : Math.sin(phase + Math.PI);
  const pants = ch.pants || '#2b2b33';
  g.strokeStyle = pants; g.lineCap = 'round'; g.lineWidth = hgt * 0.1;
  const hipY = -bh * 0.9;
  const kneeL = hipY + hgt * 0.15, footL = kneeL + hgt * 0.15 - Math.max(0, legSw) * hgt * 0.14;
  const kneeR = hipY + hgt * 0.15, footR = kneeR + hgt * 0.15 - Math.max(0, legSw2) * hgt * 0.14;
  g.beginPath(); g.moveTo(-bodyW * 0.22, hipY); g.quadraticCurveTo(-bodyW * 0.3, kneeL, -bodyW * 0.26 + legSw * hgt * 0.05, air ? hipY + hgt * 0.14 : footL); g.stroke();
  g.beginPath(); g.moveTo(bodyW * 0.22, hipY); g.quadraticCurveTo(bodyW * 0.3, kneeR, bodyW * 0.26 + legSw2 * hgt * 0.05, air ? hipY + hgt * 0.14 : footR); g.stroke();
  // کفش‌ها
  g.fillStyle = '#f5f5f5';
  circle(g, -bodyW * 0.26 + legSw * hgt * 0.05, (air ? hipY + hgt * 0.14 : footL) + hgt * 0.02, hgt * 0.06);
  circle(g, bodyW * 0.26 + legSw2 * hgt * 0.05, (air ? hipY + hgt * 0.14 : footR) + hgt * 0.02, hgt * 0.06);
  g.fillStyle = ch.shoe || '#e74c3c';
  g.beginPath(); g.ellipse(-bodyW * 0.26 + legSw * hgt * 0.05, (air ? hipY + hgt * 0.14 : footL) + hgt * 0.045, hgt * 0.06, hgt * 0.028, 0, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(bodyW * 0.26 + legSw2 * hgt * 0.05, (air ? hipY + hgt * 0.14 : footR) + hgt * 0.045, hgt * 0.06, hgt * 0.028, 0, 0, TAU); g.fill();
  // بدنهٔ هودی با سایه‌روشن
  const hg = g.createLinearGradient(-bodyW / 2, 0, bodyW / 2, 0);
  hg.addColorStop(0, tint(ch.hoodie, 0.12)); hg.addColorStop(0.55, ch.hoodie); hg.addColorStop(1, shade(ch.hoodie, 0.22));
  g.fillStyle = hg;
  rr(g, -bodyW / 2, -bh - bob, bodyW, bh, bodyW * 0.35); g.fill();
  // هود پشت یقه
  g.fillStyle = ch.hoodDark;
  g.beginPath(); g.ellipse(0, -bh - bob + bodyH * 0.07, bodyW * 0.36, bodyH * 0.17, 0, 0, TAU); g.fill();
  g.fillStyle = tint(ch.hoodDark, 0.15);
  g.beginPath(); g.ellipse(0, -bh - bob + bodyH * 0.045, bodyW * 0.3, bodyH * 0.1, 0, 0, TAU); g.fill();
  if (o.back) {
    g.fillStyle = 'rgba(255,255,255,.94)';
    g.font = '900 ' + Math.round(hgt * 0.17) + 'px Vazirmatn, Tahoma';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3;
    g.strokeText(ch.letter, 0, -bh * 0.5 - bob);
    g.fillText(ch.letter, 0, -bh * 0.5 - bob);
    g.textBaseline = 'alphabetic';
  } else {
    g.strokeStyle = ch.hoodDark; g.lineWidth = hgt * 0.02;
    g.beginPath(); g.moveTo(0, -bh - bob + bodyH * 0.12); g.lineTo(0, -bob - 2); g.stroke();
    g.fillStyle = ch.hoodDark; rr(g, -bodyW * 0.28, -bh * 0.42 - bob, bodyW * 0.56, bh * 0.3, 6); g.fill(); // جیب جلو
    if (ch.chain) { // زنجیر نقرهٔ پارسا
      g.strokeStyle = '#cfd8dc'; g.lineWidth = hgt * 0.02; g.lineCap = 'round';
      g.beginPath(); g.arc(0, -bh - bob + bodyH * 0.06, bodyW * 0.3, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
    }
  }
  if (ch.lanyard) { // بند آبی کارتِ فرهام
    g.strokeStyle = '#2f6fd0'; g.lineWidth = hgt * 0.035; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-bodyW * 0.32, -bh - bob + bodyH * 0.08); g.lineTo(0, -bh * 0.3 - bob); g.stroke();
    g.beginPath(); g.moveTo(bodyW * 0.32, -bh - bob + bodyH * 0.08); g.lineTo(0, -bh * 0.3 - bob); g.stroke();
    g.fillStyle = '#dfe6ee'; rr(g, -hgt * 0.07, -bh * 0.32 - bob, hgt * 0.14, hgt * 0.18, 3); g.fill();
    g.fillStyle = '#8a94a2'; rr(g, -hgt * 0.045, -bh * 0.32 - bob + hgt * 0.1, hgt * 0.09, hgt * 0.05, 2); g.fill();
  }
  // دنبالهٔ شال مهیار
  if (ch.scarf && !o.idle) {
    g.fillStyle = ch.scarf;
    g.beginPath();
    g.moveTo(-bodyW * 0.3, -bh - bob);
    g.quadraticCurveTo(-bodyW * 0.7, -bh * 0.6 + Math.sin(phase) * 4, -bodyW * 0.85, -bh * 0.3 + Math.sin(phase * 1.3) * 6);
    g.lineTo(-bodyW * 0.6, -bh * 0.25);
    g.quadraticCurveTo(-bodyW * 0.5, -bh * 0.6, -bodyW * 0.2, -bh - bob + 6);
    g.closePath(); g.fill();
  }
  // دست‌ها (دوبخشی)
  const armSw = air ? -0.8 : Math.sin(phase + Math.PI);
  const armSw2 = air ? -0.8 : Math.sin(phase);
  g.strokeStyle = ch.hoodDark; g.lineWidth = hgt * 0.085; g.lineCap = 'round';
  const shY = -bh * 0.85 - bob;
  g.beginPath(); g.moveTo(-bodyW * 0.5, shY); g.quadraticCurveTo(-bodyW * 0.68, shY + hgt * 0.1, -bodyW * 0.6, shY + hgt * 0.16 + armSw * hgt * 0.1); g.stroke();
  g.beginPath(); g.moveTo(bodyW * 0.5, shY); g.quadraticCurveTo(bodyW * 0.68, shY + hgt * 0.1, bodyW * 0.6, shY + hgt * 0.16 + armSw2 * hgt * 0.1); g.stroke();
  g.fillStyle = ch.skin;
  circle(g, -bodyW * 0.6, shY + hgt * 0.16 + armSw * hgt * 0.1, hgt * 0.05);
  circle(g, bodyW * 0.6, shY + hgt * 0.16 + armSw2 * hgt * 0.1, hgt * 0.05);
  if (ch.watch) { // ساعت مچی
    g.fillStyle = '#22262e'; circle(g, -bodyW * 0.6, shY + hgt * 0.2 + armSw * hgt * 0.1, hgt * 0.035);
    g.fillStyle = '#ffd93d'; circle(g, -bodyW * 0.6, shY + hgt * 0.2 + armSw * hgt * 0.1, hgt * 0.018);
  }
  // سر (با تابِ ملایم هماهنگ با قدم‌ها)
  const tilt = (o.tilt || 0) + Math.sin(phase * 0.5) * 0.03;
  g.save();
  g.translate(0, -bh - headS * 0.4 - bob + Math.sin(phase * 2) * hgt * 0.012);
  g.rotate(tilt);
  const headImg = ch._heads ? ch._heads[head || 'norm'] : ch._head;
  g.drawImage(headImg, -headS / 2, -headS / 2, headS, headS);
  g.restore();
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
  const mood = (S.danger > 0.72 || S.mode === 'catch') ? 'scared' : ((S.t % 3.4) < 0.13 ? 'blink' : 'norm');
  drawChibi(ctx, ch, x, y, CH, {
    phase: S.dist * 0.55,
    jump: S.airborne ? 1 : 0,
    slide: S.slideT > 0 ? 1 : 0,
    back: true,
    tilt: clamp(S.vx * 0.05, -0.3, 0.3),
    stretch: S.airborne ? clamp(S.vy * 0.03, -0.1, 0.16) : (S.landT > 0 ? -0.15 : 0),
    fall,
    shield: S.shield,
    mood
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
  const gx = CX + Math.sin(S.t * 1.7) * W * 0.03;
  if (d > 0.5) {
    const bg = ctx.createLinearGradient(gx, y - gh * 0.6, laneX(S.x, 1), BASEY - CH * 0.5);
    bg.addColorStop(0, 'rgba(255,244,180,' + (0.16 + d * 0.12) + ')');
    bg.addColorStop(1, 'rgba(255,244,180,0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(gx + gw * 0.3, y - gh * 0.55);
    ctx.lineTo(laneX(S.x, 1) - CH * 0.5, BASEY - CH);
    ctx.lineTo(laneX(S.x, 1) + CH * 0.5, BASEY - CH * 0.2);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(gx, H - 4, gw * 0.4, 10, 0, 0, TAU); ctx.fill();
  ctx.save();
  ctx.translate(gx, y);
  ctx.rotate(Math.sin(S.t * 9) * 0.03);
  ctx.drawImage(guardImg, -gw / 2, -gh, gw, gh);
  ctx.restore();
}

/* ---------------- HUD ---------------- */
function faNum(n) { return String(n).replace(/\d/g, d => '\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9'[d]); }
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
  let chips = '';
  if (S.pows.boost > 0) chips += powChip('🔥', S.pows.boost);
  if (S.pows.magnet > 0) chips += powChip('🧲', S.pows.magnet);
  if (S.pows.x2 > 0) chips += powChip('✨', S.pows.x2);
  if (S.pows.high > 0) chips += powChip('👟', S.pows.high);
  if (S.shield) chips += powChip('🛡️', -1);
  if (S.perfectStreak > 1) chips += powChip('😎پرفکت×', S.perfectStreak, true);
  if (chips !== S.lastChips) { S.lastChips = chips; el.pows.innerHTML = chips; }
}
function powChip(ic, t, raw) {
  return '<div class="powChip">' + ic + (t >= 0 ? (raw ? faNum(t) : ' ' + faNum(Math.ceil(t)) + 'ث') : '') + '</div>';
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

/* ---------------- انتخاب کاراکتر / رکوردها ---------------- */
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
    drawChibi(g, ch, 86, 198, 152, { idle: true, phase: rand(0, 6), back: false, mood: 'norm' });
  });
}
function buildRecords() {
  const recs = getRecords();
  const medals = ['🥇', '🥈', '', '⭐', '⭐'];
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
  if (!store.get('fed_tut', false)) { pendingStart = true; el.tutorial.classList.remove('hidden'); return; }
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
function toMenu() { S.mode = 'idle'; AU.stopMusic(); showScreen('menu'); }
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

/* ---------------- حلقه ---------------- */
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

/* ---------------- قلاب تست ---------------- */
window.__FE = {
  start: id => { if (id) S.charId = id; startRun(); },
  step: dt => { update(dt); draw(); },
  input: a => queueAction(a),
  state: () => S,
  entities: () => S.ents,
  chars: CHARS
};

})();
