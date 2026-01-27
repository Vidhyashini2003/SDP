const mysql = require('mysql2/promise');
require('dotenv').config();

async function applyMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        console.log('📋 Checking and applying cancel_reason migration...\n');

        // Check RoomBooking
        const [roomCols] = await connection.query('DESCRIBE RoomBooking');
        const hasRoomCancelReason = roomCols.some(col => col.Field === 'cancel_reason');

        if (!hasRoomCancelReason) {
            console.log('Adding cancel_reason to RoomBooking...');
            await connection.query('ALTER TABLE RoomBooking ADD COLUMN cancel_reason TEXT AFTER rb_status');
            console.log('✅ Added cancel_reason to RoomBooking\n');
        } else {
            console.log('✅ RoomBooking already has cancel_reason\n');
        }

        // Check ActivityBooking
        const [activityCols] = await connection.query('DESCRIBE ActivityBooking');
        const hasActivityCancelReason = activityCols.some(col => col.Field === 'cancel_reason');

        if (!hasActivityCancelReason) {
            console.log('Adding cancel_reason to ActivityBooking...');
            await connection.query('ALTER TABLE ActivityBooking ADD COLUMN cancel_reason TEXT AFTER ab_status');
            console.log('✅ Added cancel_reason to ActivityBooking\n');
        } else {
            console.log('✅ ActivityBooking already has cancel_reason\n');
        }

        // Check VehicleBooking
        const [vehicleCols] = await connection.query('DESCRIBE VehicleBooking');
        const hasVehicleCancelReason = vehicleCols.some(col => col.Field === 'cancel_reason');

        if (!hasVehicleCancelReason) {
            console.log('Adding cancel_reason to VehicleBooking...');
            await connection.query('ALTER TABLE VehicleBooking ADD COLUMN cancel_reason TEXT AFTER vb_status');
            console.log('✅ Added cancel_reason to VehicleBooking\n');
        } else {
            console.log('✅ VehicleBooking already has cancel_reason\n');
        }

        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

applyMigration();
