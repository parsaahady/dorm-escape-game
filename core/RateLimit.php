<?php
declare(strict_types=1);
require_once __DIR__ . '/Database.php';

class RateLimit {
    // simple DB based rate limit per IP + endpoint
    public static function check(string $endpoint, int $max, int $windowSeconds): void {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $key = $endpoint . ':' . $ip;
        $now = time();
        $windowStart = date('Y-m-d H:i:s', $now - $windowSeconds);
        // cleanup old
        try {
            Database::query('DELETE FROM rate_limits WHERE window_start < ?', [$windowStart]);
        } catch (Throwable $e) {
            // table may not exist yet (during install)
        }
        // count
        $row = Database::fetch('SELECT COUNT(*) as c FROM rate_limits WHERE endpoint = ? AND ip = ? AND window_start > ?', [$endpoint, $ip, $windowStart]);
        $count = $row ? (int)$row['c'] : 0;
        if ($count >= $max) {
            Response::error('RATE_LIMITED', 'Too many requests. Try later.', 429);
        }
        // record
        Database::query('INSERT INTO rate_limits (endpoint, ip, window_start) VALUES (?,?,NOW())', [$endpoint, $ip]);
    }

    public static function checkUser(int $userId, string $endpoint, int $max, int $windowSeconds): void {
        $now = time();
        $windowStart = date('Y-m-d H:i:s', $now - $windowSeconds);
        $row = Database::fetch('SELECT COUNT(*) as c FROM runs WHERE user_id = ? AND created_at > ?', [$userId, $windowStart]);
        $count = $row ? (int)$row['c'] : 0;
        if ($count >= $max) {
            Response::error('RATE_LIMITED', 'Too many runs. Slow down.', 429);
        }
    }
}
