ALTER TABLE `CodeRegistry`
  ADD COLUMN `documentTitle` VARCHAR(191) NULL,
  ADD COLUMN `documentDate` DATETIME(3) NULL,
  ADD COLUMN `registryStatus` VARCHAR(191) NULL,
  ADD COLUMN `revision` VARCHAR(191) NULL;
