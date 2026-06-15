-- CreateTable
CREATE TABLE `DocumentEpcRegistryRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `documentId` INTEGER NOT NULL,
    `documentVersionId` INTEGER NOT NULL,
    `fileCode` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `epcScheme` VARCHAR(191) NOT NULL DEFAULT 'SGTIN-96',
    `epcHex` VARCHAR(191) NOT NULL,
    `filter` INTEGER NOT NULL,
    `companyPrefixDigits` INTEGER NOT NULL,
    `companyPrefix` VARCHAR(191) NOT NULL,
    `itemReference` VARCHAR(191) NOT NULL,
    `serial` VARCHAR(191) NOT NULL,
    `tagUri` VARCHAR(191) NOT NULL,
    `pureIdentityUri` VARCHAR(191) NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DocumentEpcRegistryRecord_documentVersionId_key`(`documentVersionId`),
    UNIQUE INDEX `DocumentEpcRegistryRecord_epcHex_key`(`epcHex`),
    INDEX `DocumentEpcRegistryRecord_generatedAt_idx`(`generatedAt`),
    INDEX `DocumentEpcRegistryRecord_fileCode_idx`(`fileCode`),
    INDEX `DocumentEpcRegistryRecord_documentId_idx`(`documentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DocumentEpcRegistryRecord` ADD CONSTRAINT `DocumentEpcRegistryRecord_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentEpcRegistryRecord` ADD CONSTRAINT `DocumentEpcRegistryRecord_documentVersionId_fkey` FOREIGN KEY (`documentVersionId`) REFERENCES `DocumentVersion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
