-- MySQL Database Schema
-- Modèle : Plateforme E-Commerce
-- Relations : 1,N / N,N / ternaire (commander)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `ecommerce_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ecommerce_db`;

-- Table structure for table `categorie`
CREATE TABLE `categorie` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `parent_id` BIGINT,
  `nom` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `image_url` VARCHAR(255),
  FOREIGN KEY (`parent_id`) REFERENCES `categorie`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `client`
CREATE TABLE `client` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(255) NOT NULL,
  `prenom` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `telephone` VARCHAR(255),
  `adresse` TEXT,
  `ville` VARCHAR(255),
  `code_postal` VARCHAR(20),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `produit`
CREATE TABLE `produit` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `categorie_id` BIGINT NOT NULL,
  `nom` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `prix` DECIMAL(10, 2) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `image_url` VARCHAR(255),
  `actif` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`categorie_id`) REFERENCES `categorie`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `commande`
CREATE TABLE `commande` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `client_id` BIGINT NOT NULL,
  `date_commande` DATETIME NOT NULL,
  `statut` VARCHAR(255) NOT NULL,
  `total` DECIMAL(10, 2) NOT NULL,
  `adresse_livraison` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_id`) REFERENCES `client`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `paiement`
CREATE TABLE `paiement` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `commande_id` BIGINT NOT NULL,
  `montant` DECIMAL(10, 2) NOT NULL,
  `methode` VARCHAR(255) NOT NULL,
  `statut` VARCHAR(255) NOT NULL,
  `date_paiement` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`commande_id`) REFERENCES `commande`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `avis`
CREATE TABLE `avis` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `client_id` BIGINT NOT NULL,
  `produit_id` BIGINT NOT NULL,
  `note` INT NOT NULL,
  `commentaire` TEXT,
  `date_avis` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_id`) REFERENCES `client`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`produit_id`) REFERENCES `produit`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table associative : lignes de commande (commande contient des produits)
CREATE TABLE `ligne_commande` (
  `commande_id` BIGINT NOT NULL,
  `produit_id` BIGINT NOT NULL,
  `quantite` INT NOT NULL,
  `prix_unitaire` DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (`commande_id`, `produit_id`),
  FOREIGN KEY (`commande_id`) REFERENCES `commande`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`produit_id`) REFERENCES `produit`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
