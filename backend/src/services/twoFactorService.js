const crypto = require('crypto');
const prisma = require('../config/database');
const emailService = require('./emailService');
const securityService = require('./securityService');

/**
 * Two-Factor Authentication Service
 * Handles 2FA code generation, verification, and email delivery
 */
class TwoFactorService {
  /**
   * Generate a 6-digit verification code
   */
  generateCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Check if 2FA is enabled system-wide
   */
  async is2FAEnabled() {
    const settings = await securityService.getSecuritySettings();
    return settings.enable2FA || false;
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
   * Verify the 2FA code
   */
  async verifyCode(userId, code) {
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
        twoFactorCode: null,
        twoFactorCodeExpiry: null
      }
    });
    return { success: true, message: '2FA disabled for all users' };
  }
}

module.exports = new TwoFactorService();
