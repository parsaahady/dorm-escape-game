<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$user = Auth::requireAuth();
requirePost();
Csrf::checkRequest();
$data = getJsonInput();
$id = (int)($data['id'] ?? $data['friendship_id'] ?? $_POST['id'] ?? 0);
$action = strtolower(trim($data['action'] ?? $_POST['action'] ?? 'accept')); // accept|reject|remove|block
if (!$id) Response::error('MISSING','friendship id required',400);
$fs = Database::fetch('SELECT * FROM friendships WHERE id = ?', [$id]);
if (!$fs) Response::error('NOT_FOUND','Friendship not found',404);
if ((int)$fs['receiver_id'] !== (int)$user['id'] && (int)$fs['requester_id'] !== (int)$user['id']) Response::error('FORBIDDEN','Not your friendship',403);

if ($action === 'accept') {
    if ((int)$fs['receiver_id'] !== (int)$user['id']) Response::error('FORBIDDEN','Only receiver can accept',403);
    if ($fs['status'] !== 'pending') Response::error('INVALID','Not pending',400);
    Database::query('UPDATE friendships SET status="accepted" WHERE id=?', [$id]);
    Database::query('INSERT INTO notifications (user_id, title, body, type) VALUES (?,?,?,?)', [$fs['requester_id'], '✅ دوستی قبول شد', $user['username'].' درخواستت را قبول کرد', 'friend']);
    Response::success(null,'Accepted');
} elseif ($action === 'reject') {
    Database::query('UPDATE friendships SET status="rejected" WHERE id=?', [$id]);
    Response::success(null,'Rejected');
} elseif ($action === 'remove' || $action === 'unfriend') {
    Database::query('DELETE FROM friendships WHERE id=?', [$id]);
    Response::success(null,'Removed');
} elseif ($action === 'block') {
    Database::query('UPDATE friendships SET status="blocked" WHERE id=?', [$id]);
    Response::success(null,'Blocked');
} else Response::error('INVALID_ACTION','Unknown action',400);
