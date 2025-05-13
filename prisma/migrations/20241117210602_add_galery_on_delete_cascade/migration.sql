-- DropForeignKey
ALTER TABLE `galeries` DROP FOREIGN KEY `galeries_modelId_fkey`;

-- AddForeignKey
ALTER TABLE `galeries` ADD CONSTRAINT `galeries_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `models`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
