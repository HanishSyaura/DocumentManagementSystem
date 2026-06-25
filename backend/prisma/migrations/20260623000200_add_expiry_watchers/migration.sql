-- CreateTable
CREATE TABLE `DocumentExpiryWatcher` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `expiryProfileId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DEW_profile_user_key`(`expiryProfileId`, `userId`),
    INDEX `DocumentExpiryWatcher_expiryProfileId_idx`(`expiryProfileId`),
    INDEX `DocumentExpiryWatcher_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DocumentExpiryWatcher`
    ADD CONSTRAINT `DocumentExpiryWatcher_expiryProfileId_fkey`
    FOREIGN KEY (`expiryProfileId`) REFERENCES `DocumentExpiryProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentExpiryWatcher`
    ADD CONSTRAINT `DocumentExpiryWatcher_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

