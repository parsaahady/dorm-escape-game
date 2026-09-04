<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$id = $_GET['id'] ?? $_GET['challenge_id'] ?? null;
$seed = $_GET['seed'] ?? null;
if ($id) {
    $ch = Database::fetch('SELECT c.*, u.username as creator_name FROM friend_challenges c JOIN users u ON u.id=c.creator_id WHERE c.id = ?', [$id]);
} elseif ($seed) {
    $ch = Database::fetch('SELECT c.*, u.username as creator_name FROM friend_challenges c JOIN users u ON u.id=c.creator_id WHERE c.seed = ? ORDER BY c.created_at DESC LIMIT 1', [(int)$seed]);
} else {
    // list recent
    $rows = Database::fetchAll('SELECT c.*, u.username as creator_name FROM friend_challenges c JOIN users u ON u.id=c.creator_id WHERE c.expires_at > NOW() ORDER BY c.created_at DESC LIMIT 20');
    Response::success(['challenges'=>$rows]);
    exit;
}
if (!$ch) Response::error('NOT_FOUND','Challenge not found',404);
$results = Database::fetchAll('SELECT cr.*, u.username FROM challenge_results cr JOIN users u ON u.id=cr.user_id WHERE cr.challenge_id=? ORDER BY cr.score DESC', [$ch['id']]);
Response::success(['challenge'=>$ch, 'results'=>$results]);
