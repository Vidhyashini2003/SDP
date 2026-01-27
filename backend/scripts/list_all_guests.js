const db = require('../config/db');

async function listGuests() {
    try {
        console.log('Listing all registered guests:');
        const [rows] = await db.query(`
            SELECT u.user_id, u.name, u.email, g.guest_id 
            FROM Users u 
            JOIN Guest g ON u.user_id = g.user_id
        `);

        console.table(rows);

        console.log('\nListing all bookings and their owner Guest IDs:');
        const [bookings] = await db.query('SELECT rb_id, guest_id, rb_status FROM roombooking');
        console.table(bookings);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listGuests();
