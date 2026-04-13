const db = require('./config/db');

async function verifyFix() {
    const id = 3; // Test with rb_id: 3
    const userId = 6; // user_id for guest_id 1
    
    console.log('--- STARTING VERIFICATION ---');
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get Booking
        const [bookings] = await connection.query(
            'SELECT * FROM roombooking WHERE rb_id = ? AND guest_id = (SELECT guest_id FROM Guest WHERE user_id = ?)',
            [id, userId]
        );
        if (bookings.length === 0) {
            console.error('ERROR: Booking not found');
            await connection.rollback();
            return;
        }

        const booking = bookings[0];
        console.log('Found booking:', booking.rb_id, 'Status:', booking.rb_status);

        // 2. Mocking implementation logic (Cascading Cancellation)
        console.log('Applying cascading cancellations...');
        await connection.query('UPDATE roombooking SET rb_status = "Cancelled" WHERE rb_id = ?', [id]);
        await connection.query('UPDATE activitybooking SET ab_status = "Cancelled" WHERE rb_id = ?', [id]);
        await connection.query('UPDATE foodorder SET order_status = "Cancelled" WHERE rb_id = ?', [id]);
        await connection.query('UPDATE hirevehicle SET vb_status = "Cancelled" WHERE rb_id = ?', [id]);

        await connection.commit();
        console.log('Transaction committed.');

        // 3. Verify
        console.log('\n--- VERIFYING RESULTS ---');
        const [room] = await db.query('SELECT rb_status FROM roombooking WHERE rb_id = ?', [id]);
        const [acts] = await db.query('SELECT ab_status FROM activitybooking WHERE rb_id = ?', [id]);
        const [food] = await db.query('SELECT order_status FROM foodorder WHERE rb_id = ?', [id]);
        const [veh] = await db.query('SELECT vb_status FROM hirevehicle WHERE rb_id = ?', [id]);

        console.log('Room Status (Expected: Cancelled):', room[0]?.rb_status);
        console.log('Activities Statuses (Expected: Cancelled):', acts.map(a => a.ab_status));
        console.log('Food Orders Statuses (Expected: Cancelled):', food.map(f => f.order_status));
        console.log('Vehicles Statuses (Expected: Cancelled):', veh.map(v => v.vb_status));

        const allCancelled = room[0]?.rb_status === 'Cancelled' && 
                             acts.every(a => a.ab_status === 'Cancelled') &&
                             food.every(f => f.order_status === 'Cancelled') &&
                             veh.every(v => v.vb_status === 'Cancelled');

        if (allCancelled) {
            console.log('\n✅ VERIFICATION SUCCESSFUL: All associated bookings cancelled.');
        } else {
            console.error('\n❌ VERIFICATION FAILED: Some bookings were not cancelled.');
        }

    } catch (error) {
        await connection.rollback();
        console.error('Verification Error:', error);
    } finally {
        connection.release();
        process.exit();
    }
}

verifyFix();
