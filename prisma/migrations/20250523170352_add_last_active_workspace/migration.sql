-- AlterTable
ALTER TABLE `users` ADD COLUMN `lastActiveWorkspaceId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_lastActiveWorkspaceId_fkey` FOREIGN KEY (`lastActiveWorkspaceId`) REFERENCES `Workspace`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
