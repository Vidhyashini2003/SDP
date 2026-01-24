const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, authorizeRole } = require('../config/auth');

router.use(verifyToken);
router.use(authorizeRole('admin'));

router.get('/dashboard', adminController.getDashboardStats);

// Staff
router.get('/staff', adminController.getAllStaff);
router.post('/staff', adminController.addStaff);
router.delete('/staff/:type/:id', adminController.deleteStaff);

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

module.exports = router;
