<?php
declare(strict_types=1);
class Response {
    public static function json(array $data, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        // security headers
        header('X-Content-Type-Options: nosniff');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    public static function success(mixed $data = null, string $message = 'ok', int $status = 200): void {
        self::json(['success'=>true, 'data'=>$data, 'message'=>$message], $status);
    }
    public static function error(string $code, string $message, int $status = 400, mixed $details = null): void {
        $payload = ['success'=>false, 'error'=>['code'=>$code,'message'=>$message]];
        if ($details !== null) $payload['error']['details'] = $details;
        self::json($payload, $status);
    }
}
