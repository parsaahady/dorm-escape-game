<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$user = Auth::requireAuth();
// ensure all achievements have row
$achs = Database::fetchAll('SELECT * FROM achievements');
foreach ($achs as $a) {
    $exists = Database::fetch('SELECT 1 FROM user_achievements WHERE user_id=? AND achievement_id=?', [$user['id'],$a['id']]);
    if (!$exists) Database::query('INSERT IGNORE INTO user_achievements (user_id, achievement_id, progress) VALUES (?,?,0)', [$user['id'],$a['id']]);
}
$rows = Database::fetchAll('SELECT ua.*, a.title, a.description, a.icon, a.target FROM user_achievements ua JOIN achievements a ON a.id=ua.achievement_id WHERE ua.user_id=? ORDER BY ua.is_unlocked DESC, a.id', [$user['id']]);
Response::success(['achievements'=>$rows]);
