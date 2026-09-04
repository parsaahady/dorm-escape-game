import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
serve(async (req)=>{
  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'global'
  const character = url.searchParams.get('character')
  const limit = parseInt(url.searchParams.get('limit')||'20')
  const offset = parseInt(url.searchParams.get('offset')||'0')
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global:{ headers:{ Authorization: req.headers.get('Authorization')! } } })
  const { data, error } = await supabase.rpc('get_leaderboard', { p_type: type, p_character: character, p_limit: limit, p_offset: offset })
  if(error) return new Response(JSON.stringify({error:error.message}), {status:400})
  return new Response(JSON.stringify(data), {headers:{"Content-Type":"application/json"}})
})
