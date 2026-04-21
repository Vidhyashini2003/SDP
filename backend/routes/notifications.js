/**
 * routes/notifications.js — Notification Routes (All Roles)
 *
 * All routes require a valid JWT token (router.use(verifyToken)).
 * These routes are available to ALL authenticated users regardless of role.
 *
 * Generic Notification routes:
 *   GET  /api/notifications            — List all notifications for the current user
 *   PUT  /api/notifications/mark-all-read — Mark all notifications as read
 *   PUT  /api/notifications/:id/read   — Mark a single notification as read
 *   DELETE /api/notifications/:id      — Delete a single notification
 *
 * Damage-specific routes (backward compatibility):
 *   GET  /api/notifications/:guestId/damages — Get damage records for a specific guest (guest only)
 *   POST /api/notifications/damages/:id/pay  — Guest pays for a damage report (guest only)
 *
 * Note: The damage-specific routes exist for backward compatibility with older frontend logic.
 * Ideally these should migrate to the main damage routes under /api/receptionist/damages.
 *
 * All routes are mounted at: /api/notifications (see server.js)
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const damageController = require('../controllers/damageController');
const { verifyToken, authorizeRole } = require('../config/auth');

// All notification routes require a valid JWT token
router.use(verifyToken);

// ─────────────────────────────────────────────
// GENERIC NOTIFICATIONS (All Roles)
// ─────────────────────────────────────────────

// GET    /api/notifications           — Returns all notifications for the current user
router.get('/', notificationController.getMyNotifications); // List my notifications

// PUT    /api/notifications/mark-all-read — Marks all unread notifications as read
router.put('/mark-all-read', notificationController.markAllAsRead); // Mark all read

// PUT    /api/notifications/:id/read  — Marks one notification as read
router.put('/:id/read', notificationController.markAsRead); // Mark single read

// DELETE /api/notifications/:id       — Deletes one notification
router.delete('/:id', notificationController.deleteNotification); // Delete

// ─────────────────────────────────────────────
// DAMAGE-SPECIFIC ROUTES (Backward Compatibility)
// These specific routes might be used by existing frontend logic for Damages.
// But ideally we should migrate to the generic system.
// For now, keep them but maybe wrap them.
// ─────────────────────────────────────────────

// GET /api/notifications/:guestId/damages — Get all damage records for a specific guest
router.get('/:guestId/damages', authorizeRole('guest'), damageController.getDamagesByGuest);

// POST /api/notifications/damages/:id/pay — Guest pays for a specific damage charge
router.post('/damages/:id/pay', authorizeRole('guest'), damageController.payDamage); // Keep this for damage payment specifically

module.exports = router;
