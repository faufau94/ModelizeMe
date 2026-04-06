-- CreateTable
CREATE TABLE `model_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `modelId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(64) NOT NULL,
    `payload` JSON NOT NULL,
    `inverse` JSON NULL,
    `userId` VARCHAR(191) NULL,
    `sessionId` VARCHAR(128) NULL,
    `undoable` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `model_events_modelId_id_idx`(`modelId`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `model_snapshots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `modelId` VARCHAR(191) NOT NULL,
    `nodes` JSON NOT NULL,
    `edges` JSON NOT NULL,
    `eventCursor` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `model_snapshots_modelId_eventCursor_idx`(`modelId`, `eventCursor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `member_organizationId_userId_idx` ON `member`(`organizationId`, `userId`);

-- CreateIndex
CREATE INDEX `models_workspaceId_teamId_idx` ON `models`(`workspaceId`, `teamId`);

-- AddForeignKey
ALTER TABLE `model_events` ADD CONSTRAINT `model_events_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `models`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_events` ADD CONSTRAINT `model_events_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_snapshots` ADD CONSTRAINT `model_snapshots_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `models`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `invitation` RENAME INDEX `invitation_inviterId_fkey` TO `invitation_inviterId_idx`;

-- RenameIndex
ALTER TABLE `invitation` RENAME INDEX `invitation_organizationId_fkey` TO `invitation_organizationId_idx`;

-- RenameIndex
ALTER TABLE `models` RENAME INDEX `models_authorId_fkey` TO `models_authorId_idx`;

-- RenameIndex
ALTER TABLE `session` RENAME INDEX `session_userId_fkey` TO `session_userId_idx`;

-- RenameIndex
ALTER TABLE `team` RENAME INDEX `team_organizationId_fkey` TO `team_organizationId_idx`;
