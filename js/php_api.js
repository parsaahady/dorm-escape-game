// js/php_api.js — PHP/MySQL API client (for shared hosting)
// Provides same interface as Supabase Api but via PHP sessions + JSON
let csrfToken = null;

async function fetchCsrf() {
  try {
    const r = await fetch('/api/auth/csrf.php', { credentials: 'include' });
    const j = await r.json();
    if (j.success) csrfToken = j.data.csrf;
  } catch(e) {}
  return csrfToken;
}
async function apiFetch(url, opts = {}) {
  opts.credentials = 'include';
  opts.headers = opts.headers || {};
  opts.headers['Content-Type'] = 'application/json';
  if (csrfToken) opts.headers['X-CSRF-Token'] = csrfToken;
  // include CSRF in body for POST
  if (opts.method === 'POST' && opts.body) {
    try {
      const b = JSON.parse(opts.body);
      if (!b._csrf && csrfToken) b._csrf = csrfToken;
      opts.body = JSON.stringify(b);
    } catch(e){}
  }
  const res = await fetch(url, opts);
  const json = await res.json().catch(()=>({success:false, error:{message:'Invalid JSON'}}));
  if (!res.ok) {
    throw new Error(json.error?.message || json.message || 'API error '+res.status);
  }
  if (!json.success) throw new Error(json.error?.message || 'API failed');
  return json.data;
}

export const PhpApi = {
  async getCsrf(){ return await fetchCsrf(); },

  async session(){
    const d = await apiFetch('/api/auth/session.php');
    return d;
  },
  async register(username, email, password, guestData=null){
    if (!csrfToken) await fetchCsrf();
    return await apiFetch('/api/auth/register.php', { method:'POST', body: JSON.stringify({ username, email, password, guestData }) });
  },
  async login(login, password){
    if (!csrfToken) await fetchCsrf();
    return await apiFetch('/api/auth/login.php', { method:'POST', body: JSON.stringify({ login, password }) });
  },
  async logout(){
    if (!csrfToken) await fetchCsrf();
    return await apiFetch('/api/auth/logout.php', { method:'POST', body: JSON.stringify({}) });
  },
  async getProfile(){
    const d = await apiFetch('/api/user/profile.php');
    return d.user;
  },
  async updateProfile(patch){
    if (!csrfToken) await fetchCsrf();
    return await apiFetch('/api/user/profile.php', { method:'POST', body: JSON.stringify(patch) });
  },
  // runs
  async submitRun(payload){
    if (!csrfToken) await fetchCsrf();
    // normalize payload to PHP expected
    const body = {
      run_id: payload.run_id,
      character_id: payload.character_id,
      seed: payload.seed,
      score: payload.score,
      distance: payload.distance,
      duration: payload.duration,
      best_combo: payload.best_combo,
      items_collected: payload.items,
      near_misses: payload.near_misses,
      powerups_used: payload.powerups,
      ability_uses: payload.ability_uses,
      environment: payload.environment,
      started_at: payload.started_at,
      finished_at: payload.finished_at
    };
    return await apiFetch('/api/runs/submit.php', { method:'POST', body: JSON.stringify(body) });
  },
  async syncRuns(runs){
    if (!csrfToken) await fetchCsrf();
    return await apiFetch('/api/sync.php', { method:'POST', body: JSON.stringify({ runs }) });
  },
  async getLeaderboard(type='global', opts={}){
    let url = '/api/leaderboard/global.php';
    if (type==='daily') url='/api/leaderboard/daily.php';
    else if (type==='weekly') url='/api/leaderboard/weekly.php';
    else if (type==='friends') url='/api/leaderboard/friends.php';
    else if (type==='character') url='/api/leaderboard/character.php?character='+(opts.character||'');
    const params = new URLSearchParams();
    if (opts.limit) params.set('limit', opts.limit);
    if (opts.offset) params.set('offset', opts.offset);
    if (opts.character && type!=='character') params.set('character', opts.character);
    if (params.toString()) url += (url.includes('?')?'&':'?')+params.toString();
    const d = await apiFetch(url);
    // normalize to {username, character_id, score, distance, cigs, combo, rank, avatar}
    const list = (d.leaderboard || d.challenges || []).map(r=>({
      username: r.username,
      character: r.character_id,
      character_id: r.character_id,
      score: r.score,
      distance: r.distance || 0,
      cigs: r.cigs || 0,
      combo: r.combo || 0,
      avatar: r.avatar || '😎',
      rank: Number(r.rank)||0,
      created_at: r.created_at,
      date: r.created_at ? new Date(r.created_at).getTime() : Date.now()
    }));
    return list;
  },
  async getMissions(){
    const d = await apiFetch('/api/missions/list.php');
    return d.missions;
  },
  async getAchievements(){
    const d = await apiFetch('/api/achievements/list.php');
    return d.achievements;
  },
  async sendFriendRequest(code){
    if (!csrfToken) await fetchCsrf();
    return await apiFetch('/api/friends/request.php', { method:'POST', body: JSON.stringify({ friend_code: code }) });
  },
  async acceptFriend(id, action='accept'){
    if (!csrfToken) await fetchCsrf();
    return await apiFetch('/api/friends/accept.php', { method:'POST', body: JSON.stringify({ id, action }) });
  },
  async listFriends(type='friends'){
    const d = await apiFetch('/api/friends/list.php?type='+type);
    return d.friends;
  },
  async createChallenge(seed, title){
    if (!csrfToken) await fetchCsrf();
    return await apiFetch('/api/challenges/create.php', { method:'POST', body: JSON.stringify({ seed, title }) });
  },
  async getChallenge(idOrSeed){
    let url='/api/challenges/get.php';
    if (typeof idOrSeed==='number' || /^\d+$/.test(String(idOrSeed))) url+='?seed='+idOrSeed;
    else if (idOrSeed) url+='?id='+idOrSeed;
    const d = await apiFetch(url);
    return d;
  },
  async listNotifications(){
    const d = await apiFetch('/api/notifications/list.php');
    return d.notifications;
  }
};

// auto-fetch CSRF on load
fetchCsrf();

// expose globally for non-module main.js
if (typeof window !== 'undefined') {
  window.PhpApi = PhpApi;
  window.isPhpBackend = true;
  // detect PHP backend availability
  fetch('/api/auth/session.php', { credentials:'include' }).then(r=>r.json()).then(j=>{
    window.phpBackendAvailable = true;
    window.dispatchEvent(new CustomEvent('php:ready'));
  }).catch(()=>{ window.phpBackendAvailable = false; });
}
