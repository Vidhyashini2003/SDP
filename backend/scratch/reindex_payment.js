const mysql = require('mysql2/promise');
require('dotenv').config();

async function reindexPayment() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        console.log('--- Reindexing payment ---');
        await connection.execute('UPDATE payment SET payment_id = 1 WHERE payment_id = 2');

        console.log('--- Updating dependent tables ---');
        await connection.execute('UPDATE roombooking SET rb_payment_id = 1 WHERE rb_payment_id = 2');
        await connection.execute('UPDATE activitybooking SET ab_payment_id = 1 WHERE ab_payment_id = 2');
        await connection.execute('UPDATE hirevehicle SET vb_payment_id = 1 WHERE vb_payment_id = 2');
        await connection.execute('UPDATE refund SET payment_id = 1 WHERE payment_id = 2');
        await connection.execute('UPDATE foodorder SET payment_id = 1 WHERE payment_id = 2');

        console.log('--- Resetting Auto-increment ---');
        await connection.execute('ALTER TABLE payment AUTO_INCREMENT = 2');

        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Payment reindexing complete successfully');

    } catch (err) {
        console.error('❌ Error during payment reindexing:', err);
    } finally {
        await connection.end();
    }
}

reindexPayment();
