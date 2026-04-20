const crypto = require('crypto');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const prisma = require('../config/database');
const emailService = require('./emailService');
const securityService = require('./securityService');
const encryptionService = require('./encryptionService');

/**
 * Two-Factor Authentication Service
 * Handles 2FA code generation, verification, and email delivery
 */
class TwoFactorService {
  defaultMethods = {
    email: true,
    sms: false,
    app: false
  };

  /**
   * Generate a 6-digit verification code
   */
  generateCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Get enabled 2FA methods from security settings
   */
  async getEnabledMethods() {
    const settings = await securityService.getSecuritySettings();
    return { ...this.defaultMethods, ...(settings.twoFAMethods || {}) };
  }

  /**
   * Check if 2FA is enabled system-wide
   */
  async is2FAEnabled() {
    const settings = await securityService.getSecuritySettings();
    return settings.enable2FA || false;
  }

  /**
   * Select the best available 2FA method for the user
   */
  async getPreferredMethod(user) {
    const methods = await this.getEnabledMethods();
    const hasAppSecret = Boolean(user?.twoFactorSecret);
    const userPrefersApp = user?.twoFactorMethod === 'app';

    if (methods.app && hasAppSecret && userPrefersApp) {
      return 'app';
    }

    if (methods.email) {
      return 'email';
    }

    if (methods.app && hasAppSecret) {
      return 'app';
    }

    return null;
  }

  /**
   * Check if user has 2FA enabled
   */
  async isUserTwoFactorEnabled(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true }
    });
    return user?.twoFactorEnabled || false;
  }

  /**
   * Generate and send 2FA code to user's email
   */
  async sendTwoFactorCode(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate 6-digit code
    const code = this.generateCode();
    
    // Code expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save code to user record
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorCode: code,
        twoFactorCodeExpiry: expiresAt
      }
    });

    // Send email with verification code
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: '🔐 DMS - Your Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0f6fcf;">Two-Factor Authentication</h2>
            <p>Hello ${user.firstName || 'User'},</p>
            <p>Your verification code is:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${code}</span>
            </div>
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email or contact your administrator if you have concerns.</p>
            <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px;">
              Document Management System<br>
              This is an automated message, please do not reply.
            </p>
          </div>
        `
      });
      return { success: true, message: 'Verification code sent to email' };
    } catch (error) {
      console.error('Failed to send 2FA email:', error);
      throw new Error('Failed to send verification code');
    }
  }

  /**
   * Generate authenticator app setup payload for current user
   */
  async setupAuthenticator(userId, issuer = 'FileNix / DMS') {
    const methods = await this.getEnabledMethods();
    if (!methods.app) {
      throw new Error('Authenticator app method is disabled by system settings');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const secret = speakeasy.generateSecret({
      name: `${issuer}:${user.email}`,
      issuer
    });

    const encryptedSecret = encryptionService.encryptString(secret.base32);

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorTempSecret: encryptedSecret
      }
    });

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    return {
      qrCodeDataUrl,
      manualKey: secret.base32,
      otpauthUrl: secret.otpauth_url,
      issuer
    };
  }

  /**
   * Verify authenticator setup code, then activate app-based 2FA
   */
  async verifyAuthenticatorSetup(userId, token) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorTempSecret: true }
    });

    if (!user?.twoFactorTempSecret) {
      return { valid: false, error: 'No authenticator setup in progress. Please generate a new QR code.' };
    }

    let base32Secret;
    try {
      base32Secret = encryptionService.decryptString(user.twoFactorTempSecret);
    } catch (error) {
      return { valid: false, error: 'Invalid authenticator secret. Please restart setup.' };
    }

    const valid = speakeasy.totp.verify({
      secret: base32Secret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!valid) {
      return { valid: false, error: 'Invalid authenticator code' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorMethod: 'app',
        twoFactorSecret: user.twoFactorTempSecret,
        twoFactorTempSecret: null,
        twoFactorCode: null,
        twoFactorCodeExpiry: null
      }
    });

    return { valid: true };
  }

  /**
   * Verify TOTP code from authenticator app
   */
  async verifyAuthenticatorCode(userId, token) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorSecret: true
      }
    });

    if (!user?.twoFactorSecret) {
      return { valid: false, error: 'Authenticator app is not configured for this account' };
    }

    let base32Secret;
    try {
      base32Secret = encryptionService.decryptString(user.twoFactorSecret);
    } catch (error) {
      return { valid: false, error: 'Invalid authenticator secret. Please re-setup authenticator app.' };
    }

    const valid = speakeasy.totp.verify({
      secret: base32Secret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!valid) {
      return { valid: false, error: 'Invalid authenticator code' };
    }

    return { valid: true };
  }

  /**
   * Verify the 2FA code
   */
  async verifyCode(userId, code, method = 'email') {
    if (method === 'app') {
      return this.verifyAuthenticatorCode(userId, code);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        twoFactorCode: true, 
        twoFactorCodeExpiry: true 
      }
    });

    if (!user) {
      return { valid: false, error: 'User not found' };
    }

    if (!user.twoFactorCode || !user.twoFactorCodeExpiry) {
      return { valid: false, error: 'No verification code found. Please request a new code.' };
    }

    // Check if code has expired
    if (new Date() > user.twoFactorCodeExpiry) {
      // Clear expired code
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorCode: null,
          twoFactorCodeExpiry: null
        }
      });
      return { valid: false, error: 'Verification code has expired. Please request a new code.' };
    }

    // Verify code
    if (user.twoFactorCode !== code) {
      return { valid: false, error: 'Invalid verification code' };
    }

    // Clear the code after successful verification
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorCode: null,
        twoFactorCodeExpiry: null
      }
    });

    return { valid: true };
  }

  /**
   * Enable 2FA for a user
   */
  async enableTwoFactor(userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });
    return { success: true, message: '2FA enabled for user' };
  }

  /**
   * Disable 2FA for a user
   */
  async disableTwoFactor(userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        twoFactorEnabled: false,
        twoFactorTempSecret: null,
        twoFactorCode: null,
        twoFactorCodeExpiry: null
      }
    });
    return { success: true, message: '2FA disabled for user' };
  }

  /**
   * Enable 2FA for all users (system-wide setting)
   */
  async enableTwoFactorForAllUsers() {
    await prisma.user.updateMany({
      data: { twoFactorEnabled: true }
    });
    return { success: true, message: '2FA enabled for all users' };
  }

  /**
   * Disable 2FA for all users (system-wide setting)
   */
  async disableTwoFactorForAllUsers() {
    await prisma.user.updateMany({
      data: { 
        twoFactorEnabled: false,
        twoFactorTempSecret: null,
        twoFactorCode: null,
        twoFactorCodeExpiry: null
      }
    });
    return { success: true, message: '2FA disabled for all users' };
  }
}

module.exports = new TwoFactorService();
