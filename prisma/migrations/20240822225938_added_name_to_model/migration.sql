/*
  Warnings:

  - Added the required column `name` to the `Model` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `model` ADD COLUMN `name` VARCHAR(191) NOT NULL,
    MODIFY `content` JSON NULL;
