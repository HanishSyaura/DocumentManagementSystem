/*
  Warnings:

  - A unique constraint covering the columns `[workflowId,stepOrder]` on the table `WorkflowStep` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `WorkflowStep_workflowId_stepOrder_key` ON `WorkflowStep`(`workflowId`, `stepOrder`);
