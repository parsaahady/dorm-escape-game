-- database_fixed.sql — Clean import for shared hosting (InfinityFree / if0_*)
-- Fix: uniform utf8mb4_unicode_ci + DROP old tables before CREATE
-- Use this if normal database.sql gives errno 150
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `challenge_results`;
DROP TABLE IF EXISTS `scores`;
DROP TABLE IF EXISTS `runs`;
DROP TABLE IF EXISTS `user_characters`;
DROP TABLE IF EXISTS `weekly_league_members`;
DROP TABLE IF EXISTS `weekly_leagues`;
DROP TABLE IF EXISTS `user_achievements`;
DROP TABLE IF EXISTS `user_missions`;
DROP TABLE IF EXISTS `daily_challenges`;
DROP TABLE IF EXISTS `friend_challenges`;
DROP TABLE IF EXISTS `friendships`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `rate_limits`;
DROP TABLE IF EXISTS `install_lock`;
DROP TABLE IF EXISTS `achievements`;
DROP TABLE IF EXISTS `missions`;
DROP TABLE IF EXISTS `user_sessions`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `characters`;

-- then re-create (same as database.sql)
-- 001_create_users.sql — MySQL 8 / MariaDB 10.4+
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(32) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(64) NOT NULL DEFAULT '',
  `avatar` VARCHAR(16) NOT NULL DEFAULT '😎',
  `friend_code` VARCHAR(16) NOT NULL,
  `level` INT UNSIGNED NOT NULL DEFAULT 1,
  `xp` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_xp` INT UNSIGNED NOT NULL DEFAULT 0,
  `reputation` INT UNSIGNED NOT NULL DEFAULT 0,
  `reputation_rank` VARCHAR(32) NOT NULL DEFAULT 'مهمان',
  `is_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `last_login_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_username` (`username`),
  UNIQUE KEY `uq_email` (`email`),
  UNIQUE KEY `uq_friend_code` (`friend_code`),
  KEY `idx_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `token_hash` VARCHAR(128) NOT NULL,
  `ip` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `characters` (
  `id` VARCHAR(32) NOT NULL,
  `name` VARCHAR(32) NOT NULL,
  `title` VARCHAR(32) NOT NULL,
  `passive_name` VARCHAR(64) NOT NULL,
  `active_name` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `characters` (`id`,`name`,`title`,`passive_name`,`active_name`) VALUES
('parsa','پارسا','فرارچی','سرعت پایه','Adrenaline'),
('mahyar','مهیار','جمع‌کن','جذب','Magnet Mode'),
('arsham','آرشام','ریسک‌پذیر','ریسک','Risk Mode'),
('mohsen','محسن','تانک','تانک','Shield'),
('farham','فرهام','شبح','شبح','Ghost Mode');

SET FOREIGN_KEY_CHECKS=1;
-- 002_create_runs_scores.sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS `runs` (
  `id` CHAR(36) NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `character_id` VARCHAR(32) NOT NULL,
  `seed` INT NOT NULL,
  `score` INT UNSIGNED NOT NULL,
  `distance` INT UNSIGNED NOT NULL,
  `best_combo` INT UNSIGNED NOT NULL DEFAULT 0,
  `duration` INT UNSIGNED NOT NULL,
  `items_collected` INT UNSIGNED NOT NULL DEFAULT 0,
  `near_misses` INT UNSIGNED NOT NULL DEFAULT 0,
  `powerups_used` INT UNSIGNED NOT NULL DEFAULT 0,
  `ability_uses` INT UNSIGNED NOT NULL DEFAULT 0,
  `environment` VARCHAR(32) NOT NULL DEFAULT 'dorm',
  `status` ENUM('pending','verified','flagged','rejected') NOT NULL DEFAULT 'verified',
  `started_at` DATETIME NOT NULL,
  `finished_at` DATETIME NOT NULL,
  `ip` VARCHAR(45) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_created` (`user_id`,`created_at`),
  KEY `idx_score` (`score`),
  KEY `idx_created` (`created_at`),
  KEY `idx_seed` (`seed`),
  CONSTRAINT `fk_runs_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_runs_char` FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scores` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `run_id` CHAR(36) NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(32) NOT NULL,
  `character_id` VARCHAR(32) NOT NULL,
  `score` INT UNSIGNED NOT NULL,
  `distance` INT UNSIGNED NOT NULL,
  `cigs` INT UNSIGNED NOT NULL DEFAULT 0,
  `combo` INT UNSIGNED NOT NULL DEFAULT 0,
  `seed` INT NOT NULL,
  `environment` VARCHAR(32) NOT NULL DEFAULT 'dorm',
  `status` ENUM('pending','verified','flagged','rejected') NOT NULL DEFAULT 'verified',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_run` (`run_id`),
  KEY `idx_score` (`score`),
  KEY `idx_user_score` (`user_id`,`score`),
  KEY `idx_character` (`character_id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_scores_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_scores_run` FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_characters` (
  `user_id` INT UNSIGNED NOT NULL,
  `character_id` VARCHAR(32) NOT NULL,
  `level` INT UNSIGNED NOT NULL DEFAULT 1,
  `xp` INT UNSIGNED NOT NULL DEFAULT 0,
  `games_played` INT UNSIGNED NOT NULL DEFAULT 0,
  `best_score` INT UNSIGNED NOT NULL DEFAULT 0,
  `best_distance` INT UNSIGNED NOT NULL DEFAULT 0,
  `best_combo` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`character_id`),
  CONSTRAINT `fk_uc_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_uc_char` FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
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
-- 004_create_social.sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS `friendships` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `requester_id` INT UNSIGNED NOT NULL,
  `receiver_id` INT UNSIGNED NOT NULL,
  `status` ENUM('pending','accepted','blocked','rejected') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pair` (`requester_id`,`receiver_id`),
  KEY `idx_requester` (`requester_id`),
  KEY `idx_receiver` (`receiver_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_f_requester` FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_f_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `friend_challenges` (
  `id` CHAR(36) NOT NULL,
  `creator_id` INT UNSIGNED NOT NULL,
  `seed` INT NOT NULL,
  `title` VARCHAR(128) DEFAULT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_creator` (`creator_id`),
  KEY `idx_seed` (`seed`),
  KEY `idx_expires` (`expires_at`),
  CONSTRAINT `fk_fc_creator` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `challenge_results` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `challenge_id` CHAR(36) NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `score` INT UNSIGNED NOT NULL,
  `distance` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_challenge_user` (`challenge_id`,`user_id`),
  KEY `idx_score` (`score`),
  CONSTRAINT `fk_cr_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `friend_challenges`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cr_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(128) NOT NULL,
  `body` TEXT DEFAULT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `type` VARCHAR(32) DEFAULT 'general',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_read` (`user_id`,`is_read`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `fk_n_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rate_limits` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `endpoint` VARCHAR(64) NOT NULL,
  `ip` VARCHAR(45) NOT NULL,
  `window_start` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_endpoint_ip` (`endpoint`,`ip`),
  KEY `idx_window` (`window_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `install_lock` (
  `id` INT NOT NULL DEFAULT 1,
  `locked` TINYINT(1) NOT NULL DEFAULT 0,
  `locked_at` DATETIME NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO `install_lock` (`id`,`locked`) VALUES (1,0);

SET FOREIGN_KEY_CHECKS=1;
