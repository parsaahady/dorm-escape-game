// supabase/functions/submit-run — Edge Function (Deno) — alternative to RPC
// Deploy: supabase functions deploy submit-run --no-verify-jwt false
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: 'not authenticated' }), { status: 401 })

  const body = await req.json()
  const { run_id, character_id, seed, score, distance, best_combo, duration, items, near_misses, powerups, ability_uses, environment, started_at, finished_at } = body

  // call RPC submit_run
  const { data, error } = await supabase.rpc('submit_run', {
    p_run_id: run_id,
    p_character_id: character_id,
    p_seed: seed,
    p_score: score,
    p_distance: distance,
    p_best_combo: best_combo,
    p_duration: duration,
    p_items: items,
    p_near_misses: near_misses,
    p_powerups: powerups,
    p_ability_uses: ability_uses,
    p_environment: environment,
    p_started_at: started_at,
    p_finished_at: finished_at,
  })
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } })
})
