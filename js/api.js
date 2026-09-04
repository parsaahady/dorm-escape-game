// js/api.js — Real API layer (scores, leaderboard, friends, challenges, missions, etc.)
import { supabase, isSupabaseConfigured } from './supabase.js'

// helper to ensure auth
async function requireAuth() {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured — offline mode')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('not authenticated')
  return session
}

export const Api = {
  // ---------- RUN / SCORE ----------
  async submitRun(payload) {
    // payload: {run_id, character_id, seed, score, distance, best_combo, duration, items, near_misses, powerups, ability_uses, environment, started_at, finished_at}
    if (!isSupabaseConfigured) throw new Error('offline')
    await requireAuth()
    const { data, error } = await supabase.rpc('submit_run', {
      p_run_id: payload.run_id,
      p_character_id: payload.character_id,
      p_seed: payload.seed,
      p_score: payload.score,
      p_distance: payload.distance,
      p_best_combo: payload.best_combo,
      p_duration: payload.duration,
      p_items: payload.items,
      p_near_misses: payload.near_misses,
      p_powerups: payload.powerups,
      p_ability_uses: payload.ability_uses,
      p_environment: payload.environment,
      p_started_at: payload.started_at,
      p_finished_at: payload.finished_at,
    })
    if (error) throw error
    return data
  },

  // ---------- LEADERBOARD ----------
  async getLeaderboard(type='global', opts={}) {
    if (!isSupabaseConfigured) throw new Error('offline')
    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_type: type,
      p_character: opts.character || null,
      p_limit: opts.limit || 20,
      p_offset: opts.offset || 0
    })
    if (error) throw error
    // enrich with rank (already in RPC)
    return data
  },

  async getDailyChallenge() {
    if (!isSupabaseConfigured) throw new Error('offline')
    const { data, error } = await supabase.rpc('get_daily_challenge')
    if (error) throw error
    return data
  },

  // ---------- PROFILE ----------
  async getProfile() {
    if (!isSupabaseConfigured) throw new Error('offline')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (error) throw error
    return data
  },
  async updateProfile(patch) {
    if (!isSupabaseConfigured) throw new Error('offline')
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', user.id).select().single()
    if (error) throw error
    return data
  },
  async getStats() {
    if (!isSupabaseConfigured) throw new Error('offline')
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.rpc('get_user_stats', { p_user: user.id })
    if (error) throw error
    return data
  },

  // ---------- FRIENDS ----------
  async sendFriendRequest(friendCode) {
    if (!isSupabaseConfigured) throw new Error('offline')
    const { data, error } = await supabase.rpc('send_friend_request', { p_friend_code: friendCode })
    if (error) throw error
    return data
  },
  async acceptFriendRequest(requestId) {
    const { data, error } = await supabase.rpc('accept_friend_request', { p_request_id: requestId })
    if (error) throw error
    return data
  },
  async listFriends() {
    if (!isSupabaseConfigured) throw new Error('offline')
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('friendships')
      .select('*, requester:requester_id(username, avatar), receiver:receiver_id(username, avatar)')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status','accepted')
    if (error) throw error
    return data
  },
  async listFriendRequests() {
    if (!isSupabaseConfigured) throw new Error('offline')
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('friendships')
      .select('*, requester:requester_id(username)')
      .eq('receiver_id', user.id).eq('status','pending')
    if (error) throw error
    return data
  },

  // ---------- CHALLENGES ----------
  async createChallenge(seed, title) {
    const { data, error } = await supabase.rpc('create_challenge', { p_seed: seed, p_title: title })
    if (error) throw error
    return data // uuid
  },
  async listChallenges() {
    const { data, error } = await supabase.from('challenges').select('*').order('created_at', {ascending:false}).limit(20)
    if (error) throw error
    return data
  },
  async getChallengeResults(challengeId) {
    const { data, error } = await supabase.from('challenge_results').select('*, profiles!inner(username)').eq('challenge_id', challengeId).order('score', {ascending:false})
    if (error) throw error
    return data
  },

  // ---------- MISSIONS / ACHIEVEMENTS ----------
  async listMissions() {
    const { data, error } = await supabase.from('missions').select('*').eq('active', true)
    if (error) throw error
    return data
  },
  async myMissions() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('user_missions').select('*, missions(*)').eq('user_id', user.id)
    if (error) throw error
    return data
  },
  async listAchievements() {
    const { data, error } = await supabase.from('achievements').select('*')
    if (error) throw error
    return data
  },
  async myAchievements() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('user_achievements').select('*, achievements(*)').eq('user_id', user.id)
    if (error) throw error
    return data
  },

  // ---------- NOTIFICATIONS ----------
  async listNotifications() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', {ascending:false}).limit(20)
    if (error) throw error
    return data
  },
  async markNotificationRead(id) {
    const { error } = await supabase.from('notifications').update({read:true}).eq('id', id)
    if (error) throw error
  },

  // ---------- REALTIME ----------
  subscribeLeaderboard(cb) {
    if (!isSupabaseConfigured) return { unsubscribe(){} }
    const ch = supabase.channel('leaderboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scores' }, cb)
      .subscribe()
    return ch
  },
  subscribeFriendRequests(cb) {
    if (!isSupabaseConfigured) return { unsubscribe(){} }
    const ch = supabase.channel('friend_requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friendships' }, cb)
      .subscribe()
    return ch
  }
}
