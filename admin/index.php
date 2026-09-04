<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../core/Auth.php';

Auth::startSession();
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $login = trim($_POST['login'] ?? '');
    $pass = $_POST['password'] ?? '';
    $u = Database::fetch('SELECT * FROM users WHERE email=? OR username=?', [$login,$login]);
    if ($u && password_verify($pass, $u['password_hash']) && (int)$u['is_admin']===1) {
        Auth::login((int)$u['id']);
        header('Location: /admin/'); exit;
    } else $error = 'نام کاربری/رمز یا دسترسی ادمین اشتباه است';
}
if (isset($_GET['logout'])) { Auth::logout(); header('Location: /admin/'); exit; }
if ($_SERVER['REQUEST_METHOD']==='POST' && isset($_POST['clear_league'])) {
  $userTmp = Auth::user();
  if ($userTmp && (int)$userTmp['is_admin']===1) {
    try {
      Database::query('DELETE FROM scores');
      Database::query('DELETE FROM runs');
      // also clear pending scores that were flagged as fake? keep users
      $clearMsg = '✅ لیگ کامل پاک شد — تمام امتیازها و ران‌ها حذف شدند. لیگ الان خالی است.';
    } catch (Throwable $e) { $clearMsg = 'خطا در پاکسازی: '.htmlspecialchars($e->getMessage()); }
  } else $clearMsg = 'دسترسی غیرمجاز';
}

$user = Auth::user();
$isAdmin = $user && (int)$user['is_admin']===1;
if (!$isAdmin) {
    // show login
    ?>
<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ادمین — ورود</title><style>*{box-sizing:border-box;font-family:Vazirmatn,Tahoma}body{margin:0;background:#0f0b2d;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center} .card{background:rgba(255,255,255,.06);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:28px;max-width:420px;width:100%} input{width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.25);color:#fff;margin:8px 0} button{width:100%;padding:12px;border:none;border-radius:12px;background:#ffd93d;font-weight:900;cursor:pointer}</style></head><body>
<div class="card"><h2>🔐 ورود ادمین</h2><?php if($error) echo '<div style="background:rgba(255,60,60,.15);padding:10px;border-radius:10px;color:#ffb3b3">'.$error.'</div>'; ?><form method="post"><input name="login" placeholder="نام کاربری یا ایمیل" required><input name="password" type="password" placeholder="رمز" required><button name="login" value="1">ورود</button></form><p style="font-size:11px;color:#9d92d9">ادمین از /install ساخته می‌شود (is_admin=1)</p></div>
</body></html>
    <?php exit;
}
// Dashboard data
$stats = [
    'users' => Database::fetch('SELECT COUNT(*) as c FROM users')['c'] ?? 0,
    'runs_today' => Database::fetch('SELECT COUNT(*) as c FROM runs WHERE DATE(created_at)=CURDATE()')['c'] ?? 0,
    'scores_today' => Database::fetch('SELECT COUNT(*) as c FROM scores WHERE DATE(created_at)=CURDATE() AND status="verified"')['c'] ?? 0,
    'flagged' => Database::fetch('SELECT COUNT(*) as c FROM runs WHERE status="flagged"')['c'] ?? 0,
    'challenges' => Database::fetch('SELECT COUNT(*) as c FROM friend_challenges WHERE expires_at > NOW()')['c'] ?? 0,
];
$recentRuns = Database::fetchAll('SELECT r.*, u.username FROM runs r JOIN users u ON u.id=r.user_id ORDER BY r.created_at DESC LIMIT 20');
$flaggedRuns = Database::fetchAll('SELECT r.*, u.username FROM runs r JOIN users u ON u.id=r.user_id WHERE r.status="flagged" ORDER BY r.created_at DESC LIMIT 20');
$users = Database::fetchAll('SELECT id, username, email, level, xp, friend_code, is_admin, created_at FROM users ORDER BY created_at DESC LIMIT 50');
?>
<!doctype html>
<html lang="fa" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>پنل ادمین — لیگ خوابگاه</title>
<style>*{box-sizing:border-box;font-family:Vazirmatn,Tahoma}body{margin:0;background:#0f0b2d;color:#fff} .wrap{max-width:1100px;margin:0 auto;padding:24px} .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px} .stat{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:18px;text-align:center} .stat b{font-size:26px;display:block;color:#ffd93d} table{width:100%;border-collapse:collapse;font-size:13px} th,td{padding:8px;border-bottom:1px solid rgba(255,255,255,.08);text-align:right} th{color:#cfc6ff} a{color:#ffd93d}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
.btn{padding:8px 14px;border-radius:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#fff;text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
<div class="header"><h1>🛡️ پنل ادمین — لیگ خوابگاه</h1><div><span style="color:#cfc6ff"><?= htmlspecialchars($user['username']) ?> (<?= $user['is_admin']?'Admin':'' ?>)</span> <a class="btn" href="/admin/?logout=1">خروج</a> <a class="btn" href="/">بازی</a></div></div>

<div class="grid">
<div class="stat"><b><?= $stats['users'] ?></b><small>کاربران</small></div>
<div class="stat"><b><?= $stats['runs_today'] ?></b><small>ران امروز</small></div>
<div class="stat"><b><?= $stats['scores_today'] ?></b><small>اسکور verified امروز</small></div>
<div class="stat"><b style="color:#ff8a80"><?= $stats['flagged'] ?></b><small>Flagged</small></div>
<div class="stat"><b><?= $stats['challenges'] ?></b><small>چالش فعال</small></div>
</div>
<?php if(!empty($clearMsg)) echo '<div style="background:rgba(126,242,192,.12);border:1px solid rgba(126,242,192,.25);padding:12px;border-radius:12px;color:#7ef2c0;margin:14px 0">'.$clearMsg.'</div>'; ?>
<div style="margin:18px 0;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
<form method="post" onsubmit="return confirm('⚠️ همه امتیازها و ران‌ها پاک شوند؟ این عمل برگشت‌ناپذیر است!')">
<button name="clear_league" value="1" style="background:#ff5e5e;color:#fff;padding:10px 18px;border:none;border-radius:12px;font-weight:900;cursor:pointer">🗑️ پاک کردن کل لیگ (حذف همه امتیازات)</button>
</form>
<span style="font-size:12px;color:#9d92d9">کاربران حذف نمی‌شوند — فقط scores/runs</span>
</div>
<p style="font-size:11px;color:#9d92d9">نکته: لیگ فیک فرانت‌اند هم در نسخه جدید (<code>main.js USE_FAKE_BOTS=false</code>) غیرفعال شده. برای پاک کردن کش محلی مرورگر، در بازی → تنظیمات → «پاک کردن لیگ فیک» بزنید یا در کنسول <code>clearFakeLeagueData()</code> را اجرا کنید.</p>

<h2 style="margin-top:28px">🚩 Flagged Runs (نیاز بررسی)</h2>
<?php if(empty($flaggedRuns)) echo '<p style="color:#9d92d9">هیچ مورد flagged نیست</p>'; else { ?>
<table><tr><th>Run</th><th>کاربر</th><th>کاراکتر</th><th>امتیاز</th><th>مسافت</th><th>IP</th><th>زمان</th></tr>
<?php foreach($flaggedRuns as $r): ?><tr><td style="font-family:monospace;font-size:11px"><?= substr($r['id'],0,8) ?></td><td><?= htmlspecialchars($r['username']) ?></td><td><?= $r['character_id'] ?></td><td><?= $r['score'] ?></td><td><?= $r['distance'] ?></td><td><?= $r['ip'] ?></td><td><?= $r['created_at'] ?></td></tr><?php endforeach; ?>
</table><?php } ?>

<h2>📋 آخرین ۲۰ Run</h2>
<table><tr><th>Run</th><th>کاربر</th><th>امتیاز</th><th>وضعیت</th><th>زمان</th></tr>
<?php foreach($recentRuns as $r): ?><tr><td style="font-family:monospace;font-size:11px"><?= substr($r['id'],0,8) ?></td><td><?= htmlspecialchars($r['username']) ?></td><td><?= $r['score'] ?></td><td><?= $r['status'] ?></td><td><?= $r['created_at'] ?></td></tr><?php endforeach; ?>
</table>

<h2>👥 کاربران (۵۰ اخیر)</h2>
<table><tr><th>ID</th><th>نام</th><th>ایمیل</th><th>Lv</th><th>کد دوستی</th><th>ادمین</th><th>تاریخ</th></tr>
<?php foreach($users as $u): ?><tr><td><?= $u['id'] ?></td><td><?= htmlspecialchars($u['username']) ?></td><td><?= htmlspecialchars($u['email']) ?></td><td><?= $u['level'] ?></td><td style="font-family:monospace"><?= $u['friend_code'] ?></td><td><?= $u['is_admin']?'✅':'' ?></td><td><?= $u['created_at'] ?></td></tr><?php endforeach; ?>
</table>

<p style="margin-top:22px;color:#6d658a;font-size:12px">برای حذف flagged: در phpMyAdmin → runs → status را به rejected یا verified تغییر دهید.</p>
</div>
</body>
</html>
