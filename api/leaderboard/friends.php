<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$user = Auth::requireAuth();
$limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));
$offset = max(0, (int)($_GET['offset'] ?? 0));
// get friend ids
$friends = Database::fetchAll('SELECT CASE WHEN requester_id = ? THEN receiver_id ELSE requester_id END as fid FROM friendships WHERE (requester_id = ? OR receiver_id = ?) AND status="accepted"', [$user['id'],$user['id'],$user['id']]);
$ids = array_map(fn($r)=> (int)$r['fid'], $friends);
$ids[] = (int)$user['id'];
$placeholders = implode(',', array_fill(0, count($ids), '?'));
$sql = "SELECT s.id, s.run_id, s.user_id, s.username, s.avatar, s.character_id, s.score, s.distance, s.cigs, s.combo, s.created_at,
               (SELECT COUNT(*)+1 FROM scores s2 WHERE s2.score > s.score AND s2.status='verified' AND s2.user_id IN ($placeholders)) as rank
        FROM scores s WHERE s.status='verified' AND s.user_id IN ($placeholders)
        ORDER BY s.score DESC LIMIT $limit OFFSET $offset";
$params = array_merge($ids, $ids);
$rows = Database::fetchAll($sql, $params);
foreach ($rows as &$r) $r['rank']=(int)$r['rank'];
if (empty($rows)) Response::success(['leaderboard'=>[], 'message'=>'No friends scores yet']);
Response::success(['leaderboard'=>$rows]);
