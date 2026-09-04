<?php
declare(strict_types=1);
// PHP 7.4 polyfill
if (!function_exists('str_starts_with')) { function str_starts_with($h,$n){ return $n!=='' && strpos($h,$n)===0; } }
if (!function_exists('str_contains')) { function str_contains($h,$n){ return $n!=='' && strpos($h,$n)!==false; } }
// Shared bootstrap for all API endpoints
// Path: repo/api/bootstrap.php
$root = dirname(__DIR__);
require_once $root . '/config/config.php';
require_once $root . '/core/Database.php';
require_once $root . '/core/Response.php';
require_once $root . '/core/Auth.php';
require_once $root . '/core/Csrf.php';
require_once $root . '/core/RateLimit.php';
require_once $root . '/core/Validator.php';

// Start secure session
Auth::startSession();

// CORS - same origin, but allow same-site fetch
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = defined('APP_URL') ? APP_URL : '';
if ($origin && $allowed && str_starts_with($origin, parse_url($allowed, PHP_URL_SCHEME).'://'.parse_url($allowed, PHP_URL_HOST))) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
}

// Security headers
header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Error handling: hide details in production
if (!APP_DEBUG) {
    ini_set('display_errors', '0');
    error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
} else {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
}

// Helper: get JSON body
function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
function getInput(string $key, mixed $default = null): mixed {
    $json = getJsonInput();
    if (isset($json[$key])) return $json[$key];
    if (isset($_POST[$key])) return $_POST[$key];
    if (isset($_GET[$key])) return $_GET[$key];
    return $default;
}
function requirePost(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') Response::error('METHOD_NOT_ALLOWED', 'POST required', 405);
}
