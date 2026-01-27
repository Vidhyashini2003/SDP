const db = require('../config/db');

async function removePaymentMethodColumns() {
    const connection = await db.getConnection();
    try {
        console.log('🗑️ Removing "payment_method" columns from tables...');
        await connection.beginTransaction();

        // 1. Remove from 'payment' table
        try {
            const [cols] = await connection.query("SHOW COLUMNS FROM payment LIKE 'payment_method'");
            if (cols.length > 0) {
                console.log('Dropping payment_method from payment table...');
                await connection.query('ALTER TABLE payment DROP COLUMN payment_method');
            } else {
                console.log('payment_method not found in payment table.');
            }
        } catch (err) {
            console.warn('Error checking/dropping payment.payment_method:', err.message);
        }

        // 2. Remove from 'foodorder' table
        try {
            const [cols] = await connection.query("SHOW COLUMNS FROM foodorder LIKE 'payment_method'");
            if (cols.length > 0) {
                console.log('Dropping payment_method from foodorder table...');
                await connection.query('ALTER TABLE foodorder DROP COLUMN payment_method');
            } else {
                console.log('payment_method not found in foodorder table.');
            }
        } catch (err) {
            console.warn('Error checking/dropping foodorder.payment_method:', err.message);
        }

        await connection.commit();
        console.log('✅ Payment method columns removed successfully!');
        process.exit(0);

    } catch (error) {
        await connection.rollback();
        console.error('❌ Failed to remove payment method columns:', error);
        process.exit(1);
    } finally {
        connection.release();
    }
}

removePaymentMethodColumns();
