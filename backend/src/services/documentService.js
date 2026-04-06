const prisma = require('../config/database');
const fileStorageService = require('./fileStorageService');
const documentAssignmentService = require('./documentAssignmentService');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const DocumentNumbering = require('../utils/documentNumbering');
const path = require('path');

class DocumentService {
  /**
   * Generate unique file code for document
   * Uses DocumentNumbering utility to format based on system settings
   * Sequence is unique per Document Type + Project Category combination
   * @param {number} documentTypeId - Document type ID
   * @param {number} projectCategoryId - Project category ID
   * @param {string} version - Document version (default: '1')
   * @param {Date} documentDate - Optional document date (defaults to current date)
   */
  async generateFileCode(documentTypeId, projectCategoryId, version = '1', documentDate = null) {
    const documentType = await prisma.documentType.findUnique({
      where: { id: documentTypeId }
    });

    if (!documentType) {
      throw new NotFoundError('Document type');
    }

    const dateToUse = documentDate || new Date();
    const prefix = documentType.prefix;
    
    // Get the last document with this documentType + projectCategory combination
    // Sequence continues regardless of date
    const lastDocument = await prisma.document.findFirst({
      where: {
        documentTypeId: documentTypeId,
        projectCategoryId: projectCategoryId,
        fileCode: {
          not: {
            startsWith: 'PENDING-'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    let sequence = 1;
    if (lastDocument) {
      // Parse the last sequence from existing file code
      const settings = await DocumentNumbering.loadSettings();
      const parsed = await DocumentNumbering.parseFileCode(lastDocument.fileCode, settings);
      if (parsed.sequence) {
        sequence = parsed.sequence + 1;
      }
    }

    // Use DocumentNumbering utility to generate file code based on system settings
    const fileCode = await DocumentNumbering.generateFileCode(prefix, sequence, {
      date: dateToUse,
      version: version
    });

    return fileCode;
  }

  /**
   * Create new document
   */
  async createDocument(data, creatorId) {
    const { title, description, documentTypeId, projectCategoryId, folderId } = data;

    // Generate file code
    const fileCode = await this.generateFileCode(documentTypeId);

    // Create document
    const document = await prisma.document.create({
      data: {
        fileCode,
        title,
        description,
        documentTypeId,
        projectCategoryId: projectCategoryId || null,
        folderId: folderId ? parseInt(folderId) : null,
        createdById: creatorId,
        ownerId: creatorId,
        status: 'DRAFT',
        stage: 'DRAFT',
        version: '1.0'
      },
      include: {
        documentType: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create document directory
    await fileStorageService.createDocumentDirectory(fileCode);

    // Create document register entry
    await prisma.documentRegister.create({
      data: {
        fileCode,
        documentTitle: title,
        documentType: document.documentType.name,
        version: '1.0',
        owner: `${document.owner.firstName} ${document.owner.lastName}`,
        department: document.owner.department || '',
        status: 'DRAFT'
      }
    });

    return document;
  }

  async createImportedPublishedDocument(data, creatorId) {
    const { fileCode, title, description, documentTypeId, folderId } = data

    if (!fileCode || !String(fileCode).trim()) {
      throw new BadRequestError('File code is required')
    }

    const normalizedFileCode = String(fileCode).trim()

    const existing = await prisma.document.findUnique({
      where: { fileCode: normalizedFileCode }
    })
    if (existing) {
      throw new BadRequestError(`File code "${normalizedFileCode}" already exists`)
    }

    const document = await prisma.document.create({
      data: {
        fileCode: normalizedFileCode,
        title,
        description,
        documentTypeId,
        folderId: folderId ? parseInt(folderId) : null,
        createdById: creatorId,
        ownerId: creatorId,
        status: 'DRAFT',
        stage: 'DRAFT',
        version: '1.0'
      },
      include: {
        documentType: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    await fileStorageService.createDocumentDirectory(normalizedFileCode)

    await prisma.documentRegister.create({
      data: {
        fileCode: normalizedFileCode,
        documentTitle: title,
        documentType: document.documentType.name,
        version: '1.0',
        owner: `${document.owner.firstName} ${document.owner.lastName}`,
        department: document.owner.department || '',
        status: 'DRAFT'
      }
    })

    return document
  }

  /**
   * Upload document file version
   */
  async uploadDocumentVersion(documentId, file, uploaderId) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { 
        documentType: true,
        versions: {
          orderBy: { uploadedAt: 'asc' }
        }
      }
    });

    if (!document) {
      throw new NotFoundError('Document');
    }

    // Get version control settings
    const configService = require('./configService');
    const versionSettings = await configService.getVersionControlSettings();

    // Check if we need to enforce version limit
    if (versionSettings.maxVersions && document.versions.length >= versionSettings.maxVersions) {
      // Delete the oldest version(s) to make room
      const versionsToDelete = document.versions.slice(0, document.versions.length - versionSettings.maxVersions + 1);
      
      for (const oldVersion of versionsToDelete) {
        // Delete file from storage
        try {
          await fileStorageService.deleteFile(oldVersion.filePath);
        } catch (error) {
          console.error(`Failed to delete old version file: ${oldVersion.filePath}`, error);
        }
        
        // Delete version record
        await prisma.documentVersion.delete({
          where: { id: oldVersion.id }
        });
      }
    }

    // Move file from temp to document directory
    const { absolutePath } = fileStorageService.getDocumentPath(document.fileCode);
    const fileName = fileStorageService.generateUniqueFileName(file.originalname);
    let finalPath = await fileStorageService.saveFile(file, absolutePath, fileName);

    // Check if encryption is enabled and encrypt the file
    const encryptionService = require('./encryptionService');
    const isEncryptionEnabled = await encryptionService.isEncryptionEnabled();
    let isEncrypted = false;

    if (isEncryptionEnabled) {
      try {
        const encryptionResult = await encryptionService.encryptFileInPlace(finalPath);
        finalPath = encryptionResult.encryptedPath;
        isEncrypted = true;
        console.log(`File encrypted: ${finalPath}`);
      } catch (error) {
        console.error('Failed to encrypt file:', error);
        // Continue without encryption if it fails
      }
    }

    // Create document version record
    const version = await prisma.documentVersion.create({
      data: {
        documentId,
        version: document.version,
        filePath: finalPath,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedById: uploaderId,
        isPublished: false,
        isEncrypted
      }
    });

    return version;
  }

  /**
   * Get document by ID
   * Enforces assignment-based access control
   */
  async getDocumentById(documentId, userId = null) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        documentType: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        versions: {
          orderBy: { uploadedAt: 'desc' },
          take: 1
        },
        approvalHistory: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!document) {
      throw new NotFoundError('Document');
    }

    // Enforce access control if userId is provided
    if (userId) {
      const hasAccess = await documentAssignmentService.canAccessDocument(documentId, userId);
      if (!hasAccess) {
        throw new ForbiddenError('You do not have access to this document');
      }
    }

    return document;
  }

  /**
   * Get document by file code
   */
  async getDocumentByFileCode(fileCode) {
    const document = await prisma.document.findUnique({
      where: { fileCode },
      include: {
        documentType: true,
        versions: {
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    if (!document) {
      throw new NotFoundError('Document');
    }

    return document;
  }

  /**
   * List documents with filters and pagination
   * Enforces assignment-based access control
   */
  async listDocuments(filters = {}, pagination = {}, userId = null) {
    const {
      status,
      statusIn,
      stage,
      documentTypeId,
      createdById,
      ownerId,
      folderId,
      search,
      startDate,
      endDate
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

    // Enforce assignment-based access control
    if (userId) {
      const accessClause = documentAssignmentService.buildAccessWhereClause(userId);
      Object.assign(where, accessClause);
    }

    if (status) where.status = status;
    if (statusIn) where.status = { in: statusIn };
    if (stage) where.stage = stage;
    if (documentTypeId) where.documentTypeId = documentTypeId;
    if (createdById) where.createdById = createdById;
    if (ownerId) where.ownerId = ownerId;
    if (folderId !== undefined) where.folderId = folderId;

    if (search) {
      where.OR = [
        { fileCode: { contains: search } },
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get total count
    const total = await prisma.document.count({ where });

    // Get documents
    const documents = await prisma.document.findMany({
      where,
      include: {
        documentType: true,
        projectCategory: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        versions: {
          orderBy: { uploadedAt: 'desc' },
          take: 1
        }
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    });

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get user's draft documents
   * Includes documents with status='DRAFT', 'ACKNOWLEDGED' (displayed as "Drafting")
   * and status='RETURNED' (returned for amendments)
   */
  async getUserDrafts(userId, pagination = {}) {
    const { page = 1, limit = 15, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    // Get documents in DRAFT stage with various statuses
    const where = {
      ownerId: userId,
      stage: 'DRAFT',
      status: {
        in: ['DRAFT', 'ACKNOWLEDGED', 'RETURNED']
      }
    };

    const total = await prisma.document.count({ where });

    const documents = await prisma.document.findMany({
      where,
      include: {
        documentType: true,
        projectCategory: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        versions: {
          orderBy: { uploadedAt: 'desc' },
          take: 1
        }
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    });

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update document
   */
  async updateDocument(documentId, updateData, userId) {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      throw new NotFoundError('Document');
    }

    // Check if user is owner or has permission
    if (document.ownerId !== userId && document.createdById !== userId) {
      throw new ForbiddenError('You do not have permission to update this document');
    }

    // Only allow updates if document is in DRAFT stage (includes ACKNOWLEDGED and RETURNED statuses)
    if (document.stage !== 'DRAFT') {
      throw new BadRequestError('Can only update documents in DRAFT stage');
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
      include: {
        documentType: true,
        owner: true
      }
    });

    return updated;
  }

  /**
   * Delete document (soft delete by moving to archived)
   * @param {number} documentId - Document ID to delete
   * @param {number} userId - User ID requesting deletion
   * @param {boolean} isAdmin - Whether user is an admin
   */
  async deleteDocument(documentId, userId, isAdmin = false) {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      throw new NotFoundError('Document');
    }

    // Admins can delete any document
    if (!isAdmin) {
      // Non-admins: check if user is owner or creator
      if (document.ownerId !== userId && document.createdById !== userId) {
        throw new ForbiddenError('You do not have permission to delete this document');
      }

      // Non-admins: only allow deletion if document is in DRAFT stage or draft-related statuses
      const draftStatuses = ['DRAFT', 'Draft', 'Drafting', 'Draft Saved', 'ACKNOWLEDGED', 'Return for Amendments'];
      if (document.stage !== 'DRAFT' && !draftStatuses.includes(document.status)) {
        throw new BadRequestError('Can only delete documents in DRAFT status');
      }
    }

    // Update status to ARCHIVED instead of hard delete
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'ARCHIVED'
      }
    });

    return true;
  }

  async purgeDocument(documentId) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        versions: {
          select: { filePath: true }
        }
      }
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    const filePaths = (document.versions || [])
      .map(v => v.filePath)
      .filter(Boolean);

    await prisma.document.delete({
      where: { id: documentId }
    });

    const dirPaths = new Set();
    let deletedFiles = 0;
    for (const fp of filePaths) {
      const ok = await fileStorageService.deleteFile(fp);
      if (ok) deletedFiles += 1;
      dirPaths.add(path.dirname(fp));
    }

    let deletedDirectories = 0;
    for (const dir of dirPaths) {
      const ok = await fileStorageService.deleteDirectory(dir);
      if (ok) deletedDirectories += 1;
    }

    return { deletedFiles, deletedDirectories };
  }

  /**
   * Get document version history
   */
  async getDocumentVersions(documentId) {
    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    });

    return versions;
  }

  /**
   * Add comment to document
   */
  async addComment(documentId, userId, comment, commentType = 'GENERAL') {
    const newComment = await prisma.documentComment.create({
      data: {
        documentId,
        userId,
        comment,
        commentType
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return newComment;
  }

  /**
   * Get document comments
   */
  async getDocumentComments(documentId) {
    const comments = await prisma.documentComment.findMany({
      where: { documentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return comments;
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(filters = {}) {
    const { ownerId, documentTypeId } = filters;
    const where = {};
    
    if (ownerId) where.ownerId = ownerId;
    if (documentTypeId) where.documentTypeId = documentTypeId;

    const [
      totalDocuments,
      draftCount,
      publishedCount,
      inReviewCount,
      inApprovalCount
    ] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.count({ where: { ...where, status: 'DRAFT' } }),
      prisma.document.count({ where: { ...where, status: 'PUBLISHED' } }),
      prisma.document.count({ where: { ...where, stage: 'REVIEW' } }),
      prisma.document.count({ where: { ...where, stage: 'APPROVAL' } })
    ]);

    return {
      totalDocuments,
      draftCount,
      publishedCount,
      inReviewCount,
      inApprovalCount
    };
  }

  /**
   * Get document type by name
   */
  async getDocumentTypeByName(name) {
    // MySQL doesn't support mode: 'insensitive', but is case-insensitive by default
    // Try exact match first
    let docType = await prisma.documentType.findFirst({
      where: { name: name }
    });

    // If not found, try partial match
    if (!docType) {
      docType = await prisma.documentType.findFirst({
        where: { name: { contains: name } }
      });
    }

    return docType;
  }

  /**
   * Get project category by name
   */
  async getProjectCategoryByName(name) {
    // MySQL doesn't support mode: 'insensitive', but is case-insensitive by default
    // Try exact match first
    let category = await prisma.projectCategory.findFirst({
      where: { name: name }
    });

    // If not found, try partial match
    if (!category) {
      category = await prisma.projectCategory.findFirst({
        where: { name: { contains: name } }
      });
    }

    return category;
  }

  /**
   * Create document request (NDR)
   * Documents are created in PENDING_ACKNOWLEDGMENT status without file code
   */
  async createDocumentRequest(data, creatorId) {
    const { title, description, documentTypeId, projectCategoryId, dateOfDocument } = data;

    // Check for pending request with same title and document type
    const existingRequest = await prisma.document.findFirst({
      where: {
        title,
        documentTypeId,
        status: 'PENDING_ACKNOWLEDGMENT',
        createdById: creatorId
      }
    });

    if (existingRequest) {
      throw new BadRequestError(
        'You already have a pending document request with this title. Please wait for acknowledgment or use a different title.'
      );
    }

    // Generate temporary file code (will be replaced on acknowledgment)
    // Add more entropy to avoid collisions
    const tempFileCode = `PENDING-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${creatorId}`;

    // Create document request
    const document = await prisma.document.create({
      data: {
        fileCode: tempFileCode,
        title,
        description,
        documentTypeId,
        projectCategoryId: projectCategoryId || null,
        folderId: null,
        createdById: creatorId,
        ownerId: creatorId,
        status: 'PENDING_ACKNOWLEDGMENT',
        stage: 'ACKNOWLEDGMENT',
        version: '1.0',
        dateOfDocument: dateOfDocument ? new Date(dateOfDocument) : null
      },
      include: {
        documentType: true,
        projectCategory: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create document directory
    await fileStorageService.createDocumentDirectory(tempFileCode);

    // TODO: Send notification to Document Controller

    return document;
  }

  /**
   * Reject document request
   * This should only be called by Document Controller
   */
  async rejectDocumentRequest(documentId, rejectedById, reason) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { documentType: true, createdBy: true }
    });

    if (!document) {
      throw new NotFoundError('Document request');
    }

    if (document.status !== 'PENDING_ACKNOWLEDGMENT') {
      throw new BadRequestError('Only pending document requests can be rejected');
    }

    // Update document status to REJECTED
    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'REJECTED',
        stage: 'DRAFT',
        obsoleteReason: reason,
        obsoleteDate: new Date()
      },
      include: {
        documentType: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Add rejection comment
    if (reason) {
      await this.addComment(documentId, rejectedById, `Request rejected: ${reason}`, 'REJECTION');
    }

    // Send notification to document creator about rejection
    try {
      const notificationService = require('./notificationService');
      await notificationService.notifyOwnerDocumentRejected(documentId, updated, rejectedById, reason);
      console.log(`[DocumentService] NDR rejection notification sent to owner ${updated.ownerId}`);
    } catch (error) {
      console.error('Failed to send NDR rejection notification:', error);
    }

    return updated;
  }

  /**
   * Acknowledge document request and assign proper file code
   * This should only be called by Document Controller
   * Users cannot acknowledge their own requests (separation of duties)
   */
  async acknowledgeDocumentRequest(documentId, acknowledgerId, remarks) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { documentType: true }
    });

    if (!document) {
      throw new NotFoundError('Document request');
    }

    if (document.status !== 'PENDING_ACKNOWLEDGMENT') {
      throw new BadRequestError('Document request has already been acknowledged or is not pending');
    }

    // Prevent self-acknowledgment - user cannot acknowledge their own request
    if (document.createdById === acknowledgerId || document.ownerId === acknowledgerId) {
      throw new ForbiddenError('You cannot acknowledge your own document request. Another acknowledger must process this request.');
    }

    // Generate proper file code using the stored dateOfDocument and projectCategoryId
    const fileCode = await this.generateFileCode(document.documentTypeId, document.projectCategoryId, '01', document.dateOfDocument);

    // Update document with file code and acknowledged status
    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        fileCode,
        status: 'ACKNOWLEDGED',
        stage: 'DRAFT',  // Move to DRAFT stage after acknowledgment
        acknowledgedById: acknowledgerId,
        acknowledgedAt: new Date()
      },
      include: {
        documentType: true,
        projectCategory: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Rename document directory from temp to proper file code
    try {
      await fileStorageService.renameDocumentDirectory(document.fileCode, fileCode);
    } catch (error) {
      console.error('Failed to rename document directory:', error);
    }

    // Update document register
    await prisma.documentRegister.create({
      data: {
        fileCode,
        documentTitle: document.title,
        documentType: document.documentType.name,
        version: '1.0',
        owner: `${updated.owner.firstName} ${updated.owner.lastName}`,
        department: updated.owner.department || '',
        status: 'ACKNOWLEDGED'
      }
    });

    // Add acknowledgment comment if remarks provided
    if (remarks) {
      await this.addComment(documentId, acknowledgerId, remarks, 'GENERAL');
    }

    // Send notification to document owner (the user who created the request)
    try {
      const notificationService = require('./notificationService');
      await notificationService.notifyNDRAcknowledged(documentId, updated, acknowledgerId);
      console.log(`[DocumentService] NDR acknowledgment notification sent to owner ${updated.ownerId}`);
    } catch (error) {
      console.error('Failed to send NDR acknowledgment notification:', error);
    }

    return updated;
  }

  /**
   * Submit draft document for review
   * Requires file to be uploaded and reviewers to be assigned
   */
  async submitDraftForReview(documentId, reviewerIds, userId) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        versions: {
          orderBy: { uploadedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!document) {
      throw new NotFoundError('Document');
    }

    // Check if user is owner
    if (document.ownerId !== userId) {
      throw new ForbiddenError('Only document owner can submit for review');
    }

    // Check if document is in DRAFT stage (accepts both new drafts and returned documents)
    if (document.stage !== 'DRAFT') {
      throw new BadRequestError('Document must be in draft stage to submit for review');
    }
    
    // Accept documents with ACKNOWLEDGED (new drafts) or RETURNED (resubmission) status
    if (!['ACKNOWLEDGED', 'RETURNED'].includes(document.status)) {
      throw new BadRequestError('Can only submit documents with ACKNOWLEDGED or RETURNED status');
    }

    // Check if file is uploaded
    if (!document.versions || document.versions.length === 0) {
      throw new BadRequestError('Please upload document file before submitting for review');
    }

    // Check if reviewers are assigned
    if (!reviewerIds || reviewerIds.length === 0) {
      throw new BadRequestError('Please assign at least one reviewer');
    }

    // Update document status to PENDING_REVIEW
    // Set the first reviewer as the assigned reviewer (for single reviewer workflow)
    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'PENDING_REVIEW',
        stage: 'REVIEW',
        submittedAt: new Date(),
        reviewerId: reviewerIds[0] // Assign the first/primary reviewer
      },
      include: {
        documentType: true,
        owner: true,
        versions: {
          orderBy: { uploadedAt: 'desc' },
          take: 1
        }
      }
    });

    // Create approval history records for reviewers
    const approvalRecords = reviewerIds.map(reviewerId => ({
      documentId,
      userId: reviewerId,
      action: 'SUBMITTED',
      stage: 'REVIEW'
    }));

    await prisma.approvalHistory.createMany({
      data: approvalRecords
    });

    // Create document assignments for reviewers (for access control)
    const documentAssignmentService = require('./documentAssignmentService');
    for (const reviewerId of reviewerIds) {
      await documentAssignmentService.assignDocument(
        documentId,
        reviewerId,
        'REVIEW',
        userId // assigned by owner
      );
    }
    console.log(`[DocumentService] Created assignments for ${reviewerIds.length} reviewers`);

    // Update document register
    await prisma.documentRegister.updateMany({
      where: { fileCode: document.fileCode },
      data: {
        status: 'PENDING_REVIEW'
      }
    });

    // TODO: Send notifications to reviewers

    return updated;
  }
}

module.exports = new DocumentService();
