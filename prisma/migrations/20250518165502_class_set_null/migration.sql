-- DropForeignKey
ALTER TABLE `class` DROP FOREIGN KEY `Class_ownerId_fkey`;

-- AlterTable
ALTER TABLE `class` MODIFY `ownerId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Class` ADD CONSTRAINT `Class_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
