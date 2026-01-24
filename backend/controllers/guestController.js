const db = require('../config/db');

// Get Guest Profile
exports.getProfile = async (req, res) => {
    try {
        const [guests] = await db.query(
            'SELECT guest_id, guest_name, guest_email, guest_phone, guest_address, nationality, card_number, card_holder_name, card_expiry, card_cvv FROM Guest WHERE guest_id = ?',
            [req.user.id]
        );

        if (guests.length === 0) {
            return res.status(404).json({ error: 'Guest not found' });
        }

        res.json(guests[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

// Update Guest Profile
exports.updateProfile = async (req, res) => {
    try {
        const { guest_name, guest_email, guest_phone, guest_address, nationality, card_number, card_holder_name, card_expiry, card_cvv } = req.body;

        // Check if email is already taken by another user
        if (guest_email) {
            const [existingGuest] = await db.query(
                'SELECT guest_id FROM Guest WHERE guest_email = ? AND guest_id != ?',
                [guest_email, req.user.id]
            );

            if (existingGuest.length > 0) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }

        await db.query(
            'UPDATE Guest SET guest_name = ?, guest_email = ?, guest_phone = ?, guest_address = ?, nationality = ?, card_number = ?, card_holder_name = ?, card_expiry = ?, card_cvv = ? WHERE guest_id = ?',
            [guest_name, guest_email, guest_phone, guest_address, nationality, card_number, card_holder_name, card_expiry, card_cvv, req.user.id]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Get All Bookings for Guest (Room, Activity, Vehicle)
exports.getBookings = async (req, res) => {
    try {
        const guestId = req.user.id;

        // Fetch Room Bookings
        const [roomBookings] = await db.query(
            `SELECT rb.*, r.room_type, r.room_price_per_day 
       FROM RoomBooking rb 
       JOIN Room r ON rb.room_id = r.room_id 
       WHERE rb.guest_id = ?`,
            [guestId]
        );

        // Fetch Activity Bookings
        const [activityBookings] = await db.query(
            `SELECT ab.*, a.activity_name, a.activity_price_per_hour 
       FROM ActivityBooking ab 
       JOIN Activity a ON ab.activity_id = a.activity_id 
       WHERE ab.guest_id = ?`,
            [guestId]
        );

        // Fetch Vehicle Bookings
        const [vehicleBookings] = await db.query(
            `SELECT vb.*, v.vehicle_type, v.vehicle_number 
       FROM VehicleBooking vb 
       JOIN Vehicle v ON vb.vehicle_id = v.vehicle_id 
       WHERE vb.guest_id = ?`,
            [guestId]
        );

        res.json({
            rooms: roomBookings,
            activities: activityBookings,
            vehicles: vehicleBookings
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

// Get Food Orders for Guest
exports.getOrders = async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT oi.*, mi.item_name, mi.item_price 
       FROM OrderItem oi 
       JOIN MenuItem mi ON oi.item_id = mi.item_id 
       WHERE oi.guest_id = ? ORDER BY oi.order_date DESC`,
            [req.user.id]
        );

        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// Submit Feedback/Refund Request
exports.submitFeedback = async (req, res) => {
    try {
        const { service_type, refund_id, feedback_details } = req.body;

        await db.query(
            'INSERT INTO Feedback (guest_id, service_type, refund_id, feedback_details) VALUES (?, ?, ?, ?)',
            [req.user.id, service_type, refund_id || null, feedback_details]
        );

        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
};

// Create Room Booking
exports.createRoomBooking = async (req, res) => {
    try {
        const { room_id, rb_checkin, rb_checkout } = req.body;

        // Check if room is available
        const [rooms] = await db.query(
            'SELECT * FROM Room WHERE room_id = ? AND room_status = ?',
            [room_id, 'Available']
        );

        if (rooms.length === 0) {
            return res.status(400).json({ error: 'Room is not available' });
        }

        // Calculate total amount (days * price_per_day)
        const room = rooms[0];
        const checkin = new Date(rb_checkin);
        const checkout = new Date(rb_checkout);
        const days = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
        const totalAmount = days * room.room_price_per_day;

        // Create booking
        const [result] = await db.query(
            'INSERT INTO RoomBooking (guest_id, room_id, rb_status, rb_checkin, rb_checkout, rb_total_amount) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, room_id, 'Booked', rb_checkin, rb_checkout, totalAmount]
        );

        // Update room status to Booked
        await db.query(
            'UPDATE Room SET room_status = ? WHERE room_id = ?',
            ['Booked', room_id]
        );

        res.status(201).json({
            message: 'Room booked successfully',
            booking_id: result.insertId,
            total_amount: totalAmount
        });
    } catch (error) {
        console.error('Error creating room booking:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
};

// Get Menu Items
exports.getMenu = async (req, res) => {
    try {
        const [menu] = await db.query(
            "SELECT * FROM MenuItem WHERE item_availability = 'Available' ORDER BY item_name"
        );
        res.json(menu);
    } catch (error) {
        console.error('Error fetching menu:', error);
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
};

// Place Food Order
exports.placeOrder = async (req, res) => {
    try {
        const { items, payment_method } = req.body;
        // items is array of { item_id, quantity }
        const guest_id = req.user.id;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Calculate total amount
            let total_amount = 0;
            for (const item of items) {
                const [menuItem] = await connection.query(
                    'SELECT item_price FROM MenuItem WHERE item_id = ?',
                    [item.item_id]
                );
                if (menuItem.length > 0) {
                    total_amount += menuItem[0].item_price * item.quantity;
                }
            }

            // 1. Create Payment
            const [paymentResult] = await connection.query(
                'INSERT INTO Payment (payment_amount, payment_method, service_type, payment_status) VALUES (?, ?, ?, ?)',
                [total_amount, payment_method || 'Cash', 'Food', 'Success']
            );
            const payment_id = paymentResult.insertId;

            // 2. Insert each OrderItem
            for (const item of items) {
                const [menuItem] = await connection.query(
                    'SELECT item_price FROM MenuItem WHERE item_id = ?',
                    [item.item_id]
                );
                if (menuItem.length === 0) continue;

                const itemTotal = menuItem[0].item_price * item.quantity;

                await connection.query(
                    'INSERT INTO OrderItem (guest_id, item_id, order_quantity, order_status, order_total_amount, payment_id) VALUES (?, ?, ?, ?, ?, ?)',
                    [guest_id, item.item_id, item.quantity, 'Ordered', itemTotal, payment_id]
                );
            }

            await connection.commit();
            res.status(201).json({
                message: 'Order placed successfully',
                total_amount: total_amount
            });

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'Failed to place order' });
    }
};

// Get Activities
exports.getActivities = async (req, res) => {
    try {
        const [activities] = await db.query(
            `SELECT ab.*, a.activity_name, a.activity_price_per_hour 
             FROM ActivityBooking ab 
             JOIN Activity a ON ab.activity_id = a.activity_id 
             WHERE ab.guest_id = ?`,
            [req.user.id]
        );
        res.json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
};

// Get Vehicles
exports.getVehicles = async (req, res) => {
    try {
        const [vehicles] = await db.query(
            `SELECT vb.*, v.vehicle_type, v.vehicle_number 
             FROM VehicleBooking vb 
             JOIN Vehicle v ON vb.vehicle_id = v.vehicle_id 
             WHERE vb.guest_id = ?`,
            [req.user.id]
        );
        res.json(vehicles);
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
};

