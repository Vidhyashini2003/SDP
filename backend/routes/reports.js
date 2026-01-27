const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, authorizeRole } = require('../config/auth');

router.use(verifyToken);
router.use(authorizeRole('admin'));

router.get('/bookings', reportController.getBookingReport);
router.get('/users', reportController.getUserReport);

module.exports = router;
