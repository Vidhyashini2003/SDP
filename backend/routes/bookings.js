/**
 * routes/bookings.js — Booking Creation & Management Routes
 *
 * All routes require a valid JWT token (router.use(verifyToken)).
 *
 * Covers three booking types:
 *  1. ROOMS   — query available rooms, create a room booking
 *  2. ACTIVITIES — query available activities/slots, create an activity booking
 *  3. VEHICLES   — query available vehicles, create a per-day vehicle hire
 *
 * Special routes:
 *  - POST /complete       — Unified booking: creates room + extras (activities, vehicles, food) in one request
 *                           Used by both guests booking themselves and receptionists doing walk-in bookings.
 *  - PUT /rooms/:id/extend — Guest or receptionist can extend an existing room booking's checkout date
 *  - PUT /:type/:id/cancel — Generic cancellation for room/activity/vehicle bookings
 *  - POST /transport/arrival — Guest books an airport transfer (arrival pickup) linked to their room booking
 *  - GET  /transport/arrival — Guest views their arrival transport requests
 *
 * Who can create bookings:
 *   Guests can book for themselves.
 *   Receptionists can book on behalf of walk-in guests.
 *   Availability queries are open to all authenticated users.
 *
 * All routes are mounted at: /api/bookings (see server.js)
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, authorizeRole } = require('../config/auth');

// All routes below require a valid JWT token
router.use(verifyToken);

// ─────────────────────────────────────────────
// ROOM BOOKING
// ─────────────────────────────────────────────

// GET /api/bookings/rooms/available?checkin=...&checkout=...
// Returns rooms that are not already booked in the given date range.
router.get('/rooms/available', bookingController.getAvailableRooms);

// POST /api/bookings/rooms
// Creates a standalone room booking. Requires 'guest' or 'receptionist' role.
router.post('/rooms', authorizeRole('guest', 'receptionist'), bookingController.createRoomBooking);

// ─────────────────────────────────────────────
// ACTIVITY BOOKING
// ─────────────────────────────────────────────

// GET /api/bookings/activities/available — Returns activities not fully booked
router.get('/activities/available', bookingController.getAvailableActivities);

// GET /api/bookings/activities/slots?activity_id=...&date=...
// Returns available time slots for a specific activity on a specific date.
router.get('/activities/slots', bookingController.getActivitySlots);

// POST /api/bookings/activities — Creates an activity booking (guest or receptionist)
router.post('/activities', authorizeRole('guest', 'receptionist'), bookingController.createActivityBooking);

// ─────────────────────────────────────────────
// VEHICLE HIRE
// ─────────────────────────────────────────────

// GET /api/bookings/vehicles/available?start_date=...&days=...
// Returns vehicles that are not already hired in the given period.
router.get('/vehicles/available', bookingController.getAvailableVehicles);

// POST /api/bookings/vehicles — Creates a per-day vehicle hire (guest or receptionist)
router.post('/vehicles', authorizeRole('guest', 'receptionist'), bookingController.createhirevehicle);

// ─────────────────────────────────────────────
// GENERIC CANCELLATION
// ─────────────────────────────────────────────

// PUT /api/bookings/:type/:id/cancel
// Cancels a booking by type ('rooms', 'activities', or 'vehicles') and booking ID.
// Accessible by guest, receptionist, or admin.
router.put('/:type/:id/cancel', authorizeRole('guest', 'receptionist', 'admin'), bookingController.cancelBooking);

// ─────────────────────────────────────────────
// UNIFIED/COMPLETE BOOKING
// ─────────────────────────────────────────────

// POST /api/bookings/complete
// Creates a room booking together with optional extras (activities, vehicles, food orders) in one request.
// This is the main booking endpoint used by both the guest self-service portal
// and the receptionist walk-in booking wizard.
router.post('/complete', authorizeRole('guest', 'receptionist'), bookingController.completeBooking);

// ─────────────────────────────────────────────
// ROOM EXTENSION
// ─────────────────────────────────────────────

// PUT /api/bookings/rooms/:id/extend
// Extends the checkout date of an existing room booking.
// Guest can extend their own booking; receptionist can extend any booking.
router.put('/rooms/:id/extend', authorizeRole('guest', 'receptionist'), bookingController.extendRoomBooking);

// ─────────────────────────────────────────────
// ARRIVAL TRANSPORT (Airport Transfer)
// ─────────────────────────────────────────────

// POST /api/bookings/transport/arrival
// Guest requests an airport/transport pickup linked to their room booking.
// A driver will accept and set the price before the guest pays.
router.post('/transport/arrival', authorizeRole('guest'), bookingController.createArrivalTransport);

// GET /api/bookings/transport/arrival
// Returns all arrival transport requests made by the logged-in guest.
router.get('/transport/arrival', authorizeRole('guest'), bookingController.getGuestArrivalTransports);

module.exports = router;
