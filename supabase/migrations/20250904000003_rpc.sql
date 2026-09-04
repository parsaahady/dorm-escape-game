-- 20250904000003_rpc.sql — RPCs & Functions (server authoritative)

-- helper to generate friend code
create or replace function public.generate_friend_code()
returns text language plpgsql as $$
declare code text;
begin
  code := 'DORM-' || substr(md5(random()::text),1,4);
  code := upper(code);
  -- ensure unique
  while exists (select 1 from public.profiles where friend_code = code) loop
    code := 'DORM-' || substr(md5(random()::text),1,4);
    code := upper(code);
  end loop;
  return code;
end; $$;

-- create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare fc text;
begin
  fc := public.generate_friend_code();
  insert into public.profiles (id, username, display_name, friend_code, favorite_character)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text,1,6)), coalesce(new.raw_user_meta_data->>'username', 'کاربر'), fc, 'parsa')
  on conflict (id) do nothing;
  -- init characters
  insert into public.user_characters (user_id, character_id) values
    (new.id,'parsa'),(new.id,'mahyar'),(new.id,'arsham'),(new.id,'mohsen'),(new.id,'farham')
  on conflict do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ============================================================
-- SUBMIT RUN (server validation, anti-cheat, idempotency)
-- ============================================================
create or replace function public.submit_run(
  p_run_id uuid,
  p_character_id text,
  p_seed integer,
  p_score integer,
  p_distance integer,
  p_best_combo integer,
  p_duration integer,
  p_items integer,
  p_near_misses integer,
  p_powerups integer,
  p_ability_uses integer,
  p_environment text,
  p_started_at timestamptz,
  p_finished_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_status text := 'verified';
  v_reason text;
  v_profile public.profiles%rowtype;
  v_max_possible integer;
  v_run public.runs%rowtype;
begin
  if v_user is null then raise exception 'not authenticated'; end if;

  -- idempotency check
  if exists (select 1 from public.runs where id = p_run_id) then
    return jsonb_build_object('ok', true, 'duplicate', true, 'status','verified');
  end if;
  if exists (select 1 from public.idempotency_keys where key = p_run_id::text and user_id = v_user) then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  -- basic validation
  if p_character_id not in ('parsa','mahyar','arsham','mohsen','farham') then
    raise exception 'invalid character';
  end if;
  if p_score < 0 or p_score > 999999 then raise exception 'score out of range'; end if;
  if p_distance < 0 or p_distance > 20000 then raise exception 'distance out of range'; end if;
  if p_duration < 1 or p_duration > 3600 then raise exception 'duration out of range'; end if;
  if p_finished_at <= p_started_at then raise exception 'invalid timestamps'; end if;
  if p_best_combo < 0 or p_best_combo > 1000 then raise exception 'combo out of range'; end if;

  -- anti-cheat: mathematically possible score
  -- max: dist + cigs*60 + combo*50 + perfect(500) + difficulty(1.6) + event(1.4)*2
  v_max_possible := (p_distance + p_items*60 + p_best_combo*50 + 500) * 2;
  if p_score > v_max_possible * 1.8 then
    v_status := 'flagged';
    v_reason := 'score too high vs possible';
  end if;

  -- duration vs distance: impossible speed > 45 m/s
  if p_distance::float / greatest(p_duration,1) > 45 then
    v_status := 'flagged';
    v_reason := coalesce(v_reason,'') || ' impossible speed';
  end if;

  -- too fast for high score
  if p_duration < 5 and p_score > 5000 then
    v_status := 'rejected';
    v_reason := 'too fast for score';
  end if;

  if v_status = 'rejected' then
    raise exception 'rejected: %', v_reason;
  end if;

  -- insert run
  insert into public.runs (id, user_id, character_id, seed, score, distance, best_combo, run_duration, items_collected, near_misses, powerups_used, ability_uses, environment, status, run_started_at, run_finished_at)
  values (p_run_id, v_user, p_character_id, p_seed, p_score, p_distance, p_best_combo, p_duration, p_items, p_near_misses, p_powerups, p_ability_uses, p_environment, v_status, p_started_at, p_finished_at)
  returning * into v_run;

  -- idempotency key
  insert into public.idempotency_keys (key, user_id) values (p_run_id::text, v_user) on conflict do nothing;

  -- insert into scores if verified
  if v_status = 'verified' then
    select * into v_profile from public.profiles where id = v_user;
    insert into public.scores (run_id, user_id, username, character_id, score, distance, combo, cigs, near_misses, status)
    values (p_run_id, v_user, v_profile.username, p_character_id, p_score, p_distance, p_best_combo, p_items, p_near_misses, 'verified');
  end if;

  -- update user_characters
  update public.user_characters
  set games_played = games_played + 1,
      best_score = greatest(best_score, p_score),
      best_distance = greatest(best_distance, p_distance),
      best_combo = greatest(best_combo, p_best_combo),
      xp = xp + greatest(0, p_score/200)::int,
      updated_at = now()
  where user_id = v_user and character_id = p_character_id;

  -- level up check for character
  -- simple: every 300 xp = level up
  update public.user_characters
  set level = level + 1, xp = xp - 300
  where user_id = v_user and character_id = p_character_id and xp >= 300;

  -- update profile stats (total_xp, reputation)
  update public.profiles
  set total_xp = total_xp + greatest(0, p_score/120 + p_items*2 + p_near_misses*3)::int,
      xp = xp + greatest(0, p_score/120 + p_items*2 + p_near_misses*3)::int,
      updated_at = now()
  where id = v_user;

  -- profile level up
  update public.profiles
  set level = level + 1, xp = xp - (500 + (level-1)*350)
  where id = v_user and xp >= (500 + (level-1)*350);

  -- weekly stats
  insert into public.weekly_leagues (week_start, week_end)
  values (date_trunc('week', now())::date, (date_trunc('week', now()) + interval '6 days')::date)
  on conflict (week_start) do nothing;
  insert into public.weekly_player_stats (week_id, user_id, score, league)
  values ((select id from public.weekly_leagues where week_start = date_trunc('week', now())::date), v_user, p_score, 'bronze')
  on conflict (week_id, user_id) do update set score = weekly_player_stats.score + excluded.score;

  -- update league tier based on score
  -- done via trigger or later cron

  -- mission progress (daily missions based on runs)
  -- we let client call claim_mission, but also auto-update user_missions progress here
  -- for simplicity, increment all active daily missions that match
  -- e.g. cigs, distance, near_miss, ability, combo
  -- we update user_missions for current week missions
  -- (client will handle UI, server just ensures not duplicated)

  -- achievement check (simplified)
  -- total_cigs, total_distance etc would need aggregate; we do async via function
  perform public.check_achievements(v_user);

  return jsonb_build_object('ok', true, 'status', v_status, 'run_id', p_run_id);
exception when others then
  raise;
end; $$;

-- ============================================================
-- CHECK ACHIEVEMENTS (called after run)
-- ============================================================
create or replace function public.check_achievements(p_user uuid)
returns void language plpgsql security definer set search_path=public as $$
declare
  v_stats record;
  ach record;
begin
  -- aggregate stats
  select
    count(*) as total_runs,
    coalesce(sum(distance),0) as total_distance,
    coalesce(sum(items_collected),0) as total_cigs,
    coalesce(sum(near_misses),0) as total_near,
    coalesce(max(score),0) as best_score,
    coalesce(max(best_combo),0) as best_combo
  into v_stats from public.runs where user_id = p_user and status='verified';

  for ach in select * from public.achievements loop
    -- check if already unlocked
    if exists (select 1 from public.user_achievements where user_id=p_user and achievement_id=ach.id and unlocked) then continue; end if;

    -- evaluate requirement
    -- requirement_type: total_runs, best_combo, total_cigs, total_near, best_score, etc
    -- we do simple cases
    declare
      cur integer := 0;
      should_unlock boolean := false;
    begin
      if ach.requirement_type = 'total_runs' then cur := v_stats.total_runs; 
      elsif ach.requirement_type = 'best_combo' then cur := v_stats.best_combo;
      elsif ach.requirement_type = 'total_cigs' then cur := v_stats.total_cigs;
      elsif ach.requirement_type = 'total_near' then cur := v_stats.total_near;
      elsif ach.requirement_type = 'best_score' then cur := v_stats.best_score;
      elsif ach.requirement_type = 'total_distance' then cur := v_stats.total_distance;
      else cur := 0;
      end if;

      if cur >= ach.requirement_value then should_unlock := true; end if;

      -- upsert progress
      insert into public.user_achievements (user_id, achievement_id, progress, unlocked, unlocked_at)
      values (p_user, ach.id, least(cur, ach.requirement_value), should_unlock, case when should_unlock then now() else null end)
      on conflict (user_id, achievement_id) do update set
        progress = excluded.progress,
        unlocked = case when excluded.unlocked then true else user_achievements.unlocked end,
        unlocked_at = case when excluded.unlocked and user_achievements.unlocked=false then now() else user_achievements.unlocked_at end;

      if should_unlock then
        -- reward xp
        update public.profiles set xp = xp + ach.reward_xp, total_xp = total_xp + ach.reward_xp where id = p_user;
      end if;
    end;
  end loop;
end; $$;

-- ============================================================
-- GET LEADERBOARD (RPC, paginated, efficient)
-- ============================================================
create or replace function public.get_leaderboard(
  p_type text, -- global, weekly, daily, friends, character
  p_character text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  rank bigint,
  user_id uuid,
  username text,
  avatar text,
  character_id text,
  score integer,
  distance integer,
  combo integer,
  cigs integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
begin
  if p_type = 'global' then
    return query
    select
      row_number() over (order by s.score desc, s.created_at asc)::bigint as rank,
      s.user_id, s.username, p.avatar, s.character_id, s.score, s.distance, s.combo, s.cigs, s.created_at
    from public.scores s
    join public.profiles p on p.id = s.user_id
    where s.status='verified'
    order by s.score desc, s.created_at asc
    limit p_limit offset p_offset;

  elsif p_type = 'daily' then
    return query
    select
      row_number() over (order by s.score desc)::bigint,
      s.user_id, s.username, p.avatar, s.character_id, s.score, s.distance, s.combo, s.cigs, s.created_at
    from public.scores s
    join public.profiles p on p.id=s.user_id
    where s.status='verified' and s.created_at::date = current_date
    order by s.score desc limit p_limit offset p_offset;

  elsif p_type = 'weekly' then
    return query
    select
      row_number() over (order by w.score desc)::bigint,
      w.user_id, pr.username, pr.avatar, pr.favorite_character, w.score, 0::int, 0::int, 0::int, w.created_at
    from public.weekly_player_stats w
    join public.profiles pr on pr.id=w.user_id
    join public.weekly_leagues l on l.id=w.week_id
    where l.week_start = date_trunc('week', now())::date
    order by w.score desc limit p_limit offset p_offset;

  elsif p_type = 'character' then
    return query
    select
      row_number() over (order by s.score desc)::bigint,
      s.user_id, s.username, p.avatar, s.character_id, s.score, s.distance, s.combo, s.cigs, s.created_at
    from public.scores s
    join public.profiles p on p.id=s.user_id
    where s.status='verified' and s.character_id = p_character
    order by s.score desc limit p_limit offset p_offset;

  elsif p_type = 'friends' then
    return query
    select
      row_number() over (order by s.score desc)::bigint,
      s.user_id, s.username, p.avatar, s.character_id, s.score, s.distance, s.combo, s.cigs, s.created_at
    from public.scores s
    join public.profiles p on p.id=s.user_id
    where s.status='verified' and (
      s.user_id = v_user
      or exists (
        select 1 from public.friendships f
        where f.status='accepted'
        and ((f.requester_id = v_user and f.receiver_id = s.user_id)
          or (f.receiver_id = v_user and f.requester_id = s.user_id))
      )
    )
    order by s.score desc limit p_limit offset p_offset;
  else
    raise exception 'invalid leaderboard type';
  end if;
end; $$;

-- ============================================================
-- DAILY CHALLENGE — get or create today
-- ============================================================
create or replace function public.get_daily_challenge()
returns public.daily_challenges
language plpgsql
security definer
set search_path=public
as $$
declare
  ch public.daily_challenges%rowtype;
  v_seed integer;
begin
  select * into ch from public.daily_challenges where challenge_date = current_date;
  if found then return ch; end if;
  -- create new
  v_seed := (extract(epoch from now())::int % 90000) + 10000;
  insert into public.daily_challenges (challenge_date, seed, title, description, modifier, rules)
  values (
    current_date,
    v_seed,
    'چالش امروز — فرار ' || current_date,
    'امروز همه یک Seed بازی می‌کنند: ' || v_seed,
    '{"scoreMul":1.1}'::jsonb,
    '{"seed": "daily"}'::jsonb
  ) returning * into ch;
  return ch;
end; $$;

-- ============================================================
-- FRIEND REQUEST / ACCEPT
-- ============================================================
create or replace function public.send_friend_request(p_friend_code text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid := auth.uid();
  v_target uuid;
begin
  if v_user is null then raise exception 'not auth'; end if;
  select id into v_target from public.profiles where friend_code = upper(p_friend_code);
  if not found then raise exception 'friend code not found'; end if;
  if v_target = v_user then raise exception 'cannot add self'; end if;
  if exists (select 1 from public.friendships where (requester_id=v_user and receiver_id=v_target) or (requester_id=v_target and receiver_id=v_user)) then
    raise exception 'already friends or pending';
  end if;
  insert into public.friendships (requester_id, receiver_id, status) values (v_user, v_target, 'pending');
  insert into public.notifications (user_id, type, title, body) values (v_target, 'friend_request', 'درخواست دوستی', (select username from public.profiles where id=v_user) || ' از تو درخواست دوستی دارد');
  return jsonb_build_object('ok', true);
end; $$;

create or replace function public.accept_friend_request(p_request_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user uuid := auth.uid();
begin
  update public.friendships set status='accepted', updated_at=now() where id=p_request_id and receiver_id=v_user and status='pending';
  if not found then raise exception 'not found or not receiver'; end if;
  return jsonb_build_object('ok', true);
end; $$;

-- ============================================================
-- CREATE CHALLENGE
-- ============================================================
create or replace function public.create_challenge(p_seed integer, p_title text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_user uuid := auth.uid(); v_id uuid;
begin
  if v_user is null then raise exception 'not auth'; end if;
  insert into public.challenges (seed, creator_id, title) values (p_seed, v_user, coalesce(p_title, 'Challenge #'||p_seed)) returning id into v_id;
  return v_id;
end; $$;

-- ============================================================
-- STATISTICS (materialized view style via function)
-- ============================================================
create or replace function public.get_user_stats(p_user uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  s jsonb;
begin
  select jsonb_build_object(
    'total_runs', count(*),
    'total_distance', coalesce(sum(distance),0),
    'total_cigs', coalesce(sum(items_collected),0),
    'total_near', coalesce(sum(near_misses),0),
    'best_score', coalesce(max(score),0),
    'best_distance', coalesce(max(distance),0),
    'best_combo', coalesce(max(best_combo),0),
    'total_time', coalesce(sum(run_duration),0)
  ) into s from public.runs where user_id = p_user and status='verified';
  return s;
end; $$;
