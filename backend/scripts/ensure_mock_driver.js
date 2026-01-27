const db = require('../config/db');

async function ensureDriver() {
    try {
        const connection = await db.getConnection();
        const email = 'rajesh.driver@hotel.com';
        const password = 'Driver123';

        console.log('Checking for user:', email);
        const [users] = await connection.query('SELECT * FROM Users WHERE email = ?', [email]);

        let userId;

        if (users.length === 0) {
            console.log('User not found. Creating...');
            const [res] = await connection.query(
                "INSERT INTO Users (name, email, phone, password, role, account_status) VALUES (?, ?, ?, ?, 'driver', 'Active')",
                ['Rajesh Kumar', email, '0771234567', password]
            );
            userId = res.insertId;
            console.log('User created with ID:', userId);
        } else {
            console.log('User exists.');
            userId = users[0].user_id;
            // Update password to ensure it matches 'Driver123'
            await connection.query('UPDATE Users SET password = ? WHERE user_id = ?', [password, userId]);
        }

        // Check Driver table
        const [drivers] = await connection.query('SELECT * FROM Driver WHERE user_id = ?', [userId]);
        if (drivers.length === 0) {
            console.log('Driver profile not found. Creating...');
            // Only user_id and driver_address are known columns from my check
            await connection.query(
                "INSERT INTO Driver (user_id, driver_address) VALUES (?, 'Initial Address')",
                [userId]
            );
            console.log('Driver profile created.');
        } else {
            console.log('Driver profile exists.');
        }

        connection.release();
        process.exit(0);

    } catch (error) {
        console.error('Error ensuring driver:', error);
        process.exit(1);
    }
}

ensureDriver();
