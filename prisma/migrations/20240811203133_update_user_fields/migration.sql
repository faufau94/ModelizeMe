-- AlterTable
ALTER TABLE `users` ADD COLUMN `image` VARCHAR(191) NULL,
    ADD COLUMN `provider` VARCHAR(191) NULL,
    ADD COLUMN `providerAccountId` VARCHAR(191) NULL;
