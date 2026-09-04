<?php
declare(strict_types=1);
if (!function_exists('str_starts_with')) { function str_starts_with($h,$n){ return $n!=='' && strpos($h,$n)===0; } }
if (!function_exists('str_contains')) { function str_contains($h,$n){ return $n!=='' && strpos($h,$n)!==false; } }
ini_set('display_errors','1'); error_reporting(E_ALL);
session_start();
$root = dirname(__DIR__);
$lockFile = $root . '/install.lock';
$configPath = $root . '/config/config.php';
$configExample = $root . '/config/config.example.php';
$dbSql = $root . '/database.sql';

function esc($s){ return htmlspecialchars($s, ENT_QUOTES|ENT_HTML5, 'UTF-8'); }
$error = ''; $success = '';

// check if already installed and locked
if (file_exists($lockFile)) {
    $locked = trim(file_get_contents($lockFile)) === 'locked';
    if ($locked && empty($_GET['force'])) {
        die('<h2>نصب قبلاً انجام شده</h2><p>فایل install.lock وجود دارد. برای نصب مجدد آن را حذف کنید یا ?force=1 بزنید.</p><p><a href="/">بازگشت به بازی</a> | <a href="/admin/">ادمین</a></p>');
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $host = trim($_POST['db_host'] ?? 'localhost');
    $name = trim($_POST['db_name'] ?? '');
    $user = trim($_POST['db_user'] ?? '');
    $pass = $_POST['db_pass'] ?? '';
    $url  = rtrim(trim($_POST['app_url'] ?? ''), '/');
    $adminUser = trim($_POST['admin_user'] ?? 'admin');
    $adminEmail = trim($_POST['admin_email'] ?? 'admin@example.com');
    $adminPass = $_POST['admin_pass'] ?? '';

    if ($name===''||$user===''||$url===''||$adminPass==='') {
        $error = 'همه فیلدهای ستاره‌دار الزامی هستند';
    } elseif (strlen($adminPass) < 6) {
        $error = 'رمز ادمین حداقل ۶ کاراکتر';
    } else {
        // test connection
        try {
            $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
            // create db if not exists
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `$name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE `$name`");
            // import database.sql
            if (!file_exists($dbSql)) throw new Exception('database.sql not found');
            $sql = file_get_contents($dbSql);
            // split by ; but handle simple
            $stmts = array_filter(array_map('trim', explode(';', $sql)));
            foreach ($stmts as $stmt) {
                if ($stmt==='' || str_starts_with($stmt,'--')) continue;
                // skip SET lines with DELIMITER? already filtered
                if (stripos($stmt,'SET NAMES')===0 || stripos($stmt,'SET FOREIGN_KEY_CHECKS')===0) {
                    $pdo->exec($stmt);
                    continue;
                }
                if (trim($stmt)!=='') {
                    try { $pdo->exec($stmt); } catch (PDOException $e) {
                        // ignore duplicate errors
                        if (!str_contains($e->getMessage(),'already exists') && !str_contains($e->getMessage(),'Duplicate')) throw $e;
                    }
                }
            }
            // set FK checks back
            $pdo->exec("SET FOREIGN_KEY_CHECKS=1");
            // create admin user
            $hash = password_hash($adminPass, PASSWORD_BCRYPT, ['cost'=>12]);
            $friendCode = 'DORM-'.strtoupper(substr(bin2hex(random_bytes(4)),0,4));
            $stmt = $pdo->prepare('SELECT id FROM users WHERE username=? OR email=?');
            $stmt->execute([$adminUser, $adminEmail]);
            if ($stmt->fetch()) {
                $pdo->prepare('UPDATE users SET password_hash=?, is_admin=1 WHERE username=?')->execute([$hash, $adminUser]);
            } else {
                $pdo->prepare('INSERT INTO users (username,email,password_hash,display_name,avatar,friend_code,is_admin) VALUES (?,?,?,?,?,?,1)')->execute([$adminUser,$adminEmail,$hash,$adminUser,'😎',$friendCode]);
                $uid = $pdo->lastInsertId();
                foreach (['parsa','mahyar','arsham','mohsen','farham'] as $cid) $pdo->prepare('INSERT IGNORE INTO user_characters (user_id, character_id) VALUES (?,?)')->execute([$uid,$cid]);
            }
            // write config.php
            $cfgContent = "<?php\ndeclare(strict_types=1);\ndefine('DB_HOST','".addslashes($host)."');\ndefine('DB_NAME','".addslashes($name)."');\ndefine('DB_USER','".addslashes($user)."');\ndefine('DB_PASS','".addslashes($pass)."');\ndefine('DB_CHARSET','utf8mb4');\ndefine('DB_PORT','3306');\ndefine('APP_URL','".addslashes($url)."');\ndefine('APP_ENV','production');\ndefine('APP_DEBUG',false);\ndefine('SESSION_NAME','DORMSESSID');\ndefine('SESSION_LIFETIME',604800);\ndefine('SESSION_SECURE',".(str_starts_with($url,'https://')?'true':'false').");\ndefine('SESSION_HTTPONLY',true);\ndefine('SESSION_SAMESITE','Lax');\ndefine('CSRF_TOKEN_NAME','_csrf');\ndefine('BCRYPT_COST',12);\n";
            file_put_contents($configPath, $cfgContent);
            // lock
            file_put_contents($lockFile, 'locked');
            // also lock in DB
            try { $pdo->exec("UPDATE install_lock SET locked=1, locked_at=NOW() WHERE id=1"); } catch(Throwable $e){}
            $success = 'نصب با موفقیت انجام شد! <a href="/">برو به بازی</a> | <a href="/admin/">پنل ادمین</a><br><br><strong>امنیت:</strong> پوشه install را حذف یا rename کنید.';
        } catch (Throwable $e) {
            $error = 'خطا: '. esc($e->getMessage());
        }
    }
}
// defaults
$defaultUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off' ? 'https://':'http://').($_SERVER['HTTP_HOST'] ?? 'example.com');
?>
<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>نصب فرار از خوابگاه</title>
<style>
*{box-sizing:border-box;font-family:Vazirmatn, Tahoma, sans-serif}
body{margin:0;background:#0f0b2d;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:rgba(255,255,255,.06);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:28px;max-width:560px;width:100%}
h1{margin:0 0 8px;font-size:22px}
label{display:block;margin:14px 0 6px;font-weight:700;font-size:13px;color:#cfc6ff}
input{width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.25);color:#fff}
button{margin-top:20px;width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#ffd93d,#ff8c42);font-weight:900;cursor:pointer}
.alert{padding:12px;border-radius:12px;margin:12px 0;font-size:13px}
.err{background:rgba(255,60,60,.15);border:1px solid rgba(255,60,60,.3);color:#ffb3b3}
.ok{background:rgba(66,200,120,.15);border:1px solid rgba(66,200,120,.3);color:#a7f3d0}
small{color:#9d92d9}
</style>
</head>
<body>
<div class="card">
<h1>🚀 نصب فرار از خوابگاه</h1>
<p style="color:#9d92d9;font-size:13px">۱- دیتابیس MySQL بساز &nbsp; ۲- اطلاعات را وارد کن &nbsp; ۳- نصب</p>
<?php if($error): ?><div class="alert err"><?= $error ?></div><?php endif; ?>
<?php if($success): ?><div class="alert ok"><?= $success ?></div><?php endif; ?>
<form method="post" autocomplete="off">
<label>هاست دیتابیس *</label><input name="db_host" value="<?= esc($_POST['db_host'] ?? 'localhost') ?>" required>
<label>نام دیتابیس *</label><input name="db_name" value="<?= esc($_POST['db_name'] ?? 'dorm_escape') ?>" required>
<small>در cPanel → MySQL Databases بساز</small>
<label>کاربر دیتابیس *</label><input name="db_user" value="<?= esc($_POST['db_user'] ?? '') ?>" required>
<label>رمز دیتابیس *</label><input name="db_pass" type="password" value="<?= esc($_POST['db_pass'] ?? '') ?>">
<label>آدرس سایت (APP_URL) *</label><input name="app_url" value="<?= esc($_POST['app_url'] ?? $defaultUrl) ?>" required placeholder="https://example.com">
<label style="margin-top:18px;border-top:1px solid rgba(255,255,255,.08);padding-top:14px">ادمین</label>
<label>نام کاربری ادمین *</label><input name="admin_user" value="<?= esc($_POST['admin_user'] ?? 'admin') ?>" required>
<label>ایمیل ادمین *</label><input name="admin_email" type="email" value="<?= esc($_POST['admin_email'] ?? 'admin@example.com') ?>" required>
<label>رمز ادمین *</label><input name="admin_pass" type="password" required minlength="6">
<button type="submit">نصب و ساخت جداول →</button>
</form>
<p style="font-size:11px;color:#6d658a;margin-top:16px">اگر خطا داد: مطمئن شو MySQL User به Database اضافه شده (Add User To Database) و Privilege ALL دارد.</p>
</div>
</body>
</html>
