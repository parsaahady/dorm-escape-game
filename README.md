# 🚬 فرار از خوابگاه — لیگ خوابگاه (v3)

> **Online Competitive Dorm Arcade Game** — از یک Endless Runner ساده به یک بازی رقابتی کامل با لیگ، مأموریت، XP، Ability و چالش روزانه!

یک بازی آرکید دانشجویی با تم خوابگاه دانشگاه شهید بهشتی. ۵ کاراکتر با قابلیت‌های متفاوت، سیستم Combo و Near Miss، محیط‌های متنوع، Random Events، Daily/Weekly Challenge، Ghost Run، Friend Leaderboard و لیگ جهانی — همه با **Offline-First** و بدون نیاز به نصب.

**Live Demo (GitHub Pages)**: `https://USERNAME.github.io/dorm-escape-game/`  
**Stack**: HTML + CSS + Vanilla JS + Canvas 2.5D + Web Audio (بدون dependency)

---

## ✨ ویژگی‌ها (v3)

### 🎮 Core Gameplay
- ۳ لاین دویدن با فیزیک فنر میراگر، پرش و سرخوردن
- ۱۲ نوع مانع (سطل، تی، در، نگهبان، بند رخت، دوربین، جعبه، صندلی، دوچرخه، کارتن، NPC ...)
- **Pattern-based Spawning** — الگوهای A-E + تضمین عدم بن‌بست
- **Procedural Seed** — هر Run با Seed قابل بازسازی (برای Daily/Challenge/Ghost)

### ⭐ Score حرفه‌ای
```
Score = (Distance + Cigs*25 + PerfectBonus + ComboBonus + NearMiss*50 + AbilityBonus) × DifficultyMul × TonightMul × EventMul × x2Mul
```
- **Combo System**: هر جمع‌آوری / Near Miss / Dodge → +1، تایمر ۱.۸ث، تا ۳× multiplier، HUD 🔥 + ذرات + Shake
- **Near Miss**: رد شدن نزدیک از مانع → ⚡ +50، Slow-Mo کوتاه، ذرات، صدا
- **Perfect Line**: جمع کامل یک خط سیگار → بونوس ۲۰+۵×Streak

### 🦸 کاراکترها — هرکس سبک خودش
| کاراکتر | لقب | Passive | Active (Cooldown/Duration) |
|---|---|---|---|
| **پارسا** | فرارچی 🔥 | +10% سرعت | **Adrenaline** — ۴ث سرعت +30% و امتیاز ×1.5 (۱۸s) |
| **مهیار** | جمع‌کن 🧲 | شعاع جذب +30% | **Magnet Mode** — ۵ث جذب همه (۲۰s) |
| **آرشام** | ریسک‌پذیر 🎲 | Near Miss ×1.5 | **Risk Mode** — ۶ث امتیاز ×2 ولی جریمه بیشتر (۲۲s) |
| **محسن** | تانک 🛡️ | هر ۹۰m یک ضربه رایگان | **Shield** — ۴ث ضدضربه کامل (۲۰s) |
| **فرهام** | شبح 👻 | پلیس -15% | **Ghost** — ۳.۵ث عبور از موانع (۲۵s) |

> هیچ کاراکتری بهترین مطلق نیست — Balance برای Playstyleهای مختلف.

### 🎁 Power-ups (Balance شده)
`🧲 Magnet | 🛡️ Shield | ⚡ Speed | 👻 Ghost | ✨ x2 | 👟 High Jump | ⏱️ Slow-Mo | ❤️ Second Chance` — Spawn هر ۸-۱۴ ثانیه، بررسی تداخل با مانع کامل.

### 🌍 محیط‌ها (۶)
`سالن خوابگاه → محوطه دانشگاه → سلف → کوچه‌ها → پارکینگ → محوطه شبانه` — هر کدام ground/road/wall/props/نور متفاوت.  
**Day/Night Cycle**: در طول Run (۱۴۰ث) از روز به غروب/شب/نیمه‌شب با Tint و نورها.

### 🎲 Random Events + Rumor + Tonight
- **Random Event هر ۳۰-۵۰ث**: `🚨 عملیات ویژه | 🌧️ بارون | 💡 برق رفت | 🏃 دونده جلو | 🚪 در باز | 👮 دو مأمور` — Gameplay واقعی (تراکم موانع، سرعت، امتیاز، دید)
- **شایعه خوابگاه**: هر چند Run یک Rumor تصادفی (`میگن طبقه سوم راه مخفی داره...`)
- **اتفاق امشب (Daily Global Modifier)**: یکسان برای همه (مثلاً `😴 انتظامات خوابش میاد -15%`، `🍔 سلف بازه +40% آیتم`)

### 📈 Progression
- **XP & Level**: هر Run + Mission + Achievement → XP، فرمول `500 + (lv-1)*350`، LevelUp با انیمیشن
- **Missions**: ۳ روزانه (از ۵ قالب) + ۳ هفتگی، Progress خودکار، جایزه XP
- **Achievements (۱۲)**: `فرار اول | Combo Master | دست‌نیافتنی | سیگاری حرفه‌ای | برق‌آسا | آخرین شانس | 💀 | رکورددار | شب‌زنده‌دار | ...` با Progress `37/100`
- **Statistics**: Runs, Distance, Cigs, NearMiss, BestCombo, PlayTime, MostUsedChar, نمودار ساده
- **Reputation**: `مهمان → تازه‌وارد → پاچه‌خوار → فراری حرفه‌ای → کابوس انتظامات → افسانه خوابگاه`

### 🏆 Online (Offline-First)
- **لیگ خوابگاه**: `🌎 جهانی | 👥 دوستان | 👑 این هفته | 📅 امروز | 🎭 کاراکتری` — Rank, Username, Avatar, Character, Score, Distance, Cigs, Combo, Date
- **Daily Challenge**: Seed روزانه یکسان برای همه (مثلاً `سرعت +20%، NearMiss ×2`) + Leaderboard جدا
- **Weekly League**: `🥉 Bronze (0) → 🥈 Silver (5k) → 🥇 Gold (15k) → 💎 Diamond (35k)` — Reset هفتگی، Best Tier ذخیره
- **Friend System**: Friend Code `DORM-XXXX`، افزودن با کد، Friends Leaderboard
- **Challenge a Friend**: `Challenge #92817` — Seed + URL اشتراکی (`?challenge=SEED`) — دقیقاً یکسان
- **Ghost Run**: ذخیره `trail: [{dist,x,jumpY}...]` تا ۴۰۰ نقطه، نمایش شفاف در Run بعدی، Toggle
- **Sync**: Pending runs در `localStorage`، هنگام آنلاین شدن `☁️ Syncing... → ✓ Synced`

### 🎨 گرافیک & Feel
- Canvas 2.5D با پرسپکتیو، سایه، AO، پارالاکس، برق آسفالت، هاله نور، شهر دور/نزدیک
- **ذرات**: Burst، Dust، Speed Lines، Impact، Shield Aura، Ghost Trail (با Pooling، سقف ۲۶۰)
- **انیمیشن**: Idle/Run/Jump/Slide/Hit/Ability با squash&stretch، tilt، head bob
- **Juice**: Screen Shake (قابل خاموش)، Hit Flash، Combo Pop، Slow-Mo NearMiss، Float Text

### 🔊 صدا (Web Audio)
`Jump | Slide | Collect (pitch با Combo) | Perfect | Lane | Crash | Power | ShieldPop | NearMiss | ComboUp | Ability | Whistle | Over | LevelUp` + موسیقی دینامیک ۳۲-step (سرعت با `speed` تغییر می‌کند) — SFX/Music Volume جداگانه.

### 📱 Mobile & Accessibility
- Touch: Swipe چپ/راست/بالا/پایین (یک فرمان per gesture)، دابل‌تپ = Ability
- کلید: `←→/A D, ↑/W/Space, ↓/S, Q/E (Ability), P/Esc (Pause)`
- Responsive HUD، Safe Areas، `devicePixelRatio` بهینه
- Settings: `Reduced Motion | High Contrast | Particles | Shake | Vibrate | Colorblind-safe` (هیچ Gameplay فقط به رنگ وابسته نیست)

---

## 🗂️ معماری

```
index.html          — 10 صفحه (menu, select, league, missions, achievements, profile, settings, records, over, auth) + HUD + Modals + <meta supabase-url/key> + importmap @supabase/supabase-js@2.39.7
style.css           — Glassmorphism, Gradients, Blur, Glow, Animations, Responsive (HighContrast/ReducedMotion)
main.js (~3150 خط)  — IIFE (non-module) + Network branch (window.Api/SyncManager if isSupabaseConfigured else FakeBackend)
  ├─ helpers / seeded RNG (mulberry32, hashStr, dailySeed)
  ├─ storage v3 + migration (SAVE_VERSION=3, migrate fed_records_v1→dorm_v3)
  ├─ XP / Reputation / League (xpForLevel, 6 ranks, 4 tiers)
  ├─ Missions / Achievements (5 daily +5 weekly templates, 12 defs)
  ├─ Tonight / Rumor / Random Events
  ├─ FakeBackend (bots seeded, getLeaderboard 5 tabs, validateRun, submitScore) + Network (try Api.submitRun/getLeaderboard then fallback)
  ├─ characters (5 × Passive/Active + Stats + makeHead procedural)
  ├─ rendering (sky/city/vignette, 12 obstacles, 7 pows, 6 zones, glow)
  ├─ state + score (expanded: distance+collect+combo+nearMiss+powerUp+mission+difficulty*tonight*event*x2)
  ├─ spawn (Pattern A-E + Seed + no-impassable guarantee)
  ├─ input (queue 2 + swipe/double-tap Ability)
  ├─ update (combo decay, nearMiss slowMo, dynamic difficulty, ghost trail)
  ├─ draw (perspective 80, dayNight tint 140s cycle, particles pool 260, shake, blackout)
  └─ UI (all screens) + loop + __FE hook (test)
js/
  supabase.js  — initSupabase via esm.sh CDN, reads localStorage/meta, isSupabaseConfigured
  auth.js      — anon/email-pass/OAuth + migrateGuest
  api.js       — submitRun/getLeaderboard/profile/friends/challenge wrappers (RPC)
  sync.js      — SyncManager queue pendingRuns, onStatus, retry, conflict (XP authoritative, achievements union)
supabase/
  config.toml
  migrations/  — 00001_schema (16 tables) / 00002_rls / 00003_rpc / 00004_seed
.env.example        — VITE_SUPABASE_URL / ANON_KEY / SERVICE_ROLE (server only)
assets/characters/  — عکس واقعی ۵ کاراکتر
test/               — harness.js (headless invariants 12810 frames) + systems.js (28 checks)
```

### Storage Schema v3 (`localStorage['dorm_v3']`)

```js
{
  v:3,
  player:{id, username, friendCode:"DORM-XXXX", avatar, guest},
  settings:{muted, sfxVol, musicVol, vibrate, particles, shake, reducedMotion, highContrast, lang},
  characters:{selected, levels:{parsa:1...}, xp:{parsa:0...}},
  stats:{totalRuns, totalDistance, totalCigs, totalNearMiss, bestScore, bestDistance, bestCombo, ...},
  xp:{level, xp, totalXp},
  missions:{daily:[], weekly:[], lastDaily, lastWeekly},
  achievements:[{id, progress, unlocked}...],
  league:{tier, weeklyScore, bestTier, resetAt, history:[]},
  friends:[{code, username}...],
  pendingRuns:[{username, score, distance, cigs, combo, date, seed}...],
  cachedBoard:[],
  ghost:{seed, trail:[...], score, date},
  reputation:{points, rank},
  // legacy: fed_records_v1, fed_char, fed_muted, fed_tut همچنان خوانده می‌شوند و migrate می‌شوند
}
```

**Migration**: اگر `dorm_v3` نباشد، از `fed_records_v1` + `fed_char` + `fed_muted` ساخته می‌شود — Progress قدیمی از بین نمی‌رود.

---

## 🔌 Backend & Database — Supabase (Offline-First, Real)

### چرا Supabase؟
Auth (Email/Pass, Anon, OAuth Google/GitHub) + Postgres + Realtime + RLS + RPC + JS SDK از `esm.sh` — بدون سرور اختصاصی، رایگان برای شروع، JS-friendly. بازی هم **بدون Supabase کاملاً playable** است (FakeBackend) و بعداً بدون تغییر کد آنلاین می‌شود.

### ساختار repo
```
supabase/
  config.toml                 — پورت‌ها (API 54321 / DB 54322)، Auth، Storage
  migrations/
    20250904000001_schema.sql — 16 جدول + ایندکس + FK + Check (profiles, scores, runs, user_characters, achievements, missions, daily_challenges, weekly_leagues, friendships, challenges, notifications ...)
    20250904000002_rls.sql    — RLS enable + Policies (read verified scores, insert own, friendships requester/receiver, profiles update own)
    20250904000003_rpc.sql    — submit_run (idempotency via run_id, validation, flagged), get_leaderboard (global/weekly/daily/friends/character, count(*) rank, cursor 20/50), claim_mission, create_challenge, get_daily_challenge ...
    20250904000004_seed.sql   — 5 کاراکتر، 12 اچیومنت، 10 مأموریت، daily/weekly نمونه
js/
  supabase.js  — createClient از https://esm.sh/@supabase/supabase-js@2.39.7 ، خواندن URL/Key از localStorage یا <meta>، isSupabaseConfigured
  auth.js      — signUp(email, pw, username) / signIn / signInAnonymously() / OAuth + migrateGuest(dorm_v3 → DB) با union/aggregate/server-authoritative
  api.js       — submitRun / getLeaderboard / getProfile / friends / challenges wrapper دور RPC
  sync.js      — SyncManager: pendingRuns queue، ONLINE→SYNCING→SYNCED، exponential backoff، conflict resolution (XP server-authoritative, achievements union, scores append)
index.html     — <meta name="supabase-url/key"> + <script type="importmap"> برای @supabase/supabase-js + #screen-auth
main.js        — Network branch: اگر isSupabaseConfigured → Api.submitRun / Api.getLeaderboard (با run_id UUID + started/finished) وگرنه FakeBackend
```

### ۱۶ جدول — خلاصه
| جدول | کلید | توضیح |
|---|---|---|
| `profiles` | `id uuid PK FK auth.users` | username unique، display_name، avatar، level/xp/reputation، friend_code `DORM-XXXX` unique |
| `scores` | `id bigserial` | user_id FK، score 0..999999، distance، combo، character_id، environment، run_duration، daily/weekly id، status pending/verified/flagged/rejected |
| `runs` | `id uuid PK (run_id)` | seed، score، distance، best_combo، items/near_misses/powerups/ability_uses، run_started/finished_at، status، idempotency |
| `user_characters` | `user_id, character_id` | level/xp/games/best_score per char |
| `achievements` + `user_achievements` |  | 12 اچیومنت + progress/unlocked |
| `missions` + `user_missions` |  | daily/weekly + progress/done |
| `daily_challenges` | `challenge_date unique` | seed، title، modifier |
| `weekly_leagues` + `weekly_player_stats` |  | tier bronze→diamond، weekly score |
| `friendships` | `requester/receiver` | pending/accepted/blocked + unique pair |
| `challenges` + `challenge_results` |  | seed + creator + expires_at |
| `notifications` |  | title/body/read برای bell 🔔 |

ایندکس‌ها: `scores(score desc)`, `scores(character, score)`, `scores(created_at)`, `runs(user_id, created_at)`, `profiles(friend_code)`، همه با `count(*) over()` برای rank.

### RLS & Security
- `enable row level security` روی همه جداول
- `profiles`: `update` فقط `auth.uid()=id`
- `scores/runs`: `select` فقط `status='verified'` یا `user_id=self`؛ `insert` فقط `auth.uid()=user_id`
- `friendships`: `select/insert/update` فقط `requester` یا `receiver`
- **No service_role در کلاینت** — فقط `anon`؛ هیچ Secret در repo نیست (`.env.example` فقط template)

### RPCs — Server-Authoritative
- `submit_run(p_run_id uuid, p_character_id text, p_seed int, p_score int, ... p_started_at timestamptz, p_finished_at timestamptz)` →  
  ۱) idempotency: اگر `run_id` تکراری → return موجود  
  ۲) validation: score≤999999، distance≤20000، duration≥5s، seed rate-limit (۱/۱۰ث)، `score ≤ (dist+items*60+combo*50+5000)*1.8` → اگر نقض → `flagged`  
  ۳) insert `runs` + `scores` + update `profiles.xp/level` + `weekly_player_stats` + `check_achievements` در یک ترنزکشن → return `rank, xp, tier`
- `get_leaderboard(p_type text, p_character text, p_limit int, p_offset int)` → `select ... , count(*) over()` + فیلتر `daily/weekly/friends/character` + pagination 20/50 cursor
- `claim_mission`, `create_challenge`, `send_friend_request`, `accept_friend_request`, `get_daily_challenge` — همگی با `auth.uid()` چک

### Auth & Guest Migration
- **Guest** (local) → بازی بدون لاگین (`DB.player.guest=true`, `friendCode` محلی)
- در `#screen-auth`: `SignUp (email/pass)`, `SignIn`, `👻 Anonymous`, `Google/GitHub OAuth` (همگی via `supabase.auth.*`)
- **Migration**: بعد از اولین `SIGNED_IN`, `auth.js:migrateGuest()` کل `dorm_v3` (scores, xp, achievements) را با `union` (achievements)، `aggregate` (stats `max`) و `server-authoritative` (xp) به DB منتقل می‌کند — هیچ Progress گم نمی‌شود. `supabase.auth.onAuthStateChange` هم migration را trigger می‌کند.

### Sync — Offline-First
```
Local Run → validateRun() → DB.pendingRuns.unshift(payload with run_id) → saveDB()
  ├─ if isSupabaseConfigured & online & session → SyncManager.queueRun() → Api.submitRun() → on success: remove from queue
  └─ else FakeBackend.submitScore() → cachedBoard
SyncManager: listeners for `online/offline`, `supabase:ready`, 30s poll, exponential backoff (max 3 fails → error), flagged/rejected handling، UI: 📡→☁️→✓
```
- `validateRun` هم در کلاینت (`main.js`) و هم در RPC تکرار می‌شود — cheated score → `flagged` و در Leaderboard نشان داده نمی‌شود.
- Duplicate `run_id` → RPC return بدون duplicate row (idempotency).
- Conflict: XP `server wins (max)`، Achievements `union`، Scores `append-only`.

### Setup — لوکال (بدون Supabase هم کار می‌کند)
```bash
# 1) بازی بدون بک‌اند — FakeBackend
python3 -m http.server 8000  # → http://localhost:8000 → همه فیچرها با seeded bots

# 2) با Supabase واقعی — 2 روش
# A) local Supabase (Docker)
npm i -g supabase
supabase start           # → API http://localhost:54321  DB 54322
supabase db reset        # → migrations 1..4 اجرا + seed
# بعد در مرورگر کنسول:
localStorage.setItem('supabase_url', JSON.stringify("http://localhost:54321"))
localStorage.setItem('supabase_key', JSON.stringify("ANON_KEY_FROM supabase status"))
location.reload()

# B) hosted (supabase.com → Project → SQL Editor → past 4 migrations)
# سپس در index.html یا .env:
<meta name="supabase-url" content="https://YOUR.supabase.co">
<meta name="supabase-anon-key" content="YOUR_ANON_KEY">
# یا localStorage مثل بالا — js/supabase.js اول meta را می‌خواند
```

> تا وقتی `supabase_url/key` ست نشده، `isSupabaseConfigured===false` و بازی با **FakeBackend** (localStorage + ربات‌های seeded) کاملاً playable و testable است. بعداً بدون تغییر کد آنلاین می‌شود — حتی `SyncManager` pendingها را خودکار همگام می‌کند.

### Anti-Cheat (پایه — کلاینت + سرور)
- `score≤999999`, `distance≤20000`, `cigs≤5000`, `combo≤1000`, `character ∈ {5}`
- `score ≤ (dist + cigs*60 + combo*50 + 5000) * 1.8` (consistency)
- `duration<5s && score>5000` → رد؛ `distance/duration > 60m/s` → flagged (غیرممکن)
- Rate: ۱ submit در ۱۰ث (در RPC via `last_run` check)
- همه چک‌ها هم در `main.js:validateRun()` و هم در `submit_run()` — کلاینت trust نمی‌شود.

### Env — فقط anon
```bash
# .env.example (هرگز کامیت نکن)
VITE_SUPABASE_URL=https://abc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=... # فقط در dashboard/server — هرگز در repo/clients
```
در کلاینت فقط `anon` نگه داشته می‌شود (`localStorage` یا `meta`), `service_role` هرگز لو نمی‌رود.

---

## 💻 اجرا محلی

```bash
# ساده‌ترین
python3 -m http.server 8000
# → http://localhost:8000

# یا با npx
npx serve .
```

هیچ `npm install` لازم نیست.

### GitHub Pages

1. Push به `main`
2. Settings → Pages → Deploy from branch → `main` / `(root)` → Save
3. بعد ۱-۲ دقیقه: `https://USERNAME.github.io/dorm-escape-game/`

ES Modules لازم نیست — `main.js` به صورت `<script src="main.js">` لود می‌شود، روی Pages بدون تنظیم اضافی کار می‌کند.

---

## 🧪 تست

```bash
# تست اصلی (بدون مرورگر)
node test/harness.js
# → bot survived dist, perfect lines, no impassable row, restart clean, etc.

# تست سیستم‌های جدید
node test/systems.js
# → combo/ability/nearMiss/seed/validation (score, distance cheat, too fast), 5 board tabs, XP levelUp, ghost, pendingRuns — 28 checks
```

**تست‌های headless پوشش می‌دهند**:
- invariants (x, speed, dist, jumpY, entity leak, particle cap, no full row)
- ۳ ران تصادفی + ران بدون ورودی → catch→over
- ریست کامل بعد از Game Over
- بات هوشمند ۱۵۰ثانیه (dist>800، powerups spawned)
- آهنربا + Perfect bonus
- Spam input
- جدید: Score, Combo, Ability cooldown, Validation, Mission/Board/Seed/XP

---

## ⚙️ متغیرهای محیطی

| کلید (`localStorage`) | توضیح | نمونه |
|---|---|---|
| `supabase_url` | URL پروژه Supabase | `"https://abc.supabase.co"` |
| `supabase_key` | anon public key | `"eyJhbG..."` |
| `dorm_v3` | کل State (JSON) | — |
| `fed_records_v1` | legacy records (migration) | — |

هیچ `.env` فایلی کامیت نکن — کلیدها فقط در مرورگر کاربر می‌مانند.

---

## 🔒 امنیت

- هیچ Secret در repo نیست
- Score قبل از ثبت validate می‌شود (server-side هم در Supabase RLS)
- RLS: فقط `auth.uid() = user_id` می‌تواند insert کند
- کلاینت Trust نمی‌شود — هر Score مشکوک رد می‌شود
- Rate limiting و `pendingRuns` با Sync مجدد

---

## 🎮 کنترل‌ها

| عمل | موبایل | دسکتاپ |
|---|---|---|
| لاین | Swipe چپ/راست | ← → / A D |
| پرش | Swipe بالا | ↑ / W / Space |
| سرخوردن | Swipe پایین | ↓ / S |
| Ability | دابل‌تپ / دکمه | Q / E یا کلیک دکمه Ability |
| توقف | — | P / Esc |

---

## 📝 Git

```bash
git add index.html style.css main.js README.md
git commit -m "feat: v3 online competitive — ability, combo, nearMiss, missions, league, ghost, seed, offline-sync"
git push
```

---

## 🧭 نقشه راه

- [x] Refactor + Storage v3 + Migration
- [x] Character Ability (5× Passive/Active + Cooldown)
- [x] Score / Combo / Near Miss
- [x] FakeBackend + Leaderboard (5 tabs) + Validation
- [x] Daily/Weekly + Missions + XP + Achievements + League + Friends + Ghost + Seed
- [x] Visual Upgrade (Glassmorphism, 6 zones, Day/Night, Events, Particles, Juice)
- [x] Performance (Pooling) + Mobile + Accessibility + Tests

**بعدی**: Supabase Realtime Ghost Racing، Soundtrack اصلی، کاراکتر ششم مخفی 🥚

---

ساخته شده با ❤️ برای بچه‌های خوابگاه — **شهید بهشتی، شبِ خوابگاه 🌙** — اگر باگی دیدی یا ایده‌ای داری، Issue بزن!
