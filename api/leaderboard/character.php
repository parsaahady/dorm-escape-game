<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$character = $_GET['character'] ?? $_GET['id'] ?? null;
if (!$character || !in_array($character, ['parsa','mahyar','arsham','mohsen','farham'])) Response::error('INVALID_CHARACTER','character required',400);
$limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));
$offset = max(0, (int)($_GET['offset'] ?? 0));
$sql = "SELECT s.id, s.run_id, s.user_id, s.username, s.avatar, s.character_id, s.score, s.distance, s.cigs, s.combo, s.created_at,
               (SELECT COUNT(*)+1 FROM scores s2 WHERE s2.score > s.score AND s2.status='verified' AND s2.character_id = ?) as rank
        FROM scores s WHERE s.status='verified' AND s.character_id = ? ORDER BY s.score DESC LIMIT $limit OFFSET $offset";
$rows = Database::fetchAll($sql, [$character, $character]);
foreach ($rows as &$r) $r['rank']=(int)$r['rank'];
Response::success(['character'=>$character,'leaderboard'=>$rows]);
