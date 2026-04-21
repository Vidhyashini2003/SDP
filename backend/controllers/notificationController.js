/**
 * controllers/notificationController.js — Notification System
 *
 * This controller manages the in-app notification system used across all roles.
 *
 * Functions:
 *
 *  createNotification(userId, title, message, type, action_url)
 *    — Internal helper (NOT an HTTP handler). Called by other controllers to
 *      programmatically send notifications to any user.
 *      Example: notify a driver when their hire request is cancelled.
 *
 *  getMyNotifications()  — GET /api/notifications
 *    Returns all notifications for the logged-in user, sorted newest first.
 *
 *  markAsRead()          — PUT /api/notifications/:id/read
 *    Marks a single notification as read (is_read = TRUE).
 *    Verifies the notification belongs to the requesting user first.
 *
 *  markAllAsRead()       — PUT /api/notifications/mark-all-read
 *    Marks ALL notifications for the logged-in user as read in one query.
 *
 *  deleteNotification()  — DELETE /api/notifications/:id
 *    Deletes a single notification. Only deletes if it belongs to the user
 *    (user_id check in the WHERE clause prevents deleting others' notifications).
 *
 * Database Table: notifications
 *   Columns: notification_id, user_id, title, message, type, is_read, action_url, created_at
 *
 * All routes are mounted at: /api/notifications (see routes/notifications.js and server.js)
 */

const db = require('../config/db');

// ─────────────────────────────────────────────
// INTERNAL HELPER — Not an HTTP handler
// ─────────────────────────────────────────────

/**
 * createNotification — Inserts a notification record for a given user.
 * Called internally by other controllers (not exposed as an HTTP endpoint).
 *
 * @param {number} userId     — The user_id of the recipient (from Users table)
 * @param {string} title      — Short title shown in the notification header
 * @param {string} message    — Detailed notification message body
 * @param {string} type       — Category: 'Booking', 'System', 'Payment', etc.
 * @param {string} action_url — Optional deep-link URL for the notification (e.g. '/guest/bookings')
 */
exports.createNotification = async (userId, title, message, type = 'System', action_url = null) => {
    try {
        await db.query(
            'INSERT INTO notifications (user_id, title, message, type, is_read, action_url) VALUES (?, ?, ?, ?, FALSE, ?)',
            [userId, title, message, type, action_url]
        );
        console.log(`Notification sent to User ${userId}: ${title}`);
    } catch (error) {
        // Log but don't throw — a notification failure should never crash the main operation
        console.error('Failed to create notification:', error);
    }
};

// ─────────────────────────────────────────────
// API HANDLERS
// ─────────────────────────────────────────────

/**
 * GET /api/notifications
 * Returns all notifications for the currently logged-in user, ordered by newest first.
 */
exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const [notifications] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.json(notifications);
    } catch (error) {
        console.error('Fetch Notifications Error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

/**
 * PUT /api/notifications/:id/read
 * Marks a single notification as read. First checks ownership to prevent
 * users from marking other users' notifications as read.
 */
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Ensure notification belongs to user
        const [exists] = await db.query('SELECT * FROM notifications WHERE notification_id = ? AND user_id = ?', [id, userId]);
        if (exists.length === 0) return res.status(404).json({ error: 'Notification not found' });

        await db.query('UPDATE notifications SET is_read = TRUE WHERE notification_id = ?', [id]);
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

/**
 * PUT /api/notifications/mark-all-read
 * Marks ALL notifications for the logged-in user as read in a single UPDATE query.
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};

/**
 * DELETE /api/notifications/:id
 * Deletes a specific notification. The WHERE clause includes user_id to ensure
 * a user can only delete their own notifications (security guard).
 */
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Only delete if the notification belongs to this user
        await db.query('DELETE FROM notifications WHERE notification_id = ? AND user_id = ?', [id, userId]);
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};
