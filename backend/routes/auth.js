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

const { verifyToken } = require('../config/auth');
router.put('/profile', verifyToken, authController.updateProfile);
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;
