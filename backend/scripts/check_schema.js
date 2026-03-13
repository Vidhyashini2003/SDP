const db = require('../config/db');

async function checkRoomSchema() {
    try {
        console.log('Checking room table schema...');

        // Get table structure
        const [columns] = await db.query('DESCRIBE room');

        console.log('\nColumn Names:');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });

        // Get one room to see actual data
        const [rooms] = await db.query('SELECT * FROM room LIMIT 1');
        console.log('\nSample Room Keys:', Object.keys(rooms[0]));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkRoomSchema();
