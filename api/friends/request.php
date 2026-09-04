<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$user = Auth::requireAuth();
requirePost();
Csrf::checkRequest();
RateLimit::check('friend_request', 10, 3600);
$data = getJsonInput();
$code = strtoupper(trim($data['friend_code'] ?? $data['code'] ?? $_POST['friend_code'] ?? ''));
if (!preg_match('/^DORM-[A-Z0-9]{4}$/', $code)) Response::error('INVALID_CODE','Invalid friend code format. Example: DORM-7X92',400);
$target = Database::fetch('SELECT id, username FROM users WHERE friend_code = ?', [$code]);
if (!$target) Response::error('NOT_FOUND','Friend code not found',404);
if ((int)$target['id'] === (int)$user['id']) Response::error('SELF','Cannot add yourself',400);
$existing = Database::fetch('SELECT * FROM friendships WHERE (requester_id=? AND receiver_id=?) OR (requester_id=? AND receiver_id=?)', [$user['id'],$target['id'],$target['id'],$user['id']]);
if ($existing) {
    if ($existing['status']==='accepted') Response::error('ALREADY_FRIENDS','Already friends',400);
    if ($existing['status']==='pending') Response::error('PENDING','Request already pending',400);
    if ($existing['status']==='blocked') Response::error('BLOCKED','Cannot send request',400);
}
Database::query('INSERT INTO friendships (requester_id, receiver_id, status) VALUES (?,?, "pending")', [$user['id'], $target['id']]);
$fid = (int)Database::lastInsertId();
Database::query('INSERT INTO notifications (user_id, title, body, type) VALUES (?,?,?,?)', [$target['id'], '👥 درخواست دوستی', $user['username'].' برایت درخواست دوستی فرستاد', 'friend']);
Response::success(['friendship_id'=>$fid, 'target'=>$target['username']], 'Request sent', 201);
