/* ============================================================
   فرار از خوابگاه 🚬 — main.js v3 — Online Competitive Arcade
   Offline-First + Supabase-ready + Full Progression Systems
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
const shade = (c, t) => mix(c, '#000000', t);
const tint = (c, t) => mix(c, '#ffffff', t);
function rgba(c, a) { const v = hex2rgb(c); return 'rgba(' + v[0] + ',' + v[1] + ',' + v[2] + ',' + a + ')'; }
function faNum(n) { return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]); }
function enNum(s){ return String(s).replace(/[۰-۹]/g, d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); }
function hashStr(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0; }

/* ---------------- seeded RNG (mulberry32) ---------------- */
function mulberry32(a){ return function(){ let t=a+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function seededChoice(rng, arr){ return arr[Math.floor(rng()*arr.length)]; }
function dailySeedStr(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function getDailySeed(){ return hashStr(dailySeedStr()); }

/* ---------------- storage v3 + migration ---------------- */
const SAVE_VERSION = 3;
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
const STORAGE_KEY = 'dorm_v3';
function genFriendCode(){ const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s='DORM-'; for(let i=0;i<4;i++) s+=chars[randi(0,chars.length-1)]; return s; }
function defaultStateV3(){
  return {
    v: SAVE_VERSION,
    player: { id: 'p_'+Math.random().toString(36).slice(2,9), username: '', friendCode: genFriendCode(), avatar: '😎', createdAt: Date.now(), guest: true },
    settings: { muted:false, sfxVol:85, musicVol:70, vibrate:true, particles:true, shake:true, reducedMotion:false, highContrast:false, lang:'fa' },
    characters: { selected:'parsa', levels:{parsa:1,mahyar:1,arsham:1,mohsen:1,farham:1}, xp:{parsa:0,mahyar:0,arsham:0,mohsen:0,farham:0} },
    stats: { totalRuns:0, totalDistance:0, totalCigs:0, totalNearMiss:0, bestScore:0, bestDistance:0, bestCombo:0, bestCigs:0, totalPerfects:0, totalPlayTime:0, mostUsedChar:'parsa', charRuns:{parsa:0,mahyar:0,arsham:0,mohsen:0,farham:0} },
    xp: { level:1, xp:0, totalXp:0 },
    missions: { daily:[], weekly:[], lastDaily:'', lastWeekly:'' },
    achievements: [],
    league: { tier:'bronze', weeklyScore:0, bestTier:'bronze', resetAt:0, history:[] },
    friends: [],
    pendingRuns: [],
    cachedBoard: [],
    ghost: null,
    reputation: { points:0, rank:'مهمان' },
    dailyStreak:0,
    lastPlayDate:''
  };
}
function migrateOld(){
  let data = store.get(STORAGE_KEY, null);
  if (data && data.v === SAVE_VERSION) return data;
  // migrate from v1/v2 or old keys
  const base = defaultStateV3();
  try{
    const oldRec = store.get('fed_records_v1', null);
    const oldChar = store.get('fed_char', null);
    const oldMuted = store.get('fed_muted', null);
    if (oldRec){
      let best=0, bestDist=0, bestCigs=0;
      Object.values(oldRec).forEach(r=>{ if(r.score>best) best=r.score; if(r.dist>bestDist) bestDist=r.dist; if(r.cigs>bestCigs) bestCigs=r.cigs; });
      base.stats.bestScore=best; base.stats.bestDistance=bestDist; base.stats.bestCigs=bestCigs;
      base.cachedBoard = Object.entries(oldRec).map(([id, r])=>({ username: id, character:id, score:r.score, distance:r.dist, cigs:r.cigs, date:Date.now()-randi(0,86400000*7) }));
    }
    if (oldChar && base.characters.levels[oldChar]!==undefined) base.characters.selected=oldChar;
    if (typeof oldMuted==='boolean') base.settings.muted=oldMuted;
    // keep old records as is for backward compat
  }catch(e){}
  store.set(STORAGE_KEY, base);
  return base;
}
let DB = migrateOld();
// FIX: zonesSeen was stored as Set {} -> JSON becomes {} / [] -> .add throws and freezes game over
(function normalizeDB(){
  try{
    if (DB.stats && DB.stats.zonesSeen) {
      if (DB.stats.zonesSeen instanceof Set) DB.stats.zonesSeen = Array.from(DB.stats.zonesSeen);
      else if (Array.isArray(DB.stats.zonesSeen)) {} // ok
      else if (typeof DB.stats.zonesSeen === 'object') {
        try { DB.stats.zonesSeen = Object.values(DB.stats.zonesSeen); if(!Array.isArray(DB.stats.zonesSeen)) DB.stats.zonesSeen=[]; } catch(e){ DB.stats.zonesSeen=[]; }
      } else DB.stats.zonesSeen = [];
    } else if (DB.stats) DB.stats.zonesSeen = [];
    // save normalized immediately if it was object
    if (DB.stats && !Array.isArray(DB.stats.zonesSeen)) DB.stats.zonesSeen = [];
  } catch(e){ try{ DB.stats.zonesSeen=[]; }catch(_){} }
})();
function saveDB(){
  try{
    // ensure zonesSeen stored as array (Set would become {} )
    if (DB.stats && DB.stats.zonesSeen instanceof Set) DB.stats.zonesSeen = Array.from(DB.stats.zonesSeen);
  } catch(e){}
  store.set(STORAGE_KEY, DB);
}
// پاکسازی خودکار لیگ فیک (cachedBoard قدیمی که پر از بات بود)
(function cleanFakeCached(){
  try{
    if (Array.isArray(DB.cachedBoard) && DB.cachedBoard.length>0) {
      const fakeNames = new Set(['پارسا','مهیار','آرشام','محسن','فرهام','سارا','علی','نگار','کیان','تارا']);
      const before = DB.cachedBoard.length;
      DB.cachedBoard = DB.cachedBoard.filter(r=> !fakeNames.has(r.username));
      if (DB.cachedBoard.length !== before) { try{ saveDB(); }catch(e){} }
    }
    // پاکسازی قدیمی fed_records_v1 که باعث پر شدن cachedBoard می‌شد
    try{ localStorage.removeItem('fed_records_v1'); }catch(e){}
  } catch(e){}
})();
// تابع دستی برای پاک کردن لیگ فیک از کنسول یا دکمه تنظیمات
function clearFakeLeagueData(){
  DB.cachedBoard = [];
  // pendingRuns واقعی را نگه می‌داریم (دارای run_id)، فقط آرایه خالی نمی‌کنیم مگر کاربر بخواهد
  // DB.pendingRuns = [];
  try{ localStorage.removeItem('fed_records_v1'); }catch(e){}
  saveDB();
  toast('✅ لیگ فیک (محلی) پاک شد — حالا فقط امتیازهای واقعی MySQL نمایش داده می‌شود');
  try{ showLeague(activeLeagueTab||'global'); }catch(e){}
}
window.clearFakeLeagueData = clearFakeLeagueData;
function ensureMissions(){
  const today = dailySeedStr();
  if (DB.missions.lastDaily !== today){
    DB.missions.daily = generateDailyMissions(today);
    DB.missions.lastDaily = today;
  }
  const weekStart = getWeekStartStr();
  if (DB.missions.lastWeekly !== weekStart){
    DB.missions.weekly = generateWeeklyMissions(weekStart);
    DB.missions.lastWeekly = weekStart;
  }
  // ensure achievements initialized
  if (!DB.achievements || DB.achievements.length===0){
    DB.achievements = ACH_DEFS.map(a=>({ id:a.id, progress:0, unlocked:false, claimed:false }));
  }
  saveDB();
}
function getWeekStartStr(){
  const d=new Date(); const day=d.getDay(); const diff=d.getDate()-day+(day===0?-6:1); const m=new Date(d.setDate(diff)); return m.getFullYear()+'-W'+String(Math.ceil(m.getDate()/7)).padStart(2,'0');
}

/* ---------------- XP / Level ---------------- */
function xpForLevel(lv){ return 500 + (lv-1)*350; }
function addXP(amount){
  if(amount<=0) return false;
  DB.xp.totalXp += amount;
  DB.xp.xp += amount;
  let leveled=false;
  while(DB.xp.xp >= xpForLevel(DB.xp.level)){
    DB.xp.xp -= xpForLevel(DB.xp.level);
    DB.xp.level++;
    leveled=true;
    DB.reputation.points += 50;
  }
  updateReputation();
  if(leveled) saveDB(); else saveDB();
  return leveled;
}
function updateReputation(){
  const pts = DB.reputation.points + DB.xp.level*25 + DB.stats.bestScore/1000 |0;
  DB.reputation.points = pts;
  const tiers=[
    [0,'مهمان'],[200,'دانشجوی تازه‌وارد'],[600,'پاچه‌خوار خوابگاه'],[1500,'فراری حرفه‌ای'],[3200,'کابوس انتظامات'],[6000,'افسانه خوابگاه']
  ];
  let rank='مهمان';
  for(const [t,n] of tiers) if(pts>=t) rank=n;
  DB.reputation.rank=rank;
}

/* ---------------- Missions / Achievements defs ---------------- */
const MISSION_TEMPLATES_DAILY=[
  {id:'d_cig', title:'سیگاری روز', desc:'۲۰ نخ جمع کن 🚬', icon:'🚬', target:20, xp:120, check:(s)=>s.cigs},
  {id:'d_dist', title:'فرار صبحگاهی', desc:'۸۰۰ متر بدو 🏃', icon:'🏃', target:800, xp:100, check:(s)=>s.dist},
  {id:'d_near', title:'نزدیک بود!', desc:'۵ Near Miss ⚡', icon:'⚡', target:5, xp:150, check:(s)=>s.nearMiss},
  {id:'d_ability', title:'قدرت‌نمایی', desc:'۳ بار Ability بزن', icon:'✨', target:3, xp:130, check:(s)=>s.abilityUses},
  {id:'d_combo', title:'کومبو باز', desc:'Combo x10 بساز 🔥', icon:'🔥', target:10, xp:140, check:(s)=>s.bestCombo},
];
const MISSION_TEMPLATES_WEEKLY=[
  {id:'w_score', title:'رکوردشکن', desc:'۱۵,۰۰۰ امتیاز', icon:'🏆', target:15000, xp:400, check:(s)=>s.score},
  {id:'w_near', title:'استاد Near Miss', desc:'۳۰ Near Miss', icon:'⚡', target:30, xp:350, check:(s)=>s.nearMiss},
  {id:'w_runs', title:'فراری خستگی‌ناپذیر', desc:'۱۰ Run کامل', icon:'🔁', target:10, xp:300, check:(s)=>s.runs},
  {id:'w_chars', title:'همه‌کاره', desc:'با هر ۵ کاراکتر بازی کن', icon:'🎭', target:5, xp:450, check:(s)=>s.charsUsed},
  {id:'w_nopow', title:'دست خالی', desc:'۱ Run بدون Power-up', icon:'🛡️', target:1, xp:300, check:(s)=>s.noPowRun},
];
function generateDailyMissions(seedStr){
  const rng=mulberry32(hashStr(seedStr));
  const shuffled=[...MISSION_TEMPLATES_DAILY].sort(()=>rng()-.5);
  return shuffled.slice(0,3).map(m=>({ ...m, progress:0, done:false }));
}
function generateWeeklyMissions(seedStr){
  const rng=mulberry32(hashStr(seedStr+'_weekly'));
  const shuffled=[...MISSION_TEMPLATES_WEEKLY].sort(()=>rng()-.5);
  return shuffled.slice(0,3).map(m=>({ ...m, progress:0, done:false }));
}
const ACH_DEFS=[
  {id:'first_run', title:'فرار اول 🏃', desc:'اولین Run رو کامل کن', icon:'🏃', target:1, check:(st)=>st.totalRuns>=1},
  {id:'combo10', title:'Combo Master 🔥', desc:'Combo x15 بساز', icon:'🔥', target:15, check:(st)=>st.bestCombo>=15},
  {id:'untouchable', title:'دست‌نیافتنی 👮', desc:'۵۰۰m بدون برخورد', icon:'👮', target:500, check:(st)=>st.bestDistance>=500},
  {id:'smoker', title:'سیگاری حرفه‌ای 🚬', desc:'۵۰۰ نخ جمع کن', icon:'🚬', target:500, check:(st)=>st.totalCigs>=500},
  {id:'lightning', title:'برق‌آسا ⚡', desc:'۵۰ Near Miss', icon:'⚡', target:50, check:(st)=>st.totalNearMiss>=50},
  {id:'lastchance', title:'آخرین شانس 🛡️', desc:'۱۰ بار با شیلد نجات پیدا کن', icon:'🛡️', target:10, check:(st)=>(st.shieldSaves||0)>=10},
  {id:'nearmiss100', title:'نزدیک بود! 💀', desc:'۱۰۰ Near Miss', icon:'💀', target:100, check:(st)=>st.totalNearMiss>=100},
  {id:'record', title:'رکورددار 🏆', desc:'امتیاز ۲۰,۰۰۰', icon:'🏆', target:20000, check:(st)=>st.bestScore>=20000},
  {id:'nightowl', title:'شب‌زنده‌دار 🌙', desc:'۵ Run شبانه (بعد ۲۲:۰۰)', icon:'🌙', target:5, check:(st)=>(st.nightRuns||0)>=5},
  {id:'collector', title:'جمع‌کن 🎒', desc:'۱۰ Power-up بگیر', icon:'🧲', target:10, check:(st)=>(st.pows||0)>=10},
  {id:'explorer', title:'گردشگر خوابگاه 🗺️', desc:'۳ محیط مختلف ببین', icon:'🗺️', target:3, check:(st)=>{ const z=st.zonesSeen; const n = Array.isArray(z)? z.length : (z?.size||0); return n>=3; }},
  {id:'friend', title:'رفیق خوابگاهی 👥', desc:'۱ دوست اضافه کن', icon:'👥', target:1, check:(st)=>st.friendsAdded>=1},
];

function updateMissionsProgress(runStats){
  let any=false;
  for(const m of DB.missions.daily){
    if(m.done) continue;
    const val = m.check(runStats);
    if(val!==undefined){ m.progress = Math.min(val, m.target); if(m.progress>=m.target){ m.done=true; addXP(m.xp); any=true; } }
  }
  for(const m of DB.missions.weekly){
    if(m.done) continue;
    const val = m.check(runStats);
    if(val!==undefined){ m.progress = Math.min(val, m.target); if(m.progress>=m.target){ m.done=true; addXP(m.xp); any=true; } }
  }
  if(any) saveDB();
}
function updateAchievements(){
  let any=false;
  for(const a of DB.achievements){
    const def=ACH_DEFS.find(d=>d.id===a.id); if(!def) continue;
    if(a.unlocked) continue;
    // calculate progress
    let prog=0;
    if(a.id==='first_run') prog=DB.stats.totalRuns;
    else if(a.id==='combo10') prog=DB.stats.bestCombo;
    else if(a.id==='untouchable') prog=DB.stats.bestDistance;
    else if(a.id==='smoker') prog=DB.stats.totalCigs;
    else if(a.id==='lightning' || a.id==='nearmiss100') prog=DB.stats.totalNearMiss;
    else if(a.id==='lastchance') prog=DB.stats.shieldSaves||0;
    else if(a.id==='record') prog=DB.stats.bestScore;
    else if(a.id==='nightowl') prog=DB.stats.nightRuns||0;
    else if(a.id==='collector') prog=DB.stats.pows||0;
    else if(a.id==='explorer'){ const z=DB.stats.zonesSeen; prog= Array.isArray(z)? z.length : (z?.size||0); }
    else if(a.id==='friend') prog=DB.stats.friendsAdded||0;
    a.progress=Math.min(prog, def.target);
    if(def.check(DB.stats)){ a.unlocked=true; addXP(200); any=true; }
  }
  if(any) saveDB();
}

/* ---------------- League ---------------- */
const LEAGUE_TIERS=['bronze','silver','gold','diamond'];
const LEAGUE_NAMES={bronze:'🥉 Bronze', silver:'🥈 Silver', gold:'🥇 Gold', diamond:'💎 Diamond'};
const LEAGUE_THRESHOLDS={bronze:0, silver:5000, gold:15000, diamond:35000};
function leagueFromScore(score){
  if(score>=35000) return 'diamond';
  if(score>=15000) return 'gold';
  if(score>=5000) return 'silver';
  return 'bronze';
}
function updateLeague(score){
  DB.league.weeklyScore += score;
  const newTier = leagueFromScore(DB.league.weeklyScore);
  const idxOld=LEAGUE_TIERS.indexOf(DB.league.tier), idxNew=LEAGUE_TIERS.indexOf(newTier);
  if(idxNew>idxOld) DB.league.tier=newTier;
  if(LEAGUE_TIERS.indexOf(newTier)>LEAGUE_TIERS.indexOf(DB.league.bestTier)) DB.league.bestTier=newTier;
  saveDB();
}
function checkLeagueReset(){
  const now=Date.now();
  if(!DB.league.resetAt) DB.league.resetAt = now + 7*86400000;
  if(now>DB.league.resetAt){
    DB.league.history.push({ week: new Date().toISOString().slice(0,10), score: DB.league.weeklyScore, tier: DB.league.tier });
    DB.league.weeklyScore=0; DB.league.tier='bronze'; DB.league.resetAt=now+7*86400000;
    saveDB();
  }
}

/* ---------------- Tonight Event (daily) ---------------- */
const TONIGHT_EVENTS=[
  {id:'sleepy_guard', text:'امشب انتظامات خوابش میاد — سرعت پلیس -15%!', icon:'😴', mod:{police:-0.15}},
  {id:'cafeteria', text:'امشب سلف بازه — آیتم بیشتر!', icon:'🍔', mod:{cigs:1.4}},
  {id:'blackout', text:'امشب برق قطع میشه — دید کمتر ولی امتیاز ×1.2!', icon:'💡', mod:{scoreMul:1.2, visibility:0.7}},
  {id:'rain', text:'بارون امشب — زمین لغزنده!', icon:'🌧️', mod:{friction:0.85}},
  {id:'exam', text:'شب امتحان — همه بیدارن، موانع بیشتر!', icon:'📚', mod:{obstacle:1.3}},
  {id:'party', text:'مهمونی خوابگاه — موسیقی بلند، امتیاز ×1.15!', icon:'🎉', mod:{scoreMul:1.15}},
];
function getTonightEvent(){
  const seed=getDailySeed();
  const rng=mulberry32(seed+9999);
  return TONIGHT_EVENTS[Math.floor(rng()*TONIGHT_EVENTS.length)];
}

/* ---------------- Rumor / Random Events (in-run) ---------------- */
const RUMORS=[
  'میگن امشب انتظامات دو برابر شده! 👮‍♂️👮‍♂️',
  'میگن طبقه سوم یه راه مخفی داره... 🚪✨',
  'میگن سلف امشب قرمه‌سبزی داره! 🍲',
  'شنیدی؟ آسانسور دوباره خراب شده! 🛗',
  'میگن یکی تو پارکینگ سیگار قایم کرده 🚬',
  'شایعه: مسئول خوابگاه امشب نیست! 😏',
];
const INGAME_EVENTS=[
  {id:'raid', title:'🚨 عملیات ویژه انتظامات!', desc:'موانع بیشتر، پلیس نزدیک‌تر', dur:10, apply:(s)=>{s.eventMul.obstacle=1.5; s.eventMul.police=1.3; s.danger=Math.min(0.95,s.danger+0.15);}},
  {id:'rain', title:'🌧️ بارون شروع شد', desc:'سرعت -10% ولی NearMiss ×1.5', dur:8, apply:(s)=>{s.eventMul.speed=0.9; s.eventMul.nearMul=1.5;}},
  {id:'blackout', title:'💡 برق خوابگاه رفت!', desc:'دید کم، ولی امتیاز بیشتر', dur:9, apply:(s)=>{s.eventMul.scoreMul=1.4; s.darkness=0.5;}},
  {id:'runner', title:'🏃 یکی جلوت داره فرار می‌کنه!', desc:'دنبالش برو — مسیر جایزه', dur:7, apply:(s)=>{s.eventMul.cigBonus=10;}},
  {id:'open_door', title:'🚪 در خروجی باز شد!', desc:'میان‌بر — امتیاز +200', dur:6, apply:(s)=>{s.eventMul.shortcut=true;}},
  {id:'double_guard', title:'👮 دو مأمور وارد مسیر شدند!', desc:'گارد بیشتر', dur:9, apply:(s)=>{s.eventMul.guard=1.8;}},
];

/* ---------------- Ghost / Seed / Challenge ---------------- */
function makeSeed(){ return randi(10000,99999); }
function getChallengeFromUrl(){
  try{
    const u=new URL(location.href);
    const c=u.searchParams.get('challenge');
    if(c && /^\d{4,6}$/.test(c)) return parseInt(c,10);
  }catch(e){}
  return null;
}

/* ---------------- Fake Backend (Offline-First) — REAL MODE: bots disabled ---------------- */
// برای حذف لیگ فیک: bots خالی شد — لیگ فقط امتیازهای واقعی MySQL را نشان می‌دهد
const USE_FAKE_BOTS = false; // true = نمایش بات‌های نمایشی (demo)، false = فقط امتیاز واقعی
const FakeBackend = {
  bots: [],
  getLeaderboard(tab, filterChar){
    let list = [];
    // from DB cached + bots + pending
    const now=Date.now();
    // add player best
    const playerScore = DB.stats.bestScore;
    if(playerScore>0){
      list.push({username: DB.player.username||'تو', character: DB.characters.selected, score:playerScore, distance:DB.stats.bestDistance, cigs:DB.stats.bestCigs||DB.stats.totalCigs, combo:DB.stats.bestCombo, avatar:'⭐', isMe:true, date:now});
    }
    // add fake bots with slight jitter per day (disabled when USE_FAKE_BOTS=false)
    if (USE_FAKE_BOTS && this.bots.length>0) {
      const seed=getDailySeed();
      const rng=mulberry32(seed);
      this.bots.forEach(b=> {
        const jitter = Math.floor((rng()-0.5)*800);
        list.push({...b, score: Math.max(0,b.score+jitter), isMe:false, date: now - randi(0,86400000*3)});
      });
    }
    // add pending runs
    DB.pendingRuns.forEach(r=> list.push({...r, isMe: r.username===(DB.player.username||'تو'), date:r.date}));
    // add cached board
    DB.cachedBoard.forEach(r=> { if(!list.some(x=>x.username===r.username && x.score===r.score)) list.push({...r, isMe:false}); });
    // filter
    if(tab==='daily'){
      // only today (sim: last 1 day)
      list = list.filter(x=> now - x.date < 86400000);
    } else if(tab==='weekly'){
      list = list.filter(x=> now - x.date < 7*86400000);
    } else if(tab==='friends'){
      const friends = new Set(DB.friends.map(f=>f.username));
      list = list.filter(x=> x.isMe || friends.has(x.username));
      if(list.length<=1) list = [{username:'هنوز دوستی نداری', character:'parsa', score:0, distance:0, cigs:0, combo:0, avatar:'👥', isMe:false, date:now}];
    } else if(tab==='character' && filterChar){
      list = list.filter(x=> x.character===filterChar);
    }
    list.sort((a,b)=> b.score - a.score);
    // rank
    list.forEach((e,i)=> e.rank=i+1);
    return list;
  },
  async submitScore(payload){
    // validation
    const err = validateRun(payload);
    if(err) throw new Error(err);
    // simulate network delay
    await new Promise(r=>setTimeout(r, 120+Math.random()*400));
    // 10% chance of fake network failure
    if(Math.random()<0.08) throw new Error('network');
    DB.pendingRuns = DB.pendingRuns.filter(r=> !(r.score===payload.score && r.date===payload.date));
    DB.cachedBoard.unshift(payload);
    if(DB.cachedBoard.length>50) DB.cachedBoard.pop();
    saveDB();
    return {ok:true, rank: FakeBackend.getLeaderboard('global').findIndex(e=>e.isMe)+1 };
  },
  async fetchLeaderboard(tab, char){
    await new Promise(r=>setTimeout(r, 180+Math.random()*500));
    if(Math.random()<0.06) throw new Error('offline');
    return this.getLeaderboard(tab, char);
  }
};
function validateRun(p){
  if(!p || typeof p.score!=='number' || p.score<0) return 'invalid score';
  if(p.score>999999) return 'score too high';
  if(p.distance<0 || p.distance>20000) return 'distance invalid';
  if(p.cigs<0 || p.cigs>5000) return 'cigs invalid';
  if(p.combo<0 || p.combo>1000) return 'combo invalid';
  if(!['parsa','mahyar','arsham','mohsen','farham'].includes(p.character)) return 'bad char';
  // consistency
  const maxPossible = Math.floor(p.distance) + p.cigs*60 + p.combo*50 + 5000;
  if(p.score > maxPossible*1.8) return 'inconsistent score';
  if(p.duration && p.duration < 5 && p.score>5000) return 'too fast';
  return null;
}
const Network = {
  supabase: null,
  php: false,
  init(){
    const url = store.get('supabase_url', null);
    const key = store.get('supabase_key', null);
    if(url && key) this.supabase={url,key};
    else this.supabase=null;
    if(window.Api && window.isSupabaseConfigured) this.supabase = {real:true};
    if(window.PhpApi && window.phpBackendAvailable) this.php = true;
    // also check if fetch to PHP works (will be set via php_api.js)
    if(window.phpBackendAvailable) this.php = true;
  },
  async submit(payload){
    // 1) Try PHP backend first (shared hosting target)
    if((window.PhpApi && window.phpBackendAvailable) || this.php){
      try{
        const api = window.PhpApi;
        if(api){
          const run_id = payload.run_id || (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : 'run-'+Date.now()+'-'+Math.random().toString(36).slice(2,8));
          const started = payload.started_at || new Date().toISOString().slice(0,19).replace('T',' ');
          const finished = payload.finished_at || new Date().toISOString().slice(0,19).replace('T',' ');
          const res = await api.submitRun({
            run_id: run_id,
            character_id: payload.character || payload.character_id,
            seed: payload.seed || 0,
            score: payload.score,
            distance: payload.distance,
            best_combo: payload.combo || payload.best_combo || 0,
            duration: payload.duration || 60,
            items: payload.cigs || payload.items_collected || 0,
            near_misses: payload.nearMiss || payload.near_misses || 0,
            powerups: payload.powerups_used || payload.powsCollected || 0,
            ability_uses: payload.abilityUses || payload.ability_uses || 0,
            environment: payload.environment || 'dorm',
            started_at: started,
            finished_at: finished
          });
          return {ok:true, rank: res.rank || 1, real:true, php:true, data:res};
        }
      }catch(e){
        console.warn('[Network] PHP submit failed, fallback', e.message);
        // if auth error, keep offline queue
        if(e.message && e.message.includes('Login required')) throw e;
      }
    }
    // 2) Try Supabase
    if(window.Api && window.isSupabaseConfigured){
      try{
        const run_id = payload.run_id || (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : 'run-'+Date.now()+'-'+Math.random().toString(36).slice(2,8));
        const started = payload.started_at || new Date().toISOString();
        const finished = payload.finished_at || new Date().toISOString();
        const res = await window.Api.submitRun({
          run_id: run_id,
          character_id: payload.character || payload.character_id,
          seed: payload.seed || 0,
          score: payload.score,
          distance: payload.distance,
          best_combo: payload.combo || 0,
          duration: payload.duration || 60,
          items: payload.cigs || 0,
          near_misses: payload.nearMiss || 0,
          powerups: payload.powerups_used || 0,
          ability_uses: payload.abilityUses || 0,
          environment: payload.environment || 'dorm',
          started_at: started,
          finished_at: finished
        });
        return {ok:true, rank: 1, real:true, data:res};
      }catch(e){
        console.warn('[Network] real submit failed, fallback to fake', e.message);
      }
    }
    if(this.supabase){
      try{ return await FakeBackend.submitScore(payload); }catch(e){ throw e; }
    } else {
      return await FakeBackend.submitScore(payload);
    }
  },
  async leaderboard(tab, char){
    // 1) PHP — merge pendingRuns so guest sees own score even before verified
    if((window.PhpApi && window.phpBackendAvailable) || this.php){
      try{
        const api = window.PhpApi;
        if(api){
          const data = await api.getLeaderboard(tab, {character: char, limit:20, offset:0});
          let mapped = data.map((r, idx)=> ({
            username: r.username,
            character: r.character || r.character_id,
            score: r.score,
            distance: r.distance || 0,
            cigs: r.cigs || r.items_collected || 0,
            combo: r.combo || r.best_combo || 0,
            avatar: r.avatar || '😎',
            rank: Number(r.rank) || idx+1,
            isMe: false,
            date: r.date ? r.date : (r.created_at ? new Date(r.created_at).getTime() : Date.now())
          }));
          // merge local pendingRuns (so امتیاز همین الان دیده شود حتی قبل از verified)
          try{
            if (typeof DB !== 'undefined' && Array.isArray(DB.pendingRuns) && DB.pendingRuns.length>0) {
              const myName = DB.player && DB.player.username ? DB.player.username : null;
              DB.pendingRuns.forEach(r=>{
                // filter by character tab if needed
                if (tab==='character' && char && r.character!==char && r.character_id!==char) return;
                if (mapped.some(m=> m.username===r.username && m.score===r.score && Math.abs((m.date||0)-(r.date||0))<1000)) return;
                mapped.push({
                  username: r.username,
                  character: r.character||r.character_id,
                  score: r.score,
                  distance: r.distance||0,
                  cigs: r.cigs||0,
                  combo: r.combo||0,
                  avatar: r.avatar||'⭐',
                  rank: 0,
                  isMe: myName ? r.username===myName : true,
                  date: r.date||Date.now()
                });
              });
              mapped.sort((a,b)=> b.score - a.score);
              mapped.forEach((e,i)=> e.rank=i+1);
              // keep top 30 for display
              if (mapped.length>30) mapped = mapped.slice(0,30);
            }
          }catch(e){ console.warn('merge pending', e); }
          return mapped;
        }
      }catch(e){
        console.warn('[Network] PHP leaderboard failed', e.message);
      }
    }
    // 2) Supabase
    if(window.Api && window.isSupabaseConfigured){
      try{
        const data = await window.Api.getLeaderboard(tab, {character: char, limit:20, offset:0});
        return data.map((r, idx)=> ({
          username: r.username,
          character: r.character_id,
          score: r.score,
          distance: r.distance || 0,
          cigs: r.cigs || 0,
          combo: r.combo || 0,
          avatar: r.avatar || '⭐',
          rank: Number(r.rank) || idx+1,
          isMe: false,
          date: r.created_at ? new Date(r.created_at).getTime() : Date.now()
        }));
      }catch(e){
        console.warn('[Network] real leaderboard failed, fallback', e.message);
      }
    }
    if(this.supabase){
      try{ return await FakeBackend.fetchLeaderboard(tab,char); }catch(e){ throw e; }
    } else {
      return await FakeBackend.fetchLeaderboard(tab,char);
    }
  }
};
Network.init();
setTimeout(()=> Network.init(), 1500);
window.addEventListener('supabase:ready', ()=> Network.init());
window.addEventListener('php:ready', ()=> Network.init());

/* ---------------- DOM ---------------- */
const $ = id => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const el = {
  hud: $('hud'), cigs: $('hudCigs'), score: $('hudScore'), dist: $('hudDist'), level: $('hudLevel'),
  comboBox: $('hudComboBox'), combo: $('hudCombo'), levelBox: $('hudLevelBox'),
  pows: $('hudPows'), dangerFill: $('dangerFill'), abilityBtn: $('abilityBtn'), abIcon: $('abIcon'), abLabel: $('abLabel'), abProg: $('abProg'), abFill: $('abFill'),
  comboHud: $('comboHud'), comboBigText: $('comboBigText'), eventBanner: $('eventBanner'), rumorBanner: $('rumorBanner'),
  menu: $('menu'), select: $('select'), league: $('league'), missions: $('missions'), achievements: $('achievements'), profile: $('profile'), settings: $('settings'), records: $('records'), over: $('over'),
  cards: $('cards'), recList: $('recList'),
  tutorial: $('tutorial'), pauseOv: $('pauseOv'), toast: $('toast'),
  ovScore: $('ovScore'), ovCigs: $('ovCigs'), ovDist: $('ovDist'), ovBest: $('ovBest'), ovCombo: $('ovCombo'), ovNearMiss: $('ovNearMiss'), scoreBreak: $('scoreBreak'), overRank: $('overRank'), overEmoji: $('overEmoji'), overRumor: $('overRumor'),
  newRec: $('newRec'), levelUpBadge: $('levelUpBadge'), btnMute: $('btnMute'),
  // new
  usernameScreen: $('screen-username'), usernameInput: $('usernameInput'),
  menuUsername: $('menuUsername'), menuAvatar: $('menuAvatar'), menuLevel: $('menuLevel'), menuBest: $('menuBest'), menuLeagueBadge: $('menuLeagueBadge'), tonightText: $('tonightText'),
  charDetail: $('charDetail'), charDetailIcon: $('charDetailIcon'), charDetailName: $('charDetailName'), charDetailDesc: $('charDetailDesc'),
  leagueList: $('leagueList'), leagueStatus: $('leagueStatus'), myRankCard: $('myRankCard'), leagueTabs: $('leagueTabs'), leagueCharFilter: $('leagueCharFilter'),
  missionList: $('missionList'), achGrid: $('achGrid'), achProgress: $('achProgress'),
  profileBox: $('profileBox'), statsBox: $('statsBox'),
  friendModal: $('friendModal'), myFriendCode: $('myFriendCode'), friendCodeInput: $('friendCodeInput'), friendList: $('friendList'),
  challengeModal: $('challengeModal'), challengeSeed: $('challengeSeed'), challengeUrl: $('challengeUrl'),
  syncStatus: $('syncStatus'),
};

/* ---------------- شخصیت‌ها با Ability ---------------- */
const CHARS = [
  { id: 'parsa',  name: 'پارسا',  title:'فرارچی', hair: 'wavy',  quiff: true, hairCol: '#2e2117', beard: 'trimmed', glasses: 'round', mouth: 'soft', skin: '#eeb98d', hoodie: '#6ec1ff', hoodDark: '#3f95dd', pants: '#2f3d63', shoe: '#e74c3c', letter: 'پ', browW: 8,  iris: '#4a2f1d', faceW: 0.92, chain: true, watch: true,
    stats:{speed:9, control:7, luck:5},
    passive:{name:'سرعت پایه', desc:'+10% سرعت پایه', icon:'🏃'},
    ability:{name:'Adrenaline', icon:'🔥', desc:'۴ ثانیه سرعت +30% و امتیاز ×1.5', cooldown:18, duration:4, key:'Q'}
  },
  { id: 'mahyar', name: 'مهیار', hair: 'short', part: true,  hairCol: '#241a10', beard: 'mustache', chin: true, glasses: 'thin', mouth: 'soft', skin: '#eab68b', hoodie: '#eef2f7', hoodDark: '#c3ccd8', pants: '#2b3648', shoe: '#2f6fd0', letter: 'م', browW: 7,  iris: '#402a18', faceW: 0.92, watch: true,
    stats:{speed:6, control:6, luck:9},
    passive:{name:'جذب', desc:'شعاع جذب آیتم +30%', icon:'🧲'},
    ability:{name:'Magnet Mode', icon:'🧲', desc:'۵ ثانیه جذب همه آیتم‌ها', cooldown:20, duration:5}
  },
  { id: 'arsham', name: 'آرشام', hair: 'afro',  hairCol: '#221812', beard: 'stubble', glasses: null, mouth: 'soft', skin: '#e8b184', hoodie: '#c65a2e', hoodDark: '#9c4421', pants: '#23272e', shoe: '#f5f5f5', letter: 'آ', scarf: '#3b3b46', browW: 12, uni: true, iris: '#3a2415', faceW: 0.97,
    stats:{speed:7, control:8, luck:8},
    passive:{name:'ریسک', desc:'Near Miss امتیاز +50%', icon:'⚡'},
    ability:{name:'Risk Mode', icon:'🎲', desc:'۶ ثانیه امتیاز ×2 ولی برخورد جریمه بیشتر', cooldown:22, duration:6}
  },
  { id: 'mohsen', name: 'محسن',  hair: 'quiff', hairCol: '#1e150e', beard: 'trimmed', glasses: null, mouth: 'grin',  skin: '#edbd92', hoodie: '#26282e', hoodDark: '#17181d', pants: '#1d232b', shoe: '#ffd93d', letter: 'م', browW: 9,  iris: '#2e1c10', faceW: 0.95,
    stats:{speed:5, control:9, luck:6},
    passive:{name:'تانک', desc:'یک ضربه کوچک را تحمل می‌کند (هر ۹۰m)', icon:'🛡️'},
    ability:{name:'Shield', icon:'🛡️', desc:'۴ ثانیه ضدضربه کامل', cooldown:20, duration:4}
  },
  { id: 'farham', name: 'فرهام', hair: 'curly', messy: true, hairCol: '#2b201a', beard: 'full', glasses: null, mouth: 'wavy', scrunch: true, skin: '#e5ad7e', hoodie: '#3a3f46', hoodDark: '#262a30', pants: '#20242c', shoe: '#9b59b6', letter: 'ف', browW: 9,  iris: '#332012', faceW: 1.0, lanyard: true,
    stats:{speed:7, control:7, luck:7},
    passive:{name:'شبح', desc:'پلیس دیرتر نزدیک می‌شود (-15%)', icon:'👻'},
    ability:{name:'Ghost Mode', icon:'👻', desc:'۳.۵ ثانیه عبور از موانع خاص', cooldown:25, duration:3.5}
  }
];

/* ---------------- ساخت چهره ---------------- */
function makeHead(ch, mood) {
  const S2 = 260, c = document.createElement('canvas'); c.width = c.height = S2;
  const g = c.getContext('2d');
  const x = 130, y = 146, r = 86;
  g.fillStyle = ch.skin; circle(g, x - r + 2, y + 12, 16); circle(g, x + r - 2, y + 12, 16);
  g.fillStyle = shade(ch.skin, 0.25); circle(g, x - r + 2, y + 12, 8); circle(g, x + r - 2, y + 12, 8);
  const fw = ch.faceW || 0.94;
  const fg = g.createLinearGradient(0, y - r, 0, y + r);
  fg.addColorStop(0, tint(ch.skin, 0.14)); fg.addColorStop(0.55, ch.skin); fg.addColorStop(1, shade(ch.skin, 0.14));
  g.fillStyle = fg;
  g.beginPath(); g.ellipse(x, y, r * fw, r, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(0,0,0,.06)';
  g.beginPath(); g.ellipse(x - r * fw * 0.78, y + 8, r * 0.28, r * 0.62, 0.2, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(x + r * fw * 0.78, y + 8, r * 0.28, r * 0.62, -0.2, 0, TAU); g.fill();
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
  if (ch.quiff) bump(x + 4, y - 68, 24, ch.hairCol);
  if (ch.messy) { bump(x - 72, y - 44, 11, ch.hairCol); bump(x + 68, y - 56, 10, ch.hairCol); bump(x + 6, y - 82, 11, ch.hairCol); bump(x - 40, y - 74, 10, ch.hairCol); }
  if (ch.part) {
    g.strokeStyle = shade(ch.hairCol, 0.45); g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 16, y - 84); g.quadraticCurveTo(x - 26, y - 66, x - 30, y - 48); g.stroke();
  }
  g.strokeStyle = tint(ch.hairCol, 0.22); g.lineCap = 'round'; g.lineWidth = 5;
  g.beginPath(); g.arc(x - 18, y - 46, r * 0.5, Math.PI * 1.15, Math.PI * 1.5); g.stroke();
  g.beginPath(); g.arc(x + 26, y - 42, r * 0.42, Math.PI * 1.2, Math.PI * 1.55); g.stroke();
  const bc = ch.hairCol;
  if (ch.beard === 'full' || ch.beard === 'trimmed') {
    g.strokeStyle = bc; g.lineWidth = ch.beard === 'full' ? 30 : 20;
    g.beginPath(); g.arc(x, y + 2, r * 0.86, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke();
    g.fillStyle = bc; circle(g, x - (r * 0.8), y + 24, 14); circle(g, x + (r * 0.8), y + 24, 14);
    g.fillStyle = bc;
    rr(g, x - r * 0.98, y - 16, 14, 44, 6); g.fill();
    rr(g, x + r * 0.98 - 14, y - 16, 14, 44, 6); g.fill();
  } else if (ch.beard === 'stubble') {
    g.strokeStyle = rgba(bc, 0.8); g.lineWidth = 13;
    g.beginPath(); g.arc(x, y + 2, r * 0.84, 0.16 * Math.PI, 0.84 * Math.PI); g.stroke();
  }
  if (ch.beard) {
    g.fillStyle = bc;
    g.beginPath(); g.ellipse(x - 16, y + 38, 17, 8, -0.14, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(x + 16, y + 38, 17, 8, 0.14, 0, TAU); g.fill();
    g.strokeStyle = tint(bc, 0.2); g.lineWidth = 3;
    g.beginPath(); g.moveTo(x - 24, y + 36); g.lineTo(x - 8, y + 34); g.stroke();
    g.beginPath(); g.moveTo(x + 24, y + 36); g.lineTo(x + 8, y + 34); g.stroke();
  }
  if (ch.beard === 'full' || ch.beard === 'trimmed') {
    g.strokeStyle = tint(bc, 0.16); g.lineWidth = 3; g.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a = 0.25 * Math.PI + i * 0.1 * Math.PI;
      const bx = x + Math.cos(a) * r * 0.8, by = y + 2 + Math.sin(a) * r * 0.8;
      g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(a) * 10, by + Math.sin(a) * 10); g.stroke();
    }
  }
  g.strokeStyle = ch.hairCol; g.lineCap = 'round'; g.lineWidth = ch.browW;
  const browY = mood === 'scared' ? y - 40 : y - 30;
  if (ch.scrunch) {
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
  g.fillStyle = shade(ch.skin, 0.18);
  g.beginPath(); g.ellipse(x, y + 22, 9, 7, 0, 0, TAU); g.fill();
  g.fillStyle = shade(ch.skin, 0.35);
  g.beginPath(); g.ellipse(x - 5, y + 25, 2.6, 1.8, 0, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(x + 5, y + 25, 2.6, 1.8, 0, 0, TAU); g.fill();
  if (mood === 'scared') {
    g.fillStyle = '#5b2f22'; g.beginPath(); g.ellipse(x, y + 52, 12, 15, 0, 0, TAU); g.fill();
    g.fillStyle = '#c96a5a'; g.beginPath(); g.ellipse(x, y + 58, 8, 6, 0, 0, TAU); g.fill();
  } else if (ch.mouth === 'smile' || ch.mouth === 'grin') {
    g.fillStyle = '#5b2f22';
    g.beginPath(); g.arc(x, y + 46, 16, 0.12 * Math.PI, 0.88 * Math.PI); g.closePath(); g.fill();
    g.fillStyle = '#fff'; rr(g, x - 12, y + 48, 24, 6, 3); g.fill();
    if (ch.mouth === 'grin') { g.strokeStyle = shade(ch.skin, 0.4); g.lineWidth = 3; g.beginPath(); g.moveTo(x + 18, y + 44); g.lineTo(x + 24, y + 40); g.stroke(); }
  } else if (ch.mouth === 'soft') {
    g.strokeStyle = '#7c4a2d'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.arc(x, y + 44, 14, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.22)';
    g.beginPath(); g.ellipse(x, y + 56, 8, 3, 0, 0, TAU); g.fill();
  } else {
    g.strokeStyle = '#7c4a2d'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 18, y + 56); g.quadraticCurveTo(x - 9, y + 50, x, y + 56); g.quadraticCurveTo(x + 9, y + 62, x + 18, y + 54); g.stroke();
    g.strokeStyle = shade(ch.skin, 0.35); g.lineWidth = 3;
    g.beginPath(); g.moveTo(x - 8, y + 64); g.quadraticCurveTo(x, y + 67, x + 8, y + 64); g.stroke();
  }
  if (ch.chin) {
    g.fillStyle = bc;
    g.beginPath(); g.ellipse(x, y + 66, 13, 9, 0, 0, TAU); g.fill();
  }
  g.fillStyle = 'rgba(230,120,110,.14)';
  circle(g, x - 50, y + 26, 11); circle(g, x + 50, y + 26, 11);
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
  if (ch.scarf) {
    g.fillStyle = ch.scarf; rr(g, x - 70, y + r - 18, 140, 34, 16); g.fill();
    g.fillStyle = tint(ch.scarf, 0.14);
    for (let i = 0; i < 6; i++) circle(g, x - 55 + i * 22, y + r - 4, 4.5);
    g.fillStyle = shade(ch.scarf, 0.25); rr(g, x + 18, y + r + 8, 26, 26, 8); g.fill();
  }
  if (mood === 'scared') {
    g.fillStyle = 'rgba(140,200,255,.9)';
    g.beginPath(); g.ellipse(x - r * 0.78, y - 26, 6, 9, 0.3, 0, TAU); g.fill();
  }
  return c;
}
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

/* ---------------- glow / obstacles / items / props (keep original but extended) ---------------- */
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
  { // دوربین
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
  { // صندلی
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
  // --- NEW SPECIAL OBSTACLES ---
  { // دوچرخه
    const [c,g]=obCanvas(220,150);
    g.strokeStyle='#455a64'; g.lineWidth=10; g.lineCap='round';
    g.beginPath(); g.arc(50,110,28,0,TAU); g.stroke();
    g.beginPath(); g.arc(170,110,28,0,TAU); g.stroke();
    g.strokeStyle='#78909c'; g.lineWidth=8;
    g.beginPath(); g.moveTo(50,110); g.lineTo(100,60); g.lineTo(170,110); g.stroke();
    g.beginPath(); g.moveTo(100,60); g.lineTo(120,30); g.stroke();
    g.fillStyle='#e74c3c'; rr(g,116,22,28,16,6); g.fill();
    OB_DEFS.bike={img:c,type:'low',hMul:0.55};
  }
  { // کارتن اسباب‌کشی
    const [c,g]=obCanvas(200,180);
    g.fillStyle='#8d6e63'; rr(g,30,80,140,70,8); g.fill();
    g.fillStyle='rgba(0,0,0,.15)'; rr(g,30,80,140,16,6); g.fill();
    g.fillStyle='#5d4037'; g.font='900 18px Vazirmatn'; g.textAlign='center'; g.fillText('شکستنی',100,124);
    g.fillStyle='rgba(255,255,255,.2)'; rr(g,90,90,6,40,3); g.fill();
    OB_DEFS.carton={img:c,type:'full',hMul:0.75};
  }
  { // NPC دانشجو
    const [c,g]=obCanvas(200,280);
    g.fillStyle='#4a5a6a'; rr(g,60,140,80,90,14); g.fill();
    g.fillStyle='#eeb98d'; circle(g,100,90,38);
    g.fillStyle='#2c3e50'; g.beginPath(); g.arc(100,70,42,Math.PI,0); g.fill();
    g.fillStyle='#fff'; g.font='900 12px Vazirmatn'; g.textAlign='center'; g.fillText('دانشجو',100,170);
    OB_DEFS.npc={img:c,type:'full',hMul:1.1};
  }
}
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
  POW_DEFS.ghost = mk('rgba(180,130,255,.9)', g=>{
    g.fillStyle='#7c4dff';
    g.beginPath(); g.arc(48,48,20,Math.PI,0); g.lineTo(68,58); g.lineTo(64,74); g.lineTo(56,66); g.lineTo(52,74); g.lineTo(48,66); g.lineTo(44,74); g.lineTo(40,66); g.lineTo(32,74); g.lineTo(28,58); g.closePath(); g.fill();
    g.fillStyle='#fff'; circle(g,40,44,3); circle(g,56,44,3);
  });
  POW_DEFS.slow = mk('rgba(77,208,225,.9)', g=>{
    g.fillStyle='#fff'; circle(g,48,48,18);
    g.fillStyle='#006064'; g.font='900 22px Vazirmatn'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('⏱',48,51);
  });
  POW_DEFS.second = mk('rgba(255,110,180,.9)', g=>{
    g.fillStyle='#fff'; g.beginPath(); g.arc(48,48,16,0,TAU); g.fill();
    g.fillStyle='#e91e63'; g.font='900 20px Vazirmatn'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('❤',48,51);
  });
}

/* ---------------- props ---------------- */
let PROP_DOOR = null, PROP_TREE = null, PROP_LAMP = null, PROP_BUSH = null, PROP_NEON = null, CLOUD = null, PROP_TABLE=null, PROP_CAR=null;
function buildProps() {
  { const [c, g] = obCanvas(150, 260);
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
  { const [c, g] = obCanvas(180, 300);
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
  { const [c, g] = obCanvas(120, 320);
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
  { const [c, g] = obCanvas(120, 70);
    g.fillStyle = '#245c3c'; circle(g, 34, 44, 24); circle(g, 62, 38, 28); circle(g, 90, 46, 22);
    g.fillStyle = '#2e6b46'; circle(g, 48, 32, 20); circle(g, 78, 30, 18);
    g.fillStyle = 'rgba(255,255,255,.1)'; circle(g, 56, 24, 9);
    PROP_BUSH = c;
  }
  { const [c, g] = obCanvas(110, 150);
    g.fillStyle = '#201a2e'; rr(g, 8, 8, 94, 134, 10); g.fill();
    g.strokeStyle = '#ff4fa0'; g.lineWidth = 6; g.lineCap = 'round';
    rr(g, 20, 22, 70, 106, 8); g.stroke();
    g.strokeStyle = '#4fd8ff'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(34, 48); g.lineTo(76, 48); g.stroke();
    g.beginPath(); g.moveTo(34, 72); g.lineTo(66, 72); g.stroke();
    g.beginPath(); g.moveTo(34, 96); g.lineTo(76, 96); g.stroke();
    PROP_NEON = c;
  }
  { const [c, g] = obCanvas(220, 70);
    g.fillStyle = 'rgba(120,110,190,.35)';
    circle(g, 50, 44, 22); circle(g, 90, 34, 28); circle(g, 135, 42, 24); circle(g, 172, 48, 18);
    g.fillStyle = 'rgba(150,140,220,.25)';
    circle(g, 70, 30, 18); circle(g, 115, 26, 20);
    CLOUD = c;
  }
  { // میز سلف
    const [c,g]=obCanvas(200,120);
    g.fillStyle='#6d4c41'; rr(g,20,40,160,14,6); g.fill();
    g.fillStyle='#3e2723'; rr(g,40,54,12,50,4); g.fill(); rr(g,148,54,12,50,4); g.fill();
    g.fillStyle='#ffcc80'; rr(g,60,28,80,18,4); g.fill();
    PROP_TABLE=c;
  }
  { // ماشین پارکینگ
    const [c,g]=obCanvas(240,120);
    g.fillStyle='#37474f'; rr(g,20,50,200,50,12); g.fill();
    g.fillStyle='#263238'; rr(g,30,30,160,40,10); g.fill();
    g.fillStyle='#90caf9'; rr(g,40,38,60,22,6); g.fill(); rr(g,110,38,60,22,6); g.fill();
    g.fillStyle='#111'; circle(g,60,105,14); circle(g,180,105,14);
    PROP_CAR=c;
  }
}

/* ---------------- zones (6) ---------------- */
const ZONES = [
  { id:'dorm', name: 'سالن خوابگاه', ground: '#463c63', road: '#393153', wall: '#5d4a86', prop: 'hall' },
  { id:'campus', name: 'محوطه دانشگاه', ground: '#2c473c', road: '#31384f', wall: '#3f5a4a', prop: 'yard' },
  { id:'cafeteria', name: 'سلف', ground: '#4a3c2a', road: '#3d2f22', wall: '#6d4c41', prop: 'cafeteria' },
  { id:'alley', name: 'کوچه‌های اطراف', ground: '#47394f', road: '#3a2f47', wall: '#6e4a5a', prop: 'alley' },
  { id:'parking', name: 'پارکینگ', ground: '#2e3a42', road: '#263238', wall: '#37474f', prop: 'parking' },
  { id:'night', name: 'محوطه شبانه', ground: '#1a1a2e', road: '#1e1e3a', wall: '#16213e', prop: 'night' },
];
const ZONE_LEN = 420;

/* ---------------- audio ---------------- */
const AU = {
  ctx: null, master: null, muted: DB.settings.muted,
  noise: null, musTimer: null, step: 0, nextT: 0,
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : (DB.settings.sfxVol/100)*0.9;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.5;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; return false; }
    return true;
  },
  setMuted(m) { this.muted = m; DB.settings.muted=m; saveDB(); if (this.master) this.master.gain.value = m ? 0 : (DB.settings.sfxVol/100)*0.9; },
  setVolume(sfx, music){ DB.settings.sfxVol=sfx; DB.settings.musicVol=music; saveDB(); if(this.master) this.master.gain.value = this.muted?0:(sfx/100)*0.9; },
  blip(f, dur, type, vol, slide) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + dur);
    g.gain.setValueAtTime((vol || 0.15)*(DB.settings.sfxVol/100), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  noiseHit(dur, vol, freq) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 900;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime((vol || 0.3)*(DB.settings.sfxVol/100), t);
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
  nearMiss(){ this.blip(1200,0.12,'square',0.14,600); setTimeout(()=>this.blip(1600,0.09,'square',0.12),90); },
  comboUp(lv){ this.blip(600+lv*80,0.14,'square',0.15); },
  ability(){ [500,700,900].forEach((f,i)=>setTimeout(()=>this.blip(f,0.13,'triangle',0.16),i*60)); },
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
      g.gain.linearRampToValueAtTime(0.12*(DB.settings.sfxVol/100), st + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, st + 0.2);
      o.connect(g); g.connect(this.master); o.start(st); o.stop(st + 0.22);
    }
  },
  overJingle() { [500, 400, 300, 220].forEach((f, i) => setTimeout(() => this.blip(f, 0.22, 'triangle', 0.2), i * 140)); },
  levelUp(){ [600,800,1000,1200,1500].forEach((f,i)=>setTimeout(()=>this.blip(f,0.15,'square',0.18),i*80)); },
  MELODY: [0, -1, 3, -1, 5, -1, 3, -1, 7, -1, 5, 3, 0, -1, 3, -1, 10, -1, 7, -1, 5, -1, 3, -1, 12, -1, 10, 7, 5, 3, 0, -1],
  startMusic() { if (!this.ctx || this.musTimer) return; this.step = 0; this.nextT = this.ctx.currentTime + 0.1; this.musTimer = setInterval(() => this.sched(), 40); },
  stopMusic() { if (this.musTimer) { clearInterval(this.musTimer); this.musTimer = null; } },
  sched() {
    if (!this.ctx || this.muted) { if (this.ctx) this.nextT = this.ctx.currentTime + 0.1; return; }
    const spb = 60 / 118 / 2 * (0.7 + DB.settings.musicVol/100*0.6);
    while (this.nextT < this.ctx.currentTime + 0.15) {
      const s = this.step % 32;
      const m = this.MELODY[s];
      if (m >= 0) this.note(440 * Math.pow(2, m / 12)*(S? (S.speed>26?1.15:1):1), this.nextT, spb * 0.9, 'triangle', 0.07*(DB.settings.musicVol/100));
      if (s % 8 === 0) this.note(110 * (s % 16 === 8 ? 1.26 : 1), this.nextT, spb * 3, 'square', 0.06*(DB.settings.musicVol/100));
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
    g.gain.setValueAtTime(0.05*(DB.settings.sfxVol/100), t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + 0.06);
  }
};

/* ---------------- scene ---------------- */
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
    if (Math.random() < 0.06) {
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
  cityFar = document.createElement('canvas'); cityFar.width = W; cityFar.height = Math.ceil(H * 0.2);
  let g = cityFar.getContext('2d');
  g.fillStyle = '#241c4e';
  let x = -10;
  while (x < W + 10) { const bw = rand(50, 110), bh = rand(cityFar.height * 0.35, cityFar.height * 0.8); g.fillRect(x, cityFar.height - bh, bw, bh); x += bw + rand(2, 10); }
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
    g.fillStyle = '#0e0b26'; g.fillRect(x + bw * 0.3, bh2 - bhh - 6, bw * 0.4, 6);
    if (Math.random() < 0.3) { g.strokeStyle = '#0e0b26'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + bw * 0.7, bh2 - bhh); g.lineTo(x + bw * 0.7, bh2 - bhh - 14); g.stroke(); }
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

/* ---------------- state ---------------- */
let S = null;
let selectedChar = DB.characters.selected;
if (!CHARS.some(c => c.id === selectedChar)) selectedChar = 'parsa';
CHARS.forEach(ch => { ch._heads = { norm: makeHead(ch, 'norm'), blink: makeHead(ch, 'blink'), scared: makeHead(ch, 'scared') }; });
buildGlow(); buildObstacles(); buildCig(); buildPows(); buildProps();
guardImg = makeGuard();
ensureMissions(); checkLeagueReset();

let currentSeed = null;
let isDailyChallenge = false;
let isFriendChallenge = false;
let challengeSeedVal = null;

function newState() {
  return {
    mode: 'idle', paused: false,
    t: 0, dist: 0, speed: 13,
    x: 0, vx: 0, targetLane: 0, landT: 0,
    jumpY: 0, vy: 0, airborne: false, jumpBuf: 0,
    slideT: 0,
    cigs: 0, cigScore: 0, combo: 0, bestCombo:0, comboTimer:0, lastCollect: -9,
    nearMiss:0, nearMissScore:0, perfects: 0, perfectStreak: 0, lines: {},
    pows: { boost: 0, magnet: 0, x2: 0, high: 0, ghost:0, slow:0 }, shield: false, extraLife:false,
    ability: { active:0, cooldown:0, kind:'' },
    inv: 0, danger: 0.18, shake: 0, whistleCd: 0, slowMo:0,
    ents: [], parts: [], floats: [],
    nextRowZ: 30, nextPowT: 6, rowId: 0, lineSeq: 0,
    catchT: 0, dustT: 0,
    charId: selectedChar,
    lastDangerInt: -1, lastHud: '', lastChips: '',
    // new
    scoreMul:1, difficulty:0, event: null, eventT:0, rumor:'', rumorT:0,
    ghostTrail: [], ghostIndex:0, showGhost:false, ghostData:null,
    seed: currentSeed || makeSeed(),
    runStartTime: Date.now(),
    powsCollected:0, abilityUses:0, distanceScore:0,
    zonesSeen: new Set(), lastZone:'',
    darkFactor:0,
    eventMul: {obstacle:1, police:1, speed:1, nearMul:1, scoreMul:1, cigBonus:0, shortcut:false, guard:1},
  };
}
S = newState();
const charOf = () => CHARS.find(c => c.id === S.charId) || CHARS[0];

/* ---------------- score ---------------- */
function computeScoreBreakdown(){
  const distScore = Math.floor(S.dist);
  const cigCollect = S.cigScore; // includes cig *25 + perfect
  const comboBonus = Math.floor(S.combo * 4 + S.bestCombo * 8);
  const nearBonus = S.nearMissScore;
  const perfectBonus = S.perfects * 20; // extra?
  const abilityBonus = S.abilityUses * 15;
  const difficultyMul = 1 + clamp(S.dist/3000,0,0.6);
  const tonight = getTonightEvent();
  const tonightMul = (tonight.mod.scoreMul||1);
  const eventMul = S.eventMul.scoreMul || 1;
  const totalMul = difficultyMul * tonightMul * eventMul * (S.pows.x2>0?2:1) * (S.ability.active>0 && charOf().id==='arsham'?2:1) * (S.ability.active>0 && charOf().id==='parsa'?1.5:1);
  const subtotal = distScore + cigCollect + comboBonus + nearBonus + abilityBonus;
  const final = Math.floor(subtotal * totalMul);
  return {distScore, cigCollect, comboBonus, nearBonus, abilityBonus, difficultyMul, tonightMul, eventMul, totalMul, subtotal, final};
}
function finalScore(){ return computeScoreBreakdown().final; }

/* ---------------- records (legacy) ---------------- */
function getRecords() { return store.get('fed_records_v1', {}); }
function getBest(id) { const r = getRecords(); return r[id] || { score: 0, cigs: 0, dist: 0 }; }
function saveRunLegacy(score){
  const r = getRecords();
  const prev = r[S.charId] || { score: 0, cigs: 0, dist: 0 };
  const isRec = score > prev.score;
  if (isRec) r[S.charId] = { score, cigs: S.cigs, dist: Math.floor(S.dist) };
  store.set('fed_records_v1', r);
  return { isRec, best: Math.max(score, prev.score) };
}

/* ---------------- spawn patterns ---------------- */
const PATTERNS = [
  {name:'A', lanes:[{t:'full'},{t:'low'},null]}, // left wall, right jump
  {name:'B', lanes:[{t:'low'},null,{t:'high'}]},
  {name:'C', lanes:[{t:'full'},{t:'full'},null]}, // double block one gap
  {name:'D', lanes:[{t:'low'},{t:'high'},{t:'low'}]},
  {name:'E', lanes:[null,null,{t:'full'}]},
  {name:'Risk', lanes:[{t:'full'},{t:'low'},{t:'low'}]},
];
const OBS_KINDS = { low: ['box', 'chair', 'bucket','bike'], high: ['laundry', 'cctv'], full: ['bin', 'cart', 'door', 'guardpop','carton','npc'] };
function pickObs(diff, forcedType){
  let type = forcedType;
  if(!type){
    const r=Math.random();
    if (diff < 0.25) type = r < 0.45 ? 'low' : r < 0.8 ? 'high' : 'full';
    else if (diff < 0.6) type = r < 0.38 ? 'low' : r < 0.68 ? 'high' : 'full';
    else type = r < 0.32 ? 'low' : r < 0.6 ? 'high' : 'full';
  }
  let kinds = OBS_KINDS[type];
  if (type === 'full' && (S.dist < 250 || Math.random() < 0.5)) kinds = ['bin', 'cart', 'door'];
  let kind = choice(kinds);
  if (kind === 'guardpop' && S.dist < 350) kind = 'door';
  // tonight mod: more obstacles
  if (getTonightEvent().mod.obstacle && Math.random()<0.25) kind=choice(['carton','npc','bin']);
  return { kind, type };
}
function spawnRow() {
  const diff = clamp(S.dist / 2500, 0, 1);
  // seed-based for challenge
  let rng = mulberry32(S.seed + S.rowId*9973);
  const usePattern = S.dist>300 && rng()<0.65;
  let lanes;
  if(usePattern){
    const pat = seededChoice(rng, PATTERNS);
    lanes = pat.lanes.map(p=> p? pickObs(diff, p.t): null);
  } else {
    lanes = [-1, 0, 1].map(() => rng() < (0.58+diff*0.14) ? pickObs(diff) : null);
  }
  // ensure event mods
  if(S.eventMul.obstacle>1){
    // force extra
    for(let i=0;i<3;i++) if(!lanes[i] && rng()<0.4) lanes[i]=pickObs(diff);
  }
  const types = lanes.map(l => l ? l.type : 'open');
  if (types.every(t => t === 'full')) {
    const i = randi(0, 2);
    lanes[i] = rng() < 0.5 ? { kind: choice(OBS_KINDS.low), type: 'low' } : null;
  }
  if (diff < 0.3) {
    let fulls = lanes.filter(l => l && l.type === 'full').length;
    for (let i = 0; i < 3 && fulls > 1; i++) if (lanes[i] && lanes[i].type === 'full') { lanes[i].type = 'low'; lanes[i].kind = choice(OBS_KINDS.low); fulls--; }
  }
  // ghost mode: ignore some full
  const char = charOf();
  const ghostActive = S.ability.active>0 && char.id==='farham';
  if(ghostActive){
    lanes = lanes.map(l=> l && l.type==='full' && rng()<0.6 ? null : l);
  }
  const z = S.nextRowZ;
  lanes.forEach((o, i) => { if (o) S.ents.push(getEnt('obs', i - 1, z, o.kind, o.type)); });
  // cigs
  const tonightCigMul = getTonightEvent().mod.cigs||1;
  const cigChance = 0.72 * tonightCigMul * (S.eventMul.cigBonus?1.3:1);
  if (rng() < cigChance) {
    const li = Math.floor(rng()*3);
    const o = lanes[li];
    const n = 4 + Math.floor(rng()*4); // 4-7
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
  // pattern bonus: if event shortcut, add cig line in middle
  if(S.event && S.event.id==='open_door' && rng()<0.6){
    const e=getEnt('cig',0,z+6,null,null); e.line=++S.lineSeq; S.lines[e.line]={total:1,got:0,missed:0,done:false}; S.ents.push(e);
  }
  const gap = clamp(S.speed * (1.05* (S.eventMul.obstacle>1?0.85:1)), 11, 30) + rand(2, 7);
  S.nextRowZ += gap;
  S.rowId++;
}
const entPool = [];
function getEnt(kind, lane, z, okind, otype) {
  const e = entPool.pop() || {};
  e.kind = kind; e.lane = lane; e.z = z; e.okind = okind; e.otype = otype;
  e.yOff = 0; e.dead = false; e.counted = false; e.line = 0; e.spin = rand(0, TAU);
  e.nearMissDone=false;
  return e;
}
function spawnPow() {
  const opts = ['boost', 'magnet', 'x2', 'high', 'ghost','slow'];
  if (!S.shield) opts.push('shield', 'shield');
  if (!S.extraLife) opts.push('second');
  // weight by difficulty
  const kind = choice(opts);
  const lane = randi(-1, 1);
  const z = S.dist + MAXZ - 4;
  for (const e of S.ents) if (e.kind === 'obs' && e.otype === 'full' && e.lane === lane && Math.abs(e.z - z) < 5) return;
  S.ents.push(getEnt('pow', lane, z, kind, null));
}

/* ---------------- input (ability + movement) ---------------- */
const queue = [];
function queueAction(a) { if (queue.length < 2) queue.push(a); }
let pDown = null, lastTouchAct = 0, lastTap=0;
canvas.addEventListener('pointerdown', e => {
  if (e.isPrimary === false) return;
  pDown = { x: e.clientX, y: e.clientY, id: e.pointerId, used: false, time: Date.now() };
  e.preventDefault();
});
canvas.addEventListener('pointermove', e => {
  if (!pDown || e.pointerId !== pDown.id || pDown.used) return;
  const dx = e.clientX - pDown.x, dy = e.clientY - pDown.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
  pDown.used = true;
  const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  if (now - lastTouchAct < 90) return;
  lastTouchAct = now;
  if (Math.abs(dx) > Math.abs(dy)) queueAction(dx > 0 ? 'R' : 'L');
  else queueAction(dy > 0 ? 'D' : 'U');
});
['pointerup', 'pointercancel'].forEach(ev => canvas.addEventListener(ev, e => {
  if(!pDown || e.pointerId!==pDown.id) { pDown=null; return; }
  if(!pDown.used){
    const dt = Date.now()-pDown.time;
    const dist = Math.hypot(e.clientX-pDown.x, e.clientY-pDown.y);
    if(dist<18 && dt<280){
      // tap -> ability if double tap, else lane? we treat single tap as jump
      const now=Date.now();
      if(now-lastTap<350){
        useAbility();
        lastTap=0;
      } else {
        lastTap=now;
        // single tap jump? We'll queue U after short delay to detect double
        setTimeout(()=>{
          if(lastTap===now) queueAction('U');
        },360);
      }
    }
  }
  pDown = null;
}));
window.addEventListener('keydown', e => {
  const k = e.key;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault();
  if (S.mode !== 'play' || S.paused) return;
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') queueAction('L');
  else if (k === 'ArrowRight' || k === 'd' || k === 'D') queueAction('R');
  else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') queueAction('U');
  else if (k === 'ArrowDown' || k === 's' || k === 'S') queueAction('D');
  else if (k === 'q' || k === 'Q' || k === 'e' || k === 'E') useAbility();
  else if (k === 'p' || k === 'P' || k === 'Escape') togglePause();
});
function useAbility(){
  if(S.mode!=='play' || S.paused) return;
  if(S.ability.cooldown>0 || S.ability.active>0) { toast('⏳ Ability در Cooldownه!'); return; }
  const ch=charOf();
  const ab=ch.ability;
  S.ability.active=ab.duration;
  S.ability.cooldown=ab.cooldown;
  S.ability.kind=ch.id;
  S.abilityUses++;
  AU.ability();
  // per-character effect
  if(ch.id==='parsa'){
    // handled in updatePlay speed mul
    burst(laneX(S.x,1), BASEY-CH*0.6, '#ff6d00', 16, 220);
    floatText(laneX(S.x,1), BASEY-CH, '🔥 ADRENALINE!', '#ff9e40');
    S.shake=Math.max(S.shake,0.35);
  } else if(ch.id==='mahyar'){
    S.pows.magnet=Math.max(S.pows.magnet, ab.duration);
    burst(laneX(S.x,1), BASEY-CH*0.6, '#e53935', 14, 200);
    floatText(laneX(S.x,1), BASEY-CH, '🧲 MAGNET!', '#ff8a80');
  } else if(ch.id==='arsham'){
    burst(laneX(S.x,1), BASEY-CH*0.6, '#ffd93d', 14, 200);
    floatText(laneX(S.x,1), BASEY-CH, '🎲 RISK MODE!', '#ffe9a8');
  } else if(ch.id==='mohsen'){
    S.shield=true; S.pows.shield=ab.duration;
    burst(laneX(S.x,1), BASEY-CH*0.6, '#4fc3f7', 16, 220);
    floatText(laneX(S.x,1), BASEY-CH, '🛡️ SHIELD!', '#8fd3ff');
  } else if(ch.id==='farham'){
    S.pows.ghost=ab.duration;
    burst(laneX(S.x,1), BASEY-CH*0.6, '#b388ff', 16, 220);
    floatText(laneX(S.x,1), BASEY-CH, '👻 GHOST!', '#cfc6ff');
  }
}

/* ---------------- particles / floats ---------------- */
function burst(x, y, col, n, spd) {
  if(!DB.settings.particles) return;
  for (let i = 0; i < n && S.parts.length < 260; i++)
    S.parts.push({ x, y, vx: rand(-spd, spd), vy: rand(-spd, spd * 0.4), life: rand(0.3, 0.7), max: 0.7, col, r: rand(2, 5) });
}
function dust(x, y) {
  if(!DB.settings.particles || S.parts.length >= 260) return;
  S.parts.push({ x: x + rand(-10, 10), y, vx: rand(-40, 40), vy: rand(-70, -20), life: rand(0.25, 0.45), max: 0.45, col: 'rgba(200,190,230,.5)', r: rand(2, 4) });
}
function floatText(x, y, txt, col) { if (S.floats.length < 14) S.floats.push({ x, y, txt, col, life: 1, vy:-50 }); }

/* ---------------- update ---------------- */
function update(dt) {
  if(S.slowMo>0) dt *= 0.35;
  if (S.mode === 'play') updatePlay(dt);
  else if (S.mode === 'catch') {
    S.catchT += dt;
    if(DB.settings.shake) S.shake = Math.max(S.shake, 0.4 * (1 - S.catchT));
    updateParts(dt);
    if (S.catchT > 1.15) showOver();
  }
}
function updatePlay(dt) {
  S.t += dt;
  S.eventT -= dt; if(S.event && S.eventT<=0){ S.event=null; S.eventMul={obstacle:1, police:1, speed:1, nearMul:1, scoreMul:1, cigBonus:0, shortcut:false, guard:1}; hideEventBanner(); }
  // random event trigger
  if(!S.event && S.t>12 && Math.random()<0.0018){
    triggerRandomEvent();
  }
  // rumor
  if(S.rumorT>0){ S.rumorT-=dt; if(S.rumorT<=0) hideRumor(); }
  else if(Math.random()<0.0007){ showRumor(choice(RUMORS)); S.rumorT=5; }
  // speed with difficulty + ability + tonight + event
  const base = Math.min(36, 13.5 + S.dist * 0.009 + S.difficulty*2.2);
  let speedMul=1;
  const ch=charOf();
  if(S.pows.boost>0) speedMul*=1.4;
  if(S.ability.active>0 && ch.id==='parsa') speedMul*=1.3;
  if(S.pows.slow>0) speedMul*=0.75;
  if(S.eventMul.speed) speedMul*=S.eventMul.speed;
  if(getTonightEvent().mod.police) {} // handled via danger
  // arsham passive? no speed
  // mohsen? no
  // farham? no
  // tonight rain mod
  if(getTonightEvent().id==='rain') speedMul*=0.96;
  S.speed = Math.min(42, base * speedMul);
  if (!isFinite(S.speed) || S.speed <= 0) S.speed = 13;
  S.dist += S.speed * dt;
  S.difficulty = clamp(S.dist/2500,0,1);
  // zone seen
  const zoneIdx = Math.floor(S.dist / ZONE_LEN) % ZONES.length;
  const zone = ZONES[zoneIdx];
  if(S.lastZone!==zone.id){ S.zonesSeen.add(zone.id); S.lastZone=zone.id; }

  for (const k in S.pows) S.pows[k] = Math.max(0, S.pows[k] - dt);
  S.inv = Math.max(0, S.inv - dt);
  S.slideT = Math.max(0, S.slideT - dt);
  S.landT = Math.max(0, S.landT - dt);
  S.jumpBuf = Math.max(0, S.jumpBuf - dt);
  if(DB.settings.shake) S.shake = Math.max(0, S.shake - dt * 1.6); else S.shake=0;
  S.whistleCd -= dt;
  S.comboTimer = Math.max(0, S.comboTimer - dt);
  if(S.comboTimer<=0 && S.combo>0){
    S.combo = Math.max(0, S.combo- dt*6); // decay
    if(S.combo<1) S.combo=0;
  }
  S.slowMo = Math.max(0, S.slowMo - dt);
  // ability timers
  if(S.ability.active>0){ S.ability.active-=dt; if(S.ability.active<=0){ S.ability.active=0; if(ch.id==='mohsen'){ S.shield=false; } } }
  if(S.ability.cooldown>0){ S.ability.cooldown-=dt; if(S.ability.cooldown<0) S.ability.cooldown=0; }

  let n = 0;
  while (queue.length && n < 2) {
    const a = queue.shift(); n++;
    if (a === 'L') { if (S.targetLane > -1) { S.targetLane--; AU.lane(); comboAction('dodge'); } }
    else if (a === 'R') { if (S.targetLane < 1) { S.targetLane++; AU.lane(); comboAction('dodge'); } }
    else if (a === 'U') { if (!S.airborne) doJump(); else S.jumpBuf = 0.18; }
    else if (a === 'D') {
      if (S.airborne) S.vy = -14;
      else if (S.slideT <= 0) { S.slideT = 0.72; AU.slide(); dust(laneX(S.x, 1), BASEY); comboAction('dodge'); }
    }
  }
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

  const magnet = S.pows.magnet > 0 || (S.ability.active>0 && ch.id==='mahyar');
  const magnetRadius = ch.id==='mahyar' ? 1.6 : 1.3;
  for (let i = S.ents.length - 1; i >= 0; i--) {
    const e = S.ents[i];
    const rel = e.z - S.dist;
    if (rel < -3 || e.dead) {
      if (e.kind === 'cig' && !e.counted) cigMissed(e);
      // near miss check on removal
      if(e.kind==='obs' && !e.dead && !e.nearMissDone){
        // if obstacle passed without hit and was close, it's near miss candidate already handled via proximity
      }
      entPool.push(e); S.ents.splice(i, 1); continue;
    }
    if (e.kind === 'cig') {
      if (!e.counted && rel < -0.7) { e.counted = true; cigMissed(e); }
      if (magnet && rel < 16 && rel > -1 && Math.abs(e.lane - S.x) <= magnetRadius) {
        e.lane += (S.x - e.lane) * Math.min(1, dt * 9);
        e.yOff += (0 - e.yOff) * Math.min(1, dt * 9);
      }
      if (!e.dead && rel < 0.7 && rel > -0.5 && Math.abs(e.lane - S.x) < 0.5) {
        e.dead = true; e.counted = true;
        S.cigs++;
        const mul = S.pows.x2 > 0 ? 2 : 1;
        let points = 25 * mul;
        // mahyar passive? cigScore mul?
        S.cigScore += points;
        // combo
        S.combo = S.combo + 1;
        S.comboTimer = 1.8;
        if(S.combo>S.bestCombo) S.bestCombo=Math.floor(S.combo);
        S.lastCollect = S.t;
        AU.collect(Math.floor(S.combo));
        if(S.combo>4 && S.combo%5===0){
          AU.comboUp(Math.floor(S.combo/5));
          floatText(laneX(S.x,1), BASEY-CH*1.2, '🔥 COMBO x'+Math.floor(S.combo)+'!', '#ffd93d');
          if(DB.settings.shake) S.shake=Math.max(S.shake, 0.12+ Math.min(0.2, S.combo*0.01));
          burst(laneX(S.x,1), BASEY-CH*0.6, '#ff8c42', 8, 160);
          showComboBig('COMBO x'+Math.floor(S.combo));
        }
        const px = laneX(e.lane, 1), py = BASEY - CH * 0.5;
        burst(px, py, '#ffd93d', 6, 160);
        if (mul === 2) floatText(px, py - 30, '+۵۰', '#ffe9a8');
        cigGot(e);
        checkEasterEgg('cig');
      }
    } else if (e.kind === 'pow') {
      if (rel < 0.8 && rel > -0.5 && Math.abs(e.lane - S.x) < 0.55) { e.dead = true; applyPow(e.okind); }
    } else if (e.kind === 'obs') {
      // near miss detection: close but not hit
      const laneDiff = Math.abs(e.lane - S.x);
      const closeLane = laneDiff < 0.62 && laneDiff > 0.42;
      const sameLane = laneDiff < 0.48;
      const isDodged = (e.otype === 'low' && S.jumpY > 0.45) || (e.otype === 'high' && S.slideT > 0) || closeLane;
      // near miss: obstacle just passed (rel in [-0.6,0.6]) and player dodged by narrow margin
      if(!e.nearMissDone && rel < 0.6 && rel > -0.6 && isDodged && !e.dead){
        // only if not hit
        const isNear = (sameLane && ( (e.otype==='low' && S.jumpY>0.45 && S.jumpY<0.9) || (e.otype==='high' && S.slideT>0) )) || closeLane;
        if(isNear){
          e.nearMissDone=true;
          triggerNearMiss(e);
        }
      }
      if (S.mode === 'play' && rel < 0.55 && rel > -0.45 && Math.abs(e.lane - S.x) < 0.5 && S.inv <= 0) {
        const safe =
          (e.otype === 'low' && S.jumpY > 0.45) ||
          (e.otype === 'high' && S.slideT > 0 && S.jumpY < 0.2) ||
          (S.pows.ghost>0) ||
          (S.ability.active>0 && ch.id==='farham');
        if (!safe) { e.dead = true; hitObstacle(e); }
        else if(!e.nearMissDone && sameLane){
          // successful dodge in same lane = near miss bonus if tight
          if(!e.nearMissDone && (e.otype==='low' || e.otype==='high' || e.otype==='full')){
             // treat as near miss for full obstacles dodged by lane change already handled via closeLane
          }
        }
      }
    }
  }

  // calculate danger
  let dangerBase = 0.18 + Math.min(0.55, S.dist / 2600) + 0.06 * Math.sin(S.t * 0.8);
  if(ch.id==='farham') dangerBase *= 0.85; // passive
  if(ch.id==='mohsen' && S.dist%90<1) {} // no
  if(S.eventMul.police) dangerBase *= S.eventMul.police;
  if(getTonightEvent().mod.police) dangerBase *= (1+getTonightEvent().mod.police);
  if(S.pows.ghost>0 || (S.ability.active>0 && ch.id==='farham')) dangerBase *= 0.9;
  S.danger = clamp(dangerBase, 0, 0.95);
  if (S.danger > 0.72 && S.whistleCd <= 0) { S.whistleCd = 6; AU.whistle(); if(DB.settings.shake) S.shake = Math.max(S.shake, 0.22); }

  if (S.pows.boost > 0 && DB.settings.particles && S.parts.length < 260)
    S.parts.push({ x: laneX(S.x, 1) + rand(-8, 8), y: BASEY - rand(0, CH * 0.4), vx: rand(-30, 30), vy: rand(60, 160), life: 0.4, max: 0.4, col: choice(['#ff6d00', '#ffd93d', '#ff9e40']), r: rand(3, 7) });
  // ghost trail
  if(S.showGhost && S.ghostData){
    // simple ghost playback: ghost x is recorded inputs interpolated by dist
  }
  updateParts(dt);
  // record ghost
  if(S.ghostTrail.length<600){
    S.ghostTrail.push({ dist: S.dist, x: S.x, jumpY:S.jumpY });
  }
}
function comboAction(type){
  S.combo += 0.6;
  S.comboTimer=1.8;
  if(S.combo>S.bestCombo) S.bestCombo=Math.floor(S.combo);
}
function triggerNearMiss(e){
  const ch=charOf();
  let points = 50;
  if(ch.id==='arsham') points = Math.floor(points*1.5);
  if(S.eventMul.nearMul) points=Math.floor(points*S.eventMul.nearMul);
  S.nearMiss++;
  S.nearMissScore += points * (S.pows.x2>0?2:1);
  S.combo += 1.5;
  S.comboTimer=2.0;
  if(S.combo>S.bestCombo) S.bestCombo=Math.floor(S.combo);
  AU.nearMiss();
  const px=laneX(e.lane,1), py=BASEY-CH*0.6;
  floatText(px, py-30, '⚡ NEAR MISS +'+faNum(points), '#7ef2c0');
  burst(px, py, '#7ef2c0', 10, 200);
  S.slowMo=0.13;
  if(DB.settings.shake) S.shake=Math.max(S.shake,0.18);
  if(DB.settings.particles) S.parts.push({x:px,y:py,vx:0,vy:-80,life:0.3,max:0.3,col:'rgba(126,242,192,.9)',r:6});
  checkEasterEgg('nearMiss');
}
function triggerRandomEvent(){
  const ev = choice(INGAME_EVENTS);
  S.event = ev;
  S.eventT = ev.dur;
  ev.apply(S);
  showEventBanner(ev.title+' — '+ev.desc);
  floatText(CX, BASEY-CH*1.3, ev.title, '#ff8c42');
  burst(CX, BASEY-CH*0.6, '#ff8c42', 12, 220);
  AU.whistle();
}
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
    S.combo+=2;
    S.comboTimer=2.2;
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
    f.life -= dt * 1.1; f.y += f.vy * dt;
    f.vy += 80*dt;
    if (f.life <= 0) S.floats.splice(i, 1);
  }
}
function doJump() {
  const ch=charOf();
  S.airborne = true; S.slideT = 0;
  let power = 5.6 * (S.pows.high > 0 ? 1.32 : 1);
  if(ch.id==='parsa' && S.ability.active>0) power*=1.08;
  S.vy = power;
  AU.jump();
}
function applyPow(kind) {
  AU.power();
  S.powsCollected++;
  const px = laneX(S.x, 1), py = BASEY - CH * 0.7;
  if (kind === 'shield') { S.shield = true; floatText(px, py, 'سپر! 🛡️', '#8fd3ff'); S.pows.shield=4; }
  else if(kind==='second'){ S.extraLife=true; floatText(px, py, '❤️ Second Chance!', '#ff7eb3'); }
  else if(kind==='ghost'){ S.pows.ghost=4; floatText(px, py, '👻 Ghost!', '#b388ff'); }
  else if(kind==='slow'){ S.pows.slow=5; floatText(px, py, '⏱️ Slow-Mo!', '#4dd0e1');
  } else {
    S.pows[kind] = kind === 'boost' ? 4 : kind === 'magnet' ? 7 : kind==='x2'?6: kind==='ghost'?4: kind==='slow'?5:6;
    const names = { boost: 'بوست سرعت! 🔥', magnet: 'آهنربا! 🧲', x2: 'امتیاز ×۲! ✨', high: 'پرش بلند! 👟', ghost:'روح! 👻', slow:'کندی زمان! ⏱️' };
    floatText(px, py, names[kind]||kind, '#aef3ff');
  }
  burst(px, py, '#aef3ff', 12, 220);
}
function hitObstacle(ob) {
  const ch=charOf();
  if (S.shield) {
    S.shield = false; S.inv = 1.3;
    AU.shieldPop();
    burst(laneX(S.x, 1), BASEY - CH * 0.6, '#4fc3f7', 16, 260);
    floatText(laneX(S.x, 1), BASEY - CH, 'نجات یافتی! 🛡️', '#8fd3ff');
    if(DB.settings.shake) S.shake = Math.max(S.shake, 0.35);
    DB.stats.shieldSaves=(DB.stats.shieldSaves||0)+1;
    saveDB();
    // arsham risk penalty?
    if(S.ability.active>0 && ch.id==='arsham'){
      S.cigScore = Math.max(0, S.cigScore-30);
      floatText(laneX(S.x,1), BASEY-CH*1.1, '-30 ریسک!', '#ff5e5e');
    }
    return;
  }
  if(S.extraLife){
    S.extraLife=false; S.inv=1.5;
    AU.shieldPop();
    burst(laneX(S.x,1), BASEY-CH*0.6, '#ff7eb3', 18, 260);
    floatText(laneX(S.x,1), BASEY-CH, '💖 شانس دوباره!', '#ff8c42');
    if(DB.settings.shake) S.shake=Math.max(S.shake,0.4);
    return;
  }
  // mohsen passive: one free hit per 90m? simplified: if char mohsen and not hit recently
  if(ch.id==='mohsen' && !S._mohsenHit){
    S._mohsenHit=true;
    setTimeout(()=>{ if(S) S._mohsenHit=false; }, 9000); // 9 sec ~ 90m
    S.inv=1.0;
    AU.shieldPop();
    burst(laneX(S.x,1), BASEY-CH*0.6, '#ffd93d', 14, 220);
    floatText(laneX(S.x,1), BASEY-CH, 'تانک! 💪', '#ffd93d');
    return;
  }
  S.combo = Math.max(0, S.combo-3);
  S.mode = 'catch'; S.catchT = 0;
  AU.crash(); setTimeout(() => AU.whistle(), 250);
  if(DB.settings.shake) S.shake = 0.7;
  burst(laneX(S.x, 1), BASEY - CH * 0.5, '#ff8a80', 20, 300);
  checkEasterEgg('hit');
}

/* ---------------- easter eggs ---------------- */
let easterFlags={ taps:0, nearStreak:0 };
function checkEasterEgg(type){
  if(type==='cig'){
    easterFlags.taps++;
    if(easterFlags.taps===10){
      floatText(CX, BASEY-CH*1.4, '🥚 راز: «سیگار پشت سطل!» +100', '#ffd93d');
      S.cigScore+=100;
    }
  }
  if(type==='nearMiss'){
    easterFlags.nearStreak++;
    if(easterFlags.nearStreak>=5){
      floatText(CX, BASEY-CH*1.4, '🥚 ریسک‌باز حرفه‌ای! 👑', '#ffd93d');
      S.cigScore+=150;
      easterFlags.nearStreak=0;
    }
  }
  if(type==='hit') easterFlags.nearStreak=0;
}

/* ---------------- render ---------------- */
const proj = z => CAMD / (CAMD + z);
const gy = s => HOR + (BASEY - HOR) * s;
const laneX = (l, s) => CX + l * LANEW * s;

function zoneBlend() {
  const zi = Math.floor(S.dist / ZONE_LEN) % ZONES.length;
  const ni = (zi + 1) % ZONES.length;
  const f = S.dist % ZONE_LEN;
  const t = f > ZONE_LEN - 60 ? (f - (ZONE_LEN - 60)) / 60 : 0;
  return [ZONES[zi], ZONES[ni], t];
}
function getDayNightFactor(){
  // cycle over 120 seconds: dawn(0)->day(0.25)->dusk(0.5)->night(0.75)->midnight(1)
  const cycle = (S.t % 140)/140;
  return cycle;
}
function draw() {
  const [za, zb, zt] = zoneBlend();
  const dn = getDayNightFactor();
  // dayNight overlay tint
  let nightAlpha = 0;
  if(dn>0.45 && dn<0.85) nightAlpha = Math.sin((dn-0.45)/0.4*Math.PI)*0.35;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (S.shake > 0) ctx.translate(rand(-1, 1) * S.shake * 10, rand(-1, 1) * S.shake * 8);

  const par = -S.x * 12;
  // sky with dayNight lerp
  ctx.fillStyle = '#070618'; ctx.fillRect(0, 0, W, HOR + 60);
  if (skyCan){
    ctx.globalAlpha = 1 - nightAlpha*0.7;
    ctx.drawImage(skyCan, par * 0.4, 0);
    ctx.globalAlpha =1;
    if(nightAlpha>0){
      ctx.fillStyle='rgba(5,10,40,'+ (nightAlpha*0.6)+')';
      ctx.fillRect(0,0,W,HOR+60);
    }
  }
  if (CLOUD) {
    for (let i = 0; i < 3; i++) {
      const cw = W * 0.3;
      const cx2 = ((S.t * (4 + i * 2) + i * 331) % (W + cw * 2)) - cw;
      ctx.globalAlpha = (0.5 + i * 0.15)*(1-nightAlpha);
      ctx.drawImage(CLOUD, cx2 + par * 0.4, HOR * (0.12 + i * 0.14), cw, cw * (CLOUD.height / CLOUD.width));
    }
    ctx.globalAlpha = 1;
  }
  // city
  ctx.fillStyle = '#241c4e'; ctx.fillRect(0, HOR - (cityFar ? cityFar.height : 0), W, (cityFar ? cityFar.height : 0) + 4);
  if (cityFar) ctx.drawImage(cityFar, par * 0.7, HOR - cityFar.height + 2);
  if (cityNear) ctx.drawImage(cityNear, par * 1.2, HOR - cityNear.height + 6);

  // ground
  const gcol = zt > 0 ? mix(za.ground, zb.ground, zt) : za.ground;
  ctx.fillStyle = gcol;
  ctx.fillRect(0, HOR, W, H - HOR);
  if(nightAlpha>0.1){
    ctx.fillStyle='rgba(10,15,40,'+ (nightAlpha*0.35)+')';
    ctx.fillRect(0,HOR,W,H-HOR);
  }

  const sFar = proj(MAXZ), sNear = 1.35;
  const rw = 1.62;
  ctx.fillStyle = zt > 0 ? mix(za.road, zb.road, zt) : za.road;
  ctx.beginPath();
  ctx.moveTo(laneX(-rw, sFar), gy(sFar));
  ctx.lineTo(laneX(rw, sFar), gy(sFar));
  ctx.lineTo(laneX(rw, sNear), gy(sNear));
  ctx.lineTo(laneX(-rw, sNear), gy(sNear));
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = nightAlpha>0.2 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.05)';
  ctx.beginPath();
  ctx.moveTo(laneX(-0.4, sFar), gy(sFar));
  ctx.lineTo(laneX(0.4, sFar), gy(sFar));
  ctx.lineTo(laneX(0.4, sNear), gy(sNear));
  ctx.lineTo(laneX(-0.4, sNear), gy(sNear));
  ctx.closePath(); ctx.fill();
  // curbs
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
  // walls
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
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(laneX(sgn * 2.2, sFar), gy(sFar));
    ctx.lineTo(laneX(sgn * 2.2, sNear), gy(sNear));
    ctx.lineTo(laneX(sgn * 2.02, sNear), gy(sNear));
    ctx.lineTo(laneX(sgn * 2.02, sFar), gy(sFar));
    ctx.closePath(); ctx.fill();
  }
  // ground bands
  ctx.fillStyle = 'rgba(0,0,0,.08)';
  const bstep = 9, boff = S.dist % bstep;
  for (let z = MAXZ - ((MAXZ + boff) % bstep); z > 0; z -= bstep) {
    const s2 = proj(z);
    ctx.fillRect(laneX(-1.62, s2), gy(s2), LANEW * 3.24 * s2, Math.max(1.5, 9 * s2 * s2));
  }
  // lane lines
  ctx.fillStyle = 'rgba(255,235,150,.45)';
  const dash = 5, off = S.dist % dash;
  for (let z = MAXZ - ((MAXZ + off) % dash); z > -1; z -= dash) {
    const s = proj(Math.max(z, 0.01));
    for (const b of [-0.5, 0.5]) {
      const wq = Math.max(2, LANEW * 0.06 * s);
      ctx.fillRect(laneX(b, s) - wq / 2, gy(s) - 2 * s, wq, Math.max(3, 14 * s));
    }
  }
  // props
  const propStep = 16, poff = S.dist % propStep;
  for (let z = MAXZ - poff; z > 0; z -= propStep) {
    const az2 = S.dist + z;
    const zn = ZONES[Math.floor(az2 / ZONE_LEN) % ZONES.length];
    const s = proj(z);
    const y = gy(s);
    ctx.globalAlpha = clamp(1 - z / MAXZ * 0.6, 0.4, 1)*(1- S.darkness*0.5);
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

  // entities sorted far to near
  const list = S.ents.slice().sort((a, b) => b.z - a.z);
  for (const e of list) { const rel = e.z - S.dist; if (rel > 0) drawEnt(e, rel); }
  if (S.mode !== 'idle') drawPlayer();
  // ghost
  if(S.showGhost && S.ghostData){
    // draw ghost as translucent player at ghost position
    const g = S.ghostData;
    // find ghost position by dist interpolation
    const idx = g.findIndex(p=> p.dist >= S.dist);
    if(idx>0){
      const a=g[idx-1], b=g[idx];
      const t = (S.dist - a.dist)/Math.max(0.001, b.dist - a.dist);
      const gx = lerp(a.x,b.x,t), gyv= lerp(a.jumpY,b.jumpY,t);
      ctx.globalAlpha=0.35;
      const ch=CHARS.find(c=>c.id===S.charId) || CHARS[0];
      // simple ghost circle
      ctx.fillStyle='rgba(180,180,255,.5)';
      const sx=proj(0), x=laneX(gx,sx), y=BASEY - gyv*CH*0.85;
      ctx.beginPath(); ctx.arc(x,y-CH*0.3, CH*0.22,0,TAU); ctx.fill();
      ctx.globalAlpha=1;
    }
  }
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
  if (S.speed > 24 || S.pows.boost > 0 || S.ability.active>0) {
    ctx.strokeStyle = S.ability.active>0 ? 'rgba(255,217,61,.18)' : 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + S.t * 2;
      const r1 = Math.min(W, H) * 0.42, r2 = r1 + 40 + (i % 3) * 30;
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(a) * r1, H * 0.5 + Math.sin(a) * r1);
      ctx.lineTo(CX + Math.cos(a) * r2, H * 0.5 + Math.sin(a) * r2);
      ctx.stroke();
    }
  }
  if (S.mode === 'catch') {
    ctx.fillStyle = Math.floor(S.catchT * 8) % 2 ? 'rgba(255,60,60,.14)' : 'rgba(70,130,255,.14)';
    ctx.fillRect(0, 0, W, H);
  }
  // blackout darkness
  if(S.darkness>0){
    ctx.fillStyle='rgba(0,0,0,'+ (S.darkness*0.55)+')';
    ctx.fillRect(0,0,W,H);
    // flashlight cone
    const gx=laneX(S.x,1), gy2=BASEY-CH*0.4;
    const grad=ctx.createRadialGradient(gx,gy2,20,gx,gy2,220);
    grad.addColorStop(0,'rgba(255,244,180,.25)');
    grad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=grad;
    ctx.beginPath(); ctx.arc(gx,gy2,220,0,TAU); ctx.fill();
  }
  // slowMo vignette
  if(S.slowMo>0){
    ctx.strokeStyle='rgba(77,208,225,'+ (S.slowMo*2)+')';
    ctx.lineWidth=8;
    ctx.strokeRect(0,0,W,H);
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
  } else if (kind==='cafeteria'){
    const w=h*(PROP_TABLE.width/PROP_TABLE.height);
    ctx.drawImage(PROP_TABLE, x-w/2, y-h*0.6, w, w*(PROP_TABLE.height/PROP_TABLE.width));
    if(Math.floor(seed/16)%3===0){
      ctx.fillStyle='rgba(255,213,79,.9)'; circle(ctx, x, y-h*0.7, 5*s);
    }
  } else if(kind==='parking'){
    const w=h*(PROP_CAR.width/PROP_CAR.height);
    ctx.drawImage(PROP_CAR, x-w/2, y-h*0.5, w, w*(PROP_CAR.height/PROP_CAR.width));
  } else if(kind==='night'){
    // same as yard but darker
    const w2=h*(PROP_TREE.width/PROP_TREE.height)*0.9;
    ctx.globalAlpha*=0.7;
    ctx.drawImage(PROP_TREE, x-w2/2, y-h*0.9, w2, w2*(PROP_TREE.height/PROP_TREE.width));
    ctx.globalAlpha/=0.7;
    if(Math.floor(seed/12)%2===0){
      ctx.fillStyle='#1a237e'; rr(ctx, x-6*s, y-h, 12*s, 22*s, 3); ctx.fill();
      ctx.fillStyle='#fff9c4'; circle(ctx, x, y-h-6*s, 4*s);
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
    const fade = clamp(1 - rel / MAXZ * 0.65, 0.35, 1);
    ctx.globalAlpha = fade*(1- S.darkness*0.3);
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    ctx.beginPath(); ctx.ellipse(x, y, w * 0.45, Math.max(2, 8 * s), 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.15)';
    ctx.beginPath(); ctx.ellipse(x, y, w * 0.6, Math.max(3, 11 * s), 0, 0, TAU); ctx.fill();
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
    const fade = clamp(1 - rel / MAXZ * 0.7, 0.3, 1)*(1- S.darkness*0.3);
    const pulse = 0.2 + 0.1 * Math.sin(S.t * 6 + e.spin);
    if (GLOW) { ctx.globalAlpha = pulse * fade; ctx.drawImage(GLOW, x - w, yy - w, w * 2, w * 2); }
    ctx.globalAlpha = fade;
    ctx.save(); ctx.translate(x, yy);
    ctx.rotate(Math.sin(S.t * 3 + e.spin) * 0.18);
    const sx = 0.55 + 0.45 * Math.abs(Math.sin(S.t * 4 + e.spin));
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
    for (let k = 0; k < 6; k++) {
      const a0 = S.t * 2.4 + k * TAU / 6;
      ctx.beginPath(); ctx.arc(x, yy, h * 0.62, a0, a0 + 0.6); ctx.stroke();
    }
    ctx.drawImage(img, x - h / 2, yy - h / 2, h, h);
    ctx.globalAlpha = 1;
  }
}

/* ---------------- character ---------------- */
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
  g.fillStyle = 'rgba(0,0,0,.34)';
  g.beginPath(); g.ellipse(0, 2, hgt * 0.3 * (1 - (air ? 0.4 : 0)), hgt * 0.06, 0, 0, TAU); g.fill();
  const st = o.stretch || 0;
  if (st) g.scale(1 - st * 0.5, 1 + st);
  const legSw = air ? 0.7 : Math.sin(phase);
  const legSw2 = air ? -0.5 : Math.sin(phase + Math.PI);
  const pants = ch.pants || '#2b2b33';
  g.strokeStyle = pants; g.lineCap = 'round'; g.lineWidth = hgt * 0.1;
  const hipY = -bh * 0.9;
  const kneeL = hipY + hgt * 0.15, footL = kneeL + hgt * 0.15 - Math.max(0, legSw) * hgt * 0.14;
  const kneeR = hipY + hgt * 0.15, footR = kneeR + hgt * 0.15 - Math.max(0, legSw2) * hgt * 0.14;
  g.beginPath(); g.moveTo(-bodyW * 0.22, hipY); g.quadraticCurveTo(-bodyW * 0.3, kneeL, -bodyW * 0.26 + legSw * hgt * 0.05, air ? hipY + hgt * 0.14 : footL); g.stroke();
  g.beginPath(); g.moveTo(bodyW * 0.22, hipY); g.quadraticCurveTo(bodyW * 0.3, kneeR, bodyW * 0.26 + legSw2 * hgt * 0.05, air ? hipY + hgt * 0.14 : footR); g.stroke();
  g.fillStyle = '#f5f5f5';
  circle(g, -bodyW * 0.26 + legSw * hgt * 0.05, (air ? hipY + hgt * 0.14 : footL) + hgt * 0.02, hgt * 0.06);
  circle(g, bodyW * 0.26 + legSw2 * hgt * 0.05, (air ? hipY + hgt * 0.14 : footR) + hgt * 0.02, hgt * 0.06);
  g.fillStyle = ch.shoe || '#e74c3c';
  g.beginPath(); g.ellipse(-bodyW * 0.26 + legSw * hgt * 0.05, (air ? hipY + hgt * 0.14 : footL) + hgt * 0.045, hgt * 0.06, hgt * 0.028, 0, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(bodyW * 0.26 + legSw2 * hgt * 0.05, (air ? hipY + hgt * 0.14 : footR) + hgt * 0.045, hgt * 0.06, hgt * 0.028, 0, 0, TAU); g.fill();
  const hg = g.createLinearGradient(-bodyW / 2, 0, bodyW / 2, 0);
  hg.addColorStop(0, tint(ch.hoodie, 0.12)); hg.addColorStop(0.55, ch.hoodie); hg.addColorStop(1, shade(ch.hoodie, 0.22));
  g.fillStyle = hg;
  rr(g, -bodyW / 2, -bh - bob, bodyW, bh, bodyW * 0.35); g.fill();
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
    g.fillStyle = ch.hoodDark; rr(g, -bodyW * 0.28, -bh * 0.42 - bob, bodyW * 0.56, bh * 0.3, 6); g.fill();
    if (ch.chain) {
      g.strokeStyle = '#cfd8dc'; g.lineWidth = hgt * 0.02; g.lineCap = 'round';
      g.beginPath(); g.arc(0, -bh - bob + bodyH * 0.06, bodyW * 0.3, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
    }
  }
  if (ch.lanyard) {
    g.strokeStyle = '#2f6fd0'; g.lineWidth = hgt * 0.035; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-bodyW * 0.32, -bh - bob + bodyH * 0.08); g.lineTo(0, -bh * 0.3 - bob); g.stroke();
    g.beginPath(); g.moveTo(bodyW * 0.32, -bh - bob + bodyH * 0.08); g.lineTo(0, -bh * 0.3 - bob); g.stroke();
    g.fillStyle = '#dfe6ee'; rr(g, -hgt * 0.07, -bh * 0.32 - bob, hgt * 0.14, hgt * 0.18, 3); g.fill();
    g.fillStyle = '#8a94a2'; rr(g, -hgt * 0.045, -bh * 0.32 - bob + hgt * 0.1, hgt * 0.09, hgt * 0.05, 2); g.fill();
  }
  if (ch.scarf && !o.idle) {
    g.fillStyle = ch.scarf;
    g.beginPath();
    g.moveTo(-bodyW * 0.3, -bh - bob);
    g.quadraticCurveTo(-bodyW * 0.7, -bh * 0.6 + Math.sin(phase) * 4, -bodyW * 0.85, -bh * 0.3 + Math.sin(phase * 1.3) * 6);
    g.lineTo(-bodyW * 0.6, -bh * 0.25);
    g.quadraticCurveTo(-bodyW * 0.5, -bh * 0.6, -bodyW * 0.2, -bh - bob + 6);
    g.closePath(); g.fill();
  }
  const armSw = air ? -0.8 : Math.sin(phase + Math.PI);
  const armSw2 = air ? -0.8 : Math.sin(phase);
  g.strokeStyle = ch.hoodDark; g.lineWidth = hgt * 0.085; g.lineCap = 'round';
  const shY = -bh * 0.85 - bob;
  g.beginPath(); g.moveTo(-bodyW * 0.5, shY); g.quadraticCurveTo(-bodyW * 0.68, shY + hgt * 0.1, -bodyW * 0.6, shY + hgt * 0.16 + armSw * hgt * 0.1); g.stroke();
  g.beginPath(); g.moveTo(bodyW * 0.5, shY); g.quadraticCurveTo(bodyW * 0.68, shY + hgt * 0.1, bodyW * 0.6, shY + hgt * 0.16 + armSw2 * hgt * 0.1); g.stroke();
  g.fillStyle = ch.skin;
  circle(g, -bodyW * 0.6, shY + hgt * 0.16 + armSw * hgt * 0.1, hgt * 0.05);
  circle(g, bodyW * 0.6, shY + hgt * 0.16 + armSw2 * hgt * 0.1, hgt * 0.05);
  if (ch.watch) {
    g.fillStyle = '#22262e'; circle(g, -bodyW * 0.6, shY + hgt * 0.2 + armSw * hgt * 0.1, hgt * 0.035);
    g.fillStyle = '#ffd93d'; circle(g, -bodyW * 0.6, shY + hgt * 0.2 + armSw * hgt * 0.1, hgt * 0.018);
  }
  const tilt = (o.tilt || 0) + Math.sin(phase * 0.5) * 0.03;
  g.save();
  g.translate(0, -bh - headS * 0.4 - bob + Math.sin(phase * 2) * hgt * 0.012);
  g.rotate(tilt);
  const headImg = ch._heads ? ch._heads[head || 'norm'] : ch._head;
  g.drawImage(headImg, -headS / 2, -headS / 2, headS, headS);
  g.restore();
  if (o.shield || S.shield) {
    g.strokeStyle = 'rgba(79,195,247,.85)'; g.lineWidth = 3;
    g.fillStyle = 'rgba(79,195,247,.15)';
    g.beginPath(); g.arc(0, -hgt * 0.5, hgt * 0.62, 0, TAU); g.fill(); g.stroke();
    // ability aura
    if(S.ability.active>0){
      g.strokeStyle='rgba(255,217,61,.6)'; g.lineWidth=2;
      g.setLineDash([6,6]);
      g.beginPath(); g.arc(0,-hgt*0.5,hgt*0.68,0,TAU); g.stroke();
      g.setLineDash([]);
    }
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
  // ghost effect
  if(S.pows.ghost>0 || (S.ability.active>0 && ch.id==='farham')){
    ctx.globalAlpha=0.6;
  }
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
  ctx.globalAlpha=1;
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
function updateHud() {
  if (S.mode !== 'play' && S.mode !== 'catch') return;
  const key = S.cigs + '|' + Math.floor(S.dist) + '|' + finalScore() + '|' + Math.floor(S.combo) + '|' + DB.xp.level;
  if (key !== S.lastHud) {
    S.lastHud = key;
    el.cigs.textContent = faNum(S.cigs);
    el.dist.textContent = faNum(Math.floor(S.dist));
    el.score.textContent = faNum(finalScore());
    el.level.textContent = faNum(DB.xp.level);
    el.levelBox.classList.remove('hidden');
    if(S.combo>=2){
      el.comboBox.classList.remove('hidden');
      el.combo.textContent = 'x'+faNum(Math.floor(S.combo));
      el.comboBox.style.background = S.combo>=10 ? 'linear-gradient(135deg,rgba(255,60,60,.9),rgba(255,140,0,.9))' : 'linear-gradient(135deg,rgba(255,140,0,.85),rgba(255,200,0,.85))';
    } else {
      el.comboBox.classList.add('hidden');
    }
  }
  const di = Math.round(S.danger * 100);
  if (di !== S.lastDangerInt) { S.lastDangerInt = di; el.dangerFill.style.width = di + '%'; if(di>75) el.dangerFill.classList.add('high'); else el.dangerFill.classList.remove('high'); }
  // ability
  const ch=charOf();
  el.abilityBtn.classList.remove('hidden');
  el.abIcon.textContent = ch.ability.icon;
  if(S.ability.active>0){
    el.abLabel.textContent = faNum(S.ability.active.toFixed(1))+'ث';
    el.abilityBtn.classList.add('ready');
    el.abilityBtn.classList.remove('cooldown');
    el.abProg.classList.remove('hidden');
    el.abFill.style.width = (S.ability.active/ch.ability.duration*100)+'%';
  } else if(S.ability.cooldown>0){
    el.abLabel.textContent = '⏳ '+faNum(S.ability.cooldown.toFixed(1));
    el.abilityBtn.classList.add('cooldown');
    el.abilityBtn.classList.remove('ready');
    el.abProg.classList.remove('hidden');
    el.abFill.style.width = ( (ch.ability.cooldown - S.ability.cooldown)/ch.ability.cooldown*100)+'%';
    el.abFill.style.background='#ff5e5e';
  } else {
    el.abLabel.textContent = 'READY';
    el.abilityBtn.classList.add('ready');
    el.abilityBtn.classList.remove('cooldown');
    el.abProg.classList.add('hidden');
    el.abFill.style.background='#5df08a';
  }
  let chips = '';
  if (S.pows.boost > 0) chips += powChip('🔥', S.pows.boost);
  if (S.pows.magnet > 0) chips += powChip('🧲', S.pows.magnet);
  if (S.pows.x2 > 0) chips += powChip('✨', S.pows.x2);
  if (S.pows.high > 0) chips += powChip('👟', S.pows.high);
  if (S.pows.ghost > 0) chips += powChip('👻', S.pows.ghost);
  if (S.pows.slow > 0) chips += powChip('⏱️', S.pows.slow);
  if (S.shield) chips += powChip('🛡️', -1);
  if (S.extraLife) chips += powChip('❤️', -1);
  if (S.perfectStreak > 1) chips += powChip('😎پرفکت×', S.perfectStreak, true);
  if (S.event) chips += powChip(S.event.title.split(' ')[0], S.eventT, false, true);
  if (chips !== S.lastChips) { S.lastChips = chips; el.pows.innerHTML = chips; }
}
function powChip(ic, t, raw, isEvent) {
  const style = isEvent ? 'background:rgba(255,60,60,.22);border-color:rgba(255,60,60,.35);color:#ffb3b3' : '';
  return '<div class="powChip" style="'+style+'">' + ic + (t >= 0 ? (raw ? faNum(t) : ' ' + faNum(Math.ceil(t)) + 'ث') : '') + '</div>';
}
function showComboBig(txt){
  el.comboBigText.textContent=txt;
  el.comboHud.classList.remove('hidden');
  clearTimeout(showComboBig._t);
  showComboBig._t=setTimeout(()=> el.comboHud.classList.add('hidden'), 900);
}
function showEventBanner(txt){
  el.eventBanner.textContent=txt;
  el.eventBanner.classList.remove('hidden');
}
function hideEventBanner(){ el.eventBanner.classList.add('hidden'); }
function showRumor(txt){
  el.rumorBanner.textContent='💬 '+txt;
  el.rumorBanner.classList.remove('hidden');
  clearTimeout(showRumor._t);
  showRumor._t=setTimeout(()=> el.rumorBanner.classList.add('hidden'), 4200);
}
function hideRumor(){ el.rumorBanner.classList.add('hidden'); }

/* ---------------- screens / navigation ---------------- */
function showScreen(name) {
  const screens=['menu','select','league','missions','achievements','profile','settings','records','over','screen-username'];
  screens.forEach(s => {
    const e = document.getElementById(s);
    if(e) e.classList.toggle('hidden', s !== name);
  });
  el.hud.classList.toggle('hidden', !(name === 'play'));
  if(name!=='play') el.hud.classList.add('hidden');
}
function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.toast.classList.add('hidden'), 2000);
}
function checkUsernameGate(){
  if(!DB.player.username){
    showScreen('screen-username');
    return false;
  }
  return true;
}

/* ---------------- cards / lists ---------------- */
function buildCards() {
  el.cards.innerHTML = '';
  const recs = getRecords();
  CHARS.forEach(ch => {
    const card = document.createElement('div');
    card.className = 'card' + (ch.id === selectedChar ? ' sel' : '');
    card.dataset.id = ch.id;
    const best = recs[ch.id] ? recs[ch.id].score : DB.stats.bestScore;
    const lvl = DB.characters.levels[ch.id]||1;
    card.innerHTML =
      '<img class="photo" src="assets/characters/' + ch.id + '.jpg" alt="' + ch.name + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
      '<div class="phFallback" style="display:none">' + ch.name[0] + '</div>' +
      '<canvas width="172" height="208"></canvas>' +
      '<div class="cname">' + ch.name + '</div>' +
      '<div class="ctitle">' + ch.title + ' ' + ch.ability.icon + '</div>' +
      '<div class="cstats">'+
        '<div class="cstat"><span>SPD</span><div class="bar"><div class="fill" style="width:'+ (ch.stats.speed*10)+'%"></div></div></div>'+
        '<div class="cstat"><span>CTRL</span><div class="bar"><div class="fill" style="width:'+ (ch.stats.control*10)+'%"></div></div></div>'+
        '<div class="cstat"><span>LUCK</span><div class="bar"><div class="fill" style="width:'+ (ch.stats.luck*10)+'%"></div></div></div>'+
      '</div>' +
      '<div class="cAbility"><b>'+ch.passive.icon+' '+ch.passive.name+':</b> '+ch.passive.desc+'<br><b>'+ch.ability.icon+' '+ch.ability.name+':</b> '+ch.ability.desc+'</div>' +
      '<div class="cbest">Lv.'+faNum(lvl)+' • 🏆 ' + faNum(best) + '</div>';
    card.addEventListener('click', () => {
      selectedChar = ch.id; DB.characters.selected=ch.id; saveDB();
      AU.ensure(); AU.click();
      buildCards();
      showCharDetail(ch);
    });
    el.cards.appendChild(card);
    const cv = card.querySelector('canvas');
    const g = cv.getContext('2d');
    drawChibi(g, ch, 86, 198, 152, { idle: true, phase: rand(0, 6), back: false, mood: 'norm' });
  });
  const selCh = CHARS.find(c=>c.id===selectedChar);
  if(selCh) showCharDetail(selCh);
}
function showCharDetail(ch){
  el.charDetail.classList.remove('hidden');
  el.charDetailIcon.textContent=ch.ability.icon;
  el.charDetailName.textContent=ch.name+' — '+ch.title;
  el.charDetailDesc.textContent=ch.passive.name+': '+ch.passive.desc+' • Active: '+ch.ability.name+' ('+ch.ability.cooldown+'s CD)';
}
function buildRecords() {
  const recs = getRecords();
  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  const sorted = CHARS.slice().sort((a, b) => (recs[b.id] ? recs[b.id].score : 0) - (recs[a.id] ? recs[a.id].score : 0));
  el.recList.innerHTML = sorted.map((ch, i) => {
    const r = recs[ch.id] || { score: 0, cigs: 0, dist: 0 };
    return '<div class="leagueRow"><span class="rk">' + medals[i] + '</span><span class="rn" style="flex:1;text-align:right">' + ch.name +
      ' <small style="color:#9d92d9">🚬' + faNum(r.cigs) + ' • ' + faNum(r.dist) + 'م</small></span><span class="sc">' + faNum(r.score) + '</span></div>';
  }).join('') || '<div class="emptyState">هنوز رکوردی نیست — اولین نفری باش که فرار می‌کنه! 🚀</div>';
}

/* ---------------- league ---------------- */
let activeLeagueTab='global';
let activeCharFilter=null;
async function showLeague(tab='global'){
  activeLeagueTab=tab;
  document.querySelectorAll('#leagueTabs .tab').forEach(b=> b.classList.toggle('active', b.dataset.tab===tab));
  if(tab==='character') el.leagueCharFilter.classList.remove('hidden'); else el.leagueCharFilter.classList.add('hidden');
  el.leagueList.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
  el.leagueStatus.classList.add('hidden');
  el.myRankCard.classList.add('hidden');
  try{
    const data = await Network.leaderboard(tab, activeCharFilter);
    renderLeague(data);
  }catch(e){
    const cached = FakeBackend.getLeaderboard(tab, activeCharFilter);
    if(cached.length>0) renderLeague(cached);
    else {
      el.leagueList.innerHTML='';
      el.leagueStatus.textContent = e.message==='offline' ? '📡 جدول آنلاین موقتاً در دسترس نیست — نمایش کش محلی' : 'هنوز کسی رکوردی ثبت نکرده. اولین نفر تو باش!';
      el.leagueStatus.classList.remove('hidden');
    }
  }
}
function renderLeague(list){
  if(!list || list.length===0){
    el.leagueList.innerHTML='<div class="emptyState">هنوز کسی رکوردی ثبت نکرده. اولین نفر تو باش! 🚀</div>';
    return;
  }
  el.leagueList.innerHTML = list.slice(0,30).map(e=>{
    const isTop = e.rank<=3;
    const cls = e.isMe ? 'leagueRow me' : (e.rank===1?'leagueRow top1': e.rank===2?'leagueRow top2': e.rank===3?'leagueRow top3':'leagueRow');
    const medal = e.rank===1?'🥇': e.rank===2?'🥈': e.rank===3?'🥉': '#'+faNum(e.rank);
    return `<div class="${cls}">
      <span class="rk">${medal}</span>
      <span class="av">${e.avatar||'😎'}</span>
      <span class="meta"><b>${e.username} ${e.isMe?' (تو)':''}</b><small>${e.character? '🎭 '+e.character:''} • ${faNum(e.distance)}م • 🚬${faNum(e.cigs)} • 🔥${faNum(e.combo||0)}</small></span>
      <span class="sc">${faNum(e.score)}</span>
    </div>`;
  }).join('');
  const me = list.find(x=>x.isMe);
  if(me){
    el.myRankCard.textContent = `تو رتبه ${faNum(me.rank)} هستی — امتیاز ${faNum(me.score)} ⭐`;
    el.myRankCard.classList.remove('hidden');
  } else {
    el.myRankCard.textContent = 'هنوز رکوردی نداری — یه فرار بزن! 🏃';
    el.myRankCard.classList.remove('hidden');
  }
}

/* ---------------- missions ---------------- */
let activeMissionTab='daily';
function renderMissions(){
  document.querySelectorAll('#missionTabs .tab').forEach(b=> b.classList.toggle('active', b.dataset.mtab===activeMissionTab));
  const list = activeMissionTab==='daily'? DB.missions.daily : activeMissionTab==='weekly'? DB.missions.weekly : [];
  if(activeMissionTab==='progress'){
    el.missionList.innerHTML = `<div class="missionCard"><div class="mInfo"><div class="mTitle">پیشرفت کلی</div><div class="mDesc">Level ${faNum(DB.xp.level)} • XP ${faNum(DB.xp.xp)}/${faNum(xpForLevel(DB.xp.level))} • Total ${faNum(DB.xp.totalXp)}</div><div class="mProg"><div class="mFill" style="width:${(DB.xp.xp/xpForLevel(DB.xp.level)*100)}%"></div></div></div></div>
      <div class="missionCard"><div class="mInfo"><div class="mTitle">اعتبار خوابگاه</div><div class="mDesc">${DB.reputation.rank} • ${faNum(DB.reputation.points)} امتیاز اعتبار</div></div></div>`;
    return;
  }
  if(list.length===0){
    el.missionList.innerHTML='<div class="emptyState">مأموریت‌ها فردا به‌روز می‌شن! 🌙</div>';
    return;
  }
  el.missionList.innerHTML = list.map(m=>{
    const pct = Math.min(100, Math.round(m.progress/m.target*100));
    return `<div class="missionCard ${m.done?'done':''}">
      <div class="mIcon">${m.icon}</div>
      <div class="mInfo"><div class="mTitle">${m.title} ${m.done?'✅':''}</div><div class="mDesc">${m.desc}</div><div class="mProg"><div class="mFill" style="width:${pct}%"></div></div><div style="font-size:11px;color:#cfc6ff">${faNum(m.progress)}/${faNum(m.target)} • +${faNum(m.xp)} XP</div></div>
      <div class="mReward">${m.done?'🎉': faNum(pct)+'%'}</div>
    </div>`;
  }).join('');
}

/* ---------------- achievements ---------------- */
function renderAchievements(){
  const total=ACH_DEFS.length, unlocked=DB.achievements.filter(a=>a.unlocked).length;
  el.achProgress.textContent = `${faNum(unlocked)} / ${faNum(total)} باز شده`;
  el.achGrid.innerHTML = ACH_DEFS.map(def=>{
    const prog = DB.achievements.find(a=>a.id===def.id);
    const unlocked = prog?.unlocked;
    const pct = prog? Math.min(100, Math.round(prog.progress/def.target*100)):0;
    return `<div class="achCard ${unlocked?'unlocked':'locked'}">
      <div class="achIcon">${def.icon}</div>
      <div class="achTitle">${def.title}</div>
      <div class="achDesc">${def.desc}</div>
      <div class="achProg">${unlocked?'✅ باز شد!': faNum(prog?.progress||0)+' / '+faNum(def.target)+' ('+faNum(pct)+'%)'}</div>
    </div>`;
  }).join('');
}

/* ---------------- profile / stats ---------------- */
function renderProfile(){
  const best = DB.stats.bestScore;
  const lvl = DB.xp.level;
  const nextXp = xpForLevel(lvl);
  const pct = Math.min(100, Math.round(DB.xp.xp/nextXp*100));
  el.profileBox.innerHTML = `
    <div class="profileMain">
      <div class="avBig">${DB.player.avatar||'😎'}</div>
      <div class="pInfo">
        <div class="pName">${DB.player.username||'مهمان'}</div>
        <div class="pLevel">⭐ Level ${faNum(lvl)} • ${DB.reputation.rank}</div>
        <div class="pCode" id="profileCodeClick">${DB.player.friendCode} 📋</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:22px;font-weight:900;color:#ffd93d">${faNum(best)}</div>
        <div style="font-size:11px;color:#cfc6ff">بهترین امتیاز</div>
      </div>
    </div>
    <div class="statCard"><span>🎮 بازی‌ها</span><b>${faNum(DB.stats.totalRuns)}</b></div>
    <div class="statCard"><span>🏃 مسافت کل</span><b>${faNum(DB.stats.totalDistance)}م</b></div>
    <div class="statCard"><span>🚬 نخ‌ها</span><b>${faNum(DB.stats.totalCigs)}</b></div>
    <div class="statCard"><span>🔥 بهترین Combo</span><b class="gold">x${faNum(DB.stats.bestCombo)}</b></div>
    <div class="xpBar" style="grid-column:1/-1"><div class="xpFill" style="width:${pct}%"></div><span>${faNum(DB.xp.xp)} / ${faNum(nextXp)} XP • ${faNum(pct)}%</span></div>
  `;
  setTimeout(()=>{
    const c=$('profileCodeClick');
    if(c) c.addEventListener('click', ()=>{
      navigator.clipboard?.writeText(DB.player.friendCode).then(()=> toast('کد کپی شد! 📋')).catch(()=> toast(DB.player.friendCode));
    });
  },0);
  renderStats();
}
function renderStats(){
  const s=DB.stats;
  el.statsBox.innerHTML = `
    <div class="statCard"><span>بهترین مسافت</span><b>${faNum(s.bestDistance)} م</b></div>
    <div class="statCard"><span>Near Miss</span><b>⚡ ${faNum(s.totalNearMiss)}</b></div>
    <div class="statCard"><span>Perfect</span><b>✨ ${faNum(s.totalPerfects)}</b></div>
    <div class="statCard"><span>محبوب‌ترین</span><b>${CHARS.find(c=>c.id===s.mostUsedChar)?.name||'—'}</b></div>
    <div class="statCard"><span>لیگ</span><b>${LEAGUE_NAMES[DB.league.tier]||DB.league.tier}</b></div>
    <div class="statCard"><span>هفته امتیاز</span><b>${faNum(DB.league.weeklyScore)}</b></div>
    <div class="statCard"><span>زمان بازی</span><b>${faNum(Math.floor((s.totalPlayTime||0)/60))} دقیقه</b></div>
    <div class="statCard"><span>دوستان</span><b>👥 ${faNum(DB.friends.length)}</b></div>
  `;
}

/* ---------------- settings ---------------- */
function initSettingsUI(){
  $('musicVol').value=DB.settings.musicVol;
  $('sfxVol').value=DB.settings.sfxVol;
  $('musicVolVal').textContent=DB.settings.musicVol+'%';
  $('sfxVolVal').textContent=DB.settings.sfxVol+'%';
  updateToggle('toggleVibrate', DB.settings.vibrate);
  updateToggle('toggleParticles', DB.settings.particles);
  updateToggle('toggleShake', DB.settings.shake);
  updateToggle('toggleReduced', DB.settings.reducedMotion);
  updateToggle('toggleContrast', DB.settings.highContrast);
  document.body.classList.toggle('reducedMotion', DB.settings.reducedMotion);
  document.body.classList.toggle('highContrast', DB.settings.highContrast);
  el.syncStatus.textContent = DB.pendingRuns.length>0 ? `⏳ ${faNum(DB.pendingRuns.length)} pending` : '✓ همگام';
}
function updateToggle(id, on){ const e=$(id); if(e) e.classList.toggle('on', !!on); }

/* ---------------- start / over ---------------- */
let pendingStart = false;
let dailyChallengeSeed=null;
function tryStart(opts={}) {
  AU.ensure(); AU.click();
  if(!DB.player.username){
    showScreen('screen-username');
    return;
  }
  if (!store.get('fed_tut', false) && !opts.skipTut) { pendingStart = opts; el.tutorial.classList.remove('hidden'); return; }
  startRun(opts);
}
function startRun(opts={}) {
  // handle seed for daily / challenge
  if(opts.daily){
    isDailyChallenge=true; isFriendChallenge=false;
    dailyChallengeSeed=getDailySeed();
    currentSeed=dailyChallengeSeed;
    toast('🌙 چالش امروز — Seed #'+dailyChallengeSeed);
  } else if(opts.challengeSeed){
    isFriendChallenge=true; isDailyChallenge=false;
    currentSeed=opts.challengeSeed;
    challengeSeedVal=opts.challengeSeed;
    toast('⚔️ چالش دوست — Seed #'+challengeSeedVal);
  } else if(opts.seed){
    currentSeed=opts.seed;
  } else {
    isDailyChallenge=false; isFriendChallenge=false;
    currentSeed=makeSeed();
    // check URL challenge
    const urlSeed=getChallengeFromUrl();
    if(urlSeed){ currentSeed=urlSeed; isFriendChallenge=true; toast('⚔️ چالش لینکی فعال!'); }
  }
  S = newState();
  S.mode = 'play';
  S.seed=currentSeed;
  S.showGhost = !!DB.ghost && !isDailyChallenge;
  if(S.showGhost) S.ghostData=DB.ghost.trail;
  queue.length = 0;
  showScreen('play');
  // reset seed rng for spawn consistency
  S.nextRowZ = 30;
  AU.ensure();
  AU.startMusic();
  // tonight event banner at start
  const tonight=getTonightEvent();
  showEventBanner('🌙 اتفاق امشب: '+tonight.text);
  setTimeout(()=> hideEventBanner(), 4200);
}
function showOver() {
  // Robust showOver — UI always shows even if DB/network fails (fix for "امتیاز نشان نمیدهد")
  try { S.mode = 'over'; } catch(e){ try{ S={...S, mode:'over'}; }catch(_){ S={mode:'over'}; } }
  try { AU.stopMusic(); AU.overJingle(); } catch(e){}
  let score = 0;
  let br = null;
  let xpGain = 0;
  let leveled = false;
  let isRecLegacy = {isRec:false, best:0};
  try { score = finalScore(); if (!isFinite(score) || score<0) score = Math.floor(S.dist||0) + (S.cigs||0)*25; } catch(e){ try{ score = Math.floor(S.dist||0) + (S.cigs||0)*25; }catch(_){score=0;} }
  try { br = computeScoreBreakdown(); } catch(e){ br = {distScore: Math.floor(S.dist||0), cigCollect: S.cigScore||0, comboBonus: Math.floor((S.combo||0)*4 + (S.bestCombo||0)*8), nearBonus: S.nearMissScore||0, difficultyMul:1, tonightMul:1, eventMul:1, totalMul:1, subtotal: score, final: score}; }
  // --- UI FIRST (guaranteed) ---
  try {
    if (el.ovScore) el.ovScore.textContent = faNum(score);
    if (el.ovCigs) el.ovCigs.textContent = faNum(S.cigs||0);
    if (el.ovDist) el.ovDist.textContent = faNum(Math.floor(S.dist||0)) + ' م';
    if (el.ovBest) el.ovBest.textContent = faNum(Math.max(score, (DB.stats&&DB.stats.bestScore)||0));
    if (el.ovCombo) el.ovCombo.textContent = 'x'+faNum(Math.floor(S.bestCombo||0));
    if (el.ovNearMiss) el.ovNearMiss.textContent = faNum(S.nearMiss||0);
  } catch(e){ console.warn('over UI head error', e); }
  try {
    if (el.scoreBreak && br) {
      const xpTmp = Math.floor(score/120) + (S.cigs||0)*2 + (S.nearMiss||0)*3 + (S.perfects||0)*5 + 20;
      el.scoreBreak.innerHTML = `
        <div class="sbRow"><span>مسافت</span><b>${faNum(br.distScore||0)}</b></div>
        <div class="sbRow"><span>سیگار + پرفکت</span><b>${faNum(br.cigCollect||0)}</b></div>
        <div class="sbRow"><span>Combo</span><b>+${faNum(br.comboBonus||0)}</b></div>
        <div class="sbRow"><span>Near Miss ⚡</span><b>+${faNum(br.nearBonus||0)}</b></div>
        <div class="sbRow"><span>سختی ×${(br.difficultyMul||1).toFixed(2)}</span><span>امشب ×${(br.tonightMul||1).toFixed(2)}</span></div>
        <div class="sbRow total"><span>امتیاز نهایی</span><b>${faNum(br.final||score)}</b></div>
        <div style="font-size:11px;color:#cfc6ff;margin-top:4px">XP +${faNum(xpTmp)} • ${isDailyChallenge?'چالش روزانه': isFriendChallenge?'چالش دوست':'Run عادی'}</div>
      `;
    } else if (el.scoreBreak) {
      el.scoreBreak.textContent = 'امتیاز: ' + faNum(score);
    }
  } catch(e){ console.warn('scoreBreak error', e); try{ if(el.scoreBreak) el.scoreBreak.textContent = 'امتیاز: '+faNum(score); }catch(_){} }
  // --- DB / stats (safe, never blocks UI) ---
  try {
    try { isRecLegacy = saveRunLegacy(score); } catch(e){ isRecLegacy={isRec:false,best:score}; console.warn('saveRunLegacy',e); }
    try {
      DB.stats.totalRuns = (DB.stats.totalRuns||0)+1;
      DB.stats.totalDistance = (DB.stats.totalDistance||0)+Math.floor(S.dist||0);
      DB.stats.totalCigs = (DB.stats.totalCigs||0)+(S.cigs||0);
      DB.stats.totalNearMiss = (DB.stats.totalNearMiss||0)+(S.nearMiss||0);
      DB.stats.totalPerfects = (DB.stats.totalPerfects||0)+(S.perfects||0);
      DB.stats.totalPlayTime = (DB.stats.totalPlayTime||0)+Math.floor(S.t||0);
      if(score>(DB.stats.bestScore||0)) DB.stats.bestScore=score;
      if((S.dist||0)>(DB.stats.bestDistance||0)) DB.stats.bestDistance=Math.floor(S.dist||0);
      if((S.bestCombo||0)>(DB.stats.bestCombo||0)) DB.stats.bestCombo=Math.floor(S.bestCombo||0);
      if((S.cigs||0)>(DB.stats.bestCigs||0)) DB.stats.bestCigs=S.cigs||0;
      DB.stats.charRuns = DB.stats.charRuns||{parsa:0,mahyar:0,arsham:0,mohsen:0,farham:0};
      DB.stats.charRuns[S.charId]=(DB.stats.charRuns[S.charId]||0)+1;
      let max=0, most='parsa';
      Object.entries(DB.stats.charRuns).forEach(([k,v])=>{ if(v>max){max=v; most=k;}});
      DB.stats.mostUsedChar=most;
      const h=new Date().getHours();
      if(h>=22 || h<=4) DB.stats.nightRuns=(DB.stats.nightRuns||0)+1;
      DB.stats.pows=(DB.stats.pows||0)+(S.powsCollected||0);
      try {
        let zs = Array.isArray(DB.stats.zonesSeen) ? new Set(DB.stats.zonesSeen) : (DB.stats.zonesSeen instanceof Set ? DB.stats.zonesSeen : new Set(Object.values(DB.stats.zonesSeen||{})));
        if (S.zonesSeen && S.zonesSeen.forEach) S.zonesSeen.forEach(z=> zs.add(z));
        DB.stats.zonesSeen = Array.from(zs);
      } catch(e){ try{ DB.stats.zonesSeen = S.zonesSeen? Array.from(S.zonesSeen):[]; } catch(_e){ DB.stats.zonesSeen=[]; } }
      if(!isFriendChallenge && !isDailyChallenge){
        try{ DB.ghost = { seed: S.seed, trail: (S.ghostTrail||[]).slice(0,400), score, character:S.charId, date:Date.now() }; }catch(e){}
      }
      updateReputation();
      const runStats={ cigs:S.cigs||0, dist:Math.floor(S.dist||0), score, nearMiss:S.nearMiss||0, bestCombo:S.bestCombo||0, abilityUses:S.abilityUses||0, runs:1, charsUsed: Object.keys(DB.stats.charRuns).filter(k=>DB.stats.charRuns[k]>0).length, noPowRun: (S.powsCollected||0)===0?1:0 };
      try{ updateMissionsProgress(runStats); }catch(e){ console.warn('missions',e); }
      try{ DB.missions.weekly.forEach(m=>{ if(m.id==='w_runs'){ m.progress=Math.min(m.target, DB.stats.totalRuns); if(m.progress>=m.target && !m.done){m.done=true; addXP(m.xp);} } }); }catch(e){}
      try{ if(ACH_DEFS) updateAchievements(); }catch(e){}
      xpGain = Math.floor(score/120) + (S.cigs||0)*2 + (S.nearMiss||0)*3 + (S.perfects||0)*5 + 20;
      try{ leveled = addXP(xpGain); }catch(e){ leveled=false; }
      try{ updateLeague(score); }catch(e){}
    } catch(e){ console.warn('showOver stats error', e); }
    // pending run for offline sync (with run_id + timestamps for real backend)
    try{
      const runId = (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : 'run-'+Date.now()+'-'+Math.random().toString(36).slice(2,8));
      const startedAt = new Date(S.runStartTime||Date.now()).toISOString();
      const finishedAt = new Date().toISOString();
      const payload = {
        run_id: runId,
        username: (DB.player&&DB.player.username)||'مهمان',
        avatar: ['😎','🧲','🎲','🛡️','👻'][CHARS.findIndex(c=>c.id===S.charId)]||'⭐',
        character: S.charId,
        character_id: S.charId,
        score, distance: Math.floor(S.dist||0), cigs: S.cigs||0, combo: Math.floor(S.bestCombo||0), nearMiss: S.nearMiss||0,
        date: Date.now(), duration: Math.floor(S.t||0), seed: S.seed||0,
        started_at: startedAt, finished_at: finishedAt,
        abilityUses: S.abilityUses||0, powsCollected: S.powsCollected||0,
        environment: (ZONES[Math.floor((S.dist||0)/ZONE_LEN)%ZONES.length]?.id || 'dorm')
      };
      if(!validateRun(payload)){
        const hasPhp = !!(window.PhpApi && window.phpBackendAvailable);
        const hasSupabase = !!(window.SyncManager && window.isSupabaseConfigured);
        if(hasSupabase){
          try{ window.SyncManager.queueRun(payload); toast('📡 Run queued — will sync ☁️'); }catch(e){ DB.pendingRuns.unshift(payload); if(DB.pendingRuns.length>20) DB.pendingRuns.pop(); }
          try{ if(el.syncStatus) el.syncStatus.textContent = window.SyncManager.pendingCount ? `⏳ ${faNum(window.SyncManager.pendingCount())} pending` : '☁️ Queued'; }catch(e){}
        } else {
          DB.pendingRuns.unshift(payload);
          if(DB.pendingRuns.length>20) DB.pendingRuns.pop();
          try{ saveDB(); }catch(e){}
          Network.submit(payload).then(r=>{
            if(r.php || r.real){
              toast('☁️ رکورد همگام شد! رتبه #'+faNum(r.rank||1));
              DB.pendingRuns = DB.pendingRuns.filter(p=> p.date!==payload.date);
              try{ saveDB(); }catch(e){}
              if(el.syncStatus) el.syncStatus.textContent='✓ همگام';
            } else {
              if(el.syncStatus) el.syncStatus.textContent='✓ همگام (محلی)';
            }
          }).catch(e=>{
            if(el.syncStatus) el.syncStatus.textContent='📡 آفلاین — بعداً همگام میشه';
            if(e.message==='network' || e.message==='offline' || (e.message&&e.message.includes('Failed to fetch'))) toast('📡 آفلاین — رکورد ذخیره شد, بعداً همگام میشه');
            else console.warn('[submit] error', e.message);
          });
        }
      } else {
        console.warn('[validate] payload rejected', validateRun(payload));
      }
    }catch(e){ console.warn('payload error', e); }
    // char xp
    try{
      DB.characters.xp[S.charId]=(DB.characters.xp[S.charId]||0)+ Math.floor(score/200);
      const needed = (DB.characters.levels[S.charId]||1)*300;
      if(DB.characters.xp[S.charId]>=needed){
        DB.characters.xp[S.charId]-=needed;
        DB.characters.levels[S.charId]++;
        floatText(CX, BASEY-CH*1.5, '⭐ '+CHARS.find(c=>c.id===S.charId).name+' Level Up!', '#ffd93d');
        try{ AU.levelUp(); }catch(e){}
      }
      saveDB();
    }catch(e){ try{ saveDB(); }catch(_){} }
  } catch(e){ console.error('showOver DB outer', e); try{ saveDB(); }catch(_){} }
  // ensure over screen visible
  try { showScreen('over'); } catch(e){ try{ document.getElementById('over')?.classList.remove('hidden'); }catch(_){} }
  try{ updateMenuStats(); }catch(e){}
  // badges / rank (after DB, but safe)
  try {
    if (el.newRec) el.newRec.classList.toggle('hidden', !isRecLegacy.isRec);
    if (el.levelUpBadge) el.levelUpBadge.classList.toggle('hidden', !leveled);
    if(leveled) try{AU.levelUp();}catch(e){}
    if(S.rumor && el.overRumor){ el.overRumor.textContent='💬 '+S.rumor; el.overRumor.classList.remove('hidden'); } else if(el.overRumor) el.overRumor.classList.add('hidden');
    if (el.overEmoji) el.overEmoji.textContent = isRecLegacy.isRec ? '🎉' : (score>10000 ? '😎' : '🚔');
    const tEl = document.getElementById('overTitle');
    if(tEl) tEl.textContent = isRecLegacy.isRec ? 'رکورد ترکوندی!' : (S.nearMiss>=5 ? 'نزدیک بود! 💀' : 'گیر افتادی!');
    const board = FakeBackend.getLeaderboard('global');
    const me = board.find(x=>x.isMe);
    if(el.overRank){
      if(me) el.overRank.textContent = `🏆 رتبه جهانی: #${faNum(me.rank)} — ${me.rank<=10?'جزو ده برتر! 🔥': me.rank<=30?'داری پیش میری! 💪':'ادامه بده!'}`;
      else el.overRank.textContent = '🏆 رکورد ثبت شد — برو لیگ رو چک کن!';
    }
  } catch(e){ console.warn('over badges error', e); }
}

function toMenu() { S.mode = 'idle'; AU.stopMusic(); showScreen('menu'); updateMenuStats(); }
function togglePause() {
  if (S.mode !== 'play') return;
  S.paused = !S.paused;
  el.pauseOv.classList.toggle('hidden', !S.paused);
  if(S.paused){
    AU.stopMusic();
    $('pauseStats').innerHTML = `<div><b>${faNum(finalScore())}</b><br><small>امتیاز</small></div><div><b>${faNum(Math.floor(S.dist))}م</b><br><small>مسافت</small></div><div><b>🚬 ${faNum(S.cigs)}</b><br><small>نخ</small></div><div><b>🔥 x${faNum(Math.floor(S.combo))}</b><br><small>combo</small></div>`;
  } else AU.startMusic();
}
function updateMenuStats(){
  if(!DB.player.username) return;
  el.menuUsername.textContent=DB.player.username;
  el.menuAvatar.textContent=DB.player.username[0]||'پ';
  el.menuLevel.textContent=faNum(DB.xp.level);
  el.menuBest.textContent=faNum(DB.stats.bestScore);
  el.menuLeagueBadge.textContent=LEAGUE_NAMES[DB.league.tier]||DB.league.tier;
  el.tonightText.textContent=getTonightEvent().text;
}

/* ---------------- buttons ---------------- */
$('btnStart').addEventListener('click', ()=> tryStart({}));
$('btnDaily').addEventListener('click', ()=> tryStart({daily:true}));
$('btnSelect').addEventListener('click', () => { AU.ensure(); AU.click(); buildCards(); showScreen('select'); });
$('btnLeague').addEventListener('click', ()=> { AU.ensure(); AU.click(); showScreen('league'); showLeague('global'); });
$('btnMissions').addEventListener('click', ()=> { AU.ensure(); AU.click(); renderMissions(); showScreen('missions'); });
$('btnAchievements').addEventListener('click', ()=> { AU.ensure(); AU.click(); renderAchievements(); showScreen('achievements'); });
$('btnProfile').addEventListener('click', ()=> { AU.ensure(); AU.click(); renderProfile(); showScreen('profile'); });
$('btnSettings').addEventListener('click', ()=> { AU.ensure(); AU.click(); initSettingsUI(); showScreen('settings'); });
$('btnRecordsOld').addEventListener('click', () => { AU.ensure(); AU.click(); buildRecords(); showScreen('records'); });
$('btnHelp').addEventListener('click', () => { AU.ensure(); AU.click(); el.tutorial.classList.remove('hidden'); });

$('btnTutOk').addEventListener('click', () => {
  AU.click();
  store.set('fed_tut', true);
  el.tutorial.classList.add('hidden');
  if (pendingStart) { const opts=pendingStart; pendingStart = false; startRun(opts); }
});
$('btnPlaySel').addEventListener('click', ()=> tryStart({}));
$('btnBackSel').addEventListener('click', () => { AU.click(); showScreen('menu'); });
$('btnBackLeague').addEventListener('click', () => { AU.click(); showScreen('menu'); });
$('btnBackMissions').addEventListener('click', () => { AU.click(); showScreen('menu'); });
$('btnBackAch').addEventListener('click', () => { AU.click(); showScreen('menu'); });
$('btnBackProfile').addEventListener('click', () => { AU.click(); showScreen('menu'); });
$('btnBackSettings').addEventListener('click', () => { AU.click(); showScreen('menu'); });
$('btnBackRec').addEventListener('click', () => { AU.click(); showScreen('menu'); });
$('btnRetry').addEventListener('click', () => { AU.click(); startRun({}); });
$('btnOverLeague').addEventListener('click', ()=> { AU.click(); showScreen('league'); showLeague('global'); });
$('btnOverChallenge').addEventListener('click', ()=> { AU.click(); showChallengeModal(); });
$('btnMenuOver').addEventListener('click', () => { AU.click(); toMenu(); });
$('btnShare').addEventListener('click', () => {
  AU.click();
  const ch = charOf();
  const score=finalScore();
  const txt = `🚬 فرار از خوابگاه! من با ${ch.name} ${faNum(S.cigs)} نخ جمع کردم و ${faNum(Math.floor(S.dist))} متر دویدم — امتیاز: ${faNum(score)} 😎 تو می‌تونی؟ #فرار_از_خوابگاه\n`+location.href.split('?')[0]+`?challenge=${S.seed}`;
  if(navigator.share){
    navigator.share({title:'فرار از خوابگاه', text:txt}).catch(()=> copyTxt(txt));
  } else copyTxt(txt);
  function copyTxt(t){
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(()=> toast('متن کپی شد! 📋')).catch(() => fallbackCopy(t));
    else fallbackCopy(t);
  }
});
function fallbackCopy(txt) {
  try {
    const ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast('متن امتیاز کپی شد! 📋');
  } catch (e) { toast('کپی نشد 😅'); }
}
$('btnPause').addEventListener('click', togglePause);
$('btnResume').addEventListener('click', togglePause);
$('btnRestartP').addEventListener('click', () => { AU.click(); S.paused = false; el.pauseOv.classList.add('hidden'); startRun({}); });
$('btnMenuP').addEventListener('click', () => { AU.click(); S.paused = false; el.pauseOv.classList.add('hidden'); toMenu(); });
el.btnMute.addEventListener('click', () => {
  AU.ensure();
  AU.setMuted(!AU.muted);
  el.btnMute.textContent = AU.muted ? '🔇' : '🔊';
  if (!AU.muted && S.mode === 'play') AU.startMusic();
});
el.btnMute.textContent = AU.muted ? '🔇' : '🔊';
$('abilityBtn').addEventListener('click', useAbility);
$('btnUseAbilityPreview').addEventListener('click', ()=> { AU.ability(); toast('✨ پیش‌نمایش Ability — در بازی Q یا دابل‌تپ!'); });

// league tabs
document.querySelectorAll('#leagueTabs .tab').forEach(b=> b.addEventListener('click', ()=> showLeague(b.dataset.tab)));
document.querySelectorAll('#leagueCharFilter button').forEach(b=> b.addEventListener('click', ()=>{
  activeCharFilter=b.dataset.char;
  document.querySelectorAll('#leagueCharFilter button').forEach(x=> x.classList.toggle('ghostBtn', x!==b));
  document.querySelectorAll('#leagueCharFilter button').forEach(x=> x.style.background = x===b ? '#ffd93d':'');
  showLeague('character');
}));
$('btnChallengeFriend').addEventListener('click', showChallengeModal);
$('btnGhostToggle').addEventListener('click', ()=>{
  S.showGhost=!S.showGhost;
  toast(S.showGhost? '👻 Ghost روشن شد':'👻 Ghost خاموش شد');
});

// missions tabs
document.querySelectorAll('#missionTabs .tab').forEach(b=> b.addEventListener('click', ()=>{ activeMissionTab=b.dataset.mtab; renderMissions(); }));

// profile
$('btnEditName').addEventListener('click', ()=>{
  const name=prompt('نام جدید:', DB.player.username);
  if(name && name.trim().length>=2 && name.trim().length<=14){
    DB.player.username=name.trim(); DB.player.guest=false; saveDB(); renderProfile(); updateMenuStats(); toast('نام ذخیره شد! ✅');
  } else if(name!==null) toast('نام باید ۲ تا ۱۴ حرف باشد');
});
$('btnAddFriend').addEventListener('click', ()=> { el.friendModal.classList.remove('hidden'); el.myFriendCode.textContent=DB.player.friendCode; renderFriendList(); });
$('btnCloseFriend').addEventListener('click', ()=> el.friendModal.classList.add('hidden'));
$('btnCopyCode').addEventListener('click', ()=>{
  navigator.clipboard?.writeText(DB.player.friendCode).then(()=> toast('کد کپی شد! 📋')).catch(()=> toast(DB.player.friendCode));
});
$('btnAddFriendConfirm').addEventListener('click', ()=>{
  const code=$('friendCodeInput').value.trim().toUpperCase();
  if(!/^DORM-[A-Z0-9]{4}$/.test(code)){ toast('فرمت کد اشتباهه! نمونه: DORM-7X92'); return; }
  if(code===DB.player.friendCode){ toast('این کد خودته! 😅'); return; }
  if(DB.friends.some(f=>f.code===code)){ toast('قبلاً اضافه شده!'); return; }
  // fake friend lookup
  const fakeNames=['سینا','نیما','آرمان','کیمیا','پریا','بردیا'];
  const username=choice(fakeNames);
  DB.friends.push({code, username, addedAt:Date.now()});
  DB.stats.friendsAdded=(DB.stats.friendsAdded||0)+1;
  saveDB(); renderFriendList(); toast(`👥 ${username} اضافه شد!`);
  $('friendCodeInput').value='';
  updateAchievements(); renderAchievements();
});
function renderFriendList(){
  el.friendList.innerHTML = DB.friends.length? DB.friends.map(f=> `<div class="leagueRow" style="padding:8px 10px"><span class="av" style="width:32px;height:32px;font-size:14px">${f.username[0]}</span><span class="meta"><b>${f.username}</b><small>${f.code}</small></span><span class="sc">👤</span></div>`).join('') : '<div class="emptyState" style="padding:12px">هنوز دوستی نداری — کد دوستت رو وارد کن! 👆</div>';
}
$('btnShareProfile').addEventListener('click', ()=>{
  const txt=`👤 پروفایل من در فرار از خوابگاه:\n${DB.player.username} — Lv${DB.xp.level} • ${DB.reputation.rank}\nبهترین: ${DB.stats.bestScore} • کد دوستی: ${DB.player.friendCode}\n`+location.href;
  if(navigator.clipboard) navigator.clipboard.writeText(txt).then(()=> toast('پروفایل کپی شد! 📋'));
});
$('btnStatsTab').addEventListener('click', ()=>{ renderStats(); toast('📊 آمار به‌روز شد'); });
$('btnReputationTab').addEventListener('click', ()=> toast(`🏠 اعتبار: ${DB.reputation.rank} — ${DB.reputation.points} امتیاز`));

// settings
$('musicVol').addEventListener('input', e=>{ $('musicVolVal').textContent=e.target.value+'%'; DB.settings.musicVol=parseInt(e.target.value); saveDB(); });
$('sfxVol').addEventListener('input', e=>{ $('sfxVolVal').textContent=e.target.value+'%'; DB.settings.sfxVol=parseInt(e.target.value); saveDB(); AU.setVolume(DB.settings.sfxVol, DB.settings.musicVol); });
$('toggleVibrate').addEventListener('click', ()=>{ DB.settings.vibrate=!DB.settings.vibrate; saveDB(); updateToggle('toggleVibrate', DB.settings.vibrate); toast(DB.settings.vibrate?'📳 لرزش روشن':'📳 لرزش خاموش'); });
$('toggleParticles').addEventListener('click', ()=>{ DB.settings.particles=!DB.settings.particles; saveDB(); updateToggle('toggleParticles', DB.settings.particles); });
$('toggleShake').addEventListener('click', ()=>{ DB.settings.shake=!DB.settings.shake; saveDB(); updateToggle('toggleShake', DB.settings.shake); });
$('toggleReduced').addEventListener('click', ()=>{ DB.settings.reducedMotion=!DB.settings.reducedMotion; saveDB(); updateToggle('toggleReduced', DB.settings.reducedMotion); document.body.classList.toggle('reducedMotion', DB.settings.reducedMotion); });
$('toggleContrast').addEventListener('click', ()=>{ DB.settings.highContrast=!DB.settings.highContrast; saveDB(); updateToggle('toggleContrast', DB.settings.highContrast); document.body.classList.toggle('highContrast', DB.settings.highContrast); });
$('btnSync').addEventListener('click', async ()=>{
  el.syncStatus.textContent='☁️ Syncing...';
  // try PHP batch sync first
  if(window.PhpApi && window.phpBackendAvailable && DB.pendingRuns.length>0){
    try{
      // map pendingRuns to PHP format
      const batch = DB.pendingRuns.slice(0,20).map(p=>({
        run_id: p.run_id,
        character_id: p.character||p.character_id,
        seed: p.seed||0,
        score: p.score,
        distance: p.distance,
        best_combo: p.combo||p.best_combo||0,
        duration: p.duration||60,
        items: p.cigs||0,
        near_misses: p.nearMiss||0,
        powerups: p.powsCollected||0,
        ability_uses: p.abilityUses||0,
        environment: p.environment||'dorm',
        started_at: p.started_at || new Date(p.date||Date.now()).toISOString().slice(0,19).replace('T',' '),
        finished_at: p.finished_at || new Date().toISOString().slice(0,19).replace('T',' ')
      }));
      const r = await window.PhpApi.syncRuns(batch);
      // remove succeeded ones
      const okIds = new Set((r.results||[]).filter(x=> x.status==='ok' || x.status==='duplicate').map(x=> x.run_id));
      DB.pendingRuns = DB.pendingRuns.filter(p=> !okIds.has(p.run_id));
      if(okIds.size>0) toast(`☁️ ${faNum(okIds.size)} Run همگام شد!`);
      else toast('⏳ همگام‌سازی PHP انجام شد');
    }catch(e){
      // fallback to per-run Network.submit
      for(const p of [...DB.pendingRuns]){
        try{ await Network.submit(p); DB.pendingRuns=DB.pendingRuns.filter(x=>x.date!==p.date || x.run_id!==p.run_id); toast('☁️ همگام شد!'); } catch(_e){}
      }
    }
  } else {
    for(const p of [...DB.pendingRuns]){
      try{ await Network.submit(p); DB.pendingRuns=DB.pendingRuns.filter(x=>x.date!==p.date); toast('☁️ همگام شد!'); } catch(e){}
    }
  }
  saveDB(); el.syncStatus.textContent= DB.pendingRuns.length? `⏳ ${faNum(DB.pendingRuns.length)} pending`:'✓ همگام';
  showLeague(activeLeagueTab);
});
$('btnClearFake')?.addEventListener('click', ()=>{
  if(confirm('لیگ فیک محلی پاک شود؟ فقط کش مرورگر (cachedBoard) پاک می‌شود، امتیازهای واقعی MySQL باقی می‌مانند.')) {
    clearFakeLeagueData();
  }
});
$('btnResetData').addEventListener('click', ()=>{
  if(confirm('همه داده‌ها پاک شود؟ این عمل برگشت‌ناپذیر است!')){
    localStorage.clear();
    Object.keys(mem).forEach(k=> delete mem[k]);
    location.reload();
  }
});

// username
$('btnSaveUser').addEventListener('click', ()=>{
  const v=$('usernameInput').value.trim();
  if(v.length<2){ toast('اسم باید حداقل ۲ حرف باشد'); return; }
  if(v.length>14){ toast('اسم حداکثر ۱۴ حرف'); return; }
  DB.player.username=v; DB.player.guest=false; saveDB();
  showScreen('menu'); updateMenuStats(); toast(`خوش اومدی ${v}! 🎉`);
});
$('btnGuest').addEventListener('click', ()=>{
  DB.player.username='مهمان_'+Math.floor(Math.random()*900+100); DB.player.guest=true; saveDB();
  showScreen('menu'); updateMenuStats(); toast('به عنوان مهمان وارد شدی — بعداً می‌تونی اسم بذاری 👤');
});
$('usernameInput').addEventListener('keydown', e=>{ if(e.key==='Enter') $('btnSaveUser').click(); });

// challenge modal
function showChallengeModal(){
  const seed = S.seed || currentSeed || makeSeed();
  $('challengeSeed').textContent='#'+seed;
  const url = location.href.split('?')[0]+'?challenge='+seed;
  $('challengeUrl').textContent=url;
  el.challengeModal.classList.remove('hidden');
}
$('btnCopyChallenge').addEventListener('click', ()=>{
  const url=$('challengeUrl').textContent;
  navigator.clipboard?.writeText(url).then(()=> toast('لینک چالش کپی شد! 🔗')).catch(()=> toast(url));
});
$('btnPlayChallenge').addEventListener('click', ()=>{
  const seed=parseInt($('challengeSeed').textContent.replace('#',''),10);
  el.challengeModal.classList.add('hidden');
  tryStart({challengeSeed: seed});
});
$('btnCloseChallenge').addEventListener('click', ()=> el.challengeModal.classList.add('hidden'));

// visibility / resize
document.addEventListener('visibilitychange', () => {
  if (document.hidden && S.mode === 'play' && !S.paused) togglePause();
});
window.addEventListener('resize', resize);
window.addEventListener('online', ()=> { el.syncStatus.textContent='📡 آنلاین — در حال همگام‌سازی...'; $('btnSync').click(); });
window.addEventListener('offline', ()=> { el.syncStatus.textContent='📡 آفلاین'; });

/* ---------------- loop ---------------- */
let lastT = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = clamp((now - lastT) / 1000, 0, 0.05);
  lastT = now;
  if (!S.paused && (S.mode === 'play' || S.mode === 'catch')) update(dt);
  if (S.mode === 'play' || S.mode === 'catch' || S.paused) draw();
}

resize();
if(!checkUsernameGate()){
  // show username screen
} else {
  showScreen('menu');
  updateMenuStats();
}
initSettingsUI();
requestAnimationFrame(t => { lastT = t; loop(t); });

// check challenge in URL on load
const urlSeed=getChallengeFromUrl();
if(urlSeed && DB.player.username){
  setTimeout(()=> toast('⚔️ چالش دوست فعاله! Seed #'+urlSeed+' — بزن شروع بازی!'), 900);
}

/* ---------------- test hook ---------------- */
window.__FE = {
  start: (id, opts) => { if (id) { selectedChar=id; DB.characters.selected=id; } startRun(opts||{}); },
  step: dt => { update(dt); draw(); },
  input: a => queueAction(a),
  useAbility: ()=> useAbility(),
  state: () => S,
  entities: () => S.ents,
  chars: CHARS,
  db: () => DB,
  score: ()=> finalScore(),
  validate: validateRun,
  fakeBoard: (tab)=> FakeBackend.getLeaderboard(tab),
  addXP,
};

})();
