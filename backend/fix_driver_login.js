const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function fixDriver() {
    try {
        const connection = await db.getConnection();
        const email = 'driver01@gmail.com';

        // 1. Check User
        const [users] = await connection.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            console.log('User not found!');
            process.exit(1);
        }
        const user = users[0];
        console.log('Found user:', user.user_id);

        // 2. Check Driver Table
        const [drivers] = await connection.query('SELECT * FROM Driver WHERE user_id = ?', [user.user_id]);
        if (drivers.length === 0) {
            console.log('Driver record missing. Inserting...');
            // Try to insert. If driver_id is auto-increment, this is fine.
            try {
                await connection.query('INSERT INTO Driver (user_id, driver_address) VALUES (?, ?)', [user.user_id, 'Trincomalee']);
                console.log('Driver record inserted.');
            } catch (insertErr) {
                console.error('Insert failed:', insertErr.message);
            }
        } else {
            console.log('Driver record exists.');
        }

        // 3. Reset Password
        const newPass = 'password123';
        const hashed = await bcrypt.hash(newPass, 10);
        await connection.query('UPDATE Users SET password = ? WHERE user_id = ?', [hashed, user.user_id]);
        console.log('Password reset to:', newPass);

        connection.release();
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixDriver();
