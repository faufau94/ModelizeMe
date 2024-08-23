-- AlterTable
ALTER TABLE `model` MODIFY `type` ENUM('MCD', 'MLD', 'MPD') NOT NULL DEFAULT 'MCD';
