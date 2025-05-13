-- DropForeignKey
ALTER TABLE `linked_accounts` DROP FOREIGN KEY `linked_accounts_userId_fkey`;

-- DropForeignKey
ALTER TABLE `models` DROP FOREIGN KEY `models_userId_fkey`;

-- AlterTable
ALTER TABLE `models` ADD COLUMN `reference` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `models` ADD CONSTRAINT `models_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `linked_accounts` ADD CONSTRAINT `linked_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
