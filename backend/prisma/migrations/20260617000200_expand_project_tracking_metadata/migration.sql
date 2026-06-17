-- AlterTable
ALTER TABLE `Project`
    ADD COLUMN `clientName` VARCHAR(191) NULL,
    ADD COLUMN `clientPic` VARCHAR(191) NULL,
    ADD COLUMN `teamMembers` LONGTEXT NULL,
    ADD COLUMN `startDate` DATETIME(3) NULL,
    ADD COLUMN `plannedCompletionDate` DATETIME(3) NULL,
    ADD COLUMN `actualCompletionDate` DATETIME(3) NULL,
    ADD COLUMN `scope` LONGTEXT NULL,
    ADD COLUMN `objective` LONGTEXT NULL,
    ADD COLUMN `deliverables` LONGTEXT NULL;
