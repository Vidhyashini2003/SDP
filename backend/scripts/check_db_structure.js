const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseStructure() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        console.log('📋 Checking RoomBooking table structure...\n');
        const [roomCols] = await connection.query('DESCRIBE RoomBooking');
        console.log('RoomBooking columns:');
        roomCols.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));

        console.log('\n📋 Checking ActivityBooking table structure...\n');
        const [activityCols] = await connection.query('DESCRIBE ActivityBooking');
        console.log('ActivityBooking columns:');
        activityCols.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));

        console.log('\n📋 Checking VehicleBooking table structure...\n');
        const [vehicleCols] = await connection.query('DESCRIBE VehicleBooking');
        console.log('VehicleBooking columns:');
        vehicleCols.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));

        console.log('\n📋 Checking Payment table structure...\n');
        const [paymentCols] = await connection.query('DESCRIBE Payment');
        console.log('Payment columns:');
        paymentCols.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkDatabaseStructure();
