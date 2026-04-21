/**
 * routes/payments.js — Payment Routes
 *
 * All routes require a valid JWT token (router.use(verifyToken)).
 * Accessible to any authenticated user role.
 *
 * Routes:
 *  GET  /api/payments/:id — Retrieve details of a specific payment record by payment_id
 *  POST /api/payments     — Generic payment processing endpoint (used for ad-hoc payments
 *                           or integration callbacks from an external payment gateway)
 *
 * Note: Most payments in the system are handled directly within the booking controllers
 * (e.g. bookingController.completeBooking creates a payment record as part of the booking flow).
 * This route is provided as a standalone utility for edge cases or future gateway integration.
 *
 * All routes are mounted at: /api/payments (see server.js)
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../config/auth');

// All payment routes require a valid JWT token
router.use(verifyToken);

// GET /api/payments/:id — Returns the payment record for a given payment_id
router.get('/:id', paymentController.getPaymentDetails);

// POST /api/payments — Processes a standalone payment (currently a stub for gateway integration)
router.post('/', paymentController.processPayment);

module.exports = router;
