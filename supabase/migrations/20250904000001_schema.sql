-- 20250904000001_schema.sql — dorm-escape v3 full schema
-- PostgreSQL 15, Supabase

-- extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (1:1 با auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 2 and 14),
  display_name text,
  avatar text default '😎',
  friend_code text unique not null,
  level integer not null default 1 check (level >= 1),
  xp integer not null default 0 check (xp >= 0),
  total_xp integer not null default 0 check (total_xp >= 0),
  reputation integer not null default 0 check (reputation >= 0),
  reputation_rank text not null default 'مهمان',
  favorite_character text not null default 'parsa' check (favorite_character in ('parsa','mahyar','arsham','mohsen','farham')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_username on public.profiles(username);
create index idx_profiles_friend_code on public.profiles(friend_code);
create index idx_profiles_level on public.profiles(level desc);

-- trigger updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.handle_updated_at();

-- ============================================================
-- USER_CHARACTERS
-- ============================================================
create table public.user_characters (
  user_id uuid not null references public.profiles(id) on delete cascade,
  character_id text not null check (character_id in ('parsa','mahyar','arsham','mohsen','farham')),
  level integer not null default 1 check (level >= 1),
  xp integer not null default 0 check (xp >= 0),
  games_played integer not null default 0 check (games_played >= 0),
  best_score integer not null default 0 check (best_score >= 0),
  best_distance integer not null default 0 check (best_distance >= 0),
  best_combo integer not null default 0 check (best_combo >= 0),
  unlocked boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, character_id)
);
create index idx_user_characters_user on public.user_characters(user_id);

-- ============================================================
-- RUNS (هر Run یک رکورد — قابل Audit)
-- ============================================================
create table public.runs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  character_id text not null check (character_id in ('parsa','mahyar','arsham','mohsen','farham')),
  seed integer not null,
  score integer not null check (score between 0 and 999999),
  distance integer not null check (distance between 0 and 20000),
  best_combo integer not null default 0 check (best_combo between 0 and 1000),
  run_duration integer not null check (run_duration between 1 and 3600), -- seconds
  items_collected integer not null default 0 check (items_collected between 0 and 5000),
  near_misses integer not null default 0 check (near_misses between 0 and 5000),
  powerups_used integer not null default 0 check (powerups_used between 0 and 100),
  ability_uses integer not null default 0 check (ability_uses between 0 and 100),
  environment text,
  status text not null default 'verified' check (status in ('pending','verified','flagged','rejected')),
  run_started_at timestamptz not null,
  run_finished_at timestamptz not null,
  daily_challenge_id uuid,
  weekly_challenge_id uuid,
  created_at timestamptz not null default now(),
  constraint chk_duration check (run_finished_at > run_started_at)
);
create index idx_runs_user on public.runs(user_id);
create index idx_runs_score on public.runs(score desc);
create index idx_runs_created on public.runs(created_at desc);
create index idx_runs_character on public.runs(character_id);
create index idx_runs_status on public.runs(status);
create index idx_runs_user_created on public.runs(user_id, created_at desc);
-- idempotency: یک run_id فقط یک بار
-- runs.id is uuid primary key, client generates and sends

-- ============================================================
-- SCORES (view materialized-ish برای لیدربورد — یا همان runs با status verified)
-- برای سادگی، scores همان runs verified است، اما جدول جدا برای query سریع:
-- ما از runs استفاده می‌کنیم؛ scores یک view است
-- ولی برای سازگاری با spec، جدول scores را هم می‌سازیم (append-only)
-- ============================================================
create table public.scores (
  id bigint generated always as identity primary key,
  run_id uuid not null unique references public.runs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  username text not null,
  character_id text not null check (character_id in ('parsa','mahyar','arsham','mohsen','farham')),
  score integer not null check (score between 0 and 999999),
  distance integer not null,
  combo integer not null default 0,
  cigs integer not null default 0,
  near_misses integer not null default 0,
  status text not null default 'verified' check (status in ('verified','flagged','rejected')),
  created_at timestamptz not null default now()
);
create index idx_scores_score on public.scores(score desc);
create index idx_scores_user on public.scores(user_id);
create index idx_scores_character on public.scores(character_id);
create index idx_scores_created on public.scores(created_at desc);
create index idx_scores_status_score on public.scores(status, score desc) where status='verified';

-- ============================================================
-- ACHIEVEMENTS (static)
-- ============================================================
create table public.achievements (
  id text primary key, -- e.g. 'first_run'
  key text unique not null,
  name text not null,
  description text not null,
  icon text not null,
  category text not null default 'general',
  requirement_type text not null, -- total_runs, best_combo, total_cigs, etc
  requirement_value integer not null check (requirement_value > 0),
  reward_xp integer not null default 200 check (reward_xp >= 0),
  created_at timestamptz not null default now()
);

create table public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  progress integer not null default 0 check (progress >= 0),
  unlocked boolean not null default false,
  unlocked_at timestamptz,
  primary key (user_id, achievement_id)
);
create index idx_user_ach_user on public.user_achievements(user_id);
create index idx_user_ach_unlocked on public.user_achievements(user_id) where unlocked = true;

-- ============================================================
-- MISSIONS
-- ============================================================
create table public.missions (
  id text primary key,
  type text not null check (type in ('daily','weekly')),
  title text not null,
  description text not null,
  requirement_type text not null, -- cigs, distance, near_miss, ability, combo, score, etc
  requirement_value integer not null check (requirement_value > 0),
  reward_xp integer not null default 100 check (reward_xp >= 0),
  reward_reputation integer not null default 0,
  start_at timestamptz,
  end_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_missions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id text not null references public.missions(id) on delete cascade,
  progress integer not null default 0 check (progress >= 0),
  completed boolean not null default false,
  completed_at timestamptz,
  primary key (user_id, mission_id)
);
create index idx_user_missions_user on public.user_missions(user_id);
create index idx_user_missions_completed on public.user_missions(user_id) where completed = false;

-- ============================================================
-- DAILY CHALLENGES
-- ============================================================
create table public.daily_challenges (
  id uuid primary key default uuid_generate_v4(),
  challenge_date date unique not null,
  seed integer not null,
  title text not null,
  description text not null,
  modifier jsonb not null default '{}'::jsonb, -- {speed:1.2, nearMul:2, ...}
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_daily_date on public.daily_challenges(challenge_date desc);

-- ============================================================
-- WEEKLY LEAGUES
-- ============================================================
create table public.weekly_leagues (
  id uuid primary key default uuid_generate_v4(),
  week_start date not null,
  week_end date not null,
  created_at timestamptz not null default now(),
  constraint chk_week check (week_end > week_start),
  unique (week_start)
);
create table public.weekly_player_stats (
  week_id uuid not null references public.weekly_leagues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null default 0 check (score >= 0),
  rank integer,
  league text not null default 'bronze' check (league in ('bronze','silver','gold','diamond')),
  created_at timestamptz not null default now(),
  primary key (week_id, user_id)
);
create index idx_weekly_stats_week_score on public.weekly_player_stats(week_id, score desc);
create index idx_weekly_stats_user on public.weekly_player_stats(user_id);

-- ============================================================
-- FRIENDSHIPS
-- ============================================================
create table public.friendships (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_not_self check (requester_id <> receiver_id),
  unique (requester_id, receiver_id)
);
create index idx_friendships_requester on public.friendships(requester_id);
create index idx_friendships_receiver on public.friendships(receiver_id);
create index idx_friendships_status on public.friendships(status);
create trigger trg_friendships_updated before update on public.friendships for each row execute function public.handle_updated_at();

-- ============================================================
-- CHALLENGES (Friend Challenge)
-- ============================================================
create table public.challenges (
  id uuid primary key default uuid_generate_v4(),
  seed integer not null,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  character_rules text,
  difficulty text,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);
create index idx_challenges_creator on public.challenges(creator_id);
create index idx_challenges_seed on public.challenges(seed);

create table public.challenge_results (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  run_id uuid not null references public.runs(id) on delete cascade,
  score integer not null check (score between 0 and 999999),
  created_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);
create index idx_challenge_results_challenge on public.challenge_results(challenge_id, score desc);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null, -- friend_request, rank_change, challenge, mission, achievement
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications(user_id, created_at desc);
create index idx_notifications_unread on public.notifications(user_id) where read = false;

-- ============================================================
-- IDEMPOTENCY KEYS (برای جلوگیری از duplicate runs)
-- ============================================================
create table public.idempotency_keys (
  key text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index idx_idempotency_user on public.idempotency_keys(user_id);
