const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const auditLogService = require('../services/auditLogService');
const ResponseFormatter = require('../utils/responseFormatter');
const asyncHandler = require('../utils/asyncHandler');
const { generateEmployeeId } = require('../utils/employeeIdGenerator');

const prisma = new PrismaClient();

class UsersController {
  /**
   * Get all users
   * GET /api/users
   */
  getAllUsers = asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Remove passwords from response
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return ResponseFormatter.success(
      res,
      { users: usersWithoutPassword },
      'Users retrieved successfully'
    );
  });

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  getUserById = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        preferences: true
      }
    });

    if (!user) {
      return ResponseFormatter.error(res, 'User not found', 404);
    }

    const { password, ...userWithoutPassword } = user;

    return ResponseFormatter.success(
      res,
      { user: userWithoutPassword },
      'User retrieved successfully'
    );
  });

  /**
   * Create new user
   * POST /api/users
   */
  createUser = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, phone, department, position, roleIds } = req.body;

    // Validation - email and firstName are required, lastName is optional
    if (!email || !firstName) {
      return ResponseFormatter.error(res, 'Missing required fields: email and firstName are required', 400);
    }

    // Use provided password or default to 'Password123!' for testing
    const userPassword = password || 'Password123!';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return ResponseFormatter.error(res, 'User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    // Generate Employee ID
    const generatedEmployeeId = await generateEmployeeId();

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        department,
        position,
        employeeId: generatedEmployeeId,
        status: 'ACTIVE'
      }
    });

    // Assign roles if provided
    if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map(roleId => ({
          userId: user.id,
          roleId: parseInt(roleId)
        }))
      });
    }

    // Create user preferences
    await prisma.userPreference.create({
      data: {
        userId: user.id
      }
    });

    // Fetch user with roles
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    const { password: _, ...userWithoutPassword } = userWithRoles;

    // Log user creation
    await auditLogService.logUser(req.user.id, 'CREATE', userWithRoles, req, {
      roleIds
    });

    return ResponseFormatter.success(
      res,
      { user: userWithoutPassword },
      'User created successfully',
      201
    );
  });

  /**
   * Update user
   * PUT /api/users/:id
   */
  updateUser = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const { firstName, lastName, phone, department, position, employeeId, roleIds } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return ResponseFormatter.error(res, 'User not found', 404);
    }

    // Update user
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;
    if (position !== undefined) updateData.position = position;
    if (employeeId !== undefined) updateData.employeeId = employeeId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Update roles if provided
    if (roleIds && Array.isArray(roleIds)) {
      // Remove existing roles
      await prisma.userRole.deleteMany({
        where: { userId }
      });

      // Add new roles
      if (roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: roleIds.map(roleId => ({
            userId,
            roleId: parseInt(roleId)
          }))
        });
      }
    }

    // Fetch user with updated roles
    const userWithRoles = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    const { password: _, ...userWithoutPassword } = userWithRoles;

    // Log user update
    await auditLogService.logUser(req.user.id, 'UPDATE', userWithRoles, req, {
      roleIds,
      updatedFields: Object.keys(updateData)
    });

    return ResponseFormatter.success(
      res,
      { user: userWithoutPassword },
      'User updated successfully'
    );
  });

  /**
   * Delete user
   * DELETE /api/users/:id
   */
  deleteUser = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return ResponseFormatter.error(res, 'User not found', 404);
    }

    // Prevent self-deletion
    if (userId === req.user.id) {
      return ResponseFormatter.error(res, 'You cannot delete your own account', 400);
    }

    // Log user deletion before deleting
    await auditLogService.logUser(req.user.id, 'DELETE', user, req);

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    return ResponseFormatter.success(
      res,
      null,
      'User deleted successfully'
    );
  });

  /**
   * Update user status
   * PATCH /api/users/:id/status
   */
  updateUserStatus = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE', 'LOCKED'].includes(status)) {
      return ResponseFormatter.error(res, 'Invalid status value', 400);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return ResponseFormatter.error(res, 'User not found', 404);
    }

    // Prevent self-deactivation
    if (userId === req.user.id && status !== 'ACTIVE') {
      return ResponseFormatter.error(res, 'You cannot deactivate your own account', 400);
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    // Log status change
    await auditLogService.logUser(req.user.id, status === 'ACTIVE' ? 'ACTIVATE' : 'DEACTIVATE', updatedUser, req, {
      newStatus: status,
      previousStatus: user.status
    });

    return ResponseFormatter.success(
      res,
      { user: userWithoutPassword },
      'User status updated successfully'
    );
  });
}

module.exports = { usersController: new UsersController() };
