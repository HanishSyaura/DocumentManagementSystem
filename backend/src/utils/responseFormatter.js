/**
 * Response Formatter Utility
 * Provides consistent response structure across all API endpoints
 */

class ResponseFormatter {
  /**
   * Success response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  /**
   * Error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {*} errors - Additional error details
   */
  static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Validation error response
   * @param {Object} res - Express response object
   * @param {Array} errors - Validation errors array
   */
  static validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  /**
   * Not found response
   * @param {Object} res - Express response object
   * @param {string} resource - Resource name
   */
  static notFound(res, resource = 'Resource') {
    return res.status(404).json({
      success: false,
      message: `${resource} not found`
    });
  }

  /**
   * Unauthorized response
   * @param {Object} res - Express response object
   * @param {string} message - Custom message
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return res.status(401).json({
      success: false,
      message
    });
  }

  /**
   * Forbidden response
   * @param {Object} res - Express response object
   * @param {string} message - Custom message
   */
  static forbidden(res, message = 'Access forbidden') {
    return res.status(403).json({
      success: false,
      message
    });
  }

  /**
   * Paginated response
   * @param {Object} res - Express response object
   * @param {Array} data - Data array
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} total - Total items count
   * @param {string} message - Success message
   */
  static paginated(res, data, page, limit, total, message = 'Success') {
    const totalPages = Math.ceil(total / limit);
    
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        currentPage: page,
        totalPages,
        itemsPerPage: limit,
        totalItems: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  }
}

module.exports = ResponseFormatter;
