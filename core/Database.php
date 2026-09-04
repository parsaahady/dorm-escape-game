<?php
declare(strict_types=1);
class Database {
    private static ?PDO $pdo = null;

    public static function pdo(): PDO {
        if (self::$pdo !== null) return self::$pdo;
        // load config if not already
        if (!defined('DB_HOST')) {
            $cfg = __DIR__ . '/../config/config.php';
            if (file_exists($cfg)) require_once $cfg;
            else require_once __DIR__ . '/../config/config.example.php';
        }
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', DB_HOST, DB_PORT, DB_NAME, DB_CHARSET);
        $opts = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        try {
            self::$pdo = new PDO($dsn, DB_USER, DB_PASS, $opts);
        } catch (PDOException $e) {
            if (defined('APP_DEBUG') && APP_DEBUG) throw $e;
            error_log('[DB] connection failed: ' . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success'=>false,'error'=>['code'=>'DB_ERROR','message'=>'Database connection failed']], JSON_UNESCAPED_UNICODE);
            exit;
        }
        return self::$pdo;
    }

    public static function query(string $sql, array $params = []): PDOStatement {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function fetch(string $sql, array $params = []): ?array {
        $row = self::query($sql, $params)->fetch();
        return $row ?: null;
    }

    public static function fetchAll(string $sql, array $params = []): array {
        return self::query($sql, $params)->fetchAll();
    }

    public static function lastInsertId(): string {
        return self::pdo()->lastInsertId();
    }

    public static function begin(): void { self::pdo()->beginTransaction(); }
    public static function commit(): void { self::pdo()->commit(); }
    public static function rollBack(): void { if (self::pdo()->inTransaction()) self::pdo()->rollBack(); }
}
