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
