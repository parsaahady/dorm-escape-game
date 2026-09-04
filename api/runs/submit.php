<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$user = Auth::requireAuth();
requirePost();
Csrf::checkRequest();
RateLimit::check('score_submit', 10, 60);
RateLimit::checkUser((int)$user['id'], 'runs', 30, 3600);

$data = getJsonInput();
if (empty($data)) $data = $_POST;

// normalize
$payload = [
    'run_id' => trim($data['run_id'] ?? $data['runId'] ?? ''),
    'character_id' => trim($data['character_id'] ?? $data['character'] ?? ''),
    'seed' => (int)($data['seed'] ?? 0),
    'score' => (int)($data['score'] ?? 0),
    'distance' => (int)($data['distance'] ?? 0),
    'duration' => (int)($data['duration'] ?? $data['run_duration'] ?? 0),
    'best_combo' => (int)($data['best_combo'] ?? $data['combo'] ?? 0),
    'items_collected' => (int)($data['items_collected'] ?? $data['cigs'] ?? $data['items'] ?? 0),
    'near_misses' => (int)($data['near_misses'] ?? $data['nearMiss'] ?? 0),
    'powerups_used' => (int)($data['powerups_used'] ?? $data['powerups'] ?? $data['powsCollected'] ?? 0),
    'ability_uses' => (int)($data['ability_uses'] ?? $data['abilityUses'] ?? 0),
    'environment' => trim($data['environment'] ?? 'dorm'),
    'started_at' => trim($data['started_at'] ?? $data['run_started_at'] ?? ''),
    'finished_at' => trim($data['finished_at'] ?? $data['run_finished_at'] ?? ''),
];
if ($payload['run_id']==='') Response::error('MISSING_RUN_ID','run_id required',400);
if ($payload['started_at']==='') $payload['started_at'] = date('Y-m-d H:i:s', time()-$payload['duration']);
if ($payload['finished_at']==='') $payload['finished_at'] = date('Y-m-d H:i:s');

$err = Validator::validateRun($payload);
if ($err !== null) {
    // flagged/rejected, still store but not verified
    $status = in_array($err, ['impossible speed','inconsistent score','too fast','impossible combo']) ? 'flagged' : 'rejected';
    // if score wildly invalid, reject entirely
    if ($err === 'score out of range' || $err === 'distance out of range') {
        Response::error('INVALID_SCORE', $err, 400);
    }
} else {
    $status = 'verified';
}

// check duplicate
$existing = Database::fetch('SELECT id, status FROM runs WHERE id = ?', [$payload['run_id']]);
if ($existing) {
    // idempotent: return existing rank
    $rankRow = Database::fetch('SELECT COUNT(*)+1 as rank FROM scores WHERE score > (SELECT score FROM scores WHERE run_id = ?) AND status = "verified"', [$payload['run_id']]);
    Response::success(['run_id'=>$payload['run_id'],'status'=>$existing['status'],'rank'=>$rankRow? (int)$rankRow['rank']: null,'duplicate'=>true]);
}

$ip = $_SERVER['REMOTE_ADDR'] ?? null;

try {
    Database::begin();
    // insert run
    Database::query('INSERT INTO runs (id, user_id, character_id, seed, score, distance, best_combo, duration, items_collected, near_misses, powerups_used, ability_uses, environment, status, started_at, finished_at, ip) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [$payload['run_id'], $user['id'], $payload['character_id'], $payload['seed'], $payload['score'], $payload['distance'], $payload['best_combo'], $payload['duration'], $payload['items_collected'], $payload['near_misses'], $payload['powerups_used'], $payload['ability_uses'], $payload['environment'], $status, $payload['started_at'], $payload['finished_at'], $ip]);

    if ($status === 'rejected') {
        Database::commit();
        Response::error('REJECTED', 'Run rejected due to validation: '.$err, 400);
    }

    // insert score
    Database::query('INSERT INTO scores (run_id, user_id, username, character_id, score, distance, cigs, combo, seed, environment, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [$payload['run_id'], $user['id'], $user['username'], $payload['character_id'], $payload['score'], $payload['distance'], $payload['items_collected'], $payload['best_combo'], $payload['seed'], $payload['environment'], $status]);

    // update user_characters
    Database::query('INSERT INTO user_characters (user_id, character_id, level, xp, games_played, best_score, best_distance, best_combo) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE games_played = games_played +1, best_score = GREATEST(best_score, VALUES(best_score)), best_distance = GREATEST(best_distance, VALUES(best_distance)), best_combo = GREATEST(best_combo, VALUES(best_combo))',
        [$user['id'], $payload['character_id'], 1, 0, 1, $payload['score'], $payload['distance'], $payload['best_combo']]);

    // XP: only if verified
    if ($status === 'verified') {
        $xpGain = (int)($payload['score']/120) + $payload['items_collected']*2 + $payload['near_misses']*3 + 20;
        // add to user
        $cur = Database::fetch('SELECT level, xp, total_xp FROM users WHERE id = ? FOR UPDATE', [$user['id']]);
        $lv = (int)$cur['level']; $xp = (int)$cur['xp'] + $xpGain; $total = (int)$cur['total_xp'] + $xpGain;
        $leveled = false;
        while ($xp >= (500 + ($lv-1)*350)) {
            $xp -= (500 + ($lv-1)*350);
            $lv++; $leveled = true;
        }
        Database::query('UPDATE users SET level = ?, xp = ?, total_xp = ?, updated_at = NOW() WHERE id = ?', [$lv, $xp, $total, $user['id']]);
        if ($leveled) {
            Database::query('INSERT INTO notifications (user_id, title, body, type) VALUES (?,?,?,?)', [$user['id'], '⭐ Level Up!', 'به لول '.$lv.' رسیدی!', 'level']);
        }

        // Weekly league
        $weekStart = date('Y-m-d', strtotime('monday this week'));
        $weekEnd = date('Y-m-d', strtotime('sunday this week'));
        $league = Database::fetch('SELECT id FROM weekly_leagues WHERE week_start = ?', [$weekStart]);
        if (!$league) {
            Database::query('INSERT INTO weekly_leagues (week_start, week_end) VALUES (?,?)', [$weekStart, $weekEnd]);
            $leagueId = (int)Database::lastInsertId();
        } else $leagueId = (int)$league['id'];
        Database::query('INSERT INTO weekly_league_members (league_id, user_id, weekly_score, tier) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE weekly_score = weekly_score + VALUES(weekly_score)', [$leagueId, $user['id'], $payload['score'], 'bronze']);
        $member = Database::fetch('SELECT weekly_score FROM weekly_league_members WHERE league_id = ? AND user_id = ?', [$leagueId, $user['id']]);
        $ws = (int)$member['weekly_score'];
        $tier = $ws >= 35000 ? 'diamond' : ($ws >= 15000 ? 'gold' : ($ws >= 5000 ? 'silver' : 'bronze'));
        Database::query('UPDATE weekly_league_members SET tier = ? WHERE league_id = ? AND user_id = ?', [$tier, $leagueId, $user['id']]);

        // Missions: simple check against payload
        $today = date('Y-m-d');
        $weekKey = date('Y-W');
        // ensure user_missions rows exist for today/weekly? lazy: check each mission
        $missions = Database::fetchAll('SELECT * FROM missions WHERE active = 1');
        foreach ($missions as $m) {
            $period = $m['type']==='daily' ? $today : $weekKey;
            $um = Database::fetch('SELECT * FROM user_missions WHERE user_id = ? AND mission_id = ? AND period_key = ?', [$user['id'], $m['id'], $period]);
            if (!$um) {
                Database::query('INSERT INTO user_missions (user_id, mission_id, progress, target, period_key) VALUES (?,?,?,?,?)', [$user['id'], $m['id'], 0, $m['target'], $period]);
                $um = Database::fetch('SELECT * FROM user_missions WHERE user_id = ? AND mission_id = ? AND period_key = ?', [$user['id'], $m['id'], $period]);
            }
            if ((int)$um['is_completed']) continue;
            // determine increment based on mission id
            $inc = 0;
            switch ($m['id']) {
                case 'd_cig': $inc = $payload['items_collected']; break;
                case 'd_dist': $inc = $payload['distance']; break;
                case 'd_near': $inc = $payload['near_misses']; break;
                case 'd_ability': $inc = $payload['ability_uses']; break;
                case 'd_combo': $inc = $payload['best_combo']; break;
                case 'w_score': $inc = $payload['score']; break;
                case 'w_near': $inc = $payload['near_misses']; break;
                case 'w_runs': $inc = 1; break;
                case 'w_chars': // count distinct chars used ever
                    $cnt = Database::fetch('SELECT COUNT(DISTINCT character_id) as c FROM runs WHERE user_id = ?', [$user['id']]);
                    $inc = (int)$cnt['c'];
                    Database::query('UPDATE user_missions SET progress = ? WHERE id = ?', [$inc, $um['id']]);
                    if ($inc >= (int)$um['target']) {
                        Database::query('UPDATE user_missions SET is_completed =1, completed_at=NOW() WHERE id = ?', [$um['id']]);
                        // reward
                        Database::query('UPDATE users SET xp = xp + ?, total_xp = total_xp + ? WHERE id = ?', [$m['xp_reward'], $m['xp_reward'], $user['id']]);
                        Database::query('INSERT INTO notifications (user_id, title, body, type) VALUES (?,?,?,?)', [$user['id'], '🎯 ماموریت کامل!', $m['title'].' +'.$m['xp_reward'].' XP', 'mission']);
                    }
                    continue 2;
                case 'w_nopow': $inc = $payload['powerups_used']==0 ? 1 : 0; break;
            }
            // for additive missions, progress = MAX or SUM? We'll use MAX for daily, SUM for weekly where applicable
            // Simplification: for d_*, if this run already meets, complete
            $newProg = max((int)$um['progress'], $inc);
            // for w_runs, w_near, w_score need sum across period
            if (in_array($m['id'], ['w_runs','w_near','w_score'])) {
                // sum across period's runs
                if ($m['id']=='w_runs') $sum = Database::fetch('SELECT COUNT(*) as c FROM runs WHERE user_id = ? AND created_at >= ?', [$user['id'], $weekStart]);
                elseif ($m['id']=='w_near') $sum = Database::fetch('SELECT COALESCE(SUM(near_misses),0) as c FROM runs WHERE user_id = ? AND created_at >= ?', [$user['id'], $weekStart]);
                else $sum = Database::fetch('SELECT COALESCE(SUM(score),0) as c FROM runs WHERE user_id = ? AND created_at >= ?', [$user['id'], $weekStart]);
                $newProg = (int)$sum['c'];
            }
            if ($newProg != (int)$um['progress']) {
                Database::query('UPDATE user_missions SET progress = ? WHERE id = ?', [$newProg, $um['id']]);
            }
            if ($newProg >= (int)$um['target'] && !(int)$um['is_completed']) {
                Database::query('UPDATE user_missions SET is_completed =1, completed_at=NOW() WHERE id = ?', [$um['id']]);
                Database::query('UPDATE users SET xp = xp + ?, total_xp = total_xp + ? WHERE id = ?', [$m['xp_reward'], $m['xp_reward'], $user['id']]);
                Database::query('INSERT INTO notifications (user_id, title, body, type) VALUES (?,?,?,?)', [$user['id'], '🎯 ماموریت کامل!', $m['title'].' +'.$m['xp_reward'].' XP', 'mission']);
            }
        }

        // Achievements
        $achDefs = Database::fetchAll('SELECT * FROM achievements');
        $stats = Database::fetch('SELECT COUNT(*) as runs, COALESCE(SUM(distance),0) as dist, COALESCE(SUM(items_collected),0) as cigs, COALESCE(SUM(near_misses),0) as near, COALESCE(MAX(best_combo),0) as combo, COALESCE(MAX(score),0) as best FROM runs WHERE user_id = ?', [$user['id']]);
        foreach ($achDefs as $a) {
            $ua = Database::fetch('SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?', [$user['id'], $a['id']]);
            if (!$ua) {
                Database::query('INSERT IGNORE INTO user_achievements (user_id, achievement_id, progress) VALUES (?,?,0)', [$user['id'], $a['id']]);
                $ua = Database::fetch('SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?', [$user['id'], $a['id']]);
            }
            if ((int)$ua['is_unlocked']) continue;
            $prog = 0;
            switch ($a['id']) {
                case 'first_run': $prog = (int)$stats['runs']; break;
                case 'combo10': $prog = (int)$stats['combo']; break;
                case 'untouchable': $prog = (int)$stats['dist'] > 500 ? 500 : (int)$stats['dist']; // simplified
                    // actually need longest run distance: use MAX distance
                    $maxDist = Database::fetch('SELECT MAX(distance) as m FROM runs WHERE user_id = ?', [$user['id']]);
                    $prog = (int)$maxDist['m'];
                    break;
                case 'smoker': $prog = (int)$stats['cigs']; break;
                case 'lightning': $prog = (int)$stats['near']; break;
                case 'nearmiss100': $prog = (int)$stats['near']; break;
                case 'record': $prog = (int)$stats['best']; break;
                case 'collector': $prog = (int)Database::fetch('SELECT COALESCE(SUM(powerups_used),0) as c FROM runs WHERE user_id = ?', [$user['id']])['c']; break;
                case 'explorer': $prog = (int)Database::fetch('SELECT COUNT(DISTINCT environment) as c FROM runs WHERE user_id = ?', [$user['id']])['c']; break;
                case 'friend': $prog = (int)Database::fetch('SELECT COUNT(*) as c FROM friendships WHERE (requester_id = ? OR receiver_id = ?) AND status="accepted"', [$user['id'],$user['id']])['c']; break;
                default: $prog = 0;
            }
            Database::query('UPDATE user_achievements SET progress = ? WHERE user_id = ? AND achievement_id = ?', [$prog, $user['id'], $a['id']]);
            if ($prog >= (int)$a['target']) {
                Database::query('UPDATE user_achievements SET is_unlocked =1, unlocked_at=NOW() WHERE user_id = ? AND achievement_id = ?', [$user['id'], $a['id']]);
                Database::query('UPDATE users SET xp = xp + 200, total_xp = total_xp + 200 WHERE id = ?', [$user['id']]);
                Database::query('INSERT INTO notifications (user_id, title, body, type) VALUES (?,?,?,?)', [$user['id'], '🏆 اچیومنت!', $a['title'].' باز شد +200 XP', 'achievement']);
            }
        }
    }

    Database::commit();

    // calculate rank
    $rankRow = null;
    if ($status === 'verified') {
        $rankRow = Database::fetch('SELECT COUNT(*)+1 as rank FROM scores WHERE score > ? AND status="verified"', [$payload['score']]);
    }
    $u2 = Database::fetch('SELECT level, xp, total_xp FROM users WHERE id = ?', [$user['id']]);
    Response::success(['run_id'=>$payload['run_id'],'status'=>$status,'rank'=>$rankRow? (int)$rankRow['rank']: null,'xp'=>$u2['xp'],'level'=>$u2['level'],'total_xp'=>$u2['total_xp']]);

} catch (Throwable $e) {
    Database::rollBack();
    error_log('[submit] '.$e->getMessage().' payload='.json_encode($payload));
    if (APP_DEBUG) Response::error('SERVER_ERROR', $e->getMessage(), 500);
    else Response::error('SERVER_ERROR','Internal error',500);
}
