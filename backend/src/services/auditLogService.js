const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Audit Log Service
 * Provides system-wide activity logging capabilities
 */
class AuditLogService {
  /**
   * Log an activity
   * @param {Object} params - Log parameters
   * @param {number} params.userId - User ID (optional for system actions)
   * @param {string} params.action - Action type (e.g., 'LOGIN', 'CREATE', 'UPDATE', 'DELETE')
   * @param {string} params.entity - Entity type (e.g., 'Document', 'User', 'Workflow')
   * @param {number} params.entityId - ID of the affected entity
   * @param {string} params.description - Human-readable description
   * @param {Object} params.metadata - Additional data (old values, new values, etc.)
   * @param {string} params.ipAddress - Client IP address
   * @param {string} params.userAgent - Client user agent
   * @param {boolean} params.skipSettingsCheck - Skip checking if event tracking is enabled (for critical events)
   */
  async log({
    userId = null,
    action,
    entity = null,
    entityId = null,
    description = null,
    metadata = null,
    ipAddress = null,
    userAgent = null,
    skipSettingsCheck = false
  }) {
    try {
      // Check if this event type should be logged based on settings
      if (!skipSettingsCheck) {
        const auditSettingsService = require('./auditSettingsService');
        const shouldLog = await auditSettingsService.shouldLogEvent(entity, action);
        if (!shouldLog) {
          return null; // Event tracking disabled for this type
        }
      }

      const log = await prisma.auditLog.create({
        data: {
          userId,
          action,
          entity,
          entityId,
          description,
          metadata: metadata ? JSON.stringify(metadata) : null,
          ipAddress,
          userAgent
        }
      });
      return log;
    } catch (error) {
      console.error('[AuditLogService] Failed to create audit log:', error);
      // Don't throw - logging failures shouldn't break the main flow
      return null;
    }
  }

  /**
   * Log user authentication events
   */
  async logAuth(userId, action, req, metadata = {}) {
    const description = this.getAuthDescription(action, metadata);
    return this.log({
      userId,
      action,
      entity: 'Auth',
      description,
      metadata,
      ipAddress: this.getClientIP(req),
      userAgent: req?.headers?.['user-agent']
    });
  }

  /**
   * Log document-related actions
   */
  async logDocument(userId, action, document, req, metadata = {}) {
    const description = this.getDocumentDescription(action, document, metadata);
    return this.log({
      userId,
      action,
      entity: 'Document',
      entityId: document?.id,
      description,
      metadata: {
        fileCode: document?.fileCode,
        title: document?.title,
        ...metadata
      },
      ipAddress: this.getClientIP(req),
      userAgent: req?.headers?.['user-agent']
    });
  }

  /**
   * Log user management actions
   */
  async logUser(performedById, action, targetUser, req, metadata = {}) {
    const description = this.getUserDescription(action, targetUser, metadata);
    return this.log({
      userId: performedById,
      action,
      entity: 'User',
      entityId: targetUser?.id,
      description,
      metadata: {
        targetEmail: targetUser?.email,
        targetName: `${targetUser?.firstName || ''} ${targetUser?.lastName || ''}`.trim(),
        ...metadata
      },
      ipAddress: this.getClientIP(req),
      userAgent: req?.headers?.['user-agent']
    });
  }

  /**
   * Log workflow actions
   */
  async logWorkflow(userId, action, document, req, metadata = {}) {
    const description = this.getWorkflowDescription(action, document, metadata);
    return this.log({
      userId,
      action,
      entity: 'Workflow',
      entityId: document?.id,
      description,
      metadata: {
        fileCode: document?.fileCode,
        title: document?.title,
        stage: document?.stage,
        status: document?.status,
        ...metadata
      },
      ipAddress: this.getClientIP(req),
      userAgent: req?.headers?.['user-agent']
    });
  }

  /**
   * Log system/configuration changes
   */
  async logSystem(userId, action, entity, req, metadata = {}) {
    return this.log({
      userId,
      action,
      entity: entity || 'System',
      description: metadata.description || `${action} on ${entity}`,
      metadata,
      ipAddress: this.getClientIP(req),
      userAgent: req?.headers?.['user-agent']
    });
  }

  /**
   * Get audit logs with filters
   */
  async getLogs({
    userId,
    entity,
    action,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 50
  }) {
    const where = {};

    if (userId) {
      where.userId = parseInt(userId);
    }

    if (entity && entity !== 'all') {
      where.entity = entity;
    }

    if (action && action !== 'all') {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { entity: { contains: search } },
        { action: { contains: search } }
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs: logs.map(log => ({
        id: log.id,
        timestamp: log.createdAt,
        user: log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email : 'System',
        userId: log.userId,
        module: log.entity || 'System',
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        description: log.description,
        metadata: log.metadata ? (typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata) : null,
        ipAddress: log.ipAddress,
        status: 'Success' // All logged actions are successful
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get available filter options
   */
  async getFilterOptions() {
    const [entities, actions, users] = await Promise.all([
      prisma.auditLog.findMany({
        distinct: ['entity'],
        select: { entity: true },
        where: { entity: { not: null } }
      }),
      prisma.auditLog.findMany({
        distinct: ['action'],
        select: { action: true }
      }),
      prisma.user.findMany({
        select: { id: true, email: true, firstName: true, lastName: true },
        where: { status: 'ACTIVE' }
      })
    ]);

    return {
      modules: entities.map(e => e.entity).filter(Boolean),
      actions: actions.map(a => a.action).filter(Boolean),
      users: users.map(u => ({
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email
      }))
    };
  }

  // Helper methods
  getClientIP(req) {
    const { getClientIp } = require('../utils/clientIp')
    return getClientIp(req) || null
  }

  getAuthDescription(action, metadata) {
    switch (action) {
      case 'LOGIN':
        return metadata?.twoFactorVerified 
          ? `User logged in successfully (2FA verified)`
          : `User logged in successfully`;
      case 'LOGOUT':
        return `User logged out`;
      case 'LOGIN_FAILED':
        return `Failed login attempt: ${metadata.reason || 'Invalid credentials'}`;
      case 'PASSWORD_CHANGE':
        return `Password changed successfully`;
      case 'PASSWORD_RESET':
        return `Password reset requested`;
      case 'TWO_FACTOR_INITIATED':
        return `Two-factor authentication initiated - verification code sent to ${metadata?.email || 'email'}`;
      case 'TWO_FACTOR_FAILED':
        return `Two-factor authentication failed: ${metadata?.error || 'Invalid code'}`;
      case 'TWO_FACTOR_SUCCESS':
        return `Two-factor authentication verified successfully`;
      case 'ACCOUNT_LOCKED':
        return `Account locked due to too many failed login attempts`;
      case 'ACCOUNT_UNLOCKED':
        return `Account unlocked`;
      default:
        return `Authentication action: ${action}`;
    }
  }

  getDocumentDescription(action, document, metadata) {
    const fileCode = document?.fileCode || 'Unknown';
    const title = document?.title || '';
    
    switch (action) {
      case 'CREATE':
        return `Created document request: ${title}`;
      case 'UPDATE':
        return `Updated document: ${fileCode}`;
      case 'DELETE':
        return `Deleted document: ${fileCode}`;
      case 'UPLOAD':
        return `Uploaded file to document: ${fileCode}`;
      case 'DRAFT_UPLOAD':
        return `Uploaded draft document: ${fileCode}`;
      case 'DOWNLOAD':
        return `Downloaded document: ${fileCode}`;
      case 'VIEW':
        return `Viewed document: ${fileCode}`;
      case 'ACKNOWLEDGE':
        return `Acknowledged document request: ${fileCode}`;
      case 'REJECT':
        return `Rejected document request: ${fileCode}`;
      case 'VERSION_REQUEST':
        return `Created version request for document: ${fileCode}`;
      case 'VERSION_ACKNOWLEDGE':
        return `Acknowledged version request for document: ${fileCode}`;
      case 'VERSION_REVIEW_APPROVE':
        return `Approved version request review for document: ${fileCode}`;
      case 'VERSION_REVIEW_REJECT':
        return `Rejected version request review for document: ${fileCode}`;
      case 'VERSION_FINAL_APPROVE':
        return `Final approved version request for document: ${fileCode}`;
      case 'VERSION_REJECT':
        return `Rejected version request for document: ${fileCode}`;
      default:
        return `${action} on document: ${fileCode}`;
    }
  }

  getUserDescription(action, targetUser, metadata) {
    const userName = `${targetUser?.firstName || ''} ${targetUser?.lastName || ''}`.trim() || targetUser?.email || 'Unknown';
    
    switch (action) {
      case 'CREATE':
        return `Created user account: ${userName}`;
      case 'UPDATE':
        return `Updated user profile: ${userName}`;
      case 'DELETE':
        return `Deleted user account: ${userName}`;
      case 'ACTIVATE':
        return `Activated user account: ${userName}`;
      case 'DEACTIVATE':
        return `Deactivated user account: ${userName}`;
      case 'ROLE_ASSIGN':
        return `Assigned role to user: ${userName}`;
      case 'ROLE_REMOVE':
        return `Removed role from user: ${userName}`;
      default:
        return `${action} on user: ${userName}`;
    }
  }

  getWorkflowDescription(action, document, metadata) {
    const fileCode = document?.fileCode || 'Unknown';
    
    switch (action) {
      case 'SUBMIT_FOR_REVIEW':
        return `Submitted document for review: ${fileCode}`;
      case 'REVIEW_APPROVE':
        return `Approved review for document: ${fileCode}`;
      case 'REVIEW_RETURN':
        return `Returned document for amendments: ${fileCode}`;
      case 'FIRST_APPROVE':
        return `First approval completed for document: ${fileCode}`;
      case 'FIRST_RETURN':
        return `Returned document from first approval: ${fileCode}`;
      case 'SECOND_APPROVE':
        return `Second approval completed for document: ${fileCode}`;
      case 'SECOND_RETURN':
        return `Returned document from second approval: ${fileCode}`;
      case 'APPROVE':
        return `Approved document: ${fileCode}`;
      case 'REJECT':
        return `Rejected document: ${fileCode}`;
      case 'PUBLISH':
        return `Published document: ${fileCode}`;
      case 'SUPERSEDE':
        return `Superseded document: ${fileCode}`;
      case 'OBSOLETE':
        return `Marked document as obsolete: ${fileCode}`;
      case 'ARCHIVE':
        return `Archived document: ${fileCode}`;
      case 'SUPERSEDE_REQUEST':
        return `Created supersede/obsolete request for document: ${fileCode}`;
      case 'SUPERSEDE_REVIEW_APPROVE':
        return `Approved supersede/obsolete request review for document: ${fileCode}`;
      case 'SUPERSEDE_REVIEW_REJECT':
        return `Rejected supersede/obsolete request review for document: ${fileCode}`;
      case 'SUPERSEDE_FINAL_APPROVE':
        return `Final approved supersede/obsolete request for document: ${fileCode}`;
      case 'SUPERSEDE_REJECT':
        return `Rejected supersede/obsolete request for document: ${fileCode}`;
      default:
        return `${action} workflow action on: ${fileCode}`;
    }
  }
}

module.exports = new AuditLogService();
