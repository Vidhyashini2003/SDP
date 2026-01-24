const db = require('../config/db');
// const bcrypt = require('bcrypt'); // Disabled for development - using plain text passwords

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const [rooms] = await db.query("SELECT COUNT(*) as count FROM Room");
        const [staff] = await db.query("SELECT (SELECT COUNT(*) FROM Receptionist) + (SELECT COUNT(*) FROM KitchenStaff) + (SELECT COUNT(*) FROM Driver) as count");
        const [revenue] = await db.query("SELECT SUM(payment_amount) as total FROM Payment WHERE payment_status = 'Success'");

        res.json({
            totalRooms: rooms[0].count,
            totalStaff: staff[0].count,
            totalRevenue: revenue[0].total || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
};

// --- Staff Management ---

exports.getAllStaff = async (req, res) => {
    try {
        const [receptionists] = await db.query("SELECT 'receptionist' as role, receptionist_id as id, receptionist_name as name, receptionist_email as email, receptionist_phone as phone FROM Receptionist");
        const [kitchen] = await db.query("SELECT 'kitchen' as role, staff_id as id, staff_name as name, staff_email as email, staff_phone as phone FROM KitchenStaff");
        const [drivers] = await db.query("SELECT 'driver' as role, driver_id as id, driver_name as name, driver_email as email, driver_phone as phone FROM Driver");

        res.json([...receptionists, ...kitchen, ...drivers]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
};

exports.addStaff = async (req, res) => {
    try {
        const { role, name, email, password } = req.body;
        // Plain text password (no hashing for development)

        // Handle lowercase role names from frontend
        if (role === 'receptionist') {
            await db.query(
                "INSERT INTO Receptionist (receptionist_name, receptionist_email, receptionist_password) VALUES (?, ?, ?)",
                [name, email, password]
            );
        } else if (role === 'kitchen') {
            await db.query(
                "INSERT INTO KitchenStaff (staff_name, staff_email, staff_password) VALUES (?, ?, ?)",
                [name, email, password]
            );
        } else if (role === 'driver') {
            await db.query(
                "INSERT INTO Driver (driver_name, driver_email, driver_password) VALUES (?, ?, ?)",
                [name, email, password]
            );
        } else {
            return res.status(400).json({ error: 'Invalid role' });
        }

        res.status(201).json({ message: 'Staff added successfully' });
    } catch (error) {
        console.error('Error adding staff:', error);
        res.status(500).json({ error: 'Failed to add staff' });
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const { type, id } = req.params; // type: receptionist, kitchen, driver
        // Careful with SQL injection on table name if using directly. Use whitelist.
        let table, idField;
        if (type === 'receptionist') { table = 'Receptionist'; idField = 'receptionist_id'; }
        else if (type === 'kitchen') { table = 'KitchenStaff'; idField = 'staff_id'; }
        else if (type === 'driver') { table = 'Driver'; idField = 'driver_id'; }
        else return res.status(400).json({ error: 'Invalid type' });

        await db.query(`DELETE FROM ${table} WHERE ${idField} = ?`, [id]);
        res.json({ message: 'Staff deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete staff' });
    }
}

// --- Resource Management (Rooms, Activities, Vehicles) ---

exports.addRoom = async (req, res) => {
    try {
        const { room_type, room_price_per_day, room_status } = req.body;
        await db.query('INSERT INTO Room (room_type, room_price_per_day, room_status) VALUES (?, ?, ?)', [room_type, room_price_per_day, room_status || 'Available']);
        res.status(201).json({ message: 'Room added' });
    } catch (error) { res.status(500).json({ error: 'Error adding room' }); }
}

exports.updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { room_type, room_price_per_day, room_status } = req.body;
        await db.query('UPDATE Room SET room_type = ?, room_price_per_day = ?, room_status = ? WHERE room_id = ?', [room_type, room_price_per_day, room_status, id]);
        res.json({ message: 'Room updated' });
    } catch (error) { res.status(500).json({ error: 'Error updating room' }); }
}

// Similar for Activity and Vehicle... skipping detailed impl for brevity unless requested, 
// but basic CRUD follows same pattern. I will add basic listeners.

exports.addActivity = async (req, res) => {
    try {
        const { activity_name, activity_price_per_hour, activity_status } = req.body;
        await db.query('INSERT INTO Activity (activity_name, activity_price_per_hour, activity_status) VALUES (?, ?, ?)', [activity_name, activity_price_per_hour, activity_status]);
        res.status(201).json({ message: 'Activity added' });
    } catch (error) { res.status(500).json({ error: 'Error adding activity' }); }
}

exports.addVehicle = async (req, res) => {
    try {
        const { vehicle_type, vehicle_number, vehicle_price_per_day, vehicle_price_per_hour, vehicle_status } = req.body;
        await db.query('INSERT INTO Vehicle (vehicle_type, vehicle_number, vehicle_price_per_day, vehicle_price_per_hour, vehicle_status) VALUES (?, ?, ?, ?, ?)', [vehicle_type, vehicle_number, vehicle_price_per_day, vehicle_price_per_hour, vehicle_status]);
        res.status(201).json({ message: 'Vehicle added' });
    } catch (error) { res.status(500).json({ error: 'Error adding vehicle' }); }
}

// --- Reports ---

exports.generateReport = async (req, res) => {
    try {
        const { report_type, start_date, end_date, info } = req.body;
        await db.query(
            'INSERT INTO Report (admin_id, report_type, report_information, start_period, end_period) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, report_type, info, start_date, end_date]
        );
        res.status(201).json({ message: 'Report generated' });
    } catch (error) { res.status(500).json({ error: 'Error generating report' }); }
}

exports.getAllReports = async (req, res) => {
    try {
        const [reports] = await db.query('SELECT * FROM Report ORDER BY generated_date DESC');
        res.json(reports);
    } catch (error) { res.status(500).json({ error: 'Error fetching reports' }); }
}
