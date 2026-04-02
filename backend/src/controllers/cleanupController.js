const cleanupService = require('../services/cleanupService');
const ResponseFormatter = require('../utils/responseFormatter');

class CleanupController {
  /**
   * Get statistics before cleanup
   */
  async getCleanupStats(req, res) {
    try {
      const stats = await cleanupService.getCleanupStats();
      return ResponseFormatter.success(res, { stats }, 'Cleanup statistics retrieved successfully');
    } catch (error) {
      console.error('Get cleanup stats error:', error);
      return ResponseFormatter.error(res, 'Failed to retrieve cleanup statistics');
    }
  }

  /**
   * Perform database cleanup (preserves master data)
   * Requires admin password verification
   */
  async cleanupDatabase(req, res) {
    try {
      const { password, includeFiles } = req.body;
      const userId = req.user.id;

      // Validate password is provided
      if (!password) {
        return ResponseFormatter.validationError(res, [
          { field: 'password', message: 'Password is required for database cleanup' }
        ]);
      }

      // Verify admin password
      try {
        await cleanupService.verifyAdminPassword(userId, password);
      } catch (error) {
        return ResponseFormatter.error(res, error.message, 403);
      }

      // Perform database cleanup
      const results = await cleanupService.cleanupDatabase(userId);

      // Optionally cleanup uploaded files
      if (includeFiles) {
        const fileResults = await cleanupService.cleanupUploadedFiles();
        results.fileCleanup = fileResults;
      }

      return ResponseFormatter.success(
        res, 
        { results }, 
        'Database cleanup completed successfully'
      );
    } catch (error) {
      console.error('Database cleanup error:', error);
      return ResponseFormatter.error(res, error.message || 'Database cleanup failed');
    }
  }

  /**
   * Perform full system reset (removes everything including master data)
   * Requires admin password verification
   */
  async fullSystemReset(req, res) {
    try {
      const { password, confirmText, includeFiles } = req.body;
      const userId = req.user.id;

      // Validate password is provided
      if (!password) {
        return ResponseFormatter.validationError(res, [
          { field: 'password', message: 'Password is required for system reset' }
        ]);
      }

      // Validate confirmation text
      if (confirmText !== 'RESET EVERYTHING') {
        return ResponseFormatter.validationError(res, [
          { field: 'confirmText', message: 'You must type "RESET EVERYTHING" to confirm' }
        ]);
      }

      // Verify admin password
      try {
        await cleanupService.verifyAdminPassword(userId, password);
      } catch (error) {
        return ResponseFormatter.error(res, error.message, 403);
      }

      // Perform full system reset
      const results = await cleanupService.fullSystemReset(userId);

      // Optionally cleanup uploaded files
      if (includeFiles) {
        const fileResults = await cleanupService.cleanupUploadedFiles();
        results.fileCleanup = fileResults;
      }

      return ResponseFormatter.success(
        res, 
        { results }, 
        'Full system reset completed successfully'
      );
    } catch (error) {
      console.error('Full system reset error:', error);
      return ResponseFormatter.error(res, error.message || 'Full system reset failed');
    }
  }

  /**
   * Verify password without performing cleanup (for UI validation)
   */
  async verifyPassword(req, res) {
    try {
      const { password } = req.body;
      const userId = req.user.id;

      if (!password) {
        return ResponseFormatter.validationError(res, [
          { field: 'password', message: 'Password is required' }
        ]);
      }

      await cleanupService.verifyAdminPassword(userId, password);
      
      return ResponseFormatter.success(res, { valid: true }, 'Password verified successfully');
    } catch (error) {
      return ResponseFormatter.error(res, error.message, 403);
    }
  }
}

module.exports = new CleanupController();
