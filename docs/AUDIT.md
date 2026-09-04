# Audit — Dorm Escape Game (v2 → v3)

تاریخ: 2026-09-04
مخزن: parsaahady/dorm-escape-game

## معماری فعلی (main.js 1731 خط)

- **Stack**: Vanilla JS + Canvas 2.5D + WebAudio synth, بدون dependency, SPA multi-screen با DOM + Canvas
- **State**: شیء S واحد (mode, t, dist, speed, x/vx, jumpY/vy, slideT, cigs, score, pows, danger, ents, parts...)
- **Loop**: requestAnimationFrame → updatePlay → draw (perspective projection via proj())
- **Physics**: لاین -1/0/1 با فنر میراگر (spring 110, damp 14), پرش گرانشی (vy, g=15), سرخوردن 0.72s
- **Spawn**: ردیف‌محور, هر Z=gap (speed*1.05 + rand), تضمین عدم بن‌بست (هر 3 لاین full نیست), خط سیگار 4-7 تایی + Perfect bonus
- **Obstacles**: 9 نوع (bin,cart,door,guardpop,laundry,cctv,box,chair,bucket) با type low/high/full
- **Powerups**: 5 نوع (boost,magnet,x2,high,shield)
- **Zones**: 3 منطقه (hall,yard,alley) هر 380m با ground/road/wall/props
- **Storage**: fed_records_v1, fed_char, fed_muted, fed_tut → localStorage با fallback
- **Audio**: AU (Oscillator+Noise), music 32-step sequencer
- **Tests**: harness headless (node test/harness.js) با invariants و bot

## مشکلات / محدودیت‌ها

- State پراکنده, migration ندارد
- Score تک‌عاملی (dist + cig*5), بدون combo/nearMiss
- کاراکترها فقط ظاهر (بدون ability)
- Leaderboard کاملا local
- هیچ XP/Level/Mission/Achievement/League
- Spawn تصادفی ساده (بدون Pattern), بدون Difficulty Scaling پیشرفته
- محیط تکراری (3 zone), بدون Day/Night, بدون Random Event
- UI ساده, بدون Glassmorphism/Animation حرفه‌ای

## معماری پیشنهادی v3

```
Frontend: HTML+CSS+Vanilla JS (ES Module optional) + Canvas
Backend: Supabase abstraction + FakeOfflineBackend (Offline-First)

Storage v2 Schema:
  dorm_v3 (versioned JSON):
    v, player{ id, username, friendCode, avatar },
    settings{ muted, sfx, music, particles, shake, reducedMotion, lang },
    characters{ selected, levels, xp },
    stats{ runs, dist, cigs, nearMiss, bestScore, bestDist, bestCombo, playTime },
    xp{ level, xp, total },
    missions{ daily[], weekly[], lastDaily, lastWeekly },
    achievements[],
    league{ tier, weeklyScore, bestTier, resetAt },
    pendingRuns[],
    cachedBoard[],
    ghost{ seed, inputs[] }

Network:
  OnlineProvider { submitScore(payload) → server validation, fetchLeaderboard(tab) }
  → tries Supabase (if config in localStorage supabase_url/key), else FakeBackend (localStorage + seeded bots)

Validation: maxScore, dist-consistency, duration, impossible values

Game Systems:
  Score = dist + cig*25 + nearMiss*50 + perfectBonus + comboMultiplier + difficulty* + abilityBonus (Balancer object)
  Combo: +1 per cig/nearMiss/dodge, decay 1.8s idle, multiplier up to 3x, HUD+particles+shake
  NearMiss: rel in [-0.5,0.8] & laneDiff ~0.5-0.65 & dodge via jump/slide/lane → floating ⚡+slowMo 0.1s
  Abilities: 5× (passive+active+cooldown+duration+fx)
  Events: RandomEvent every 30-50s (police raid, rain, blackout, shortcut...) + Daily Tonight modifier
  Zones: 6 (dorm, campus, cafeteria, parking, night, exam) + Day/Night lerp over t
  Difficulty: speed + obstacleDensity + patternComplexity + policePressure, fair spawn (Pattern A-D)
  Seed: mulberry32(seed) برای Daily/Weekly/FriendChallenge/Ghost قابل بازسازی
```

## فایل‌های تغییریافته

- index.html → بازطراحی MainMenu + 8 صفحه جدید + HUD پیشرفته
- style.css → Modern Arcade + Glassmorphism + Animations
- main.js → +2800 خط (systems: combo, nearMiss, ability, score, missions, xp, achievements, league, network, ghost, events, seed)
- README.md → Architecture, Backend Setup, Testing

## تصمیمات کلیدی

- حفظ Canvas 2.5D فعلی, عدم مهاجرت به Three.js
- Offline-First: بازی بدون اینترنت کامل کار می‌کند, sync later
- ES Module اختیاری, فعلا single-file برای سازگاری GitHub Pages
- Backward Compatible: migration از fed_records_v1 → dorm_v3
