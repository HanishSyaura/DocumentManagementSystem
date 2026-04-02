# Master Data Management Migration Instructions

## Overview
This migration adds the ProjectCategory model and updates the Document model to use a foreign key relationship instead of a plain string field.

## Migration Steps

### 1. Create the Migration SQL

Run the following SQL commands in your MySQL database:

```sql
-- Step 1: Create ProjectCategory table
CREATE TABLE IF NOT EXISTS `ProjectCategory` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
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

-- Step 3: Add new projectCategoryId column to Document table
ALTER TABLE `Document` ADD COLUMN `projectCategoryId` INT NULL AFTER `documentTypeId`;

-- Step 4: Migrate existing data from projectCategory (string) to projectCategoryId (foreign key)
-- This maps existing string values to the new ProjectCategory IDs
UPDATE `Document` d
LEFT JOIN `ProjectCategory` pc ON d.`projectCategory` = pc.`name`
SET d.`projectCategoryId` = pc.`id`
WHERE d.`projectCategory` IS NOT NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE `Document` 
ADD CONSTRAINT `Document_projectCategoryId_fkey` 
FOREIGN KEY (`projectCategoryId`) 
REFERENCES `ProjectCategory`(`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Step 6: Add index for performance
CREATE INDEX `Document_projectCategoryId_idx` ON `Document`(`projectCategoryId`);

-- Step 7: (Optional) Drop old projectCategory string column after verifying data migration
-- IMPORTANT: Only run this after confirming all data has been migrated correctly
-- ALTER TABLE `Document` DROP COLUMN `projectCategory`;
```

### 2. Seed Document Types

Run the seed script to populate document types:

```bash
cd backend
node prisma/seeds/masterData.js
```

Or run it from PowerShell:
```powershell
cd D:\Project\DMS\backend
node prisma/seeds/masterData.js
```

### 3. Verify the Migration

After running the migration, verify:

1. **Check ProjectCategory table**:
```sql
SELECT * FROM ProjectCategory;
```

2. **Check Document table has projectCategoryId**:
```sql
DESCRIBE Document;
```

3. **Verify data migration** (if you have existing documents):
```sql
SELECT id, title, projectCategory, projectCategoryId FROM Document LIMIT 10;
```

### 4. Alternative: Using Prisma Migrate

If you want to use Prisma's migration tool instead:

```bash
cd D:\Project\DMS\backend

# Reset migrations if there are issues (WARNING: This will delete all data!)
# npx prisma migrate reset

# Create and apply the migration
npx prisma migrate dev --name add_project_category_model

# Or apply manually:
# npx prisma migrate deploy
```

## Rollback Instructions

If you need to rollback:

```sql
-- Remove foreign key constraint
ALTER TABLE `Document` DROP FOREIGN KEY `Document_projectCategoryId_fkey`;

-- Remove index
DROP INDEX `Document_projectCategoryId_idx` ON `Document`;

-- Remove column
ALTER TABLE `Document` DROP COLUMN `projectCategoryId`;

-- Drop ProjectCategory table
DROP TABLE `ProjectCategory`;
```

## Notes

- The migration preserves the old `projectCategory` string column initially for safety
- After verifying data migration, you can optionally drop the old column (Step 7)
- All existing documents will have their project categories mapped to the new IDs
- Documents without a matching category will have NULL for projectCategoryId
