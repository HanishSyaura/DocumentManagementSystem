const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.post('/', notificationController.createNotification);
router.put('/mark-all-read', notificationController.markAllAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/all', notificationController.clearAll);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
