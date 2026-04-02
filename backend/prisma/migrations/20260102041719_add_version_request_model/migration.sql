/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `projectCategory` on the `document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ApprovalHistory` MODIFY `action` ENUM('SUBMITTED', 'REVIEWED', 'FIRST_APPROVED', 'SECOND_APPROVED', 'READY_FOR_PUBLISH', 'PUBLISHED', 'REJECTED', 'ACKNOWLEDGED', 'RETURNED', 'SUPERSEDED', 'OBSOLETED', 'ARCHIVED', 'APPROVED') NOT NULL,
    MODIFY `stage` ENUM('DRAFT', 'REVIEW', 'FIRST_APPROVAL', 'SECOND_APPROVAL', 'READY_TO_PUBLISH', 'ACKNOWLEDGMENT', 'PUBLISHED', 'SUPERSEDED', 'OBSOLETE', 'APPROVAL') NOT NULL;

-- AlterTable
ALTER TABLE `Document` DROP COLUMN `approvedAt`,
    DROP COLUMN `approvedById`,
    DROP COLUMN `projectCategory`,
    ADD COLUMN `dateOfDocument` DATETIME(3) NULL,
    ADD COLUMN `firstApprovedAt` DATETIME(3) NULL,
    ADD COLUMN `firstApproverId` INTEGER NULL,
    ADD COLUMN `folderId` INTEGER NULL,
    ADD COLUMN `projectCategoryId` INTEGER NULL,
    ADD COLUMN `publishedById` INTEGER NULL,
    ADD COLUMN `secondApprovedAt` DATETIME(3) NULL,
    ADD COLUMN `secondApproverId` INTEGER NULL,
    MODIFY `status` ENUM('DRAFT', 'PENDING_REVIEW', 'IN_REVIEW', 'PENDING_FIRST_APPROVAL', 'IN_FIRST_APPROVAL', 'PENDING_SECOND_APPROVAL', 'IN_SECOND_APPROVAL', 'READY_TO_PUBLISH', 'PENDING_ACKNOWLEDGMENT', 'ACKNOWLEDGED', 'APPROVED', 'PUBLISHED', 'REJECTED', 'RETURNED', 'SUPERSEDED', 'OBSOLETE', 'ARCHIVED', 'PENDING_APPROVAL', 'IN_APPROVAL') NOT NULL DEFAULT 'DRAFT',
    MODIFY `stage` ENUM('DRAFT', 'REVIEW', 'FIRST_APPROVAL', 'SECOND_APPROVAL', 'READY_TO_PUBLISH', 'ACKNOWLEDGMENT', 'PUBLISHED', 'SUPERSEDED', 'OBSOLETE', 'APPROVAL') NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE `ProjectCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProjectCategory_name_key`(`name`),
    UNIQUE INDEX `ProjectCategory_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Folder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `parentId` INTEGER NULL,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Folder_parentId_idx`(`parentId`),
    INDEX `Folder_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VersionRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `documentId` INTEGER NOT NULL,
    `reasonForRevision` TEXT NOT NULL,
    `proposedChanges` TEXT NOT NULL,
    `targetDate` DATETIME(3) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'Normal',
    `remarks` TEXT NULL,
    `filePath` VARCHAR(191) NULL,
    `fileName` VARCHAR(191) NULL,
    `requestedById` INTEGER NOT NULL,
    `status` ENUM('PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL', 'IN_APPROVAL', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING_REVIEW',
    `stage` ENUM('REVIEW', 'APPROVAL', 'COMPLETED') NOT NULL DEFAULT 'REVIEW',
    `reviewedById` INTEGER NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewComments` TEXT NULL,
    `approvedById` INTEGER NULL,
    `approvedAt` DATETIME(3) NULL,
    `approvalComments` TEXT NULL,
    `rejectedById` INTEGER NULL,
    `rejectedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `newDocumentId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VersionRequest_documentId_idx`(`documentId`),
    INDEX `VersionRequest_status_idx`(`status`),
    INDEX `VersionRequest_requestedById_idx`(`requestedById`),
    INDEX `VersionRequest_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupersedeObsoleteRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `documentId` INTEGER NOT NULL,
    `actionType` ENUM('SUPERSEDE', 'OBSOLETE') NOT NULL,
    `supersedingDocId` INTEGER NULL,
    `reason` TEXT NOT NULL,
    `requestedById` INTEGER NOT NULL,
    `status` ENUM('PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL', 'IN_APPROVAL', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING_REVIEW',
    `stage` ENUM('REVIEW', 'APPROVAL', 'COMPLETED') NOT NULL DEFAULT 'REVIEW',
    `reviewedById` INTEGER NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewComments` TEXT NULL,
    `approvedById` INTEGER NULL,
    `approvedAt` DATETIME(3) NULL,
    `approvalComments` TEXT NULL,
    `rejectedById` INTEGER NULL,
    `rejectedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SupersedeObsoleteRequest_documentId_idx`(`documentId`),
    INDEX `SupersedeObsoleteRequest_status_idx`(`status`),
    INDEX `SupersedeObsoleteRequest_requestedById_idx`(`requestedById`),
    INDEX `SupersedeObsoleteRequest_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GeneratedReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportType` VARCHAR(191) NOT NULL,
    `reportName` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NULL,
    `format` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NULL,
    `status` ENUM('PENDING', 'GENERATING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `config` JSON NULL,
    `generatedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    INDEX `GeneratedReport_generatedById_idx`(`generatedById`),
    INDEX `GeneratedReport_reportType_idx`(`reportType`),
    INDEX `GeneratedReport_status_idx`(`status`),
    INDEX `GeneratedReport_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Backup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `size` BIGINT NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'completed',
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Backup_createdById_idx`(`createdById`),
    INDEX `Backup_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inquiry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL DEFAULT 'General Inquiry',
    `message` TEXT NOT NULL,
    `organizationType` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'new',
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `respondedAt` DATETIME(3) NULL,
    `respondedBy` INTEGER NULL,
    `notes` TEXT NULL,

    INDEX `Inquiry_email_idx`(`email`),
    INDEX `Inquiry_status_idx`(`status`),
    INDEX `Inquiry_submittedAt_idx`(`submittedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Document_projectCategoryId_idx` ON `Document`(`projectCategoryId`);

-- CreateIndex
CREATE INDEX `Document_folderId_idx` ON `Document`(`folderId`);

-- AddForeignKey
ALTER TABLE `Folder` ADD CONSTRAINT `Folder_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Folder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Folder` ADD CONSTRAINT `Folder_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_projectCategoryId_fkey` FOREIGN KEY (`projectCategoryId`) REFERENCES `ProjectCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersionRequest` ADD CONSTRAINT `VersionRequest_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersionRequest` ADD CONSTRAINT `VersionRequest_newDocumentId_fkey` FOREIGN KEY (`newDocumentId`) REFERENCES `Document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersionRequest` ADD CONSTRAINT `VersionRequest_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersionRequest` ADD CONSTRAINT `VersionRequest_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersionRequest` ADD CONSTRAINT `VersionRequest_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersionRequest` ADD CONSTRAINT `VersionRequest_rejectedById_fkey` FOREIGN KEY (`rejectedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupersedeObsoleteRequest` ADD CONSTRAINT `SupersedeObsoleteRequest_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupersedeObsoleteRequest` ADD CONSTRAINT `SupersedeObsoleteRequest_supersedingDocId_fkey` FOREIGN KEY (`supersedingDocId`) REFERENCES `Document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupersedeObsoleteRequest` ADD CONSTRAINT `SupersedeObsoleteRequest_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupersedeObsoleteRequest` ADD CONSTRAINT `SupersedeObsoleteRequest_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupersedeObsoleteRequest` ADD CONSTRAINT `SupersedeObsoleteRequest_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupersedeObsoleteRequest` ADD CONSTRAINT `SupersedeObsoleteRequest_rejectedById_fkey` FOREIGN KEY (`rejectedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GeneratedReport` ADD CONSTRAINT `GeneratedReport_generatedById_fkey` FOREIGN KEY (`generatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Backup` ADD CONSTRAINT `Backup_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
