const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const { verifyToken, authorizeRole } = require('../config/auth');

// Protect all guest routes
router.use(verifyToken);
router.use(authorizeRole('guest'));

router.get('/profile', guestController.getProfile);
router.put('/profile', guestController.updateProfile);
router.get('/bookings', guestController.getBookings);
router.post('/bookings/room', guestController.createRoomBooking);
router.get('/activities', guestController.getActivities);
router.get('/vehicles', guestController.getVehicles);
router.get('/menu', guestController.getMenu);
router.get('/orders', guestController.getOrders);
router.post('/orders', guestController.placeOrder);
router.post('/feedback', guestController.submitFeedback);

module.exports = router;
