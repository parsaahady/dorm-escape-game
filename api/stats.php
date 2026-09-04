<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
$user = Auth::requireAuth();
$stats = Database::fetch('SELECT COUNT(*) as runs, COALESCE(SUM(distance),0) as dist, COALESCE(SUM(items_collected),0) as cigs, COALESCE(MAX(score),0) as best, COALESCE(MAX(distance),0) as bestDist, COALESCE(MAX(best_combo),0) as bestCombo, COALESCE(SUM(duration),0) as play FROM runs WHERE user_id=?', [$user['id']]);
$weekly = Database::fetch('SELECT weekly_score, tier FROM weekly_league_members WHERE user_id=? ORDER BY league_id DESC LIMIT 1', [$user['id']]);
Response::success(['stats'=>$stats, 'weekly'=>$weekly]);
