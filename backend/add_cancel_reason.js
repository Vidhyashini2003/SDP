
const db = require('./config/db');

async function migrate() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await db.getConnection();

        console.log('Adding cancel_reason to VehicleBooking table...');
        try {
            await connection.query('ALTER TABLE VehicleBooking ADD COLUMN cancel_reason VARCHAR(255) NULL AFTER vb_status');
            console.log('cancel_reason column added.');
        } catch (e) {
            console.log('Error adding cancel_reason (might exist):', e.message);
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

migrate();
