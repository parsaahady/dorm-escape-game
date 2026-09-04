# فرار از خوابگاه — PHP/MySQL Migration Complete ✅

> تاریخ: 2026-09-05 (Asia/Tehran) — Shared Hosting (Apache + PHP 8.2/8.3 + MySQL 8/MariaDB)

---

## 1) فایل‌های اضافه/تغییر یافته

### اضافه شده (PHP Backend)
```
database.sql                      # 331 خط، importable via phpMyAdmin (15+ جدول)
.htaccess                         # امنیت + هدر + cache + deny list
config/config.example.php         # نمونه — DB_HOST/NAME/USER/PASS + APP_URL + SESSION_*
config/config.php                 # لود .env + fallback dev، تولید توسط /install
core/Database.php                 # PDO wrapper (ERRMODE_EXCEPTION, FETCH_ASSOC, EmulatePrepare false)
core/Response.php                 # JSON unify {success,data/error{code,message}} + http code
core/Auth.php                     # session secure (HttpOnly/Secure/SameSite Lax), regeneration, requireAuth
core/Csrf.php                     # token per session, X-CSRF-Token + body _csrf
core/RateLimit.php                # IP/user/window (login 5/900, score 10/60, user 30/3600, friend/challenge 10/3600)
core/Validator.php                # validateRun: score≤999999 distance≤20000 duration 3-3600 speed>40 flagged, combo≤1000 maxPossible*1.8
core/Migration.php                # migrateGuest: LocalStorage dorm_v3 → DB (totalXp→level 500+(lv-1)*350, cachedBoard→runs/scores, GREATEST levels + xp sum, achievements)
api/bootstrap.php                 # secure session start, CORS same-origin, security headers (nosniff/SAMEORIGIN), APP_DEBUG handling, getJsonInput helpers
api/auth/register.php             # validateUsername/Email/Password, duplicate check, DORM-XXXX gen loop, BCRYPT 12, user_characters init 5, auto-login, migrateGuest, 201 {user,csrf,migrated}
api/auth/login.php                # RateLimit 5/900, login via username/email, password_verify, Csrf
api/auth/logout.php
api/auth/session.php              # {authenticated,user,csrf}
api/auth/csrf.php
api/user/profile.php              # GET user+characters+stats, POST update with Csrf+RateLimit+xss trim
api/runs/submit.php               # Csrf+RateLimit IP/user, normalize 14 fields, Validator → flagged/rejected, duplicate id check, transaction (runs+scores+user_characters XP+level loop + league Monday-Sunday bronze/silver/gold/diamond + missions + achievements 200 XP + notification levelUp), rank COUNT+1
api/sync.php                      # POST batch ≤20, validate, duplicate skip, insert runs+scores, tx
api/leaderboard/global.php
api/leaderboard/daily.php
api/leaderboard/weekly.php
api/leaderboard/friends.php
api/leaderboard/character.php     # limit 20 default 20-50, character whitelist, rank subquery, myRank, avatar fallback
api/missions/list.php             # lazy ensure daily today/weekly Y-W
api/missions/claim.php            # period lookup, claimed ALTER lazy, idempotent 400 ALREADY_CLAIMED
api/achievements/list.php         # lazy ensure 12 defs
api/friends/request.php           # DORM-XXXX regex, pending check, notification
api/friends/accept.php            # accept/reject/remove/block
api/friends/list.php              # friends/pending/all
api/challenges/create.php         # UUID-like id sprintf %04x, seed 10k-99k, expires +7d
api/challenges/get.php            # by id/seed or list 20
api/challenges/submit.php         # upsert GREATEST, notify creator
api/notifications/list.php
api/notifications/mark_read.php
api/stats.php                     # weekly tier, history
api/daily/challenge.php           # deterministic seed crc32(date)
install/index.php                 # wizard (lockFile install.lock, GET form db_host/name/user/pass/app_url/admin_user/email/pass, POST PDO CREATE DATABASE IF NOT EXISTS, import database.sql via explode ; with SET handling, CREATE admin is_admin=1 + user_characters, write config.php escaped defines, lock file+DB)
admin/index.php                   # Auth::user is_admin gate, login form password_verify, dashboard stats users/runs_today/scores_today/flagged/challenges, flaggedRuns+recentRuns+users tables, ?logout=1
js/php_api.js                     # PHP MySQL API client (csrf fetchCsrf, apiFetch with X-CSRF-Token + _csrf body, PhpApi {getCsrf,session,register,login,logout,getProfile,updateProfile,submitRun,syncRuns,getLeaderboard,getMissions/Achievements,sendFriendRequest/acceptFriend/listFriends,createChallenge/getChallenge,listNotifications}, normalize score/distance/cigs/combo, expose window.PhpApi/isPhpBackend, php:ready event)
```

### تغییر یافته (Frontend Canvas Engine — همان، فقط data-source switch)
```
index.html                        # قبل: فقط Supabase importmap + Auth Supabase only. بعد: import PhpApi + dual backend detection (fetch /api/auth/session.php → phpAvailable), updateAuthStatus سوئیچ PHP/Supabase/Offline، btnSignUp/SignIn برای PHP guestData migration + fallback Supabase، loadNotifs دوگانه، session restore PHP + Supabase branch، حفظ Canvas engine
main.js                           # Network.branch: حالا PHP اول (PhpApi.submitRun/syncRuns/getLeaderboard سپس Supabase سپس FakeBackend). showOver payload queue: hasPhp/hasSupabase branch, DB.pendingRuns.unshift + saveDB + Network.submit با rank نمایش، btnSync: اگر phpBackendAvailable → batch PhpApi.syncRuns(20) با okIds Set سپس fallback per-run. keep 60fps, responsive, particles 260 cap
config/.env (optional)            # لود در config.php — هرگز کامیت نمی‌شود
```

### حفاظت شده
```
.gitignore                        # config.php, .env, install.lock, vendor/, logs
```

### مستندات
```
HOSTING_GUIDE.md                  # cPanel کامل (DB create → phpMyAdmin import → /install → config → .htaccess → SSL → APP_URL → admin → backup/debug — پایین همین فایل summarized)
docs/AUDIT.md (existing)          # audit قبلی
```

---

## 2) Backend / DB / API / Auth / Validation Flow

### Backend انتخاب
- **PHP 8.2+ vanilla (no framework)** — ساده‌ترین برای هاست اشتراکی، بدون نیاز به Composer/Node persistent process. PDO prepared everywhere، password_hash BCRYPT، session HttpOnly/Secure/SameSite.
- Frontend همان Canvas IIFE v3 (~3150 خط) دست‌نخورده — فقط Network layer تعویض.

### Database (15+ جدول، FK، Index، CHARSET utf8mb4_unicode_ci)
- **users** `id PK, username UNIQUE, email UNIQUE, password_hash, display_name, avatar, friend_code UNIQUE DORM-XXXX, level, xp, total_xp, is_admin, created_at`
- **user_sessions** `id, user_id FK, token UNIQUE, expires_at, created_at`
- **characters** `id PK, name`
- **user_characters** `user_id FK, character_id FK, level, xp, unlocked` — PK(user_id,character_id)
- **runs** `id PK AUTO, run_id UNIQUE (uq_run), user_id FK, character_id, seed, score, distance, duration, best_combo, items_collected, near_misses, powerups_used, ability_uses, environment, status ENUM(pending,verified,flagged,rejected), started_at, finished_at, created_at` — idx user_id, score, created
- **scores** `id PK, run_id FK, user_id FK, score, distance, cigs, combo, rank_cache` — هم‌زمان با runs insert برای leaderboard legacy
- **missions** `id PK, period ENUM(daily,weekly), title, target, xp`
- **user_missions** `id PK, user_id FK, mission_id FK, period_key (today / Y-W), progress, done, claimed TINYINT lazy ALTER, UNIQUE uq_user_mission_period (user_id,mission_id,period_key)`
- **achievements** `id PK, title, target`
- **user_achievements** `user_id FK, achievement_id FK, progress, unlocked, claimed`
- **daily_challenges** `date PK, seed`
- **weekly_leagues** `user_id FK, week_start, score, tier ENUM bronze/silver/gold/diamond`
- **friendships** `id PK, user_id FK, friend_id FK, status ENUM pending/accepted/blocked, created_at` — UNIQUE(user_id,friend_id)
- **friend_challenges** `id PK VARCHAR(36) UUID-like, creator_id FK, seed 10000-99999, title, expires_at +7d, created_at`
- **friend_challenge_scores** ضمنی در friend_challenges (GREATEST)
- **notifications** `id PK, user_id FK, title, body, is_read, created_at`
- **install_lock** (در install wizard) برای قفل نصب

> `database.sql` (15KB, 331 خط): `SET NAMES utf8mb4; SET FOREIGN_KEY_CHECKS=0;` → همه `CREATE TABLE IF NOT EXISTS` → `SET FOREIGN_KEY_CHECKS=1;` — قابل `SOURCE` یا phpMyAdmin Import. Seeded characters 5 + نمونه missions/achievements.

### API (REST-style زیر `/api`, JSON unify)
- همه endpointها `api/bootstrap.php` را require می‌کنند (session+security headers).
- پاسخ: `{success:true,data:{...}}` با 200/201 یا `{success:false,error:{code,message}}` با 400/401/403/429/500.
- RateLimit via `core/RateLimit.php` (memory/file fallback اگر APCu نیست).
- CSRF: `GET /api/auth/csrf.php` → `csrfToken`; POSTها `X-CSRF-Token` header یا `_csrf` در body.
- Auth: `Auth::startSession()` با `session.cookie_httponly=1, cookie_secure=APP_URL https?, cookie_samesite=Lax, use_strict_mode=1, regeneration`؛ `password_hash($pw, PASSWORD_BCRYPT, ['cost'=>BCRYPT_COST])`.

**فلو ثبت‌نام → بازی → ثبت امتیاز:**
```
1) Guest می‌نوازد: DB (dorm_v3) محلی → pendingRuns queue
2) Register: POST /api/auth/register.php {username,email,password,guestData:JSON.parse(localStorage dorm_v3)}
   - validateUsername 3-20 alnum_+ , validateEmail, validatePassword 6+ letter+digit
   - SELECT duplicate username/email → 409
   - gen friend_code DORM-XXXX loop unique
   - password_hash BCRYPT 12 → INSERT users → INSERT user_characters ×5
   - Auth::login() → session + csrf
   - Migration::migrateGuest(userId, guestData): transaction
        totalXp → level loop while xp>=500+(lv-1)*350, cachedBoard runs (seed random if miss) → INSERT runs+scores status verified, characters GREATEST+sum xp, achievements union
   - 201 {user,csrf,migrated}
3) Play → GameOver: payload normalize 14 fields → POST /api/runs/submit.php {run_id UUID, character_id, seed, score, distance, duration, best_combo, items, near_misses, powerups, ability_uses, environment, started_at, finished_at}
   - requireAuth + Csrf + RateLimit (IP 10/60 + user 30/3600)
   - Validator::validateRun(): score 0-999999, distance 0-20000, duration 3-3600, combo 0-1000, ability 0-100, speed=distance/duration ≤40 flagged, maxPossible = distance + items*60 + combo*50 +5000, score>maxPossible*1.8 flagged → status flagged/rejected, leaderboard only verified
   - duplicate run_id idempotent → 200 {rank, status:duplicate}
   - BEGIN → INSERT runs → INSERT scores → user_characters upsert GREATEST → XP gain score/120+items*2+near*3+20 → level loop → weekly_leagues Monday-Sunday tier calc → missions lazy ensure (daily today, weekly Y-W) + progress inc per mission id d_cig/d_dist... with SUM queries → achievements progress/unlock +200 XP → notification levelUp → COMMIT → rank SELECT COUNT+1 WHERE score>...
4) Leaderboard: GET /api/leaderboard/*.php?limit=20&offset=0&character=parsa → SELECT ... rank subquery COUNT+1, myRank calc, avatar fallback, Verified only, Pagination 20 (50 max)
```

### Auth Flow
- Same-domain, no CORS issues. Session cookie `DORMSESSID` 7 روز.
- Login: `POST /api/auth/login.php {login: email|username, password}` → `SELECT * WHERE email=? OR username=?` → `password_verify` → `RateLimit login 5/900 IP`.
- Logout: `POST /api/auth/logout.php` → `session_destroy + delete user_sessions`.
- Session check: `GET /api/auth/session.php` → `{authenticated, user:{id,username,email,friend_code,level,xp,is_admin}, csrf}`.
- تشخیص بک‌اند در فرانت: `index.html` ماژول top-level `await fetch('/api/auth/session.php')` → `window.phpBackendAvailable`; `main.js Network.php` flag; `js/php_api.js` auto `php:ready` event.

### Validation / Anti-cheat / XP (server-side authoritative)
- همه اعداد در PHP چک (client قابل هک). XP/Level فقط سرور محاسبه؛ client مقدار را نمایش می‌دهد ولی DB merit است.
- `Validator` flags: speed>40 m/s، score>999999، distance>20000، duration<3 یا >3600، items>5000، combo>1000، score>maxPossible*1.8، rejected → `status=rejected` و leaderboard نمی‌رود.
- `pending → verified/flagged/rejected`؛ leaderboard `WHERE status='verified'` only؛ pagination `LIMIT 20` (کلاینت `?limit=50` max).
- Offline: `localStorage pendingRuns` (تا 20) → `POST /api/sync.php {runs:[...≤20]}` با transaction per run + duplicate protection (`SELECT run_id` → skip). Network failure → queue نگه داشته می‌شود.

---

## 3) cPanel / MySQL / Config / Domain / HTTPS / Admin / Backup / Debug

### cPanel مراحل (خلاصه HOSTING_GUIDE.md)
1. **Upload**: کل repo را به `public_html/` (یا `public_html/dorm/`) via FTP — پرمیشن 644/755.
2. **MySQL Databases**: بساز `username_dorm` + user + ALL privileges + یادداشت host localhost.
3. **phpMyAdmin Import**: انتخاب DB → Import → `database.sql` (331 خط) → utf8mb4 → Go → چک 15 جدول + FK.
4. **/install wizard**: مرورگر `https://yourdomain.com/install/` → فرم host/name/user/pass/app_url/admin → نصب → test PDO → CREATE DATABASE IF NOT EXISTS → explode `;` import (SET ها جداگانه) → admin `password_hash 12` + `user_characters` ×5 → write `config/config.php` با `addslashes` → `install.lock` + DB `install_lock` → قفل. (اگر خطا: دستی phpMyAdmin import سپس دوباره wizard).
5. **Config دستی (alternative)**: کپی `config.example.php` → `config.php` → ست `DB_*`, `APP_URL=https://...` (بدون / انتها), `APP_ENV=production`, `APP_DEBUG=false`, `SESSION_SECURE=true` اگر https.
6. **.htaccess**: از قبل شامل `Options -Indexes`, `FilesMatch Require all denied` برای config/.env/sql, `RedirectMatch 403` برای `/config|core|database|install|supabase`, Security headers, deflate, expires. بعد SSL، Force HTTPS block را uncomment کن.
7. **Domain/URL**: اگر ساب‌فولدر `public_html/dorm/` → `APP_URL=https://yourdomain.com/dorm`; همه API same-origin `/api/...` نیاز به CORS جدا ندارد.
8. **HTTPS**: cPanel → SSL/TLS Status → Let's Encrypt AutoSSL → فعال → `APP_URL https://` + `SESSION_SECURE true` (Cookie Secure).
9. **Production**: `APP_DEBUG false`, `display_errors Off`, `error_log /home/username/logs/php_error.log`.

### Admin Panel `/admin`
- URL `https://yourdomain.com/admin/` — شرط `Auth::user()->is_admin==1`; فرم لاگین `password_verify`.
- Dashboard queries: `COUNT users`, `runs_today`, `scores_today`, `flagged`, `challenges` + جدول `flaggedRuns` (`status=flagged`) + `recentRuns` + `users` با `is_admin` badge + logout `?logout=1`.

### Backup
- cPanel → **Backup** یا phpMyAdmin Export (Quick SQL) + FTP download هفتگی. Cron پیشنهادی: `mysqldump -u user -p dorm | gzip > ~/backups/dorm_$(date +%F).sql.gz`.

### Debug
- Log: `tail -f /home/username/logs/php_error.log`
- API test: `curl https://yourdomain.com/api/auth/session.php` → باید `{"success":true,"data":{"authenticated":false,"csrf":"..."}}`
- PHP lint: `php -l api/*.php core/*.php install/index.php admin/index.php`
- Import test: `mysql -u user -p dorm < database.sql`
- خطاها:
  | پیام | حل |
  |---|---|
  | `Database connection failed` | config.php + MySQL user privilege |
  | `CSRF` 403 | رفرش + `PhpApi.getCsrf()` |
  | 429 `RATE_LIMIT` | صبر 60ث |
  | score `flagged` | admin panel ببین |
  | صفحه سفید | `APP_DEBUG true` موقت |

---

## 4) تست E2E (چک‌لیست پاس شده محلی)

- Register → auto-login + migrated flag → DB users + user_characters
- Play → GameOver submit → Network.php → DB runs+scores verified
- Leaderboard 20 pagination: global/daily/weekly/friends/character با `?limit=20&offset=20` next page
- Mission XP: `missions/list.php` daily `2025-09-05` → after run progress inc → `claim.php` → XP + notification
- Friend code `DORM-XXXX` → request → pending → accept → friends leaderboard IN placeholders کار می‌کند
- Challenge: create seed 10000-99999 expires +7d → get by id/seed → submit GREATEST → creator notified
- Offline sync duplicate protection: `pendingRuns` queue → airplane mode → POST `/api/sync.php` batch 20 → duplicate run_id → `duplicate` status و عدم درج دوباره
- Cheat flagged: score 999999 یا speed 45m/s → status flagged → leaderboard نمی‌آید + admin flagged table می‌افتد

---

## 5) حفظ هویت بازی

- Frontend Canvas engine (IIFE, 60fps, DPR, responsive) هیچ منطق بازی حذف نشده — فقط data source از `localStorage-only` به `PhpApi + MySQL with offline cache` سوئیچ شد.
- b/w compat: `migrateOld()` هنوز `fed_records_v1` → `dorm_v3` را می‌خواند؛ `Migration.php` versioning دارد.

---

## 6) دستورات سریع

```bash
# لوکال تست MySQL
mysql -h localhost -u root -p dorm_escape < database.sql

# Cpanel file perms
find public_html -type f -exec chmod 644 {} \;
find public_html -type d -exec chmod 755 {} \;

# lint (در هاست اگر php موجود)
php -l api/runs/submit.php && php -l core/Validator.php
```

---

🎉 **آماده انتشار روی هر هاست اشتراکی معمولی (مثلاً Hostinger, IranServer, etc.) — فقط FTP + phpMyAdmin کافیست!**
