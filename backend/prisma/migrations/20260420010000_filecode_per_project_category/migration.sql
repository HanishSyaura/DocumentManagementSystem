SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'Document'
        AND index_name = 'Document_fileCode_key') > 0,
    'ALTER TABLE `Document` DROP INDEX `Document_fileCode_key`;',
    'SELECT 1;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'Document'
        AND index_name = 'Document_fileCode_projectCategoryId_key') = 0,
    'CREATE UNIQUE INDEX `Document_fileCode_projectCategoryId_key` ON `Document`(`fileCode`, `projectCategoryId`);',
    'SELECT 1;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'CodeRegistry'
        AND index_name = 'CodeRegistry_fileCode_key') > 0,
    'ALTER TABLE `CodeRegistry` DROP INDEX `CodeRegistry_fileCode_key`;',
    'SELECT 1;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'CodeRegistry'
        AND index_name = 'CodeRegistry_fileCode_projectCategoryId_key') = 0,
    'CREATE UNIQUE INDEX `CodeRegistry_fileCode_projectCategoryId_key` ON `CodeRegistry`(`fileCode`, `projectCategoryId`);',
    'SELECT 1;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'DocumentRegister'
        AND column_name = 'projectCategoryId') = 0,
    'ALTER TABLE `DocumentRegister` ADD COLUMN `projectCategoryId` INTEGER NULL;',
    'SELECT 1;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'DocumentRegister'
        AND index_name = 'DocumentRegister_fileCode_key') > 0,
    'ALTER TABLE `DocumentRegister` DROP INDEX `DocumentRegister_fileCode_key`;',
    'SELECT 1;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'DocumentRegister'
        AND index_name = 'DocumentRegister_fileCode_projectCategoryId_key') = 0,
    'CREATE UNIQUE INDEX `DocumentRegister_fileCode_projectCategoryId_key` ON `DocumentRegister`(`fileCode`, `projectCategoryId`);',
    'SELECT 1;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'DocumentRegister'
        AND index_name = 'DocumentRegister_projectCategoryId_idx') = 0,
    'CREATE INDEX `DocumentRegister_projectCategoryId_idx` ON `DocumentRegister`(`projectCategoryId`);',
    'SELECT 1;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
