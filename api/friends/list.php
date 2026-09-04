<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$user = Auth::requireAuth();
$type = $_GET['type'] ?? 'friends'; // friends|pending|all
if ($type === 'pending') {
    $rows = Database::fetchAll('SELECT f.*, u.username as requester_name, u.avatar as requester_avatar FROM friendships f JOIN users u ON u.id=f.requester_id WHERE f.receiver_id=? AND f.status="pending" ORDER BY f.created_at DESC', [$user['id']]);
} elseif ($type === 'all') {
    $rows = Database::fetchAll('SELECT f.*, r.username as requester_name, v.username as receiver_name FROM friendships f JOIN users r ON r.id=f.requester_id JOIN users v ON v.id=f.receiver_id WHERE (f.requester_id=? OR f.receiver_id=?) ORDER BY f.created_at DESC', [$user['id'],$user['id']]);
} else {
    $rows = Database::fetchAll('SELECT f.*, u.username, u.avatar, u.friend_code, u.level FROM friendships f JOIN users u ON u.id = CASE WHEN f.requester_id=? THEN f.receiver_id ELSE f.requester_id END WHERE (f.requester_id=? OR f.receiver_id=?) AND f.status="accepted" ORDER BY f.updated_at DESC', [$user['id'],$user['id'],$user['id']]);
}
Response::success(['friends'=>$rows, 'count'=>count($rows)]);
