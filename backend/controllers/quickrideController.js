const db = require('../config/db');
const notificationController = require('./notificationController');

// =============================================
// GUEST: Request a Quick Ride
// =============================================
exports.requestQuickRide = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { pickup_location, vehicle_type_requested, scheduled_at, rb_id } = req.body;

        if (!pickup_location || !vehicle_type_requested) {
            return res.status(400).json({ error: 'Pickup location and vehicle type are required.' });
        }

        const [guestRows] = await connection.query('SELECT guest_id FROM Guest WHERE user_id = ?', [req.user.id]);
        if (guestRows.length === 0) return res.status(404).json({ error: 'Guest profile not found' });
        const guest_id = guestRows[0].guest_id;

        await connection.beginTransaction();

        // Validate Stay Dates if scheduled_at or rb_id is provided
        if (rb_id) {
            const [roomBookings] = await connection.query(
                "SELECT rb_checkin, rb_checkout FROM roombooking WHERE rb_id = ?",
                [rb_id]
            );
            if (roomBookings.length > 0) {
                const booking = roomBookings[0];
                const checkIn = new Date(booking.rb_checkin);
                checkIn.setHours(0, 0, 0, 0);
                const checkOut = new Date(booking.rb_checkout);
                checkOut.setHours(23, 59, 59, 999);

                if (scheduled_at) {
                    const scheduledDate = new Date(scheduled_at);
                    if (scheduledDate < checkIn || scheduledDate > checkOut) {
                        await connection.rollback();
                        return res.status(400).json({ 
                            error: 'Scheduled time must be within your hotel stay periods.',
                            message: `Stay dates: ${booking.rb_checkin.split('T')[0]} to ${booking.rb_checkout.split('T')[0]}`
                        });
                    }
                }
            }
        }

        // Find a vehicle of requested type to "reserve"
        const [vehicles] = await connection.query(
            "SELECT vehicle_id, vehicle_price_per_km, waiting_time_price_per_hour FROM vehicle WHERE vehicle_type = ? AND vehicle_status = 'Available' LIMIT 1",
            [vehicle_type_requested]
        );

        const vehicle_id = vehicles.length > 0 ? vehicles[0].vehicle_id : null;
        const price_per_km = vehicles.length > 0 ? vehicles[0].vehicle_price_per_km : null;
        const waiting_price_per_hour = vehicles.length > 0 ? vehicles[0].waiting_time_price_per_hour : null;

        if (!vehicle_id) {
            await connection.rollback();
            return res.status(400).json({ error: `No available ${vehicle_type_requested} vehicles at the moment. Please try again later.` });
        }

        // Reserve the vehicle
        await connection.query("UPDATE vehicle SET vehicle_status = 'In Use' WHERE vehicle_id = ?", [vehicle_id]);

        const [result] = await connection.query(
            `INSERT INTO quickride 
             (guest_id, vehicle_id, rb_id, pickup_location, vehicle_type, scheduled_at, per_km_rate, waiting_price_per_hour, status, payment_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Requested', 'Pending')`,
            [guest_id, vehicle_id, rb_id || null, pickup_location, vehicle_type_requested, scheduled_at || null, price_per_km, waiting_price_per_hour]
        );

        await connection.commit();

        res.status(201).json({
            message: 'Quick Ride requested successfully! A driver will be assigned shortly.',
            qr_id: result.insertId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error requesting quick ride:', error);
        res.status(500).json({ error: 'Failed to request quick ride' });
    } finally {
        connection.release();
    }
};

// =============================================
// GUEST: Get my quick rides (for grouped bookings)
// =============================================
exports.getGuestQuickRides = async (req, res) => {
    try {
        const [guestRows] = await db.query('SELECT guest_id FROM Guest WHERE user_id = ?', [req.user.id]);
        if (guestRows.length === 0) return res.status(404).json({ error: 'Guest profile not found' });
        const guest_id = guestRows[0].guest_id;

        const [rides] = await db.query(
            `SELECT qr.*, v.vehicle_number, v.vehicle_type,
                    CONCAT(u.first_name, ' ', u.last_name) as driver_name, d.driver_phone
             FROM quickride qr
             LEFT JOIN vehicle v ON qr.vehicle_id = v.vehicle_id
             LEFT JOIN Driver d ON qr.driver_id = d.driver_id
             LEFT JOIN Users u ON d.user_id = u.user_id
             WHERE qr.guest_id = ?
             ORDER BY qr.created_date DESC`,
            [guest_id]
        );
        res.json(rides);
    } catch (error) {
        console.error('Error fetching quick rides:', error);
        res.status(500).json({ error: 'Failed to fetch rides' });
    }
};

// =============================================
// GUEST: Pay for a completed quick ride
// =============================================
exports.payQuickRide = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;

        await connection.beginTransaction();

        const [rides] = await connection.query(
            `SELECT qr.*, g.user_id as guest_user_id
             FROM quickride qr
             JOIN Guest g ON qr.guest_id = g.guest_id
             WHERE qr.quickride_id = ? AND g.user_id = ? FOR UPDATE`,
            [id, req.user.id]
        );

        if (rides.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Ride not found' });
        }

        const ride = rides[0];
        if (ride.payment_status !== 'Awaiting Payment') {
            await connection.rollback();
            return res.status(400).json({ error: 'This ride is not awaiting payment.' });
        }

        await connection.query(
            "UPDATE quickride SET payment_status = 'Paid' WHERE quickride_id = ?",
            [id]
        );

        // Free up vehicle
        if (ride.vehicle_id) {
            await connection.query(
                "UPDATE vehicle SET vehicle_status = 'Available' WHERE vehicle_id = ?",
                [ride.vehicle_id]
            );
        }

        await connection.commit();
        res.json({ message: 'Payment successful. Thank you!', total_paid: ride.final_amount });
    } catch (error) {
        await connection.rollback();
        console.error('Error paying quick ride:', error);
        res.status(500).json({ error: 'Failed to process payment' });
    } finally {
        connection.release();
    }
};

// =============================================
// DRIVER: Set actual km and waiting hours → triggers guest payment notification
// =============================================
exports.setQuickRideAmount = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const { actual_km, waiting_hours } = req.body;

        if (actual_km === undefined || actual_km === null) {
            return res.status(400).json({ error: 'actual_km is required' });
        }

        await connection.beginTransaction();

        const [rides] = await connection.query(
            `SELECT qr.*, g.user_id as guest_user_id
             FROM quickride qr
             JOIN Driver d ON qr.driver_id = d.driver_id
             JOIN Guest g ON qr.guest_id = g.guest_id
             WHERE qr.quickride_id = ? AND d.user_id = ? FOR UPDATE`,
            [id, req.user.id]
        );

        if (rides.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Ride not found or unauthorized' });
        }

        const ride = rides[0];
        const km = parseFloat(actual_km) || 0;
        const waitHours = parseFloat(waiting_hours) || 0;
        const pricePerKm = parseFloat(ride.per_km_rate) || 0;
        const waitingRate = parseFloat(ride.waiting_price_per_hour) || 0;

        const totalAmount = (km * pricePerKm) + (waitHours * waitingRate);

        await connection.query(
            `UPDATE quickride 
             SET actual_km = ?, waiting_time_hrs = ?, final_amount = ?, 
                 status = 'Completed', completed_at = NOW(), payment_status = 'Awaiting Payment'
             WHERE quickride_id = ?`,
            [km, waitHours, totalAmount, id]
        );

        // Notify guest
        await notificationController.createNotification(
            ride.guest_user_id,
            'Quick Ride Fare Ready',
            `Your Quick Ride is complete! Total fare: Rs. ${totalAmount.toLocaleString()} (${km} km + ${waitHours} hrs waiting). Please pay from your My Bookings page.`,
            'Payment',
            '/guest/my-bookings'
        );

        await connection.commit();
        res.json({ message: 'Ride amount set. Guest has been notified.', total_amount: totalAmount });
    } catch (error) {
        await connection.rollback();
        console.error('Error setting ride amount:', error);
        res.status(500).json({ error: 'Failed to set ride amount' });
    } finally {
        connection.release();
    }
};
