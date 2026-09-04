// js/supabase.js — Supabase client (ESM via CDN) + helpers
// این فایل در index.html با type="module" لود می‌شود
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const url = localStorage.getItem('supabase_url') ? JSON.parse(localStorage.getItem('supabase_url')) : null
const key = localStorage.getItem('supabase_key') ? JSON.parse(localStorage.getItem('supabase_key')) : null
// fallback to env via meta (for GitHub Pages secrets)
const metaUrl = document.querySelector('meta[name="supabase-url"]')?.content
const metaKey = document.querySelector('meta[name="supabase-anon-key"]')?.content
const SUPABASE_URL = url || metaUrl || (window.__ENV__?.SUPABASE_URL) || null
const SUPABASE_KEY = key || metaKey || (window.__ENV__?.SUPABASE_ANON_KEY) || null

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_KEY)

let supabase = null
if (isSupabaseConfigured) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  })
  console.log('[supabase] configured', SUPABASE_URL.slice(0,30)+'...')
} else {
  console.warn('[supabase] not configured — running offline/fake mode. Set localStorage supabase_url/key or add meta tags.')
}

export { supabase, SUPABASE_URL, SUPABASE_KEY }

// helpers
export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}
export async function getUser() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user
}
export function onAuthChange(cb) {
  if (!supabase) return { data: { subscription: { unsubscribe(){} } } }
  return supabase.auth.onAuthStateChange(cb)
}
