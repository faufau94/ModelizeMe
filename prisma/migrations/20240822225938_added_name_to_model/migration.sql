/*
  Warnings:

  - Added the required column `name` to the `models` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `models` ADD COLUMN `name` VARCHAR(191) NOT NULL,
    MODIFY `content` JSON NULL;
