// js/auth.js — Guest, Email, OAuth + Guest→Account migration
import { supabase, isSupabaseConfigured } from './supabase.js'

export const Auth = {
  async signUp(email, password, username) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username } }
    })
    if (error) throw error
    // profile will be created via trigger handle_new_user
    await this.migrateGuestToAccount(data.user.id)
    return data
  },
  async signIn(email, password) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await this.migrateGuestToAccount(data.user.id)
    return data
  },
  async signInAnonymously() {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    return data
  },
  async signInWithOAuth(provider) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: location.href } })
    if (error) throw error
    return data
  },
  async signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  },
  async migrateGuestToAccount(userId) {
    // read local guest data (dorm_v3) and push to server via RPC
    try {
      const raw = localStorage.getItem('dorm_v3')
      if (!raw) return
      const db = JSON.parse(raw)
      // if guest had no username or no runs, skip
      if (!db || db.player?.guest === false) return
      // we will send pendingRuns one by one via submit_run (handled elsewhere)
      // also ensure profile username sync
      if (db.player.username && db.player.username.startsWith('مهمان') === false) {
        await supabase.from('profiles').update({ username: db.player.username }).eq('id', userId)
      }
      console.log('[auth] guest migration queued for', userId)
    } catch(e) { console.warn('migration failed', e) }
  },
  async getProfile() {
    if (!supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (error) throw error
    return data
  },
  async updateProfile(patch) {
    if (!supabase) throw new Error('no supabase')
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', user.id).select().single()
    if (error) throw error
    return data
  },
  async deleteAccount() {
    if (!supabase) throw new Error('no supabase')
    // This should be done via Edge Function with service_role for safety
    // Here we call RPC that deletes auth user (requires service_role, so we call function)
    const { error } = await supabase.rpc('delete_own_account')
    if (error) throw error
  }
}
