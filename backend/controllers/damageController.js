const db = require('../config/db');
const notificationController = require('./notificationController');

// Report Damage (Receptionist / Staff)
exports.reportDamage = async (req, res) => {
    try {
        const { guest_id, damage_type, description, charge_amount } = req.body;
        // reported_by can be inferred from token or passed manually
        const reported_by = req.user ? req.user.role : 'Staff';

        await db.query(
            'INSERT INTO damage (guest_id, reported_by, damage_type, description, charge_amount) VALUES (?, ?, ?, ?, ?)',
            [guest_id, reported_by, damage_type, description, charge_amount]
        );

        // Notify Guest
        const [guest] = await db.query('SELECT user_id FROM Guest WHERE guest_id = ?', [guest_id]);
        if (guest.length > 0) {
            await notificationController.createNotification(
                guest[0].user_id,
                'New Damage Report',
                `A damage report for '${damage_type}' has been filed. Amount: Rs. ${charge_amount}. Please review details and proceed to payment.`,
                'Damage',
                '/guest/notifications'
            );
        }

        res.status(201).json({ message: 'Damage reported successfully' });
    } catch (error) {
        console.error('Report damage error:', error);
        res.status(500).json({ error: 'Failed to report damage' });
    }
};

// Get All Damages (Receptionist Dashboard)
exports.getAllDamages = async (req, res) => {
    try {
        const [damages] = await db.query(
            `SELECT d.*, CONCAT(u.first_name, ' ', u.last_name) as guest_name, g.guest_phone 
             FROM damage d 
             JOIN Guest g ON d.guest_id = g.guest_id 
             JOIN Users u ON g.user_id = u.user_id
             ORDER BY d.report_date DESC`
        );
        res.json(damages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch damage reports' });
    }
};

// Get Damages by Guest ID (Guest Notification)
exports.getDamagesByGuest = async (req, res) => {
    try {
        let { guestId } = req.params;
        const userId = req.user.id;

        // Verify user is accessing their own data or is admin/receptionist
        if (req.user.role === 'guest') {
            // Check if this guestId belongs to the user
            const [guest] = await db.query('SELECT guest_id FROM Guest WHERE user_id = ?', [userId]);

            if (guest.length === 0) {
                return res.status(403).json({ error: 'No guest profile found' });
            }

            // Always use the real guest_id from the database for the logged-in user
            // This overrides whatever ID was passed in the URL (which is likely the user_id from frontend)
            guestId = guest[0].guest_id;
        }

        const [damages] = await db.query(
            'SELECT * FROM damage WHERE guest_id = ? ORDER BY report_date DESC',
            [guestId]
        );
        res.json(damages);
    } catch (error) {
        console.error('Fetch damages error:', error);
        res.status(500).json({ error: 'Failed to fetch your damage reports' });
    }
};

// Process Payment for Damage (Guest)
exports.payDamage = async (req, res) => {
    try {
        const { id } = req.params; // damage_id

        // 1. Mark Damage as Paid
        await db.query('UPDATE damage SET status = "Paid" WHERE damage_id = ?', [id]);

        // 2. Ideally create a Payment record here too (Simplified for now)

        res.json({ message: 'Damage payment successful' });
    } catch (error) {
        res.status(500).json({ error: 'Payment processing failed' });
    }
};
