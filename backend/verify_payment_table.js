const mysql = require('mysql2/promise');

async function verifyPaymentTable() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Kayal2003',
        database: 'HotelManagement',
        port: 3308
    });

    try {
        console.log('Connected to database...\n');

        // Get the full table structure
        const [columns] = await connection.query(`
            DESCRIBE payment
        `);

        console.log('Current payment table structure:\n');
        console.table(columns);

        // Check specifically for the columns we need
        const hasBookingType = columns.some(c => c.Field === 'booking_type');
        const hasBookingId = columns.some(c => c.Field === 'booking_id');

        console.log('\n=== Column Check ===');
        console.log('booking_type exists:', hasBookingType ? '✅ YES' : '❌ NO');
        console.log('booking_id exists:', hasBookingId ? '✅ YES' : '❌ NO');

        if (!hasBookingType || !hasBookingId) {
            console.log('\n⚠️  Columns are missing! Will attempt to add them now...\n');

            if (!hasBookingType) {
                console.log('Adding booking_type column...');
                try {
                    await connection.query(`
                        ALTER TABLE payment 
                        ADD COLUMN booking_type ENUM('Room', 'Activity', 'Vehicle', 'Food') DEFAULT NULL
                    `);
                    console.log('✅ booking_type column added');
                } catch (err) {
                    console.error('❌ Failed to add booking_type:', err.message);
                }
            }

            if (!hasBookingId) {
                console.log('Adding booking_id column...');
                try {
                    await connection.query(`
                        ALTER TABLE payment 
                        ADD COLUMN booking_id INT DEFAULT NULL
                    `);
                    console.log('✅ booking_id column added');
                } catch (err) {
                    console.error('❌ Failed to add booking_id:', err.message);
                }
            }

            // Verify again
            const [newColumns] = await connection.query(`DESCRIBE payment`);
            console.log('\n=== Updated Table Structure ===\n');
            console.table(newColumns);
        } else {
            console.log('\n✅ All required columns are present!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await connection.end();
    }
}

verifyPaymentTable();
