const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, authorizeRole } = require('../config/auth');

router.use(verifyToken);
// Most booking routes are for Guests or Receptionist/Admins
// Reading availability is public (authenticated), creating is Guest/Receptionist

// Rooms
router.get('/rooms/available', bookingController.getAvailableRooms);
router.post('/rooms', authorizeRole('guest', 'receptionist'), bookingController.createRoomBooking);

// Activities
router.get('/activities/available', bookingController.getAvailableActivities);
router.get('/activities/slots', bookingController.getActivitySlots);
router.post('/activities', authorizeRole('guest', 'receptionist'), bookingController.createActivityBooking);

// Vehicles
router.get('/vehicles/available', bookingController.getAvailableVehicles);
router.post('/vehicles', authorizeRole('guest', 'receptionist'), bookingController.createhirevehicle);
// Generic Cancel
router.put('/:type/:id/cancel', authorizeRole('guest', 'receptionist', 'admin'), bookingController.cancelBooking);

// Complete Booking (Unified Flow - Room + Extras)
router.post('/complete', authorizeRole('guest'), bookingController.completeBooking);

// Extend Room Time
router.put('/rooms/:id/extend', authorizeRole('guest', 'receptionist'), bookingController.extendRoomBooking);

// Arrival / Departure Transport
router.post('/transport/arrival', authorizeRole('guest'), bookingController.createArrivalTransport);
router.get('/transport/arrival', authorizeRole('guest'), bookingController.getGuestArrivalTransports);

module.exports = router;
