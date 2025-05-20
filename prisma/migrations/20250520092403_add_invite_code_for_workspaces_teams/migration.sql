/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[inviteCode]` on the table `Workspace` will be added. If there are existing duplicate values, this will fail.
  - The required column `inviteCode` was added to the `Team` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `inviteCode` was added to the `Workspace` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE `team` ADD COLUMN `inviteCode` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `workspace` ADD COLUMN `inviteCode` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Team_inviteCode_key` ON `Team`(`inviteCode`);

-- CreateIndex
CREATE UNIQUE INDEX `Workspace_inviteCode_key` ON `Workspace`(`inviteCode`);
