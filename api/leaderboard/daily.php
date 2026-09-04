<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));
$offset = max(0, (int)($_GET['offset'] ?? 0));
$character = $_GET['character'] ?? null;
if ($character && !in_array($character, ['parsa','mahyar','arsham','mohsen','farham'])) $character = null;
$today = date('Y-m-d');
$where = 's.status="verified" AND DATE(s.created_at) = ?';
$params = [$today];
if ($character) { $where .= ' AND s.character_id = ?'; $params[] = $character; }
$sql = "SELECT s.id, s.run_id, s.user_id, s.username, s.avatar, s.character_id, s.score, s.distance, s.cigs, s.combo, s.created_at,
               (SELECT COUNT(*)+1 FROM scores s2 WHERE s2.score > s.score AND s2.status='verified' AND DATE(s2.created_at) = '$today'".($character?" AND s2.character_id = '".addslashes($character)."'":"").") as rank
        FROM scores s WHERE $where ORDER BY s.score DESC LIMIT $limit OFFSET $offset";
$rows = Database::fetchAll($sql, $params);
foreach ($rows as &$r) $r['rank']=(int)$r['rank'];
Response::success(['leaderboard'=>$rows, 'date'=>$today]);
