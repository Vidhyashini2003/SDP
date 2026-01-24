const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { verifyToken, authorizeRole } = require('../config/auth');

router.use(verifyToken);
router.use(authorizeRole('driver'));

router.get('/trips', driverController.getAssignedTrips);
router.put('/trips/:id/status', driverController.updateTripStatus);
router.put('/vehicle/status', driverController.updateVehicleStatus);

module.exports = router;
