PATCH 3 — 2026-09-05 — Fix league fake clear + over score display
===========================================================
مشکلات گزارش شده:
 1) بازی فریز نمی‌شود ولی امتیاز نشان نمی‌دهد (over screen خالی)
    -> showOver بازنویسی شد: UI اول (ovScore/ovCigs/ovDist/scoreBreak) همیشه حتی اگر DB خطا دهد نمایش داده می‌شود، با tryهای جداگانه و fallbackها
 2) جدول لیگ پر از افراد و امتیازهای الکی (بات‌های FakeBackend)
    -> FakeBackend.bots = [] و USE_FAKE_BOTS=false شد
    -> کش قدیمی localStorage (cachedBoard شامل بات‌ها + fed_records_v1) به صورت خودکار پاک می‌شود
    -> دکمه جدید در تنظیمات: "پاک کردن لیگ فیک (محلی)" -> clearFakeLeagueData()
    -> ادمین: دکمه "پاک کردن کل لیگ" در /admin (DELETE FROM scores,runs)
    -> Network.leaderboard حالا pendingRuns محلی را با نتایج PHP ادغام می‌کند تا امتیاز همین الان دیده شود

فایل‌های تغییر یافته:
 - main.js (166K -> 167K) : bots disabled, cleanFakeCached, clearFakeLeagueData, robust showOver, merge pending into leaderboard
 - index.html : دکمه پاک کردن لیگ فیک در تنظیمات
 - admin/index.php : فرم پاکسازی لیگ + پیام
 - config/config.php + core/Auth.php + .htaccess (همان patch2، برای اطمینان دوباره شامل شدند)

نصب:
 1) patch3.zip را در htdocs آپلود -> Extract -> Overwrite YES
    یا فول پکیج جدید dorm-escape-php.zip (925KB) را جایگزین کنید
 2) (اختیاری) برای پاکسازی کامل لیگ واقعی: وارد /admin شوید -> "پاک کردن کل لیگ" را بزنید
    یا در phpMyAdmin: DELETE FROM scores; DELETE FROM runs;  (یا TRUNCATE)
 3) برای پاکسازی محلی هر مرورگر: بازی -> تنظیمات -> پاک کردن لیگ فیک
    یا در کنسول: clearFakeLeagueData()
    یا: localStorage.removeItem('dorm_v3'); localStorage.removeItem('fed_records_v1'); location.reload()
 4) تست: یک Run جدید بازی کنید -> باخت -> صفحه over باید امتیاز، سیگار، مسافت، combo و scoreBreak را با اعداد فارسی نشان دهد
        سپس لیگ -> جهانی : باید فقط امتیازهای واقعی (یا خالی با پیام "هنوز کسی رکوردی ثبت نکرده") دیده شود، نه بات‌های 48k

نکته: اگر لیگ خالی ماند طبیعی است — بعد از پاکسازی، اولین امتیاز واقعی شما ثبت می‌شود و لیگ پر می‌شود.
