const mysql = require('mysql2/promise');

async function fixPaymentTable() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Kayal2003',
        database: 'HotelManagement',
        port: 3308
    });

    try {
        console.log('Connected to database...');

        // Check if columns exist
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'HotelManagement' 
            AND TABLE_NAME = 'payment' 
            AND COLUMN_NAME IN ('booking_type', 'booking_id')
        `);

        console.log('Existing columns:', columns.map(c => c.COLUMN_NAME));

        const hasBookingType = columns.some(c => c.COLUMN_NAME === 'booking_type');
        const hasBookingId = columns.some(c => c.COLUMN_NAME === 'booking_id');

        // Add booking_type if it doesn't exist
        if (!hasBookingType) {
            console.log('Adding booking_type column...');
            await connection.query(`
                ALTER TABLE payment 
                ADD COLUMN booking_type ENUM('Room', 'Activity', 'Vehicle', 'Food') DEFAULT NULL
            `);
            console.log('✅ booking_type column added');
        } else {
            console.log('⚠️  booking_type column already exists');
        }

        // Add booking_id if it doesn't exist
        if (!hasBookingId) {
            console.log('Adding booking_id column...');
            await connection.query(`
                ALTER TABLE payment 
                ADD COLUMN booking_id INT DEFAULT NULL
            `);
            console.log('✅ booking_id column added');
        } else {
            console.log('⚠️  booking_id column already exists');
        }

        // Create indexes if they don't exist
        try {
            await connection.query(`CREATE INDEX idx_payment_type ON payment(booking_type)`);
            console.log('✅ Index idx_payment_type created');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Index idx_payment_type already exists');
            } else {
                throw err;
            }
        }

        try {
            await connection.query(`CREATE INDEX idx_payment_booking ON payment(booking_id)`);
            console.log('✅ Index idx_payment_booking created');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Index idx_payment_booking already exists');
            } else {
                throw err;
            }
        }

        console.log('\n✅ Payment table migration completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

fixPaymentTable();
