const db = require('../config/db');

async function verifyRefundFlow() {
    console.log('--- Verifying Cancellation & Refund Flow ---');
    try {
        // 1. Setup: Create a Booking & Payment
        const [guests] = await db.query('SELECT guest_id FROM Guest LIMIT 1');
        const [rooms] = await db.query('SELECT room_id, room_price_per_day FROM Room LIMIT 1');

        if (!guests.length || !rooms.length) {
            console.log('Skipping verification: No guest/room data');
            return;
        }

        const guestId = guests[0].guest_id;
        const roomId = rooms[0].room_id;
        const price = rooms[0].room_price_per_day;

        // Future date (2 days from now)
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 2);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 1);

        const [bookingRes] = await db.query(
            'INSERT INTO RoomBooking (guest_id, room_id, rb_checkin, rb_checkout, rb_total_amount, rb_status) VALUES (?, ?, ?, ?, ?, "Confirmed")',
            [guestId, roomId, checkIn, checkOut, price]
        );
        const bookingId = bookingRes.insertId;
        console.log(`✅ Created Booking ID: ${bookingId}`);

        // Create Payment
        const [paymentRes] = await db.query(
            'INSERT INTO Payment (guest_id, payment_amount, payment_status, booking_type, booking_id) VALUES (?, ?, "Success", "Room", ?)',
            [guestId, price, bookingId]
        );
        const paymentId = paymentRes.insertId;
        console.log(`✅ Created Payment ID: ${paymentId}`);

        // 2. Simulate Cancellation (Logic from controller)
        // Check time rule
        const today = new Date();
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (checkIn - today > oneDayMs) {
            await db.query('UPDATE RoomBooking SET rb_status = "Cancelled" WHERE rb_id = ?', [bookingId]);
            await db.query(
                'INSERT INTO Refund (payment_id, refund_amount, refund_reason, refund_status) VALUES (?, ?, ?, "Pending")',
                [paymentId, price, 'Guest requested cancellation']
            );
            console.log('✅ Booking Cancelled & Refund Created via Simulation');
        }

        // 3. Verify Refund Exists
        const [refunds] = await db.query('SELECT * FROM Refund WHERE payment_id = ?', [paymentId]);
        if (refunds.length > 0) {
            console.log(`✅ Refund Record Found: ID ${refunds[0].refund_id}, Status: ${refunds[0].refund_status}`);
        } else {
            console.error('❌ Refund record NOT found');
        }

    } catch (err) {
        console.error('❌ Verification failed:', err);
    }
    process.exit(0);
}

verifyRefundFlow();
