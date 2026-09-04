<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
requirePost();
RateLimit::check('register', 5, 3600);

$data = getJsonInput();
$username = trim($data['username'] ?? $_POST['username'] ?? '');
$email = trim($data['email'] ?? $_POST['email'] ?? '');
$password = $data['password'] ?? $_POST['password'] ?? '';
$guestData = $data['guestData'] ?? null; // for migration

if (($e = Auth::validateUsername($username)) !== null) Response::error('INVALID_USERNAME', $e, 400);
if (($e = Auth::validateEmail($email)) !== null) Response::error('INVALID_EMAIL', $e, 400);
if (($e = Auth::validatePassword($password)) !== null) Response::error('INVALID_PASSWORD', $e, 400);

// check duplicates
if (Database::fetch('SELECT id FROM users WHERE username = ?', [$username])) Response::error('USERNAME_TAKEN', 'Username already taken', 409);
if (Database::fetch('SELECT id FROM users WHERE email = ?', [$email])) Response::error('EMAIL_TAKEN', 'Email already taken', 409);

// generate friend code
function genFriendCode(): string {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $code = 'DORM-';
    for ($i=0;$i<4;$i++) $code .= $chars[random_int(0, strlen($chars)-1)];
    return $code;
}
$friendCode = genFriendCode();
while (Database::fetch('SELECT id FROM users WHERE friend_code = ?', [$friendCode])) $friendCode = genFriendCode();

$hash = Auth::hashPassword($password);
Database::query('INSERT INTO users (username, email, password_hash, display_name, avatar, friend_code) VALUES (?,?,?,?,?,?)',
    [$username, $email, $hash, $username, '😎', $friendCode]);
$userId = (int)Database::lastInsertId();

// init user_characters
foreach (['parsa','mahyar','arsham','mohsen','farham'] as $cid) {
    Database::query('INSERT IGNORE INTO user_characters (user_id, character_id) VALUES (?,?)', [$userId, $cid]);
}
// init daily missions for today period? leave to claim lazily

// auto login
Auth::login($userId);

$user = Database::fetch('SELECT id, username, email, display_name, avatar, friend_code, level, xp, total_xp, reputation, reputation_rank, is_admin, created_at FROM users WHERE id = ?', [$userId]);

// guest migration if provided
$migrated = null;
if ($guestData && is_array($guestData)) {
    try {
        require_once __DIR__ . '/../../core/Migration.php';
        $migrated = Migration::migrateGuest($userId, $guestData);
    } catch (Throwable $e) {
        error_log('[migrate] ' . $e->getMessage());
    }
}

Response::success(['user'=>$user, 'csrf'=>Csrf::token(), 'migrated'=>$migrated], 'Registered', 201);
