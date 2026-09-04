<?php
// debug_admin.php - temporary debug helper for InfinityFree admin login + game freeze
// Upload to htdocs alongside index.html then visit https://your-domain/debug_admin.php
// DELETE after debug (contains sensitive info)
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');
header('Content-Type: text/html; charset=utf-8');
echo '<meta charset="utf-8"><style>body{font-family:Tahoma;padding:16px;background:#0f0f1e;color:#e0e0ff}code{background:#1a1a33;padding:2px 6px;border-radius:4px}input{padding:8px;border-radius:6px;border:1px solid #555;background:#1a1a33;color:#fff;margin:4px}button{padding:8px 14px;border-radius:6px;background:#ffd93d;color:#000;font-weight:700;border:0;cursor:pointer}.ok{color:#7ef2c0}.err{color:#ff8a80}.card{background:#1e1e3a;padding:12px;border-radius:10px;margin:10px 0}</style>';
echo '<h1>🔧 Dorm Escape — Debug Admin + Game Freeze</h1>';
echo '<p>Time: '.date('Y-m-d H:i:s').' — PHP '.PHP_VERSION.' — Host '.htmlspecialchars($_SERVER['HTTP_HOST'] ?? '?').'</p>';

// === SESSION DEBUG ===
echo '<div class="card"><h2>1) Session / HTTPS debug</h2>';
// polyfills if config not yet loaded
if (!function_exists('str_starts_with')) { function str_starts_with($h,$n){ return $n!=='' && strpos($h,$n)===0; } }
if (!function_exists('str_contains')) { function str_contains($h,$n){ return $n!=='' && strpos($h,$n)!==false; } }

// try load config to see SESSION_SECURE
$cfgLoaded=false;
if (file_exists(__DIR__.'/config/config.php')) {
  try { require_once __DIR__.'/config/config.php'; $cfgLoaded=true; } catch(Throwable $e){ echo '<p class="err">config.php load error: '.htmlspecialchars($e->getMessage()).'</p>'; }
}
echo '<ul>';
echo '<li>HTTPS: <code>'.htmlspecialchars($_SERVER['HTTPS'] ?? '(empty)').'</code></li>';
echo '<li>HTTP_X_FORWARDED_PROTO: <code>'.htmlspecialchars($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '(empty)').'</code></li>';
echo '<li>HTTP_HOST: <code>'.htmlspecialchars($_SERVER['HTTP_HOST'] ?? '').'</code></li>';
echo '<li>APP_URL: <code>'.(defined('APP_URL')?htmlspecialchars(APP_URL):'NOT DEFINED').'</code></li>';
echo '<li>SESSION_SECURE: <code>'.(defined('SESSION_SECURE')? (SESSION_SECURE?'true':'false'):'NOT DEFINED').'</code> '.(defined('SESSION_SECURE') && SESSION_SECURE && stripos($_SERVER['HTTP_HOST']??'','infinityfree')!==false ? '<span class="err">⚠️ Would be DROPPED on InfinityFree (Flexible) if true!</span>':'').'</li>';
echo '<li>SESSION_NAME: <code>'.(defined('SESSION_NAME')?htmlspecialchars(SESSION_NAME):'?').'</code></li>';
echo '<li>isInfinityFree: <code>'.(stripos($_SERVER['HTTP_HOST']??'','infinityfree')!==false?'YES':'NO').'</code></li>';
echo '<li>Cookie params will be secure='.(defined('SESSION_SECURE') && SESSION_SECURE ? 'true' : 'false').'</li>';
echo '</ul>';
if ($cfgLoaded && defined('SESSION_SECURE') && SESSION_SECURE && stripos($_SERVER['HTTP_HOST']??'','infinityfree')!==false) {
  echo '<p class="err"><b>⚠️ FIX NEEDED:</b> SESSION_SECURE must be <b>false</b> on InfinityFree free subdomain. Overwrite <code>config/config.php</code> + <code>core/Auth.php</code> with patch2, then Ctrl+F5.</p>';
} else echo '<p class="ok">✅ SESSION_SECURE looks correct for this host.</p>';
echo '</div>';

// === DB DEBUG ===
echo '<div class="card"><h2>2) DB + admin users</h2>';
try{
  if (!defined('DB_HOST')) throw new Exception('DB constants not loaded — did install complete? Check config/config.php exists and contains DB_*');
  $pdo = new PDO('mysql:host='.DB_HOST.';port='.(defined('DB_PORT')?DB_PORT:3306).';dbname='.DB_NAME.';charset=utf8mb4', DB_USER, DB_PASS, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
  echo '<p class="ok">✅ DB connect OK: '.htmlspecialchars(DB_HOST).' / '.htmlspecialchars(DB_NAME).' / '.htmlspecialchars(DB_USER).'</p>';
  $cnt = $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
  echo '<p>users count: <b>'.$cnt.'</b></p>';
  $admins = $pdo->query('SELECT id, username, email, is_admin, password_hash, created_at FROM users WHERE is_admin=1')->fetchAll(PDO::FETCH_ASSOC);
  if (!$admins) echo '<p class="err">❌ No is_admin=1 row found! Your admin was not created as admin. Fix: in phpMyAdmin run: <code>UPDATE users SET is_admin=1 WHERE username="YOURNAME"</code></p>';
  else {
    echo '<p class="ok">Found '.count($admins).' admin(s):</p><table border=1 cellpadding=6 style="border-collapse:collapse;background:#1a1a33"><tr><th>id</th><th>username</th><th>email</th><th>is_admin</th><th>hash prefix</th></tr>';
    foreach($admins as $a) echo '<tr><td>'.$a['id'].'</td><td>'.htmlspecialchars($a['username']).'</td><td>'.htmlspecialchars($a['email']).'</td><td>'.$a['is_admin'].'</td><td><code>'.htmlspecialchars(substr($a['password_hash'],0,20)).'...</code></td></tr>';
    echo '</table>';
  }
  // non-admin count
  $users = $pdo->query('SELECT id, username, email, is_admin FROM users ORDER BY id DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
  echo '<p>Last 5 users:</p><table border=1 cellpadding=6 style="border-collapse:collapse;background:#1a1a33"><tr><th>id</th><th>username</th><th>is_admin</th></tr>';
  foreach($users as $u) echo '<tr><td>'.$u['id'].'</td><td>'.htmlspecialchars($u['username']).'</td><td>'.$u['is_admin'].'</td></tr>';
  echo '</table>';
}catch(Throwable $e){
  echo '<p class="err">DB error: '.htmlspecialchars($e->getMessage()).'</p>';
  echo '<p>Check <code>config/config.php</code> DB_HOST/DB_NAME/DB_USER/DB_PASS match InfinityFree cPanel → MySQL Databases → Connection details (sql201.infinityfree.com, if0_..., ZgxnEj...)</p>';
}
echo '</div>';

// === PASSWORD VERIFY TEST ===
echo '<div class="card"><h2>3) Test password_verify (live)</h2>';
echo '<form method=POST><input name="test_user" placeholder="username OR email" value="'.htmlspecialchars($_POST['test_user']??'').'"><input name="test_pass" type="password" placeholder="password" value="'.htmlspecialchars($_POST['test_pass']??'').'"><button type=submit name="do_test" value=1>Test verify</button></form>';
if(isset($_POST['do_test'])){
  $tu=trim($_POST['test_user']??''); $tp=$_POST['test_pass']??'';
  if($tu===''||$tp==='') echo '<p class="err">Enter both fields.</p>';
  else {
    try{
      $pdo = new PDO('mysql:host='.DB_HOST.';port='.(defined('DB_PORT')?DB_PORT:3306).';dbname='.DB_NAME.';charset=utf8mb4', DB_USER, DB_PASS);
      $st=$pdo->prepare('SELECT id, username, email, password_hash, is_admin FROM users WHERE username=? OR email=? LIMIT 1');
      $st->execute([$tu,$tu]);
      $u=$st->fetch(PDO::FETCH_ASSOC);
      if(!$u) echo '<p class="err">❌ No user found with username/email <code>'.htmlspecialchars($tu).'</code></p>';
      else {
        echo '<p>User: <code>'.htmlspecialchars($u['username']).'</code> is_admin='.$u['is_admin'].' hash_len='.strlen($u['password_hash']).'</p>';
        $ok=password_verify($tp, $u['password_hash']);
        echo $ok ? '<p class="ok">✅ password_verify = TRUE — password correct!</p>' : '<p class="err">❌ password_verify = FALSE — wrong password OR hash corrupted (check BCRYPT_COST, php version)</p>';
        if(!$ok){
          echo '<p>Debug: hash starts <code>'.htmlspecialchars(substr($u['password_hash'],0,30)).'</code> — try re-create admin via <code>/install/</code> reset admin step or phpMyAdmin SQL: <code>SELECT LENGTH(password_hash) FROM users WHERE id='.$u['id'].'</code> should be 60.</p>';
        } else {
          // try real login
          require_once __DIR__.'/core/Auth.php';
          Auth::login((int)$u['id']);
          echo '<p class="ok">✅ Auth::login() called — session_id='.htmlspecialchars(session_id()).' user_id in session='.$_SESSION['user_id'].'</p>';
          echo '<p>Try opening <a href="admin/index.php" style="color:#ffd93d">admin/index.php</a> now — if still redirects to login, SESSION_SECURE cookie was dropped → apply patch2.</p>';
          echo '<p>Current cookies sent: <code>'.htmlspecialchars($_SERVER['HTTP_COOKIE']??'(none)').'</code></p>';
        }
      }
    }catch(Throwable $e){ echo '<p class="err">Error: '.htmlspecialchars($e->getMessage()).'</p>'; }
  }
}
echo '</div>';

// === GAME FREEZE DEBUG ===
echo '<div class="card"><h2>4) Game freeze (catch → frozen) quick fix</h2>';
echo '<p>Root cause: <code>DB.stats.zonesSeen</code> stored as <code>Set</code> → <code>JSON.stringify</code> becomes <code>{}</code> → next load <code>.add is not a function</code> in <code>showOver()</code> → <code>S.mode</code> stays <code>catch</code> forever.</p>';
echo '<p class="ok">✅ Patched in <code>main.js</code> (patch2). To fix instantly without re-upload, run in browser DevTools Console (F12) on game site:</p>';
echo '<pre style="background:#000;padding:10px;border-radius:8px;overflow:auto">localStorage.removeItem("dorm_v3"); location.reload();\n// or cleaner (keeps XP):\nlet db=JSON.parse(localStorage.getItem("dorm_v3")); if(db && db.stats && db.stats.zonesSeen && !Array.isArray(db.stats.zonesSeen)) db.stats.zonesSeen=[]; localStorage.setItem("dorm_v3", JSON.stringify(db)); location.reload();</pre>';
echo '<p>Then overwrite <code>main.js</code> with patch2 — future saves will be array, no freeze.</p>';
echo '<p>Current localStorage check (if you open this debug via <code>fetch</code>? not possible here) — but you can paste above.</p>';
echo '</div>';

echo '<div class="card"><h2>5) .htaccess / install checks</h2>';
echo '<p>Current .htaccess blocks: <code>config|core|database|supabase</code> only (install ALLOWED). If you see 403 on <code>/install/</code>, overwrite <code>.htaccess</code> with patch2. PHP version recommendation: 8.1 or 8.2 (InfinityFree → cPanel → PHP Version).</p>';
echo '<p>Pending runs in DB: ';
try{
  $pdo = new PDO('mysql:host='.DB_HOST.';port='.(defined('DB_PORT')?DB_PORT:3306).';dbname='.DB_NAME.';charset=utf8mb4', DB_USER, DB_PASS);
  $c=$pdo->query('SELECT COUNT(*) FROM runs')->fetchColumn(); echo $c;
}catch(Throwable $e){ echo '?'; }
echo '</p>';
echo '</div>';

echo '<p style="color:#ff8a80"><b>⚠️ Security:</b> Delete <code>debug_admin.php</code> after use! (<code>rm debug_admin.php</code> via file manager)</p>';
