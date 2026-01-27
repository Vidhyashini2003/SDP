const mysql = require('mysql2/promise');

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'HotelManagement'
    });

    try {
        console.log('Checking RoomBooking table structure...');
        const [roomBookingCols] = await connection.query('DESCRIBE RoomBooking');
        console.log('\nRoomBooking columns:');
        console.table(roomBookingCols.map(col => ({ Field: col.Field, Type: col.Type })));

        console.log('\nChecking ActivityBooking table structure...');
        const [activityBookingCols] = await connection.query('DESCRIBE ActivityBooking');
        console.log('\nActivityBooking columns:');
        console.table(activityBookingCols.map(col => ({ Field: col.Field, Type: col.Type })));

        console.log('\nChecking VehicleBooking table structure...');
        const [vehicleBookingCols] = await connection.query('DESCRIBE VehicleBooking');
        console.log('\nVehicleBooking columns:');
        console.table(vehicleBookingCols.map(col => ({ Field: col.Field, Type: col.Type })));

        // Check if cancel_reason exists
        const hasRoomCancelReason = roomBookingCols.some(col => col.Field === 'cancel_reason');
        const hasActivityCancelReason = activityBookingCols.some(col => col.Field === 'cancel_reason');
        const hasVehicleCancelReason = vehicleBookingCols.some(col => col.Field === 'cancel_reason');

        console.log('\n✅ Migration Status:');
        console.log(`RoomBooking.cancel_reason: ${hasRoomCancelReason ? '✓ EXISTS' : '✗ MISSING'}`);
        console.log(`ActivityBooking.cancel_reason: ${hasActivityCancelReason ? '✓ EXISTS' : '✗ MISSING'}`);
        console.log(`VehicleBooking.cancel_reason: ${hasVehicleCancelReason ? '✓ EXISTS' : '✗ MISSING'}`);

        // If migration needed, run it
        if (!hasRoomCancelReason || !hasActivityCancelReason) {
            console.log('\n⚠️  Running migration...');

            if (!hasRoomCancelReason) {
                await connection.query('ALTER TABLE RoomBooking ADD COLUMN cancel_reason TEXT AFTER rb_status');
                console.log('✅ Added cancel_reason to RoomBooking');
            }

            if (!hasActivityCancelReason) {
                await connection.query('ALTER TABLE ActivityBooking ADD COLUMN cancel_reason TEXT AFTER ab_status');
                console.log('✅ Added cancel_reason to ActivityBooking');
            }

            if (!hasVehicleCancelReason) {
                await connection.query('ALTER TABLE VehicleBooking ADD COLUMN cancel_reason TEXT AFTER vb_status');
                console.log('✅ Added cancel_reason to VehicleBooking');
            }

            console.log('\n✅ Migration completed successfully!');
        } else {
            console.log('\n✅ All tables have cancel_reason column - migration already applied!');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkSchema();
