<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
requirePost();
Auth::logout();
Response::success(null, 'Logged out');
