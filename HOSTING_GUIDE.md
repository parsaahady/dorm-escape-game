# Hosting Guide — فرار از خوابگاه روی هاست اشتراکی (cPanel + PHP + MySQL)

> هدف: انتشار بازی روی هاست اشتراکی ارزان (Apache 2.4 + PHP 8.2/8.3 + MySQL 8 / MariaDB 10.4+) بدون Node/Python، فقط با FTP/phpMyAdmin.

---

## 1) پیش‌نیازها

- هاست با: **Apache + mod_rewrite + mod_headers + mod_expires + mod_deflate + PDO MySQL**
- PHP نسخه **8.2+** (تست شده تا 8.3) و `display_errors Off` در پروداکشن
- MySQL 8+ یا MariaDB 10.4+ و دسترسی phpMyAdmin
- دامنه + SSL (Let's Encrypt رایگان کافیه) — برای `Secure` Cookie الزامی

---

## 2) آپلود فایل‌ها

1. دانلود/کلون ریپازیتوری.
2. با FTP (FileZilla) کل محتوای `repo/` را داخل `public_html/` آپلود کن (اگر هاست ساب‌فولدر `public_html/dorm/` می‌خوای، `APP_URL` را همان بگذار).
3. پرمیشن‌ها: فایل‌ها `644`، پوشه‌ها `755`. **هرگز `777` نده.**
4. مطمئن شو `.htaccess` آپلود شده (فایل مخفی — در FileZilla گزینه Show hidden files).

```bash
# ساختار مقصد
public_html/
  index.html
  main.js
  style.css
  .htaccess
  database.sql
  config/
  api/
  core/
  install/
  admin/
  assets/
  js/
```

---

## 3) ساخت دیتابیس (cPanel → MySQL Databases)

1. cPanel → **MySQL® Databases** → دیتابیس جدید بساز مثلاً `username_dorm`.
2. یک User جدید بساز (پسورد قوی) و به دیتابیس Add کن با Privileges: `ALL`.
3. نام‌ها را یادداشت کن:
   - Host: `localhost` (معمولاً)
   - Name: `username_dorm`
   - User: `username_dormuser`
   - Pass: `...`

---

## 4) ایمپورت اسکیما

### گزینه A — phpMyAdmin (پیشنهادی)

1. cPanel → **phpMyAdmin** → دیتابیس `username_dorm` را انتخاب کن.
2. تب **Import** → فایل `database.sql` (ریشه ریپو، 331 خط) را انتخاب کن.
3. Charset `utf8mb4` → **Go**. باید 15+ جدول ساخته شود:
   `users, user_sessions, scores, runs, characters, user_characters, missions, user_missions, achievements, user_achievements, daily_challenges, weekly_leagues, friendships, friend_challenges, notifications`
4. تب Structure را چک کن: FKها، Uniqueها (`friend_code`, `username`, `email`, `uq_run`, ...) و Indexها.

### گزینه B — Source via SQL

```sql
SOURCE /home/username/public_html/database.sql;
```

### گزینه C — ویزارد `/install` (خودکار)

اگر نخواستی دستی Import کنی، مستقیم به گام 5 برو — ویزارد خودش `database.sql` را ایمپورت می‌کند.

---

## 5) نصب با ویزارد `/install`

1. مرورگر را باز کن: `https://yourdomain.com/install/`
2. فرم را پر کن:
   - **DB Host** `localhost`
   - **DB Name** `username_dorm`
   - **DB User** `username_dormuser`
   - **DB Pass** `***`
   - **App URL** `https://yourdomain.com` (بدون `/` انتها — اگر در ساب‌فولدر است `https://yourdomain.com/dorm`)
   - **Admin Username/Email/Pass** (ادمین پنل)
3. دکمه **نصب**: ویزارد
   - اتصال PDO را تست می‌کند → `CREATE DATABASE IF NOT EXISTS`
   - `database.sql` را `explode(';')` با مدیریت `SET` ها ایمپورت می‌کند
   - ادمین (`is_admin=1`) را با `password_hash(..., BCRYPT, cost 12)` می‌سازد + `user_characters` پیش‌فرض
   - فایل `config/config.php` را با escapes می‌نویسد
   - `install.lock` (فایل) + سطر `install_lock` در DB می‌گذارد و قفل می‌کند

> بعد از موفقیت، پوشه `install/` دیگر قابل دسترسی نیست (`.htaccess` + قفل PHP).

**خطا دیدی؟**

- `Connection failed` → Host/User/Pass را چک کن، مطمئن شو User به DB اضافه شده.
- `SQL import failed` → دستی با phpMyAdmin ایمپورت کن سپس ویزارد را دوباره بزن (ادمین دوباره ساخته می‌شود).

---

## 6) تنظیمات `config/config.php` (دستی، اگر بدون ویزارد)

از `config/config.example.php` کپی کن:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'username_dorm');
define('DB_USER', 'username_dormuser');
define('DB_PASS', '***');
define('APP_URL', 'https://yourdomain.com');
define('APP_ENV', 'production');
define('APP_DEBUG', false);
define('SESSION_SECURE', true); // اگر https داری
```

> `.env` هم پشتیبانی می‌شود: اگر فایل `.env` در ریشه باشد، `config.php` آن را لود می‌کند. **هرگز `.env` یا `config.php` را کامیت نکن.**

---

## 7) `.htaccess` و امنیت

فایل `.htaccess` از قبل شامل:

- `Options -Indexes` (عدم نمایش لیست فایل)
- Deny برای `config.php, .env, database.sql, install.lock, *.sql, *.log`
- `RedirectMatch 403` برای `/(config|core|database|install|supabase)/.*\.(php|sql|log|env)`
- Security headers: `X-Content-Type-Options nosniff`, `X-Frame-Options SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, `CSP`
- `deflate` و `expires` برای کش/کمپرس
- کامنت برای Force HTTPS و Pretty URL rewrite

**بعد از SSL فعال شد، این را باز کن:**

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains" env=HTTPS
```

---

## 8) SSL (HTTPS)

- cPanel → **SSL/TLS Status** → AutoSSL / Let's Encrypt → دامنه را فعال کن.
- `APP_URL` حتما `https://` باشد و `SESSION_SECURE=true`.
- Cookieها `HttpOnly + Secure + SameSite=Lax` هستند (در `api/bootstrap.php` + `core/Auth.php`).

---

## 9) URL و دامنه

- اگر در ساب‌فولدر نسب کردی: `APP_URL=https://yourdomain.com/dorm` و فایل‌ها را داخل `public_html/dorm/` بگذار.
- همه APIها Same-Origin هستند (`/api/...`) — نیازی به CORS جدا نیست. اگر خواستید دامنه جدا دهید، `APP_URL` را درست ست کن.

---

## 10) پروداکشن مود

- در `config/config.php`: `APP_ENV=production`, `APP_DEBUG=false`
- در `.htaccess`: `php_flag display_errors Off` و `error_log` را به `/home/username/logs/php_error.log` بده (پوشه logs را 750 بساز).
- `install/` بعد از نصب قابل حذف یا ماندن قفل است.

---

## 11) پنل ادمین `/admin`

- آدرس: `https://yourdomain.com/admin/`
- لاگین با یوزر/ایمیل ادمینی که در ویزارد ساختی (`is_admin=1`).
- نمایش: `users`, `runs_today`, `scores_today`, `flagged runs`, `challenges` + جدول Flagged/Recent + لیست کاربران.
- Flagged = ران‌های `status=flagged` (مثلاً speed >40m/s یا score >999999 یا inconsistent).

---

## 12) بکاپ و دیباگ

**بکاپ:**

- cPanel → **Backup** یا phpMyAdmin → Export (`Quick + SQL`) + دانلود فایل‌ها via FTP.
- پیشنهاد: هفته‌ای یک بار Export خودکار (Cron + `mysqldump`).

**دیباگ:**

- لاگ PHP: `tail -f /home/username/logs/php_error.log`
- اگر `500`: `APP_DEBUG=true` موقت، سپس صفحه `/api/auth/session.php` را باز کن — باید `{success:true, data:{authenticated:false}}`.
- `php -l` روی فایل‌های `api/*.php`, `core/*.php`, `install/index.php`, `admin/index.php`.
- `database.sql` را می‌توان با `mysql -u user -p dorm < database.sql` تست کرد.

---

## 13) مهاجرت Guest → Register (اتومات)

- هر بازدیدکننده مهمان در `localStorage['dorm_v3']` بازی می‌کند (Offline-First).
- هنگام **Register/Login**، فرانت `PhpApi.register(username,email,pass, guestData)` می‌زنـد → `core/Migration.php::migrateGuest()` اجرا می‌شود:
  - `totalXp → level` با فرمول `500+(lv-1)*350`
  - `cachedBoard → runs/scores`
  - `characters levels/xp` با `GREATEST + sum`
  - `achievements`
  - در Transaction، Idempotent (اجرا دوباره مشکلی ندارد).

---

## 14) API خلاصه

همه پاسخ‌ها `{success:boolean, data|error:{code,message}}` + HTTP code.

| Endpoint | Method | توضیح |
|---|---|---|
| `/api/auth/register.php` | POST | `username,email,password,guestData` → `password_hash BCRYPT 12`, `friend_code DORM-XXXX`, auto-login, migrate |
| `/api/auth/login.php` | POST | `login`(email/user), `password` → RateLimit 5/900 |
| `/api/auth/logout.php` | POST | invalidate session |
| `/api/auth/session.php` | GET | `authenticated,user,csrf` |
| `/api/auth/csrf.php` | GET | `csrf` |
| `/api/user/profile.php` | GET/POST | GET user+chars+stats, POST update `display_name/avatar` |
| `/api/runs/submit.php` | POST | `Csrf+RateLimit`, validate, `status verified/flagged/rejected`, transaction |
| `/api/sync.php` | POST | batch 20 با duplicate protection |
| `/api/leaderboard/{global,daily,weekly,friends,character}.php` | GET | `limit 20-50, offset, character`, rank subquery |
| `/api/missions/list.php` + `claim.php` | GET/POST | period `today / Y-W` lazy ensure |
| `/api/achievements/list.php` | GET | lazy ensure |
| `/api/friends/{request,accept,list}.php` | POST/GET | `DORM-XXXX` regex, pending/accepted/blocked |
| `/api/challenges/{create,get,submit}.php` | POST/GET | seed 10k-99k, expires +7d, GREATEST |
| `/api/notifications/{list,mark_read}.php` | GET/POST |  |
| `/api/daily/challenge.php` | GET | seed `crc32(date)` |
| `/api/stats.php` | GET | weekly tier bronze/silver/gold/diamond |

---

## 15) چک‌لیست انتشار

- [ ] فایل‌ها آپلود + پرمیشن 644/755
- [ ] دیتابیس + user + phpMyAdmin import `database.sql`
- [ ] `/install` اجرا → `config.php` + `install.lock`
- [ ] `APP_URL` = دامنه نهایی با `https`
- [ ] SSL فعال + Force HTTPS باز شده
- [ ] `php -l` پاس، `/api/auth/session.php` = 200
- [ ] Register → Play → Submit → Leaderboard → Mission Claim → Friend Add → Challenge → Offline Sync تست شد
- [ ] Admin login تست شد

---

## 16) عیب‌یابی سریع

| علامت | دلیل | حل |
|---|---|---|
| `Database connection failed` | credential اشتباه | `config.php` و MySQL User privilege |
| `CSRF` 403 | توکن منقضی | صفحه را رفرش کن، `PhpApi.getCsrf()` دوباره |
| `RATE_LIMIT` 429 | بیش از حد درخواست | 60 ثانیه صبر |
| `score flagged` | تقلب (speed 45m/s یا score 999999) | در `admin` ببین، RateLimit هم هست |
| سفید بعد نصب | `display_errors Off` و خطا مخفی | `APP_DEBUG=true` موقت |

---

موفق باشی! 🎉 اگر خواستی از GitHub Pages قبلی بیای روی همین هاست، فقط CNAME را به هاست جدید بده و `APP_URL` را آپدیت کن.
