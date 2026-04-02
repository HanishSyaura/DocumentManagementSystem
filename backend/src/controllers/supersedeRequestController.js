const supersedeRequestService = require('../services/supersedeRequestService');
const auditLogService = require('../services/auditLogService');
const ResponseFormatter = require('../utils/responseFormatter');
const asyncHandler = require('../utils/asyncHandler');

class SupersedeRequestController {
  /**
   * Create a new supersede/obsolete request
   * POST /api/supersede-requests
   */
  createRequest = asyncHandler(async (req, res) => {
    const { documentId, actionType, reason, supersedingDocId } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!documentId || !actionType || !reason) {
      return ResponseFormatter.error(res, 'Missing required fields', 400);
    }

    if (!['SUPERSEDE', 'OBSOLETE'].includes(actionType)) {
      return ResponseFormatter.error(res, 'Invalid action type. Must be SUPERSEDE or OBSOLETE', 400);
    }

    const request = await supersedeRequestService.createRequest(
      parseInt(documentId),
      actionType,
      reason,
      supersedingDocId ? parseInt(supersedingDocId) : null,
      userId
    );

    // Log supersede/obsolete request creation
    await auditLogService.logWorkflow(userId, 'SUPERSEDE_REQUEST', request.document, req, {
      requestId: request.id,
      actionType,
      reason
    });

    return ResponseFormatter.success(
      res,
      { request },
      'Supersede/Obsolete request created successfully',
      201
    );
  });

  /**
   * List all supersede/obsolete requests
   * GET /api/supersede-requests
   */
  listRequests = asyncHandler(async (req, res) => {
    const { status, actionType, search, page, limit, sortBy, sortOrder } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (actionType) filters.actionType = actionType;
    if (search) filters.search = search;

    const pagination = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 15,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };

    const result = await supersedeRequestService.listRequests(filters, pagination);

    // Format for frontend
    const requests = result.requests.map(req => ({
      id: req.id,
      fileCode: req.document.fileCode,
      title: req.document.title,
      documentType: req.document.documentType?.name || '',
      version: req.document.version,
      actionType: req.actionType === 'OBSOLETE' ? 'Obsolete' : 'Supersede',
      reason: req.reason,
      requestedBy: req.requestedBy ? `${req.requestedBy.firstName || ''} ${req.requestedBy.lastName || ''}`.trim() || req.requestedBy.email : '',
      status: this.formatStatus(req.status),
      rawStatus: req.status,
      stage: req.stage,
      isArchived: req.document.approvalHistory && req.document.approvalHistory.length > 0,
      createdAt: req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-GB') : '',
      reviewedBy: req.reviewedBy ? `${req.reviewedBy.firstName || ''} ${req.reviewedBy.lastName || ''}`.trim() || req.reviewedBy.email : null,
      reviewedAt: req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString('en-GB') : null,
      approvedBy: req.approvedBy ? `${req.approvedBy.firstName || ''} ${req.approvedBy.lastName || ''}`.trim() || req.approvedBy.email : null,
      approvedAt: req.approvedAt ? new Date(req.approvedAt).toLocaleDateString('en-GB') : null,
      rejectedBy: req.rejectedBy ? `${req.rejectedBy.firstName || ''} ${req.rejectedBy.lastName || ''}`.trim() || req.rejectedBy.email : null,
      rejectedAt: req.rejectedAt ? new Date(req.rejectedAt).toLocaleDateString('en-GB') : null,
      rejectionReason: req.rejectionReason,
      supersedingDoc: req.supersedingDoc ? {
        fileCode: req.supersedingDoc.fileCode,
        title: req.supersedingDoc.title
      } : null
    }));

    return ResponseFormatter.success(
      res,
      { 
        requests,
        pagination: result.pagination
      },
      'Requests retrieved successfully'
    );
  });

  /**
   * Get a single request by ID
   * GET /api/supersede-requests/:id
   */
  getRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const request = await supersedeRequestService.getRequest(parseInt(id));

    // Format for frontend
    const formatted = {
      id: request.id,
      document: {
        id: request.document.id,
        fileCode: request.document.fileCode,
        title: request.document.title,
        documentType: request.document.documentType?.name || '',
        version: request.document.version,
        status: request.document.status,
        owner: request.document.owner ? `${request.document.owner.firstName || ''} ${request.document.owner.lastName || ''}`.trim() || request.document.owner.email : ''
      },
      actionType: request.actionType,
      reason: request.reason,
      status: this.formatStatus(request.status),
      rawStatus: request.status,
      stage: request.stage,
      requestedBy: request.requestedBy ? {
        id: request.requestedBy.id,
        name: `${request.requestedBy.firstName || ''} ${request.requestedBy.lastName || ''}`.trim() || request.requestedBy.email,
        email: request.requestedBy.email
      } : null,
      reviewedBy: request.reviewedBy ? {
        id: request.reviewedBy.id,
        name: `${request.reviewedBy.firstName || ''} ${request.reviewedBy.lastName || ''}`.trim() || request.reviewedBy.email,
        email: request.reviewedBy.email
      } : null,
      reviewedAt: request.reviewedAt,
      reviewComments: request.reviewComments,
      approvedBy: request.approvedBy ? {
        id: request.approvedBy.id,
        name: `${request.approvedBy.firstName || ''} ${request.approvedBy.lastName || ''}`.trim() || request.approvedBy.email,
        email: request.approvedBy.email
      } : null,
      approvedAt: request.approvedAt,
      approvalComments: request.approvalComments,
      rejectedBy: request.rejectedBy ? {
        id: request.rejectedBy.id,
        name: `${request.rejectedBy.firstName || ''} ${request.rejectedBy.lastName || ''}`.trim() || request.rejectedBy.email,
        email: request.rejectedBy.email
      } : null,
      rejectedAt: request.rejectedAt,
      rejectionReason: request.rejectionReason,
      supersedingDoc: request.supersedingDoc ? {
        id: request.supersedingDoc.id,
        fileCode: request.supersedingDoc.fileCode,
        title: request.supersedingDoc.title,
        documentType: request.supersedingDoc.documentType?.name || ''
      } : null,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    };

    return ResponseFormatter.success(
      res,
      { request: formatted },
      'Request retrieved successfully'
    );
  });

  /**
   * Review a request
   * POST /api/supersede-requests/:id/review
   */
  reviewRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action, comments } = req.body;
    const userId = req.user.id;

    if (!action || !['approve', 'reject'].includes(action)) {
      return ResponseFormatter.error(res, 'Invalid action. Must be "approve" or "reject"', 400);
    }

    const request = await supersedeRequestService.reviewRequest(
      parseInt(id),
      userId,
      action,
      comments
    );

    // Log review action
    await auditLogService.logWorkflow(userId, action === 'approve' ? 'SUPERSEDE_REVIEW_APPROVE' : 'SUPERSEDE_REVIEW_REJECT', request.document, req, {
      requestId: request.id,
      action,
      comments
    });

    return ResponseFormatter.success(
      res,
      { request },
      `Request ${action === 'approve' ? 'approved for final approval' : 'rejected'} successfully`
    );
  });

  /**
   * Approve a request (final approval)
   * POST /api/supersede-requests/:id/approve
   */
  approveRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { comments } = req.body;
    const userId = req.user.id;

    const request = await supersedeRequestService.approveRequest(
      parseInt(id),
      userId,
      comments
    );

    // Log final approval
    await auditLogService.logWorkflow(userId, 'SUPERSEDE_FINAL_APPROVE', request.document, req, {
      requestId: request.id,
      actionType: request.actionType,
      comments
    });

    return ResponseFormatter.success(
      res,
      { request },
      'Request approved successfully. Document has been marked as obsolete/superseded.'
    );
  });

  /**
   * Reject a request
   * POST /api/supersede-requests/:id/reject
   */
  rejectRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    if (!reason) {
      return ResponseFormatter.error(res, 'Rejection reason is required', 400);
    }

    const request = await supersedeRequestService.rejectRequest(
      parseInt(id),
      userId,
      reason
    );

    // Log rejection
    await auditLogService.logWorkflow(userId, 'SUPERSEDE_REJECT', request.document, req, {
      requestId: request.id,
      reason
    });

    return ResponseFormatter.success(
      res,
      { request },
      'Request rejected successfully'
    );
  });

  /**
   * Delete a request
   * DELETE /api/supersede-requests/:id
   */
  deleteRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    await supersedeRequestService.deleteRequest(parseInt(id), userId);

    return ResponseFormatter.success(
      res,
      null,
      'Request deleted successfully'
    );
  });

  /**
   * Helper to format status for frontend
   */
  formatStatus(status) {
    const statusMap = {
      'PENDING_REVIEW': 'Pending Review',
      'IN_REVIEW': 'In Review',
      'PENDING_APPROVAL': 'Pending Approval',
      'IN_APPROVAL': 'In Approval',
      'APPROVED': 'Approved',
      'REJECTED': 'Rejected'
    };

    return statusMap[status] || status;
  }
}

module.exports = new SupersedeRequestController();
