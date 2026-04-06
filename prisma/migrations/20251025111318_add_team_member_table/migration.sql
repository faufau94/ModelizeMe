/*
  Warnings:

  - You are about to drop the column `teamId` on the `member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `member` DROP COLUMN `teamId`;

-- AlterTable
ALTER TABLE `session` ADD COLUMN `activeTeamId` TEXT NULL;

-- CreateTable
CREATE TABLE `teamMember` (
    `id` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `teamMember` ADD CONSTRAINT `teamMember_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teamMember` ADD CONSTRAINT `teamMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
