const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const receptionistController = require('../controllers/receptionistController');
const damageController = require('../controllers/damageController');
const { verifyToken, authorizeRole } = require('../config/auth');

// --- Multer Setup for Image Uploads ---
const createStorage = (folder) => multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, `../uploads/${folder}`);
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${folder.slice(0, -1)}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
    }
});

const uploadRoom = multer({ storage: createStorage('rooms') });
const uploadActivity = multer({ storage: createStorage('activities') });
const uploadVehicle = multer({ storage: createStorage('vehicles') });

router.use(verifyToken);
// Admin can also access these features usually, but strictly speaking this is receptionist role
router.use(authorizeRole('receptionist', 'admin'));

router.get('/dashboard', receptionistController.getDashboardStats);
router.get('/guests', receptionistController.getAllGuests);

// Booking Management
router.get('/bookings/rooms', receptionistController.getAllRoomBookings);
router.put('/bookings/rooms/:id/status', receptionistController.updateRoomBookingStatus);

router.get('/bookings/activities', receptionistController.getAllActivityBookings);
router.put('/bookings/activities/:id/status', receptionistController.updateActivityBookingStatus);

router.get('/bookings/vehicles', receptionistController.getAllVehicleBookings);
router.get('/bookings/orders', receptionistController.getAllFoodOrders);

// Vehicle Availability Management
router.get('/vehicles', receptionistController.getAllVehicles);
router.put('/vehicles/:id/status', receptionistController.updateVehicleStatus);

// Room Availability Management
router.get('/rooms', receptionistController.getAllRooms);
router.put('/rooms/:id/status', receptionistController.updateRoomStatus);

// Activity Availability Management
router.get('/activities', receptionistController.getAllActivities);
router.put('/activities/:id/status', receptionistController.updateActivityStatus);

// --- Resource CRUD Management Routes ---

// Room CRUD
router.post('/manage/rooms', uploadRoom.single('image'), receptionistController.createRoom);
router.put('/manage/rooms/:id', uploadRoom.single('image'), receptionistController.updateRoom);
router.delete('/manage/rooms/:id', receptionistController.deleteRoom);

// Activity CRUD
router.post('/manage/activities', uploadActivity.single('image'), receptionistController.createActivity);
router.put('/manage/activities/:id', uploadActivity.single('image'), receptionistController.updateActivity);
router.delete('/manage/activities/:id', receptionistController.deleteActivity);

// Vehicle CRUD
router.post('/manage/vehicles', uploadVehicle.single('image'), receptionistController.createVehicle);
router.put('/manage/vehicles/:id', uploadVehicle.single('image'), receptionistController.updateVehicle);
router.delete('/manage/vehicles/:id', receptionistController.deleteVehicle);

router.get('/refunds', receptionistController.getRefundRequests);
router.put('/refunds/:id', receptionistController.processRefund);

// Damages
router.post('/damages', damageController.reportDamage);
router.get('/damages', damageController.getAllDamages);

module.exports = router;

