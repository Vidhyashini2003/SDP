
const db = require('../config/db');

async function checkDrivers() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await db.getConnection();

        console.log("Fetching all users with role 'driver'...");
        const [users] = await connection.query(`
            SELECT u.user_id, u.name, u.email, u.role, u.account_status, d.driver_id 
            FROM Users u 
            LEFT JOIN Driver d ON u.user_id = d.user_id 
            WHERE u.role = 'driver'
        `);

        console.table(users);

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

checkDrivers();
