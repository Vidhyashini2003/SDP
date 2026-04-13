const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function fix() {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('Connected to database');

        const rb_id = 4;
        const reason = 'System fix: Cascading cancellation for previously cancelled room booking';

        // Cancel linked services
        await conn.query('UPDATE activitybooking SET ab_status = "Cancelled", cancel_reason = ? WHERE rb_id = ? AND ab_status != "Cancelled"', [reason, rb_id]);
        await conn.query('UPDATE foodorder SET order_status = "Cancelled" WHERE rb_id = ? AND order_status != "Cancelled"', [rb_id]);
        await conn.query('UPDATE orderitem oi JOIN foodorder fo ON oi.order_id = fo.order_id SET oi.item_status = "Cancelled" WHERE fo.rb_id = ? AND oi.item_status != "Cancelled"', [rb_id]);
        await conn.query('UPDATE hirevehicle SET vb_status = "Cancelled", cancel_reason = ? WHERE rb_id = ? AND vb_status != "Cancelled"', [reason, rb_id]);
        await conn.query('UPDATE hire_vehicle_for_arrival SET status = "Cancelled", cancel_reason = ? WHERE rb_id = ? AND status != "Cancelled"', [reason, rb_id]);

        console.log(`Successfully applied cascading cancellation fix for Booking #${rb_id}`);
    } catch (error) {
        console.error('Error applying fix:', error);
    } finally {
        if (conn) await conn.end();
        process.exit();
    }
}

fix();
