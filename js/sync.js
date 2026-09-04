// js/sync.js — Offline Sync Manager (pendingRuns queue + conflict resolution)
import { supabase, isSupabaseConfigured } from './supabase.js'
import { Api } from './api.js'

const STORAGE_KEY = 'dorm_v3'

function loadDB() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch(e){ return null }
}
function saveDB(db){ localStorage.setItem(STORAGE_KEY, JSON.stringify(db)) }

export const SyncManager = {
  status: 'synced', // synced, offline, syncing, error
  listeners: [],
  pendingCount(){ try{ const db=JSON.parse(localStorage.getItem('dorm_v3')||'{}'); return db?.pendingRuns?.length||0 }catch(e){return 0} },

  onStatus(cb){ this.listeners.push(cb); return ()=> this.listeners=this.listeners.filter(x=>x!==cb) },
  setStatus(s){
    this.status=s
    this.listeners.forEach(cb=> cb(s))
    const el=document.getElementById('syncStatus')
    if(el){
      el.textContent = s==='synced' ? '✓ همگام' : s==='syncing' ? '☁️ Syncing...' : s==='offline' ? '📡 آفلاین' : '⚠️ خطا'
      el.style.color = s==='synced' ? '#a7f3d0' : s==='offline' ? '#ffd93d' : '#ff8a80'
    }
    window.dispatchEvent(new CustomEvent('sync:status', {detail:s}))
  },

  async syncPendingRuns() {
    if (!isSupabaseConfigured) { this.setStatus('offline'); return }
    const db = loadDB(); if(!db || !db.pendingRuns || db.pendingRuns.length===0){ this.setStatus('synced'); return }
    if (!navigator.onLine) { this.setStatus('offline'); return }
    // check auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { this.setStatus('offline'); return }

    this.setStatus('syncing')
    const pending = [...db.pendingRuns]
    let success=0, failed=0
    for(const run of pending){
      try{
        // idempotency: run_id is run.run_id or generate
        const payload = {
          run_id: run.run_id || run.id || crypto.randomUUID(),
          character_id: run.character || run.character_id,
          seed: run.seed,
          score: run.score,
          distance: run.distance,
          best_combo: run.combo || run.best_combo || 0,
          duration: run.duration || Math.floor(run.run_duration||60),
          items: run.cigs || run.items_collected || 0,
          near_misses: run.nearMiss || run.near_misses || 0,
          powerups: run.powerups_used || 0,
          ability_uses: run.abilityUses || 0,
          environment: run.environment || 'dorm',
          started_at: run.started_at || new Date(run.date||Date.now()).toISOString(),
          finished_at: run.finished_at || new Date((run.date||Date.now())+ (run.duration||60)*1000).toISOString(),
        }
        await Api.submitRun(payload)
        // remove from queue on success
        db.pendingRuns = db.pendingRuns.filter(x => x.run_id !== run.run_id && x.date !== run.date)
        saveDB(db)
        success++
      } catch(e){
        console.warn('[sync] failed', run, e.message)
        // if rejected (cheat), remove and mark flagged
        if(e.message && e.message.includes('rejected')){
          db.pendingRuns = db.pendingRuns.filter(x => x.run_id !== run.run_id)
          saveDB(db)
        }
        failed++
        // exponential backoff: stop after 3 fails
        if(failed>3) break
      }
      // small delay to avoid rate limit
      await new Promise(r=>setTimeout(r, 200))
    }
    if(failed===0) this.setStatus('synced')
    else this.setStatus('error')
    return {success, failed}
  },

  queueRun(run){
    const db=loadDB(); if(!db) return
    db.pendingRuns = db.pendingRuns || []
    // ensure run_id
    run.run_id = run.run_id || crypto.randomUUID()
    run.date = run.date || Date.now()
    run.started_at = run.started_at || new Date().toISOString()
    run.finished_at = run.finished_at || new Date(Date.now()+ (run.duration||60)*1000).toISOString()
    db.pendingRuns.unshift(run)
    if(db.pendingRuns.length>50) db.pendingRuns.pop()
    saveDB(db)
    this.setStatus('offline')
    // try sync if online
    if(navigator.onLine && isSupabaseConfigured){
      setTimeout(()=> this.syncPendingRuns(), 1000)
    }
  },

  // Conflict resolution — server authoritative for XP/level, append for scores, union for achievements
  async resolveConflicts(){
    if(!isSupabaseConfigured) return
    const { data: { user } } = await supabase.auth.getUser()
    if(!user) return
    const db=loadDB(); if(!db) return
    // fetch server profile
    const { data: serverProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if(!serverProfile) return
    // XP: server authoritative (take max)
    if(serverProfile.xp > db.xp.xp){
      db.xp.xp = serverProfile.xp
      db.xp.level = serverProfile.level
      db.xp.totalXp = serverProfile.total_xp
      saveDB(db)
      console.log('[sync] xp resolved to server', serverProfile.xp)
    } else if(db.xp.xp > serverProfile.xp){
      // we have more xp locally (offline), keep local but will be reconciled via next submit
    }
    // achievements: union (server has truth, but local may have unlocked offline)
    // we already handle via check_achievements RPC after run
    // scores: append-only, no conflict
  },

  init(){
    window.addEventListener('online', ()=> {
      console.log('[sync] online')
      this.syncPendingRuns()
      this.resolveConflicts()
    })
    window.addEventListener('offline', ()=> this.setStatus('offline'))
    // periodic sync every 30s if pending
    setInterval(()=> {
      const db=loadDB()
      if(db?.pendingRuns?.length>0 && navigator.onLine) this.syncPendingRuns()
    }, 30000)
    // initial
    if(!navigator.onLine) this.setStatus('offline')
  }
}

// auto init when imported
SyncManager.init()
