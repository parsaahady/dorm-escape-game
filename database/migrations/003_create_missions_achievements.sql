-- 003_create_missions_achievements.sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS `missions` (
  `id` VARCHAR(32) NOT NULL,
  `title` VARCHAR(128) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `icon` VARCHAR(16) NOT NULL DEFAULT '⭐',
  `target` INT UNSIGNED NOT NULL,
  `xp_reward` INT UNSIGNED NOT NULL DEFAULT 100,
  `type` ENUM('daily','weekly') NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `missions` (`id`,`title`,`description`,`icon`,`target`,`xp_reward`,`type`) VALUES
('d_cig','سیگاری روز','۲۰ نخ جمع کن 🚬','🚬',20,120,'daily'),
('d_dist','فرار صبحگاهی','۸۰۰ متر بدو 🏃','🏃',800,100,'daily'),
('d_near','نزدیک بود!','۵ Near Miss ⚡','⚡',5,150,'daily'),
('d_ability','قدرت‌نمایی','۳ بار Ability بزن','✨',3,130,'daily'),
('d_combo','کومبو باز','Combo x10 بساز 🔥','🔥',10,140,'daily'),
('w_score','رکوردشکن','۱۵,۰۰۰ امتیاز','🏆',15000,400,'weekly'),
('w_near','استاد Near Miss','۳۰ Near Miss','⚡',30,350,'weekly'),
('w_runs','فراری خستگی‌ناپذیر','۱۰ Run کامل','🔁',10,300,'weekly'),
('w_chars','همه‌کاره','با هر ۵ کاراکتر بازی کن','🎭',5,450,'weekly'),
('w_nopow','دست خالی','۱ Run بدون Power-up','🛡️',1,300,'weekly');

CREATE TABLE IF NOT EXISTS `user_missions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `mission_id` VARCHAR(32) NOT NULL,
  `progress` INT UNSIGNED NOT NULL DEFAULT 0,
  `target` INT UNSIGNED NOT NULL,
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
  `completed_at` DATETIME NULL,
  `period_key` VARCHAR(32) NOT NULL DEFAULT '', -- e.g. 2025-09-04 daily or 2025-W36 weekly
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_mission_period` (`user_id`,`mission_id`,`period_key`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `fk_um_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_um_mission` FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `achievements` (
  `id` VARCHAR(32) NOT NULL,
  `title` VARCHAR(128) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `icon` VARCHAR(16) NOT NULL,
  `target` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `achievements` (`id`,`title`,`description`,`icon`,`target`) VALUES
('first_run','فرار اول 🏃','اولین Run رو کامل کن','🏃',1),
('combo10','Combo Master 🔥','Combo x15 بساز','🔥',15),
('untouchable','دست‌نیافتنی 👮','۵۰۰m بدون برخورد','👮',500),
('smoker','سیگاری حرفه‌ای 🚬','۵۰۰ نخ جمع کن','🚬',500),
('lightning','برق‌آسا ⚡','۵۰ Near Miss','⚡',50),
('lastchance','آخرین شانس 🛡️','۱۰ بار با شیلد نجات پیدا کن','🛡️',10),
('nearmiss100','نزدیک بود! 💀','۱۰۰ Near Miss','💀',100),
('record','رکورددار 🏆','امتیاز ۲۰,۰۰۰','🏆',20000),
('nightowl','شب‌زنده‌دار 🌙','۵ Run شبانه','🌙',5),
('collector','جمع‌کن 🎒','۱۰ Power-up بگیر','🧲',10),
('explorer','گردشگر خوابگاه 🗺️','۳ محیط مختلف ببین','🗺️',3),
('friend','رفیق خوابگاهی 👥','۱ دوست اضافه کن','👥',1);

CREATE TABLE IF NOT EXISTS `user_achievements` (
  `user_id` INT UNSIGNED NOT NULL,
  `achievement_id` VARCHAR(32) NOT NULL,
  `progress` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_unlocked` TINYINT(1) NOT NULL DEFAULT 0,
  `unlocked_at` DATETIME NULL,
  PRIMARY KEY (`user_id`,`achievement_id`),
  CONSTRAINT `fk_ua_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ua_ach` FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `daily_challenges` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `challenge_date` DATE NOT NULL,
  `seed` INT NOT NULL,
  `title` VARCHAR(128) NOT NULL,
  `modifier` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_date` (`challenge_date`),
  KEY `idx_seed` (`seed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `weekly_leagues` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `week_start` DATE NOT NULL,
  `week_end` DATE NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_week` (`week_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `weekly_league_members` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `league_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `weekly_score` INT UNSIGNED NOT NULL DEFAULT 0,
  `tier` ENUM('bronze','silver','gold','diamond') NOT NULL DEFAULT 'bronze',
  `rank` INT UNSIGNED DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_league_user` (`league_id`,`user_id`),
  KEY `idx_score` (`weekly_score`),
  CONSTRAINT `fk_wlm_league` FOREIGN KEY (`league_id`) REFERENCES `weekly_leagues`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wlm_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
