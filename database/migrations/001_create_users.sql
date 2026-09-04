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
