/**
 * Simple Logger Utility
 * For structured logging across the application
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

class Logger {
  static log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    // In production, you might want to send this to a logging service
    console.log(JSON.stringify(logEntry));
  }

  static error(message, meta = {}) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  static warn(message, meta = {}) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  static info(message, meta = {}) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  static debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.log(LOG_LEVELS.DEBUG, message, meta);
    }
  }
}

module.exports = Logger;
