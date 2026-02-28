-- Maria Della Strada Columbarium Database Schema
-- Import this file via http://localhost/phpmyadmin

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Create Database
CREATE DATABASE IF NOT EXISTS `columbarium_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `columbarium_db`;

-- Table structure for `niches`
CREATE TABLE IF NOT EXISTS `niches` (
  `id` varchar(50) NOT NULL,
  `section` varchar(100) NOT NULL,
  `row` int(11) NOT NULL,
  `col` int(11) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'AVAILABLE',
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `records`
CREATE TABLE IF NOT EXISTS `records` (
  `id` varchar(50) NOT NULL,
  `nicheId` varchar(50) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `dateOfBirth` date NOT NULL,
  `dateOfDeath` date NOT NULL,
  `intermentDate` date NOT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `nicheId` (`nicheId`),
  CONSTRAINT `fk_record_niche` FOREIGN KEY (`nicheId`) REFERENCES `niches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `reservations`
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` varchar(50) NOT NULL,
  `nicheId` varchar(50) NOT NULL,
  `reservedBy` varchar(150) NOT NULL,
  `contactNumber` varchar(50) NOT NULL,
  `reservationDate` date NOT NULL,
  `status` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `nicheId` (`nicheId`),
  CONSTRAINT `fk_reservation_niche` FOREIGN KEY (`nicheId`) REFERENCES `niches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;
