-- MySQL Database Schema
-- Modèle : Gestion Scolaire
-- Relations : 1,N / N,N / ternaire (enseigner)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `ecole_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ecole_db`;

-- Table structure for table `etablissement`
CREATE TABLE `etablissement` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(255) NOT NULL,
  `adresse` TEXT NOT NULL,
  `telephone` VARCHAR(255),
  `email` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `classe`
CREATE TABLE `classe` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `etablissement_id` BIGINT NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `niveau` VARCHAR(50) NOT NULL,
  `annee_scolaire` VARCHAR(20) NOT NULL,
  `capacite` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`etablissement_id`) REFERENCES `etablissement`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `matiere`
CREATE TABLE `matiere` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(255) NOT NULL,
  `coefficient` DECIMAL(3, 1) NOT NULL,
  `couleur` VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `professeur`
CREATE TABLE `professeur` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `etablissement_id` BIGINT NOT NULL,
  `nom` VARCHAR(255) NOT NULL,
  `prenom` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `telephone` VARCHAR(255),
  `date_embauche` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`etablissement_id`) REFERENCES `etablissement`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `eleve`
CREATE TABLE `eleve` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `classe_id` BIGINT NOT NULL,
  `nom` VARCHAR(255) NOT NULL,
  `prenom` VARCHAR(255) NOT NULL,
  `date_naissance` DATE NOT NULL,
  `adresse` TEXT,
  `responsable_nom` VARCHAR(255) NOT NULL,
  `responsable_telephone` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  FOREIGN KEY (`classe_id`) REFERENCES `classe`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `salle`
CREATE TABLE `salle` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `etablissement_id` BIGINT NOT NULL,
  `numero` VARCHAR(20) NOT NULL,
  `capacite` INT NOT NULL,
  `equipement` TEXT,
  FOREIGN KEY (`etablissement_id`) REFERENCES `etablissement`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table associative ternaire : un professeur enseigne une matière à une classe
CREATE TABLE `enseigner` (
  `professeur_id` BIGINT NOT NULL,
  `matiere_id` BIGINT NOT NULL,
  `classe_id` BIGINT NOT NULL,
  `heures_semaine` INT NOT NULL,
  PRIMARY KEY (`professeur_id`, `matiere_id`, `classe_id`),
  FOREIGN KEY (`professeur_id`) REFERENCES `professeur`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`matiere_id`) REFERENCES `matiere`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`classe_id`) REFERENCES `classe`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table associative : notes (élève évalué dans une matière)
CREATE TABLE `note` (
  `eleve_id` BIGINT NOT NULL,
  `matiere_id` BIGINT NOT NULL,
  `valeur` DECIMAL(4, 2) NOT NULL,
  `date_evaluation` DATE NOT NULL,
  `type_evaluation` VARCHAR(100) NOT NULL,
  `commentaire` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`eleve_id`, `matiere_id`, `date_evaluation`),
  FOREIGN KEY (`eleve_id`) REFERENCES `eleve`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`matiere_id`) REFERENCES `matiere`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
