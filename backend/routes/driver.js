/**
 * routes/driver.js — Driver Portal Routes
 *
 * All routes require a valid JWT token AND role = 'driver'.
 * Both middleware are applied globally at the top with router.use().
 *
 * Features:
 *  - View assigned trips (vehicle hires + arrival transports)
 *  - View and accept new hire requests (per-day vehicle hires assigned to this driver's vehicle)
 *  - Update trip status (e.g. 'In Progress', 'Completed')
 *  - Update own vehicle's availability status (Available / Unavailable)
 *  - Set the price for a quick ride (point-to-point) after the driver assesses the route
 *  - View and process refund requests (for vehicle hires the driver is linked to)
 *
 * All routes are mounted at: /api/driver (see server.js)
 */

const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const quickrideController = require('../controllers/quickrideController');
const { verifyToken, authorizeRole } = require('../config/auth');

// Apply JWT verification AND driver-only access to all routes below
router.use(verifyToken);
router.use(authorizeRole('driver')); // Only drivers can access these routes

// ─────────────────────────────────────────────
// TRIPS & HIRE REQUESTS
// ─────────────────────────────────────────────

// GET /api/driver/trips           — Returns all vehicle hire trips assigned to this driver
router.get('/trips', driverController.getAssignedTrips);

// GET /api/driver/requests        — Returns pending hire requests for this driver's vehicle
router.get('/requests', driverController.getHireRequests);

// POST /api/driver/requests/:id/accept — Driver accepts a pending hire request.
//   Assigns the driver to the booking; guest is notified to proceed with payment.
router.post('/requests/:id/accept', driverController.acceptHireRequest);

// PUT /api/driver/trips/:id/status — Updates the trip status (e.g. 'In Progress' → 'Completed')
router.put('/trips/:id/status', driverController.updateTripStatus);

// ─────────────────────────────────────────────
// VEHICLE STATUS
// ─────────────────────────────────────────────

// PUT /api/driver/vehicle/status — Driver marks their vehicle as Available or Unavailable
//   (e.g. when the vehicle goes in for maintenance)
router.put('/vehicle/status', driverController.updateVehicleStatus);

// ─────────────────────────────────────────────
// QUICK RIDE
// ─────────────────────────────────────────────

// PUT /api/driver/quickrides/:id/amount — Driver sets the fare amount for a quick ride request.
//   After this, the guest receives a notification to pay.
router.put('/quickrides/:id/amount', quickrideController.setQuickRideAmount);

// ─────────────────────────────────────────────
// REFUNDS
// ─────────────────────────────────────────────

// GET /api/driver/refunds          — Lists refund requests linked to this driver's trips
router.get('/refunds', driverController.getRefundRequests);

// PUT /api/driver/refunds/:id/process — Driver confirms or rejects a refund for their trip
router.put('/refunds/:id/process', driverController.processRefundRequest);

module.exports = router;
