-- CreateTable
CREATE TABLE `TemplateRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requestType` ENUM('NEW', 'UPDATE') NOT NULL,
    `status` ENUM('PENDING', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `documentTypeId` INTEGER NULL,
    `documentTypeName` VARCHAR(191) NULL,
    `templateId` INTEGER NULL,
    `templateName` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `requestedById` INTEGER NOT NULL,
    `resolvedById` INTEGER NULL,
    `resolvedAt` DATETIME(3) NULL,
    `resolutionNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TemplateRequest_status_idx`(`status`),
    INDEX `TemplateRequest_documentTypeId_idx`(`documentTypeId`),
    INDEX `TemplateRequest_templateId_idx`(`templateId`),
    INDEX `TemplateRequest_requestedById_idx`(`requestedById`),
    INDEX `TemplateRequest_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TemplateRequest` ADD CONSTRAINT `TemplateRequest_documentTypeId_fkey` FOREIGN KEY (`documentTypeId`) REFERENCES `DocumentType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TemplateRequest` ADD CONSTRAINT `TemplateRequest_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `Template`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TemplateRequest` ADD CONSTRAINT `TemplateRequest_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TemplateRequest` ADD CONSTRAINT `TemplateRequest_resolvedById_fkey` FOREIGN KEY (`resolvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

