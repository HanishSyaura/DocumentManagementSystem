const notificationService = require('../services/notificationService');
const ResponseFormatter = require('../utils/responseFormatter');
const asyncHandler = require('../utils/asyncHandler');

class NotificationController {
  /**
   * Get user notifications
   * GET /api/notifications
   */
  getNotifications = asyncHandler(async (req, res) => {
    const { isRead, limit } = req.query;

    const notifications = await notificationService.getUserNotifications(
      req.user.id,
      { isRead, limit: limit ? parseInt(limit) : 50 }
    );

    return ResponseFormatter.success(
      res,
      { notifications },
      'Notifications retrieved successfully'
    );
  });

  /**
   * Get unread count
   * GET /api/notifications/unread-count
   */
  getUnreadCount = asyncHandler(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user.id);

    return ResponseFormatter.success(
      res,
      { count },
      'Unread count retrieved successfully'
    );
  });

  /**
   * Mark notification as read
   * PUT /api/notifications/:id/read
   */
  markAsRead = asyncHandler(async (req, res) => {
    const notificationId = parseInt(req.params.id);
    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return ResponseFormatter.validationError(res, [{ field: 'id', message: 'Invalid notification id' }]);
    }

    await notificationService.markAsRead(notificationId, req.user.id);

    return ResponseFormatter.success(
      res,
      null,
      'Notification marked as read'
    );
  });

  /**
   * Mark all as read
   * PUT /api/notifications/mark-all-read
   */
  markAllAsRead = asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.user.id);

    return ResponseFormatter.success(
      res,
      null,
      'All notifications marked as read'
    );
  });

  /**
   * Delete notification
   * DELETE /api/notifications/:id
   */
  deleteNotification = asyncHandler(async (req, res) => {
    const notificationId = parseInt(req.params.id);
    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return ResponseFormatter.validationError(res, [{ field: 'id', message: 'Invalid notification id' }]);
    }

    await notificationService.deleteNotification(notificationId, req.user.id);

    return ResponseFormatter.success(
      res,
      null,
      'Notification deleted successfully'
    );
  });

  /**
   * Delete all notifications
   * DELETE /api/notifications/all
   */
  clearAll = asyncHandler(async (req, res) => {
    const result = await notificationService.deleteAllNotifications(req.user.id);
    return ResponseFormatter.success(
      res,
      { deleted: result?.count ?? 0 },
      'All notifications deleted successfully'
    );
  });

  /**
   * Create a notification for the current user (optional API for frontend sync)
   * POST /api/notifications
   */
  createNotification = asyncHandler(async (req, res) => {
    const { type, title, message, link = null } = req.body || {};

    const errors = [];
    if (!type) errors.push({ field: 'type', message: 'Type is required' });
    if (!title) errors.push({ field: 'title', message: 'Title is required' });
    if (!message) errors.push({ field: 'message', message: 'Message is required' });
    if (errors.length) return ResponseFormatter.validationError(res, errors);

    const created = await notificationService.createNotification(req.user.id, type, title, message, link);
    return ResponseFormatter.success(res, { notification: created }, 'Notification created successfully', 201);
  });
}

module.exports = new NotificationController();
