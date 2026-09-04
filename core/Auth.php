<?php
declare(strict_types=1);
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Response.php';

class Auth {
    public static function startSession(): void {
        if (session_status() === PHP_SESSION_ACTIVE) return;
        // secure session cookie params - InfinityFree (Cloudflare Flexible) sends https to browser but http to origin -> secure cookie would be dropped
        $secure = defined('SESSION_SECURE') ? SESSION_SECURE : false;
        if (isset($_SERVER['HTTP_HOST']) && stripos($_SERVER['HTTP_HOST'], 'infinityfree') !== false) $secure = false;
        elseif ($secure && empty($_SERVER['HTTPS']) && (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') !== 'https')) $secure = false;
        $httponly = defined('SESSION_HTTPONLY') ? SESSION_HTTPONLY : true;
        $samesite = defined('SESSION_SAMESITE') ? SESSION_SAMESITE : 'Lax';
        $lifetime = defined('SESSION_LIFETIME') ? SESSION_LIFETIME : 0;
        $name = defined('SESSION_NAME') ? SESSION_NAME : 'PHPSESSID';
        session_name($name);
        $params = session_get_cookie_params();
        session_set_cookie_params([
            'lifetime' => $lifetime,
            'path' => $params['path'] ?? '/',
            'domain' => $params['domain'] ?? '',
            'secure' => $secure,
            'httponly' => $httponly,
            'samesite' => $samesite
        ]);
        session_start();
        // prevent fixation: regenerate periodically
        if (empty($_SESSION['initiated'])) {
            session_regenerate_id(true);
            $_SESSION['initiated'] = true;
        }
    }

    public static function user(): ?array {
        self::startSession();
        if (empty($_SESSION['user_id'])) return null;
        return Database::fetch('SELECT * FROM users WHERE id = ?', [(int)$_SESSION['user_id']]);
    }

    public static function requireAuth(): array {
        $u = self::user();
        if (!$u) Response::error('UNAUTHORIZED', 'Login required', 401);
        return $u;
    }

    public static function requireAdmin(): array {
        $u = self::requireAuth();
        if (empty($u['is_admin'])) Response::error('FORBIDDEN', 'Admin required', 403);
        return $u;
    }

    public static function login(int $userId): void {
        self::startSession();
        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;
        $_SESSION['login_time'] = time();
        // update last_login
        Database::query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [$userId]);
    }

    public static function logout(): void {
        self::startSession();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time()-42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
    }

    public static function hashPassword(string $pw): string {
        return password_hash($pw, PASSWORD_BCRYPT, ['cost'=> BCRYPT_COST]);
    }

    public static function verifyPassword(string $pw, string $hash): bool {
        return password_verify($pw, $hash);
    }

    public static function validateUsername(string $u): ?string {
        $u = trim($u);
        if (mb_strlen($u) < 2) return 'Username too short (min 2)';
        if (mb_strlen($u) > 32) return 'Username too long (max 32)';
        if (!preg_match('/^[\p{L}\p{N}_\-\.\s]+$/u', $u)) return 'Username contains invalid characters';
        return null;
    }
    public static function validateEmail(string $e): ?string {
        $e = trim($e);
        if (!filter_var($e, FILTER_VALIDATE_EMAIL)) return 'Invalid email';
        if (strlen($e) > 255) return 'Email too long';
        return null;
    }
    public static function validatePassword(string $p): ?string {
        if (strlen($p) < 6) return 'Password too short (min 6)';
        if (strlen($p) > 72) return 'Password too long';
        return null;
    }
}
