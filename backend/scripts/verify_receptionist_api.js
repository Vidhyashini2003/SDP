const db = require('../config/db');

async function verifyReceptionistBookings() {
    console.log('--- Verifying Receptionist Room Bookings Query ---');

    try {
        console.log('Executing getAllRoomBookings query...');
        const [bookings] = await db.query(
            `SELECT rb.*, g.guest_name, g.guest_phone, r.room_type, r.room_price_per_day
             FROM RoomBooking rb 
             JOIN Guest g ON rb.guest_id = g.guest_id 
             JOIN Room r ON rb.room_id = r.room_id
             ORDER BY rb.rb_checkin DESC`
        );

        console.log(`✅ Query successful. Fetched ${bookings.length} bookings.`);
        if (bookings.length > 0) {
            console.log('Sample Booking:', bookings[0]);
            if (bookings[0].guest_phone !== undefined) {
                console.log('✅ Guest phone field is present.');
            } else {
                console.error('❌ Guest phone field is MISSING.');
            }
        } else {
            console.log('⚠️ No bookings found to verify fields. Ensure mock data exists.');
        }

    } catch (err) {
        console.error('❌ Query verification failed:', err);
    }

    process.exit(0);
}

verifyReceptionistBookings();
