const prisma = require('../config/database');
const { NotFoundError, ConflictError } = require('../utils/errors');

class ConfigService {
  getDefaultNotificationSettings() {
    return {
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: process.env.SMTP_PORT || '587',
      smtpUsername: process.env.SMTP_USERNAME || '',
      smtpPassword: process.env.SMTP_PASSWORD || '',
      fromName: process.env.FROM_NAME || 'DMS System',
      fromEmail: process.env.FROM_EMAIL || 'noreply@company.com',
      notifications: {
        documentCreated: { email: true, inApp: true },
        documentSubmitted: { email: true, inApp: true },
        reviewAssigned: { email: true, inApp: true },
        approvalRequest: { email: true, inApp: true },
        documentApproved: { email: true, inApp: true },
        documentRejected: { email: true, inApp: true },
        documentPublished: { email: true, inApp: false },
        documentSuperseded: { email: true, inApp: true },
        workflowReminder: { email: true, inApp: true },
        systemMaintenance: { email: true, inApp: true }
      },
      reviewReminder: 3,
      approvalReminder: 2,
      dailyDigest: false,
      digestTime: '09:00'
    };
  }

  normalizeNotificationSettings(input) {
    const defaults = this.getDefaultNotificationSettings();
    const raw = (input && typeof input === 'object') ? input : {};
    const nested = (raw.settings && typeof raw.settings === 'object') ? raw.settings : null;

    // Support legacy/malformed stored payload like { settings: { ...actualValues } }
    const source = (nested && (nested.smtpHost || nested.smtpPort || nested.smtpUsername || nested.fromEmail || nested.notifications))
      ? nested
      : raw;

    return {
      smtpHost: source.smtpHost ?? defaults.smtpHost,
      smtpPort: String(source.smtpPort ?? defaults.smtpPort),
      smtpUsername: source.smtpUsername ?? defaults.smtpUsername,
      smtpPassword: source.smtpPassword ?? defaults.smtpPassword,
      fromName: source.fromName ?? defaults.fromName,
      fromEmail: source.fromEmail ?? defaults.fromEmail,
      notifications: (source.notifications && typeof source.notifications === 'object')
        ? source.notifications
        : defaults.notifications,
      reviewReminder: Number(source.reviewReminder ?? defaults.reviewReminder),
      approvalReminder: Number(source.approvalReminder ?? defaults.approvalReminder),
      dailyDigest: Boolean(source.dailyDigest ?? defaults.dailyDigest),
      digestTime: source.digestTime ?? defaults.digestTime
    };
  }

  /**
   * Get all document types
   */
  async getDocumentTypes({ includeInactive = false } = {}) {
    return await prisma.documentType.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Get all roles
   */
  async getRoles() {
    return await prisma.role.findMany({
      orderBy: { displayName: 'asc' }
    });
  }

  /**
   * Get all workflows
   */
  async getWorkflows() {
    return await prisma.workflow.findMany({
      include: {
        documentType: true,
        steps: {
          include: {
            role: true
          },
          orderBy: { stepOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get all users with roles
   */
  async getUsers(filters = {}) {
    const { status, roleId } = filters;
    const where = {};

    if (status) where.status = status;
    if (roleId) {
      where.roles = {
        some: { roleId: parseInt(roleId) }
      };
    }

    return await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        position: true,
        status: true,
        dateJoined: true,
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: { firstName: 'asc' }
    });
  }

  /**
   * Get system configuration
   */
  async getConfiguration(key = null) {
    if (key) {
      return await prisma.configuration.findUnique({
        where: { key }
      });
    }

    return await prisma.configuration.findMany({
      orderBy: { key: 'asc' }
    });
  }

  /**
   * Update configuration
   */
  async updateConfiguration(key, value) {
    return await prisma.configuration.update({
      where: { key },
      data: { value }
    });
  }

  // ============================================
  // DOCUMENT TYPE MANAGEMENT
  // ============================================

  /**
   * Create new document type
   */
  async createDocumentType(data) {
    const { name, prefix, description } = data;
    return await prisma.documentType.create({
      data: {
        name,
        prefix,
        description,
        isActive: true
      }
    });
  }

  /**
   * Update document type
   */
  async updateDocumentType(id, data) {
    const { name, prefix, description, isActive } = data;
    return await prisma.documentType.update({
      where: { id: parseInt(id) },
      data: {
        name,
        prefix,
        description,
        isActive
      }
    });
  }

  /**
   * Delete document type
   */
  async deleteDocumentType(id) {
    const documentTypeId = parseInt(id)
    const [documentsCount, templatesCount, workflowsCount] = await Promise.all([
      prisma.document.count({ where: { documentTypeId } }),
      prisma.template.count({ where: { documentTypeId } }),
      prisma.workflow.count({ where: { documentTypeId } })
    ])

    if (documentsCount > 0 || templatesCount > 0 || workflowsCount > 0) {
      throw new ConflictError('Cannot delete this document type because it is currently in use.')
    }

    return await prisma.documentType.delete({
      where: { id: documentTypeId }
    })
  }

  async restoreDocumentType(id) {
    return await prisma.documentType.update({
      where: { id: parseInt(id) },
      data: { isActive: true }
    })
  }

  // ============================================
  // PROJECT CATEGORY MANAGEMENT
  // ============================================

  /**
   * Get all project categories
   */
  async getProjectCategories({ includeInactive = false } = {}) {
    return await prisma.projectCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Create new project category
   */
  async createProjectCategory(data) {
    const { name, code, description } = data;
    return await prisma.projectCategory.create({
      data: {
        name,
        code,
        description,
        isActive: true
      }
    });
  }

  /**
   * Update project category
   */
  async updateProjectCategory(id, data) {
    const { name, code, description, isActive } = data;
    return await prisma.projectCategory.update({
      where: { id: parseInt(id) },
      data: {
        name,
        code,
        description,
        isActive
      }
    });
  }

  /**
   * Delete project category (hard delete)
   */
  async deleteProjectCategory(id) {
    return await prisma.projectCategory.delete({
      where: { id: parseInt(id) }
    })
  }

  // ============================================
  // DEPARTMENT MANAGEMENT
  // ============================================

  /**
   * Get all departments
   */
  async getDepartments({ includeInactive = false } = {}) {
    return await prisma.department.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' }
    })
  }

  /**
   * Create new department
   */
  async createDepartment(data) {
    const { name, code, description } = data;
    return await prisma.department.create({
      data: {
        name,
        code,
        description,
        isActive: true
      }
    });
  }

  /**
   * Update department
   */
  async updateDepartment(id, data) {
    const { name, code, description, isActive } = data;
    return await prisma.department.update({
      where: { id: parseInt(id) },
      data: {
        name,
        code,
        description,
        isActive
      }
    });
  }

  /**
   * Delete department
   */
  async deleteDepartment(id) {
    return await prisma.department.delete({
      where: { id: parseInt(id) }
    })
  }

  async restoreDepartment(id) {
    return await prisma.department.update({
      where: { id: parseInt(id) },
      data: { isActive: true }
    })
  }

  // ============================================
  // DOCUMENT NUMBERING SETTINGS
  // ============================================

  /**
   * Get document numbering settings
   * Returns stored settings or defaults if not configured
   */
  async getDocumentNumberingSettings() {
    const config = await prisma.configuration.findUnique({
      where: { key: 'document_numbering_settings' }
    });

    if (config && config.value) {
      try {
        return JSON.parse(config.value);
      } catch (error) {
        console.error('Failed to parse document numbering settings:', error);
      }
    }

    // Return default settings if not configured
    return {
      separator: '/',
      prefixPlaceholder: 'PFX',
      includeVersion: true,
      versionDigits: '2',
      dateFormat: 'YYMMDD',
      counterDigits: '3',
      startingNumber: '1'
    };
  }

  /**
   * Update document numbering settings
   * Stores settings in Configuration table
   */
  async updateDocumentNumberingSettings(settings) {
    const settingsJson = JSON.stringify(settings);

    // Upsert the configuration
    const config = await prisma.configuration.upsert({
      where: { key: 'document_numbering_settings' },
      update: { 
        value: settingsJson,
        description: 'Document numbering format configuration'
      },
      create: {
        key: 'document_numbering_settings',
        value: settingsJson,
        description: 'Document numbering format configuration'
      }
    });

    return JSON.parse(config.value);
  }

  // ============================================
  // FILE UPLOAD SETTINGS
  // ============================================

  /**
   * Get file upload settings
   * Returns stored settings or defaults if not configured
   */
  async getFileUploadSettings() {
    const config = await prisma.configuration.findUnique({
      where: { key: 'file_upload_settings' }
    });

    if (config && config.value) {
      try {
        return JSON.parse(config.value);
      } catch (error) {
        console.error('Failed to parse file upload settings:', error);
      }
    }

    // Return default settings if not configured
    return {
      maxFileSize: 10, // MB
      allowedTypes: ['PDF', 'DOC', 'DOCX', 'DOTX', 'XLS', 'XLSX', 'XLTX', 'PPT', 'PPTX', 'TXT', 'PNG', 'JPG', 'JPEG'],
      bulkUploadLimit: 10
    };
  }

  /**
   * Update file upload settings
   * Stores settings in Configuration table
   */
  async updateFileUploadSettings(settings) {
    const settingsJson = JSON.stringify(settings);

    const config = await prisma.configuration.upsert({
      where: { key: 'file_upload_settings' },
      update: { 
        value: settingsJson,
        description: 'File upload configuration'
      },
      create: {
        key: 'file_upload_settings',
        value: settingsJson,
        description: 'File upload configuration'
      }
    });

    return JSON.parse(config.value);
  }

  // ============================================
  // VERSION CONTROL SETTINGS
  // ============================================

  /**
   * Get version control settings
   * Returns stored settings or defaults if not configured
   */
  async getVersionControlSettings() {
    const config = await prisma.configuration.findUnique({
      where: { key: 'version_control_settings' }
    });

    if (config && config.value) {
      try {
        return JSON.parse(config.value);
      } catch (error) {
        console.error('Failed to parse version control settings:', error);
      }
    }

    // Return default settings if not configured
    return {
      autoVersion: true,
      versionFormat: 'x.x',
      maxVersions: 50
    };
  }

  /**
   * Update version control settings
   * Stores settings in Configuration table
   */
  async updateVersionControlSettings(settings) {
    const settingsJson = JSON.stringify(settings);

    const config = await prisma.configuration.upsert({
      where: { key: 'version_control_settings' },
      update: { 
        value: settingsJson,
        description: 'Version control configuration'
      },
      create: {
        key: 'version_control_settings',
        value: settingsJson,
        description: 'Version control configuration'
      }
    });

    return JSON.parse(config.value);
  }

  // ============================================
  // RETENTION POLICY SETTINGS
  // ============================================

  /**
   * Get retention policy settings
   * Returns stored settings or defaults if not configured
   */
  async getRetentionPolicySettings() {
    const config = await prisma.configuration.findUnique({
      where: { key: 'retention_policy_settings' }
    });

    if (config && config.value) {
      try {
        return JSON.parse(config.value);
      } catch (error) {
        console.error('Failed to parse retention policy settings:', error);
      }
    }

    // Return default settings if not configured
    return {
      draftRetention: 30,
      archivedRetention: 365,
      deletedRetention: 30
    };
  }

  /**
   * Update retention policy settings
   * Stores settings in Configuration table
   */
  async updateRetentionPolicySettings(settings) {
    const settingsJson = JSON.stringify(settings);

    const config = await prisma.configuration.upsert({
      where: { key: 'retention_policy_settings' },
      update: { 
        value: settingsJson,
        description: 'Retention policy configuration'
      },
      create: {
        key: 'retention_policy_settings',
        value: settingsJson,
        description: 'Retention policy configuration'
      }
    });

    return JSON.parse(config.value);
  }

  // ============================================
  // NOTIFICATION SETTINGS
  // ============================================

  /**
   * Get notification settings
   * Returns stored settings or defaults if not configured
   */
  async getNotificationSettings() {
    const config = await prisma.configuration.findUnique({
      where: { key: 'notification_settings' }
    });

    if (config && config.value) {
      try {
        const parsed = JSON.parse(config.value);
        return this.normalizeNotificationSettings(parsed);
      } catch (error) {
        console.error('Failed to parse notification settings:', error);
      }
    }

    return this.getDefaultNotificationSettings();
  }

  /**
   * Update notification settings
   * Stores settings in Configuration table
   */
  async updateNotificationSettings(settings) {
    const current = await this.getNotificationSettings();
    const normalized = this.normalizeNotificationSettings(settings);

    const incomingPassword = settings?.smtpPassword;
    const shouldPreservePassword =
      incomingPassword === undefined ||
      incomingPassword === null ||
      incomingPassword === '' ||
      incomingPassword === '••••••••';

    const merged = {
      ...current,
      ...normalized,
      smtpPassword: shouldPreservePassword ? current.smtpPassword : normalized.smtpPassword,
      notifications: (normalized?.notifications && typeof normalized.notifications === 'object')
        ? { ...(current.notifications || {}), ...normalized.notifications }
        : (current.notifications || {})
    };
    const settingsJson = JSON.stringify(normalized);
    const settingsJson = JSON.stringify(merged);
    const config = await prisma.configuration.upsert({
      where: { key: 'notification_settings' },
      update: { 
        value: settingsJson,
        description: 'Email and notification configuration'
        description: 'Email and notification configuration'
      },
      create: {
        key: 'notification_settings',
        value: settingsJson,
        description: 'Email and notification configuration'
      }
    });

    return this.normalizeNotificationSettings(JSON.parse(config.value));
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(testEmail) {
    const emailService = require('./emailService');
    return await emailService.sendTestEmail(testEmail);
  }

  // ============================================
  // LANDING PAGE SETTINGS (GLOBAL)
  // ============================================

  async getLandingPageSettings() {
    const config = await prisma.configuration.findUnique({
      where: { key: 'landing_page_settings' }
    });

    if (config?.value) {
      try {
        return JSON.parse(config.value);
      } catch (error) {
        console.error('Failed to parse landing page settings:', error);
      }
    }

    return null;
  }

  async updateLandingPageSettings(settings) {
    const sanitized = settings && typeof settings === 'object' ? { ...settings } : settings
    if (sanitized && typeof sanitized === 'object') {
      delete sanitized.aboutGradientStart
      delete sanitized.aboutGradientEnd
      if (Array.isArray(sanitized.features)) {
        sanitized.features = sanitized.features.map((f) => {
          if (!f || typeof f !== 'object') return f
          const nf = { ...f }
          delete nf.icon
          return nf
        })
      }
    }

    const settingsJson = JSON.stringify(sanitized);

    const config = await prisma.configuration.upsert({
      where: { key: 'landing_page_settings' },
      update: {
        value: settingsJson,
        description: 'Landing page content and layout settings'
      },
      create: {
        key: 'landing_page_settings',
        value: settingsJson,
        description: 'Landing page content and layout settings'
      }
    });

    return JSON.parse(config.value);
  }

  async getCompanyInfo() {
    const config = await prisma.configuration.findUnique({
      where: { key: 'company_info' }
    });

    if (config?.value) {
      try {
        return JSON.parse(config.value);
      } catch (error) {
        console.error('Failed to parse company info:', error);
      }
    }

    return null;
  }

  async updateCompanyInfo(companyInfo) {
    const value = JSON.stringify(companyInfo);

    const config = await prisma.configuration.upsert({
      where: { key: 'company_info' },
      update: { value, description: 'Company information (global branding)' },
      create: { key: 'company_info', value, description: 'Company information (global branding)' }
    });

    return JSON.parse(config.value);
  }

  async getThemeSettings() {
    const config = await prisma.configuration.findUnique({
      where: { key: 'theme_settings' }
    });

    if (config?.value) {
      try {
        return JSON.parse(config.value);
      } catch (error) {
        console.error('Failed to parse theme settings:', error);
      }
    }

    return null;
  }

  async updateThemeSettings(themeSettings) {
    const value = JSON.stringify(themeSettings);

    const config = await prisma.configuration.upsert({
      where: { key: 'theme_settings' },
      update: { value, description: 'Theme and branding settings (global)' },
      create: { key: 'theme_settings', value, description: 'Theme and branding settings (global)' }
    });

    return JSON.parse(config.value);
  }
}

module.exports = new ConfigService();
