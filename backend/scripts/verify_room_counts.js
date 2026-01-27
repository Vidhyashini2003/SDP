const db = require('../config/db');

async function countRooms() {
    try {
        console.log('Counting rooms by type in DB...');
        const [counts] = await db.query(`
            SELECT room_type, COUNT(*) as count 
            FROM room 
            WHERE room_status = 'Available' 
            GROUP BY room_type
        `);
        console.table(counts);

        console.log('\nChecking if any rooms are NOT Available:');
        const [unavailable] = await db.query(`SELECT * FROM room WHERE room_status != 'Available'`);
        if (unavailable.length === 0) {
            console.log('All rooms are marked Available.');
        } else {
            console.table(unavailable);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

countRooms();
