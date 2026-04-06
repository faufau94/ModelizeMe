-- MySQL Database Schema
-- Modèle : Gestion de Bibliothèque
-- Relations : 1,N / N,N avec propriétés / réflexive 0,1-0,N

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `bibliotheque_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bibliotheque_db`;

-- Table structure for table `editeur`
CREATE TABLE `editeur` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(255) NOT NULL,
  `pays` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `categorie`
CREATE TABLE `categorie` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `parent_id` BIGINT,
  `nom` VARCHAR(255) NOT NULL,
  `description` TEXT,
  FOREIGN KEY (`parent_id`) REFERENCES `categorie`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `auteur`
CREATE TABLE `auteur` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(255) NOT NULL,
  `prenom` VARCHAR(255) NOT NULL,
  `nationalite` VARCHAR(255),
  `biographie` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `adherent`
CREATE TABLE `adherent` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(255) NOT NULL,
  `prenom` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `telephone` VARCHAR(255),
  `date_inscription` DATE NOT NULL,
  `actif` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `livre`
CREATE TABLE `livre` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `editeur_id` BIGINT NOT NULL,
  `categorie_id` BIGINT NOT NULL,
  `titre` VARCHAR(255) NOT NULL,
  `isbn` VARCHAR(255) NOT NULL,
  `annee_publication` INT,
  `nombre_pages` INT,
  `disponible` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`editeur_id`) REFERENCES `editeur`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`categorie_id`) REFERENCES `categorie`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `emprunt`
CREATE TABLE `emprunt` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `adherent_id` BIGINT NOT NULL,
  `livre_id` BIGINT NOT NULL,
  `date_emprunt` DATETIME NOT NULL,
  `date_retour_prevue` DATE NOT NULL,
  `date_retour_effective` DATETIME,
  `rendu` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`adherent_id`) REFERENCES `adherent`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`livre_id`) REFERENCES `livre`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table associative : un livre est écrit par plusieurs auteurs
CREATE TABLE `auteur_livre` (
  `auteur_id` BIGINT NOT NULL,
  `livre_id` BIGINT NOT NULL,
  PRIMARY KEY (`auteur_id`, `livre_id`),
  FOREIGN KEY (`auteur_id`) REFERENCES `auteur`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`livre_id`) REFERENCES `livre`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table associative avec propriétés : un adhérent note un livre
CREATE TABLE `adherent_livre` (
  `adherent_id` BIGINT NOT NULL,
  `livre_id` BIGINT NOT NULL,
  `note` INT NOT NULL,
  `commentaire` TEXT,
  `date_avis` DATE NOT NULL,
  PRIMARY KEY (`adherent_id`, `livre_id`),
  FOREIGN KEY (`adherent_id`) REFERENCES `adherent`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`livre_id`) REFERENCES `livre`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
