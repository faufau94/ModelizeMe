-- AlterTable
ALTER TABLE `models` MODIFY `type` ENUM('MCD', 'MLD', 'MPD') NOT NULL DEFAULT 'MCD';
