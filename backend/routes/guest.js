const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const orderController = require('../controllers/orderController');
const { verifyToken, authorizeRole } = require('../config/auth');

// Protect all guest routes
router.use(verifyToken);
router.use(authorizeRole('guest'));

router.get('/profile', guestController.getProfile);
router.put('/profile', guestController.updateProfile);
router.get('/bookings', guestController.getMyBookings);
router.post('/bookings/rooms/:id/cancel', guestController.cancelRoomBooking);
// router.post('/bookings/room', guestController.createRoomBooking); // Moved to bookingController
router.get('/activities', guestController.getActivities);
router.get('/vehicles', guestController.getVehicles);
router.get('/menu', guestController.getMenu);
router.get('/orders', guestController.getOrders);
router.post('/orders', orderController.placeOrder);

router.post('/bookings/vehicles/:id/pay', guestController.payVehicleBooking);

module.exports = router;
