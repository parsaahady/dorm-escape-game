<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$user = Auth::user();
if (!$user) Response::success(['authenticated'=>false, 'user'=>null, 'csrf'=>Csrf::token()]);
$clean = Database::fetch('SELECT id, username, email, display_name, avatar, friend_code, level, xp, total_xp, reputation, reputation_rank, is_admin, created_at FROM users WHERE id = ?', [$user['id']]);
Response::success(['authenticated'=>true, 'user'=>$clean, 'csrf'=>Csrf::token()]);
