/* رسترایزر نرم‌افزاری کوچک: اجرای کد واقعی رسم بازی و خروجی PNG برای بازبینی چشمی */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* ---------- PNG encoder ---------- */
function crc32(buf) {
  let c, crc = 0xffffffff;
  const table = crc32.t || (crc32.t = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })());
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePNG(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy ? rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
      : Buffer.from(rgba.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---------- رنگ‌ها ---------- */
function parseColor(c) {
  if (typeof c !== 'string') return null; // gradient
  c = c.trim();
  if (c[0] === '#') {
    if (c.length === 4) return [parseInt(c[1] + c[1], 16), parseInt(c[2] + c[2], 16), parseInt(c[3] + c[3], 16), 1];
    return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 1];
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) { const p = m[1].split(',').map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
  const named = { white: [255, 255, 255], black: [0, 0, 0] };
  return named[c] || [255, 0, 255, 1];
}

/* ---------- ctx رستری ---------- */
class RasterCanvas {
  constructor() { this._w = 300; this._h = 150; this.buf = Buffer.alloc(this._w * this._h * 4); }
  get width() { return this._w; }
  set width(v) { if (v !== this._w) { this._w = v; this.buf = Buffer.alloc(v * this._h * 4); } }
  get height() { return this._h; }
  set height(v) { if (v !== this._h) { this._h = v; this.buf = Buffer.alloc(this._w * v * 4); } }
  getContext() { return new RasterCtx(this); }
  addEventListener() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: this._w, height: this._h }; }
  style = {};
}
class Grad { constructor() { this.stops = []; } addColorStop(p, c) { this.stops.push([p, c]); } }
class RasterCtx {
  constructor(cv) {
    this.cv = cv;
    this.stack = [];
    this.m = [1, 0, 0, 1, 0, 0];
    this.fillStyle = '#000'; this.strokeStyle = '#000';
    this.lineWidth = 1; this.globalAlpha = 1; this.lineCap = 'butt';
    this.font = '10px sans'; this.textAlign = 'left'; this.textBaseline = 'alphabetic';
    this.paths = []; this.cur = null;
  }
  get canvas() { return this.cv; }
  setTransform(a, b, c, d, e, f) { this.m = [a, b, c, d, e, f]; }
  save() { this.stack.push({ m: this.m.slice(), fs: this.fillStyle, ss: this.strokeStyle, lw: this.lineWidth, ga: this.globalAlpha, font: this.font }); }
  restore() { const s = this.stack.pop(); if (s) { this.m = s.m; this.fillStyle = s.fs; this.strokeStyle = s.ss; this.lineWidth = s.lw; this.globalAlpha = s.ga; this.font = s.font; } }
  translate(x, y) { this.m = mm(this.m, [1, 0, 0, 1, x, y]); }
  rotate(r) { const c = Math.cos(r), s = Math.sin(r); this.m = mm(this.m, [c, s, -s, c, 0, 0]); }
  scale(x, y) { this.m = mm(this.m, [x, 0, 0, y, 0, 0]); }
  transform() {}
  createLinearGradient() { return new Grad(); }
  createRadialGradient() { return new Grad(); }
  createPattern() { return new Grad(); }
  measureText(t) { return { width: t.length * 8 }; }
  getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; }
  clearRect(x, y, w, h) { this.fillStyle = 'rgba(0,0,0,0)'; /* noop: background transparent already for offscreen */ }
  beginPath() { this.paths = []; this.cur = null; }
  closePath() { if (this.cur) this.cur.closed = true; }
  moveTo(x, y) { this.cur = { pts: [[x, y]], closed: false }; this.paths.push(this.cur); }
  lineTo(x, y) { if (!this.cur) this.moveTo(x, y); else this.cur.pts.push([x, y]); }
  arcTo(x1, y1) { this.lineTo(x1, y1); }
  quadraticCurveTo(cx, cy, x, y) {
    if (!this.cur) this.moveTo(x, y);
    const p0 = this.cur.pts[this.cur.pts.length - 1];
    for (let i = 1; i <= 8; i++) {
      const t = i / 8, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
      this.cur.pts.push([a * p0[0] + b * cx + c * x, a * p0[1] + b * cy + c * y]);
    }
  }
  arc(x, y, r, a0, a1, acw) {
    // مانند Canvas واقعی: جهت پیش‌فرض = افزایش زاویه
    let end = a1;
    if (!acw && end < a0) end += Math.PI * 2;
    if (acw && end > a0) end -= Math.PI * 2;
    const sub = { pts: [], closed: Math.abs(end - a0) >= Math.PI * 2 - 0.01 };
    const n = Math.max(8, Math.ceil(Math.abs(end - a0) / 0.25));
    for (let i = 0; i <= n; i++) { const a = a0 + (end - a0) * i / n; sub.pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
    if (this.cur && this.cur.pts.length) { this.cur.pts = this.cur.pts.concat(sub.pts); } else { this.paths.push(sub); this.cur = sub; }
  }
  ellipse(x, y, rx, ry, rot, a0, a1, acw) {
    let end = a1;
    if (!acw && end < a0) end += Math.PI * 2;
    if (acw && end > a0) end -= Math.PI * 2;
    const sub = { pts: [], closed: Math.abs(end - a0) >= Math.PI * 2 - 0.01 };
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const a = a0 + (end - a0) * i / n;
      const px = Math.cos(a) * rx, py = Math.sin(a) * ry;
      const c = Math.cos(rot || 0), s = Math.sin(rot || 0);
      sub.pts.push([x + px * c - py * s, y + px * s + py * c]);
    }
    if (this.cur && this.cur.pts.length) this.cur.pts = this.cur.pts.concat(sub.pts);
    else { this.paths.push(sub); this.cur = sub; }
  }
  rect(x, y, w, h) { this.moveTo(x, y); this.lineTo(x + w, y); this.lineTo(x + w, y + h); this.lineTo(x, y + h); this.closePath(); }
  fillRect(x, y, w, h) { this.beginPath(); this.rect(x, y, w, h); this.fill(); }
  strokeRect(x, y, w, h) { this.beginPath(); this.rect(x, y, w, h); this.stroke(); }
  _pix(x, y, col, a) {
    const w = this.cv._w, h = this.cv._h;
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4, b = this.cv.buf;
    const aa = a * col[3];
    b[i] = b[i] * (1 - aa) + col[0] * aa;
    b[i + 1] = b[i + 1] * (1 - aa) + col[1] * aa;
    b[i + 2] = b[i + 2] * (1 - aa) + col[2] * aa;
    b[i + 3] = Math.min(255, b[i + 3] + aa * 255);
  }
  _colOf(style) {
    if (style instanceof Grad) { const s = style.stops; return parseColor(s.length ? s[Math.floor(s.length / 2)][1] : '#fff'); }
    return parseColor(style);
  }
  fill() {
    const col = this._colOf(this.fillStyle); if (!col) return;
    const polys = this.paths.map(p => p.pts.map(pt => this.tp(pt))).filter(p => p.length > 2);
    for (const poly of polys) this.fillPoly(poly, col, this.globalAlpha);
  }
  tp(pt) { const m = this.m; return [m[0] * pt[0] + m[2] * pt[1] + m[4], m[1] * pt[0] + m[3] * pt[1] + m[5]]; }
  fillPoly(poly, col, alpha) {
    let y0 = 1e9, y1 = -1e9;
    for (const p of poly) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    y0 = Math.max(0, Math.floor(y0)); y1 = Math.min(this.cv._h - 1, Math.ceil(y1));
    for (let y = y0; y <= y1; y++) {
      const xs = [];
      const yc = y + 0.5;
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) {
          xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
        }
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.max(0, Math.round(xs[k])), xb = Math.min(this.cv._w - 1, Math.round(xs[k + 1]));
        for (let x = xa; x <= xb; x++) this._pix(x, y, col, alpha);
      }
    }
  }
  stroke() {
    const col = this._colOf(this.strokeStyle); if (!col) return;
    const r = Math.max(0.5, this.lineWidth / 2);
    for (const p of this.paths) {
      const pts = p.pts.map(q => this.tp(q));
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], b = pts[i + 1];
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const n = Math.max(1, Math.ceil(d / (r * 0.6)));
        for (let k = 0; k <= n; k++) {
          const x = a[0] + (b[0] - a[0]) * k / n, y = a[1] + (b[1] - a[1]) * k / n;
          this.fillPoly(circlePoly(x, y, r), col, this.globalAlpha);
        }
      }
    }
  }
  fillText(t, x, y) {
    // متن: بلوک تقریبی برای بازبینی چیدمان
    const size = parseInt((this.font.match(/(\d+)px/) || [0, 12])[1], 10);
    const w = t.length * size * 0.6;
    let sx = x;
    if (this.textAlign === 'center') sx = x - w / 2;
    if (this.textAlign === 'right') sx = x - w;
    let sy = y - size * 0.8;
    if (this.textBaseline === 'middle') sy = y - size / 2;
    this.fillPoly([this.tp([sx, sy]), this.tp([sx + w, sy]), this.tp([sx + w, sy + size]), this.tp([sx, sy + size])], this._colOf(this.fillStyle) || [0, 0, 0, 1], this.globalAlpha * 0.9);
  }
  strokeText() {}
  drawImage(img, dx, dy, dw, dh) {
    if (!(img instanceof RasterCanvas)) return;
    if (dw === undefined) { dw = img._w; dh = img._h; }
    // محدودهٔ مقصد در فضای تبدیل‌شده
    const corners = [[dx, dy], [dx + dw, dy], [dx + dw, dy + dh], [dx, dy + dh]].map(p => this.tp(p));
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const c of corners) { x0 = Math.min(x0, c[0]); y0 = Math.min(y0, c[1]); x1 = Math.max(x1, c[0]); y1 = Math.max(y1, c[1]); }
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
    x1 = Math.min(this.cv._w - 1, Math.ceil(x1)); y1 = Math.min(this.cv._h - 1, Math.ceil(y1));
    // معکوس تبدیل
    const m = this.m, det = m[0] * m[3] - m[1] * m[2];
    if (!det) return;
    const ia = m[3] / det, ib = -m[1] / det, ic = -m[2] / det, id = m[0] / det;
    const sb = img.buf, sw = img._w, sh = img._h;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5 - m[4], py = y + 0.5 - m[5];
      const ux = ia * px + ic * py, uy = ib * px + id * py;
      const u = (ux - dx) / dw * sw, v = (uy - dy) / dh * sh;
      if (u < 0 || v < 0 || u >= sw || v >= sh) continue;
      const si = ((v | 0) * sw + (u | 0)) * 4;
      const a = sb[si + 3] / 255 * this.globalAlpha;
      if (a <= 0) continue;
      this._pix(x, y, [sb[si], sb[si + 1], sb[si + 2], 1], a);
    }
  }
}
function circlePoly(x, y, r) {
  const p = [];
  for (let i = 0; i < 10; i++) p.push([x + Math.cos(i / 10 * 6.283) * r, y + Math.sin(i / 10 * 6.283) * r]);
  return p;
}
function mm(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]
  ];
}

/* ---------- stub محیط ---------- */
function makeEl(id) {
  const classes = new Set();
  const e = {
    id, style: {}, dataset: {}, children: [], _handlers: {}, _html: '', textContent: '',
    classList: {
      add: c => classes.add(c), remove: c => classes.delete(c),
      toggle: (c, f) => { if (f === undefined) f = !classes.has(c); if (f) classes.add(c); else classes.delete(c); return f; },
      contains: c => classes.has(c)
    },
    appendChild(ch) { e.children.push(ch); return ch; },
    removeChild(ch) { e.children = e.children.filter(c => c !== ch); },
    addEventListener(ev, fn) { (e._handlers[ev] = e._handlers[ev] || []).push(fn); },
    querySelector(sel) { if (sel === 'canvas') { e._qcanvas = e._qcanvas || new RasterCanvas(); return e._qcanvas; } return makeEl(''); },
    setAttribute() {}, getAttribute: () => null, select() {}
  };
  Object.defineProperty(e, 'className', { get: () => [...classes].join(' '), set: v => { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); } });
  Object.defineProperty(e, 'innerHTML', { get: () => e._html, set: v => { e._html = v; e.children = []; } });
  return e;
}
const els = {};
const gameCanvas = new RasterCanvas();
global.document = {
  hidden: false, body: makeEl('body'),
  getElementById: id => els[id] || (els[id] = id === 'game' ? gameCanvas : makeEl(id)),
  querySelector: () => makeEl(''), querySelectorAll: () => [],
  createElement: tag => (tag === 'canvas' ? new RasterCanvas() : makeEl('')),
  addEventListener() {}, execCommand: () => true
};
global.window = { innerWidth: 480, innerHeight: 800, devicePixelRatio: 1, addEventListener() {}, AudioContext: undefined };
global.navigator = { userAgent: 'render' };
global.requestAnimationFrame = () => 1;

const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
eval(src);
const FE = global.window.__FE;

const out = path.join(__dirname, '..', 'test');

/* صحنهٔ بازی: چند ثانیه اجرا و سپس فریم‌شات */
FE.start('parsa');
for (let i = 0; i < 60 * 4; i++) {
  const S = FE.state();
  // بات ساده برای زنده ماندن کوتاه
  if (i % 7 === 0) {
    let threat = null;
    for (const e of FE.entities()) if (e.kind === 'obs') {
      const rel = e.z - S.dist;
      if (rel > 0.5 && rel < 10 && Math.abs(e.lane - S.x) < 0.4 && (!threat || rel < threat.rel)) threat = { t: e.otype, rel };
    }
    if (threat) {
      if (threat.t === 'low') FE.input('U');
      else if (threat.t === 'high') FE.input('D');
      else FE.input(S.x > 0 ? 'L' : 'R');
    }
  }
  FE.step(1 / 60);
}
fs.writeFileSync(path.join(out, 'shot_play.png'), encodePNG(gameCanvas._w, gameCanvas._h, gameCanvas.buf));

/* صحنهٔ دوم: کاراکتر دیگر + پرش */
FE.start('mahyar');
for (let i = 0; i < 60 * 3; i++) FE.step(1 / 60);
FE.input('U');
for (let i = 0; i < 14; i++) FE.step(1 / 60);
fs.writeFileSync(path.join(out, 'shot_play2.png'), encodePNG(gameCanvas._w, gameCanvas._h, gameCanvas.buf));

/* sheet کاراکترها از buildCards */
els['btnSelect']._handlers.click[0]();
const cards = els['cards'].children;
const sheet = new RasterCanvas();
sheet.width = 5 * 180; sheet.height = 230;
const sg = sheet.getContext();
sg.fillStyle = '#241a4e'; sg.fillRect(0, 0, sheet.width, sheet.height);
cards.forEach((card, i) => {
  const cv = card._qcanvas;
  if (cv) sg.drawImage(cv, i * 180 + 4, 10, 172, 208);
});
fs.writeFileSync(path.join(out, 'sheet_chars.png'), encodePNG(sheet._w, sheet._h, sheet.buf));
console.log('rendered:', cards.length, 'cards');
console.log('OK — PNG ها در test/ نوشته شدند');
