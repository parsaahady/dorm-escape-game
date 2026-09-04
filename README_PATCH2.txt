PATCH 2 — 2026-09-05 — Fix admin login + game freeze (catch→freeze)
=========================================================
Problems fixed:
 1) Admin login fails on InfinityFree (Cloudflare Flexible HTTPS): session Secure cookie dropped → forced SESSION_SECURE false
    Fixed files: config/config.php + core/Auth.php (both detect infinityfree → secure false)
 2) Game freezes on loss (catch animation then stuck): DB.stats.zonesSeen Set → JSON {} → .add is not a function in showOver()
    Fixed file: main.js (stores zonesSeen as array, load converts to Set/array, showOver wrapped in try/catch)
 3) Includes debug_admin.php to verify DB/admin password_verify/session
 4) .htaccess already fixed for /install 403 (re-included for safety)

INSTALL (if you already uploaded 2026-09-04 21:06 zip):
 1. Upload patch2.zip to htdocs
 2. In file manager: Extract → Overwrite YES (Overwrite existing files)
 3. In cPanel → PHP Version: set 8.1 or 8.2
 4. Visit https://YOURDOMAIN/debug_admin.php
    - Check SESSION_SECURE = false (green)
    - Test password_verify with your admin username + password
    - If verify TRUE but login still redirects → cookie issue was fixed by patch (retry after Ctrl+F5)
    - If no is_admin=1 → run sql: UPDATE users SET is_admin=1 WHERE username='YOURNAME'
 5. For game freeze: either run in browser console: localStorage.removeItem('dorm_v3'); location.reload();
    OR visit debug_admin.php section 4 → copy console snippet → then reload game and collide to test over screen
 6. Delete debug_admin.php after!

FULL REINSTALL (alternative):
  Upload new dorm-escape-php.zip (916KB rebuilt 2026-09-05) → Extract overwrite YES → then set PHP Version 8.1/8.2 → test

Contains:
 - config/config.php (2.8K, secure false on infinityfree)
 - core/Auth.php (fallback secure false)
 - main.js (165K patched, zonesSeen array + try/catch)
 - .htaccess (2586B, install allowed)
 - debug_admin.php (diagnostic)
 - api/bootstrap.php + install/index.php polyfills (already in full zip)

After patch, re-test: /admin/login.php → should stay logged in → /admin/index.php → game loss → should show over screen with score.
