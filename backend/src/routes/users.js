const express = require('express');
const { authenticate } = require('../middleware/auth');
const { usersController } = require('../controllers/usersController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all users
router.get('/', usersController.getAllUsers);

// Get user by ID
router.get('/:id', usersController.getUserById);

// Create new user
router.post('/', usersController.createUser);

// Update user
router.put('/:id', usersController.updateUser);

// Delete user
router.delete('/:id', usersController.deleteUser);

// Reset password to default
router.post('/:id/reset-password', usersController.resetPassword);

// Update user status (activate/deactivate)
router.patch('/:id/status', usersController.updateUserStatus);

module.exports = router;
