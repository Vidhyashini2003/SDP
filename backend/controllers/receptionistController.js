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
            `SELECT g.*, u.name as guest_name, u.email as guest_email, u.phone as guest_phone, u.created_at
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
            `SELECT rb.*, u.name as guest_name, u.phone as guest_phone, r.room_type, r.room_price_per_day
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
            `SELECT ab.*, u.name as guest_name, u.phone as guest_phone, a.activity_name, a.activity_price_per_hour
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
exports.getRefundRequests = async (req, res) => {
    try {
        const [refunds] = await db.query(
            `SELECT r.*, p.service_type, u.name as guest_name, u.email as guest_email 
             FROM refund r
             JOIN payment p ON r.payment_id = p.payment_id
             LEFT JOIN roombooking rb ON p.service_type = 'Room' AND p.service_id = rb.rb_id
             LEFT JOIN activitybooking ab ON p.service_type = 'Activity' AND p.service_id = ab.ab_id
             LEFT JOIN vehiclebooking vb ON p.service_type = 'Vehicle' AND p.service_id = vb.vb_id
             LEFT JOIN foodorder fo ON p.service_type = 'Food' AND p.service_id = fo.order_id
             LEFT JOIN Guest g ON COALESCE(rb.guest_id, ab.guest_id, vb.guest_id, fo.guest_id) = g.guest_id
             LEFT JOIN Users u ON g.user_id = u.user_id
             WHERE r.refund_status = "Pending"
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
            `SELECT vb.*, u.name as guest_name, u.phone as guest_phone 
             FROM vehiclebooking vb 
             JOIN Guest g ON vb.guest_id = g.guest_id
             JOIN Users u ON g.user_id = u.user_id
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
            `SELECT fo.*, u.name as guest_name, u.phone as guest_phone 
             FROM foodorder fo 
             JOIN Guest g ON fo.guest_id = g.guest_id
             JOIN Users u ON g.user_id = u.user_id
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
