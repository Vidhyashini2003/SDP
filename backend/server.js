const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Import routes
const authRoutes = require('./routes/auth');
const guestRoutes = require('./routes/guest');
const bookingRoutes = require('./routes/bookings');
const orderRoutes = require('./routes/orders');
const receptionistRoutes = require('./routes/receptionist');
const chefRoutes = require('./routes/chef');
const driverRoutes = require('./routes/driver');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');

// Public routes (no auth required)
const db = require('./config/db');

// Get all rooms
app.get('/api/rooms', async (req, res) => {
    try {
        const [rooms] = await db.query('SELECT * FROM Room ORDER BY room_type');
        res.json(rooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/chef', chefRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Hotel Management API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// Initialize Background Chron Jobs
const initCronJobs = require('./utils/cronJobs');
initCronJobs();

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}/api`);
    console.log(`📅 Background Cron Jobs initialized and scanning...`);
});
