-- AlterTable
ALTER TABLE `team` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `maxMembers` INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE `workspacemember` MODIFY `roleId` INTEGER NOT NULL DEFAULT 3;
