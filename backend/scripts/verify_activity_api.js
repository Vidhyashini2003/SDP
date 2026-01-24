const db = require('../config/db');

async function verifyActivityBookings() {
    console.log('--- Verifying Activity Bookings Query ---');
    try {
        const [bookings] = await db.query(
            `SELECT ab.*, g.guest_name, g.guest_phone, a.activity_name, a.activity_price_per_hour
             FROM ActivityBooking ab 
             JOIN Guest g ON ab.guest_id = g.guest_id 
             JOIN Activity a ON ab.activity_id = a.activity_id
             ORDER BY ab.ab_start_time DESC`
        );
        console.log(`✅ Fetched ${bookings.length} activity bookings.`);
        if (bookings.length > 0) {
            console.log('Sample Status:', bookings[0].ab_status);
        } else {
            console.log('⚠️ No bookings found. Consider creating mock data.');
        }
    } catch (err) {
        console.error('❌ Query failed:', err);
    }
    process.exit(0);
}

verifyActivityBookings();
