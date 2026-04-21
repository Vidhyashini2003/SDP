/**
 * routes/admin.js — Admin Portal Routes
 *
 * All routes in this file are restricted to users with role = 'admin'.
 * Both verifyToken and authorizeRole('admin') are applied at the top with router.use().
 *
 * Features available to admin:
 *  - Dashboard summary statistics
 *  - Staff management: list, invite (send activation email), delete, update, change status
 *  - Customer management: list, delete, update, change status
 *    (Customer routes reuse staff handlers since they work on the Users table by user_id)
 *  - Resource management: add rooms, activities, and vehicles
 *  - Reports: generate and retrieve system-wide booking/user reports
 *  - Menu item management: list all, toggle availability status
 *
 * All routes are mounted at: /api/admin (see server.js)
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, authorizeRole } = require('../config/auth');

// Apply JWT verification AND admin-only access to every route below
router.use(verifyToken);
router.use(authorizeRole('admin')); // Only admins can access anything under /api/admin

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

// GET /api/admin/dashboard — Returns key system statistics (bookings, revenue, staff counts, etc.)
router.get('/dashboard', adminController.getDashboardStats);

// ─────────────────────────────────────────────
// STAFF MANAGEMENT
// ─────────────────────────────────────────────

// GET    /api/admin/staff           — List all staff (receptionists, chefs, drivers)
// POST   /api/admin/staff/invite    — Invite a new staff member (sends activation email)
// DELETE /api/admin/staff/:type/:id — Delete a staff account by type ('receptionist'/'chef'/'driver') and ID
// PUT    /api/admin/staff/:id/status — Activate or deactivate a staff account
// PUT    /api/admin/staff/:id        — Update a staff member's name, email, etc.
router.get('/staff', adminController.getAllStaff);
router.post('/staff/invite', adminController.inviteStaff);
router.delete('/staff/:type/:id', adminController.deleteStaff);
router.put('/staff/:id/status', adminController.updateStaffStatus);
router.put('/staff/:id', adminController.updateStaff);

// ─────────────────────────────────────────────
// CUSTOMER MANAGEMENT
// ─────────────────────────────────────────────

// GET    /api/admin/customers       — List all registered guests
// DELETE /api/admin/customers/:id   — Delete a guest account (reuses deleteStaff — removes from Users table)
// PUT    /api/admin/customers/:id/status — Toggle active/inactive status of a guest account
// PUT    /api/admin/customers/:id   — Update guest name, email, etc.
router.get('/customers', adminController.getAllGuests);
router.delete('/customers/:id', adminController.deleteStaff); // Reusing deleteStaff as it deletes by user_id from Users table
router.put('/customers/:id/status', adminController.updateStaffStatus); // Reuse generic user status update
router.put('/customers/:id', adminController.updateStaff); // Reuse generic user update

// ─────────────────────────────────────────────
// RESOURCE MANAGEMENT
// ─────────────────────────────────────────────

// POST /api/admin/rooms      — Add a new room type/record
// PUT  /api/admin/rooms/:id  — Update an existing room
router.post('/rooms', adminController.addRoom);
router.put('/rooms/:id', adminController.updateRoom);

// POST /api/admin/activities — Add a new activity
router.post('/activities', adminController.addActivity);

// POST /api/admin/vehicles   — Add a new vehicle
router.post('/vehicles', adminController.addVehicle);

// ─────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────

// GET  /api/admin/reports    — List all generated reports
// POST /api/admin/reports    — Generate a new report (bookings, revenue, users, etc.)
router.get('/reports', adminController.getAllReports);
router.post('/reports', adminController.generateReport);

// ─────────────────────────────────────────────
// MENU ITEM MANAGEMENT
// ─────────────────────────────────────────────

// GET /api/admin/menu-items            — List all menu items (both available and unavailable)
// PUT /api/admin/menu-items/:id/status — Toggle an item's availability (Available / Unavailable)
router.get('/menu-items', adminController.getAllMenuItems);
router.put('/menu-items/:id/status', adminController.updateMenuItemStatus);

module.exports = router;
