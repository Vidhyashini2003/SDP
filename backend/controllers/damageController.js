const db = require('../config/db');
const notificationController = require('./notificationController');

// Report Damage (Receptionist / Staff)
exports.reportDamage = async (req, res) => {
    try {
        const { guest_id, room_id, damage_type, description, charge_amount } = req.body;
        const reported_by = req.user ? req.user.role : 'Staff';

        // Insert damage record including room_id
        await db.query(
            'INSERT INTO damage (guest_id, room_id, reported_by, damage_type, description, charge_amount) VALUES (?, ?, ?, ?, ?, ?)',
            [guest_id, room_id || null, reported_by, damage_type || 'Room', description, charge_amount]
        );

        // Notify guest — urgent payment notification
        const [guest] = await db.query('SELECT user_id FROM Guest WHERE guest_id = ?', [guest_id]);
        if (guest.length > 0) {
            const roomLabel = room_id ? ` (Room #${room_id})` : '';
            await notificationController.createNotification(
                guest[0].user_id,
                `💳 Payment Required – ${damage_type || 'Room'} Damage${roomLabel}`,
                `A damage charge of Rs. ${Number(charge_amount).toLocaleString()} has been raised against your account for ${damage_type || 'Room'} damage${roomLabel}: "${description}". This amount must be paid before check-out. Please contact the reception desk or pay via your guest portal.`,
                'Payment',
                '/guest/bookings'
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
            `SELECT d.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as guest_name, 
                    g.guest_phone,
                    d.room_id
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

// Get Damages by Guest ID (Guest Portal)
exports.getDamagesByGuest = async (req, res) => {
    try {
        let { guestId } = req.params;
        const userId = req.user.id;

        if (req.user.role === 'guest') {
            const [guest] = await db.query('SELECT guest_id FROM Guest WHERE user_id = ?', [userId]);
            if (guest.length === 0) {
                return res.status(403).json({ error: 'No guest profile found' });
            }
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
        const { id } = req.params;
        await db.query('UPDATE damage SET status = "Paid" WHERE damage_id = ?', [id]);
        res.json({ message: 'Damage payment successful' });
    } catch (error) {
        res.status(500).json({ error: 'Payment processing failed' });
    }
};

// Check pending payments for a guest's room booking (used by checkout guard)
exports.checkPendingPayments = async (req, res) => {
    try {
        const { rb_id } = req.params;

        // Get guest_id for this booking
        const [booking] = await db.query(
            'SELECT guest_id, rb_status FROM roombooking WHERE rb_id = ?',
            [rb_id]
        );
        if (booking.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        const { guest_id, rb_status } = booking[0];

        // 1. Unpaid damage charges
        const [damages] = await db.query(
            `SELECT damage_id, damage_type, description, charge_amount, report_date
             FROM damage WHERE guest_id = ? AND status = 'Pending'`,
            [guest_id]
        );

        // 2. Unpaid vehicle hires linked to this booking
        const [vehicles] = await db.query(
            `SELECT vb.vb_id, v.vehicle_type, vb.vb_date, vb.vb_days, p.payment_amount, p.payment_status
             FROM hirevehicle vb
             LEFT JOIN vehicle v ON vb.vehicle_id = v.vehicle_id
             LEFT JOIN payment p ON vb.vb_payment_id = p.payment_id
             WHERE vb.rb_id = ? AND vb.vb_status NOT IN ('Cancelled','Completed')
               AND (p.payment_id IS NULL OR p.payment_status != 'Success')`,
            [rb_id]
        );

        // 3. Unpaid activity bookings linked to this booking
        const [activities] = await db.query(
            `SELECT ab.ab_id, a.activity_name, ab.ab_start_time, ab.ab_total_amount, p.payment_status
             FROM activitybooking ab
             LEFT JOIN activity a ON ab.activity_id = a.activity_id
             LEFT JOIN payment p ON ab.ab_payment_id = p.payment_id
             WHERE ab.rb_id = ? AND ab.ab_status NOT IN ('Cancelled','Completed')
               AND (p.payment_id IS NULL OR p.payment_status != 'Success')`,
            [rb_id]
        );

        // 4. Unpaid food orders linked to this booking
        const [foodOrders] = await db.query(
            `SELECT fo.order_id, fo.order_date, fo.scheduled_date, p.payment_amount, p.payment_status
             FROM foodorder fo
             LEFT JOIN payment p ON fo.payment_id = p.payment_id
             WHERE fo.rb_id = ? AND fo.order_status NOT IN ('Cancelled','Delivered')
               AND (p.payment_id IS NULL OR p.payment_status != 'Success')`,
            [rb_id]
        );

        const hasPending = damages.length > 0 || vehicles.length > 0 || activities.length > 0 || foodOrders.length > 0;

        res.json({
            canCheckout: !hasPending,
            pending: {
                damages,
                vehicles,
                activities,
                foodOrders
            }
        });
    } catch (error) {
        console.error('Check pending payments error:', error);
        res.status(500).json({ error: 'Failed to check pending payments' });
    }
};
