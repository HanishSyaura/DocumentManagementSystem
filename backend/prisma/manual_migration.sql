-- Manual Migration for ProjectCategory
-- Run this SQL directly in your MySQL database

-- Step 1: Create ProjectCategory table
CREATE TABLE IF NOT EXISTS `ProjectCategory` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ProjectCategory_name_key`(`name`),
  UNIQUE INDEX `ProjectCategory_code_key`(`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Seed initial project categories
INSERT INTO `ProjectCategory` (`name`, `code`, `description`, `isActive`, `createdAt`, `updatedAt`) VALUES
('Internal', 'INT', 'Internal company projects and documents', 1, NOW(3), NOW(3)),
('External', 'EXT', 'External client projects', 1, NOW(3), NOW(3)),
('Client Project', 'CLIENT', 'Client-specific projects and deliverables', 1, NOW(3), NOW(3)),
('Research & Development', 'RND', 'R&D initiatives and experiments', 1, NOW(3), NOW(3)),
('Infrastructure', 'INFRA', 'Infrastructure and IT projects', 1, NOW(3), NOW(3)),
('Compliance', 'COMP', 'Regulatory compliance projects', 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `updatedAt` = NOW(3);

-- Step 3: Check if Document table exists and add projectCategoryId if needed
SET @dbname = DATABASE();
SET @tablename = 'Document';
SET @columnname = 'projectCategoryId';

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE `Document` ADD COLUMN `projectCategoryId` INT NULL AFTER `documentTypeId`'
));

PREPARE addColumnIfNotExists FROM @preparedStatement;
EXECUTE addColumnIfNotExists;
DEALLOCATE PREPARE addColumnIfNotExists;

-- Step 4: Migrate existing data from projectCategory string to projectCategoryId
UPDATE `Document` d
LEFT JOIN `ProjectCategory` pc ON d.`projectCategory` = pc.`name`
SET d.`projectCategoryId` = pc.`id`
WHERE d.`projectCategory` IS NOT NULL AND d.`projectCategoryId` IS NULL;

-- Step 5: Add foreign key constraint if it doesn't exist
SET @fk_exists = (SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Document' 
  AND CONSTRAINT_NAME = 'Document_projectCategoryId_fkey'
);

SET @preparedStatement = IF(@fk_exists = 0,
  'ALTER TABLE `Document` 
   ADD CONSTRAINT `Document_projectCategoryId_fkey` 
   FOREIGN KEY (`projectCategoryId`) 
   REFERENCES `ProjectCategory`(`id`) 
   ON DELETE SET NULL 
   ON UPDATE CASCADE',
  'SELECT 1'
);

PREPARE addFkIfNotExists FROM @preparedStatement;
EXECUTE addFkIfNotExists;
DEALLOCATE PREPARE addFkIfNotExists;

-- Step 6: Add index for performance if it doesn't exist
SET @index_exists = (SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Document' 
  AND INDEX_NAME = 'Document_projectCategoryId_idx'
);

SET @preparedStatement = IF(@index_exists = 0,
  'CREATE INDEX `Document_projectCategoryId_idx` ON `Document`(`projectCategoryId`)',
  'SELECT 1'
);

PREPARE addIndexIfNotExists FROM @preparedStatement;
EXECUTE addIndexIfNotExists;
DEALLOCATE PREPARE addIndexIfNotExists;

-- Verify tables
SELECT 'ProjectCategory table created and seeded' AS Status;
SELECT COUNT(*) AS ProjectCategoryCount FROM `ProjectCategory`;

-- Seed Document Types (they should already exist, but let's ensure)
INSERT INTO `DocumentType` (`name`, `prefix`, `description`, `isActive`, `createdAt`, `updatedAt`) VALUES
('Minutes of Meeting', 'MoM', 'Meeting minutes and records', 1, NOW(3), NOW(3)),
('Project Plan', 'PP', 'Project planning documents', 1, NOW(3), NOW(3)),
('Requirement Analysis', 'RA', 'System and project requirements', 1, NOW(3), NOW(3)),
('Design Document', 'DD', 'Technical design specifications', 1, NOW(3), NOW(3)),
('Standard Operating Procedure', 'SOP', 'Operational procedures and guidelines', 1, NOW(3), NOW(3)),
('Policy Document', 'POL', 'Company policies and regulations', 1, NOW(3), NOW(3)),
('User Manual', 'MAN', 'User guides and documentation', 1, NOW(3), NOW(3)),
('Business Case', 'BC', 'Business justification documents', 1, NOW(3), NOW(3)),
('Work Breakdown Structure', 'WBS', 'Project work breakdown', 1, NOW(3), NOW(3)),
('Risk Management Plan', 'RMP', 'Risk assessment and mitigation plans', 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `updatedAt` = NOW(3);

SELECT 'Document types seeded' AS Status;
SELECT COUNT(*) AS DocumentTypeCount FROM `DocumentType`;
