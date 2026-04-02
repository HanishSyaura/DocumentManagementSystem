const prisma = require('../config/database');
const emailService = require('./emailService');

/**
 * Audit Settings Service
 * Manages audit log settings, event tracking, and security alerts
 */
class AuditSettingsService {
  // Default audit settings
  defaultSettings = {
    // Retention settings
    retentionDays: 90,
    autoArchiveDays: 365,
    permanentRetention: false,
    
    // Event tracking
    trackAuth: true,
    trackDocuments: true,
    trackConfig: true,
    trackUsers: true,
    trackDownloads: true,
    trackPermissions: true,
    trackFailures: true,
    
    // Security alerts
    alertFailedLogins: true,
    alertUnauthorized: true,
    alertBulkExports: true,
    alertConfigChanges: true,
    alertEmail: ''
  };

  // Map entity types to tracking settings
  entityTrackingMap = {
    'Auth': 'trackAuth',
    'Document': 'trackDocuments',
    'Workflow': 'trackDocuments',
    'System': 'trackConfig',
    'Configuration': 'trackConfig',
    'User': 'trackUsers',
    'Role': 'trackPermissions',
    'Download': 'trackDownloads',
    'Error': 'trackFailures'
  };

  // Map actions to tracking settings
  actionTrackingMap = {
    'LOGIN': 'trackAuth',
    'LOGOUT': 'trackAuth',
    'LOGIN_FAILED': 'trackAuth',
    'PASSWORD_CHANGE': 'trackAuth',
    'TWO_FACTOR_INITIATED': 'trackAuth',
    'TWO_FACTOR_FAILED': 'trackAuth',
    'ACCOUNT_LOCKED': 'trackAuth',
    'CREATE': 'trackDocuments',
    'UPDATE': 'trackDocuments',
    'DELETE': 'trackDocuments',
    'UPLOAD': 'trackDocuments',
    'DOWNLOAD': 'trackDownloads',
    'VIEW': 'trackDownloads',
    'ROLE_CREATE': 'trackPermissions',
    'ROLE_UPDATE': 'trackPermissions',
    'ROLE_DELETE': 'trackPermissions',
    'ROLE_PERMISSION_UPDATE': 'trackPermissions'
  };

  /**
   * Get audit settings from database
   */
  async getSettings() {
    try {
      const config = await prisma.configuration.findUnique({
        where: { key: 'audit_settings' }
      });

      if (config && config.value) {
        const savedSettings = typeof config.value === 'string' 
          ? JSON.parse(config.value) 
          : config.value;
        return { ...this.defaultSettings, ...savedSettings };
      }

      return this.defaultSettings;
    } catch (error) {
      console.error('Error fetching audit settings:', error);
      return this.defaultSettings;
    }
  }

  /**
   * Save audit settings to database
   */
  async saveSettings(settings) {
    const mergedSettings = { ...this.defaultSettings, ...settings };

    await prisma.configuration.upsert({
      where: { key: 'audit_settings' },
      update: { value: JSON.stringify(mergedSettings) },
      create: {
        key: 'audit_settings',
        value: JSON.stringify(mergedSettings),
        description: 'Audit logging and security alert settings'
      }
    });

    return mergedSettings;
  }

  /**
   * Check if an event should be logged based on settings
   * @param {string} entity - Entity type (Auth, Document, User, etc.)
   * @param {string} action - Action type (LOGIN, CREATE, etc.)
   * @returns {boolean}
   */
  async shouldLogEvent(entity, action) {
    const settings = await this.getSettings();

    // Check action-specific tracking first
    const actionSetting = this.actionTrackingMap[action];
    if (actionSetting && settings[actionSetting] === false) {
      return false;
    }

    // Check entity-specific tracking
    const entitySetting = this.entityTrackingMap[entity];
    if (entitySetting && settings[entitySetting] === false) {
      return false;
    }

    // Default to tracking if no specific setting found
    return true;
  }

  /**
   * Check and trigger security alerts
   * @param {string} alertType - Type of alert (failedLogins, unauthorized, bulkExports, configChanges)
   * @param {object} data - Alert data
   */
  async checkSecurityAlert(alertType, data) {
    const settings = await this.getSettings();

    // Map alert types to settings
    const alertSettingsMap = {
      'failedLogins': 'alertFailedLogins',
      'unauthorized': 'alertUnauthorized',
      'bulkExports': 'alertBulkExports',
      'configChanges': 'alertConfigChanges'
    };

    const settingKey = alertSettingsMap[alertType];
    if (!settingKey || !settings[settingKey]) {
      return; // Alert type disabled
    }

    // Send alert email
    await this.sendSecurityAlert(alertType, data, settings);
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlert(alertType, data, settings) {
    // Get admin emails if no specific alert email configured
    let recipients = settings.alertEmail;
    if (!recipients) {
      const admins = await prisma.user.findMany({
        where: {
          roles: {
            some: {
              role: {
                name: { in: ['admin', 'Admin', 'ADMIN'] }
              }
            }
          },
          status: 'ACTIVE'
        },
        select: { email: true }
      });
      recipients = admins.map(a => a.email).join(', ');
    }

    if (!recipients) {
      console.warn('No recipients for security alert');
      return;
    }

    const alertTemplates = {
      failedLogins: {
        subject: '🚨 Security Alert: Multiple Failed Login Attempts',
        html: (d) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Security Alert: Failed Login Attempts</h2>
            <p>Multiple failed login attempts have been detected:</p>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Email:</strong> ${d.email || 'Unknown'}</p>
              <p><strong>IP Address:</strong> ${d.ipAddress || 'Unknown'}</p>
              <p><strong>Failed Attempts:</strong> ${d.failedAttempts || 'N/A'}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #6b7280;">Please investigate this activity if it seems suspicious.</p>
          </div>
        `
      },
      unauthorized: {
        subject: '🚨 Security Alert: Unauthorized Access Attempt',
        html: (d) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Security Alert: Unauthorized Access</h2>
            <p>An unauthorized access attempt has been detected:</p>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>User:</strong> ${d.userName || 'Unknown'}</p>
              <p><strong>Resource:</strong> ${d.resource || 'Unknown'}</p>
              <p><strong>Action:</strong> ${d.action || 'Unknown'}</p>
              <p><strong>IP Address:</strong> ${d.ipAddress || 'Unknown'}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #6b7280;">Please review this access attempt.</p>
          </div>
        `
      },
      bulkExports: {
        subject: '⚠️ Security Notice: Bulk Data Export',
        html: (d) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Security Notice: Bulk Export</h2>
            <p>A bulk data export has been performed:</p>
            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>User:</strong> ${d.userName || 'Unknown'}</p>
              <p><strong>Export Type:</strong> ${d.exportType || 'Unknown'}</p>
              <p><strong>Records Count:</strong> ${d.recordCount || 'Unknown'}</p>
              <p><strong>IP Address:</strong> ${d.ipAddress || 'Unknown'}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #6b7280;">This is an informational notice for compliance purposes.</p>
          </div>
        `
      },
      configChanges: {
        subject: '⚠️ System Alert: Configuration Change',
        html: (d) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">System Alert: Configuration Changed</h2>
            <p>A critical configuration change has been made:</p>
            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Changed By:</strong> ${d.userName || 'Unknown'}</p>
              <p><strong>Setting:</strong> ${d.setting || 'Unknown'}</p>
              <p><strong>Change:</strong> ${d.description || 'Unknown'}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #6b7280;">Please verify this change was authorized.</p>
          </div>
        `
      }
    };

    const template = alertTemplates[alertType];
    if (!template) return;

    try {
      await emailService.sendEmail({
        to: recipients,
        subject: template.subject,
        html: template.html(data)
      });
      console.log(`Security alert sent: ${alertType}`);
    } catch (error) {
      console.error(`Failed to send security alert (${alertType}):`, error);
    }
  }

  /**
   * Check for multiple failed logins and trigger alert
   * @param {number} userId - User ID
   * @param {number} threshold - Number of failed attempts to trigger alert (default: 3)
   * @param {number} windowMinutes - Time window in minutes (default: 15)
   */
  async checkFailedLoginAlert(userId, email, ipAddress, threshold = 3, windowMinutes = 15) {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const failedCount = await prisma.auditLog.count({
      where: {
        userId,
        action: 'LOGIN_FAILED',
        createdAt: { gte: windowStart }
      }
    });

    if (failedCount >= threshold) {
      await this.checkSecurityAlert('failedLogins', {
        email,
        ipAddress,
        failedAttempts: failedCount
      });
    }
  }

  /**
   * Run log cleanup based on retention settings
   * @returns {object} - { deleted: number, archived: number }
   */
  async runLogCleanup() {
    const settings = await this.getSettings();
    let deleted = 0;
    let archived = 0;

    // Skip if permanent retention is enabled
    if (settings.permanentRetention) {
      console.log('Permanent retention enabled - skipping cleanup');
      return { deleted: 0, archived: 0 };
    }

    // Archive logs older than autoArchiveDays
    if (settings.autoArchiveDays > 0) {
      const archiveDate = new Date();
      archiveDate.setDate(archiveDate.getDate() - settings.autoArchiveDays);

      // Get logs to archive
      const logsToArchive = await prisma.auditLog.findMany({
        where: {
          createdAt: { lt: archiveDate },
          isArchived: false
        }
      });

      if (logsToArchive.length > 0) {
        // Mark logs as archived
        await prisma.auditLog.updateMany({
          where: {
            id: { in: logsToArchive.map(l => l.id) }
          },
          data: { isArchived: true }
        });
        archived = logsToArchive.length;
        console.log(`Archived ${archived} audit logs`);
      }
    }

    // Delete logs older than retentionDays
    if (settings.retentionDays > 0) {
      const deleteDate = new Date();
      deleteDate.setDate(deleteDate.getDate() - settings.retentionDays);

      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: { lt: deleteDate }
        }
      });
      deleted = result.count;
      console.log(`Deleted ${deleted} audit logs older than ${settings.retentionDays} days`);
    }

    return { deleted, archived };
  }
}

module.exports = new AuditSettingsService();
