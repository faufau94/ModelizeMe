/*
  Warnings:

  - The primary key for the `annotations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `categories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `galeries` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `models` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `annotations` DROP FOREIGN KEY `annotations_modelId_fkey`;

-- DropForeignKey
ALTER TABLE `galeries` DROP FOREIGN KEY `galeries_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `galeries` DROP FOREIGN KEY `galeries_modelId_fkey`;

-- DropIndex
DROP INDEX `annotations_modelId_fkey` ON `annotations`;

-- DropIndex
DROP INDEX `galeries_categoryId_fkey` ON `galeries`;

-- DropIndex
DROP INDEX `galeries_modelId_fkey` ON `galeries`;

-- AlterTable
ALTER TABLE `annotations` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `modelId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `categories` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `galeries` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `modelId` VARCHAR(191) NOT NULL,
    MODIFY `categoryId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `models` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `galeries` ADD CONSTRAINT `galeries_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `models`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `galeries` ADD CONSTRAINT `galeries_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `annotations` ADD CONSTRAINT `annotations_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `models`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
