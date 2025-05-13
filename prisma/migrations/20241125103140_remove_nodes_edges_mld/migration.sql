/*
  Warnings:

  - You are about to drop the column `edges_mld` on the `models` table. All the data in the column will be lost.
  - You are about to drop the column `nodes_mld` on the `models` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `models` DROP COLUMN `edges_mld`,
    DROP COLUMN `nodes_mld`;
