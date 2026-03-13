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
        case 'chef': return { table: 'KitchenStaff', idCol: 'staff_id' };
        case 'driver': return { table: 'Driver', idCol: 'driver_id' };
        case 'guest': return { table: 'Guest', idCol: 'guest_id' };
        default: return null;
    }
};

const validatePassword = (password) => {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one special character' };
    }
    return { valid: true };
};

// Guest Registration (Public)
exports.registerGuest = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const {
            first_name, last_name, guest_email, guest_phone, guest_password, guest_nic_passport, nationality
        } = req.body;

        const passwordValidation = validatePassword(guest_password);
        if (!passwordValidation.valid) {
            await connection.rollback();
            return res.status(400).json({ error: passwordValidation.message });
        }

        // Check if user already exists
        const [existing] = await connection.query('SELECT * FROM Users WHERE email = ?', [guest_email]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(guest_password, 10);

        // 1. Insert into Users (Inactive, With Password)
        const [userRes] = await connection.query(
            "INSERT INTO Users (first_name, last_name, email, phone, password, role, account_status) VALUES (?, ?, ?, ?, ?, 'guest', 'Inactive')",
            [first_name, last_name, guest_email, guest_phone, hashedPassword]
        );
        const userId = userRes.insertId;

        // 2. Insert into Guest (linking to user_id)
        await connection.query(
            `INSERT INTO Guest (
                user_id, guest_nic_passport, nationality
             ) VALUES (?, ?, ?)`,
            [userId, guest_nic_passport, nationality]
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
                name: `${user.first_name} ${user.last_name}`.trim(),
                first_name: user.first_name,
                last_name: user.last_name,
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

                const passwordValidation = validatePassword(password);
                if (!passwordValidation.valid) {
                    await connection.rollback();
                    return res.status(400).json({ error: passwordValidation.message });
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
        const { first_name, last_name, address, nationality } = req.body;

        // 1. Update Common Fields in Users Table (guest_phone handled in guestController)
        await connection.query(
            'UPDATE Users SET first_name = ?, last_name = ? WHERE user_id = ?',
            [first_name, last_name, userId]
        );

        console.log(`Updating profile for UserID: ${userId}, Role: ${role}`);
        console.log('Update Data:', { address, nationality });

        // 2. Update Role Specific Fields (e.g. Address, Nationality)
        // We need to find the role record by user_id
        const lowerRole = role.toLowerCase();

        if (lowerRole === 'guest') {
            await connection.query(
                'UPDATE Guest SET guest_nic_passport = ?, nationality = ? WHERE user_id = ?',
                [address, nationality, userId] // frontend is still sending it as "address" in updateProfile payload for all roles, but we save it to guest_nic_passport
            );
        } else if (lowerRole === 'receptionist') {
            await connection.query(
                'UPDATE Receptionist SET receptionist_address = ? WHERE user_id = ?',
                [address, userId]
            );
        } else if (lowerRole === 'chef') {
            await connection.query(
                'UPDATE KitchenStaff SET staff_address = ? WHERE user_id = ?',
                [address, userId]
            );
        } else if (lowerRole === 'driver') {
            const [res] = await connection.query(
                'UPDATE Driver SET driver_address = ? WHERE user_id = ?',
                [address, userId]
            );
            if (res.affectedRows === 0) {
                console.log('Driver profile missing, creating new record...');
                await connection.query(
                    'INSERT INTO Driver (user_id, driver_address) VALUES (?, ?)',
                    [userId, address]
                );
            }
        }

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
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({ error: passwordValidation.message });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE Users SET password = ? WHERE user_id = ?', [hashedPassword, userId]);

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};
// Forgot Password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    const connection = await db.getConnection();
    try {
        // 1. Find User
        const [users] = await connection.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = users[0];

        // 2. Generate Reset Token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        // 3. Save Token to Database (New Table)
        // First invalidate any existing tokens for this user
        await connection.query('DELETE FROM password_resets WHERE user_id = ?', [user.user_id]);

        await connection.query(
            'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
            [user.user_id, resetToken, resetExpires]
        );

        // 4. Send Email
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
        const emailSent = await emailService.sendResetPasswordEmail(user.email, resetUrl);

        if (!emailSent) {
            return res.status(500).json({ error: 'Failed to send reset email' });
        }

        res.json({ message: 'Password reset link sent to your email' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    } finally {
        connection.release();
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    const { token, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
    }

    const connection = await db.getConnection();
    try {
        // 1. Find Valid Token in New Table
        const [tokens] = await connection.query(
            'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
            [token]
        );

        if (tokens.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }
        const resetEntry = tokens[0];

        // 2. Hash New Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Update User Password and Delete Token
        await connection.beginTransaction();

        await connection.query(
            'UPDATE Users SET password = ? WHERE user_id = ?',
            [hashedPassword, resetEntry.user_id]
        );

        await connection.query(
            'DELETE FROM password_resets WHERE id = ?',
            [resetEntry.id]
        );

        await connection.commit();

        res.json({ message: 'Password reset successfully. You can now login.' });

    } catch (error) {
        await connection.rollback();
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    } finally {
        connection.release();
    }
};

// Get Current User Profile
exports.getMe = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    const connection = await db.getConnection();
    try {
        let query = "SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) as name, u.first_name, u.last_name, u.email, u.phone, u.role, u.account_status";
        let params = [userId];

        if (role === 'receptionist') {
            query += ', r.receptionist_address as address FROM Users u LEFT JOIN Receptionist r ON u.user_id = r.user_id WHERE u.user_id = ?';
        } else if (role === 'chef') {
            query += ', k.staff_address as address FROM Users u LEFT JOIN KitchenStaff k ON u.user_id = k.user_id WHERE u.user_id = ?';
        } else if (role === 'driver') {
            query += ', d.driver_address as address FROM Users u LEFT JOIN Driver d ON u.user_id = d.user_id WHERE u.user_id = ?';
        } else if (role === 'guest') {
            query += ', g.guest_nic_passport, g.nationality FROM Users u LEFT JOIN Guest g ON u.user_id = g.user_id WHERE u.user_id = ?';
        } else {
            query += ' FROM Users u WHERE u.user_id = ?';
        }

        const [users] = await connection.query(query, params);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(users[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    } finally {
        connection.release();
    }
};
