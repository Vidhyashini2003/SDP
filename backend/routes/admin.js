const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, authorizeRole } = require('../config/auth');

router.use(verifyToken);
router.use(authorizeRole('admin'));

router.get('/dashboard', adminController.getDashboardStats);

// Staff
router.get('/staff', adminController.getAllStaff);
router.post('/staff/invite', adminController.inviteStaff);
router.delete('/staff/:type/:id', adminController.deleteStaff);
router.put('/staff/:id/status', adminController.updateStaffStatus);
router.put('/staff/:id', adminController.updateStaff);

// Customers
router.get('/customers', adminController.getAllGuests);
router.delete('/customers/:id', adminController.deleteStaff); // Reusing deleteStaff as it deletes by user_id from Users table
router.put('/customers/:id/status', adminController.updateStaffStatus); // Reuse generic user status update
router.put('/customers/:id', adminController.updateStaff); // Reuse generic user update

// Rooms
router.post('/rooms', adminController.addRoom);
router.put('/rooms/:id', adminController.updateRoom);
// router.delete('/rooms/:id') etc.

// Activities
router.post('/activities', adminController.addActivity);

// Vehicles
router.post('/vehicles', adminController.addVehicle);

// Reports
router.get('/reports', adminController.getAllReports);
router.post('/reports', adminController.generateReport);

// Menu Items
router.get('/menu-items', adminController.getAllMenuItems);
router.put('/menu-items/:id/status', adminController.updateMenuItemStatus);

module.exports = router;
