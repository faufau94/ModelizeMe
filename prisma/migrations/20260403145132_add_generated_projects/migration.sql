-- CreateTable
CREATE TABLE `generated_projects` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `framework` VARCHAR(50) NOT NULL,
    `orm` VARCHAR(50) NOT NULL,
    `database` VARCHAR(50) NOT NULL,
    `modelId` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `generated_projects_workspaceId_idx`(`workspaceId`),
    INDEX `generated_projects_modelId_idx`(`modelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `generated_projects` ADD CONSTRAINT `generated_projects_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `models`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `generated_projects` ADD CONSTRAINT `generated_projects_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `generated_projects` ADD CONSTRAINT `generated_projects_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
