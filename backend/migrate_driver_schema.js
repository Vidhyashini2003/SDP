
const db = require('./config/db');

async function migrate() {
    let connection;
    try {
        console.log('Connecting via db module...');
        connection = await db.getConnection();
        console.log('Connected to database.');

        // 1. Add driver_address column
        console.log('Adding driver_address column to Driver table...');
        try {
            await connection.query('ALTER TABLE Driver ADD COLUMN driver_address TEXT');
            console.log('driver_address column added.');
        } catch (e) {
            console.log('Error adding driver_address (might exist):', e.message);
        }

        // 2. Drop vehicle_id column
        console.log('Dropping vehicle_id column from Driver table...');
        try {
            await connection.query('ALTER TABLE Driver DROP COLUMN vehicle_id');
            console.log('vehicle_id column dropped.');
        } catch (e) {
            console.log('Error dropping vehicle_id (might not exist):', e.message);
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

migrate();
