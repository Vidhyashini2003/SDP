const db = require('../config/db');
const { generateToken } = require('../config/auth');

// Guest Registration
exports.registerGuest = async (req, res) => {
    try {
        const { guest_name, guest_email, guest_phone, guest_password, guest_address, nationality } = req.body;

        // Check if guest already exists
        const [existing] = await db.query('SELECT * FROM Guest WHERE guest_email = ?', [guest_email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Insert guest with plain password
        const [result] = await db.query(
            'INSERT INTO Guest (guest_name, guest_email, guest_phone, guest_password, guest_address, nationality) VALUES (?, ?, ?, ?, ?, ?)',
            [guest_name, guest_email, guest_phone, guest_password, guest_address, nationality]
        );

        const token = generateToken({ id: result.insertId, email: guest_email }, 'guest');

        res.status(201).json({
            message: 'Guest registered successfully',
            token,
            user: {
                id: result.insertId,
                name: guest_name,
                email: guest_email,
                role: 'guest'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
};

// Unified Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check Admin
        const [admins] = await db.query('SELECT * FROM Admin WHERE admin_email = ?', [email]);
        if (admins.length > 0) {
            const admin = admins[0];
            if (password === admin.admin_password) {
                const token = generateToken({ id: admin.admin_id, email: admin.admin_email }, 'admin');
                return res.json({
                    message: 'Login successful',
                    token,
                    user: { id: admin.admin_id, name: admin.admin_name, email: admin.admin_email, role: 'admin' }
                });
            }
        }

        // 2. Check Receptionist
        const [receptionists] = await db.query('SELECT * FROM Receptionist WHERE receptionist_email = ?', [email]);
        if (receptionists.length > 0) {
            const receptionist = receptionists[0];
            if (password === receptionist.receptionist_password) {
                const token = generateToken({ id: receptionist.receptionist_id, email: receptionist.receptionist_email }, 'receptionist');
                return res.json({
                    message: 'Login successful',
                    token,
                    user: { id: receptionist.receptionist_id, name: receptionist.receptionist_name, email: receptionist.receptionist_email, role: 'receptionist' }
                });
            }
        }

        // 3. Check Kitchen Staff
        const [kitchen] = await db.query('SELECT * FROM KitchenStaff WHERE staff_email = ?', [email]);
        if (kitchen.length > 0) {
            const staff = kitchen[0];
            if (password === staff.staff_password) {
                const token = generateToken({ id: staff.staff_id, email: staff.staff_email }, 'kitchen');
                return res.json({
                    message: 'Login successful',
                    token,
                    user: { id: staff.staff_id, name: staff.staff_name, email: staff.staff_email, role: 'kitchen' }
                });
            }
        }

        // 4. Check Driver
        const [drivers] = await db.query('SELECT * FROM Driver WHERE driver_email = ?', [email]);
        if (drivers.length > 0) {
            const driver = drivers[0];
            if (password === driver.driver_password) {
                const token = generateToken({ id: driver.driver_id, email: driver.driver_email }, 'driver');
                return res.json({
                    message: 'Login successful',
                    token,
                    user: { id: driver.driver_id, name: driver.driver_name, email: driver.driver_email, role: 'driver' }
                });
            }
        }

        // 5. Check Guest
        const [guests] = await db.query('SELECT * FROM Guest WHERE guest_email = ?', [email]);
        if (guests.length > 0) {
            const guest = guests[0];
            if (password === guest.guest_password) {
                const token = generateToken({ id: guest.guest_id, email: guest.guest_email }, 'guest');
                return res.json({
                    message: 'Login successful',
                    token,
                    user: { id: guest.guest_id, name: guest.guest_name, email: guest.guest_email, role: 'guest' }
                });
            }
        }

        // If we reach here, either email not found or password didn't match for the found email
        return res.status(401).json({ error: 'Invalid credentials' });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
};
