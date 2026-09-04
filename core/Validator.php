<?php
declare(strict_types=1);
class Validator {
    private const CHARACTERS = ['parsa','mahyar','arsham','mohsen','farham'];
    private const ENVIRONMENTS = ['dorm','campus','cafeteria','alley','parking','night'];

    public static function validateRun(array $p): ?string {
        // required
        $required = ['run_id','character_id','seed','score','distance','duration','best_combo','items_collected','near_misses','powerups_used','ability_uses','environment','started_at','finished_at'];
        foreach ($required as $k) {
            if (!isset($p[$k])) return "missing $k";
        }
        // run_id UUID v4
        if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $p['run_id']) && !preg_match('/^run-[a-z0-9\-]+$/i', $p['run_id'])) {
            // allow simple run-xxx for offline but prefer uuid
            if (strlen($p['run_id']) < 8) return 'invalid run_id';
        }
        if (!in_array($p['character_id'], self::CHARACTERS, true)) return 'invalid character';
        if (!in_array($p['environment'], self::ENVIRONMENTS, true)) return 'invalid environment';
        if (!is_int($p['seed']) && !ctype_digit((string)$p['seed'])) return 'invalid seed';
        $score = (int)$p['score'];
        $distance = (int)$p['distance'];
        $duration = (int)$p['duration'];
        $combo = (int)$p['best_combo'];
        $items = (int)$p['items_collected'];
        $near = (int)$p['near_misses'];
        $pows = (int)$p['powerups_used'];
        $abil = (int)$p['ability_uses'];

        if ($score < 0 || $score > 999999) return 'score out of range';
        if ($distance < 0 || $distance > 20000) return 'distance out of range';
        if ($duration < 3 || $duration > 3600) return 'duration out of range';
        if ($combo < 0 || $combo > 1000) return 'combo out of range';
        if ($items < 0 || $items > 5000) return 'items out of range';
        if ($near < 0 || $near > 500) return 'near_misses out of range';
        if ($pows < 0 || $pows > 100) return 'powerups out of range';
        if ($abil < 0 || $abil > 100) return 'ability_uses out of range';

        // duration vs score: too fast
        if ($duration < 5 && $score > 5000) return 'too fast';
        // impossible speed: distance / duration > 40 m/s (~144 km/h)
        if ($duration > 0 && $distance / $duration > 40) return 'impossible speed';
        // combo vs distance: max 1 combo per ~5m + items + near
        $maxCombo = (int)($distance/5 + $items + $near + 10);
        if ($combo > $maxCombo) return 'impossible combo';

        // max possible score check
        $maxPossible = $distance + $items*60 + $combo*50 + $near*60 + 5000;
        if ($score > $maxPossible * 1.8) return 'inconsistent score';

        // timestamps
        $s = strtotime($p['started_at']);
        $f = strtotime($p['finished_at']);
        if ($s === false || $f === false) return 'invalid timestamps';
        if ($f <= $s) return 'finished before started';
        if ($f - $s < 3) return 'run too short';
        if (abs($f - $s - $duration) > 5) return 'duration mismatch';

        return null; // ok
    }

    public static function sanitizeUsername(string $s): string {
        return htmlspecialchars(trim($s), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    public static function sanitizeText(string $s, int $max = 500): string {
        $s = trim($s);
        if (mb_strlen($s) > $max) $s = mb_substr($s, 0, $max);
        return htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}
