const db = require('../config/db');

async function verifyCancelFlow() {
    console.log('--- Verifying Valid Cancellation Flow ---');
    try {
        // 1. Get Guest and Room
        const [guests] = await db.query('SELECT guest_id FROM Guest LIMIT 1');
        const [rooms] = await db.query('SELECT room_id, room_price_per_day FROM Room LIMIT 1');

        if (!guests.length || !rooms.length) {
            console.log('❌ Setup failed: No guest or room found');
            return;
        }

        const guestId = guests[0].guest_id;
        const roomId = rooms[0].room_id;
        const price = rooms[0].room_price_per_day;

        // 2. Create Future Booking (5 days from now)
        // Ensure we explicitly use the correct columns as per the screenshot
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 5);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 1);

        console.log(`Creating booking for ${checkIn.toISOString().split('T')[0]}`);

        const [bookingRes] = await db.query(
            'INSERT INTO RoomBooking (guest_id, room_id, rb_checkin, rb_checkout, rb_total_amount, rb_status) VALUES (?, ?, ?, ?, ?, "Booked")',
            [guestId, roomId, checkIn, checkOut, price]
        );
        const bookingId = bookingRes.insertId;
        console.log(`✅ Booking Created: ID ${bookingId}`);

        // 3. Create Payment
        await db.query(
            'INSERT INTO Payment (payment_amount, payment_status, service_type, service_id) VALUES (?, "Success", "Room", ?)',
            [price, bookingId]
        );
        console.log('✅ Payment Simualted');

        // 4. Simulate Cancellation Logic (from controller)
        console.log('Simulating Cancellation...');

        // Fetch it back to verify date logic matches controller
        const [b] = await db.query('SELECT * FROM RoomBooking WHERE rb_id = ?', [bookingId]);
        const booking = b[0];

        const checkInDate = new Date(booking.rb_checkin);
        const today = new Date();
        const oneDayMs = 24 * 60 * 60 * 1000;

        console.log(`Check-in: ${checkInDate}, Today: ${today}, Diff: ${checkInDate - today}`);

        if (checkInDate - today < oneDayMs) {
            console.error('❌ Validation Failed: Date too close (This should NOT happen for +5 days)');
        } else {
            // Update status
            await db.query('UPDATE RoomBooking SET rb_status = "Cancelled" WHERE rb_id = ?', [bookingId]);
            console.log('✅ Booking Cancelled in DB');

            // Insert Refund
            await db.query(
                'INSERT INTO Refund (payment_id, refund_amount, refund_reason, refund_status) VALUES ((SELECT payment_id FROM Payment WHERE service_id = ? AND service_type="RoomBooking" LIMIT 1), ?, ?, "Pending")',
                [bookingId, price, 'Guest requested cancellation']
            );
            console.log('✅ Refund Record Created');
        }

    } catch (err) {
        console.error('❌ Verification failed:', err);
    }
    process.exit(0);
}

verifyCancelFlow();
