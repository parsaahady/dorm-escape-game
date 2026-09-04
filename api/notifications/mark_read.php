<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
$user = Auth::requireAuth();
requirePost();
Csrf::checkRequest();
$data = getJsonInput();
$id = (int)($data['id'] ?? $_POST['id'] ?? 0);
if ($id) {
    Database::query('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?', [$id, $user['id']]);
} else {
    Database::query('UPDATE notifications SET is_read=1 WHERE user_id=?', [$user['id']]);
}
Response::success(null,'Marked read');
