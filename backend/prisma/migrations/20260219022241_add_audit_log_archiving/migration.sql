-- AlterTable
ALTER TABLE `AuditLog` ADD COLUMN `isArchived` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `AuditLog_isArchived_idx` ON `AuditLog`(`isArchived`);
