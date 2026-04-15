ALTER TABLE `Folder`
  ADD COLUMN `accessMode` VARCHAR(191) NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN `inheritPermissions` BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE `FolderPermission` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `folderId` INTEGER NOT NULL,
  `userId` INTEGER NULL,
  `roleId` INTEGER NULL,
  `canView` BOOLEAN NOT NULL DEFAULT false,
  `canCreate` BOOLEAN NOT NULL DEFAULT false,
  `canEdit` BOOLEAN NOT NULL DEFAULT false,
  `canDelete` BOOLEAN NOT NULL DEFAULT false,
  `canDownload` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `FolderPermission_folderId_userId_key`(`folderId`, `userId`),
  UNIQUE INDEX `FolderPermission_folderId_roleId_key`(`folderId`, `roleId`),
  INDEX `FolderPermission_folderId_idx`(`folderId`),
  INDEX `FolderPermission_userId_idx`(`userId`),
  INDEX `FolderPermission_roleId_idx`(`roleId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `FolderPermission` ADD CONSTRAINT `FolderPermission_folderId_fkey`
  FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `FolderPermission` ADD CONSTRAINT `FolderPermission_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `FolderPermission` ADD CONSTRAINT `FolderPermission_roleId_fkey`
  FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
