<?php
declare(strict_types=1);
require_once __DIR__ . '/Database.php';

class Migration {
    public static function migrateGuest(int $userId, array $guest): array {
        $report = ['scores'=>0,'xp'=>0,'achievements'=>0];
        // guest expected shape: dorm_v3 JSON from localStorage
        // keys: player, stats, xp, characters, missions, achievements, league, friends, cachedBoard etc
        $stats = $guest['stats'] ?? [];
        $xp = $guest['xp'] ?? [];
        $chars = $guest['characters'] ?? [];
        $cachedBoard = $guest['cachedBoard'] ?? $guest['pendingRuns'] ?? [];
        // XP: sum
        if (isset($xp['totalXp']) && $xp['totalXp'] > 0) {
            $add = (int)$xp['totalXp'];
            Database::query('UPDATE users SET total_xp = total_xp + ?, xp = xp + ? WHERE id = ?', [$add, $add, $userId]);
            // recalc level: xpForLevel = 500 + (lv-1)*350
            $u = Database::fetch('SELECT level, xp FROM users WHERE id = ?', [$userId]);
            $lv = (int)$u['level']; $curXp = (int)$u['xp'];
            while ($curXp >= (500 + ($lv-1)*350)) {
                $curXp -= (500 + ($lv-1)*350);
                $lv++;
            }
            Database::query('UPDATE users SET level = ?, xp = ? WHERE id = ?', [$lv, $curXp, $userId]);
            $report['xp'] = $add;
        }
        // cachedBoard scores: create runs/scores as pending verification? Insert as verified if not too high
        if (is_array($cachedBoard) && count($cachedBoard)>0) {
            foreach (array_slice($cachedBoard, 0, 20) as $r) {
                $score = (int)($r['score'] ?? 0);
                if ($score <=0 || $score > 999999) continue;
                $dist = (int)($r['distance'] ?? $r['dist'] ?? 0);
                $cigs = (int)($r['cigs'] ?? 0);
                $char = $r['character'] ?? $r['character_id'] ?? 'parsa';
                if (!in_array($char, ['parsa','mahyar','arsham','mohsen','farham'])) $char='parsa';
                $runId = 'migrated-'.bin2hex(random_bytes(8));
                try {
                    Database::query('INSERT IGNORE INTO runs (id, user_id, character_id, seed, score, distance, best_combo, duration, items_collected, near_misses, powerups_used, ability_uses, environment, status, started_at, finished_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())',
                        [$runId, $userId, $char, random_int(10000,99999), $score, $dist, (int)($r['combo'] ?? 0), 60, $cigs, 0,0,0,'dorm','verified']);
                    Database::query('INSERT IGNORE INTO scores (run_id, user_id, username, character_id, score, distance, cigs, combo, seed, environment, status) SELECT id, user_id, ?, character_id, score, distance, items_collected, best_combo, seed, environment, status FROM runs WHERE id = ?',
                        [$r['username'] ?? 'migrated', $runId]);
                    $report['scores']++;
                } catch (Throwable $e) {}
            }
        }
        // user_characters: aggregate best
        if (isset($chars['levels'])) {
            foreach ($chars['levels'] as $cid=>$lv) {
                $xpv = (int)($chars['xp'][$cid] ?? 0);
                Database::query('INSERT INTO user_characters (user_id, character_id, level, xp) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE level = GREATEST(level, VALUES(level)), xp = xp + VALUES(xp)', [$userId, $cid, max(1,(int)$lv), $xpv]);
            }
        }
        // achievements: union
        if (isset($guest['achievements']) && is_array($guest['achievements'])) {
            foreach ($guest['achievements'] as $a) {
                if (!empty($a['unlocked'])) {
                    Database::query('INSERT IGNORE INTO user_achievements (user_id, achievement_id, progress, is_unlocked, unlocked_at) VALUES (?,?,?,1,NOW())', [$userId, $a['id'], 1]);
                    $report['achievements']++;
                }
            }
        }
        return $report;
    }
}
