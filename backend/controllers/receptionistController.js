const db = require('../config/db');

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const [rooms] = await db.query("SELECT COUNT(*) as count FROM roombooking WHERE rb_status = 'Booked' OR rb_status = 'Checked-in'");
        const [activities] = await db.query("SELECT COUNT(*) as count FROM activitybooking WHERE ab_status = 'Reserved'");
        const [vehicles] = await db.query("SELECT COUNT(*) as count FROM vehiclebooking WHERE vb_status = 'Booked'");
        const [guests] = await db.query("SELECT COUNT(*) as count FROM guest");

        res.json({
            activeRoomBookings: rooms[0].count,
            activeActivityBookings: activities[0].count,
            activeVehicleBookings: vehicles[0].count,
            totalGuests: guests[0].count
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

// Check-in / Check-out
exports.updateRoomBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Checked-in', 'Checked-out'

        // If check-in, verify if room is actually available? 
        // Simplified logic: Just update status
        await db.query('UPDATE roombooking SET rb_status = ? WHERE rb_id = ?', [status, id]);
        res.json({ message: `Room booking status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update booking' });
    }
};

// Get All Guests
exports.getAllGuests = async (req, res) => {
    try {
        const [guests] = await db.query(
            `SELECT g.*, CONCAT(u.first_name, ' ', u.last_name) as guest_name, u.email as guest_email, u.phone as guest_phone, u.created_at
             FROM Guest g
             JOIN Users u ON g.user_id = u.user_id`
        );
        res.json(guests);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch guests' });
    }
};

// Get All Room Bookings (for management)
exports.getAllRoomBookings = async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT rb.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as guest_name, 
                    u.phone as guest_phone, 
                    g.guest_nic_passport,
                    g.nationality,
                    r.room_type, 
                    r.room_price_per_day
             FROM roombooking rb 
             JOIN Guest g ON rb.guest_id = g.guest_id
             JOIN Users u ON g.user_id = u.user_id
             JOIN room r ON rb.room_id = r.room_id
             ORDER BY rb.rb_checkin DESC`
        );
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
}


// Activity Bookings
exports.getAllActivityBookings = async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT ab.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as guest_name, 
                    u.phone as guest_phone, 
                    g.guest_nic_passport,
                    g.nationality,
                    a.activity_name, 
                    a.activity_price_per_hour
             FROM activitybooking ab 
             JOIN Guest g ON ab.guest_id = g.guest_id 
             JOIN Users u ON g.user_id = u.user_id
             JOIN activity a ON ab.activity_id = a.activity_id
             ORDER BY ab.ab_start_time DESC`
        );
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activity bookings' });
    }
}

exports.updateActivityBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await db.query('UPDATE activitybooking SET ab_status = ? WHERE ab_id = ?', [status, id]);
        res.json({ message: `Activity booking status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update activity booking' });
    }
}

// Refunds Management
// Refunds Management
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
            `SELECT r.*, 
                    CASE 
                        WHEN rb.rb_id IS NOT NULL THEN 'Room'
                        WHEN ab.ab_id IS NOT NULL THEN 'Activity'
                        WHEN vb.vb_id IS NOT NULL THEN 'Vehicle'
                        WHEN fo.order_id IS NOT NULL THEN 'Food'
                        ELSE 'Unknown'
                    END as service_type,
                    CONCAT(u.first_name, ' ', u.last_name) as guest_name, 
                    u.email as guest_email 
             FROM refund r
             JOIN payment p ON r.payment_id = p.payment_id
             LEFT JOIN roombooking rb ON p.payment_id = rb.rb_payment_id
             LEFT JOIN activitybooking ab ON p.payment_id = ab.ab_payment_id
             LEFT JOIN vehiclebooking vb ON p.payment_id = vb.vb_payment_id
             LEFT JOIN foodorder fo ON p.payment_id = fo.payment_id
             LEFT JOIN Guest g ON COALESCE(rb.guest_id, ab.guest_id, vb.guest_id, fo.guest_id) = g.guest_id
             LEFT JOIN Users u ON g.user_id = u.user_id
             ${whereClause}
             ORDER BY r.refund_date DESC`
        );
        res.json(refunds);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch refunds' });
    }
}

exports.processRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Approved', 'Rejected'

        await db.query('UPDATE refund SET refund_status = ? WHERE refund_id = ?', [status, id]);
        res.json({ message: `Refund ${status}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process refund' });
    }
}
exports.getAllVehicleBookings = async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT vb.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as guest_name, 
                    u.phone as guest_phone,
                    g.guest_nic_passport,
                    g.nationality,
                    v.vehicle_type
             FROM vehiclebooking vb 
             JOIN Guest g ON vb.guest_id = g.guest_id
             JOIN Users u ON g.user_id = u.user_id
             LEFT JOIN vehicle v ON vb.vehicle_id = v.vehicle_id
             ORDER BY vb.vb_date DESC`
        );
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch vehicle bookings' });
    }
}

exports.getAllFoodOrders = async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT fo.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as guest_name, 
                    u.phone as guest_phone,
                    g.guest_nic_passport,
                    g.nationality,
                    p.payment_amount,
                    COALESCE(p.payment_amount, SUM(oi.subtotal), 0) as order_total_amount,
                    GROUP_CONCAT(CONCAT(mi.item_name, ' (x', oi.quantity, ')') SEPARATOR ', ') as item_details
             FROM foodorder fo 
             JOIN Guest g ON fo.guest_id = g.guest_id
             JOIN Users u ON g.user_id = u.user_id
             LEFT JOIN payment p ON fo.payment_id = p.payment_id
             LEFT JOIN orderitem oi ON fo.order_id = oi.order_id
             LEFT JOIN menuitem mi ON oi.item_id = mi.item_id
             GROUP BY fo.order_id
             ORDER BY fo.order_date DESC`
        );
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch food orders' });
    }
}

// --- Vehicle Management ---

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
        const { id } = req.params; // vehicle_id
        const { status, reason } = req.body; // 'Available', 'Maintenance', 'Unavailable'

        await connection.beginTransaction();

        // If status is NOT 'Available', we must check for future bookings
        if (status !== 'Available') {
            const today = new Date().toISOString().split('T')[0];

            // Find active bookings
            const [activeBookings] = await connection.query(
                `SELECT vb_id, vb_payment_id FROM vehiclebooking 
                 WHERE vehicle_id = ? 
                 AND vb_date >= ?
                 AND vb_status IN ('Confirmed', 'Booked', 'Pending Payment', 'Pending Approval')`,
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

                // Process Cancellations & Refunds
                for (const booking of activeBookings) {
                    // Update Booking
                    await connection.query(
                        'UPDATE vehiclebooking SET vb_status = "Cancelled", cancel_reason = ? WHERE vb_id = ?',
                        [reason, booking.vb_id]
                    );

                    // Create Refund if needed
                    if (booking.vb_payment_id) {
                        const [payment] = await connection.query('SELECT payment_amount FROM payment WHERE payment_id = ?', [booking.vb_payment_id]);

                        if (payment.length > 0) {
                            await connection.query(
                                'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                                [booking.vb_payment_id, payment[0].payment_amount, `Vehicle Unavailable: ${reason}`]
                            );
                        }
                    }
                }
            }
        }

        // Update Vehicle Status
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

// --- Room Availability Management ---

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
        const { id } = req.params; // room_id
        const { status, reason } = req.body; // 'Available', 'Maintenance'

        await connection.beginTransaction();

        // If status is NOT 'Available', we must check for future bookings
        if (status !== 'Available') {
            const today = new Date().toISOString().split('T')[0];

            // Find active bookings (using DISTINCT to avoid duplicates from JOIN)
            const [activeBookings] = await connection.query(
                `SELECT DISTINCT rb.rb_id, rb.rb_payment_id, p.payment_amount
                 FROM roombooking rb
                 LEFT JOIN payment p ON rb.rb_payment_id = p.payment_id
                 WHERE rb.room_id = ? 
                 AND rb.rb_checkout >= ?
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

                // Process Cancellations & Refunds
                for (const booking of activeBookings) {
                    // Update Booking
                    await connection.query(
                        'UPDATE roombooking SET rb_status = "Cancelled", cancel_reason = ? WHERE rb_id = ?',
                        [reason, booking.rb_id]
                    );

                    // Create Refund if payment exists
                    if (booking.rb_payment_id && booking.payment_amount) {
                        await connection.query(
                            'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                            [booking.rb_payment_id, booking.payment_amount, `Room Unavailable: ${reason}`]
                        );
                    }
                }
            }
        }

        // Update Room Status
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

// --- Activity Availability Management ---

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
        const { id } = req.params; // activity_id
        const { status, reason } = req.body; // 'Available', 'Unavailable'

        await connection.beginTransaction();

        // If status is NOT 'Available', we must check for future bookings
        if (status !== 'Available') {
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

            // Find active bookings (using DISTINCT to avoid duplicates)
            const [activeBookings] = await connection.query(
                `SELECT DISTINCT ab.ab_id, ab.ab_payment_id, p.payment_amount
                 FROM activitybooking ab
                 LEFT JOIN payment p ON ab.ab_payment_id = p.payment_id
                 WHERE ab.activity_id = ? 
                 AND ab.ab_end_time >= ?
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

                // Process Cancellations & Refunds
                for (const booking of activeBookings) {
                    // Update Booking
                    await connection.query(
                        'UPDATE activitybooking SET ab_status = "Cancelled", cancel_reason = ? WHERE ab_id = ?',
                        [reason, booking.ab_id]
                    );

                    // Create Refund if payment exists
                    if (booking.ab_payment_id && booking.payment_amount) {
                        await connection.query(
                            'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                            [booking.ab_payment_id, booking.payment_amount, `Activity Unavailable: ${reason}`]
                        );
                    }
                }
            }
        }

        // Update Activity Status
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

