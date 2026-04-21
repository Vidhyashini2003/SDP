/**
 * server.js — Main Entry Point for the Hotel Management System Backend
 *
 * This file bootstraps the entire Express application:
 *  1. Loads environment variables from the .env file
 *  2. Configures global middleware (CORS, JSON parsing, static files, request logger)
 *  3. Mounts all route modules under their /api/* prefixes
 *  4. Provides a public /api/rooms endpoint (no authentication needed)
 *  5. Registers a global error-handling middleware
 *  6. Starts scheduled background cron jobs
 *  7. Starts the HTTP server on the configured PORT
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env (DB credentials, JWT secret, etc.)

const app = express();
const PORT = process.env.PORT || 5000; // Default to port 5000 if not set in .env

// ─────────────────────────────────────────────
// GLOBAL MIDDLEWARE
// ─────────────────────────────────────────────

// Allow cross-origin requests from the frontend (Vite dev server on port 5173)
app.use(cors());

// Parse incoming JSON request bodies (e.g. { email: '...', password: '...' })
app.use(express.json());

// Parse URL-encoded form data (for multipart forms)
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images (room photos, vehicle images, NIC documents, menu images)
// Accessible at: http://localhost:5000/uploads/<folder>/<filename>
app.use('/uploads', express.static('uploads'));

// Log every incoming HTTP request with timestamp, method, and URL
// Useful for debugging and monitoring traffic during development
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ─────────────────────────────────────────────
// ROUTE IMPORTS
// Each route file handles one domain of the system
// ─────────────────────────────────────────────
const authRoutes = require('./routes/auth');             // Login, register, password reset
const guestRoutes = require('./routes/guest');           // Guest profile, bookings, orders, quick rides
const bookingRoutes = require('./routes/bookings');      // Room/activity/vehicle booking creation
const orderRoutes = require('./routes/orders');          // Food order placement
const receptionistRoutes = require('./routes/receptionist'); // Receptionist dashboard, walk-in, refunds
const chefRoutes = require('./routes/chef');             // Kitchen staff: orders, menu management
const driverRoutes = require('./routes/driver');         // Driver trips, hire requests, refunds
const adminRoutes = require('./routes/admin');           // Admin: staff, customers, reports
const paymentRoutes = require('./routes/payments');      // Payment record retrieval

// ─────────────────────────────────────────────
// PUBLIC ENDPOINT (No Authentication Required)
// ─────────────────────────────────────────────

const db = require('./config/db'); // Import DB pool for the public rooms query

// GET /api/rooms — Returns all rooms ordered by type.
// Used on the landing page so visitors can see available rooms before logging in.
app.get('/api/rooms', async (req, res) => {
    try {
        const [rooms] = await db.query('SELECT * FROM Room ORDER BY room_type');
        res.json(rooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

// ─────────────────────────────────────────────
// ROUTE MOUNTING
// All authenticated/protected routes are prefixed with /api/
// ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);               // → /api/auth/login, /api/auth/register, etc.
app.use('/api/guest', guestRoutes);             // → /api/guest/profile, /api/guest/bookings, etc.
app.use('/api/bookings', bookingRoutes);        // → /api/bookings/rooms, /api/bookings/activities, etc.
app.use('/api/orders', orderRoutes);            // → /api/orders (place/view food orders)
app.use('/api/receptionist', receptionistRoutes); // → /api/receptionist/dashboard, etc.
app.use('/api/chef', chefRoutes);               // → /api/chef/orders, /api/chef/menu, etc.
app.use('/api/driver', driverRoutes);           // → /api/driver/trips, /api/driver/requests, etc.
app.use('/api/admin', adminRoutes);             // → /api/admin/staff, /api/admin/reports, etc.
app.use('/api/payments', paymentRoutes);        // → /api/payments/:id
app.use('/api/notifications', require('./routes/notifications')); // → /api/notifications
app.use('/api/reports', require('./routes/reports'));             // → /api/reports/bookings, etc.

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────

// GET /api/health — Simple ping to verify the server is alive.
// Useful for deployment monitoring and load-balancer checks.
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Hotel Management API is running' });
});

// ─────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// Catches any unhandled errors thrown in route handlers.
// Express identifies this as an error handler because it has 4 parameters (err, req, res, next).
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// ─────────────────────────────────────────────
// BACKGROUND CRON JOBS
// Schedules automated tasks that run every 5 minutes (status sync for bookings/orders).
// See utils/cronJobs.js for details.
// ─────────────────────────────────────────────
const initCronJobs = require('./utils/cronJobs');
initCronJobs();

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}/api`);
    console.log(`📅 Background Cron Jobs initialized and scanning...`);
});
