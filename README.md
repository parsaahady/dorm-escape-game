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
index.html          — 9 صفحه (menu, select, league, missions, achievements, profile, settings, records, over) + HUD + Modals
style.css           — Glassmorphism, Gradients, Blur, Glow, Animations, Responsive
main.js (3093 خط)   — IIFE، بدون build
  ├─ helpers / seeded RNG
  ├─ storage v3 + migration (SAVE_VERSION=3)
  ├─ XP / Reputation / League
  ├─ Missions / Achievements
  ├─ Tonight / Rumor / Events
  ├─ FakeBackend + Network (Supabase-ready)
  ├─ characters (Ability + Stats + Heads)
  ├─ rendering (sky, city, props, obstacles, items)
  ├─ state + score + spawn (Pattern + Seed)
  ├─ input (queue + ability)
  ├─ update (combo, nearMiss, difficulty, ghost)
  ├─ draw (perspective, dayNight, particles)
  └─ UI (all screens) + loop + __FE hook

assets/characters/  — عکس واقعی ۵ کاراکتر
test/               — harness headless
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

## 🔌 Backend & Database

### گزینه پیشنهادی: Supabase (رایگان، JS-friendly)

**چرا Supabase؟** — Auth + Postgres + Realtime + RLS + JS SDK، بدون سرور اختصاصی، مناسب بازی کوچک.

### Setup (۵ دقیقه)

1. در [supabase.com](https://supabase.com) پروژه بساز
2. در SQL Editor اجرا کن:

```sql
create table profiles (
  id uuid primary key references auth.users,
  username text unique not null,
  friend_code text unique,
  avatar text,
  created_at timestamp default now()
);
create table scores (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id),
  username text not null,
  character text not null check (character in ('parsa','mahyar','arsham','mohsen','farham')),
  score integer not null check (score between 0 and 999999),
  distance integer not null,
  cigs integer not null,
  combo integer,
  seed integer,
  created_at timestamp default now()
);
create index idx_scores_score on scores(score desc);
create index idx_scores_character on scores(character);
create index idx_scores_created on scores(created_at desc);

-- RLS
alter table scores enable row level security;
create policy "read all" on scores for select using (true);
create policy "insert own" on scores for insert with check (auth.uid() = user_id);

-- Daily challenge view
create view daily_leaderboard as
  select * from scores where created_at::date = current_date order by score desc limit 100;
```

3. در بازی: Settings → یا کنسول:

```js
localStorage.setItem('supabase_url', JSON.stringify("https://YOUR.supabase.co"))
localStorage.setItem('supabase_key', JSON.stringify("YOUR_ANON_KEY"))
location.reload()
```

> تا وقتی کلید ست نشده، بازی با **FakeBackend** (localStorage + ربات‌های seeded) کار می‌کند — کاملاً Offline-First. بعداً بدون تغییر کد، آنلاین می‌شود.

### Anti-Cheat (پایه)

`validateRun(payload)` قبل از هر submit:

- `score <= 999999`, `distance <= 20000`, `cigs <= 5000`, `character valid`
- `score <= (dist + cigs*60 + combo*50 +5000)*1.8` — Consistency
- `duration <5s && score>5000` → رد
- Rate limiting (در Supabase: ۱ ثبت در ۱۰ ثانیه با Function)

هیچ Secret Key در repo نیست — فقط `anon` در `localStorage` کاربر.

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
node /tmp/test_new2.js
# → save version, combo, ability, validation, missions, board, seed, xp
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
