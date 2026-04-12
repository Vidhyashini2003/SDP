const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const orderController = require('../controllers/orderController');
const quickrideController = require('../controllers/quickrideController');
const { verifyToken, authorizeRole } = require('../config/auth');

// Protect all guest routes
router.use(verifyToken);
router.use(authorizeRole('guest'));

router.get('/profile', guestController.getProfile);
router.put('/profile', guestController.updateProfile);
router.get('/bookings', guestController.getMyBookings);
router.get('/bookings/grouped', guestController.getGroupedBookings);
router.get('/bookings/active', guestController.getActiveBookings);
router.post('/bookings/rooms/:id/cancel', guestController.cancelRoomBooking);
// router.post('/bookings/room', guestController.createRoomBooking); // Moved to bookingController
router.get('/activities', guestController.getActivities);
router.get('/vehicles', guestController.getVehicles);
router.get('/menu', guestController.getMenu);
router.get('/orders', guestController.getOrders);
router.post('/orders', orderController.placeOrder);
router.post('/orders/bulk', orderController.placeBulkOrder);
router.put('/orders/:id/cancel', guestController.cancelFoodOrder);
router.put('/orders/:orderId/items/:itemId/cancel', guestController.cancelFoodOrderItem);

router.put('/bookings/activities/:id/cancel', guestController.cancelActivityBooking);

router.post('/bookings/vehicles/:id/pay', guestController.payhirevehicle);
router.post('/bookings/arrivals/:id/pay', guestController.payArrivalTransport);

// Quick Ride routes
router.post('/quickrides', quickrideController.requestQuickRide);
router.get('/quickrides', quickrideController.getGuestQuickRides);
router.post('/quickrides/:id/pay', quickrideController.payQuickRide);

module.exports = router;
