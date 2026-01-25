const db = require('../config/db');
const { generateToken } = require('../config/auth');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const emailService = require('../utils/emailService');

// Helper to get role specific ID column and table
const getRoleSchema = (role) => {
    switch (role) {
        case 'admin': return null; // Admin has no specific table
        case 'receptionist': return { table: 'Receptionist', idCol: 'receptionist_id' };
        case 'kitchen': return { table: 'KitchenStaff', idCol: 'staff_id' };
        case 'driver': return { table: 'Driver', idCol: 'driver_id' };
        case 'guest': return { table: 'Guest', idCol: 'guest_id' };
        default: return null;
    }
};

// Guest Registration (Public)
exports.registerGuest = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const {
            guest_name, guest_email, guest_phone, guest_password, guest_address, nationality,
            card_number, card_holder_name, card_expiry, card_cvv
        } = req.body;

        // Check if user already exists
        const [existing] = await connection.query('SELECT * FROM Users WHERE email = ?', [guest_email]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(guest_password, 10);

        // 1. Insert into Users (Inactive, With Password)
        const [userRes] = await connection.query(
            "INSERT INTO Users (name, email, phone, password, role, account_status) VALUES (?, ?, ?, ?, 'guest', 'Inactive')",
            [guest_name, guest_email, guest_phone, hashedPassword]
        );
        const userId = userRes.insertId;

        // 2. Insert into Guest (linking to user_id)
        await connection.query(
            `INSERT INTO Guest (
                user_id, guest_address, nationality, 
                card_number, card_holder_name, card_expiry, card_cvv
             ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, guest_address, nationality, card_number, card_holder_name, card_expiry, card_cvv]
        );

        // 3. Generate Activation Token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await connection.query(
            "INSERT INTO activation_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
            [userId, token, expiresAt]
        );

        // 4. Send Email
        const emailSent = await emailService.sendActivationEmail(guest_email, token);
        if (!emailSent) {
            await connection.rollback();
            return res.status(500).json({ error: 'Failed to send verification email' });
        }

        await connection.commit();

        res.status(201).json({
            message: 'Registration successful. Please check your email to activate your account.'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed', details: error.message });
    } finally {
        connection.release();
    }
};

// Unified Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find User
        const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // 2. Check Account Status
        if (user.account_status !== 'Active') {
            return res.status(403).json({ error: 'Account is inactive. Please check your email to activate.' });
        }

        // 3. Verify Password
        // Handle migration: If DB password is not hashed (doesn't start with $2), do plain comparison
        // Otherwise use bcrypt
        let isMatch = false;
        if (user.password && user.password.startsWith('$2')) {
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            // Legacy plain text fallback (for existing admin)
            isMatch = (password === user.password);
        }

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 4. Generate Token
        // Token now primarily uses 'id' as the user_id from Users table
        const token = generateToken({ id: user.user_id, userId: user.user_id, email: user.email }, user.role);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.user_id,
                userId: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
};

// Activate Account (GET to check, POST to set password)
exports.activateAccount = async (req, res) => {
    const { token } = req.query; // For GET
    const { token: bodyToken, password, confirmPassword } = req.body; // For POST

    // Normalize token
    const verificationToken = token || bodyToken;

    if (!verificationToken) {
        return res.status(400).json({ error: 'Token is required' });
    }

    const connection = await db.getConnection();
    try {
        // 1. Find Token with Password check
        const [rows] = await connection.query(
            "SELECT t.*, u.email, u.password FROM activation_tokens t JOIN Users u ON t.user_id = u.user_id WHERE t.token = ? AND t.used = FALSE",
            [verificationToken]
        );

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const tokenData = rows[0];
        const hasPassword = !!tokenData.password && tokenData.password.length > 0;

        // Check expiry
        if (new Date() > new Date(tokenData.expires_at)) {
            return res.status(400).json({ error: 'Token has expired' });
        }

        // GET request: Just validate
        if (req.method === 'GET') {
            return res.json({ valid: true, email: tokenData.email, hasPassword });
        }

        // POST request: Set Password OR Just Activate
        if (req.method === 'POST') {
            await connection.beginTransaction();

            if (!hasPassword) {
                // Determine password to set
                if (!password || password !== confirmPassword) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Passwords do not match or are missing' });
                }
                const hashedPassword = await bcrypt.hash(password, 10);

                await connection.query(
                    "UPDATE Users SET password = ?, account_status = 'Active' WHERE user_id = ?",
                    [hashedPassword, tokenData.user_id]
                );
            } else {
                // User already has password, just activate
                await connection.query(
                    "UPDATE Users SET account_status = 'Active' WHERE user_id = ?",
                    [tokenData.user_id]
                );
            }

            // Mark Token Used
            await connection.query("DELETE FROM activation_tokens WHERE id = ?", [tokenData.id]);

            await connection.commit();
            res.json({ message: 'Account activated successfully. You can now login.' });
        }

    } catch (error) {
        await connection.rollback();
        console.error('Activation error:', error);
        res.status(500).json({ error: 'Activation failed' });
    } finally {
        connection.release();
    }
};

// Update Profile
exports.updateProfile = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const userId = req.user.id; // Now this is user_id
        const role = req.user.role;
        const { name, email, phone, address, nationality } = req.body;

        // 1. Update Common Fields in Users Table
        await connection.query(
            'UPDATE Users SET name = ?, email = ?, phone = ? WHERE user_id = ?',
            [name, email, phone, userId]
        );

        // 2. Update Role Specific Fields (e.g. Address, Nationality)
        // We need to find the role record by user_id
        if (role === 'guest') {
            await connection.query(
                'UPDATE Guest SET guest_address = ?, nationality = ? WHERE user_id = ?',
                [address, nationality, userId]
            );
        } else if (role === 'receptionist') {
            await connection.query(
                'UPDATE Receptionist SET receptionist_address = ? WHERE user_id = ?',
                [address, userId]
            );
        } else if (role === 'kitchen') {
            await connection.query(
                'UPDATE KitchenStaff SET staff_address = ? WHERE user_id = ?',
                [address, userId]
            );
        }
        // Admin has no extra table
        // Driver has vehicle_id but maybe address logic?

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

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id; // user_id
        const { currentPassword, newPassword } = req.body;

        // Verify Current
        const [users] = await db.query('SELECT password FROM Users WHERE user_id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        // Logic for plain vs hash?
        const dbPass = users[0].password;
        let isMatch = false;
        if (dbPass && dbPass.startsWith('$2')) {
            isMatch = await bcrypt.compare(currentPassword, dbPass);
        } else {
            isMatch = (currentPassword === dbPass);
        }

        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        // Update
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE Users SET password = ? WHERE user_id = ?', [hashedPassword, userId]);

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};
