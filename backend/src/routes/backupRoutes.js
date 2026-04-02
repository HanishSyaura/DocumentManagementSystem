const express = require('express')
const router = express.Router()
const backupController = require('../controllers/backupController')
const { authenticate } = require('../middleware/auth')

// All routes require authentication
router.use(authenticate)

// Create a new backup
router.post('/backups', backupController.createBackup)

// List all backups
router.get('/backups', backupController.listBackups)

// Download a backup
router.get('/backups/:id/download', backupController.downloadBackup)

// Restore from a backup
router.post('/backups/:id/restore', backupController.restoreBackup)

// Delete a backup
router.delete('/backups/:id', backupController.deleteBackup)

module.exports = router
