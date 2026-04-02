const express = require('express');
const { authController } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { uploadProfileImage } = require('../middleware/upload');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/verify-2fa', authController.verify2FA);
router.post('/resend-2fa', authController.resend2FA);

// Protected routes (require authentication)
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/profile', authenticate, uploadProfileImage.single('profileImage'), authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.get('/sessions', authenticate, authController.getSessions);
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);
router.put('/2fa', authenticate, authController.toggleTwoFactor);
router.post('/deactivate', authenticate, authController.deactivateAccount);

module.exports = router;
