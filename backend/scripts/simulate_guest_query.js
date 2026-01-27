const db = require('../config/db');

async function simulateQuery(email) {
    try {
        console.log(`Simulating Booking Fetch for email: ${email}`);

        // 1. Get User ID
        const [users] = await db.query('SELECT user_id, email FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            console.log('User not found!');
            return;
        }
        const userId = users[0].user_id;
        console.log(`User ID: ${userId}`);

        // 2. Run the EXACT query from guestController.js
        const query = `
            SELECT rb.rb_id, rb.rb_status, rb.rb_checkin as check_in_date, rb.rb_checkout as check_out_date, rb.rb_total_amount as total_price, r.room_type 
             FROM roombooking rb 
             JOIN room r ON rb.room_id = r.room_id 
             JOIN Guest g ON rb.guest_id = g.guest_id
             WHERE g.user_id = ? 
             ORDER BY rb.rb_checkin DESC
        `;

        const [results] = await db.query(query, [userId]);
        console.log(`Query Results Count: ${results.length}`);
        if (results.length > 0) {
            console.log('First Result:', results[0]);
        } else {
            console.log('No results found with this query.');

            // Debugging: Check where it fails
            console.log('--- Debugging JOINs ---');
            const [guestCheck] = await db.query('SELECT * FROM Guest WHERE user_id = ?', [userId]);
            console.log(`Guest entry for user ${userId}:`, guestCheck.length > 0 ? 'Found' : 'MISSING');

            if (guestCheck.length > 0) {
                const guestId = guestCheck[0].guest_id;
                console.log(`Guest ID: ${guestId}`);
                const [bookingCheck] = await db.query('SELECT * FROM roombooking WHERE guest_id = ?', [guestId]);
                console.log(`Bookings for Guest ID ${guestId}: ${bookingCheck.length}`);
                if (bookingCheck.length > 0) {
                    const roomId = bookingCheck[0].room_id;
                    const [roomCheck] = await db.query('SELECT * FROM room WHERE room_id = ?', [roomId]);
                    console.log(`Room ${roomId} exists:`, roomCheck.length > 0 ? 'Yes' : 'NO');
                }
            }
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

// Run for the user identified in Step 1
simulateQuery('guest03@gmail.com');
