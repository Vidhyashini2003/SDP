
const db = require('./config/db');

async function clearData() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await db.getConnection();

        console.log('Clearing VehicleBooking table...');
        // Disable foreign key checks momentarily to allow clearing if there are complex dependencies
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('DELETE FROM VehicleBooking');
        // Reset auto increment
        await connection.query('ALTER TABLE VehicleBooking AUTO_INCREMENT = 1');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('All vehicle booking data removed.');

    } catch (error) {
        console.error('Operation failed:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

clearData();
