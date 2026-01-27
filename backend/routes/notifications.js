const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const damageController = require('../controllers/damageController');
const { verifyToken, authorizeRole } = require('../config/auth');

router.use(verifyToken);

// --- Generic Notifications (All Users) ---
router.get('/', notificationController.getMyNotifications); // List my notifications
router.put('/mark-all-read', notificationController.markAllAsRead); // Mark all read
router.put('/:id/read', notificationController.markAsRead); // Mark single read
router.delete('/:id', notificationController.deleteNotification); // Delete

// --- Maintain Backward Compatibility / Damage Specific Notifications ---
// These specific routes might be used by existing frontend logic for Damages
// But ideally we should migrate to the generic system.
// For now, keep them but maybe wrap them.

router.get('/:guestId/damages', authorizeRole('guest'), damageController.getDamagesByGuest);
router.post('/damages/:id/pay', authorizeRole('guest'), damageController.payDamage); // Keep this for damage payment specifically

module.exports = router;
