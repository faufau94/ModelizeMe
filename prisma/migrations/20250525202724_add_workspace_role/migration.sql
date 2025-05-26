/*
  Warnings:

  - You are about to drop the column `role` on the `workspacemember` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `workspacemember` DROP COLUMN `role`,
    ADD COLUMN `roleId` INTEGER NOT NULL DEFAULT 2;

-- CreateTable
CREATE TABLE `WorkspaceRole` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `WorkspaceRole_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WorkspaceMember` ADD CONSTRAINT `WorkspaceMember_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `WorkspaceRole`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
