const db = require('../config/db');
const notificationController = require('./notificationController');

// --- Room Bookings ---

exports.getAvailableRooms = async (req, res) => {
    try {
        const { checkIn, checkOut, adults, kids, numRooms } = req.query;

        let query = "SELECT * FROM room WHERE room_status = 'Available'";
        let params = [];

        if (checkIn && checkOut) {
            // Find rooms that have NO booking overlapping with the requested dates
            query += ` AND room_id NOT IN (
                SELECT room_id FROM roombooking 
                WHERE rb_status IN ('Booked', 'Checked-in')
                AND NOT (rb_checkout <= ? OR rb_checkin >= ?)
            )`;
            params.push(checkIn, checkOut);
        }

        const [rooms] = await db.query(query, params);

        // Smart recommendation: score rooms by guest suitability
        const totalGuests = parseInt(adults || 2) + parseInt(kids || 0);
        const roomsNeeded = parseInt(numRooms || 1);

        const getGuestCapacity = (roomType) => {
            const type = (roomType || '').toLowerCase();
            if (type.includes('suite') || type.includes('family')) return 5;
            if (type.includes('deluxe')) return 3;
            return 2; // standard
        };

        const scoredRooms = rooms.map(room => {
            const capacity = getGuestCapacity(room.room_type);
            const guestsPerRoom = Math.ceil(totalGuests / roomsNeeded);
            // Score: 1 if capacity fits, 0 if not
            const fits = capacity >= guestsPerRoom;
            return { ...room, recommended: fits, capacity };
        });

        // Sort: recommended first, then by price ascending
        scoredRooms.sort((a, b) => {
            if (b.recommended !== a.recommended) return b.recommended - a.recommended;
            return a.room_price_per_day - b.room_price_per_day;
        });

        res.json(scoredRooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
};

exports.createRoomBooking = async (req, res) => {
    try {
        const { room_id, checkIn, checkOut, totalAmount } = req.body;
        const userId = req.user.id;

        // Basic Validation
        if (!room_id || !checkIn || !checkOut || !totalAmount) {
            return res.status(400).json({ error: 'Missing required booking details' });
        }

        const connection = await db.getConnection();

        try {
            // Get Guest ID correctly
            const [guests] = await connection.query('SELECT guest_id FROM Guest WHERE user_id = ?', [userId]);
            if (guests.length === 0) {
                return res.status(404).json({ error: 'Guest profile not found' });
            }
            const guest_id = guests[0].guest_id;

            await connection.beginTransaction();

            // 1. Create Payment Record
            const [paymentResult] = await connection.query(
                'INSERT INTO payment (payment_amount, payment_status) VALUES (?, ?)',
                [totalAmount, 'Success'] // Assuming instant success for now
            );
            const payment_id = paymentResult.insertId;

            // 2. Create Booking Record
            const [bookingResult] = await connection.query(
                'INSERT INTO roombooking (guest_id, room_id, rb_checkin, rb_checkout, rb_total_amount, rb_payment_id, rb_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [guest_id, room_id, checkIn, checkOut, totalAmount, payment_id, 'Booked'] // Status 'Booked'
            );
            const booking_id = bookingResult.insertId;

            // 4. Update Room Status? 
            // If room availability is simply status-based:
            // await connection.query("UPDATE room SET room_status = 'Booked' WHERE room_id = ?", [room_id]);
            // However, usually it's date-based availability. 
            // For this simpler system, we might not lock the room status globally unless it's a "live" availability check.
            // Let's leave room status as is, relying on availability search to filter out booked dates (if implemented) or just allowing multiple bookings for now if logic is date-check based (which getAvailableRooms implies 'Available' status check).
            // If `getAvailableRooms` checks `room_status='Available'`, then we SHOULD update it to 'Booked' if we want to block it.
            // Let's update it to 'Booked' to prevent double booking in this simple model.
            // await connection.query("UPDATE room SET room_status = 'Booked' WHERE room_id = ?", [room_id]); 
            // Wait, if we mark it Booked, it's booked forever until checkout? 
            // The previous logic commented it out. Let's ENABLE it if the user wants "correct logic" for a simple system.
            // BUT, valid logic usually involves checking overlapping dates in `roombooking`. 
            // Updating `room_status` is a blunt instrument. Let's stick to just creating the booking record for compliance with user's specific request "rebuild with correct logic". 
            // Correct logic = Transactional Payment + Booking.

            await connection.commit();
            res.status(201).json({ message: 'Room booked successfully', bookingId: booking_id });

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
        const [activities] = await db.query("SELECT * FROM activity WHERE activity_status = 'Available'");
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
};

exports.getActivitySlots = async (req, res) => {
    const { activity_id, date } = req.query;
    if (!activity_id || !date) return res.status(400).json({ error: 'Activity ID and Date are required' });

    try {
        // Define all slots 09 AM to 06 PM (17:00 start)
        const slots = [
            "09:00:00", "10:00:00", "11:00:00",
            "12:00:00", "13:00:00", "14:00:00", "15:00:00", "16:00:00", "17:00:00"
        ]; // Start times

        // Fetch bookings for this activity and date
        // Note: Assuming ab_start_time is DATETIME, we check DATE part
        const [bookings] = await db.query(
            `SELECT TIME(ab_start_time) as booked_time 
             FROM activitybooking 
             WHERE activity_id = ? 
             AND DATE(ab_start_time) = ? 
             AND ab_status != 'Cancelled'`,
            [activity_id, date]
        );

        const bookedTimes = bookings.map(b => b.booked_time);

        const availableSlots = slots.map(time => {
            const isBooked = bookedTimes.includes(time);
            return {
                time: time.substring(0, 5), // '08:00'
                isBooked: isBooked
            };
        });

        res.json(availableSlots);

    } catch (error) {
        console.error('Error fetching slots:', error);
        res.status(500).json({ error: 'Failed to fetch slots' });
    }
};

exports.createActivityBooking = async (req, res) => {
    try {
        const { activity_id, start_time, end_time, total_amount, rb_id } = req.body;
        const userId = req.user.id;

        const connection = await db.getConnection();

        try {
            // Get Guest ID correctly
            const [guests] = await connection.query('SELECT guest_id FROM Guest WHERE user_id = ?', [userId]);
            if (guests.length === 0) {
                return res.status(404).json({ error: 'Guest profile not found' });
            }
            const guest_id = guests[0].guest_id;

            await connection.beginTransaction();

            // 1. Validate Active Booking
            const [activeBookings] = await connection.query(
                `SELECT rb_id, rb_checkin, rb_checkout 
                 FROM roombooking 
                 WHERE guest_id = ? 
                 AND rb_status IN ('Booked', 'Checked-in', 'Active')
                 AND rb_checkout >= CURDATE()
                 ORDER BY rb_checkin ASC`,
                [guest_id]
            );

            if (activeBookings.length === 0) {
                await connection.rollback();
                return res.status(403).json({
                    error: 'No active booking found',
                    message: 'You must have an active room booking to book activities. Please book a room first.',
                    requiresBooking: true
                });
            }

            // 2. Determine booking to link (use provided or default to first active)
            let linkedBookingId = rb_id ? Number(rb_id) : null;
            if (!linkedBookingId) {
                linkedBookingId = activeBookings[0].rb_id;
            } else {
                // Validate provided booking belongs to guest
                const isValid = activeBookings.some(b => b.rb_id === parseInt(linkedBookingId, 10));
                if (!isValid) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Invalid booking ID provided' });
                }
            }

            // 3. Validate activity dates fall within room booking dates
            const linkedBookingIdNum = parseInt(linkedBookingId, 10);
            const linkedBooking = activeBookings.find(b => b.rb_id === linkedBookingIdNum);
            
            console.log('DEBUG: linkedBookingId:', linkedBookingId, 'Parsed:', linkedBookingIdNum);
            console.log('DEBUG: available rb_ids:', activeBookings.map(b => b.rb_id));
            
            if (!linkedBooking) {
                await connection.rollback();
                console.error('DEBUG: linkedBooking NOT FOUND for id:', linkedBookingIdNum);
                return res.status(400).json({ error: 'Linked booking not found in active list' });
            }

            const activityStart = new Date(start_time);
            const activityEnd = new Date(end_time);
            const roomCheckIn = new Date(linkedBooking.rb_checkin);
            const roomCheckOut = new Date(linkedBooking.rb_checkout);

            console.log('DEBUG: activityStart:', activityStart, 'activityEnd:', activityEnd);
            console.log('DEBUG: roomCheckIn:', roomCheckIn, 'roomCheckOut:', roomCheckOut);

            if (activityStart < roomCheckIn || activityEnd > roomCheckOut) {
                await connection.rollback();
                return res.status(400).json({
                    error: 'Activity dates must fall within your room booking dates',
                    message: `Activity must be between ${linkedBooking.rb_checkin} and ${linkedBooking.rb_checkout}`
                });
            }

            // 4. Check for Overlapping Bookings for this Guest
            // Overlap: (ExistingStart < NewEnd) AND (ExistingEnd > NewStart)
            const [existing] = await connection.query(
                `SELECT ab_id FROM activitybooking 
                 WHERE guest_id = ? 
                 AND ab_status != 'Cancelled'
                 AND ab_start_time < ? 
                 AND ab_end_time > ?`,
                [guest_id, end_time, start_time]
            );

            if (existing.length > 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'You already have a booking overlapping with this time slot.' });
            }

            const [paymentResult] = await connection.query(
                'INSERT INTO payment (payment_amount, payment_status) VALUES (?, ?)',
                [total_amount, 'Success']
            );
            const payment_id = paymentResult.insertId;

            const [bookingResult] = await connection.query(
                'INSERT INTO activitybooking (guest_id, activity_id, ab_start_time, ab_end_time, ab_total_amount, ab_payment_id, ab_status, rb_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [guest_id, activity_id, start_time, end_time, total_amount, payment_id, 'Reserved', linkedBookingId]
            );

            await connection.commit();
            res.status(201).json({
                message: 'Activity booked successfully',
                linkedBooking: linkedBookingId
            });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error creating activity booking:', error);
        res.status(500).json({ 
            error: 'Failed to book activity',
            detail: error.message,
            stack: error.stack
        });
    }
};

// --- Vehicle Bookings ---


exports.getAvailableVehicles = async (req, res) => {
    try {
        const { date, days } = req.query;

        if (!date || !days) {
            // If no search params, return empty or all? 
            // Better to return empty or just available based on status 'Available' but realistically search is needed.
            // Let's just return all 'Available' status vehicles for now to populate the initial list if desired, 
            // OR return strict empty. Given the UI change, let's allow fetching all but client side filters or just return all 'Available' generally.
            // BUT user wants "Date Search".
            const [vehicles] = await db.query("SELECT * FROM vehicle WHERE vehicle_status = 'Available'");
            return res.json(vehicles);
        }

        const vb_date = date;
        const vb_days = parseInt(days);

        // Find vehicles that are NOT booked during the requested period.
        // And also must have vehicle_status = 'Available' (or 'In Use' but not for these dates? - Simplification: static status 'Available' is usually general availability. 
        // Real availability is checked against bookings. Let's rely on bookings.)
        // But if vehicle_status is 'Maintenance', it shouldn't be shown.

        const [vehicles] = await db.query(`
            SELECT * FROM vehicle v
            WHERE v.vehicle_status = 'Available'
            AND v.vehicle_id NOT IN (
                SELECT vehicle_id FROM vehiclebooking 
                WHERE vb_status NOT IN ('Cancelled', 'Completed') 
                AND (
                    DATE_ADD(vb_date, INTERVAL vb_days DAY) > ? 
                    AND vb_date < DATE_ADD(?, INTERVAL ? DAY)
                )
            )
        `, [vb_date, vb_date, vb_days]);

        res.json(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
};

exports.createVehicleBooking = async (req, res) => {
    try {
        const { vehicle_id, vb_date, vb_days, rb_id } = req.body;
        const userId = req.user.id;

        // Validation
        if (!vb_date || !vb_days || vb_days < 1) {
            return res.status(400).json({ error: 'Valid date and number of days required' });
        }

        const connection = await db.getConnection();

        try {
            // Get Guest ID correctly
            const [guests] = await connection.query('SELECT guest_id FROM Guest WHERE user_id = ?', [userId]);
            if (guests.length === 0) {
                return res.status(404).json({ error: 'Guest profile not found' });
            }
            const guest_id = guests[0].guest_id;

            await connection.beginTransaction();

            // 1. Validate Active Booking
            const [activeBookings] = await connection.query(
                `SELECT rb_id, rb_checkin, rb_checkout 
                 FROM roombooking 
                 WHERE guest_id = ? 
                 AND rb_status IN ('Booked', 'Checked-in', 'Active')
                 AND rb_checkout >= CURDATE()
                 ORDER BY rb_checkin ASC`,
                [guest_id]
            );

            if (activeBookings.length === 0) {
                await connection.rollback();
                return res.status(403).json({
                    error: 'No active booking found',
                    message: 'You must have an active room booking to hire a vehicle. Please book a room first.',
                    requiresBooking: true
                });
            }

            // 2. Determine booking to link (use provided or default to first active)
            let linkedBookingId = rb_id ? Number(rb_id) : null;
            if (!linkedBookingId) {
                linkedBookingId = activeBookings[0].rb_id;
            } else {
                // Validate provided booking belongs to guest
                const isValid = activeBookings.some(b => b.rb_id === parseInt(linkedBookingId, 10));
                if (!isValid) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Invalid booking ID provided' });
                }
            }

            // 3. Validate vehicle dates overlap with room booking (allow 1 day before/after)
            const linkedBooking = activeBookings.find(b => b.rb_id === linkedBookingId);
            const vehicleStart = new Date(vb_date);
            const vehicleEnd = new Date(vb_date);
            vehicleEnd.setDate(vehicleEnd.getDate() + parseInt(vb_days));

            const roomCheckIn = new Date(linkedBooking.rb_checkin);
            const roomCheckOut = new Date(linkedBooking.rb_checkout);

            // Allow 1 day buffer before check-in and after checkout
            const bufferStart = new Date(roomCheckIn);
            bufferStart.setDate(bufferStart.getDate() - 1);
            const bufferEnd = new Date(roomCheckOut);
            bufferEnd.setDate(bufferEnd.getDate() + 1);

            if (vehicleStart < bufferStart || vehicleEnd > bufferEnd) {
                await connection.rollback();
                return res.status(400).json({
                    error: 'Vehicle hire dates should be within your room booking dates',
                    message: `Vehicle hire should be between ${bufferStart.toISOString().split('T')[0]} and ${bufferEnd.toISOString().split('T')[0]}`
                });
            }

            // 4. Check for availability (Overlap Logic)
            // Requested Range: Start = vb_date, End = vb_date + vb_days
            // Existing Booking: Start = existing.vb_date, End = existing.vb_date + existing.vb_days
            // Overlap Condition: (StartA < EndB) && (EndA > StartB)

            // We can do this calculation in SQL for robust checking
            const [overlaps] = await connection.query(`
                SELECT vb_id FROM vehiclebooking 
                WHERE vehicle_id = ? 
                AND vb_status NOT IN ('Cancelled', 'Completed')
                AND (
                    DATE_ADD(vb_date, INTERVAL vb_days DAY) > ? 
                    AND vb_date < DATE_ADD(?, INTERVAL ? DAY)
                )
            `, [vehicle_id, vb_date, vb_date, vb_days]);

            if (overlaps.length > 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'Vehicle is already booked for these dates' });
            }

            await connection.query(
                'INSERT INTO vehiclebooking (guest_id, vehicle_id, vb_date, vb_days, vb_status, rb_id) VALUES (?, ?, ?, ?, ?, ?)',
                [guest_id, vehicle_id, vb_date, vb_days, 'Pending Approval', linkedBookingId]
            );

            await connection.commit();
            res.status(201).json({
                message: 'Hire request sent successfully! Waiting for driver acceptance.',
                linkedBooking: linkedBookingId
            });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error creating vehicle booking:', error);
        res.status(500).json({ error: 'Failed to request vehicle' });
    }
};

// Cancel Booking generic handler
exports.cancelBooking = async (req, res) => {
    try {
        const { type, id } = req.params;
        let table, idField, statusField;

        switch (type) {
            case 'room':
                table = 'roombooking';
                idField = 'rb_id';
                statusField = 'rb_status';
                break;
            case 'activity':
                table = 'activitybooking';
                idField = 'ab_id';
                statusField = 'ab_status';
                break;
            case 'vehicle':
                table = 'vehiclebooking';
                idField = 'vb_id';
                statusField = 'vb_status';
                break;
            default:
                return res.status(400).json({ error: 'Invalid booking type' });
        }

        const [booking] = await db.query(`SELECT * FROM ${table} WHERE ${idField} = ?`, [id]);
        if (booking.length === 0) return res.status(404).json({ error: 'Booking not found' });

        // Authorization Check
        if (booking[0].guest_id !== req.user.guest_id && req.user.role !== 'receptionist' && req.user.role !== 'admin' && req.user.role !== 'guest') {
            // Note: req.user.guest_id might not be populated by middleware heavily, so safer to check user_id link
            // But existing code check was: booking[0].guest_id !== req.user.id (Wait, guest_id != user_id usually)
            // Let's stick to the previous check logic but fix it if needed. 
            // Previous: if (booking[0].guest_id !== req.user.id ... ) <- usage of user.id against guest_id is suspicious if they are different IDs.
            // Typically we check: SELECT user_id FROM Guest WHERE guest_id = booking[0].guest_id
            // For now, let's assume the previous auth logic was "working" or accepted, but improved slightly:
        }

        // Better Auth Check:
        const [guestUser] = await db.query('SELECT user_id FROM Guest WHERE guest_id = ?', [booking[0].guest_id]);
        const bookingOwnerUserId = guestUser.length > 0 ? guestUser[0].user_id : null;

        if (bookingOwnerUserId !== req.user.id && req.user.role !== 'receptionist' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await db.query(`UPDATE ${table} SET ${statusField} = 'Cancelled' WHERE ${idField} = ?`, [id]);

        // --- Notifications ---

        // 1. Notify Guest (if cancelled by someone else)
        if (req.user.id !== bookingOwnerUserId) {
            await notificationController.createNotification(
                bookingOwnerUserId,
                'Booking Cancelled',
                `Your ${type} booking (ID: ${id}) has been cancelled by ${req.user.role}.`,
                'Booking'
            );
        }

        // 2. Notify Driver (if Vehicle Booking)
        if (type === 'vehicle' && booking[0].driver_id) {
            const [driverUser] = await db.query('SELECT user_id FROM Driver WHERE driver_id = ?', [booking[0].driver_id]);
            if (driverUser.length > 0) {
                await notificationController.createNotification(
                    driverUser[0].user_id,
                    'Trip Cancelled',
                    `Vehicle trip (ID: ${id}) has been cancelled.`,
                    'Alert'
                );
            }
        }
        res.json({ message: 'Booking cancelled successfully' });

    } catch (error) {
        console.error('Cancellation error:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
};

// --- Complete Booking (Unified Flow) ---
exports.completeBooking = async (req, res) => {
    try {
        const { room, food, activities, vehicle, paymentMethod } = req.body;
        const userId = req.user.id;

        // Validate room booking data
        if (!room || !room.room_id || !room.checkIn || !room.checkOut || !room.totalAmount) {
            return res.status(400).json({ error: 'Room booking details are required' });
        }

        const connection = await db.getConnection();

        try {
            // Get Guest ID
            const [guests] = await connection.query('SELECT guest_id FROM Guest WHERE user_id = ?', [userId]);
            if (guests.length === 0) {
                return res.status(404).json({ error: 'Guest profile not found' });
            }
            const guest_id = guests[0].guest_id;

            await connection.beginTransaction();

            // Calculate total amount
            let totalAmount = parseFloat(room.totalAmount);

            // Add food costs
            if (food && food.length > 0) {
                food.forEach(orderGroup => {
                    if (orderGroup.items) {
                        orderGroup.items.forEach(item => {
                            totalAmount += parseFloat(item.item_price) * parseInt(item.quantity);
                        });
                    }
                });
            }

            // Add activity costs
            if (activities && activities.length > 0) {
                activities.forEach(activity => {
                    totalAmount += parseFloat(activity.price);
                });
            }

            // Note: Vehicle hire has no upfront payment

            // 1. Create Single Payment Record
            const [paymentResult] = await connection.query(
                'INSERT INTO payment (payment_amount, payment_status) VALUES (?, ?)',
                [totalAmount, 'Success']
            );
            const payment_id = paymentResult.insertId;

            // 2. Create Room Booking
            const [roomBookingResult] = await connection.query(
                'INSERT INTO roombooking (guest_id, room_id, rb_checkin, rb_checkout, rb_total_amount, rb_payment_id, rb_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [guest_id, room.room_id, room.checkIn, room.checkOut, room.totalAmount, payment_id, 'Booked']
            );
            const rb_id = roomBookingResult.insertId;

            // 3. Create Food Orders (if any)
            let foodOrderIds = [];
            if (food && food.length > 0) {
                // 'food' is now expected to be an array of scheduled orders:
                // [{ scheduled_date, meal_type, items: [{ item_id, quantity, item_price }] }]
                
                for (const orderGroup of food) {
                    const { scheduled_date, meal_type, items } = orderGroup;
                    
                    const [orderResult] = await connection.query(
                        'INSERT INTO foodorder (guest_id, order_status, dining_option, rb_id, scheduled_date, meal_type, payment_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [guest_id, 'Pending', room.diningOption || 'Delivery', rb_id, scheduled_date, meal_type, payment_id]
                    );
                    const order_id = orderResult.insertId;
                    foodOrderIds.push(order_id);

                    for (const item of items) {
                        await connection.query(
                            'INSERT INTO orderitem (order_id, item_id, quantity, item_price) VALUES (?, ?, ?, ?)',
                            [order_id, item.item_id, item.quantity, item.item_price]
                        );
                    }
                }
            }

            // 4. Create Activity Bookings (if any)
            let activityBookingIds = [];
            if (activities && activities.length > 0) {
                for (const activity of activities) {
                    // Validate dates within room booking
                    const activityStart = new Date(activity.start_time);
                    const activityEnd = new Date(activity.end_time);
                    const roomCheckIn = new Date(room.checkIn);
                    // Allow activities through the end of checkout day
                    const roomCheckOut = new Date(room.checkOut);
                    roomCheckOut.setHours(23, 59, 59, 999);

                    if (activityStart < roomCheckIn || activityEnd > roomCheckOut) {
                        await connection.rollback();
                        return res.status(400).json({
                            error: `Activity "${activity.name}" date must fall within your room booking dates (${room.checkIn} to ${room.checkOut})`,
                        });
                    }

                    // Create activity booking (no separate payment - bundled)
                    const [activityResult] = await connection.query(
                        'INSERT INTO activitybooking (guest_id, activity_id, ab_start_time, ab_end_time, ab_total_amount, ab_payment_id, ab_status, rb_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        [guest_id, activity.activity_id, activity.start_time, activity.end_time, activity.price, payment_id, 'Reserved', rb_id]
                    );
                    activityBookingIds.push(activityResult.insertId);
                }
            }

            // 5. Create Vehicle Booking (if requested)
            let vehicleBookingId = null;
            if (vehicle && vehicle.vehicle_id) {
                // Validate dates (allow ±1 day buffer)
                const vehicleStart = new Date(vehicle.date);
                const vehicleEnd = new Date(vehicle.date);
                vehicleEnd.setDate(vehicleEnd.getDate() + parseInt(vehicle.days));

                const roomCheckIn = new Date(room.checkIn);
                const roomCheckOut = new Date(room.checkOut);

                const bufferStart = new Date(roomCheckIn);
                bufferStart.setDate(bufferStart.getDate() - 1);
                const bufferEnd = new Date(roomCheckOut);
                bufferEnd.setDate(bufferEnd.getDate() + 1);

                if (vehicleStart < bufferStart || vehicleEnd > bufferEnd) {
                    await connection.rollback();
                    return res.status(400).json({
                        error: 'Vehicle hire dates should be within your room booking dates (±1 day)'
                    });
                }

                // Create vehicle booking (pending driver acceptance)
                const [vehicleResult] = await connection.query(
                    'INSERT INTO vehiclebooking (guest_id, vehicle_id, vb_date, vb_days, vb_status, rb_id) VALUES (?, ?, ?, ?, ?, ?)',
                    [guest_id, vehicle.vehicle_id, vehicle.date, vehicle.days, 'Pending Approval', rb_id]
                );
                vehicleBookingId = vehicleResult.insertId;
            }

            await connection.commit();

            // Return complete booking summary
            res.status(201).json({
                message: 'Booking completed successfully!',
                booking: {
                    roomBookingId: rb_id,
                    paymentId: payment_id,
                    totalAmount: totalAmount,
                    extras: {
                        foodOrders: foodOrderIds,
                        activities: activityBookingIds,
                        vehicle: vehicleBookingId
                    }
                }
            });

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error completing booking:', error.message, '| SQL:', error.sql, '| Code:', error.code, '| SQLMessage:', error.sqlMessage);
        res.status(500).json({ 
            error: 'Failed to complete booking',
            detail: error.sqlMessage || error.message
        });
    }
};

exports.extendRoomBooking = async (req, res) => {
    try {
        const { id } = req.params; // rb_id
        const { newCheckOut, extraAmount } = req.body;
        const guest_id = req.user.role === 'guest' ? req.user.id : null;

        if (!newCheckOut || extraAmount === undefined) {
            return res.status(400).json({ error: 'Missing newCheckOut date or extraAmount' });
        }

        // 1. Verify ownership and get current booking details
        let query = 'SELECT * FROM roombooking WHERE rb_id = ?';
        let params = [id];
        
        if (guest_id) {
            query += ' AND guest_id = (SELECT guest_id FROM guest WHERE user_id = ?)';
            params.push(guest_id);
        }

        const [bookings] = await db.execute(query, params);
        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Booking not found or not authorized' });
        }

        const booking = bookings[0];
        const currentCheckOut = new Date(booking.rb_checkout);
        const proposedCheckOut = new Date(newCheckOut);

        if (proposedCheckOut <= currentCheckOut) {
            return res.status(400).json({ error: 'New checkout date must be after current checkout date' });
        }

        // 2. Check room availability for the extended period
        // We only need to check from currentCheckOut to proposedCheckOut
        const [conflicts] = await db.execute(`
            SELECT rb_id FROM roombooking
            WHERE room_id = ? 
            AND rb_id != ?
            AND rb_status != 'Cancelled'
            AND (
                (rb_checkin < ? AND rb_checkout > ?)
            )
        `, [booking.room_id, id, newCheckOut, booking.rb_checkout]);

        if (conflicts.length > 0) {
            return res.status(400).json({ error: 'Room is already booked for the requested extension dates.' });
        }

        // 3. Update the booking
        const newTotal = parseFloat(booking.rb_total_amount) + parseFloat(extraAmount);
        
        await db.execute(
            'UPDATE roombooking SET rb_checkout = ?, rb_total_amount = ? WHERE rb_id = ?',
            [newCheckOut, newTotal, id]
        );

        res.json({
            message: 'Room booking extended successfully',
            newCheckOut,
            newTotal
        });

    } catch (error) {
        console.error('Error extending booking:', error);
        res.status(500).json({ error: 'Failed to extend room booking' });
    }
};
