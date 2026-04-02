const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const workflowService = require('./workflowService');

class SupersedeRequestService {
  /**
   * Create a new supersede/obsolete request
   */
  async createRequest(documentId, actionType, reason, supersedingDocId, userId) {
    // Validate document exists and is published
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        documentType: true,
        owner: true
      }
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    if (document.status !== 'PUBLISHED') {
      throw new BadRequestError('Can only supersede/obsolete published documents');
    }

    // Check if there's already a pending request for this document
    const existingRequest = await prisma.supersedeObsoleteRequest.findFirst({
      where: {
        documentId,
        status: {
          in: ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL', 'IN_APPROVAL']
        }
      }
    });

    if (existingRequest) {
      throw new BadRequestError('There is already a pending request for this document');
    }

    // If SUPERSEDE, validate superseding document
    if (actionType === 'SUPERSEDE') {
      if (!supersedingDocId) {
        throw new BadRequestError('Superseding document ID is required for SUPERSEDE action');
      }

      const supersedingDoc = await prisma.document.findUnique({
        where: { id: supersedingDocId }
      });

      if (!supersedingDoc) {
        throw new NotFoundError('Superseding document not found');
      }

      if (supersedingDoc.status !== 'PUBLISHED') {
        throw new BadRequestError('Superseding document must be published');
      }
    }

    // Create the request
    const request = await prisma.supersedeObsoleteRequest.create({
      data: {
        documentId,
        actionType,
        supersedingDocId,
        reason,
        requestedById: userId,
        status: 'PENDING_REVIEW',
        stage: 'REVIEW'
      },
      include: {
        document: {
          include: {
            documentType: true
          }
        },
        supersedingDoc: true,
        requestedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return request;
  }

  /**
   * List supersede/obsolete requests with filters
   */
  async listRequests(filters = {}, pagination = {}) {
    const {
      status,
      actionType,
      requestedById,
      documentId,
      search
    } = filters;

    const {
      page = 1,
      limit = 15,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (status) where.status = status;
    if (actionType) where.actionType = actionType;
    if (requestedById) where.requestedById = requestedById;
    if (documentId) where.documentId = documentId;

    if (search) {
      where.OR = [
        { document: { fileCode: { contains: search } } },
        { document: { title: { contains: search } } },
        { reason: { contains: search } }
      ];
    }

    // Get total count
    const total = await prisma.supersedeObsoleteRequest.count({ where });

    // Get requests
    const requests = await prisma.supersedeObsoleteRequest.findMany({
      where,
      include: {
        document: {
          include: {
            documentType: true,
            owner: true,
            approvalHistory: {
              where: { action: 'ARCHIVED' },
              take: 1
            }
          }
        },
        supersedingDoc: {
          include: {
            documentType: true
          }
        },
        requestedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        rejectedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    });

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single request by ID
   */
  async getRequest(requestId) {
    const request = await prisma.supersedeObsoleteRequest.findUnique({
      where: { id: requestId },
      include: {
        document: {
          include: {
            documentType: true,
            owner: true,
            versions: {
              orderBy: { uploadedAt: 'desc' },
              take: 1
            }
          }
        },
        supersedingDoc: {
          include: {
            documentType: true
          }
        },
        requestedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        rejectedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!request) {
      throw new NotFoundError('Request not found');
    }

    return request;
  }

  /**
   * Review a request (approve to move to approval stage or reject)
   */
  async reviewRequest(requestId, userId, action, comments) {
    const request = await this.getRequest(requestId);

    if (request.status !== 'PENDING_REVIEW' && request.status !== 'IN_REVIEW') {
      throw new BadRequestError('Request is not in review stage');
    }

    if (action === 'approve') {
      // Move to approval stage
      const updated = await prisma.supersedeObsoleteRequest.update({
        where: { id: requestId },
        data: {
          status: 'PENDING_APPROVAL',
          stage: 'APPROVAL',
          reviewedById: userId,
          reviewedAt: new Date(),
          reviewComments: comments
        },
        include: {
          document: true,
          requestedBy: true
        }
      });

      return updated;
    } else if (action === 'reject') {
      // Reject the request
      const updated = await prisma.supersedeObsoleteRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          stage: 'COMPLETED',
          rejectedById: userId,
          rejectedAt: new Date(),
          rejectionReason: comments || 'Rejected during review'
        },
        include: {
          document: true,
          requestedBy: true
        }
      });

      return updated;
    } else {
      throw new BadRequestError('Invalid action. Must be "approve" or "reject"');
    }
  }

  /**
   * Approve a request (final approval - marks document as obsolete/superseded)
   */
  async approveRequest(requestId, userId, comments) {
    const request = await this.getRequest(requestId);

    if (request.status !== 'PENDING_APPROVAL' && request.status !== 'IN_APPROVAL') {
      throw new BadRequestError('Request is not in approval stage');
    }

    // Update request status
    const updated = await prisma.supersedeObsoleteRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        stage: 'COMPLETED',
        approvedById: userId,
        approvedAt: new Date(),
        approvalComments: comments
      },
      include: {
        document: true,
        supersedingDoc: true,
        requestedBy: true
      }
    });

    // Now mark the document as obsolete or superseded
    if (updated.actionType === 'OBSOLETE') {
      await workflowService.markAsObsolete(
        updated.documentId,
        userId,
        updated.reason
      );
    } else if (updated.actionType === 'SUPERSEDE') {
      await workflowService.markAsSuperseded(
        updated.documentId,
        updated.supersedingDocId,
        userId,
        updated.reason
      );
    }

    return updated;
  }

  /**
   * Reject a request at approval stage
   */
  async rejectRequest(requestId, userId, reason) {
    const request = await this.getRequest(requestId);

    if (request.status === 'APPROVED' || request.status === 'REJECTED') {
      throw new BadRequestError('Request has already been finalized');
    }

    const updated = await prisma.supersedeObsoleteRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        stage: 'COMPLETED',
        rejectedById: userId,
        rejectedAt: new Date(),
        rejectionReason: reason
      },
      include: {
        document: true,
        requestedBy: true
      }
    });

    return updated;
  }

  /**
   * Delete a request (only if not yet approved)
   */
  async deleteRequest(requestId, userId) {
    const request = await this.getRequest(requestId);

    if (request.status === 'APPROVED') {
      throw new BadRequestError('Cannot delete an approved request');
    }

    // Only requester or admin can delete
    if (request.requestedById !== userId) {
      throw new ForbiddenError('Only the requester can delete this request');
    }

    await prisma.supersedeObsoleteRequest.delete({
      where: { id: requestId }
    });

    return true;
  }
}

module.exports = new SupersedeRequestService();
