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
