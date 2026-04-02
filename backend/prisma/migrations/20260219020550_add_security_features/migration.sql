-- AlterTable
ALTER TABLE `DocumentVersion` ADD COLUMN `isEncrypted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `twoFactorCode` VARCHAR(191) NULL,
    ADD COLUMN `twoFactorCodeExpiry` DATETIME(3) NULL,
    ADD COLUMN `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false;
