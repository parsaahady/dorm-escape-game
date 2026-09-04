<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$today = date('Y-m-d');
$row = Database::fetch('SELECT * FROM daily_challenges WHERE challenge_date = ?', [$today]);
if (!$row) {
    // generate deterministic seed from date
    $seed = abs(crc32($today)) % 90000 + 10000;
    $titles = ['سرعت اضافه','جذب بیشتر','شب پرحادثه','باران','امتحان'];
    $title = $titles[abs(crc32($today)) % count($titles)];
    $mod = json_encode(['scoreMul'=>1.2]);
    try {
        Database::query('INSERT INTO daily_challenges (challenge_date, seed, title, modifier) VALUES (?,?,?,?)', [$today, $seed, $title, $mod]);
        $row = Database::fetch('SELECT * FROM daily_challenges WHERE challenge_date = ?', [$today]);
    } catch (Throwable $e) {
        $row = ['challenge_date'=>$today,'seed'=>$seed,'title'=>$title];
    }
}
Response::success(['challenge'=>$row]);
