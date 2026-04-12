const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const quickrideController = require('../controllers/quickrideController');
const { verifyToken, authorizeRole } = require('../config/auth');

router.use(verifyToken);
router.use(authorizeRole('driver'));

router.get('/trips', driverController.getAssignedTrips);
router.get('/requests', driverController.getHireRequests);
router.post('/requests/:id/accept', driverController.acceptHireRequest);
router.put('/trips/:id/status', driverController.updateTripStatus);
router.put('/vehicle/status', driverController.updateVehicleStatus);
router.put('/quickrides/:id/amount', quickrideController.setQuickRideAmount);

module.exports = router;
