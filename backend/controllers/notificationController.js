const db = require('../config/db');

// --- Helper Function ---
exports.createNotification = async (userId, title, message, type = 'System', action_url = null) => {
    try {
        await db.query(
            'INSERT INTO notifications (user_id, title, message, type, is_read, action_url) VALUES (?, ?, ?, ?, FALSE, ?)',
            [userId, title, message, type, action_url]
        );
        console.log(`Notification sent to User ${userId}: ${title}`);
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};

// --- API Handlers ---

// Get User's Notifications
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

// Mark as Read
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

// Mark All as Read
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};

// Delete Notification
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await db.query('DELETE FROM notifications WHERE notification_id = ? AND user_id = ?', [id, userId]);
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};
