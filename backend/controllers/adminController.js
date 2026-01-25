const db = require('../config/db');
const crypto = require('crypto');
const emailService = require('../utils/emailService');

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        // Use Promise.all to run independent queries in parallel
        const [
            [roomRes],
            [userCounts],
            [revenueRes],
            [activeVehiclesRes],
            [bookingsRes],
            [revenueByType]
        ] = await Promise.all([
            db.query("SELECT COUNT(*) as total FROM room"), // 0: Rooms
            db.query("SELECT role, COUNT(*) as count FROM Users GROUP BY role"), // 1: Users
            db.query("SELECT SUM(payment_amount) as total FROM payment WHERE payment_status = 'Success'"), // 2: Revenue
            db.query("SELECT COUNT(*) as active FROM vehicle WHERE vehicle_status = 'Booked'"), // 3: Active Vehicles
            // 4: Total Bookings (Sum of all tables)
            Promise.all([
                db.query("SELECT COUNT(*) as c FROM RoomBooking"),
                db.query("SELECT COUNT(*) as c FROM ActivityBooking"),
                db.query("SELECT COUNT(*) as c FROM VehicleBooking")
            ]),
            // 5: Revenue by Type
            db.query(`
                SELECT booking_type, COUNT(*) as count, SUM(payment_amount) as total 
                FROM payment 
                WHERE payment_status = 'Success' 
                GROUP BY booking_type
            `)
        ]);

        // Process Results
        const totalRooms = roomRes[0].total;

        const guests = userCounts.find(r => r.role === 'guest')?.count || 0;
        const staff = userCounts.filter(r => ['receptionist', 'kitchen', 'driver'].includes(r.role))
            .reduce((acc, curr) => acc + curr.count, 0);

        const totalRevenue = revenueRes[0].total || 0;
        const activeVehicles = activeVehiclesRes[0].active;

        const totalBookings = bookingsRes[0][0][0].c + bookingsRes[1][0][0].c + bookingsRes[2][0][0].c;

        res.json({
            success: true,
            counts: {
                guests,
                staff,
                rooms: totalRooms,
                activeVehicles,
                bookings: totalBookings
            },
            financials: {
                totalRevenue,
                revenueByType: revenueByType[0] // db.query returns [rows, fields]
            }
        });

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
};

// --- Staff Management ---

// --- Staff Management ---

exports.getAllStaff = async (req, res) => {
    try {
        const [staff] = await db.query(
            "SELECT role, user_id as id, name, email, phone, account_status, created_at FROM Users WHERE role IN ('receptionist', 'kitchen', 'driver') ORDER BY created_at DESC"
        );
        res.json(staff);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
};

exports.getAllGuests = async (req, res) => {
    try {
        const [guests] = await db.query(
            "SELECT role, user_id as id, name, email, phone, account_status, created_at FROM Users WHERE role = 'guest' ORDER BY created_at DESC"
        );
        res.json(guests);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch guests' });
    }
};

exports.inviteStaff = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { role, name, email, phone, address, vehicle_id } = req.body; // No password

        // 1. Check if user exists
        const [existing] = await connection.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Email already registered' });
        }

        // 2. Insert into Users (Inactive, No Password)
        const [userRes] = await connection.query(
            "INSERT INTO Users (name, email, phone, role, account_status) VALUES (?, ?, ?, ?, 'Inactive')",
            [name, email, phone, role]
        );
        const userId = userRes.insertId;

        // 3. Insert into Role Table
        if (role === 'receptionist') {
            await connection.query(
                "INSERT INTO Receptionist (user_id, receptionist_address) VALUES (?, ?)",
                [userId, address]
            );
        } else if (role === 'kitchen') {
            await connection.query(
                "INSERT INTO KitchenStaff (user_id, staff_address) VALUES (?, ?)",
                [userId, address]
            );
        } else if (role === 'driver') {
            await connection.query(
                "INSERT INTO Driver (user_id, vehicle_id) VALUES (?, ?)",
                [userId, vehicle_id]
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
        const { vehicle_type, vehicle_number, vehicle_price_per_day, vehicle_price_per_hour, vehicle_status } = req.body;
        await db.query('INSERT INTO vehicle (vehicle_type, vehicle_number, vehicle_price_per_day, vehicle_price_per_hour, vehicle_status) VALUES (?, ?, ?, ?, ?)', [vehicle_type, vehicle_number, vehicle_price_per_day, vehicle_price_per_hour, vehicle_status]);
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
            `SELECT r.*, u.name as admin_name 
             FROM report r 
             JOIN Users u ON r.user_id = u.user_id 
             ORDER BY generated_date DESC`
        );
        res.json(reports);
    } catch (error) { res.status(500).json({ error: 'Error fetching reports' }); }
}
