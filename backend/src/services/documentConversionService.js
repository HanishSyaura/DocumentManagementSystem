const fs = require('fs');
const path = require('path');

/**
 * Document Conversion Service
 * Handles file metadata and preview information for Office documents
 */
class DocumentConversionService {
  /**
   * Get file metadata
   * @param {string} filePath - Path to the file
   * @returns {Object} - File metadata
   */
  getFileMetadata(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      return {
        fileName: path.basename(filePath),
        extension: ext,
        size: stats.size,
        sizeFormatted: this.formatFileSize(stats.size),
        modified: stats.mtime,
        isSupported: this.isSupportedFormat(filePath)
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }

  /**
   * Format file size to human readable format
   * @param {number} bytes
   * @returns {string}
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Check if file type is supported for preview
   * @param {string} filePath
   * @returns {boolean}
   */
  isSupportedFormat(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const supportedFormats = ['.docx', '.dotx', '.xlsx', '.csv', '.pptx', '.doc', '.xls', '.ppt'];
    return supportedFormats.includes(ext);
  }

  /**
   * Get file type icon and color
   * @param {string} filePath
   * @returns {Object}
   */
  getFileTypeInfo(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    const typeMap = {
      '.docx': { type: 'Word Document', icon: 'word', color: 'blue' },
      '.dotx': { type: 'Word Template', icon: 'word', color: 'blue' },
      '.doc': { type: 'Word Document', icon: 'word', color: 'blue' },
      '.xlsx': { type: 'Excel Spreadsheet', icon: 'excel', color: 'green' },
      '.csv': { type: 'CSV File', icon: 'excel', color: 'green' },
      '.xls': { type: 'Excel Spreadsheet', icon: 'excel', color: 'green' },
      '.pptx': { type: 'PowerPoint Presentation', icon: 'powerpoint', color: 'orange' },
      '.ppt': { type: 'PowerPoint Presentation', icon: 'powerpoint', color: 'orange' }
    };

    return typeMap[ext] || { type: 'Document', icon: 'file', color: 'gray' };
  }
}

module.exports = new DocumentConversionService();
