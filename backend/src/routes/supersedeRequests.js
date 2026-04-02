const express = require('express');
const supersedeRequestController = require('../controllers/supersedeRequestController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// CRUD operations
router.post('/', supersedeRequestController.createRequest);
router.get('/', supersedeRequestController.listRequests);
router.get('/:id', supersedeRequestController.getRequest);
router.delete('/:id', supersedeRequestController.deleteRequest);

// Workflow actions
router.post('/:id/review', supersedeRequestController.reviewRequest);
router.post('/:id/approve', supersedeRequestController.approveRequest);
router.post('/:id/reject', supersedeRequestController.rejectRequest);

module.exports = router;
