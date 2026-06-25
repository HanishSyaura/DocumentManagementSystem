-- AlterTable
ALTER TABLE `DocumentType`
    ADD COLUMN `requiresExpiryTracking` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `allowRenewal` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Notification`
    MODIFY `type` ENUM(
        'DOCUMENT_ASSIGNED',
        'REVIEW_REQUIRED',
        'APPROVAL_REQUIRED',
        'ACKNOWLEDGMENT_REQUIRED',
        'STATUS_CHANGED',
        'DOCUMENT_APPROVED',
        'DOCUMENT_REJECTED',
        'DOCUMENT_RETURNED',
        'VERSION_UPDATE',
        'DOCUMENT_EXPIRING',
        'DOCUMENT_EXPIRED',
        'RENEWAL_IN_PROGRESS',
        'RENEWAL_COMPLETED',
        'SYSTEM_ALERT'
    ) NOT NULL;

-- CreateTable
CREATE TABLE `DocumentExpiryProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `documentId` INTEGER NOT NULL,
    `trackingEnabled` BOOLEAN NOT NULL DEFAULT true,
    `startDate` DATETIME(3) NULL,
    `expiryDate` DATETIME(3) NULL,
    `expiryStatus` ENUM('ACTIVE', 'EXPIRING_SOON', 'EXPIRING_TODAY', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `renewalStatus` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'NOT_STARTED',
    `expiringSoonDays` INTEGER NULL,
    `reminder1Days` INTEGER NULL,
    `reminder2Days` INTEGER NULL,
    `reminder3Days` INTEGER NULL,
    `reminder4Days` INTEGER NULL,
    `lastReminder1SentAt` DATETIME(3) NULL,
    `lastReminder2SentAt` DATETIME(3) NULL,
    `lastReminder3SentAt` DATETIME(3) NULL,
    `lastReminder4SentAt` DATETIME(3) NULL,
    `remarks` LONGTEXT NULL,
    `companySnapshot` VARCHAR(191) NULL,
    `departmentSnapshot` VARCHAR(191) NULL,
    `folderSnapshotName` VARCHAR(191) NULL,
    `currentVersionSnapshot` VARCHAR(191) NULL,
    `trackingDisabledAt` DATETIME(3) NULL,
    `trackingDisabledBy` INTEGER NULL,
    `trackingDisabledReason` LONGTEXT NULL,
    `createdBy` INTEGER NULL,
    `updatedBy` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DocumentExpiryProfile_documentId_key`(`documentId`),
    INDEX `DocumentExpiryProfile_expiryStatus_idx`(`expiryStatus`),
    INDEX `DocumentExpiryProfile_renewalStatus_idx`(`renewalStatus`),
    INDEX `DocumentExpiryProfile_trackingEnabled_idx`(`trackingEnabled`),
    INDEX `DocumentExpiryProfile_expiryDate_idx`(`expiryDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentExpiryRenewalHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `documentId` INTEGER NOT NULL,
    `expiryProfileId` INTEGER NOT NULL,
    `documentVersionId` INTEGER NULL,
    `fromVersion` VARCHAR(191) NULL,
    `toVersion` VARCHAR(191) NULL,
    `previousExpiryDate` DATETIME(3) NULL,
    `newExpiryDate` DATETIME(3) NULL,
    `renewalStatusBefore` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED') NULL,
    `renewalStatusAfter` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED') NULL,
    `remarks` LONGTEXT NULL,
    `renewedBy` INTEGER NULL,
    `renewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DocumentExpiryRenewalHistory_documentId_idx`(`documentId`),
    INDEX `DocumentExpiryRenewalHistory_expiryProfileId_idx`(`expiryProfileId`),
    INDEX `DocumentExpiryRenewalHistory_renewedAt_idx`(`renewedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DocumentExpiryProfile`
    ADD CONSTRAINT `DocumentExpiryProfile_documentId_fkey`
    FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentExpiryRenewalHistory`
    ADD CONSTRAINT `DocumentExpiryRenewalHistory_documentId_fkey`
    FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentExpiryRenewalHistory`
    ADD CONSTRAINT `DocumentExpiryRenewalHistory_expiryProfileId_fkey`
    FOREIGN KEY (`expiryProfileId`) REFERENCES `DocumentExpiryProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentExpiryRenewalHistory`
    ADD CONSTRAINT `DocumentExpiryRenewalHistory_documentVersionId_fkey`
    FOREIGN KEY (`documentVersionId`) REFERENCES `DocumentVersion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
