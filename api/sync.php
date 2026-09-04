<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
$user = Auth::requireAuth();
requirePost();
Csrf::checkRequest();
$data = getJsonInput();
$runs = $data['runs'] ?? $data ?? [];
if (isset($runs['run_id'])) $runs = [$runs]; // single
if (!is_array($runs)) Response::error('INVALID','runs array required',400);
$results = [];
foreach (array_slice($runs, 0, 20) as $run) {
    // reuse same validation as submit.php but batch
    $payload = [
        'run_id' => trim($run['run_id'] ?? ''),
        'character_id' => trim($run['character_id'] ?? $run['character'] ?? 'parsa'),
        'seed' => (int)($run['seed'] ?? 0),
        'score' => (int)($run['score'] ?? 0),
        'distance' => (int)($run['distance'] ?? 0),
        'duration' => (int)($run['duration'] ?? 0),
        'best_combo' => (int)($run['best_combo'] ?? $run['combo'] ?? 0),
        'items_collected' => (int)($run['items_collected'] ?? $run['cigs'] ?? 0),
        'near_misses' => (int)($run['near_misses'] ?? $run['nearMiss'] ?? 0),
        'powerups_used' => (int)($run['powerups_used'] ?? 0),
        'ability_uses' => (int)($run['ability_uses'] ?? 0),
        'environment' => trim($run['environment'] ?? 'dorm'),
        'started_at' => trim($run['started_at'] ?? ''),
        'finished_at' => trim($run['finished_at'] ?? ''),
    ];
    if ($payload['started_at']==='') $payload['started_at']=date('Y-m-d H:i:s', time()-$payload['duration']);
    if ($payload['finished_at']==='') $payload['finished_at']=date('Y-m-d H:i:s');
    $err = Validator::validateRun($payload);
    if ($err && in_array($err, ['score out of range','distance out of range'])) {
        $results[] = ['run_id'=>$payload['run_id'],'status'=>'rejected','error'=>$err];
        continue;
    }
    $status = $err ? 'flagged' : 'verified';
    $exists = Database::fetch('SELECT id FROM runs WHERE id=?', [$payload['run_id']]);
    if ($exists) { $results[] = ['run_id'=>$payload['run_id'],'status'=>'duplicate']; continue; }
    try {
        Database::query('INSERT INTO runs (id, user_id, character_id, seed, score, distance, best_combo, duration, items_collected, near_misses, powerups_used, ability_uses, environment, status, started_at, finished_at, ip) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [$payload['run_id'],$user['id'],$payload['character_id'],$payload['seed'],$payload['score'],$payload['distance'],$payload['best_combo'],$payload['duration'],$payload['items_collected'],$payload['near_misses'],$payload['powerups_used'],$payload['ability_uses'],$payload['environment'],$status,$payload['started_at'],$payload['finished_at'], $_SERVER['REMOTE_ADDR'] ?? null]);
        Database::query('INSERT INTO scores (run_id, user_id, username, character_id, score, distance, cigs, combo, seed, environment, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [$payload['run_id'],$user['id'],$user['username'],$payload['character_id'],$payload['score'],$payload['distance'],$payload['items_collected'],$payload['best_combo'],$payload['seed'],$payload['environment'],$status]);
        $results[] = ['run_id'=>$payload['run_id'],'status'=>$status];
    } catch (Throwable $e) {
        $results[] = ['run_id'=>$payload['run_id'],'status'=>'error','error'=>$e->getMessage()];
    }
}
Response::success(['results'=>$results]);
