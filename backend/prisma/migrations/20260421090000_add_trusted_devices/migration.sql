-- Add trusted device table for 2FA "remember this device" support
CREATE TABLE `TrustedDevice` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `tokenHash` VARCHAR(128) NOT NULL,
  `userAgent` TEXT NULL,
  `ipAddress` VARCHAR(191) NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `lastUsedAt` DATETIME(3) NULL,
  `revokedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `TrustedDevice_tokenHash_key` (`tokenHash`),
  INDEX `TrustedDevice_userId_idx` (`userId`),
  INDEX `TrustedDevice_expiresAt_idx` (`expiresAt`),
  INDEX `TrustedDevice_revokedAt_idx` (`revokedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `TrustedDevice`
  ADD CONSTRAINT `TrustedDevice_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

