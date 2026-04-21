/**
 * routes/reports.js — Admin Reporting Routes
 *
 * All routes require a valid JWT token AND role = 'admin'.
 * Both middleware are applied globally at the top with router.use().
 *
 * Routes:
 *  GET /api/reports/bookings          — Aggregated booking statistics report
 *                                       (total bookings, revenue, occupancy by date range)
 *  GET /api/reports/users             — User/guest registration statistics report
 *  GET /api/reports/user-history/:userId — Full booking history for a specific user
 *                                          (useful for customer service lookups)
 *
 * These routes are used by the Reports page in the Admin portal (/admin/reports).
 * The frontend sends date range parameters as query strings (e.g. ?start=2024-01-01&end=2024-12-31).
 *
 * All routes are mounted at: /api/reports (see server.js)
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, authorizeRole } = require('../config/auth');

// All report routes are restricted to admin users only
router.use(verifyToken);
router.use(authorizeRole('admin'));

// GET /api/reports/bookings — Returns booking statistics (count, revenue, etc.) for the admin dashboard
router.get('/bookings', reportController.getBookingReport);

// GET /api/reports/users — Returns user/guest registration counts and activity metrics
router.get('/users', reportController.getUserReport);

// GET /api/reports/user-history/:userId — Returns the complete service history for a specific guest
router.get('/user-history/:userId', reportController.getUserHistory);

module.exports = router;
