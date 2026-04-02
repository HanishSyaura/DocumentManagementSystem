-- CreateTable
CREATE TABLE `DocumentAssignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `documentId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `assignmentType` ENUM('REVIEW', 'FIRST_APPROVAL', 'SECOND_APPROVAL', 'ACKNOWLEDGMENT') NOT NULL,
    `assignedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,

    INDEX `DocumentAssignment_documentId_idx`(`documentId`),
    INDEX `DocumentAssignment_userId_idx`(`userId`),
    INDEX `DocumentAssignment_assignmentType_idx`(`assignmentType`),
    UNIQUE INDEX `DocumentAssignment_documentId_userId_assignmentType_key`(`documentId`, `userId`, `assignmentType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DocumentAssignment` ADD CONSTRAINT `DocumentAssignment_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `Document`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentAssignment` ADD CONSTRAINT `DocumentAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
