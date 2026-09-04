<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
requirePost();
RateLimit::check('login', 5, 900);

$data = getJsonInput();
$login = trim($data['login'] ?? $data['email'] ?? $data['username'] ?? $_POST['login'] ?? $_POST['email'] ?? $_POST['username'] ?? '');
$password = $data['password'] ?? $_POST['password'] ?? '';

if ($login === '' || $password === '') Response::error('MISSING_FIELDS', 'Email/username and password required', 400);

$user = Database::fetch('SELECT * FROM users WHERE email = ? OR username = ?', [$login, $login]);
if (!$user || !Auth::verifyPassword($password, $user['password_hash'])) {
    Response::error('INVALID_CREDENTIALS', 'Invalid email/username or password', 401);
}

Auth::login((int)$user['id']);
$clean = Database::fetch('SELECT id, username, email, display_name, avatar, friend_code, level, xp, total_xp, reputation, reputation_rank, is_admin, created_at FROM users WHERE id = ?', [$user['id']]);
Response::success(['user'=>$clean, 'csrf'=>Csrf::token()]);
