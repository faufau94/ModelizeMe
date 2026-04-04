-- MySQL Database Schema
-- Modèle : Réseau Social
-- Relations : N,N / réflexive N,N (amis) / réflexive 0,1 (réponse)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `reseau_social_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `reseau_social_db`;

-- Table structure for table `utilisateur`
CREATE TABLE `utilisateur` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `pseudo` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `bio` TEXT,
  `avatar_url` VARCHAR(255),
  `date_inscription` DATETIME NOT NULL,
  `actif` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `publication`
CREATE TABLE `publication` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `auteur_id` BIGINT NOT NULL,
  `contenu` TEXT NOT NULL,
  `image_url` VARCHAR(255),
  `visibilite` VARCHAR(50) NOT NULL DEFAULT 'public',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`auteur_id`) REFERENCES `utilisateur`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `commentaire`
CREATE TABLE `commentaire` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `publication_id` BIGINT NOT NULL,
  `auteur_id` BIGINT NOT NULL,
  `parent_id` BIGINT,
  `contenu` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`publication_id`) REFERENCES `publication`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`auteur_id`) REFERENCES `utilisateur`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`parent_id`) REFERENCES `commentaire`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `groupe`
CREATE TABLE `groupe` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `createur_id` BIGINT NOT NULL,
  `nom` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `prive` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`createur_id`) REFERENCES `utilisateur`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `tag`
CREATE TABLE `tag` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table associative réflexive N,N : amitié entre utilisateurs
CREATE TABLE `amitie` (
  `utilisateur_source_id` BIGINT NOT NULL,
  `utilisateur_cible_id` BIGINT NOT NULL,
  `statut` VARCHAR(50) NOT NULL DEFAULT 'en_attente',
  `date_demande` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`utilisateur_source_id`, `utilisateur_cible_id`),
  FOREIGN KEY (`utilisateur_source_id`) REFERENCES `utilisateur`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`utilisateur_cible_id`) REFERENCES `utilisateur`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table associative : likes sur publications
CREATE TABLE `like_publication` (
  `utilisateur_id` BIGINT NOT NULL,
  `publication_id` BIGINT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`utilisateur_id`, `publication_id`),
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateur`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`publication_id`) REFERENCES `publication`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table associative : membres d'un groupe
CREATE TABLE `membre_groupe` (
  `utilisateur_id` BIGINT NOT NULL,
  `groupe_id` BIGINT NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'membre',
  `date_adhesion` DATETIME NOT NULL,
  PRIMARY KEY (`utilisateur_id`, `groupe_id`),
  FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateur`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`groupe_id`) REFERENCES `groupe`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table associative : tags sur publications
CREATE TABLE `publication_tag` (
  `publication_id` BIGINT NOT NULL,
  `tag_id` BIGINT NOT NULL,
  PRIMARY KEY (`publication_id`, `tag_id`),
  FOREIGN KEY (`publication_id`) REFERENCES `publication`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
