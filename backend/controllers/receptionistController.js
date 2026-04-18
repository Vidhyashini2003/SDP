const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const [rooms] = await db.query("SELECT COUNT(*) as count FROM roombooking WHERE rb_status = 'Booked' OR rb_status = 'Checked-in'");
        const [activities] = await db.query("SELECT COUNT(*) as count FROM activitybooking WHERE ab_status = 'Reserved'");
        const [vehicles] = await db.query("SELECT COUNT(*) as count FROM hirevehicle WHERE vb_status = 'Booked'");
        const [guests] = await db.query("SELECT COUNT(*) as count FROM guest");

        res.json({
            activeRoomBookings: rooms[0].count,
            activeActivityBookings: activities[0].count,
            activehirevehicles: vehicles[0].count,
            totalGuests: guests[0].count
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

// Check-in / Check-out / Cancel (with checkout payment guard and cascading cancellation)
exports.updateRoomBookingStatus = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const { status, cancelReason } = req.body;

        await connection.beginTransaction();

        // ── Checkout payment guard ──────────────────────────────────────────
        if (status === 'Checked-out') {
            // Get guest_id or wig_id for this booking
            const [booking] = await connection.query(
                'SELECT guest_id, wig_id FROM roombooking WHERE rb_id = ?', [id]
            );
            if (booking.length > 0) {
                const { guest_id, wig_id } = booking[0];

                // 1. Unpaid damage charges
                const [damages] = await connection.query(
                    `SELECT damage_id, damage_type, description, charge_amount
                     FROM damage WHERE (guest_id = ? OR wig_id = ?) AND status = 'Pending'`,
                    [guest_id, wig_id]
                );

                // 2. Unpaid vehicle hires for this booking
                const [vehicles] = await connection.query(
                    `SELECT vb.vb_id, v.vehicle_type, vb.vb_date, p.payment_status
                     FROM hirevehicle vb
                     LEFT JOIN vehicle v ON vb.vehicle_id = v.vehicle_id
                     LEFT JOIN payment p ON vb.vb_payment_id = p.payment_id
                     WHERE vb.rb_id = ? AND vb.vb_status NOT IN ('Cancelled','Completed')
                       AND (p.payment_id IS NULL OR p.payment_status != 'Success')`,
                    [id]
                );

                // 3. Unpaid activity bookings for this booking
                const [activities] = await connection.query(
                    `SELECT ab.ab_id, a.activity_name, ab.ab_start_time, p.payment_status
                     FROM activitybooking ab
                     LEFT JOIN activity a ON ab.activity_id = a.activity_id
                     LEFT JOIN payment p ON ab.ab_payment_id = p.payment_id
                     WHERE ab.rb_id = ? AND ab.ab_status NOT IN ('Cancelled','Completed')
                       AND (p.payment_id IS NULL OR p.payment_status != 'Success')`,
                    [id]
                );

                // 4. Unpaid food orders for this booking
                const [foodOrders] = await connection.query(
                    `SELECT fo.order_id, fo.scheduled_date, p.payment_status
                     FROM foodorder fo
                     LEFT JOIN payment p ON fo.payment_id = p.payment_id
                     WHERE fo.rb_id = ? AND fo.order_status NOT IN ('Cancelled','Delivered')
                       AND (p.payment_id IS NULL OR p.payment_status != 'Success')`,
                    [id]
                );

                const hasPending = damages.length > 0 || vehicles.length > 0 ||
                                   activities.length > 0 || foodOrders.length > 0;

                if (hasPending) {
                    await connection.rollback();
                    return res.status(400).json({
                        error: 'Cannot check out: guest has pending payments.',
                        pendingPayments: true,
                        pending: { damages, vehicles, activities, foodOrders }
                    });
                }
            }
        }
        // ────────────────────────────────────────────────────────────────────

        // Update the main Room Booking status
        await connection.query('UPDATE roombooking SET rb_status = ? WHERE rb_id = ?', [status, id]);

        // ── Cascading Cancellation Logic ────────────────────────────────────
        if (status === 'Cancelled') {
            const reason = cancelReason || 'Cancelled by Receptionist';

            // 1. Associated Activities
            await connection.query('UPDATE activitybooking SET ab_status = "Cancelled", cancel_reason = ? WHERE rb_id = ?', [reason, id]);

            // 2. Associated Food Orders
            await connection.query('UPDATE foodorder SET order_status = "Cancelled" WHERE rb_id = ?', [id]);
            await connection.query('UPDATE orderitem oi JOIN foodorder fo ON oi.order_id = fo.order_id SET oi.item_status = "Cancelled" WHERE fo.rb_id = ?', [id]);

            // 3. Associated Vehicle Hires
            await connection.query('UPDATE hirevehicle SET vb_status = "Cancelled", cancel_reason = ? WHERE rb_id = ?', [reason, id]);

            // 4. Associated Arrival Transports
            await connection.query('UPDATE hire_vehicle_for_arrival SET status = "Cancelled", cancel_reason = ? WHERE rb_id = ?', [reason, id]);
        }
        // ────────────────────────────────────────────────────────────────────

        await connection.commit();
        res.json({ message: `Room booking status updated to ${status}` });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Update Room Booking Status Error:', error);
        res.status(500).json({ error: 'Failed to update booking status' });
    } finally {
        if (connection) connection.release();
    }
};


// Get All Guests (Registered + Walk-in)
exports.getAllGuests = async (req, res) => {
    try {
        const [registered] = await db.query(
            `SELECT g.guest_id, CONCAT(u.first_name, ' ', u.last_name) as guest_name, u.email as guest_email, g.guest_phone, 'registered' as type
             FROM Guest g
             JOIN Users u ON g.user_id = u.user_id`
        );
        const [walkins] = await db.query(
            `SELECT wig_id as guest_id, CONCAT(first_name, ' ', last_name) as guest_name, COALESCE(email, 'Walk-in') as guest_email, phone as guest_phone, 'walkin' as type
             FROM walkin_guest`
        );
        res.json([...registered, ...walkins]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch guests' });
    }
};

// Create New Walk-in Guest (No User Account)
exports.registerWalkinGuest = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, nic_passport, nationality } = req.body;
        const nic_image = req.file ? `/uploads/nic_documents/${req.file.filename}` : null;

        if (!first_name || !last_name || !phone || !nic_passport) {
            return res.status(400).json({ error: 'Missing required guest details' });
        }

        const [result] = await db.query(
            `INSERT INTO walkin_guest (first_name, last_name, email, phone, nic_passport, nationality, nic_image)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, email, phone, nic_passport, nationality, nic_image]
        );

        const [newGuest] = await db.query(
            `SELECT wig_id as guest_id, CONCAT(first_name, ' ', last_name) as guest_name, COALESCE(email, 'Walk-in') as guest_email, phone as guest_phone, 'walkin' as type
             FROM walkin_guest WHERE wig_id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            message: 'Walk-in guest registered successfully',
            guest: newGuest[0]
        });
    } catch (error) {
        console.error('Register walk-in guest error:', error);
        res.status(500).json({ error: 'Failed to register walk-in guest' });
    }
};

// Get All Room Bookings
exports.getAllRoomBookings = async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT rb.*,
                    COALESCE(CONCAT(u.first_name, ' ', u.last_name), CONCAT(wig.first_name, ' ', wig.last_name)) as guest_name,
                    COALESCE(g.guest_phone, wig.phone) as guest_phone,
                    COALESCE(g.guest_nic_passport, wig.nic_passport) as guest_nic_passport,
                    COALESCE(g.nationality, wig.nationality) as nationality,
                    r.room_type,
                    r.room_price_per_day
             FROM roombooking rb
             LEFT JOIN Guest g ON rb.guest_id = g.guest_id
             LEFT JOIN Users u ON g.user_id = u.user_id
             LEFT JOIN walkin_guest wig ON rb.wig_id = wig.wig_id
             JOIN room r ON rb.room_id = r.room_id
             ORDER BY rb.rb_id DESC`
        );
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

// Activity Bookings
exports.getAllActivityBookings = async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT ab.*,
                    COALESCE(CONCAT(u.first_name, ' ', u.last_name), CONCAT(wig.first_name, ' ', wig.last_name)) as guest_name,
                    COALESCE(g.guest_phone, wig.phone) as guest_phone,
                    COALESCE(g.guest_nic_passport, wig.nic_passport) as guest_nic_passport,
                    COALESCE(g.nationality, wig.nationality) as nationality,
                    a.activity_name,
                    a.activity_price_per_hour
             FROM activitybooking ab
             LEFT JOIN Guest g ON ab.guest_id = g.guest_id
             LEFT JOIN Users u ON g.user_id = u.user_id
             LEFT JOIN walkin_guest wig ON ab.wig_id = wig.wig_id
             JOIN activity a ON ab.activity_id = a.activity_id
             ORDER BY ab.ab_id DESC`
        );
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activity bookings' });
    }
};

exports.updateActivityBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await db.query('UPDATE activitybooking SET ab_status = ? WHERE ab_id = ?', [status, id]);
        res.json({ message: `Activity booking status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update activity booking' });
    }
};

// ============================================================
// Refund Management
// ============================================================

exports.getRefundRequests = async (req, res) => {
    try {
        const { status } = req.query;
        let whereClause = "";

        if (status === 'Pending') {
            whereClause = "WHERE r.refund_status = 'Pending'";
        } else if (status === 'History') {
            whereClause = "WHERE r.refund_status IN ('Approved', 'Rejected')";
        }

        const [refunds] = await db.query(
            `SELECT
                r.refund_id,
                r.payment_id,
                r.refund_amount,
                r.refund_reason,
                r.refund_status,
                r.refund_date,
                CASE
                    WHEN rb.rb_id IS NOT NULL THEN 'Room'
                    WHEN ab.ab_id IS NOT NULL THEN 'Activity'
                    WHEN vb.vb_id IS NOT NULL THEN 'Vehicle'
                    WHEN fo.order_id IS NOT NULL THEN 'Food'
                    ELSE 'Unknown'
                END AS service_type,
                COALESCE(
                    CONCAT(u.first_name, ' ', u.last_name),
                    CONCAT(wig.first_name, ' ', wig.last_name)
                ) AS guest_name,
                COALESCE(u.email, 'Walk-in') AS guest_email,
                u.user_id AS guest_user_id,
                rb.rb_checkin, rb.rb_checkout,
                ab.ab_start_time, ab.ab_end_time,
                vb.vb_date, vb.vb_days,
                fo.order_date, fo.scheduled_date
             FROM refund r
             JOIN payment p ON r.payment_id = p.payment_id
             LEFT JOIN (SELECT rb_id, rb_payment_id, rb_checkin, rb_checkout, guest_id, wig_id FROM roombooking) rb
                ON p.payment_id = rb.rb_payment_id
             LEFT JOIN (SELECT ab_id, ab_payment_id, ab_start_time, ab_end_time, guest_id, wig_id FROM activitybooking) ab
                ON p.payment_id = ab.ab_payment_id AND rb.rb_id IS NULL
             LEFT JOIN (SELECT vb_id, vb_payment_id, vb_date, vb_days, guest_id, wig_id FROM hirevehicle) vb
                ON p.payment_id = vb.vb_payment_id AND rb.rb_id IS NULL AND ab.ab_id IS NULL
             LEFT JOIN (SELECT order_id, payment_id, order_date, scheduled_date, guest_id, wig_id FROM foodorder) fo
                ON p.payment_id = fo.payment_id AND rb.rb_id IS NULL AND ab.ab_id IS NULL AND vb.vb_id IS NULL
             LEFT JOIN Guest g ON COALESCE(rb.guest_id, ab.guest_id, vb.guest_id, fo.guest_id) = g.guest_id
             LEFT JOIN Users u ON g.user_id = u.user_id
             LEFT JOIN walkin_guest wig ON COALESCE(rb.wig_id, ab.wig_id, vb.wig_id, fo.wig_id) = wig.wig_id
             ${whereClause}
             ORDER BY r.refund_date DESC`
        );
        res.json(refunds);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch refunds' });
    }
};

exports.processRefund = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Approved', 'Rejected'

        await connection.beginTransaction();

        // Fetch refund details including guest user_id for notification
        const [refundRows] = await connection.query(
            `SELECT r.refund_amount, r.refund_reason,
                    u.user_id as guest_user_id,
                    CONCAT(u.first_name, ' ', u.last_name) as guest_name
             FROM refund r
             JOIN payment p ON r.payment_id = p.payment_id
             LEFT JOIN roombooking rb ON p.payment_id = rb.rb_payment_id
             LEFT JOIN activitybooking ab ON p.payment_id = ab.ab_payment_id
             LEFT JOIN hirevehicle vb ON p.payment_id = vb.vb_payment_id
             LEFT JOIN foodorder fo ON p.payment_id = fo.payment_id
             LEFT JOIN Guest g ON COALESCE(rb.guest_id, ab.guest_id, vb.guest_id, fo.guest_id) = g.guest_id
             LEFT JOIN Users u ON g.user_id = u.user_id
             WHERE r.refund_id = ?`,
            [id]
        );

        await connection.query('UPDATE refund SET refund_status = ? WHERE refund_id = ?', [status, id]);
        await connection.commit();

        // Send notification to guest on Approved
        if (status === 'Approved' && refundRows.length > 0 && refundRows[0].guest_user_id) {
            const { guest_user_id, refund_amount, refund_reason } = refundRows[0];
            try {
                await db.query(
                    'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, FALSE)',
                    [
                        guest_user_id,
                        '\uD83D\uDCB0 Refund Approved',
                        `Your refund of Rs. ${Number(refund_amount).toLocaleString()} has been approved and is being processed. Reason: ${refund_reason || 'N/A'}`,
                        'Refund'
                    ]
                );
            } catch (notifyErr) {
                console.error('Failed to send refund notification:', notifyErr);
            }
        }

        res.json({ message: `Refund ${status}` });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: 'Failed to process refund' });
    } finally {
        connection.release();
    }
};

// ============================================================
// Vehicle Management
// ============================================================

exports.getAllhirevehicles = async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT vb.*,
                    COALESCE(CONCAT(u.first_name, ' ', u.last_name), CONCAT(wig.first_name, ' ', wig.last_name)) as guest_name,
                    COALESCE(g.guest_phone, wig.phone) as guest_phone,
                    COALESCE(g.guest_nic_passport, wig.nic_passport) as guest_nic_passport,
                    COALESCE(g.nationality, wig.nationality) as nationality,
                    v.vehicle_type,
                    v.vehicle_price_per_day
             FROM hirevehicle vb
             LEFT JOIN Guest g ON vb.guest_id = g.guest_id
             LEFT JOIN Users u ON g.user_id = u.user_id
             LEFT JOIN walkin_guest wig ON vb.wig_id = wig.wig_id
             LEFT JOIN vehicle v ON vb.vehicle_id = v.vehicle_id
             ORDER BY vb.vb_id DESC`
        );
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch vehicle bookings' });
    }
};

exports.getAllFoodOrders = async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT fo.*,
                    COALESCE(CONCAT(u.first_name, ' ', u.last_name), CONCAT(wig.first_name, ' ', wig.last_name)) as guest_name,
                    COALESCE(g.guest_phone, wig.phone) as guest_phone,
                    COALESCE(g.guest_nic_passport, wig.nic_passport) as guest_nic_passport,
                    COALESCE(g.nationality, wig.nationality) as nationality,
                    p.payment_amount,
                    COALESCE(p.payment_amount, SUM(oi.subtotal), 0) as order_total_amount,
                    GROUP_CONCAT(CONCAT(mi.item_name, ' (x', oi.quantity, ')') SEPARATOR ', ') as item_details
             FROM foodorder fo
             LEFT JOIN Guest g ON fo.guest_id = g.guest_id
             LEFT JOIN Users u ON g.user_id = u.user_id
             LEFT JOIN walkin_guest wig ON fo.wig_id = wig.wig_id
             LEFT JOIN payment p ON fo.payment_id = p.payment_id
             LEFT JOIN orderitem oi ON fo.order_id = oi.order_id
             LEFT JOIN menuitem mi ON oi.item_id = mi.item_id
             GROUP BY fo.order_id
             ORDER BY fo.order_id DESC`
        );
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch food orders' });
    }
};

exports.getAllVehicles = async (req, res) => {
    try {
        const [vehicles] = await db.query('SELECT * FROM vehicle');
        res.json(vehicles);
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
};

exports.updateVehicleStatus = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        await connection.beginTransaction();

        if (status !== 'Available') {
            const today = new Date().toISOString().split('T')[0];

            const [activeBookings] = await connection.query(
                `SELECT vb.vb_id, vb.vb_payment_id,
                        g.user_id as guest_user_id,
                        v.vehicle_type
                 FROM hirevehicle vb
                 JOIN Guest g ON vb.guest_id = g.guest_id
                 LEFT JOIN vehicle v ON vb.vehicle_id = v.vehicle_id
                 WHERE vb.vehicle_id = ? AND vb.vb_date >= ?
                 AND vb.vb_status IN ('Confirmed', 'Booked', 'Pending Payment', 'Pending Approval')`,
                [id, today]
            );

            if (activeBookings.length > 0) {
                if (!reason) {
                    await connection.rollback();
                    return res.status(400).json({
                        error: 'Cancellation reason is required because there are active bookings.',
                        requiresConfirmation: true,
                        activeBookingsCount: activeBookings.length
                    });
                }

                for (const booking of activeBookings) {
                    await connection.query(
                        'UPDATE hirevehicle SET vb_status = "Cancelled", cancel_reason = ? WHERE vb_id = ?',
                        [reason, booking.vb_id]
                    );

                    if (booking.vb_payment_id) {
                        const [payment] = await connection.query(
                            'SELECT payment_amount FROM payment WHERE payment_id = ?',
                            [booking.vb_payment_id]
                        );
                        if (payment.length > 0) {
                            await connection.query(
                                'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                                [booking.vb_payment_id, payment[0].payment_amount, `Vehicle under maintenance: ${reason}`]
                            );
                        }
                    }

                    if (booking.guest_user_id) {
                        try {
                            await connection.query(
                                'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, FALSE)',
                                [
                                    booking.guest_user_id,
                                    '\uD83D\uDE97 Vehicle Booking Cancelled',
                                    `Your vehicle hire booking (${booking.vehicle_type || 'vehicle'}) has been cancelled because the vehicle is going under maintenance. Reason: ${reason}. A refund request has been raised and will be processed shortly.`,
                                    'Cancellation'
                                ]
                            );
                        } catch (notifyErr) {
                            console.error('Failed to notify guest:', notifyErr);
                        }
                    }
                }
            }
        }

        await connection.query('UPDATE vehicle SET vehicle_status = ? WHERE vehicle_id = ?', [status, id]);
        await connection.commit();
        res.json({ message: 'Vehicle status updated successfully' });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating vehicle status:', error);
        res.status(500).json({ error: 'Failed to update vehicle status' });
    } finally {
        connection.release();
    }
};

// ============================================================
// Room Availability Management (with room-switch logic)
// ============================================================

exports.getAllRooms = async (req, res) => {
    try {
        const [rooms] = await db.query('SELECT * FROM room ORDER BY room_id');
        res.json(rooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
};

exports.updateRoomStatus = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        await connection.beginTransaction();

        if (status !== 'Available') {
            const today = new Date().toISOString().split('T')[0];

            // Get room type for alternative search
            const [roomInfo] = await connection.query('SELECT room_type FROM room WHERE room_id = ?', [id]);
            if (roomInfo.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Room not found' });
            }
            const { room_type } = roomInfo[0];

            const [activeBookings] = await connection.query(
                `SELECT rb.rb_id, rb.rb_payment_id, rb.rb_checkin, rb.rb_checkout,
                        p.payment_amount,
                        g.user_id as guest_user_id,
                        CONCAT(u.first_name, ' ', u.last_name) as guest_name
                 FROM roombooking rb
                 LEFT JOIN payment p ON rb.rb_payment_id = p.payment_id
                 JOIN Guest g ON rb.guest_id = g.guest_id
                 JOIN Users u ON g.user_id = u.user_id
                 WHERE rb.room_id = ? AND rb.rb_checkout >= ?
                 AND rb.rb_status IN ('Pending', 'Confirmed', 'Checked-in', 'Booked')`,
                [id, today]
            );

            if (activeBookings.length > 0) {
                if (!reason) {
                    await connection.rollback();
                    return res.status(400).json({
                        error: 'Cancellation reason is required because there are active bookings.',
                        requiresConfirmation: true,
                        activeBookingsCount: activeBookings.length
                    });
                }

                for (const booking of activeBookings) {
                    // Try to find an alternative room of the same type available for the booking period
                    const [alternatives] = await connection.query(
                        `SELECT r.room_id FROM room r
                         WHERE r.room_type = ? AND r.room_id != ? AND r.room_status = 'Available'
                           AND r.room_id NOT IN (
                               SELECT rb2.room_id FROM roombooking rb2
                               WHERE rb2.room_id = r.room_id
                                 AND rb2.rb_status IN ('Booked','Confirmed','Checked-in','Pending')
                                 AND rb2.rb_checkin < ? AND rb2.rb_checkout > ?
                           )
                         LIMIT 1`,
                        [room_type, id, booking.rb_checkout, booking.rb_checkin]
                    );

                    if (alternatives.length > 0) {
                        // ---- SWITCH room ----
                        const newRoomId = alternatives[0].room_id;
                        await connection.query('UPDATE roombooking SET room_id = ? WHERE rb_id = ?', [newRoomId, booking.rb_id]);

                        // Notify guest of room switch
                        if (booking.guest_user_id) {
                            try {
                                await connection.query(
                                    'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, FALSE)',
                                    [
                                        booking.guest_user_id,
                                        '\uD83C\uDFE8 Room Reassigned',
                                        `Your room has been changed to Room #${newRoomId} (same ${room_type} type) due to maintenance on your original room. Your booking dates and all services remain unchanged. We apologise for any inconvenience.`,
                                        'Booking'
                                    ]
                                );
                            } catch (notifyErr) { console.error('Guest notify failed:', notifyErr); }
                        }

                        // Notify receptionists/admin of switch
                        const [staffList] = await connection.query(
                            "SELECT user_id FROM Users WHERE role IN ('receptionist','admin')"
                        );
                        for (const staff of staffList) {
                            try {
                                await connection.query(
                                    'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, FALSE)',
                                    [
                                        staff.user_id,
                                        '\uD83D\uDD04 Room Auto-Switched',
                                        `Booking #${booking.rb_id} (${booking.guest_name}) switched from Room #${id} to Room #${newRoomId} (${room_type}) due to maintenance. Reason: ${reason}`,
                                        'System'
                                    ]
                                );
                            } catch (notifyErr) { console.error('Staff notify failed:', notifyErr); }
                        }

                    } else {
                        // ---- No alternative: cancel entire booking + linked services ----

                        // Cancel room booking
                        await connection.query(
                            'UPDATE roombooking SET rb_status = "Cancelled", cancel_reason = ? WHERE rb_id = ?',
                            [reason, booking.rb_id]
                        );
                        if (booking.rb_payment_id && booking.payment_amount) {
                            await connection.query(
                                'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                                [booking.rb_payment_id, booking.payment_amount, `Room maintenance - no alternative ${room_type} available: ${reason}`]
                            );
                        }

                        // Cancel linked activity bookings
                        const [linkedActivities] = await connection.query(
                            `SELECT ab.ab_id, ab.ab_payment_id, p.payment_amount
                             FROM activitybooking ab LEFT JOIN payment p ON ab.ab_payment_id = p.payment_id
                             WHERE ab.rb_id = ? AND ab.ab_status NOT IN ('Cancelled','Completed')`,
                            [booking.rb_id]
                        );
                        for (const ab of linkedActivities) {
                            await connection.query(
                                'UPDATE activitybooking SET ab_status = "Cancelled", cancel_reason = ? WHERE ab_id = ?',
                                [`Room maintenance: ${reason}`, ab.ab_id]
                            );
                            if (ab.ab_payment_id && ab.payment_amount) {
                                await connection.query(
                                    'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                                    [ab.ab_payment_id, ab.payment_amount, `Activity cancelled due to room maintenance: ${reason}`]
                                );
                            }
                        }

                        // Cancel linked vehicle hire bookings
                        const [linkedVehicles] = await connection.query(
                            `SELECT vb.vb_id, vb.vb_payment_id, p.payment_amount
                             FROM hirevehicle vb LEFT JOIN payment p ON vb.vb_payment_id = p.payment_id
                             WHERE vb.rb_id = ? AND vb.vb_status NOT IN ('Cancelled','Completed')`,
                            [booking.rb_id]
                        );
                        for (const vb of linkedVehicles) {
                            await connection.query(
                                'UPDATE hirevehicle SET vb_status = "Cancelled", cancel_reason = ? WHERE vb_id = ?',
                                [`Room maintenance: ${reason}`, vb.vb_id]
                            );
                            if (vb.vb_payment_id && vb.payment_amount) {
                                await connection.query(
                                    'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                                    [vb.vb_payment_id, vb.payment_amount, `Vehicle hire cancelled due to room maintenance: ${reason}`]
                                );
                            }
                        }

                        // Cancel linked food orders
                        const [linkedFood] = await connection.query(
                            `SELECT fo.order_id, fo.payment_id, p.payment_amount
                             FROM foodorder fo LEFT JOIN payment p ON fo.payment_id = p.payment_id
                             WHERE fo.rb_id = ? AND fo.order_status NOT IN ('Cancelled','Delivered')`,
                            [booking.rb_id]
                        );
                        for (const fo of linkedFood) {
                            await connection.query(
                                'UPDATE foodorder SET order_status = "Cancelled" WHERE order_id = ?',
                                [fo.order_id]
                            );
                            if (fo.payment_id && fo.payment_amount) {
                                await connection.query(
                                    'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                                    [fo.payment_id, fo.payment_amount, `Food order cancelled due to room maintenance: ${reason}`]
                                );
                            }
                        }

                        // Notify guest of full cancellation
                        if (booking.guest_user_id) {
                            try {
                                await connection.query(
                                    'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, FALSE)',
                                    [
                                        booking.guest_user_id,
                                        '\u274C Booking Cancelled \u2013 Room Maintenance',
                                        `We regret that Booking #${booking.rb_id} has been fully cancelled because your ${room_type} room requires maintenance and no alternative is available. Reason: ${reason}. Refund requests have been raised for all your services.`,
                                        'Cancellation'
                                    ]
                                );
                            } catch (notifyErr) { console.error('Guest notify failed:', notifyErr); }
                        }

                        // Notify receptionists/admin for action
                        const [staffList2] = await connection.query(
                            "SELECT user_id FROM Users WHERE role IN ('receptionist','admin')"
                        );
                        for (const staff of staffList2) {
                            try {
                                await connection.query(
                                    'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, FALSE)',
                                    [
                                        staff.user_id,
                                        '\uD83D\uDD34 Full Booking Cancelled \u2013 Refund Pending',
                                        `Booking #${booking.rb_id} (${booking.guest_name}) was fully cancelled (room + all services) because Room #${id} (${room_type}) has no available alternative. Reason: ${reason}. Please review Refunds page.`,
                                        'Refund'
                                    ]
                                );
                            } catch (notifyErr) { console.error('Staff notify failed:', notifyErr); }
                        }
                    }
                }
            }
        }

        await connection.query('UPDATE room SET room_status = ? WHERE room_id = ?', [status, id]);
        await connection.commit();
        res.json({ message: 'Room status updated successfully' });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating room status:', error);
        res.status(500).json({ error: 'Failed to update room status' });
    } finally {
        connection.release();
    }
};

// ============================================================
// Activity Availability Management
// ============================================================

exports.getAllActivities = async (req, res) => {
    try {
        const [activities] = await db.query('SELECT * FROM activity ORDER BY activity_id');
        res.json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
};

exports.updateActivityStatus = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        await connection.beginTransaction();

        if (status !== 'Available') {
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

            const [activeBookings] = await connection.query(
                `SELECT ab.ab_id, ab.ab_payment_id,
                        g.user_id as guest_user_id,
                        a.activity_name
                 FROM activitybooking ab
                 JOIN Guest g ON ab.guest_id = g.guest_id
                 JOIN activity a ON ab.activity_id = a.activity_id
                 WHERE ab.activity_id = ? AND ab.ab_end_time >= ?
                 AND ab.ab_status IN ('Pending', 'Reserved', 'Confirmed')`,
                [id, now]
            );

            if (activeBookings.length > 0) {
                if (!reason) {
                    await connection.rollback();
                    return res.status(400).json({
                        error: 'Cancellation reason is required because there are active bookings.',
                        requiresConfirmation: true,
                        activeBookingsCount: activeBookings.length
                    });
                }

                for (const booking of activeBookings) {
                    await connection.query(
                        'UPDATE activitybooking SET ab_status = "Cancelled", cancel_reason = ? WHERE ab_id = ?',
                        [reason, booking.ab_id]
                    );

                    if (booking.ab_payment_id) {
                        const [payment] = await connection.query(
                            'SELECT payment_amount FROM payment WHERE payment_id = ?',
                            [booking.ab_payment_id]
                        );
                        if (payment.length > 0) {
                            await connection.query(
                                'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                                [booking.ab_payment_id, payment[0].payment_amount, `Activity unavailable: ${reason}`]
                            );
                        }
                    }

                    if (booking.guest_user_id) {
                        try {
                            await connection.query(
                                'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, FALSE)',
                                [
                                    booking.guest_user_id,
                                    '\uD83C\uDFCB\uFE0F Activity Booking Cancelled',
                                    `Your booking for "${booking.activity_name}" has been cancelled because this activity is temporarily unavailable. Reason: ${reason}. A refund request has been raised and will be processed shortly.`,
                                    'Cancellation'
                                ]
                            );
                        } catch (notifyErr) { console.error('Guest notify failed:', notifyErr); }
                    }
                }
            }
        }

        await connection.query('UPDATE activity SET activity_status = ? WHERE activity_id = ?', [status, id]);
        await connection.commit();
        res.json({ message: 'Activity status updated successfully' });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating activity status:', error);
        res.status(500).json({ error: 'Failed to update activity status' });
    } finally {
        connection.release();
    }
};

// ============================================================
// Room CRUD Management
// ============================================================

exports.createRoom = async (req, res) => {
    try {
        const { room_type, room_price_per_day, room_status } = req.body;
        const room_image = req.file ? `/uploads/rooms/${req.file.filename}` : null;
        await db.query(
            'INSERT INTO room (room_type, room_price_per_day, room_status, room_image) VALUES (?, ?, ?, ?)',
            [room_type, room_price_per_day, room_status || 'Available', room_image]
        );
        res.json({ message: 'Room created successfully' });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
};

exports.updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { room_type, room_price_per_day, room_status } = req.body;
        const room_image = req.file ? `/uploads/rooms/${req.file.filename}` : req.body.room_image;

        await db.query(
            'UPDATE room SET room_type = ?, room_price_per_day = ?, room_status = ?, room_image = ? WHERE room_id = ?',
            [room_type, room_price_per_day, room_status, room_image, id]
        );

        if (req.file) {
            await db.query(
                'UPDATE room SET room_image = ? WHERE room_type = ? AND room_id != ?',
                [room_image, room_type, id]
            );
        }

        res.json({ message: 'Room updated successfully' });
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ error: 'Failed to update room' });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM room WHERE room_id = ?', [id]);
        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
};

// ============================================================
// Activity CRUD Management
// ============================================================

exports.createActivity = async (req, res) => {
    try {
        const { activity_name, activity_price_per_hour, activity_status } = req.body;
        const activity_image = req.file ? `/uploads/activities/${req.file.filename}` : null;
        await db.query(
            'INSERT INTO activity (activity_name, activity_price_per_hour, activity_status, activity_image) VALUES (?, ?, ?, ?)',
            [activity_name, activity_price_per_hour, activity_status || 'Available', activity_image]
        );
        res.json({ message: 'Activity created successfully' });
    } catch (error) {
        console.error('Error creating activity:', error);
        res.status(500).json({ error: 'Failed to create activity' });
    }
};

exports.updateActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const { activity_name, activity_price_per_hour, activity_status } = req.body;
        const activity_image = req.file ? `/uploads/activities/${req.file.filename}` : req.body.activity_image;

        await db.query(
            'UPDATE activity SET activity_name = ?, activity_price_per_hour = ?, activity_status = ?, activity_image = ? WHERE activity_id = ?',
            [activity_name, activity_price_per_hour, activity_status, activity_image, id]
        );
        res.json({ message: 'Activity updated successfully' });
    } catch (error) {
        console.error('Error updating activity:', error);
        res.status(500).json({ error: 'Failed to update activity' });
    }
};

exports.deleteActivity = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM activity WHERE activity_id = ?', [id]);
        res.json({ message: 'Activity deleted successfully' });
    } catch (error) {
        console.error('Error deleting activity:', error);
        res.status(500).json({ error: 'Failed to delete activity' });
    }
};

// ============================================================
// Vehicle CRUD Management
// ============================================================

exports.createVehicle = async (req, res) => {
    try {
        const { vehicle_type, vehicle_price_per_day, vehicle_price_per_km, waiting_time_price_per_hour, vehicle_status } = req.body;
        const vehicle_image = req.file ? `/uploads/vehicles/${req.file.filename}` : null;
        await db.query(
            'INSERT INTO vehicle (vehicle_type, vehicle_price_per_day, vehicle_price_per_km, waiting_time_price_per_hour, vehicle_status, vehicle_image) VALUES (?, ?, ?, ?, ?, ?)',
            [vehicle_type, vehicle_price_per_day, vehicle_price_per_km, waiting_time_price_per_hour, vehicle_status || 'Available', vehicle_image]
        );
        res.json({ message: 'Vehicle created successfully' });
    } catch (error) {
        console.error('Error creating vehicle:', error);
        res.status(500).json({ error: 'Failed to create vehicle' });
    }
};

exports.updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const { vehicle_type, vehicle_price_per_day, vehicle_price_per_km, waiting_time_price_per_hour, vehicle_status } = req.body;
        const vehicle_image = req.file ? `/uploads/vehicles/${req.file.filename}` : req.body.vehicle_image;

        await db.query(
            'UPDATE vehicle SET vehicle_type = ?, vehicle_price_per_day = ?, vehicle_price_per_km = ?, waiting_time_price_per_hour = ?, vehicle_status = ?, vehicle_image = ? WHERE vehicle_id = ?',
            [vehicle_type, vehicle_price_per_day, vehicle_price_per_km, waiting_time_price_per_hour, vehicle_status, vehicle_image, id]
        );
        res.json({ message: 'Vehicle updated successfully' });
    } catch (error) {
        console.error('Error updating vehicle:', error);
        res.status(500).json({ error: 'Failed to update vehicle' });
    }
};

exports.deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM vehicle WHERE vehicle_id = ?', [id]);
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        res.status(500).json({ error: 'Failed to delete vehicle' });
    }
};

// ============================================================
// Walk-in Vehicle Payment
// Called by receptionist after driver accepts a walk-in vehicle hire.
// The guest returns to reception, receptionist swipes card and records payment.
// ============================================================

exports.payWalkinVehicle = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { vb_id } = req.params;

        await connection.beginTransaction();

        // Fetch the vehicle hire details
        const [hires] = await connection.query(
            `SELECT vb.*, v.vehicle_price_per_day, v.vehicle_type, v.vehicle_id as v_id,
                    g.user_id as guest_user_id
             FROM hirevehicle vb
             LEFT JOIN vehicle v ON vb.vehicle_id = v.vehicle_id
             LEFT JOIN Guest g ON vb.guest_id = g.guest_id
             WHERE vb.vb_id = ?`,
            [vb_id]
        );

        if (hires.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Vehicle hire not found' });
        }

        const hire = hires[0];

        // Must be in an accepted/confirmed state to pay
        if (!['Confirmed', 'Booked', 'Pending Payment'].includes(hire.vb_status)) {
            await connection.rollback();
            return res.status(400).json({
                error: `Cannot pay for a vehicle hire with status "${hire.vb_status}". The driver must accept the request first.`
            });
        }

        // If already paid, reject
        if (hire.vb_payment_id) {
            await connection.rollback();
            return res.status(400).json({ error: 'This vehicle hire has already been paid.' });
        }

        // Calculate total amount = price per day × number of days
        const amount = parseFloat(hire.vehicle_price_per_day || 0) * parseInt(hire.vb_days || 1);

        // Create payment record
        const [paymentResult] = await connection.query(
            'INSERT INTO payment (payment_amount, payment_status) VALUES (?, ?)',
            [amount, 'Success']
        );
        const payment_id = paymentResult.insertId;

        // Link payment to vehicle hire
        await connection.query(
            'UPDATE hirevehicle SET vb_payment_id = ? WHERE vb_id = ?',
            [payment_id, vb_id]
        );

        // Notify the guest
        if (hire.guest_user_id) {
            try {
                await connection.query(
                    'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, FALSE)',
                    [
                        hire.guest_user_id,
                        '🚗 Vehicle Hire Payment Confirmed',
                        `Your vehicle hire (${hire.vehicle_type || 'vehicle'}) payment of Rs. ${Number(amount).toLocaleString()} has been successfully processed at the reception desk.`,
                        'Payment'
                    ]
                );
            } catch (notifyErr) {
                console.error('Failed to notify guest:', notifyErr);
            }
        }

        await connection.commit();
        res.json({ message: 'Vehicle hire payment recorded successfully', payment_id, amount });

    } catch (error) {
        await connection.rollback();
        console.error('Error paying walk-in vehicle:', error);
        res.status(500).json({ error: 'Failed to record vehicle payment' });
    } finally {
        connection.release();
    }
};

