/*
  Warnings:

  - The primary key for the `workspace` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `models` DROP FOREIGN KEY `models_workspaceId_fkey`;

-- DropForeignKey
ALTER TABLE `team` DROP FOREIGN KEY `Team_workspaceId_fkey`;

-- DropForeignKey
ALTER TABLE `workspacemember` DROP FOREIGN KEY `WorkspaceMember_workspaceId_fkey`;

-- DropIndex
DROP INDEX `models_workspaceId_fkey` ON `models`;

-- DropIndex
DROP INDEX `Team_workspaceId_fkey` ON `team`;

-- DropIndex
DROP INDEX `WorkspaceMember_workspaceId_fkey` ON `workspacemember`;

-- AlterTable
ALTER TABLE `models` MODIFY `workspaceId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `team` MODIFY `workspaceId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `workspace` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `workspacemember` MODIFY `workspaceId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `WorkspaceMember` ADD CONSTRAINT `WorkspaceMember_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Team` ADD CONSTRAINT `Team_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `models` ADD CONSTRAINT `models_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
