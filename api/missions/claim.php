<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$user = Auth::requireAuth();
requirePost();
Csrf::checkRequest();
$data = getJsonInput();
$missionId = trim($data['mission_id'] ?? $data['id'] ?? $_POST['mission_id'] ?? '');
if ($missionId==='') Response::error('MISSING','mission_id required',400);
$today = date('Y-m-d'); $weekKey = date('Y-W');
$um = Database::fetch('SELECT um.*, m.xp_reward, m.title FROM user_missions um JOIN missions m ON m.id=um.mission_id WHERE um.user_id=? AND um.mission_id=? AND um.period_key IN (?,?)', [$user['id'],$missionId,$today,$weekKey]);
if (!$um) Response::error('NOT_FOUND','Mission not found',404);
if (!(int)$um['is_completed']) Response::error('NOT_COMPLETED','Mission not completed yet',400);
if (!empty($um['claimed'])) Response::error('ALREADY_CLAIMED','Already claimed',400);
// Use claimed via is_completed + xp already given in submit.php, but for idempotency we check a column; if no claimed column, just ensure not double reward
// Add claimed flag lazily
try {
    Database::query('ALTER TABLE user_missions ADD COLUMN claimed TINYINT(1) DEFAULT 0');
} catch (Throwable $e) {}
$check = Database::fetch('SELECT claimed FROM user_missions WHERE id=?', [$um['id']]);
if (!empty($check['claimed'])) Response::error('ALREADY_CLAIMED','Already claimed',400);
Database::query('UPDATE user_missions SET claimed=1 WHERE id=?', [$um['id']]);
// XP already given at completion, so just return success
Response::success(['mission_id'=>$missionId, 'xp'=>$um['xp_reward']], 'Claimed');
