const prisma = require('../config/database');
const config = require('../config/app');
const emailService = require('./emailService');
const configService = require('./configService');

class NotificationService {
  /**
   * Create in-app notification
   */
  async createNotification(userId, type, title, message, link = null) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link
      }
    });

    return notification;
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(userIds, type, title, message, link = null) {
    const notifications = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        link
      }))
    });

    return notifications;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, filters = {}) {
    const { isRead, limit = 50 } = filters;

    const where = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead === 'true' || isRead === true;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId
      }
    });
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId) {
    const result = await prisma.notification.deleteMany({
      where: {
        userId
      }
    });
    return result;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    return count;
  }

  /**
   * Notify about document submission
   */
  async notifyDocumentSubmitted(documentId, document) {
    // Get users with reviewer role
    const reviewers = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: 'reviewer'
            }
          }
        },
        status: 'ACTIVE'
      }
    });

    const title = 'New Document for Review';
    const message = `Document "${document.title}" (${document.fileCode}) has been submitted for review`;
    const link = `/documents/${documentId}`;

    await this.createBulkNotifications(
      reviewers.map(r => r.id),
      'REVIEW_REQUIRED',
      title,
      message,
      link
    );

    return reviewers.length;
  }

  /**
   * Notify about document approval needed
   */
  async notifyApprovalRequired(documentId, document) {
    // Get users with approver role
    const approvers = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: 'approver'
            }
          }
        },
        status: 'ACTIVE'
      }
    });

    const title = 'Document Needs Approval';
    const message = `Document "${document.title}" (${document.fileCode}) requires your approval`;
    const link = `/documents/${documentId}`;

    await this.createBulkNotifications(
      approvers.map(a => a.id),
      'APPROVAL_REQUIRED',
      title,
      message,
      link
    );

    return approvers.length;
  }

  /**
   * Notify about document acknowledgment needed
   */
  async notifyAcknowledgmentRequired(documentId, document) {
    // Get users with acknowledger role
    const acknowledgers = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: 'acknowledger'
            }
          }
        },
        status: 'ACTIVE'
      }
    });

    const title = 'Document Needs Acknowledgment';
    const message = `Document "${document.title}" (${document.fileCode}) requires your acknowledgment`;
    const link = `/documents/${documentId}`;

    await this.createBulkNotifications(
      acknowledgers.map(a => a.id),
      'ACKNOWLEDGMENT_REQUIRED',
      title,
      message,
      link
    );

    return acknowledgers.length;
  }

  /**
   * Notify document owner about status change
   */
  async notifyStatusChange(documentId, document, newStatus, userId = null) {
    const title = 'Document Status Updated';
    const message = `Your document "${document.title}" (${document.fileCode}) status changed to ${newStatus}`;
    const link = `/documents/${documentId}`;

    await this.createNotification(
      document.ownerId,
      'STATUS_CHANGED',
      title,
      message,
      link
    );

    // Also notify creator if different from owner
    if (document.createdById !== document.ownerId) {
      await this.createNotification(
        document.createdById,
        'STATUS_CHANGED',
        title,
        message,
        link
      );
    }
  }

  /**
   * Notify about document approval
   */
  async notifyDocumentApproved(documentId, document) {
    await this.notifyStatusChange(documentId, document, 'APPROVED');
  }

  /**
   * Notify about document rejection
   */
  async notifyDocumentRejected(documentId, document, reason) {
    const title = 'Document Rejected';
    const message = `Your document "${document.title}" (${document.fileCode}) has been rejected. Reason: ${reason}`;
    const link = `/documents/${documentId}`;

    await this.createNotification(
      document.ownerId,
      'DOCUMENT_REJECTED',
      title,
      message,
      link
    );

    if (document.createdById !== document.ownerId) {
      await this.createNotification(
        document.createdById,
        'DOCUMENT_REJECTED',
        title,
        message,
        link
      );
    }
  }

  /**
   * Notify about document return for amendments
   */
  async notifyDocumentReturned(documentId, document, comments) {
    const title = 'Document Returned for Amendments';
    const message = `Your document "${document.title}" (${document.fileCode}) has been returned. Comments: ${comments || 'None'}`;
    const link = `/documents/${documentId}`;

    await this.createNotification(
      document.ownerId,
      'DOCUMENT_RETURNED',
      title,
      message,
      link
    );
  }

  /**
   * Notify ALL users about document published
   * This is a broadcast notification to all active users
   */
  async notifyDocumentPublished(documentId, document) {
    // Get all active users
    const allUsers = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true }
    });

    const title = 'Document Published';
    const message = `Document "${document.title}" (${document.fileCode}) has been published`;
    const link = `/documents/${documentId}`;

    await this.createBulkNotifications(
      allUsers.map(u => u.id),
      'DOCUMENT_PUBLISHED',
      title,
      message,
      link
    );

    console.log(`[Notification] Published document notification sent to ${allUsers.length} users`);
    return allUsers.length;
  }

  /**
   * Notify ALL users about document superseded
   * This is a broadcast notification to all active users
   */
  async notifyDocumentSuperseded(documentId, document, supersedingDoc) {
    // Get all active users
    const allUsers = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true }
    });

    const title = 'Document Superseded';
    const message = `Document "${document.title}" (${document.fileCode}) has been superseded by ${supersedingDoc.fileCode}`;
    const link = `/documents/${documentId}`;

    await this.createBulkNotifications(
      allUsers.map(u => u.id),
      'DOCUMENT_SUPERSEDED',
      title,
      message,
      link
    );

    console.log(`[Notification] Superseded document notification sent to ${allUsers.length} users`);
    return allUsers.length;
  }

  /**
   * Notify ALL users about document obsolete
   * This is a broadcast notification to all active users
   */
  async notifyDocumentObsolete(documentId, document, reason) {
    // Get all active users
    const allUsers = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true }
    });

    const title = 'Document Marked Obsolete';
    const message = `Document "${document.title}" (${document.fileCode}) has been marked as obsolete. Reason: ${reason}`;
    const link = `/documents/${documentId}`;

    await this.createBulkNotifications(
      allUsers.map(u => u.id),
      'DOCUMENT_OBSOLETE',
      title,
      message,
      link
    );

    console.log(`[Notification] Obsolete document notification sent to ${allUsers.length} users`);
    return allUsers.length;
  }

  /**
   * Notify user when their NDR is acknowledged by admin
   * Only the user who created the request gets notified
   */
  async notifyNDRAcknowledged(documentId, document, acknowledgedBy) {
    const title = 'NDR Acknowledged';
    const message = `Your document request "${document.title}" (${document.fileCode}) has been acknowledged and assigned file code`;
    const link = `/documents/${documentId}`;

    // Notify only the document owner (the user who created the NDR)
    await this.createNotification(
      document.ownerId,
      'STATUS_CHANGED',
      title,
      message,
      link
    );

    console.log(`[Notification] NDR acknowledged notification sent to user ${document.ownerId}`);
  }

  /**
   * Notify user when document is returned to them for amendments
   * Only the document owner gets notified
   */
  async notifyDocumentReturnedToOwner(documentId, document, returnedBy, comments) {
    const title = 'Document Returned for Amendments';
    const message = `Your document "${document.title}" (${document.fileCode}) has been returned. ${comments ? 'Comments: ' + comments : 'Please make necessary amendments.'}`;
    const link = `/documents/${documentId}`;

    // Notify only the document owner
    await this.createNotification(
      document.ownerId,
      'DOCUMENT_RETURNED',
      title,
      message,
      link
    );

    console.log(`[Notification] Document returned notification sent to owner ${document.ownerId}`);
  }

  /**
   * Notify user when their document is approved
   * Only the document owner gets notified
   */
  async notifyOwnerDocumentApproved(documentId, document, approvedBy) {
    const title = 'Document Approved';
    const message = `Your document "${document.title}" (${document.fileCode}) has been approved!`;
    const link = `/documents/${documentId}`;

    // Notify only the document owner
    await this.createNotification(
      document.ownerId,
      'DOCUMENT_APPROVED',
      title,
      message,
      link
    );

    console.log(`[Notification] Document approved notification sent to owner ${document.ownerId}`);
  }

  /**
   * Notify user when their document is rejected
   * Only the document owner gets notified
   */
  async notifyOwnerDocumentRejected(documentId, document, rejectedBy, reason) {
    const title = 'Document Rejected';
    const message = `Your document "${document.title}" (${document.fileCode}) has been rejected. ${reason ? 'Reason: ' + reason : ''}`;
    const link = `/documents/${documentId}`;

    // Notify only the document owner
    await this.createNotification(
      document.ownerId,
      'DOCUMENT_REJECTED',
      title,
      message,
      link
    );

    console.log(`[Notification] Document rejected notification sent to owner ${document.ownerId}`);
  }

  /**
   * Notify specific assigned approver (not all approvers)
   */
  async notifySpecificUserApprovalRequired(approverId, documentId, document) {
    const title = 'Document Needs Your Approval';
    const message = `Document "${document.title}" (${document.fileCode}) has been assigned to you for approval`;
    const link = `/documents/${documentId}`;

    await this.createNotification(
      approverId,
      'APPROVAL_REQUIRED',
      title,
      message,
      link
    );

    console.log(`[Notification] Approval request sent to specific approver ${approverId}`);
  }

  /**
   * Notify specific assigned reviewer (not all reviewers)
   */
  async notifySpecificUserReviewRequired(reviewerId, documentId, document) {
    const title = 'Document Assigned for Review';
    const message = `Document "${document.title}" (${document.fileCode}) has been assigned to you for review`;
    const link = `/documents/${documentId}`;

    await this.createNotification(
      reviewerId,
      'REVIEW_REQUIRED',
      title,
      message,
      link
    );

    console.log(`[Notification] Review request sent to specific reviewer ${reviewerId}`);
  }

  /**
   * Notify document owner when document is reviewed and forwarded
   */
  async notifyOwnerDocumentReviewed(documentId, document, reviewedBy) {
    const title = 'Document Reviewed';
    const message = `Your document "${document.title}" (${document.fileCode}) has been reviewed and forwarded for approval`;
    const link = `/documents/${documentId}`;

    await this.createNotification(
      document.ownerId,
      'STATUS_CHANGED',
      title,
      message,
      link
    );

    console.log(`[Notification] Review completion notification sent to owner ${document.ownerId}`);
  }

  /**
   * Notify approver when document has been reviewed (assigned to them)
   */
  async notifyApproverDocumentReady(approverId, documentId, document) {
    const title = 'Document Ready for Your Approval';
    const message = `Document "${document.title}" (${document.fileCode}) has been reviewed and is ready for your approval`;
    const link = `/documents/${documentId}`;

    await this.createNotification(
      approverId,
      'APPROVAL_REQUIRED',
      title,
      message,
      link
    );

    console.log(`[Notification] Document ready notification sent to approver ${approverId}`);
  }

  /**
   * Clean up old notifications
   */
  async cleanupOldNotifications(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        isRead: true
      }
    });
  }

  /**
   * Get notification preferences from settings
   */
  async getNotificationPreferences() {
    try {
      const settings = await configService.getNotificationSettings();
      return settings.notifications || {};
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      return {};
    }
  }

  /**
   * Send notification (in-app and/or email based on preferences)
   */
  async sendNotification(userId, type, title, message, link, emailData = null) {
    const preferences = await this.getNotificationPreferences();
    const eventPreference = preferences[type] || { email: false, inApp: true };

    // Send in-app notification
    if (eventPreference.inApp) {
      await this.createNotification(userId, type, title, message, link);
    }

    // Send email notification
    if (eventPreference.email && emailData) {
      try {
        // Get user email
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true }
        });

        if (user && user.email) {
          await emailService.sendNotificationEmail(user.email, type, emailData);
        }
      } catch (error) {
        console.error(`Failed to send email notification for ${type}:`, error);
      }
    }
  }

  /**
   * Send bulk notifications (in-app and/or email based on preferences)
   */
  async sendBulkNotifications(userIds, type, title, message, link, emailData = null) {
    console.log(`[NotificationService] sendBulkNotifications called for type: ${type}, users: ${userIds.length}`);
    
    const preferences = await this.getNotificationPreferences();
    console.log(`[NotificationService] Notification preferences for ${type}:`, preferences[type]);
    
    const eventPreference = preferences[type] || { email: false, inApp: true };
    console.log(`[NotificationService] Using preference:`, eventPreference);

    // Send in-app notifications
    if (eventPreference.inApp) {
      console.log(`[NotificationService] Creating in-app notifications for ${userIds.length} users`);
      await this.createBulkNotifications(userIds, type, title, message, link);
      console.log(`[NotificationService] In-app notifications created successfully`);
    } else {
      console.log(`[NotificationService] In-app notifications disabled for ${type}`);
    }

    // Send email notifications
    if (eventPreference.email && emailData) {
      console.log(`[NotificationService] Sending email notifications`);
      try {
        // Get user emails
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { email: true }
        });

        for (const user of users) {
          if (user.email) {
            try {
              await emailService.sendNotificationEmail(user.email, type, emailData);
            } catch (error) {
              console.error(`Failed to send email to ${user.email}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to send bulk email notifications for ${type}:`, error);
      }
    } else {
      console.log(`[NotificationService] Email notifications not sent: email=${eventPreference.email}, hasEmailData=${!!emailData}`);
    }
  }

  /**
   * Notify about document submission with email support
   */
  async notifyDocumentSubmittedWithEmail(documentId, document) {
    console.log(`[NotificationService] notifyDocumentSubmittedWithEmail called for document ${documentId}`);
    
    const reviewers = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: 'reviewer'
            }
          }
        },
        status: 'ACTIVE'
      }
    });

    console.log(`[NotificationService] Found ${reviewers.length} active reviewers:`, reviewers.map(r => r.email));

    if (reviewers.length === 0) {
      console.log(`[NotificationService] No reviewers found, skipping notification`);
      return 0;
    }

    const title = 'New Document for Review';
    const message = `Document "${document.title}" (${document.fileCode}) has been submitted for review`;
    const link = `/documents/${documentId}`;

    const emailData = {
      title: document.title,
      fileCode: document.fileCode,
      submittedBy: document.owner ? `${document.owner.firstName} ${document.owner.lastName}` : 'Unknown',
      link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}${link}`
    };

    await this.sendBulkNotifications(
      reviewers.map(r => r.id),
      'documentSubmitted',
      title,
      message,
      link,
      emailData
    );

    return reviewers.length;
  }

  /**
   * Send email notification directly (for backward compatibility)
   */
  async sendEmailNotification(to, subject, html) {
    try {
      await emailService.sendEmail({ to, subject, html });
      return { sent: true };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { sent: false, reason: error.message };
    }
  }
}

module.exports = new NotificationService();
