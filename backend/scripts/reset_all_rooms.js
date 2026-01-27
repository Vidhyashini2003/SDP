const db = require('../config/db');

async function resetRooms() {
    try {
        console.log('Resetting all rooms to Available...');
        const [result] = await db.query("UPDATE room SET room_status = 'Available'");
        console.log(`Successfully updated ${result.affectedRows} rooms to 'Available' status.`);
        process.exit();
    } catch (err) {
        console.error('Error updating rooms:', err);
        process.exit(1);
    }
}

resetRooms();
