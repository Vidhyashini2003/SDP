const db = require('../config/db');

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const [rooms] = await db.query("SELECT COUNT(*) as count FROM RoomBooking WHERE rb_status = 'Booked' OR rb_status = 'Checked-in'");
        const [activities] = await db.query("SELECT COUNT(*) as count FROM ActivityBooking WHERE ab_status = 'Reserved'");
        const [vehicles] = await db.query("SELECT COUNT(*) as count FROM VehicleBooking WHERE vb_status = 'Booked'");
        const [guests] = await db.query("SELECT COUNT(*) as count FROM Guest");

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
        await db.query('UPDATE RoomBooking SET rb_status = ? WHERE rb_id = ?', [status, id]);
        res.json({ message: `Room booking status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update booking' });
    }
};

// Get All Guests
exports.getAllGuests = async (req, res) => {
    try {
        const [guests] = await db.query('SELECT * FROM Guest');
        res.json(guests);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch guests' });
    }
};

// Get All Room Bookings (for management)
exports.getAllRoomBookings = async (req, res) => {
    try {
        const [bookings] = await db.query(
            `SELECT rb.*, g.guest_name, g.guest_phone, r.room_type, r.room_price_per_day
             FROM RoomBooking rb 
             JOIN Guest g ON rb.guest_id = g.guest_id 
             JOIN Room r ON rb.room_id = r.room_id
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
            `SELECT ab.*, g.guest_name, g.guest_phone, a.activity_name, a.activity_price_per_hour
             FROM ActivityBooking ab 
             JOIN Guest g ON ab.guest_id = g.guest_id 
             JOIN Activity a ON ab.activity_id = a.activity_id
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
        await db.query('UPDATE ActivityBooking SET ab_status = ? WHERE ab_id = ?', [status, id]);
        res.json({ message: `Activity booking status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update activity booking' });
    }
}

// Refunds Management
exports.getRefundRequests = async (req, res) => {
    try {
        const [refunds] = await db.query('SELECT * FROM Refund WHERE refund_status = "Pending"');
        res.json(refunds);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch refunds' });
    }
}

exports.processRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Approved', 'Rejected'

        await db.query('UPDATE Refund SET refund_status = ? WHERE refund_id = ?', [status, id]);
        res.json({ message: `Refund ${status}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process refund' });
    }
}
