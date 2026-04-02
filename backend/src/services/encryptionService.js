const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const securityService = require('./securityService');

/**
 * Encryption Service
 * Handles AES-256-GCM encryption/decryption for documents
 */
class EncryptionService {
  constructor() {
    // Get encryption key from environment or generate one
    // In production, this should be stored securely (e.g., AWS KMS, HashiCorp Vault)
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateKey();
    this.algorithm = 'aes-256-gcm';
    this.ivLength = 16; // 128 bits
    this.authTagLength = 16; // 128 bits
  }

  /**
   * Generate a secure encryption key
   * Note: In production, use a proper key management system
   */
  generateKey() {
    // Use a default key for development (should be set via env in production)
    const defaultKey = crypto.createHash('sha256')
      .update('DMS-ENCRYPTION-KEY-CHANGE-IN-PRODUCTION')
      .digest();
    return defaultKey;
  }

  /**
   * Get the encryption key as a Buffer
   */
  getKey() {
    if (typeof this.encryptionKey === 'string') {
      return crypto.createHash('sha256').update(this.encryptionKey).digest();
    }
    return this.encryptionKey;
  }

  /**
   * Check if document encryption is enabled
   */
  async isEncryptionEnabled() {
    const settings = await securityService.getSecuritySettings();
    return settings.encryptDocuments || false;
  }

  /**
   * Encrypt a buffer (file content)
   * @param {Buffer} buffer - The data to encrypt
   * @returns {Buffer} - Encrypted data with IV and auth tag prepended
   */
  encryptBuffer(buffer) {
    const iv = crypto.randomBytes(this.ivLength);
    const key = this.getKey();
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv, {
      authTagLength: this.authTagLength
    });
    
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    // Prepend IV and auth tag to encrypted data
    // Format: [IV (16 bytes)][Auth Tag (16 bytes)][Encrypted Data]
    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt a buffer
   * @param {Buffer} encryptedBuffer - The encrypted data with IV and auth tag prepended
   * @returns {Buffer} - Decrypted data
   */
  decryptBuffer(encryptedBuffer) {
    // Extract IV, auth tag, and encrypted data
    const iv = encryptedBuffer.subarray(0, this.ivLength);
    const authTag = encryptedBuffer.subarray(this.ivLength, this.ivLength + this.authTagLength);
    const encrypted = encryptedBuffer.subarray(this.ivLength + this.authTagLength);
    
    const key = this.getKey();
    
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv, {
      authTagLength: this.authTagLength
    });
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  /**
   * Encrypt a file
   * @param {string} inputPath - Path to the original file
   * @param {string} outputPath - Path for the encrypted file (optional, defaults to inputPath + '.enc')
   * @returns {string} - Path to the encrypted file
   */
  async encryptFile(inputPath, outputPath = null) {
    const fileBuffer = await fs.readFile(inputPath);
    const encryptedBuffer = this.encryptBuffer(fileBuffer);
    
    const encryptedPath = outputPath || inputPath + '.enc';
    await fs.writeFile(encryptedPath, encryptedBuffer);
    
    return encryptedPath;
  }

  /**
   * Decrypt a file
   * @param {string} inputPath - Path to the encrypted file
   * @param {string} outputPath - Path for the decrypted file
   * @returns {string} - Path to the decrypted file
   */
  async decryptFile(inputPath, outputPath) {
    const encryptedBuffer = await fs.readFile(inputPath);
    const decryptedBuffer = this.decryptBuffer(encryptedBuffer);
    
    await fs.writeFile(outputPath, decryptedBuffer);
    
    return outputPath;
  }

  /**
   * Encrypt a file in place (replaces original with encrypted version)
   * Stores the original file extension in metadata
   * @param {string} filePath - Path to the file
   * @returns {object} - { encryptedPath, originalExtension }
   */
  async encryptFileInPlace(filePath) {
    const originalExtension = path.extname(filePath);
    const fileBuffer = await fs.readFile(filePath);
    const encryptedBuffer = this.encryptBuffer(fileBuffer);
    
    // Store encrypted file with .enc extension
    const encryptedPath = filePath + '.enc';
    await fs.writeFile(encryptedPath, encryptedBuffer);
    
    // Remove original file
    await fs.unlink(filePath);
    
    return {
      encryptedPath,
      originalExtension,
      isEncrypted: true
    };
  }

  /**
   * Decrypt a file to a temporary location for download
   * @param {string} encryptedPath - Path to the encrypted file
   * @param {string} originalFileName - Original filename with extension
   * @returns {string} - Path to the decrypted temporary file
   */
  async decryptToTemp(encryptedPath, originalFileName) {
    const encryptedBuffer = await fs.readFile(encryptedPath);
    const decryptedBuffer = this.decryptBuffer(encryptedBuffer);
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp', 'downloads');
    await fs.mkdir(tempDir, { recursive: true });
    
    // Create unique temp file
    const tempFileName = `${Date.now()}-${originalFileName}`;
    const tempPath = path.join(tempDir, tempFileName);
    
    await fs.writeFile(tempPath, decryptedBuffer);
    
    return tempPath;
  }

  /**
   * Decrypt buffer and return it (for streaming downloads)
   * @param {string} encryptedPath - Path to the encrypted file
   * @returns {Buffer} - Decrypted file buffer
   */
  async getDecryptedBuffer(encryptedPath) {
    const encryptedBuffer = await fs.readFile(encryptedPath);
    return this.decryptBuffer(encryptedBuffer);
  }

  /**
   * Check if a file is encrypted (has .enc extension)
   * @param {string} filePath 
   * @returns {boolean}
   */
  isFileEncrypted(filePath) {
    return filePath.endsWith('.enc');
  }

  /**
   * Encrypt string data (for sensitive text fields)
   * @param {string} text - Plain text to encrypt
   * @returns {string} - Base64 encoded encrypted string
   */
  encryptString(text) {
    const buffer = Buffer.from(text, 'utf8');
    const encrypted = this.encryptBuffer(buffer);
    return encrypted.toString('base64');
  }

  /**
   * Decrypt string data
   * @param {string} encryptedText - Base64 encoded encrypted string
   * @returns {string} - Decrypted plain text
   */
  decryptString(encryptedText) {
    const encryptedBuffer = Buffer.from(encryptedText, 'base64');
    const decrypted = this.decryptBuffer(encryptedBuffer);
    return decrypted.toString('utf8');
  }
}

module.exports = new EncryptionService();
