/* harness headless — اجرای موتور بازی بدون مرورگر برای تست سلامت */
'use strict';
const fs = require('fs');
const path = require('path');

/* ---------- stub ها ---------- */
function makeCtx() {
  const grad = { addColorStop() {} };
  const t = {};
  return new Proxy(t, {
    get(o, p) {
      if (p === 'canvas') return {};
      if (p in o) return o[p];
      return (...a) => {
        if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return grad;
        if (p === 'measureText') return { width: 10 };
        if (p === 'getImageData') return { data: new Uint8ClampedArray(8) };
        return undefined;
      };
    },
    set(o, p, v) { o[p] = v; return true; }
  });
}
function makeCanvas() {
  return {
    width: 0, height: 0, style: {}, dataset: {},
    getContext: () => makeCtx(),
    addEventListener() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
  };
}
function makeEl(id) {
  const classes = new Set();
  const e = {
    id, style: {}, dataset: {}, children: [], _handlers: {}, _html: '',
    textContent: '',
    classList: {
      add: c => classes.add(c),
      remove: c => classes.delete(c),
      toggle: (c, f) => { if (f === undefined) f = !classes.has(c); if (f) classes.add(c); else classes.delete(c); return f; },
      contains: c => classes.has(c)
    },
    appendChild(ch) { e.children.push(ch); return ch; },
    removeChild(ch) { e.children = e.children.filter(c => c !== ch); },
    addEventListener(ev, fn) { (e._handlers[ev] = e._handlers[ev] || []).push(fn); },
    querySelector: sel => (sel === 'canvas' ? makeCanvas() : makeEl('')),
    setAttribute() {}, getAttribute: () => null, select() {}
  };
  Object.defineProperty(e, 'className', {
    get: () => [...classes].join(' '),
    set: v => { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); }
  });
  Object.defineProperty(e, 'innerHTML', { get: () => e._html, set: v => { e._html = v; } });
  return e;
}
const els = {};
global.document = {
  hidden: false,
  body: makeEl('body'),
  getElementById: id => els[id] || (els[id] = id === 'game' ? Object.assign(makeCanvas(), { id }) : makeEl(id)),
  querySelector: () => makeEl(''),
  querySelectorAll: () => [],
  createElement: tag => (tag === 'canvas' ? makeCanvas() : makeEl('')),
  addEventListener() {},
  execCommand: () => true
};
global.window = {
  innerWidth: 480, innerHeight: 800, devicePixelRatio: 2,
  addEventListener() {},
  AudioContext: undefined
};
global.navigator = { userAgent: 'harness' };
global.requestAnimationFrame = () => 1;

/* ---------- اجرا ---------- */
const src = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
eval(src);
const FE = global.window.__FE;
if (!FE) { console.error('FAIL: __FE hook not found'); process.exit(1); }

let fails = 0;
function assert(c, msg) { if (!c) { fails++; console.error('FAIL:', msg); } }

const inputs = ['L', 'R', 'U', 'D'];
let frames = 0, overs = 0, catches = 0, shieldSeen = false, powSeen = new Set();

function invariants(tag) {
  const S = FE.state();
  assert(isFinite(S.x) && S.x >= -1.0001 && S.x <= 1.0001, tag + ': x out of bounds ' + S.x);
  assert(isFinite(S.speed) && S.speed > 0 && S.speed < 100, tag + ': bad speed ' + S.speed);
  assert(isFinite(S.dist) && S.dist >= 0, tag + ': bad dist');
  assert(S.jumpY >= -0.001, tag + ': jumpY negative');
  assert(S.ents.length < 400, tag + ': entity leak ' + S.ents.length);
  assert(S.parts.length <= 230, tag + ': particle cap broken');
  // بن‌بست = هر «سه» لاین در یک ردیف مانعِ کامل داشته باشد
  const rows = {};
  for (const e of FE.entities()) if (e.kind === 'obs') {
    (rows[e.z] = rows[e.z] || {})[Math.round(e.lane) + 1] = e.otype;
  }
  for (const z in rows) {
    const r = rows[z];
    const allFull = r[0] === 'full' && r[1] === 'full' && r[2] === 'full';
    assert(!allFull, tag + ': impassable row at z=' + z);
  }
}

/* سه ران با ورودی تصادفی */
for (let run = 0; run < 3; run++) {
  FE.start(['parsa', 'mahyar', 'farham'][run]);
  for (let i = 0; i < 60 * 75; i++) {
    FE.step(1 / 60);
    frames++;
    const S = FE.state();
    if (S.shield) shieldSeen = true;
    for (const e of FE.entities()) if (e.kind === 'pow') powSeen.add(e.okind);
    if (S.mode === 'catch') catches++;
    if (S.mode === 'over') { overs++; break; }
    if (i % 29 === 0) FE.input(inputs[(Math.random() * 4) | 0]);
    if (i % 60 === 0) invariants('run' + run);
  }
  invariants('run' + run + '-end');
}

/* یک ران بدون هیچ ورودی → حتماً برخورد و مسیر catch→over */
FE.start('mohsen');
for (let i = 0; i < 60 * 90; i++) {
  FE.step(1 / 60); frames++;
  if (FE.state().mode === 'over') { overs++; break; }
}
assert(FE.state().mode === 'over', 'no-input run never reached game over');

/* ریست کامل بعد از Game Over */
FE.start('arsham');
assert(FE.state().mode === 'play', 'restart after game over not in play');
assert(FE.state().dist === 0 && FE.state().cigs === 0, 'restart state not clean');
for (let i = 0; i < 600; i++) { FE.step(1 / 60); frames++; }
invariants('restart');

/* ربات هوشمند — ران طولانی برای تست پاورآپ‌ها، منطقه‌ها و مقیاس سرعت */
function botStep() {
  const S = FE.state();
  if (S.mode !== 'play') return;
  const myLane = Math.round(S.x);
  let threat = null;
  for (const e of FE.entities()) {
    if (e.kind !== 'obs') continue;
    const rel = e.z - S.dist;
    if (rel > 0.5 && rel < 12 && Math.abs(e.lane - S.x) < 0.4)
      if (!threat || rel < threat.rel) threat = { t: e.otype, rel };
  }
  if (!threat) return;
  if (threat.t === 'low') { if (threat.rel < 4 && !S.airborne && S.slideT <= 0) FE.input('U'); }
  else if (threat.t === 'high') { if (threat.rel < 4 && S.slideT <= 0 && !S.airborne) FE.input('D'); }
  else if (threat.rel < 10 && S.targetLane === myLane) {
    for (const dl of [-1, 1]) {
      const nl = myLane + dl;
      if (nl < -1 || nl > 1) continue;
      let safe = true;
      for (const e of FE.entities()) {
        if (e.kind !== 'obs') continue;
        const rel = e.z - S.dist;
        if (rel > -0.5 && rel < 15 && Math.round(e.lane) === nl && e.otype === 'full') safe = false;
      }
      if (safe) { FE.input(dl < 0 ? 'L' : 'R'); break; }
    }
  }
}
FE.start('parsa');
let botDist = 0;
for (let i = 0; i < 60 * 150; i++) {
  botStep();
  FE.step(1 / 60);
  frames++;
  const S = FE.state();
  for (const e of FE.entities()) if (e.kind === 'pow') powSeen.add(e.okind);
  if (S.shield) shieldSeen = true;
  if (S.mode === 'over') break;
  if (i % 120 === 0) invariants('bot');
  botDist = S.dist;
}
console.log('bot survived dist:', Math.floor(botDist), 'mode:', FE.state().mode);
assert(botDist > 800, 'bot should reach zone 2+ (dist>800), got ' + Math.floor(botDist));
assert(powSeen.size > 0, 'powerups never spawned in long bot run');

/* سوائپ سریع پشت‌سرهم — نباید حالت را خراب کند */
for (let i = 0; i < 40; i++) { FE.input('L'); FE.input('R'); FE.input('U'); FE.input('D'); FE.step(1 / 60); }
invariants('spam');

console.log('frames simulated :', frames);
console.log('game overs seen  :', overs);
console.log('catch anims seen :', catches > 0);
console.log('shield seen      :', shieldSeen);
console.log('powerups spawned :', [...powSeen].join(',') || 'none');
if (fails) { console.error('TOTAL FAILS:', fails); process.exit(1); }
console.log('ALL CHECKS PASSED ✔');
