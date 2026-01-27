const mysql = require('mysql2/promise');

async function removeUnneededColumns() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Kayal2003',
        database: 'HotelManagement',
        port: 3308
    });

    try {
        console.log('Connected to database...\n');

        // Check current table structure
        const [beforeColumns] = await connection.query(`DESCRIBE payment`);
        console.log('=== Current table structure ===');
        console.table(beforeColumns.map(c => ({ Field: c.Field, Type: c.Type })));

        // Drop booking_type column if it exists
        try {
            await connection.query(`ALTER TABLE payment DROP COLUMN booking_type`);
            console.log('\n✅ Dropped booking_type column');
        } catch (err) {
            if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('\n⚠️  booking_type column does not exist (already removed or never existed)');
            } else {
                throw err;
            }
        }

        // Drop booking_id column if it exists
        try {
            await connection.query(`ALTER TABLE payment DROP COLUMN booking_id`);
            console.log('✅ Dropped booking_id column');
        } catch (err) {
            if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('⚠️  booking_id column does not exist (already removed or never existed)');
            } else {
                throw err;
            }
        }

        // Drop indexes if they exist
        try {
            await connection.query(`ALTER TABLE payment DROP INDEX idx_payment_type`);
            console.log('✅ Dropped index idx_payment_type');
        } catch (err) {
            if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('⚠️  Index idx_payment_type does not exist');
            }
        }

        try {
            await connection.query(`ALTER TABLE payment DROP INDEX idx_payment_booking`);
            console.log('✅ Dropped index idx_payment_booking');
        } catch (err) {
            if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('⚠️  Index idx_payment_booking does not exist');
            }
        }

        // Show final table structure
        const [afterColumns] = await connection.query(`DESCRIBE payment`);
        console.log('\n=== Final table structure ===');
        console.table(afterColumns.map(c => ({ Field: c.Field, Type: c.Type })));

        console.log('\n✅ Cleanup completed!');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

removeUnneededColumns();
