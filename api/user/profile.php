<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$user = Auth::requireAuth();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $u = Database::fetch('SELECT id, username, email, display_name, avatar, friend_code, level, xp, total_xp, reputation, reputation_rank, is_admin, created_at, last_login_at FROM users WHERE id = ?', [$user['id']]);
    $chars = Database::fetchAll('SELECT * FROM user_characters WHERE user_id = ?', [$user['id']]);
    $stats = Database::fetch('SELECT COUNT(*) as totalRuns, COALESCE(SUM(distance),0) as totalDistance, COALESCE(SUM(items_collected),0) as totalCigs, COALESCE(MAX(score),0) as bestScore, COALESCE(MAX(distance),0) as bestDistance, COALESCE(MAX(best_combo),0) as bestCombo, COALESCE(SUM(duration),0) as totalPlay FROM runs WHERE user_id = ? AND status != "rejected"', [$user['id']]);
    Response::success(['user'=>$u, 'characters'=>$chars, 'stats'=>$stats]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    Csrf::checkRequest();
    RateLimit::check('profile_update', 10, 60);
    $data = getJsonInput();
    $display = trim($data['display_name'] ?? $data['username'] ?? $_POST['display_name'] ?? $_POST['username'] ?? $user['username']);
    $avatar = trim($data['avatar'] ?? $_POST['avatar'] ?? $user['avatar']);
    // validate
    if (($e = Auth::validateUsername($display)) !== null) Response::error('INVALID_USERNAME', $e, 400);
    if (mb_strlen($avatar) > 16) $avatar = mb_substr($avatar, 0, 16);
    // check unique if changed
    if ($display !== $user['username'] && Database::fetch('SELECT id FROM users WHERE username = ? AND id != ?', [$display, $user['id']])) {
        Response::error('USERNAME_TAKEN', 'Username taken', 409);
    }
    Database::query('UPDATE users SET username = ?, display_name = ?, avatar = ?, updated_at = NOW() WHERE id = ?', [$display, $display, $avatar, $user['id']]);
    $u = Database::fetch('SELECT id, username, email, display_name, avatar, friend_code, level, xp, total_xp FROM users WHERE id = ?', [$user['id']]);
    Response::success(['user'=>$u]);
}
Response::error('METHOD_NOT_ALLOWED','Use GET or POST',405);
