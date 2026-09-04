<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));
$offset = max(0, (int)($_GET['offset'] ?? 0));
$character = $_GET['character'] ?? null;
if ($character && !in_array($character, ['parsa','mahyar','arsham','mohsen','farham'])) $character = null;

$where = 's.status="verified"';
$params = [];
if ($character) { $where .= ' AND s.character_id = ?'; $params[] = $character; }

$sql = "SELECT s.id, s.run_id, s.user_id, s.username, s.avatar, s.character_id, s.score, s.distance, s.cigs, s.combo, s.seed, s.environment, s.created_at,
               (SELECT COUNT(*)+1 FROM scores s2 WHERE s2.score > s.score AND s2.status='verified'".($character?" AND s2.character_id = '".addslashes($character)."'":"").") as rank
        FROM scores s
        JOIN users u ON u.id = s.user_id
        WHERE $where
        ORDER BY s.score DESC, s.created_at ASC
        LIMIT $limit OFFSET $offset";
$rows = Database::fetchAll($sql, $params);
// enrich avatar if missing
foreach ($rows as &$r) {
    if (empty($r['avatar'])) $r['avatar'] = '😎';
    $r['rank'] = (int)$r['rank'];
    $r['score'] = (int)$r['score'];
}
// my rank if authenticated
$myRank = null;
$user = Auth::user();
if ($user) {
    $myScore = Database::fetch('SELECT MAX(score) as m FROM scores WHERE user_id = ? AND status="verified"', [$user['id']]);
    if ($myScore && $myScore['m']) {
        $mr = Database::fetch('SELECT COUNT(*)+1 as rank FROM scores WHERE score > ? AND status="verified"', [$myScore['m']]);
        $myRank = $mr ? (int)$mr['rank'] : null;
    }
}
Response::success(['leaderboard'=>$rows, 'myRank'=>$myRank, 'total'=>count($rows)]);
