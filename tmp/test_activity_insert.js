const mysql = require('mysql2/promise');

async function test() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Kayal2003',
        port: 3308,
        database: 'hotelmanagement'
    });
    try {
        await connection.beginTransaction();

        const guest_id = 1;
        const activity_id = 1;
        const start_time = '2026-04-21T09:00:00.000Z';
        const end_time = '2026-04-21T10:00:00.000Z';
        const total_amount = 1500;
        const linkedBookingId = 5;

        console.log('Inserting payment...');
        const [paymentResult] = await connection.query(
            'INSERT INTO payment (payment_amount, payment_status) VALUES (?, ?)',
            [total_amount, 'Success']
        );
        const payment_id = paymentResult.insertId;
        console.log('Payment ID:', payment_id);

        console.log('Inserting activity booking...');
        const [bookingResult] = await connection.query(
            'INSERT INTO activitybooking (guest_id, activity_id, ab_start_time, ab_end_time, ab_total_amount, ab_payment_id, ab_status, rb_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [guest_id, activity_id, start_time, end_time, total_amount, payment_id, 'Reserved', linkedBookingId]
        );
        console.log('Booking Result:', bookingResult.insertId);

        await connection.rollback();
        console.log('Test PASSED (rolled back)');
    } catch (e) {
        console.error('Test FAILED');
        console.error('Message:', e.message);
        console.error('SQL:', e.sql);
        await connection.rollback().catch(() => {});
    } finally {
        await connection.end();
    }
}

test();
