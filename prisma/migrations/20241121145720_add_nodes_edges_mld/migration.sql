-- AlterTable
ALTER TABLE `models` ADD COLUMN `edges_mld` JSON NOT NULL,
    ADD COLUMN `nodes_mld` JSON NOT NULL;
