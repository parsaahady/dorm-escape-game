-- 20250904000002_rls.sql — Row Level Security

-- enable RLS
alter table public.profiles enable row level security;
alter table public.user_characters enable row level security;
alter table public.runs enable row level security;
alter table public.scores enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.missions enable row level security;
alter table public.user_missions enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.weekly_leagues enable row level security;
alter table public.weekly_player_stats enable row level security;
alter table public.friendships enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_results enable row level security;
alter table public.notifications enable row level security;
alter table public.idempotency_keys enable row level security;

-- helper: is authenticated?
-- auth.uid() returns current user id

-- PROFILES
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- prevent direct level/xp update via RLS? we allow but RPC will be authoritative; client cannot escalate via simple update due to check? we add trigger to prevent direct xp inflation later
-- For now allow own update but server functions will be used for xp

-- USER_CHARACTERS
create policy "uc_select_own" on public.user_characters for select using (auth.uid() = user_id);
create policy "uc_select_all_for_leaderboard" on public.user_characters for select using (true); -- for public stats (optional, restrict)
create policy "uc_insert_own" on public.user_characters for insert with check (auth.uid() = user_id);
create policy "uc_update_own" on public.user_characters for update using (auth.uid() = user_id);

-- RUNS
create policy "runs_select_all_verified" on public.runs for select using (status = 'verified' or auth.uid() = user_id);
create policy "runs_insert_own" on public.runs for insert with check (auth.uid() = user_id);
-- no update/delete for clients; only service_role

-- SCORES
create policy "scores_select_all_verified" on public.scores for select using (status = 'verified' or auth.uid() = user_id);
create policy "scores_insert_own" on public.scores for insert with check (auth.uid() = user_id);

-- ACHIEVEMENTS (public read)
create policy "ach_select_all" on public.achievements for select using (true);
-- no insert/update for anon

-- USER_ACHIEVEMENTS
create policy "ua_select_own" on public.user_achievements for select using (auth.uid() = user_id);
create policy "ua_insert_own" on public.user_achievements for insert with check (auth.uid() = user_id);
create policy "ua_update_own" on public.user_achievements for update using (auth.uid() = user_id);
-- but unlock should be via RPC, we still allow but server will validate

-- MISSIONS (public read)
create policy "missions_select_all" on public.missions for select using (true);

-- USER_MISSIONS
create policy "um_select_own" on public.user_missions for select using (auth.uid() = user_id);
create policy "um_insert_own" on public.user_missions for insert with check (auth.uid() = user_id);
create policy "um_update_own" on public.user_missions for update using (auth.uid() = user_id);

-- DAILY_CHALLENGES
create policy "daily_select_all" on public.daily_challenges for select using (true);

-- WEEKLY
create policy "weekly_select_all" on public.weekly_leagues for select using (true);
create policy "weekly_stats_select_all" on public.weekly_player_stats for select using (true);
-- insert/update only via service_role / RPC

-- FRIENDSHIPS
create policy "friendships_select_own" on public.friendships for select using (auth.uid() = requester_id or auth.uid() = receiver_id);
create policy "friendships_insert_own" on public.friendships for insert with check (auth.uid() = requester_id);
create policy "friendships_update_own" on public.friendships for update using (auth.uid() = requester_id or auth.uid() = receiver_id);
create policy "friendships_delete_own" on public.friendships for delete using (auth.uid() = requester_id or auth.uid() = receiver_id);

-- CHALLENGES
create policy "challenges_select_all" on public.challenges for select using (true);
create policy "challenges_insert_own" on public.challenges for insert with check (auth.uid() = creator_id);

-- CHALLENGE_RESULTS
create policy "cr_select_all" on public.challenge_results for select using (true);
create policy "cr_insert_own" on public.challenge_results for insert with check (auth.uid() = user_id);

-- NOTIFICATIONS
create policy "notif_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notif_update_own" on public.notifications for update using (auth.uid() = user_id);
-- insert via service_role only

-- IDEMPOTENCY
create policy "idem_select_own" on public.idempotency_keys for select using (auth.uid() = user_id);
create policy "idem_insert_own" on public.idempotency_keys for insert with check (auth.uid() = user_id);

-- prevent direct xp/reputation manipulation via trigger
create or replace function public.prevent_direct_xp_update()
returns trigger language plpgsql as $$
begin
  -- allow only service_role to change level/xp directly? For anon/authenticated, we still allow but log
  -- we will make xp updates only via RPC; to enforce, we check if request is via RPC (we set custom claim)
  -- simple: if xp increased by > 1000 in one update, reject (except service_role)
  if (auth.role() = 'authenticated' and new.xp > old.xp + 1000) then
    raise exception 'XP update too large, use RPC';
  end if;
  return new;
end; $$;

-- Note: enable only if needed, currently commented to allow normal sync
-- create trigger trg_prevent_xp before update on public.profiles for each row execute function public.prevent_direct_xp_update();
