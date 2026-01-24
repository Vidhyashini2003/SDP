const db = require('../config/db');

// --- Room Bookings ---

exports.getAvailableRooms = async (req, res) => {
    try {
        const [rooms] = await db.query("SELECT * FROM Room WHERE room_status = 'Available'");
        res.json(rooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
};

exports.createRoomBooking = async (req, res) => {
    try {
        const { room_id, checkin, checkout, total_amount, payment_method } = req.body;
        const guest_id = req.user.id;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Create Payment
            const [paymentResult] = await connection.query(
                'INSERT INTO Payment (payment_amount, payment_method, service_type, payment_status) VALUES (?, ?, ?, ?)',
                [total_amount, payment_method, 'Room', 'Success'] // Auto-success for simplicity
            );
            const payment_id = paymentResult.insertId;

            // Create Booking
            const [bookingResult] = await connection.query(
                'INSERT INTO RoomBooking (guest_id, room_id, rb_checkin, rb_checkout, rb_total_amount, rb_payment_id, rb_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [guest_id, room_id, checkin, checkout, total_amount, payment_id, 'Booked']
            );

            // Link Payment to Service ID (optional bidirectional link if schema supported it, currently schema has service_id in payment)
            await connection.query('UPDATE Payment SET service_id = ? WHERE payment_id = ?', [bookingResult.insertId, payment_id]);

            // Update Room Status
            // Note: In a real app we might not mark it 'Booked' globally if it's date-range based, 
            // but simpler logic here assumes 1 room = 1 status at a time.
            // await connection.query("UPDATE Room SET room_status = 'Booked' WHERE room_id = ?", [room_id]);

            await connection.commit();
            res.status(201).json({ message: 'Room booked successfully', bookingId: bookingResult.insertId });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error creating room booking:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
};

// --- Activity Bookings ---

exports.getAvailableActivities = async (req, res) => {
    try {
        const [activities] = await db.query("SELECT * FROM Activity WHERE activity_status = 'Available'");
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
};

exports.createActivityBooking = async (req, res) => {
    try {
        const { activity_id, start_time, end_time, total_amount, payment_method } = req.body;
        const guest_id = req.user.id;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [paymentResult] = await connection.query(
                'INSERT INTO Payment (payment_amount, payment_method, service_type, payment_status) VALUES (?, ?, ?, ?)',
                [total_amount, payment_method, 'Activity', 'Success']
            );
            const payment_id = paymentResult.insertId;

            const [bookingResult] = await connection.query(
                'INSERT INTO ActivityBooking (guest_id, activity_id, ab_start_time, ab_end_time, ab_total_amount, ab_payment_id, ab_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [guest_id, activity_id, start_time, end_time, total_amount, payment_id, 'Reserved']
            );

            await connection.query('UPDATE Payment SET service_id = ? WHERE payment_id = ?', [bookingResult.insertId, payment_id]);

            await connection.commit();
            res.status(201).json({ message: 'Activity booked successfully' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error creating activity booking:', error);
        res.status(500).json({ error: 'Failed to book activity' });
    }
};

// --- Vehicle Bookings ---

exports.getAvailableVehicles = async (req, res) => {
    try {
        const [vehicles] = await db.query("SELECT * FROM Vehicle WHERE vehicle_status = 'Available'");
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
};

exports.createVehicleBooking = async (req, res) => {
    try {
        const { vehicle_id, pickup_point, drop_point, trip_start, trip_end, total_amount, payment_method } = req.body;
        const guest_id = req.user.id;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [paymentResult] = await connection.query(
                'INSERT INTO Payment (payment_amount, payment_method, service_type, payment_status) VALUES (?, ?, ?, ?)',
                [total_amount, payment_method, 'Vehicle', 'Success']
            );
            const payment_id = paymentResult.insertId;

            // Assign a random available driver for simplicity, or null if to be assigned by admin
            const [drivers] = await connection.query("SELECT driver_id FROM Driver LIMIT 1"); // Simplification: just pick first driver
            const driver_id = drivers.length > 0 ? drivers[0].driver_id : null;

            const [bookingResult] = await connection.query(
                'INSERT INTO VehicleBooking (guest_id, vehicle_id, driver_id, vb_pickup_point, vb_drop_point, vb_trip_start, vb_trip_end, vb_total_amount, vb_payment_id, vb_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [guest_id, vehicle_id, driver_id, pickup_point, drop_point, trip_start, trip_end, total_amount, payment_id, 'Booked']
            );

            await connection.query('UPDATE Payment SET service_id = ? WHERE payment_id = ?', [bookingResult.insertId, payment_id]);

            await connection.commit();
            res.status(201).json({ message: 'Vehicle booked successfully' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error creating vehicle booking:', error);
        res.status(500).json({ error: 'Failed to book vehicle' });
    }
};

// Cancel Booking generic handler
exports.cancelBooking = async (req, res) => {
    try {
        const { type, id } = req.params;
        let table, idField, statusField;

        switch (type) {
            case 'room':
                table = 'RoomBooking';
                idField = 'rb_id';
                statusField = 'rb_status';
                break;
            case 'activity':
                table = 'ActivityBooking';
                idField = 'ab_id';
                statusField = 'ab_status';
                break;
            case 'vehicle':
                table = 'VehicleBooking';
                idField = 'vb_id';
                statusField = 'vb_status';
                break;
            default:
                return res.status(400).json({ error: 'Invalid booking type' });
        }

        // Verify ownership
        const [booking] = await db.query(`SELECT guest_id FROM ${table} WHERE ${idField} = ?`, [id]);
        if (booking.length === 0) return res.status(404).json({ error: 'Booking not found' });
        if (booking[0].guest_id !== req.user.id && req.user.role !== 'receptionist' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await db.query(`UPDATE ${table} SET ${statusField} = 'Cancelled' WHERE ${idField} = ?`, [id]);
        res.json({ message: 'Booking cancelled successfully' });

    } catch (error) {
        console.error('Cancellation error:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
};
