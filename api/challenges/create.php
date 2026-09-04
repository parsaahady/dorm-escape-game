<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$user = Auth::requireAuth();
requirePost();
Csrf::checkRequest();
RateLimit::check('challenge_create', 5, 3600);
$data = getJsonInput();
$seed = (int)($data['seed'] ?? $_POST['seed'] ?? random_int(10000,99999));
$title = Validator::sanitizeText(trim($data['title'] ?? $_POST['title'] ?? 'Challenge'), 64);
if ($seed < 1000 || $seed > 999999) $seed = random_int(10000,99999);
$id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', random_int(0,65535), random_int(0,65535), random_int(0,65535), random_int(0,4095)|0x4000, random_int(0,16383)|0x8000, random_int(0,65535), random_int(0,65535), random_int(0,65535));
$expires = date('Y-m-d H:i:s', time()+ 7*24*3600);
Database::query('INSERT INTO friend_challenges (id, creator_id, seed, title, expires_at) VALUES (?,?,?,?,?)', [$id, $user['id'], $seed, $title, $expires]);
$challengeUrl = (defined('APP_URL') ? APP_URL : '') . '/?challenge='.$seed;
Response::success(['challenge_id'=>$id, 'seed'=>$seed, 'title'=>$title, 'url'=>$challengeUrl, 'expires_at'=>$expires], 'Challenge created', 201);
