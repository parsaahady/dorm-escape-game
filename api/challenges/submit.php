<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$user = Auth::requireAuth();
requirePost();
Csrf::checkRequest();
$data = getJsonInput();
$challengeId = trim($data['challenge_id'] ?? $data['id'] ?? $_POST['challenge_id'] ?? '');
$score = (int)($data['score'] ?? $_POST['score'] ?? 0);
$distance = (int)($data['distance'] ?? $_POST['distance'] ?? 0);
if ($challengeId==='') Response::error('MISSING','challenge_id required',400);
$ch = Database::fetch('SELECT * FROM friend_challenges WHERE id = ?', [$challengeId]);
if (!$ch) Response::error('NOT_FOUND','Challenge not found',404);
if (strtotime($ch['expires_at']) < time()) Response::error('EXPIRED','Challenge expired',400);
Database::query('INSERT INTO challenge_results (challenge_id, user_id, score, distance) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE score = GREATEST(score, VALUES(score)), distance = GREATEST(distance, VALUES(distance))', [$challengeId, $user['id'], $score, $distance]);
Database::query('INSERT INTO notifications (user_id, title, body, type) VALUES (?,?,?,?)', [$ch['creator_id'], '⚔️ چالش بازی شد', $user['username'].' در چالش '.$ch['title'].' امتیاز '.$score.' گرفت', 'challenge']);
Response::success(null,'Submitted');
