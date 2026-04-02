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

    await notificationService.deleteNotification(notificationId, req.user.id);

    return ResponseFormatter.success(
      res,
      null,
      'Notification deleted successfully'
    );
  });
}

module.exports = new NotificationController();
