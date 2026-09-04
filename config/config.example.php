<?php
/**
 * Dorm Escape — Config example
 * Copy to config.php and fill real values. NEVER commit config.php with real password.
 * PHP 8.2+ required
 */
declare(strict_types=1);

// --- Database ---
define('DB_HOST', 'localhost');
define('DB_NAME', 'dorm_escape');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');
define('DB_CHARSET', 'utf8mb4');
define('DB_PORT', '3306');

// --- App ---
define('APP_URL', 'https://example.com'); // no trailing slash, e.g. https://mydomain.com
define('APP_ENV', 'production'); // development | production
define('APP_NAME', 'فرار از خوابگاه');
define('APP_DEBUG', false);

// --- Session ---
define('SESSION_NAME', 'DORMSESSID');
define('SESSION_LIFETIME', 60*60*24*7); // 7 days
define('SESSION_SECURE', true); // true if HTTPS
define('SESSION_HTTPONLY', true);
define('SESSION_SAMESITE', 'Lax'); // Lax | Strict | None

// --- Security ---
define('CSRF_TOKEN_NAME', '_csrf');
define('BCRYPT_COST', 12);

// --- Rate Limit ---
define('RATE_LIMIT_LOGIN', 5); // attempts
define('RATE_LIMIT_WINDOW', 900); // seconds (15 min)
define('RATE_LIMIT_SCORE', 10); // per minute

// --- Optional: Supabase legacy (if still needed) ---
// define('SUPABASE_URL', '');
// define('SUPABASE_KEY', '');
