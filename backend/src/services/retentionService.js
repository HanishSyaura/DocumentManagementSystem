const prisma = require('../config/database');
const configService = require('./configService');
const fileStorageService = require('./fileStorageService');

/**
 * Retention Policy Service
 * Handles automatic cleanup of documents based on retention settings
 */
class RetentionService {
  /**
   * Clean up old draft documents based on retention policy
   */
  async cleanupOldDrafts() {
    try {
      const settings = await configService.getRetentionPolicySettings();
      const retentionDays = settings.draftRetention;

      if (!retentionDays || retentionDays <= 0) {
        console.log('Draft retention policy is disabled');
        return { deletedCount: 0 };
      }

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Find old draft documents
      const oldDrafts = await prisma.document.findMany({
        where: {
          stage: 'DRAFT',
          status: 'DRAFT',
          createdAt: {
            lt: cutoffDate
          }
        },
        include: {
          versions: true
        }
      });

      let deletedCount = 0;

      // Delete each old draft
      for (const draft of oldDrafts) {
        try {
          // Delete all versions' files
          for (const version of draft.versions) {
            try {
              await fileStorageService.deleteFile(version.filePath);
            } catch (error) {
              console.error(`Failed to delete version file: ${version.filePath}`, error);
            }
          }

          // Delete document versions
          await prisma.documentVersion.deleteMany({
            where: { documentId: draft.id }
          });

          // Delete document record
          await prisma.document.delete({
            where: { id: draft.id }
          });

          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete draft document ${draft.id}:`, error);
        }
      }

      console.log(`Cleaned up ${deletedCount} old draft documents (older than ${retentionDays} days)`);
      return { deletedCount, retentionDays };
    } catch (error) {
      console.error('Error cleaning up old drafts:', error);
      throw error;
    }
  }

  /**
   * Clean up old archived documents based on retention policy
   */
  async cleanupOldArchived() {
    try {
      const settings = await configService.getRetentionPolicySettings();
      const retentionDays = settings.archivedRetention;

      if (!retentionDays || retentionDays <= 0) {
        console.log('Archived retention policy is disabled');
        return { deletedCount: 0 };
      }

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Find old archived documents
      const oldArchived = await prisma.document.findMany({
        where: {
          status: 'ARCHIVED',
          updatedAt: {
            lt: cutoffDate
          }
        },
        include: {
          versions: true
        }
      });

      let deletedCount = 0;

      // Delete each old archived document
      for (const archived of oldArchived) {
        try {
          // Delete all versions' files
          for (const version of archived.versions) {
            try {
              await fileStorageService.deleteFile(version.filePath);
            } catch (error) {
              console.error(`Failed to delete version file: ${version.filePath}`, error);
            }
          }

          // Delete document directory
          try {
            await fileStorageService.deleteDocumentDirectory(archived.fileCode);
          } catch (error) {
            console.error(`Failed to delete document directory: ${archived.fileCode}`, error);
          }

          // Delete document versions
          await prisma.documentVersion.deleteMany({
            where: { documentId: archived.id }
          });

          // Delete related records
          await prisma.approvalHistory.deleteMany({
            where: { documentId: archived.id }
          });

          await prisma.documentComment.deleteMany({
            where: { documentId: archived.id }
          });

          // Delete document record
          await prisma.document.delete({
            where: { id: archived.id }
          });

          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete archived document ${archived.id}:`, error);
        }
      }

      console.log(`Cleaned up ${deletedCount} old archived documents (older than ${retentionDays} days)`);
      return { deletedCount, retentionDays };
    } catch (error) {
      console.error('Error cleaning up old archived documents:', error);
      throw error;
    }
  }

  /**
   * Permanently delete soft-deleted documents based on retention policy
   * Note: Soft-delete is not implemented in the current schema (no deletedAt field)
   * This method is a placeholder for future implementation
   */
  async cleanupDeletedDocuments() {
    // Soft-delete is not implemented in the current Document schema
    // The Document model does not have a 'deletedAt' field
    // This is a no-op until soft-delete functionality is added
    console.log('Soft-delete cleanup skipped - not implemented in current schema');
    return { deletedCount: 0 };
  }

  /**
   * Run all retention cleanup tasks
   */
  async runRetentionCleanup() {
    console.log('Starting retention policy cleanup...');
    
    const results = {
      timestamp: new Date().toISOString(),
      drafts: null,
      archived: null,
      deleted: null,
      auditLogs: null,
      totalDeleted: 0
    };

    try {
      // Clean up old drafts
      results.drafts = await this.cleanupOldDrafts();
      results.totalDeleted += results.drafts.deletedCount;

      // Clean up old archived documents
      results.archived = await this.cleanupOldArchived();
      results.totalDeleted += results.archived.deletedCount;

      // Clean up soft-deleted documents
      results.deleted = await this.cleanupDeletedDocuments();
      results.totalDeleted += results.deleted.deletedCount;

      // Clean up audit logs based on audit settings
      try {
        const auditSettingsService = require('./auditSettingsService');
        results.auditLogs = await auditSettingsService.runLogCleanup();
        console.log(`Audit log cleanup: ${results.auditLogs.deleted} deleted, ${results.auditLogs.archived} archived`);
      } catch (auditError) {
        console.error('Audit log cleanup failed:', auditError);
        results.auditLogs = { deleted: 0, archived: 0, error: auditError.message };
      }

      console.log(`Retention cleanup completed. Total documents deleted: ${results.totalDeleted}`);
      return results;
    } catch (error) {
      console.error('Error during retention cleanup:', error);
      throw error;
    }
  }

  /**
   * Schedule retention cleanup to run periodically
   * This should be called when the application starts
   */
  scheduleRetentionCleanup() {
    // Run cleanup every 24 hours (86400000 ms)
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;

    // Run initial cleanup after 1 minute
    setTimeout(() => {
      this.runRetentionCleanup().catch(error => {
        console.error('Scheduled retention cleanup failed:', error);
      });
    }, 60000);

    // Then run every 24 hours
    setInterval(() => {
      this.runRetentionCleanup().catch(error => {
        console.error('Scheduled retention cleanup failed:', error);
      });
    }, CLEANUP_INTERVAL);

    console.log('Retention policy cleanup scheduled (runs every 24 hours)');
  }
}

module.exports = new RetentionService();
