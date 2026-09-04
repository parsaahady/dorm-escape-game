-- 20250904000004_seed.sql — characters, achievements, missions, daily rules

-- ACHIEVEMENTS
insert into public.achievements (id, key, name, description, icon, category, requirement_type, requirement_value, reward_xp) values
('first_run','first_run','فرار اول 🏃','اولین Run رو کامل کن','🏃','general','total_runs',1,200),
('combo10','combo10','Combo Master 🔥','Combo x15 بساز','🔥','skill','best_combo',15,300),
('untouchable','untouchable','دست‌نیافتنی 👮','500m بدون برخورد (best distance)','👮','skill','best_score',500,300),
('smoker','smoker','سیگاری حرفه‌ای 🚬','500 نخ جمع کن','🚬','collection','total_cigs',500,400),
('lightning','lightning','برق‌آسا ⚡','50 Near Miss','⚡','skill','total_near',50,350),
('lastchance','lastchance','آخرین شانس 🛡️','10 بار با شیلد نجات پیدا کن','🛡️','skill','total_runs',10,300),
('nearmiss100','nearmiss100','نزدیک بود! 💀','100 Near Miss','💀','skill','total_near',100,500),
('record','record','رکورددار 🏆','امتیاز 20,000','🏆','score','best_score',20000,600),
('nightowl','nightowl','شب‌زنده‌دار 🌙','5 Run شبانه','🌙','general','total_runs',5,250),
('collector','collector','جمع‌کن 🎒','10 Power-up بگیر','🧲','collection','total_cigs',10,200),
('explorer','explorer','گردشگر خوابگاه 🗺️','3 محیط مختلف','🗺️','general','total_runs',3,200),
('friend','friend','رفیق خوابگاهی 👥','1 دوست اضافه کن','👥','social','total_runs',1,200)
on conflict (id) do nothing;

-- MISSIONS — daily templates (active missions will be generated per day via cron or get_daily)
insert into public.missions (id, type, title, description, requirement_type, requirement_value, reward_xp, reward_reputation, active) values
('d_cig','daily','سیگاری روز','20 نخ جمع کن 🚬','cigs',20,120,10,true),
('d_dist','daily','فرار صبحگاهی','800 متر بدو 🏃','distance',800,100,10,true),
('d_near','daily','نزدیک بود!','5 Near Miss ⚡','near_miss',5,150,15,true),
('d_ability','daily','قدرت‌نمایی','3 بار Ability بزن','ability',3,130,10,true),
('d_combo','daily','کومبو باز','Combo x10 بساز 🔥','combo',10,140,12,true),
('w_score','weekly','رکوردشکن','15,000 امتیاز','score',15000,400,30,true),
('w_near','weekly','استاد Near Miss','30 Near Miss','near_miss',30,350,25,true),
('w_runs','weekly','فراری خستگی‌ناپذیر','10 Run کامل','runs',10,300,20,true),
('w_chars','weekly','همه‌کاره','با هر 5 کاراکتر بازی کن','chars',5,450,30,true),
('w_nopow','weekly','دست خالی','1 Run بدون Power-up','nopow',1,300,20,true)
on conflict (id) do nothing;

-- DAILY CHALLENGE for today (if not exists, RPC will create; seed here for dev)
insert into public.daily_challenges (challenge_date, seed, title, description, modifier, rules)
values (current_date, 12345, 'چالش امروز — فرار ' || current_date, 'سرعت +10% و امتیاز NearMiss دو برابر!', '{"speed":1.1,"nearMul":2}'::jsonb, '{"seed":12345}'::jsonb)
on conflict (challenge_date) do nothing;

-- WEEKLY LEAGUE current week
insert into public.weekly_leagues (week_start, week_end)
values (date_trunc('week', now())::date, (date_trunc('week', now()) + interval '6 days')::date)
on conflict (week_start) do nothing;
