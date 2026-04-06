-- MySQL Database Schema
-- Modèle : Gestion Hospitalière
-- Relations : 1,N / N,N / réflexive / ternaire (soigner)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `hopital_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hopital_db`;

-- Table structure for table `service`
CREATE TABLE `service` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(255) NOT NULL,
  `etage` INT,
  `capacite` INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `medecin`
CREATE TABLE `medecin` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `service_id` BIGINT NOT NULL,
  `chef_id` BIGINT,
  `nom` VARCHAR(255) NOT NULL,
  `prenom` VARCHAR(255) NOT NULL,
  `specialite` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `telephone` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`service_id`) REFERENCES `service`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`chef_id`) REFERENCES `medecin`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `patient`
CREATE TABLE `patient` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(255) NOT NULL,
  `prenom` VARCHAR(255) NOT NULL,
  `date_naissance` DATE NOT NULL,
  `sexe` VARCHAR(10) NOT NULL,
  `numero_secu` VARCHAR(255) NOT NULL,
  `telephone` VARCHAR(255),
  `adresse` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `chambre`
CREATE TABLE `chambre` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `service_id` BIGINT NOT NULL,
  `numero` VARCHAR(20) NOT NULL,
  `nb_lits` INT NOT NULL,
  `equipement` TEXT,
  FOREIGN KEY (`service_id`) REFERENCES `service`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `medicament`
CREATE TABLE `medicament` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(255) NOT NULL,
  `dosage` VARCHAR(255) NOT NULL,
  `forme` VARCHAR(255) NOT NULL,
  `prix` DECIMAL(10, 2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `hospitalisation`
CREATE TABLE `hospitalisation` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` BIGINT NOT NULL,
  `chambre_id` BIGINT NOT NULL,
  `date_entree` DATETIME NOT NULL,
  `date_sortie` DATETIME,
  `motif` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`patient_id`) REFERENCES `patient`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`chambre_id`) REFERENCES `chambre`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `consultation`
CREATE TABLE `consultation` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `medecin_id` BIGINT NOT NULL,
  `patient_id` BIGINT NOT NULL,
  `date_consultation` DATETIME NOT NULL,
  `diagnostic` TEXT,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`medecin_id`) REFERENCES `medecin`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`patient_id`) REFERENCES `patient`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table associative ternaire : prescription (consultation + médicament)
CREATE TABLE `prescription` (
  `consultation_id` BIGINT NOT NULL,
  `medicament_id` BIGINT NOT NULL,
  `posologie` VARCHAR(255) NOT NULL,
  `duree_jours` INT NOT NULL,
  `quantite` INT NOT NULL,
  PRIMARY KEY (`consultation_id`, `medicament_id`),
  FOREIGN KEY (`consultation_id`) REFERENCES `consultation`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`medicament_id`) REFERENCES `medicament`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
