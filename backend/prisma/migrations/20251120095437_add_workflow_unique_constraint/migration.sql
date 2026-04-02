/*
  Warnings:

  - A unique constraint covering the columns `[documentTypeId]` on the table `Workflow` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Workflow_documentTypeId_key` ON `Workflow`(`documentTypeId`);
