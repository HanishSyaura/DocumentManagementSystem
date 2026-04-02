const express = require('express');
const { authenticate } = require('../middleware/auth');
const { rolesController } = require('../controllers/rolesController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all roles
router.get('/', rolesController.getAllRoles);

// Get role by ID
router.get('/:id', rolesController.getRoleById);

// Create new role
router.post('/', rolesController.createRole);

// Update role
router.put('/:id', rolesController.updateRole);

// Update role permissions (including system roles)
router.patch('/:id/permissions', rolesController.updateRolePermissions);

// Delete role
router.delete('/:id', rolesController.deleteRole);

module.exports = router;
