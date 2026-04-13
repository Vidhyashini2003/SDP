const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const orderController = require('../controllers/orderController');
const quickrideController = require('../controllers/quickrideController');
const { verifyToken, authorizeRole } = require('../config/auth');

// Protect all guest routes
router.use(verifyToken);

// --- Guest-only routes ---
const guestOnly = authorizeRole('guest');

router.get('/profile', guestOnly, guestController.getProfile);
router.put('/profile', guestOnly, guestController.updateProfile);
router.get('/bookings', guestOnly, guestController.getMyBookings);
router.get('/bookings/grouped', guestOnly, guestController.getGroupedBookings);
router.get('/bookings/active', guestOnly, guestController.getActiveBookings);
router.post('/bookings/rooms/:id/cancel', guestOnly, guestController.cancelRoomBooking);

router.get('/orders', guestOnly, guestController.getOrders);
router.post('/orders', guestOnly, orderController.placeOrder);
router.post('/orders/bulk', guestOnly, orderController.placeBulkOrder);
router.put('/orders/:id/cancel', guestOnly, guestController.cancelFoodOrder);
router.put('/orders/:orderId/items/:itemId/cancel', guestOnly, guestController.cancelFoodOrderItem);

router.put('/bookings/activities/:id/cancel', guestOnly, guestController.cancelActivityBooking);
router.post('/bookings/vehicles/:id/pay', guestOnly, guestController.payhirevehicle);
router.put('/bookings/vehicles/:id/cancel', guestOnly, guestController.cancelVehicleHire);
router.post('/bookings/arrivals/:id/pay', guestOnly, guestController.payArrivalTransport);
router.put('/bookings/arrivals/:id/cancel', guestOnly, guestController.cancelArrivalTransport);

// Quick Ride routes
router.post('/quickrides', guestOnly, quickrideController.requestQuickRide);
router.get('/quickrides', guestOnly, quickrideController.getGuestQuickRides);
router.post('/quickrides/:id/pay', guestOnly, quickrideController.payQuickRide);


// --- Shared informational routes (Accessible by Receptionist for Walk-in Bookings) ---
const shared = authorizeRole('guest', 'receptionist', 'admin');

router.get('/activities', shared, guestController.getActivities);
router.get('/vehicles', shared, guestController.getVehicles);
router.get('/menu', shared, guestController.getMenu);

module.exports = router;
