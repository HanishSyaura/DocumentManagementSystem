-- CreateTable
CREATE TABLE `CodeRegistry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fileCode` VARCHAR(191) NOT NULL,
    `normalizedFileCode` VARCHAR(191) NOT NULL,
    `projectCategoryId` INTEGER NOT NULL,
    `documentTypeId` INTEGER NULL,
    `codeKey` VARCHAR(191) NOT NULL,
    `runningNumber` INTEGER NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'SYSTEM',
    `sourceRefId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CodeRegistry_fileCode_key`(`fileCode`),
    UNIQUE INDEX `CodeRegistry_projectCategoryId_codeKey_runningNumber_key`(`projectCategoryId`, `codeKey`, `runningNumber`),
    INDEX `CodeRegistry_projectCategoryId_codeKey_idx`(`projectCategoryId`, `codeKey`),
    INDEX `CodeRegistry_fileCode_idx`(`fileCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CodeRegistry` ADD CONSTRAINT `CodeRegistry_projectCategoryId_fkey` FOREIGN KEY (`projectCategoryId`) REFERENCES `ProjectCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CodeRegistry` ADD CONSTRAINT `CodeRegistry_documentTypeId_fkey` FOREIGN KEY (`documentTypeId`) REFERENCES `DocumentType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
