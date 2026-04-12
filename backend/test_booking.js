const db = require('./config/db');

async function test() {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Test payment insert
        const [p] = await connection.query(
            'INSERT INTO payment (payment_amount, payment_status) VALUES (?, ?)',
            [5000, 'Success']
        );
        console.log('1. payment OK, id:', p.insertId);

        // Test roombooking insert  
        const [rb] = await connection.query(
            'INSERT INTO roombooking (guest_id, room_id, rb_checkin, rb_checkout, rb_total_amount, rb_payment_id, rb_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [1, 65, '2026-04-01', '2026-04-03', 5000, p.insertId, 'Booked']
        );
        console.log('2. roombooking OK, id:', rb.insertId);

        // Test activitybooking insert
        const [ab] = await connection.query(
            'INSERT INTO activitybooking (guest_id, activity_id, ab_start_time, ab_end_time, ab_total_amount, ab_payment_id, ab_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [1, 1, '2026-04-01 09:00:00', '2026-04-01 10:00:00', 1000, p.insertId, 'Reserved']
        );
        console.log('3. activitybooking OK, id:', ab.insertId);

        // Test foodorder insert
        const [fo] = await connection.query(
            'INSERT INTO foodorder (guest_id, order_status, dining_option) VALUES (?, ?, ?)',
            [1, 'Pending', 'Delivery']
        );
        console.log('4. foodorder OK, id:', fo.insertId);

        // Test orderitem insert
        const [oi] = await connection.query(
            'INSERT INTO orderitem (order_id, item_id, quantity, item_price, subtotal) VALUES (?, ?, ?, ?, ?)',
            [fo.insertId, 1, 2, 250.00, 500.00]
        );
        console.log('5. orderitem OK, id:', oi.insertId);

        // Test hirevehicle insert
        const [vb] = await connection.query(
            'INSERT INTO hirevehicle (guest_id, vehicle_id, vb_date, vb_days, vb_status) VALUES (?, ?, ?, ?, ?)',
            [1, 1, '2026-04-01', 2, 'Pending Approval']
        );
        console.log('6. hirevehicle OK, id:', vb.insertId);

        await connection.rollback();
        console.log('\nALL INSERTS PASSED! Rolling back test data.');
    } catch (e) {
        await connection.rollback().catch(() => {});
        console.error('\nFAILED:', e.sqlMessage || e.message);
        console.error('SQL:', e.sql);
    } finally {
        connection.release();
        process.exit(0);
    }
}

test();
