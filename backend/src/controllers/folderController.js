const folderService = require('../services/folderService');
const folderPermissionService = require('../services/folderPermissionService');
const auditLogService = require('../services/auditLogService');
const ResponseFormatter = require('../utils/responseFormatter');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/database');

class FolderController {
  /**
   * List all folders
   * GET /api/folders
   */
  listFolders = asyncHandler(async (req, res) => {
    const folders = await folderService.listFolders();
    const roleIds = await folderPermissionService.getRoleIdsByNames(req.user?.roles || [])
    const isAdmin = folderPermissionService.isAdminRoleNames(req.user?.roles || [])
    const flat = []
    const walk = (nodes) => {
      for (const n of nodes || []) {
        flat.push(n)
        walk(n.children)
      }
    }
    walk(folders)
    const permMap = await folderPermissionService.getEffectivePermissionsMap(flat.map((f) => f.id), req.user?.id, roleIds)
    const byId = new Map(flat.map((f) => [f.id, f]))

    const canViewCache = new Map()
    const canViewFolder = (folderId) => {
      if (canViewCache.has(folderId)) return canViewCache.get(folderId)
      const f = byId.get(folderId)
      if (!f) return false
      if (String(f.accessMode || 'PUBLIC').toUpperCase() === 'PUBLIC') {
        canViewCache.set(folderId, true)
        return true
      }
      if (isAdmin || f.createdById === req.user?.id) {
        canViewCache.set(folderId, true)
        return true
      }
      const rows = permMap.get(folderId) || []
      if (rows.length > 0) {
        const ok = folderPermissionService.hasActionFromPermRows(rows, 'view')
        canViewCache.set(folderId, ok)
        return ok
      }
      if (f.inheritPermissions && f.parentId) {
        const ok = canViewFolder(f.parentId)
        canViewCache.set(folderId, ok)
        return ok
      }
      canViewCache.set(folderId, false)
      return false
    }

    const actionCaches = {
      create: new Map(),
      edit: new Map(),
      delete: new Map(),
      download: new Map()
    }

    const canActionFolder = (folderId, action) => {
      const a = String(action || '').toLowerCase()
      const cache = actionCaches[a]
      if (!cache) return false
      if (cache.has(folderId)) return cache.get(folderId)
      const f = byId.get(folderId)
      if (!f) return false
      if (String(f.accessMode || 'PUBLIC').toUpperCase() === 'PUBLIC') {
        cache.set(folderId, true)
        return true
      }
      if (isAdmin || f.createdById === req.user?.id) {
        cache.set(folderId, true)
        return true
      }
      const rows = permMap.get(folderId) || []
      if (rows.length > 0) {
        const ok = folderPermissionService.hasActionFromPermRows(rows, a)
        cache.set(folderId, ok)
        return ok
      }
      if (f.inheritPermissions && f.parentId) {
        const ok = canActionFolder(f.parentId, a)
        cache.set(folderId, ok)
        return ok
      }
      cache.set(folderId, false)
      return false
    }

    const decorate = (node) => {
      const manage = isAdmin || node.createdById === req.user?.id
      return {
        ...node,
        canManage: manage,
        canCreate: canActionFolder(node.id, 'create'),
        canEdit: canActionFolder(node.id, 'edit'),
        canDelete: canActionFolder(node.id, 'delete'),
        canDownload: canActionFolder(node.id, 'download'),
        children: (node.children || []).map(decorate).filter((c) => canViewFolder(c.id))
      }
    }
    const filtered = (folders || []).filter((f) => canViewFolder(f.id)).map(decorate)

    return ResponseFormatter.success(
      res,
      { folders: filtered },
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

    if (parentId) {
      await folderPermissionService.assertCan(parseInt(parentId), req.user, 'create')
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

    await folderPermissionService.assertCan(folderId, req.user, 'edit')
    if (parentId !== undefined && parentId) {
      await folderPermissionService.assertCan(parseInt(parentId), req.user, 'create')
    }

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
    await folderPermissionService.assertCan(folderId, req.user, 'delete')

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

    await folderPermissionService.assertCan(folderId, req.user, 'view')

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

  getFolderAccess = asyncHandler(async (req, res) => {
    const folderId = parseInt(req.params.id)
    await folderPermissionService.assertCanManage(folderId, req.user)
    const data = await folderPermissionService.getFolderAccessConfig(folderId)
    return ResponseFormatter.success(res, data, 'Folder access retrieved successfully')
  })

  updateFolderAccess = asyncHandler(async (req, res) => {
    const folderId = parseInt(req.params.id)
    await folderPermissionService.assertCanManage(folderId, req.user)
    const data = await folderPermissionService.setFolderAccessConfig(folderId, req.user, req.body)
    await auditLogService.logSystem(req.user.id, 'FOLDER_ACCESS_UPDATE', 'Folder', req, { folderId })
    return ResponseFormatter.success(res, data, 'Folder access updated successfully')
  })

  listAccessSubjects = asyncHandler(async (req, res) => {
    const q = req.query?.q || ''
    const data = await folderPermissionService.listSubjects(q)
    return ResponseFormatter.success(res, data, 'Subjects retrieved successfully')
  })
}

module.exports = new FolderController();
