const prisma = require('../config/database');
const { BadRequestError } = require('../utils/errors');

/**
 * Security Service
 * Handles password policy validation and security settings
 */
class SecurityService {
  // Default security settings
  defaultSettings = {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
    maxLoginAttempts: 5,
    lockoutDuration: 30, // minutes
    sessionTimeout: 480, // minutes (8 hours)
    enable2FA: false,
    twoFAMethods: {
      email: true,
      sms: false,
      app: false
    },
    encryptDocuments: false,
    encryptDatabase: false
  };

  /**
   * Get security settings from database
   */
  async getSecuritySettings() {
    try {
      const config = await prisma.configuration.findUnique({
        where: { key: 'security_settings' }
      });

      if (config && config.value) {
        return { ...this.defaultSettings, ...JSON.parse(config.value) };
      }

      return this.defaultSettings;
    } catch (error) {
      console.error('Error fetching security settings:', error);
      return this.defaultSettings;
    }
  }

  /**
   * Save security settings to database
   */
  async saveSecuritySettings(settings) {
    const mergedSettings = { ...this.defaultSettings, ...settings };

    await prisma.configuration.upsert({
      where: { key: 'security_settings' },
      update: { value: JSON.stringify(mergedSettings) },
      create: { 
        key: 'security_settings', 
        value: JSON.stringify(mergedSettings),
        description: 'System security and password policy settings'
      }
    });

    return mergedSettings;
  }

  /**
   * Validate password against security policy
   * @param {string} password - The password to validate
   * @returns {object} - { valid: boolean, errors: string[] }
   */
  async validatePassword(password) {
    const settings = await this.getSecuritySettings();
    const errors = [];

    // Check minimum length
    if (password.length < settings.minLength) {
      errors.push(`Password must be at least ${settings.minLength} characters`);
    }

    // Check for uppercase letters
    if (settings.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check for numbers
    if (settings.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check for symbols
    if (settings.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*...)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new SecurityService();
