/**
 * routes/receptionist.js — Receptionist Portal Routes
 *
 * All routes require a valid JWT token AND role = 'receptionist' or 'admin'.
 * Both middleware are applied globally at the top with router.use().
 *
 * Features:
 *  - Dashboard statistics (check-ins today, occupancy, pending orders, etc.)
 *  - Guest management: list all guests, register walk-in guests (with NIC image upload)
 *  - Booking management: view and update status of room, activity, vehicle, and food bookings
 *  - Availability management: update room, vehicle, and activity availability status
 *  - Resource CRUD: create, update, and delete rooms, activities, and vehicles with image uploads
 *  - Refund management: view refund requests, process (approve/reject) refunds
 *  - Damage reporting: report and list damage records; check pending payments on a booking
 *  - Walk-in vehicle payment: record cash payment at reception desk for an approved vehicle hire
 *
 * Image uploads (Multer):
 *   Files are stored in /uploads/<folder>/ (e.g. /uploads/rooms/, /uploads/vehicles/).
 *   A unique filename is generated using timestamp + random number to avoid collisions.
 *   Separate multer instances are created for rooms, activities, vehicles, and NIC documents.
 *
 * All routes are mounted at: /api/receptionist (see server.js)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const receptionistController = require('../controllers/receptionistController');
const damageController = require('../controllers/damageController');
const { verifyToken, authorizeRole } = require('../config/auth');

// ─────────────────────────────────────────────
// MULTER FILE UPLOAD CONFIGURATION
// Creates separate disk storage instances for each resource type.
// Images are saved to backend/uploads/<folder>/ (e.g. uploads/rooms/).
// ─────────────────────────────────────────────

/**
 * createStorage(folder) — Factory function that creates a multer disk storage config.
 * @param {string} folder - Subfolder name inside /uploads/ (e.g. 'rooms', 'vehicles')
 * @returns multer.StorageEngine
 */
const createStorage = (folder) => multer.diskStorage({
    destination: (req, file, cb) => {
        // Build the absolute path and create the directory if it doesn't exist yet
        const uploadPath = path.join(__dirname, `../uploads/${folder}`);
        fs.mkdirSync(uploadPath, { recursive: true }); // recursive: true avoids error if already exists
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: e.g. "room-1713700800000-123456789.jpg"
        cb(null, `${folder.slice(0, -1)}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
    }
});

// Create separate upload middleware for each resource type
const uploadRoom     = multer({ storage: createStorage('rooms') });
const uploadActivity = multer({ storage: createStorage('activities') });
const uploadVehicle  = multer({ storage: createStorage('vehicles') });
const uploadNIC      = multer({ storage: createStorage('nic_documents') }); // For walk-in guest NIC/passport scans

// ─────────────────────────────────────────────
// AUTHENTICATION & AUTHORIZATION
// ─────────────────────────────────────────────

// All routes require a valid JWT token
router.use(verifyToken);
// Admin can also access these features usually, but strictly speaking this is receptionist role
// Only 'receptionist' and 'admin' roles are allowed
router.use(authorizeRole('receptionist', 'admin'));

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

// GET /api/receptionist/dashboard — Returns stats: today's check-ins, occupancy, pending orders, etc.
router.get('/dashboard', receptionistController.getDashboardStats);

// ─────────────────────────────────────────────
// GUEST MANAGEMENT
// ─────────────────────────────────────────────

// GET  /api/receptionist/guests           — List all registered guests
router.get('/guests', receptionistController.getAllGuests);

// POST /api/receptionist/walkin/register  — Register a walk-in guest manually at the front desk.
// Accepts a NIC/passport image upload. Creates a walkin_guest record (NOT a full account).
router.post('/walkin/register', uploadNIC.single('nic_image'), receptionistController.registerWalkinGuest);

// ─────────────────────────────────────────────
// BOOKING MANAGEMENT
// ─────────────────────────────────────────────

// GET /api/receptionist/bookings/rooms    — All room bookings (with guest info)
// PUT /api/receptionist/bookings/rooms/:id/status — Update room booking status (Check-in, Check-out, etc.)
router.get('/bookings/rooms', receptionistController.getAllRoomBookings);
router.put('/bookings/rooms/:id/status', receptionistController.updateRoomBookingStatus);

// GET /api/receptionist/bookings/activities — All activity bookings
// PUT /api/receptionist/bookings/activities/:id/status — Update activity booking status
router.get('/bookings/activities', receptionistController.getAllActivityBookings);
router.put('/bookings/activities/:id/status', receptionistController.updateActivityBookingStatus);

// GET /api/receptionist/bookings/vehicles — All vehicle hire bookings
router.get('/bookings/vehicles', receptionistController.getAllhirevehicles);

// GET /api/receptionist/bookings/orders   — All food orders
router.get('/bookings/orders', receptionistController.getAllFoodOrders);

// ─────────────────────────────────────────────
// AVAILABILITY MANAGEMENT
// ─────────────────────────────────────────────

// Vehicles — toggle 'Available' / 'Unavailable' status
router.get('/vehicles', receptionistController.getAllVehicles);
router.put('/vehicles/:id/status', receptionistController.updateVehicleStatus);

// Rooms — toggle room availability
router.get('/rooms', receptionistController.getAllRooms);
router.put('/rooms/:id/status', receptionistController.updateRoomStatus);

// Activities — toggle activity availability
router.get('/activities', receptionistController.getAllActivities);
router.put('/activities/:id/status', receptionistController.updateActivityStatus);

// ─────────────────────────────────────────────
// RESOURCE CRUD MANAGEMENT
// Create, update, and delete rooms, activities, and vehicles.
// Image uploads are handled by multer middleware before the controller.
// ─────────────────────────────────────────────

// Rooms
router.post('/manage/rooms', uploadRoom.single('image'), receptionistController.createRoom);
router.put('/manage/rooms/:id', uploadRoom.single('image'), receptionistController.updateRoom);
router.delete('/manage/rooms/:id', receptionistController.deleteRoom);

// Activities
router.post('/manage/activities', uploadActivity.single('image'), receptionistController.createActivity);
router.put('/manage/activities/:id', uploadActivity.single('image'), receptionistController.updateActivity);
router.delete('/manage/activities/:id', receptionistController.deleteActivity);

// Vehicles
router.post('/manage/vehicles', uploadVehicle.single('image'), receptionistController.createVehicle);
router.put('/manage/vehicles/:id', uploadVehicle.single('image'), receptionistController.updateVehicle);
router.delete('/manage/vehicles/:id', receptionistController.deleteVehicle);

// ─────────────────────────────────────────────
// REFUND MANAGEMENT
// ─────────────────────────────────────────────

// GET /api/receptionist/refunds      — List all pending refund requests
// PUT /api/receptionist/refunds/:id  — Approve or reject a refund request
router.get('/refunds', receptionistController.getRefundRequests);
router.put('/refunds/:id', receptionistController.processRefund);

// ─────────────────────────────────────────────
// DAMAGE MANAGEMENT
// ─────────────────────────────────────────────

// POST /api/receptionist/damages                          — Report a new damage (room/vehicle/equipment)
// GET  /api/receptionist/damages                          — List all damage reports
// GET  /api/receptionist/bookings/rooms/:rb_id/pending-payments — Check if a booking has unpaid damage fees
router.post('/damages', damageController.reportDamage);
router.get('/damages', damageController.getAllDamages);
router.get('/bookings/rooms/:rb_id/pending-payments', damageController.checkPendingPayments);

// ─────────────────────────────────────────────
// WALK-IN VEHICLE PAYMENT
// ─────────────────────────────────────────────

// POST /api/receptionist/walkin/pay-vehicle/:vb_id
// Processes a cash payment at the front desk for a walk-in guest's vehicle hire
// after the driver has accepted the booking and the guest returns to pay.
router.post('/walkin/pay-vehicle/:vb_id', receptionistController.payWalkinVehicle);

module.exports = router;

