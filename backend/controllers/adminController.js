const db = require('../config/db');
const crypto = require('crypto');
const emailService = require('../utils/emailService');

// Dashboard Stats
// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const connection = await db.getConnection();

        try {
            // 1. Basic Counts
            const [[{ total_rooms }]] = await connection.query("SELECT COUNT(*) as total_rooms FROM room");
            const [[{ active_vehicles }]] = await connection.query("SELECT COUNT(*) as active_vehicles FROM vehicle WHERE vehicle_status = 'Booked'"); // 'Active' implies booked/in-use

            // 2. User Stats
            const [userRows] = await connection.query("SELECT role, COUNT(*) as count FROM Users GROUP BY role");
            const guests = userRows.find(r => r.role === 'guest')?.count || 0;
            const staff = userRows
                .filter(r => ['receptionist', 'chef', 'driver'].includes(r.role))
                .reduce((sum, r) => sum + r.count, 0);

            // 3. Booking Counts
            const [[{ rb_count }]] = await connection.query("SELECT COUNT(*) as rb_count FROM RoomBooking");
            const [[{ ab_count }]] = await connection.query("SELECT COUNT(*) as ab_count FROM ActivityBooking");
            const [[{ vb_count }]] = await connection.query("SELECT COUNT(*) as vb_count FROM VehicleBooking");
            const total_bookings = rb_count + ab_count + vb_count;

            // 4. Financials (Revenue by Service Type) using 3NF Joins

            // Room Revenue
            const [[roomRev]] = await connection.query(`
                SELECT COUNT(p.payment_id) as txn_count, COALESCE(SUM(p.payment_amount), 0) as total_amount
                FROM payment p
                JOIN roombooking rb ON p.payment_id = rb.rb_payment_id
                WHERE p.payment_status = 'Success'
            `);

            // Activity Revenue
            const [[activityRev]] = await connection.query(`
                SELECT COUNT(p.payment_id) as txn_count, COALESCE(SUM(p.payment_amount), 0) as total_amount
                FROM payment p
                JOIN activitybooking ab ON p.payment_id = ab.ab_payment_id
                WHERE p.payment_status = 'Success'
            `);

            // Vehicle Revenue
            const [[vehicleRev]] = await connection.query(`
                SELECT COUNT(p.payment_id) as txn_count, COALESCE(SUM(p.payment_amount), 0) as total_amount
                FROM payment p
                JOIN vehiclebooking vb ON p.payment_id = vb.vb_payment_id
                WHERE p.payment_status = 'Success'
            `);

            // Food Revenue
            const [[foodRev]] = await connection.query(`
                SELECT COUNT(p.payment_id) as txn_count, COALESCE(SUM(p.payment_amount), 0) as total_amount
                FROM payment p
                JOIN foodorder fo ON p.payment_id = fo.payment_id
                WHERE p.payment_status = 'Success'
            `);

            const total_revenue =
                parseFloat(roomRev.total_amount) +
                parseFloat(activityRev.total_amount) +
                parseFloat(vehicleRev.total_amount) +
                parseFloat(foodRev.total_amount);

            // 5. Construct Response
            const responseData = {
                success: true,
                summary: {
                    guests,
                    staff,
                    rooms: total_rooms,
                    active_vehicles,
                    bookings: total_bookings
                },
                revenue: {
                    total: total_revenue,
                    breakdown: [
                        { type: 'Room Booking', count: roomRev.txn_count, amount: parseFloat(roomRev.total_amount) },
                        { type: 'Activity', count: activityRev.txn_count, amount: parseFloat(activityRev.total_amount) },
                        { type: 'Vehicle Hire', count: vehicleRev.txn_count, amount: parseFloat(vehicleRev.total_amount) },
                        { type: 'Dining', count: foodRev.txn_count, amount: parseFloat(foodRev.total_amount) }
                    ]
                }
            };

            res.json(responseData);

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
};

// --- Staff Management ---

// --- Staff Management ---

exports.getAllStaff = async (req, res) => {
    try {
        const [staff] = await db.query(`
            SELECT u.role, u.user_id as id, CONCAT(u.first_name, ' ', u.last_name) as name,
                   u.email, u.account_status, u.created_at,
                   r.receptionist_phone as phone,
                   CONCAT_WS(', ', NULLIF(r.receptionist_no, ''), NULLIF(r.receptionist_street, ''), NULLIF(r.receptionist_city, ''), NULLIF(r.receptionist_district, '')) as address
            FROM Users u
            JOIN receptionist r ON u.user_id = r.user_id
            WHERE u.role = 'receptionist'

            UNION ALL

            SELECT u.role, u.user_id as id, CONCAT(u.first_name, ' ', u.last_name) as name,
                   u.email, u.account_status, u.created_at,
                   c.chef_phone as phone,
                   CONCAT_WS(', ', NULLIF(c.chef_no, ''), NULLIF(c.chef_street, ''), NULLIF(c.chef_city, ''), NULLIF(c.chef_district, '')) as address
            FROM Users u
            JOIN chef c ON u.user_id = c.user_id
            WHERE u.role = 'chef'

            UNION ALL

            SELECT u.role, u.user_id as id, CONCAT(u.first_name, ' ', u.last_name) as name,
                   u.email, u.account_status, u.created_at,
                   d.driver_phone as phone,
                   CONCAT_WS(', ', NULLIF(d.driver_no, ''), NULLIF(d.driver_street, ''), NULLIF(d.driver_city, ''), NULLIF(d.driver_district, '')) as address
            FROM Users u
            JOIN driver d ON u.user_id = d.user_id
            WHERE u.role = 'driver'

            ORDER BY created_at DESC
        `);
        res.json(staff);
    } catch (error) {
        console.error('Failed to fetch staff:', error);
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
};

exports.getAllGuests = async (req, res) => {
    try {
        const [guests] = await db.query(`
            SELECT u.user_id as id, CONCAT(u.first_name, ' ', u.last_name) as name, u.email, u.account_status, u.created_at, 
                   g.guest_nic_passport as nic, g.nationality, g.guest_phone as phone 
            FROM Users u 
            JOIN Guest g ON u.user_id = g.user_id 
            WHERE u.role = 'guest'
        `);
        res.json(guests);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch guests' });
    }
};

exports.inviteStaff = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { role, name, email } = req.body;
        // Optional fields - default to null or empty if not provided
        const phone = req.body.phone || null;
        const address = req.body.address || null;
        const vehicle_id = req.body.vehicle_id || null;

        // 1. Check if user exists
        const [existing] = await connection.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Email already registered' });
        }

        // 2. Insert into Users (Inactive, No Password, Phone might be null)
        const nameParts = name.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        const [userRes] = await connection.query(
            "INSERT INTO Users (first_name, last_name, email, role, account_status) VALUES (?, ?, ?, ?, 'Inactive')",
            [firstName, lastName, email, role]
        );
        const userId = userRes.insertId;

        // 3. Insert into Role Table
        if (role === 'receptionist') {
            await connection.query(
                "INSERT INTO receptionist (user_id, receptionist_street, receptionist_phone) VALUES (?, ?, ?)",
                [userId, address, phone]
            );
        } else if (role === 'chef') {
            await connection.query(
                "INSERT INTO chef (user_id, chef_street, chef_phone) VALUES (?, ?, ?)",
                [userId, address, phone]
            );
        } else if (role === 'driver') {
            await connection.query(
                "INSERT INTO driver (user_id, driver_street, driver_phone) VALUES (?, ?, ?)",
                [userId, address, phone]
            );
        } else {
            await connection.rollback();
            return res.status(400).json({ error: 'Invalid role' });
        }

        // 4. Generate Activation Token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await connection.query(
            "INSERT INTO activation_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
            [userId, token, expiresAt]
        );

        // 5. Send Email
        const emailSent = await emailService.sendActivationEmail(email, token);

        if (!emailSent) {
            // Decision: Rollback or just warn? Rollback to accept consistency.
            await connection.rollback();
            return res.status(500).json({ error: 'Failed to send activation email' });
        }

        await connection.commit();
        res.status(201).json({ message: 'Staff invited successfully. Activation email sent.' });

    } catch (error) {
        await connection.rollback();
        console.error('Error inviting staff:', error);
        res.status(500).json({ error: 'Failed to invite staff' });
    } finally {
        connection.release();
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const { id } = req.params; // NOW this is user_id
        // Deleting from Users will cascade delete from Role tables due to FK setup
        await db.query('DELETE FROM Users WHERE user_id = ?', [id]);
        res.json({ message: 'Staff deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete staff' });
    }
};

exports.updateStaffStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Active' or 'Inactive'
        await db.query('UPDATE Users SET account_status = ? WHERE user_id = ?', [status, id]);
        res.json({ message: `Staff status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
};

exports.updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, nationality } = req.body;

        // Update basic User info
        const nameParts = name.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        await db.query('UPDATE Users SET first_name = ?, last_name = ?, email = ? WHERE user_id = ?', [firstName, lastName, email, id]);

        // Fetch User Role to know which table to update
        const [users] = await db.query('SELECT role FROM Users WHERE user_id = ?', [id]);

        if (users.length > 0) {
            const role = users[0].role;

            if (role === 'guest') {
                if (address !== undefined || nationality !== undefined) {
                    await db.query('UPDATE Guest SET guest_nic_passport = ?, nationality = ? WHERE user_id = ?', [address, nationality, id]);
                }
            } else if (role === 'driver') {
                if (address !== undefined) {
                    await db.query('UPDATE driver SET driver_street = ? WHERE user_id = ?', [address, id]);
                }
                if (phone !== undefined) {
                    await db.query('UPDATE driver SET driver_phone = ? WHERE user_id = ?', [phone, id]);
                }
            } else if (role === 'receptionist') {
                if (address !== undefined) {
                    await db.query('UPDATE receptionist SET receptionist_street = ? WHERE user_id = ?', [address, id]);
                }
                if (phone !== undefined) {
                    await db.query('UPDATE receptionist SET receptionist_phone = ? WHERE user_id = ?', [phone, id]);
                }
            } else if (role === 'chef') {
                if (address !== undefined) {
                    await db.query('UPDATE chef SET chef_street = ? WHERE user_id = ?', [address, id]);
                }
                if (phone !== undefined) {
                    await db.query('UPDATE chef SET chef_phone = ? WHERE user_id = ?', [phone, id]);
                }
            }
        }

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Update failed:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

// --- Resource Management (Rooms, Activities, Vehicles) ---

exports.addRoom = async (req, res) => {
    try {
        const { room_type, room_price_per_day, room_status } = req.body;
        await db.query('INSERT INTO room (room_type, room_price_per_day, room_status) VALUES (?, ?, ?)', [room_type, room_price_per_day, room_status || 'Available']);
        res.status(201).json({ message: 'Room added' });
    } catch (error) { res.status(500).json({ error: 'Error adding room' }); }
}

exports.updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { room_type, room_price_per_day, room_status } = req.body;
        await db.query('UPDATE room SET room_type = ?, room_price_per_day = ?, room_status = ? WHERE room_id = ?', [room_type, room_price_per_day, room_status, id]);
        res.json({ message: 'Room updated' });
    } catch (error) { res.status(500).json({ error: 'Error updating room' }); }
}

// Similar for Activity and Vehicle... skipping detailed impl for brevity unless requested, 
// but basic CRUD follows same pattern. I will add basic listeners.

exports.addActivity = async (req, res) => {
    try {
        const { activity_name, activity_price_per_hour, activity_status } = req.body;
        await db.query('INSERT INTO activity (activity_name, activity_price_per_hour, activity_status) VALUES (?, ?, ?)', [activity_name, activity_price_per_hour, activity_status]);
        res.status(201).json({ message: 'Activity added' });
    } catch (error) { res.status(500).json({ error: 'Error adding activity' }); }
}

exports.addVehicle = async (req, res) => {
    try {
        const { vehicle_type, vehicle_number, vehicle_price_per_day, vehicle_status } = req.body;
        await db.query('INSERT INTO vehicle (vehicle_type, vehicle_number, vehicle_price_per_day, vehicle_status) VALUES (?, ?, ?, ?)', [vehicle_type, vehicle_number, vehicle_price_per_day, vehicle_status]);
        res.status(201).json({ message: 'Vehicle added' });
    } catch (error) { res.status(500).json({ error: 'Error adding vehicle' }); }
}

// --- Reports ---

exports.generateReport = async (req, res) => {
    try {
        const { report_type, start_date, end_date, info } = req.body;
        // req.user.id IS the user_id for admins now
        await db.query(
            'INSERT INTO report (user_id, report_type, report_information, start_period, end_period) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, report_type, info, start_date, end_date]
        );
        res.status(201).json({ message: 'Report generated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error generating report' });
    }
}

exports.getAllReports = async (req, res) => {
    try {
        const [reports] = await db.query(
            `SELECT r.*, CONCAT(u.first_name, ' ', u.last_name) as admin_name 
             FROM report r 
             JOIN Users u ON r.user_id = u.user_id 
             ORDER BY generated_date DESC`
        );
        res.json(reports);
    } catch (error) { res.status(500).json({ error: 'Error fetching reports' }); }
}

// --- Menu Item Management ---

exports.getAllMenuItems = async (req, res) => {
    try {
        const [items] = await db.query('SELECT * FROM menuitem ORDER BY item_id');
        res.json(items);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ error: 'Failed to fetch menu items' });
    }
};

exports.updateMenuItemStatus = async (req, res) => {
    try {
        const { id } = req.params; // item_id
        const { status } = req.body; // 'Available' or 'Unavailable'

        await db.query('UPDATE menuitem SET item_availability = ? WHERE item_id = ?', [status, id]);

        res.json({ message: 'Menu item status updated successfully' });
    } catch (error) {
        console.error('Error updating menu item status:', error);
        res.status(500).json({ error: 'Failed to update menu item status' });
    }
};
