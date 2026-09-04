<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$user = Auth::requireAuth();
$limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));
$rows = Database::fetchAll('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT ?', [$user['id'], $limit]);
Response::success(['notifications'=>$rows]);
