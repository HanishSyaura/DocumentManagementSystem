const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const ResponseFormatter = require('../utils/responseFormatter');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/database');
const { uploadTemplate } = require('../middleware/upload');
const path = require('path');
const documentConversionService = require('../services/documentConversionService');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get all templates
 * GET /api/templates
 */
router.get('/', asyncHandler(async (req, res) => {
  const templates = await prisma.template.findMany({
    include: {
      documentType: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Format response to match frontend expectations
  const formattedTemplates = templates.map(template => ({
    id: template.id,
    documentType: template.documentType.name,
    templateName: template.templateName,
    version: template.version,
    prefixCode: template.documentType.prefix,
    uploadedBy: template.uploadedBy,
    uploadedOn: new Date(template.uploadedOn).toLocaleDateString('en-GB'),
    filePath: template.filePath,
    fileName: template.fileName
  }));

  return ResponseFormatter.success(
    res,
    { templates: formattedTemplates },
    'Templates retrieved successfully'
  );
}));

/**
 * Create new template (admin only)
 * POST /api/templates
 */
router.post('/', authorize('admin'), uploadTemplate.single('files'), asyncHandler(async (req, res) => {
  console.log('Template upload request body:', req.body);
  console.log('Template upload file:', req.file);
  
  const { documentTypeId, templateName, version, uploadedBy } = req.body;

  // Validate required fields
  if (!documentTypeId || !templateName || !version) {
    return ResponseFormatter.error(
      res,
      'Missing required fields: documentTypeId, templateName, or version',
      400
    );
  }

  if (!req.file) {
    return ResponseFormatter.error(
      res,
      'No file uploaded',
      400
    );
  }

  try {
    // Check if document type exists
    const docType = await prisma.documentType.findUnique({
      where: { id: parseInt(documentTypeId) }
    });

    if (!docType) {
      return ResponseFormatter.error(
        res,
        `Document type with ID ${documentTypeId} not found`,
        404
      );
    }

    const template = await prisma.template.create({
      data: {
        documentTypeId: parseInt(documentTypeId),
        templateName,
        version,
        filePath: req.file.path,
        fileName: req.file.originalname,
        uploadedBy: uploadedBy || req.user.email
      },
      include: {
        documentType: true
      }
    });

    console.log('Template created successfully:', template);

    return ResponseFormatter.success(
      res,
      { template },
      'Template created successfully',
      201
    );
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}));

/**
 * Download template by document type (for acknowledged document requests)
 * GET /api/templates/by-document-type/:documentTypeId/download
 * IMPORTANT: This must come BEFORE /:id routes to avoid route collision
 */
router.get('/by-document-type/:documentTypeId', asyncHandler(async (req, res) => {
  const documentTypeId = parseInt(req.params.documentTypeId)

  const templates = await prisma.template.findMany({
    where: {
      documentTypeId,
      isActive: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      templateName: true,
      version: true,
      fileName: true,
      uploadedBy: true,
      uploadedOn: true,
      createdAt: true
    }
  })

  return ResponseFormatter.success(res, { templates }, 'Templates retrieved successfully')
}))

router.get('/by-document-type/:documentTypeId/download', async (req, res) => {
  try {
    const documentTypeId = parseInt(req.params.documentTypeId);

    // Find the most recent active template for this document type
    const template = await prisma.template.findFirst({
      where: {
        documentTypeId: documentTypeId,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        documentType: true
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'No template found for this document type'
      });
    }

    // Check if file exists
    const fs = require('fs');
    const filePath = template.filePath;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Template file not found on server'
      });
    }

    // Get file stats for content-length
    const stat = fs.statSync(filePath);
    
    // Log for debugging
    console.log('Downloading template:');
    console.log('  Document Type ID:', documentTypeId);
    console.log('  Template ID:', template.id);
    console.log('  File Name:', template.fileName);
    console.log('  File Path:', filePath);
    console.log('  Content-Disposition:', `attachment; filename="${template.fileName}"`);
    
    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${template.fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stat.size);

    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file'
        });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading template:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to download template'
      });
    }
  }
});

/**
 * Update template (admin only)
 * PUT /api/templates/:id
 */
router.put('/:id', authorize('admin'), uploadTemplate.single('files'), asyncHandler(async (req, res) => {
  console.log('Template update request body:', req.body);
  console.log('Template update file:', req.file);
  console.log('Template ID:', req.params.id);
  
  const templateId = parseInt(req.params.id);
  const { documentTypeId, templateName, version, uploadedBy } = req.body;

  // Validate required fields
  if (!templateName || !version) {
    return ResponseFormatter.error(
      res,
      'Missing required fields: templateName or version',
      400
    );
  }

  try {
    // Check if template exists
    const existingTemplate = await prisma.template.findUnique({
      where: { id: templateId }
    });

    if (!existingTemplate) {
      return ResponseFormatter.error(
        res,
        `Template with ID ${templateId} not found`,
        404
      );
    }

    const updateData = {};
    if (templateName) updateData.templateName = templateName;
    if (version) updateData.version = version;
    if (documentTypeId) updateData.documentTypeId = parseInt(documentTypeId);
    if (uploadedBy) updateData.uploadedBy = uploadedBy;
    
    // If new file is uploaded, update file path and name
    if (req.file) {
      updateData.filePath = req.file.path;
      updateData.fileName = req.file.originalname;
    }

    const template = await prisma.template.update({
      where: { id: templateId },
      data: updateData,
      include: {
        documentType: true
      }
    });

    console.log('Template updated successfully:', template);

    return ResponseFormatter.success(
      res,
      { template },
      'Template updated successfully'
    );
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}));

/**
 * Preview template file
 * GET /api/templates/:id/preview
 */
router.get('/:id/preview', asyncHandler(async (req, res) => {
  const templateId = parseInt(req.params.id);

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    include: {
      documentType: true
    }
  });

  if (!template) {
    return ResponseFormatter.notFound(res, 'Template');
  }

  // Check if file exists
  const fs = require('fs');
  if (!fs.existsSync(template.filePath)) {
    return ResponseFormatter.error(
      res,
      'Template file not found on server',
      404
    );
  }

  // Get file extension to set proper content type
  const ext = path.extname(template.fileName).toLowerCase();
  const mimeTypes = {
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
    '.doc': 'application/msword',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.csv': 'text/csv',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.ppt': 'application/vnd.ms-powerpoint'
  };

  // Set headers for inline viewing
  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${template.fileName}"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

  // Stream the file
  const fileStream = fs.createReadStream(template.filePath);
  fileStream.pipe(res);
}));

/**
 * Download template file
 * GET /api/templates/:id/download
 */
router.get('/:id/download', async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);

    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        documentType: true
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if file exists
    const fs = require('fs');
    const filePath = template.filePath;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Template file not found on server'
      });
    }

    // Get file stats for content-length
    const stat = fs.statSync(filePath);
    
    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${template.fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stat.size);

    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file'
        });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading template:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to download template'
      });
    }
  }
});

/**
 * Delete template (admin only)
 * DELETE /api/templates/:id
 */
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
  const templateId = parseInt(req.params.id);

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { id: true, filePath: true }
  })

  if (!template) {
    return ResponseFormatter.error(res, 'Template not found', 404)
  }

  await prisma.template.delete({
    where: { id: templateId }
  })

  if (template.filePath) {
    try {
      const fs = require('fs')
      if (fs.existsSync(template.filePath)) {
        await fs.promises.unlink(template.filePath)
      }
    } catch (error) {
    }
  }

  return ResponseFormatter.success(
    res,
    null,
    'Template deleted successfully'
  );
}));

module.exports = router;
