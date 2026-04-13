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
                        vb_status: ['Cancelled', 'Completed'].includes(arr.status) 
                                        ? arr.status 
                                        : (arr.payment_status === 'Paid' ? 'Confirmed' : (arr.driver_id ? 'Pending Payment' : 'Pending Approval')),
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
                 ORDER BY qr.created_date DESC`,
                [activeRoomIds]
            );

            quickRides.forEach(qr => {
                if (groupedMap.has(qr.rb_id)) {
                    groupedMap.get(qr.rb_id).quickRides = groupedMap.get(qr.rb_id).quickRides || [];
                    groupedMap.get(qr.rb_id).quickRides.push(qr);
                }
            });
        }

        // --- Normalization Pass ---
        // If the parent room booking is Cancelled, ensure all child service statuses
        // reflect Cancelled in the response (self-healing for data inconsistencies)
        groupedMap.forEach(trip => {
            if (trip.rb_status === 'Cancelled') {
                trip.activities.forEach(act => {
                    act.ab_status = 'Cancelled';
                });
                trip.foodOrders.forEach(order => {
                    order.order_status = 'Cancelled';
                    order.items.forEach(item => { item.item_status = 'Cancelled'; });
                });
                trip.vehicles.forEach(veh => {
                    veh.vb_status = 'Cancelled';
                });
                (trip.quickRides || []).forEach(qr => {
                    qr.status = 'Cancelled';
                });
            }
        });

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
    const { cancelReason } = req.body || {};
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get Booking
        const [bookings] = await connection.query(
            'SELECT * FROM roombooking WHERE rb_id = ? AND guest_id = (SELECT guest_id FROM Guest WHERE user_id = ?)',
            [id, req.user.id]
        );
        if (bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookings[0];

        // 2. Validate Date (24 hours check)
        const checkInDate = new Date(booking.rb_checkin);
        const today = new Date();
        const oneDayMs = 24 * 60 * 60 * 1000;

        if (checkInDate - today < oneDayMs) {
            await connection.rollback();
            return res.status(400).json({ error: 'Cancellation allowed only 24 hours before check-in' });
        }

        // 3. Update Status (Cascading Cancellation)
        // A. Room Booking
        await connection.query('UPDATE roombooking SET rb_status = "Cancelled", cancel_reason = ? WHERE rb_id = ?', [cancelReason || 'Guest cancelled entire trip', id]);

        // B. Associated Activities
        await connection.query('UPDATE activitybooking SET ab_status = "Cancelled" WHERE rb_id = ?', [id]);

        // C. Associated Food Orders
        await connection.query('UPDATE foodorder SET order_status = "Cancelled" WHERE rb_id = ?', [id]);

        // D. Associated Vehicle Hires
        await connection.query('UPDATE hirevehicle SET vb_status = "Cancelled" WHERE rb_id = ?', [id]);

        // E. Associated Arrival Transfers — cancel and notify drivers
        const [arrivalTransfers] = await connection.query(
            `SELECT ha.transport_id, ha.driver_id, ha.status
             FROM hire_vehicle_for_arrival ha
             WHERE ha.rb_id = ? AND ha.status NOT IN ('Cancelled', 'Completed')`,
            [id]
        );
        if (arrivalTransfers.length > 0) {
            await connection.query(
                `UPDATE hire_vehicle_for_arrival SET status = 'Cancelled' WHERE rb_id = ? AND status NOT IN ('Cancelled', 'Completed')`,
                [id]
            );
            // Notify each assigned driver
            for (const transfer of arrivalTransfers) {
                if (transfer.driver_id) {
                    const [driverUser] = await connection.query(
                        'SELECT user_id FROM Driver WHERE driver_id = ?',
                        [transfer.driver_id]
                    );
                    if (driverUser.length > 0) {
                        await notificationController.createNotification(
                            driverUser[0].user_id,
                            'Arrival Transfer Cancelled',
                            `The room booking linked to your arrival transfer #${transfer.transport_id} has been cancelled by the guest. Please disregard this trip.`,
                            'Booking'
                        );
                    }
                }
            }
        }

        // 4. Handle Refunds for everything linked to this booking
        // Collect all successful payments linked to this rb_id
        const [bundledPayments] = await connection.query(
            `SELECT p.payment_id, p.payment_amount, 'Room & Bundled Services' as reason
             FROM payment p
             JOIN roombooking rb ON p.payment_id = rb.rb_payment_id
             WHERE rb.rb_id = ? AND p.payment_status = "Success"`,
            [id]
        );

        const [activityPayments] = await connection.query(
            `SELECT p.payment_id, p.payment_amount, CONCAT('Activity: ', a.activity_name) as reason
             FROM payment p
             JOIN activitybooking ab ON p.payment_id = ab.ab_payment_id
             JOIN activity a ON ab.activity_id = a.activity_id
             WHERE ab.rb_id = ? AND p.payment_status = "Success"`,
            [id]
        );

        const [vehiclePayments] = await connection.query(
            `SELECT p.payment_id, p.payment_amount, CONCAT('Vehicle: ', v.vehicle_type) as reason
             FROM payment p
             JOIN hirevehicle hv ON p.payment_id = hv.vb_payment_id
             JOIN vehicle v ON hv.vehicle_id = v.vehicle_id
             WHERE hv.rb_id = ? AND p.payment_status = "Success"`,
            [id]
        );

        const [arrivalPayments] = await connection.query(
            `SELECT p.payment_id, p.payment_amount, 'Arrival Transport' as reason
             FROM payment p
             JOIN hire_vehicle_for_arrival ha ON p.payment_id = ha.ha_payment_id
             WHERE ha.rb_id = ? AND p.payment_status = "Success"`,
            [id]
        );

        // Combine and unique by payment_id
        const allPayments = [...bundledPayments, ...activityPayments, ...vehiclePayments, ...arrivalPayments];
        const uniquePayments = Array.from(new Map(allPayments.map(p => [p.payment_id, p])).values());

        let refundCount = 0;
        for (const payment of uniquePayments) {
            await connection.query(
                'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                [payment.payment_id, payment.payment_amount, `System cascade: Trip #${id} cancelled. Reason: ${cancelReason || 'N/A'}. ${payment.reason}`]
            );
            refundCount++;
        }

        let message = 'Booking and all associated services cancelled successfully.';
        if (refundCount > 0) {
            message = `Trip cancelled successfully. ${refundCount} refund request(s) initiated for your payments.`;
        }

        await connection.commit();
        res.json({ message });

    } catch (error) {
        await connection.rollback();
        console.error('Cancel Error:', error);
        res.status(500).json({ error: 'Failed to cancel entire trip' });
    } finally {
        connection.release();
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

// Cancel Arrival Transfer
exports.cancelArrivalTransport = async (req, res) => {
    const { id } = req.params; // transport_id
    const { cancelReason } = req.body || {};
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Verify the transfer belongs to this guest and is cancellable
        const [transfers] = await connection.query(
            `SELECT ha.*, g.user_id
             FROM hire_vehicle_for_arrival ha
             JOIN Guest g ON ha.guest_id = g.guest_id
             WHERE ha.transport_id = ? AND g.user_id = ?`,
            [id, req.user.id]
        );

        if (transfers.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Arrival transfer not found' });
        }

        const transfer = transfers[0];

        if (['Cancelled', 'Completed'].includes(transfer.status)) {
            await connection.rollback();
            return res.status(400).json({ error: `Cannot cancel a transfer that is already ${transfer.status.toLowerCase()}` });
        }

        // Cancel the transfer
        await connection.query(
            `UPDATE hire_vehicle_for_arrival SET status = 'Cancelled', cancel_reason = ? WHERE transport_id = ?`,
            [cancelReason || 'Guest cancelled arrival transfer', id]
        );

        // Handle Refund if paid
        if (transfer.payment_status === 'Paid' && transfer.ha_payment_id) {
            await connection.query(
                'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                [transfer.ha_payment_id, transfer.final_amount, `Guest cancelled arrival transfer #${id}. Reason: ${cancelReason || 'N/A'}`]
            );
        }

        // Notify the assigned driver (if any)
        if (transfer.driver_id) {
            const [driverUser] = await connection.query(
                'SELECT user_id FROM Driver WHERE driver_id = ?',
                [transfer.driver_id]
            );
            if (driverUser.length > 0) {
                const refundMsg = transfer.payment_status === 'Paid' ? ` A refund request has been initiated.` : '';
                await notificationController.createNotification(
                    driverUser[0].user_id,
                    'Arrival Transfer Cancelled',
                    `Arrival transfer #${id} has been cancelled by the guest.${refundMsg} Please disregard this trip.`,
                    'Booking'
                );
            }
        }

        await connection.commit();
        res.json({ message: 'Arrival transfer cancelled successfully.' });
    } catch (error) {
        await connection.rollback();
        console.error('Cancel Arrival Transfer Error:', error);
        res.status(500).json({ error: 'Failed to cancel arrival transfer' });
    } finally {
        connection.release();
    }
};

// Cancel Regular Vehicle Hire
exports.cancelVehicleHire = async (req, res) => {
    const { id } = req.params; // vb_id
    const { cancelReason } = req.body || {};
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Verify the hire belongs to this guest
        const [bookings] = await connection.query(
            `SELECT vb.*, g.user_id
             FROM hirevehicle vb
             JOIN Guest g ON vb.guest_id = g.guest_id
             WHERE vb.vb_id = ? AND g.user_id = ?`,
            [id, req.user.id]
        );

        if (bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Vehicle hire not found' });
        }

        const hire = bookings[0];

        if (['Cancelled', 'Completed'].includes(hire.vb_status)) {
            await connection.rollback();
            return res.status(400).json({ error: `Cannot cancel a hire that is already ${hire.vb_status.toLowerCase()}` });
        }

        // Cancel the hire
        await connection.query(
            `UPDATE hirevehicle SET vb_status = 'Cancelled', cancel_reason = ? WHERE vb_id = ?`,
            [cancelReason || 'Guest cancelled vehicle hire', id]
        );

        // Handle Refund if paid
        if (hire.vb_payment_id) {
            const refundAmount = hire.vb_price_per_day * hire.vb_days;
            await connection.query(
                'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                [hire.vb_payment_id, refundAmount, `Guest cancelled vehicle hire #${id}. Reason: ${cancelReason || 'N/A'}`]
            );
        }

        // Notify the assigned driver (if any)
        if (hire.driver_id) {
            const [driverUser] = await connection.query(
                'SELECT user_id FROM Driver WHERE driver_id = ?',
                [hire.driver_id]
            );
            if (driverUser.length > 0) {
                const refundMsg = hire.vb_payment_id ? ` A refund request has been initiated.` : '';
                await notificationController.createNotification(
                    driverUser[0].user_id,
                    'Vehicle Hire Cancelled',
                    `Vehicle hire booking #${id} has been cancelled by the guest.${refundMsg} Please disregard this assignment.`,
                    'Booking'
                );
            }
        }

        await connection.commit();
        res.json({ message: 'Vehicle hire cancelled successfully.' });
    } catch (error) {
        await connection.rollback();
        console.error('Cancel Vehicle Hire Error:', error);
        res.status(500).json({ error: 'Failed to cancel vehicle hire' });
    } finally {
        connection.release();
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
            const paymentId = paymentResult.insertId;
            
            // Update Arrival Transport
            await connection.query(
                "UPDATE hire_vehicle_for_arrival SET payment_status = 'Paid', ha_payment_id = ?, status = 'Accepted' WHERE transport_id = ?",
                [paymentId, id]
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
