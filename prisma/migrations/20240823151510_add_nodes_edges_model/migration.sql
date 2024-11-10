/*
  Warnings:

  - You are about to drop the column `content` on the `models` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `models` DROP COLUMN `content`,
    ADD COLUMN `edges` JSON NOT NULL,
    ADD COLUMN `nodes` JSON NOT NULL;
