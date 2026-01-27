const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function forceReset() {
    try {
        const connection = await db.getConnection();
        const email = 'driver01@gmail.com';
        const newPass = 'password123';
        const hashed = await bcrypt.hash(newPass, 10);

        const [res] = await connection.query('UPDATE Users SET password = ? WHERE email = ?', [hashed, email]);
        console.log('Update result:', res);

        connection.release();
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

forceReset();
