const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Guest routes
router.post('/guest/register', authController.registerGuest);
// Unified login route
router.post('/login', authController.login);

module.exports = router;
