/*
  Warnings:

  - You are about to drop the column `content` on the `model` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `model` DROP COLUMN `content`,
    ADD COLUMN `edges` JSON NOT NULL,
    ADD COLUMN `nodes` JSON NOT NULL;
