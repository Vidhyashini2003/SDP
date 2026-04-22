/**
 * controllers/guestController.js — Guest Portal Business Logic
 *
 * This controller handles all API logic for the guest-facing portal.
 * Every function here is called from routes/guest.js (and some from routes/bookings.js).
 *
 * Functions exported:
 *
 *  Profile
 *    getProfile()       — Returns full guest profile (joined with Users table)
 *    updateProfile()    — Updates name, phone, NIC, nationality for a guest
 *
 *  Booking Views
 *    getMyBookings()       — Returns flat list of room + activity + vehicle bookings
 *    getGroupedBookings()  — Returns bookings grouped by room trip (the main "My Bookings" page)
 *                           Each room booking includes linked activities, vehicles,
 *                           arrival transports, food orders, and quick rides.
 *    getActiveBookings()   — Returns only currently active room bookings (for service gating)
 *
 *  Cancellations
 *    cancelRoomBooking()      — Cancels the room AND all linked services (cascading cancel).
 *                              Handles optional refund requests (>24h before check-in).
 *    cancelActivityBooking()  — Cancels a single activity booking
 *    cancelFoodOrder()        — Cancels an entire food order (if not already being prepared)
 *    cancelFoodOrderItem()    — Cancels one item from a food order; cancels order if all items cancelled
 *    cancelArrivalTransport() — Cancels an airport transfer, notifies driver, optional refund
 *    cancelVehicleHire()      — Cancels a per-day vehicle hire, notifies driver, optional refund
 *
 *  Payments
 *    payhirevehicle()    — Processes payment for a per-day vehicle hire (creates payment record, notifies driver)
 *    payArrivalTransport() — Processes payment for an arrival transport (after driver sets price)
 *
 *  Informational (shared with receptionist)
 *    getActivities()   — Returns all 'Available' activities
 *    getVehicles()     — Returns all 'Available' vehicles
 *    getMenu()         — Returns all 'Available' menu items
 *    getOrders()       — Returns all food orders for the current guest (grouped by order)
 *
 * Key patterns used:
 *  - Transactions (connection.beginTransaction / commit / rollback) for operations that touch
 *    multiple tables (cancellations with cascading updates, payment creation + booking update)
 *  - notificationController.createNotification() to notify drivers of cancellations/payments
 *  - requestRefund flag: refunds are ONLY created when the guest explicitly requests one during cancellation
 */

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const notificationController = require('./notificationController');

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────

/**
 * GET /api/guest/profile
 * Returns the full profile of the logged-in guest, joining Guest and Users tables.
 * Includes: name, email, phone, NIC/passport, nationality, role.
 */
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

/**
 * PUT /api/guest/profile
 * Updates guest profile fields across both the Users table (name) and Guest table (phone, NIC, nationality).
 * Uses a transaction to ensure both updates succeed together.
 */
exports.updateProfile = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { first_name, last_name, guest_phone, guest_nic_passport, nationality, guest_email } = req.body;

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

        // 4. Handle Refunds — only if guest explicitly requested AND it's >24h before check-in
        const { requestRefund } = req.body;

        let refundCount = 0;
        if (requestRefund === true) {
            const checkInDate = new Date(booking.rb_checkin);
            const now = new Date();
            const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);

            if (hoursUntilCheckIn >= 24) {
                // Refund room cost only (excluding activities/food which are non-refundable)
                // The bundled payment covers room + food + activities, so we refund only room amount
                const [bundledPayments] = await connection.query(
                    `SELECT p.payment_id, rb.rb_total_amount as refund_amount
                     FROM payment p
                     JOIN roombooking rb ON p.payment_id = rb.rb_payment_id
                     WHERE rb.rb_id = ? AND p.payment_status = 'Success'`,
                    [id]
                );

                for (const payment of bundledPayments) {
                    await connection.query(
                        'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                        [payment.payment_id, payment.refund_amount, `Guest requested refund for room booking #${id}. Reason: ${cancelReason || 'N/A'}. Note: Activities & Dining costs are non-refundable.`]
                    );
                    refundCount++;
                }

                // Refund linked vehicle hires (separate payments if any)
                const [vehiclePayments] = await connection.query(
                    `SELECT p.payment_id, (hv.vb_price_per_day * hv.vb_days) as refund_amount, v.vehicle_type
                     FROM payment p
                     JOIN hirevehicle hv ON p.payment_id = hv.vb_payment_id
                     JOIN vehicle v ON hv.vehicle_id = v.vehicle_id
                     WHERE hv.rb_id = ? AND p.payment_status = 'Success'`,
                    [id]
                );

                for (const payment of vehiclePayments) {
                    await connection.query(
                        'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                        [payment.payment_id, payment.refund_amount, `Guest requested refund for vehicle hire linked to room booking #${id}. Vehicle: ${payment.vehicle_type}`]
                    );
                    refundCount++;
                }
            }
        }

        let message = 'Booking and all associated services cancelled successfully.';
        if (requestRefund && refundCount > 0) {
            message = `Trip cancelled successfully. ${refundCount} refund request(s) submitted for review by the hotel.`;
        } else if (requestRefund && refundCount === 0) {
            message = `Trip cancelled. Refund not applicable (cancellation made less than 24 hours before check-in).`;
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

        // Handle Refund — only if guest explicitly requested AND >24h before scheduled arrival
        const { requestRefund } = req.body;
        if (requestRefund === true && transfer.payment_status === 'Paid' && transfer.ha_payment_id) {
            const scheduledAt = transfer.scheduled_at ? new Date(transfer.scheduled_at) : null;
            const now = new Date();
            const hoursUntil = scheduledAt ? (scheduledAt - now) / (1000 * 60 * 60) : -1;

            if (hoursUntil >= 24) {
                await connection.query(
                    'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                    [transfer.ha_payment_id, transfer.final_amount, `Guest requested refund for arrival transfer #${id}. Reason: ${cancelReason || 'N/A'}`]
                );
            }
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

        // Handle Refund — only if guest explicitly requested AND >24h before vehicle date
        const { requestRefund } = req.body;
        if (requestRefund === true && hire.vb_date) {
            const vehicleDate = new Date(hire.vb_date);
            const now = new Date();
            const hoursUntil = (vehicleDate - now) / (1000 * 60 * 60);

            if (hoursUntil >= 24 && hire.vb_payment_id) {
                const refundAmount = (hire.vb_price_per_day || 0) * hire.vb_days;
                await connection.query(
                    'INSERT INTO refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                    [hire.vb_payment_id, refundAmount, `Guest requested refund for vehicle hire #${id}. Reason: ${cancelReason || 'N/A'}`]
                );
            }
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

//Special Task
exports.createSpecialRequest = async (req, res) => {
    const { rb_id, request_note } = req.body;

    // Basic validation
    if (!rb_id || !request_note || request_note.trim() === '') {
        return res.status(400).json({ error: 'rb_id and request_note are required' });
    }

    try {
        const [bookings] = await db.query(
            `SELECT rb.rb_id FROM roombooking rb
             JOIN Guest g ON rb.guest_id = g.guest_id
             WHERE rb.rb_id = ? AND g.user_id = ? AND rb.rb_status NOT IN ('Cancelled', 'Completed')`,
            [rb_id, req.user.id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Active room booking not found for this guest' });
        }

        const [guestRows] = await db.query('SELECT guest_id FROM Guest WHERE user_id = ?', [req.user.id]);
        const guest_id = guestRows[0].guest_id;

        const [result] = await db.query(
            'INSERT INTO guest_special_request (guest_id, rb_id, request_note) VALUES (?, ?, ?)',
            [guest_id, rb_id, request_note.trim()]
        );

        res.status(201).json({
            message: 'Special request submitted successfully.',
            request_id: result.insertId
        });
    } catch (error) {
        console.error('Create Special Request Error:', error);
        res.status(500).json({ error: 'Failed to submit special request' });
    }
};

//Returns all special requests submitted by this guest across all their bookings.
exports.getSpecialRequests = async (req, res) => {
    try {
        const [requests] = await db.query(
            `SELECT sr.request_id, sr.rb_id, sr.request_note, sr.status, sr.created_at, sr.updated_at,
                    r.room_type, r.room_number
             FROM guest_special_request sr
             JOIN roombooking rb ON sr.rb_id = rb.rb_id
             JOIN room r ON rb.room_id = r.room_id
             JOIN Guest g ON sr.guest_id = g.guest_id
             WHERE g.user_id = ?
             ORDER BY sr.created_at DESC`,
            [req.user.id]
        );

        res.json(requests);
    } catch (error) {
        console.error('Get Special Requests Error:', error);
        res.status(500).json({ error: 'Failed to fetch special requests' });
    }
};

//Update the note text of a special request.
exports.updateSpecialRequest = async (req, res) => {
    const { id } = req.params;
    const { request_note } = req.body;

    if (!request_note || request_note.trim() === '') {
        return res.status(400).json({ error: 'request_note is required' });
    }

    try {
        const [rows] = await db.query(
            `SELECT sr.request_id, sr.status
             FROM guest_special_request sr
             JOIN Guest g ON sr.guest_id = g.guest_id
             WHERE sr.request_id = ? AND g.user_id = ?`,
            [id, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Special request not found' });
        }

        if (rows[0].status !== 'Pending') {
            return res.status(400).json({ error: `Cannot edit a request that is already '${rows[0].status}'` });
        }

        await db.query(
            'UPDATE guest_special_request SET request_note = ? WHERE request_id = ?',
            [request_note.trim(), id]
        );

        res.json({ message: 'Special request updated successfully.' });
    } catch (error) {
        console.error('Update Special Request Error:', error);
        res.status(500).json({ error: 'Failed to update special request' });
    }
};

//Delete a special request. Only allowed if still 'Pending'.
exports.deleteSpecialRequest = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(
            `SELECT sr.request_id, sr.status
             FROM guest_special_request sr
             JOIN Guest g ON sr.guest_id = g.guest_id
             WHERE sr.request_id = ? AND g.user_id = ?`,
            [id, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Special request not found' });
        }

        if (rows[0].status !== 'Pending') {
            return res.status(400).json({ error: `Cannot delete a request that is already '${rows[0].status}'` });
        }

        await db.query('DELETE FROM guest_special_request WHERE request_id = ?', [id]);

        res.json({ message: 'Special request deleted successfully.' });
    } catch (error) {
        console.error('Delete Special Request Error:', error);
        res.status(500).json({ error: 'Failed to delete special request' });
    }
};
