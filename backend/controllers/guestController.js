const db = require('../config/db');
const bcrypt = require('bcryptjs');
const notificationController = require('./notificationController');

exports.getProfile = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT g.*, u.first_name, u.last_name, CONCAT(u.first_name, ' ', u.last_name) as guest_name, u.email as guest_email, g.guest_phone, u.role 
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
        const { first_name, last_name, guest_phone, guest_nic_passport, nationality } = req.body;

        const userId = req.user.id;

        // 1. Update Users Table (Common info)
        await connection.query(
            'UPDATE Users SET first_name = ?, last_name = ? WHERE user_id = ?',
            [first_name, last_name, userId]
        );

        // 2. Update Guest Table (Specific info including phone)
        await connection.query(
            'UPDATE Guest SET guest_nic_passport = ?, nationality = ?, guest_phone = ? WHERE user_id = ?',
            [guest_nic_passport, nationality, guest_phone, userId]
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

        const [hirevehicles] = await db.query(
            `SELECT vb.*, vb.vb_date as booking_date, v.vehicle_type, v.vehicle_number, v.vehicle_price_per_day 
             FROM hirevehicle vb 
             JOIN vehicle v ON vb.vehicle_id = v.vehicle_id 
             JOIN Guest g ON vb.guest_id = g.guest_id
             WHERE g.user_id = ?
             ORDER BY vb.vb_date DESC`,
            [req.user.id]
        );

        res.json({
            rooms: roomBookings,
            activities: activityBookings,
            vehicles: hirevehicles
        });
    } catch (error) {
        console.error("Booking Fetch Error:", error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

// --- NEW ROUND-UP AGGREGATOR ---
exports.getGroupedBookings = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get Room Bookings (Parents)
        const [rooms] = await db.query(
            `SELECT rb.rb_id, rb.rb_status, rb.rb_checkin as check_in_date, rb.rb_checkout as check_out_date, rb.rb_total_amount as total_price, r.room_type, r.room_number
             FROM roombooking rb 
             JOIN room r ON rb.room_id = r.room_id 
             JOIN Guest g ON rb.guest_id = g.guest_id
             WHERE g.user_id = ? 
             ORDER BY rb.rb_checkin DESC`,
            [userId]
        );

        if (rooms.length === 0) {
            return res.json([]); 
        }

        // Prepare grouping
        const groupedMap = new Map();
        rooms.forEach(room => {
            groupedMap.set(room.rb_id, {
                ...room,
                activities: [],
                vehicles: [],
                foodOrders: []
            });
        });

        const activeRoomIds = Array.from(groupedMap.keys());

        if (activeRoomIds.length > 0) {
            // 2. Fetch linked Activities
            const [activities] = await db.query(
                `SELECT ab.*, ab.ab_start_time as booking_date, ab.ab_total_amount as total_price, a.activity_name 
                 FROM activitybooking ab 
                 JOIN activity a ON ab.activity_id = a.activity_id 
                 WHERE ab.rb_id IN (?)`,
                [activeRoomIds]
            );

            activities.forEach(act => {
                if (groupedMap.has(act.rb_id)) {
                    groupedMap.get(act.rb_id).activities.push(act);
                }
            });

            // 3. Fetch linked Vehicles
            const [vehicles] = await db.query(
                `SELECT vb.*, vb.vb_date as booking_date, v.vehicle_type, v.vehicle_number, v.vehicle_price_per_day 
                 FROM hirevehicle vb 
                 JOIN vehicle v ON vb.vehicle_id = v.vehicle_id 
                 WHERE vb.rb_id IN (?)`,
                [activeRoomIds]
            );

            vehicles.forEach(veh => {
                if (groupedMap.has(veh.rb_id)) {
                    groupedMap.get(veh.rb_id).vehicles.push(veh);
                }
            });

            // 3.5 Fetch linked Arrival Transports
            const [arrivals] = await db.query(
                `SELECT ha.*, ha.scheduled_at as booking_date, ha.vehicle_type_requested as vehicle_type, 
                        v.vehicle_number, v.vehicle_price_per_day
                 FROM hire_vehicle_for_arrival ha
                 LEFT JOIN vehicle v ON ha.vehicle_id = v.vehicle_id 
                 WHERE ha.rb_id IN (?)`,
                [activeRoomIds]
            );

            arrivals.forEach(arr => {
                if (groupedMap.has(arr.rb_id)) {
                    groupedMap.get(arr.rb_id).vehicles.push({
                        ...arr,
                        isArrivalTransport: true,
                        // map status fields for UI consistency
                        vb_status: arr.payment_status === 'Paid' ? 'Confirmed' : (arr.driver_id ? 'Pending Payment' : 'Pending Approval'),
                        vb_id: arr.transport_id, // map PK for common handling
                        vehicle_price_per_day: arr.final_amount,
                        vb_days: 1
                    });
                }
            });

            // 4. Fetch linked Food Orders
            const [foodOrderRows] = await db.query(
                `SELECT fo.order_id, fo.order_status, fo.order_date, fo.dining_option, fo.rb_id,
                        p.payment_amount as order_total_amount, p.payment_status,
                        oi.order_item_id, oi.quantity as order_quantity, oi.item_price, oi.item_status,
                        (oi.quantity * oi.item_price) as item_subtotal,
                        mi.item_name
                 FROM foodorder fo
                 JOIN orderitem oi ON fo.order_id = oi.order_id
                 JOIN menuitem mi ON oi.item_id = mi.item_id
                 LEFT JOIN payment p ON fo.payment_id = p.payment_id
                 WHERE fo.rb_id IN (?)
                 ORDER BY fo.order_date DESC`,
                [activeRoomIds]
            );

            // Group items internally first
            const ordersMap = new Map();
            foodOrderRows.forEach(row => {
                if (!ordersMap.has(row.order_id)) {
                    ordersMap.set(row.order_id, {
                        order_id: row.order_id,
                        order_status: row.order_status,
                        order_date: row.order_date,
                        dining_option: row.dining_option,
                        order_total_amount: row.order_total_amount,
                        payment_status: row.payment_status,
                        rb_id: row.rb_id,
                        items: []
                    });
                }
                ordersMap.get(row.order_id).items.push({
                    order_item_id: row.order_item_id,
                    item_name: row.item_name,
                    order_quantity: row.order_quantity,
                    item_price: row.item_price,
                    item_status: row.item_status,
                    order_total_amount: row.item_subtotal
                });
            });

            // Distribute fully nested orders into the trips
            const finalOrders = Array.from(ordersMap.values());
            finalOrders.forEach(order => {
                if (groupedMap.has(order.rb_id)) {
                    groupedMap.get(order.rb_id).foodOrders.push(order);
                }
            });
            // 5. Fetch linked Quick Rides
            const [quickRides] = await db.query(
                `SELECT qr.*, v.vehicle_number, v.vehicle_type as veh_type,
                        CONCAT(u.first_name, ' ', u.last_name) as driver_name
                 FROM quickride qr
                 LEFT JOIN vehicle v ON qr.vehicle_id = v.vehicle_id
                 LEFT JOIN Driver d ON qr.driver_id = d.driver_id
                 LEFT JOIN Users u ON d.user_id = u.user_id
                 WHERE qr.rb_id IN (?)
                 ORDER BY qr.created_at DESC`,
                [activeRoomIds]
            );

            quickRides.forEach(qr => {
                if (groupedMap.has(qr.rb_id)) {
                    groupedMap.get(qr.rb_id).quickRides = groupedMap.get(qr.rb_id).quickRides || [];
                    groupedMap.get(qr.rb_id).quickRides.push(qr);
                }
            });
        }

        res.json(Array.from(groupedMap.values()));

    } catch (error) {
        console.error("Grouped Booking Fetch Error:", error);
        res.status(500).json({ error: 'Failed to fetch grouped bookings' });
    }
};

// Get Active Bookings (for service validation)
exports.getActiveBookings = async (req, res) => {
    try {
        const [guestRows] = await db.query('SELECT guest_id FROM Guest WHERE user_id = ?', [req.user.id]);
        if (guestRows.length === 0) {
            return res.status(404).json({ error: 'Guest profile not found' });
        }
        const guest_id = guestRows[0].guest_id;

        const [bookings] = await db.query(
            `SELECT rb.rb_id, rb.rb_checkin as check_in_date, rb.rb_checkout as check_out_date, rb.rb_status, rb.rb_total_amount,
                    r.room_id, r.room_type
             FROM roombooking rb
             JOIN room r ON rb.room_id = r.room_id
             WHERE rb.guest_id = ? 
             AND rb.rb_status IN ('Booked', 'Checked-in', 'Active')
             AND rb.rb_checkout >= CURDATE()
             ORDER BY rb.rb_checkin ASC`,
            [guest_id]
        );

        res.json({
            hasActiveBooking: bookings.length > 0,
            bookings: bookings
        });
    } catch (error) {
        console.error("Active Bookings Fetch Error:", error);
        res.status(500).json({ error: 'Failed to fetch active bookings' });
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

// Cancel Activity Booking
exports.cancelActivityBooking = async (req, res) => {
    const { id } = req.params;
    try {
        const [bookings] = await db.query(
            'SELECT * FROM activitybooking WHERE ab_id = ? AND guest_id = (SELECT guest_id FROM Guest WHERE user_id = ?)',
            [id, req.user.id]
        );
        if (bookings.length === 0) return res.status(404).json({ error: 'Activity booking not found' });

        await db.query('UPDATE activitybooking SET ab_status = "Cancelled" WHERE ab_id = ?', [id]);
        
        res.json({ message: 'Activity cancelled successfully.' });
    } catch (error) {
        console.error('Cancel Activity Error:', error);
        res.status(500).json({ error: 'Failed to cancel activity' });
    }
};

// Cancel Food Order
exports.cancelFoodOrder = async (req, res) => {
    const { id } = req.params;
    try {
        const [orders] = await db.query(
            'SELECT * FROM foodorder WHERE order_id = ? AND guest_id = (SELECT guest_id FROM Guest WHERE user_id = ?)',
            [id, req.user.id]
        );
        if (orders.length === 0) return res.status(404).json({ error: 'Food order not found' });

        const order = orders[0];
        if (['Preparing', 'Prepared', 'Delivered'].includes(order.order_status)) {
            return res.status(400).json({ error: `Cannot cancel an order that is already ${order.order_status.toLowerCase()}` });
        }

        await db.query('UPDATE foodorder SET order_status = "Cancelled" WHERE order_id = ?', [id]);
        // Note: keeping order items statuses in sync is good practice, though not strictly required
        await db.query('UPDATE orderitem SET item_status = "Cancelled" WHERE order_id = ?', [id]);

        res.json({ message: 'Food order cancelled successfully.' });
    } catch (error) {
        console.error('Cancel Food Order Error:', error);
        res.status(500).json({ error: 'Failed to cancel food order' });
    }
};

// Cancel Food Order Item
exports.cancelFoodOrderItem = async (req, res) => {
    const { orderId, itemId } = req.params;
    try {
        const [orders] = await db.query(
            'SELECT fo.*, oi.item_status FROM foodorder fo JOIN orderitem oi ON fo.order_id = oi.order_id WHERE fo.order_id = ? AND oi.order_item_id = ? AND fo.guest_id = (SELECT guest_id FROM Guest WHERE user_id = ?)',
            [orderId, itemId, req.user.id]
        );
        if (orders.length === 0) return res.status(404).json({ error: 'Order item not found' });

        const order = orders[0];
        if (['Preparing', 'Prepared', 'Delivered'].includes(order.order_status)) {
            return res.status(400).json({ error: `Cannot cancel an item for an order that is already ${order.order_status.toLowerCase()}` });
        }
        if (order.item_status === 'Cancelled') {
            return res.status(400).json({ error: 'Item is already cancelled' });
        }

        await db.query('UPDATE orderitem SET item_status = "Cancelled" WHERE order_item_id = ?', [itemId]);

        // Check if all items in this order are cancelled
        const [remainingItems] = await db.query(
            'SELECT count(*) as count FROM orderitem WHERE order_id = ? AND item_status != "Cancelled"',
            [orderId]
        );
        if (remainingItems[0].count === 0) {
            // Cancel the whole order since all items are cancelled
            await db.query('UPDATE foodorder SET order_status = "Cancelled" WHERE order_id = ?', [orderId]);
        }

        res.json({ message: 'Food item cancelled successfully.' });
    } catch (error) {
        console.error('Cancel Food Item Error:', error);
        res.status(500).json({ error: 'Failed to cancel food item' });
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



exports.payhirevehicle = async (req, res) => {
    try {
        const { id } = req.params; // vb_id
        const { total_amount } = req.body;
        const userId = req.user.id;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Verify booking
            const [booking] = await connection.query(
                `SELECT vb.* FROM hirevehicle vb 
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
                "UPDATE hirevehicle SET vb_payment_id = ?, vb_status = 'Confirmed' WHERE vb_id = ?",
                [paymentId, id]
            );

            // Notify Driver
            const [driverUser] = await connection.query(
                `SELECT u.user_id 
                 FROM hirevehicle vb 
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

exports.payArrivalTransport = async (req, res) => {
    try {
        const { id } = req.params; // transport_id
        const { total_amount } = req.body;
        const userId = req.user.id;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Verify booking
            const [booking] = await connection.query(
                `SELECT ha.* FROM hire_vehicle_for_arrival ha
                 JOIN Guest g ON ha.guest_id = g.guest_id 
                 WHERE ha.transport_id = ? AND g.user_id = ? AND ha.payment_status = 'Pending'`,
                [id, userId]
            );

            if (booking.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Transport request not found or already paid' });
            }

            // Create Payment
            const [paymentResult] = await connection.query(
                'INSERT INTO payment (payment_amount, payment_status) VALUES (?, ?)',
                [total_amount, 'Success']
            );
            
            // Update Arrival Transport
            await connection.query(
                "UPDATE hire_vehicle_for_arrival SET payment_status = 'Paid', status = 'Accepted' WHERE transport_id = ?",
                [id]
            );

            // Notify Driver
            if (booking[0].driver_id) {
                const [driverUser] = await connection.query(
                    `SELECT user_id FROM Driver WHERE driver_id = ?`,
                    [booking[0].driver_id]
                );

                if (driverUser.length > 0) {
                    await notificationController.createNotification(
                        driverUser[0].user_id,
                        'Arrival Transport Confirmed',
                        `Payment received for arrival transport #${id}. Please be ready for pickup.`,
                        'Booking'
                    );
                }
            }

            await connection.commit();
            res.json({ message: 'Payment successful! Arrival transport confirmed.' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error paying for arrival transport:', error);
        res.status(500).json({ error: 'Payment failed' });
    }
};
