const db = require('../config/db');

async function debugBooking() {
    try {
        console.log('Checking Booking ID 1...');
        const [booking] = await db.query('SELECT * FROM roombooking WHERE rb_id = 1');
        if (booking.length === 0) {
            console.log('Booking 1 not found in roombooking table.');
            return;
        }
        console.log('Booking found:', booking[0]);

        const roomId = booking[0].room_id;
        const guestId = booking[0].guest_id;

        console.log(`Checking Room ${roomId}...`);
        const [room] = await db.query('SELECT * FROM room WHERE room_id = ?', [roomId]);
        if (room.length === 0) {
            console.error(`ERROR: Room ${roomId} NOT FOUND in room table. This will cause the inner join to fail.`);
        } else {
            console.log('Room found:', room[0]);
        }

        console.log(`Checking Guest ${guestId}...`);
        const [guest] = await db.query('SELECT * FROM guest WHERE guest_id = ?', [guestId]);
        if (guest.length === 0) {
            console.error(`ERROR: Guest ${guestId} NOT FOUND in guest table. This will cause the inner join to fail.`);
        } else {
            console.log('Guest found:', guest[0]);
            const userId = guest[0].user_id;
            console.log(`Linked User ID: ${userId}`);

            const [user] = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
            if (user.length === 0) {
                console.error(`ERROR: User ${userId} NOT FOUND in users table.`);
            } else {
                console.log('User found:', user[0].email);
            }
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugBooking();
