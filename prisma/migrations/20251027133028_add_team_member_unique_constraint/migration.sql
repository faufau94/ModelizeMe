/*
  Warnings:

  - A unique constraint covering the columns `[teamId,userId]` on the table `teamMember` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `teamMember_teamId_userId_key` ON `teamMember`(`teamId`, `userId`);
