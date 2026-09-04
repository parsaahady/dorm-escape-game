<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$user = Auth::requireAuth();
$today = date('Y-m-d');
$weekKey = date('Y-W');
// ensure rows exist lazily
$missions = Database::fetchAll('SELECT * FROM missions WHERE active=1');
foreach ($missions as $m) {
    $period = $m['type']==='daily' ? $today : $weekKey;
    $exists = Database::fetch('SELECT id FROM user_missions WHERE user_id=? AND mission_id=? AND period_key=?', [$user['id'],$m['id'],$period]);
    if (!$exists) {
        Database::query('INSERT IGNORE INTO user_missions (user_id, mission_id, progress, target, period_key) VALUES (?,?,?,?,?)', [$user['id'],$m['id'],0,$m['target'],$period]);
    }
}
$rows = Database::fetchAll('SELECT um.*, m.title, m.description, m.icon, m.type, m.xp_reward FROM user_missions um JOIN missions m ON m.id=um.mission_id WHERE um.user_id=? AND um.period_key IN (?,?) ORDER BY m.type, um.is_completed, m.id', [$user['id'],$today,$weekKey]);
Response::success(['missions'=>$rows, 'today'=>$today, 'week'=>$weekKey]);
