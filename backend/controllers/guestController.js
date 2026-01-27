const db = require('../config/db');
const bcrypt = require('bcryptjs');
const notificationController = require('./notificationController');

exports.getProfile = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT g.*, u.name as guest_name, u.email as guest_email, u.phone as guest_phone, u.role 
             FROM Guest g 
             JOIN Users u ON g.user_id = u.user_id 
             WHERE u.user_id = ?`,
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Guest not found' });

        const guest = rows[0];
        // Remove internal IDs if needed, keeping it clean
        res.json(guest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

exports.updateProfile = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { guest_name, guest_phone, guest_address, nationality } = req.body;

        const userId = req.user.id;

        // 1. Update Users Table (Common info)
        await connection.query(
            'UPDATE Users SET name = ?, phone = ? WHERE user_id = ?',
            [guest_name, guest_phone, userId]
        );

        // 2. Update Guest Table (Specific info)
        await connection.query(
            'UPDATE Guest SET guest_address = ?, nationality = ? WHERE user_id = ?',
            [guest_address, nationality, userId]
        );

        await connection.commit();
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    } finally {
        connection.release();
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const [roomBookings] = await db.query(
            `SELECT rb.rb_id, rb.rb_status, rb.rb_checkin as check_in_date, rb.rb_checkout as check_out_date, rb.rb_total_amount as total_price, r.room_type 
             FROM roombooking rb 
             JOIN room r ON rb.room_id = r.room_id 
             JOIN Guest g ON rb.guest_id = g.guest_id
             WHERE g.user_id = ? 
             ORDER BY rb.rb_checkin DESC`,
            [req.user.id]
        );

        const [activityBookings] = await db.query(
            `SELECT ab.*, ab.ab_start_time as booking_date, ab.ab_total_amount as total_price, a.activity_name 
             FROM activitybooking ab 
             JOIN activity a ON ab.activity_id = a.activity_id 
             JOIN Guest g ON ab.guest_id = g.guest_id
             WHERE g.user_id = ?
             ORDER BY ab.ab_start_time DESC`,
            [req.user.id]
        );

        const [vehicleBookings] = await db.query(
            `SELECT vb.*, vb.vb_date as booking_date, v.vehicle_type, v.vehicle_number, v.vehicle_price_per_day 
             FROM vehiclebooking vb 
             JOIN vehicle v ON vb.vehicle_id = v.vehicle_id 
             JOIN Guest g ON vb.guest_id = g.guest_id
             WHERE g.user_id = ?
             ORDER BY vb.vb_date DESC`,
            [req.user.id]
        );

        res.json({
            rooms: roomBookings,
            activities: activityBookings,
            vehicles: vehicleBookings
        });
    } catch (error) {
        console.error("Booking Fetch Error:", error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

// Cancel Room Booking
exports.cancelRoomBooking = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Get Booking
        const [bookings] = await db.query(
            'SELECT * FROM roombooking WHERE rb_id = ? AND guest_id = (SELECT guest_id FROM Guest WHERE user_id = ?)',
            [id, req.user.id]
        );
        if (bookings.length === 0) return res.status(404).json({ error: 'Booking not found' });

        const booking = bookings[0];

        // 2. Validate Date
        const checkInDate = new Date(booking.rb_checkin);
        const today = new Date();
        const oneDayMs = 24 * 60 * 60 * 1000;

        if (checkInDate - today < oneDayMs) {
            return res.status(400).json({ error: 'Cancellation allowed only 24 hours before check-in' });
        }

        // 3. Update Status
        await db.query('UPDATE roombooking SET rb_status = "Cancelled" WHERE rb_id = ?', [id]);

        // 4. Handle Refund
        const [payments] = await db.query(
            `SELECT p.payment_id, p.payment_amount 
             FROM payment p
             JOIN roombooking rb ON p.payment_id = rb.rb_payment_id
             WHERE rb.rb_id = ? AND p.payment_status = "Success"`,
            [id]
        );

        if (payments.length > 0) {
            const payment = payments[0];
            await db.query(
                'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                [payment.payment_id, payment.payment_amount, 'Guest requested cancellation']
            );
            return res.json({ message: 'Booking cancelled. Refund request initiated.' });
        }

        res.json({ message: 'Booking cancelled successfully.' });

    } catch (error) {
        console.error('Cancel Error:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
};

// --- Restored Functions ---

// createRoomBooking removed - migrating to bookingController.js

exports.getActivities = async (req, res) => {
    try {
        const [activities] = await db.query('SELECT * FROM activity WHERE activity_status = "Available"');
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
};

exports.getVehicles = async (req, res) => {
    try {
        const [vehicles] = await db.query('SELECT * FROM vehicle WHERE vehicle_status = "Available"');
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
};

exports.getMenu = async (req, res) => {
    try {
        const [menu] = await db.query('SELECT * FROM menuitem WHERE item_availability = "Available"');
        res.json(menu);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT fo.order_id, fo.order_status, fo.order_date, fo.dining_option,
                    p.payment_amount as order_total_amount, p.payment_status,
                    oi.order_item_id, oi.quantity as order_quantity, oi.item_price, oi.item_status,
                    (oi.quantity * oi.item_price) as item_subtotal,
                    mi.item_name
             FROM foodorder fo
             JOIN orderitem oi ON fo.order_id = oi.order_id
             JOIN menuitem mi ON oi.item_id = mi.item_id
             JOIN Guest g ON fo.guest_id = g.guest_id
             LEFT JOIN payment p ON fo.payment_id = p.payment_id
             WHERE g.user_id = ?
             ORDER BY fo.order_date DESC`,
            [req.user.id]
        );

        // Group by Order ID
        const ordersMap = new Map();

        rows.forEach(row => {
            if (!ordersMap.has(row.order_id)) {
                ordersMap.set(row.order_id, {
                    order_id: row.order_id,
                    order_status: row.order_status,
                    order_date: row.order_date,
                    dining_option: row.dining_option || 'Delivery',
                    order_total_amount: row.order_total_amount,
                    payment_status: row.payment_status || 'Pending', // Include payment_status
                    items: []
                });
            }
            ordersMap.get(row.order_id).items.push({
                order_item_id: row.order_item_id,
                item_name: row.item_name,
                order_quantity: row.order_quantity,
                item_price: row.item_price,
                item_status: row.item_status,
                order_total_amount: row.item_subtotal // Keep per-item subtotal available if needed
            });
        });

        const orders = Array.from(ordersMap.values());
        res.json(orders);
    } catch (error) {
        console.error("Get Orders Error:", error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// exports.placeOrder moved to orderController.js



exports.payVehicleBooking = async (req, res) => {
    try {
        const { id } = req.params; // vb_id
        const { total_amount } = req.body;
        const userId = req.user.id;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Verify booking
            const [booking] = await connection.query(
                `SELECT vb.* FROM vehiclebooking vb 
                 JOIN Guest g ON vb.guest_id = g.guest_id 
                 JOIN Users u ON g.user_id = u.user_id
                 WHERE vb.vb_id = ? AND u.user_id = ? AND vb.vb_status = 'Pending Payment'`,
                [id, userId]
            );

            if (booking.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Booking not found or not ready for payment' });
            }

            // Create Payment
            const [paymentResult] = await connection.query(
                'INSERT INTO payment (payment_amount, payment_status) VALUES (?, ?)',
                [total_amount, 'Success']
            );
            const paymentId = paymentResult.insertId;

            // Update Booking
            await connection.query(
                "UPDATE vehiclebooking SET vb_payment_id = ?, vb_status = 'Confirmed' WHERE vb_id = ?",
                [paymentId, id]
            );

            // Notify Driver
            const [driverUser] = await connection.query(
                `SELECT u.user_id 
                 FROM vehiclebooking vb 
                 JOIN Driver d ON vb.driver_id = d.driver_id 
                 JOIN Users u ON d.user_id = u.user_id 
                 WHERE vb.vb_id = ?`,
                [id]
            );

            if (driverUser.length > 0) {
                await notificationController.createNotification(
                    driverUser[0].user_id,
                    'Trip Confirmed',
                    `Payment received for trip #${id}. Please be ready for pickup.`,
                    'Booking'
                );
            }

            await connection.commit();
            res.json({ message: 'Payment successful! Booking confirmed.' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error paying for booking:', error);
        res.status(500).json({ error: 'Payment failed' });
    }
};
