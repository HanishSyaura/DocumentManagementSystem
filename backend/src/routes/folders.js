const express = require('express');
const folderController = require('../controllers/folderController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Folder CRUD operations
router.get('/', folderController.listFolders);
router.post('/', folderController.createFolder);
router.put('/:id', folderController.updateFolder);
router.delete('/:id', folderController.deleteFolder);

// Get documents in a folder
router.get('/:id/documents', folderController.getFolderDocuments);

module.exports = router;
