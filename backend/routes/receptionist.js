const express = require('express');
const router = express.Router();
const receptionistController = require('../controllers/receptionistController');
const damageController = require('../controllers/damageController');
const { verifyToken, authorizeRole } = require('../config/auth');

router.use(verifyToken);
// Admin can also access these features usually, but strictly speaking this is receptionist role
router.use(authorizeRole('receptionist', 'admin'));

router.get('/dashboard', receptionistController.getDashboardStats);
router.get('/guests', receptionistController.getAllGuests);

// Booking Management
router.get('/bookings/rooms', receptionistController.getAllRoomBookings);
router.put('/bookings/rooms/:id/status', receptionistController.updateRoomBookingStatus);

router.get('/bookings/activities', receptionistController.getAllActivityBookings);
router.put('/bookings/activities/:id/status', receptionistController.updateActivityBookingStatus);

router.get('/bookings/vehicles', receptionistController.getAllVehicleBookings);
router.get('/bookings/orders', receptionistController.getAllFoodOrders);

router.get('/refunds', receptionistController.getRefundRequests);
router.put('/refunds/:id', receptionistController.processRefund);

// Damages
router.post('/damages', damageController.reportDamage);
router.get('/damages', damageController.getAllDamages);

module.exports = router;
