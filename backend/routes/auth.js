const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Guest routes
router.post('/guest/register', authController.registerGuest);
// Unified login route
router.post('/login', authController.login);

// Account Activation
router.get('/activate-account', authController.activateAccount);
router.post('/activate-account', authController.activateAccount);

// Password Recovery
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

const { verifyToken } = require('../config/auth');
// Get Current User Profile
router.get('/me', verifyToken, authController.getMe);
router.put('/profile', verifyToken, authController.updateProfile);
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;
