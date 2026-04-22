/**
 * routes/guest.js — Guest Portal Routes
 *
 * All routes in this file are protected — every request must include a valid JWT token.
 * The token is verified by the verifyToken middleware applied at the top with router.use().
 *
 * Route categories:
 *  A. GUEST-ONLY routes: Require role = 'guest'
 *     - Profile management (view/update)
 *     - Booking management (view, grouped view, active bookings)
 *     - Booking cancellations (room, activity, vehicle, arrival transport)
 *     - Food order management (place, cancel, cancel individual items)
 *     - Quick ride requests (request, view, pay)
 *     - Vehicle & Arrival payment
 *
 *  B. SHARED routes: Accessible by guest, receptionist, or admin
 *     - Browse available activities, vehicles, and food menu
 *     - Receptionist needs these to create walk-in bookings on behalf of guests
 *
 * All routes are mounted at: /api/guest (see server.js)
 */

const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const orderController = require('../controllers/orderController');
const quickrideController = require('../controllers/quickrideController');
const { verifyToken, authorizeRole } = require('../config/auth');

// Apply JWT verification to ALL routes in this file (no public routes here)
router.use(verifyToken);

// ─────────────────────────────────────────────
// GUEST-ONLY ROUTES (role = 'guest')
// ─────────────────────────────────────────────
const guestOnly = authorizeRole('guest'); // Shorthand middleware for guest role

// --- Profile ---
router.get('/profile', guestOnly, guestController.getProfile);           // View own profile
router.put('/profile', guestOnly, guestController.updateProfile);        // Update name, phone, NIC, nationality

//Special Requests
router.post('/requests', guestOnly, guestController.createSpecialRequest);        // CREATE: Submit a new request
router.get('/requests', guestOnly, guestController.getSpecialRequests);           // READ:   View all my requests
router.put('/requests/:id', guestOnly, guestController.updateSpecialRequest);     // UPDATE: Edit a pending request
router.delete('/requests/:id', guestOnly, guestController.deleteSpecialRequest);  // DELETE: Remove a pending request

// --- Booking Views ---
router.get('/bookings', guestOnly, guestController.getMyBookings);                   // All bookings (flat list)
router.get('/bookings/grouped', guestOnly, guestController.getGroupedBookings);      // Bookings grouped by room trip (includes activities, food, vehicles)
router.get('/bookings/active', guestOnly, guestController.getActiveBookings);        // Only active (current) room bookings

// --- Room Booking Cancellation ---
// POST instead of PUT because it has complex side-effects (cascading cancel + optional refund)
router.post('/bookings/rooms/:id/cancel', guestOnly, guestController.cancelRoomBooking);

// --- Food Orders ---
router.get('/orders', guestOnly, guestController.getOrders);                         // View all food orders
router.post('/orders', guestOnly, orderController.placeOrder);                       // Place a single food order
router.post('/orders/bulk', guestOnly, orderController.placeBulkOrder);              // Place multiple items in one order
router.put('/orders/:id/cancel', guestOnly, guestController.cancelFoodOrder);        // Cancel an entire food order
router.put('/orders/:orderId/items/:itemId/cancel', guestOnly, guestController.cancelFoodOrderItem); // Cancel one item from an order

// --- Activity Booking Cancellation ---
router.put('/bookings/activities/:id/cancel', guestOnly, guestController.cancelActivityBooking);

// --- Vehicle Hire (Per-Day Hire) ---
router.post('/bookings/vehicles/:id/pay', guestOnly, guestController.payhirevehicle);   // Pay for an approved vehicle hire
router.put('/bookings/vehicles/:id/cancel', guestOnly, guestController.cancelVehicleHire); // Cancel a vehicle hire

// --- Arrival Transport (Airport Transfer) ---
router.post('/bookings/arrivals/:id/pay', guestOnly, guestController.payArrivalTransport);     // Pay for airport transfer after driver accepts
router.put('/bookings/arrivals/:id/cancel', guestOnly, guestController.cancelArrivalTransport); // Cancel airport transfer

// --- Quick Ride (Point-to-Point) ---
router.post('/quickrides', guestOnly, quickrideController.requestQuickRide);     // Request a quick ride
router.get('/quickrides', guestOnly, quickrideController.getGuestQuickRides);   // View all quick rides for this guest
router.post('/quickrides/:id/pay', guestOnly, quickrideController.payQuickRide); // Pay for a quick ride once driver sets amount

// ─────────────────────────────────────────────
// SHARED INFORMATIONAL ROUTES
// Accessible by: guest | receptionist | admin
// Receptionist needs these to look up options when making walk-in bookings on behalf of a guest.
// ─────────────────────────────────────────────
const shared = authorizeRole('guest', 'receptionist', 'admin');

router.get('/activities', shared, guestController.getActivities); // List all available activities
router.get('/vehicles', shared, guestController.getVehicles);     // List all available vehicles
router.get('/menu', shared, guestController.getMenu);             // List all available menu items

module.exports = router;
