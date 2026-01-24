const db = require('../config/db');

async function checkTableStructure() {
    try {
        const [columns] = await db.query("SHOW COLUMNS FROM RoomBooking");
        console.log('RoomBooking Table Columns:');
        columns.forEach(col => console.log(col.Field));
    } catch (err) {
        console.error('Error fetching columns:', err);
    }
    process.exit(0);
}

checkTableStructure();
