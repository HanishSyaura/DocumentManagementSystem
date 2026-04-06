const folderService = require('../services/folderService');
const auditLogService = require('../services/auditLogService');
const ResponseFormatter = require('../utils/responseFormatter');
const asyncHandler = require('../utils/asyncHandler');

class FolderController {
  /**
   * List all folders
   * GET /api/folders
   */
  listFolders = asyncHandler(async (req, res) => {
    const folders = await folderService.listFolders();

    return ResponseFormatter.success(
      res,
      { folders },
      'Folders retrieved successfully'
    );
  });

  /**
   * Create new folder
   * POST /api/folders
   */
  createFolder = asyncHandler(async (req, res) => {
    const { name, parentId } = req.body;

    // Validation
    const errors = [];
    if (!name) errors.push({ field: 'name', message: 'Folder name is required' });

    if (errors.length > 0) {
      return ResponseFormatter.validationError(res, errors);
    }

    const folder = await folderService.createFolder({
      name,
      parentId: parentId ? parseInt(parentId) : null
    }, req.user.id);

    // Log folder creation
    await auditLogService.logSystem(req.user.id, 'FOLDER_CREATE', 'Folder', req, {
      folderId: folder.id,
      folderName: folder.name,
      parentId: folder.parentId
    });

    return ResponseFormatter.success(
      res,
      { folder },
      'Folder created successfully',
      201
    );
  });

  /**
   * Update folder
   * PUT /api/folders/:id
   */
  updateFolder = asyncHandler(async (req, res) => {
    const folderId = parseInt(req.params.id);
    const { name, parentId } = req.body;

    const folder = await folderService.updateFolder(folderId, {
      name,
      parentId: parentId !== undefined ? (parentId ? parseInt(parentId) : null) : undefined
    }, req.user.id);

    // Log folder update
    await auditLogService.logSystem(req.user.id, 'FOLDER_UPDATE', 'Folder', req, {
      folderId: folder.id,
      folderName: folder.name
    });

    return ResponseFormatter.success(
      res,
      { folder },
      'Folder updated successfully'
    );
  });

  /**
   * Delete folder
   * DELETE /api/folders/:id
   */
  deleteFolder = asyncHandler(async (req, res) => {
    const folderId = parseInt(req.params.id);

    // Log folder deletion before deleting
    await auditLogService.logSystem(req.user.id, 'FOLDER_DELETE', 'Folder', req, {
      folderId
    });

    await folderService.deleteFolder(folderId, req.user.id);

    return ResponseFormatter.success(
      res,
      null,
      'Folder deleted successfully'
    );
  });

  purgeFolder = asyncHandler(async (req, res) => {
    const folderId = parseInt(req.params.id);

    await auditLogService.log({
      userId: req.user.id,
      action: 'FOLDER_PURGE',
      entity: 'Folder',
      entityId: folderId,
      description: `Permanently deleted folder tree: ${folderId}`,
      metadata: { folderId },
      ipAddress: auditLogService.getClientIP(req),
      userAgent: req?.headers?.['user-agent']
    });

    const result = await folderService.purgeFolder(folderId);

    return ResponseFormatter.success(
      res,
      { result },
      'Folder permanently deleted successfully'
    );
  });

  /**
   * Get documents in a folder
   * GET /api/folders/:id/documents
   */
  getFolderDocuments = asyncHandler(async (req, res) => {
    const folderId = parseInt(req.params.id);
    const { page, limit, search } = req.query;

    const pagination = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 15
    };

    const result = await folderService.getFolderDocuments(folderId, {
      search,
      ...pagination
    });

    return ResponseFormatter.paginated(
      res,
      result.documents,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      'Folder documents retrieved successfully'
    );
  });
}

module.exports = new FolderController();
