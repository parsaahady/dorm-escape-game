<?php
declare(strict_types=1);
class Csrf {
    public static function token(): string {
        if (empty($_SESSION[CSRF_TOKEN_NAME])) {
            $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
        }
        return $_SESSION[CSRF_TOKEN_NAME];
    }
    public static function verify(?string $token): bool {
        if (empty($token) || empty($_SESSION[CSRF_TOKEN_NAME])) return false;
        return hash_equals($_SESSION[CSRF_TOKEN_NAME], $token);
    }
    public static function checkRequest(): void {
        // Skip for GET, HEAD, OPTIONS
        if (in_array($_SERVER['REQUEST_METHOD'], ['GET','HEAD','OPTIONS'])) return;
        // For JSON APIs, token can be in header X-CSRF-Token or body _csrf
        $header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        $body = $_POST[CSRF_TOKEN_NAME] ?? null;
        if ($body === null) {
            $raw = file_get_contents('php://input');
            if ($raw) {
                $json = json_decode($raw, true);
                if (is_array($json)) $body = $json[CSRF_TOKEN_NAME] ?? $json['_csrf'] ?? null;
            }
        }
        $token = $header ?: $body;
        // Allow API calls with session cookie to require CSRF; if no session, skip (guest)
        if (!isset($_SESSION['user_id']) && empty($token)) return; // guest offline queue will be validated after login
        if (isset($_SESSION['user_id']) && !self::verify($token)) {
            Response::error('CSRF_INVALID', 'Invalid CSRF token. Refresh page.', 403);
        }
    }
}
