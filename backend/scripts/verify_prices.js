const db = require('../config/db');

async function verifyPrices() {
    try {
        console.log('\n📊 Current Room Prices in Database:\n');

        const [rooms] = await db.query(`
            SELECT room_type, room_price_per_day, COUNT(*) as count 
            FROM room 
            GROUP BY room_type, room_price_per_day 
            ORDER BY room_type
        `);

        rooms.forEach(room => {
            console.log(`${room.room_type.padEnd(40)} Rs. ${room.room_price_per_day} (${room.count} rooms)`);
        });

        console.log('\n✅ All prices verified!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verifyPrices();
