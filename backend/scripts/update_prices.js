const db = require('../config/db');

async function updateRoomPrices() {
    try {
        console.log('🔄 Updating room prices...\n');

        // Update room prices
        await db.query("UPDATE room SET room_price_per_day = 15000 WHERE room_type = 'Suite'");
        console.log('✅ Updated Suite prices to Rs. 15,000');

        await db.query("UPDATE room SET room_price_per_day = 10000 WHERE room_type = 'Deluxe Room'");
        console.log('✅ Updated Deluxe Room prices to Rs. 10,000');

        await db.query("UPDATE room SET room_price_per_day = 8000 WHERE room_type = 'Double Bedroom with Sea View'");
        console.log('✅ Updated Double Bedroom with Sea View prices to Rs. 8,000');

        await db.query("UPDATE room SET room_price_per_day = 7000 WHERE room_type = 'Triple Bed with Sea View'");
        console.log('✅ Updated Triple Bed with Sea View prices to Rs. 7,000');

        await db.query("UPDATE room SET room_price_per_day = 6000 WHERE room_type = 'Double Bedroom without Sea View'");
        console.log('✅ Updated Double Bedroom without Sea View prices to Rs. 6,000');

        await db.query("UPDATE room SET room_price_per_day = 5000 WHERE room_type = 'Standard Room'");
        console.log('✅ Updated Standard Room prices to Rs. 5,000');

        // Display updated rooms
        const [rooms] = await db.query('SELECT room_id, room_number, room_type, room_price_per_day, room_status FROM room ORDER BY room_type');

        console.log('\n📊 Updated Room Prices:');
        console.log('─'.repeat(100));
        console.log('ID\tRoom Number\tRoom Type\t\t\t\tPrice/Day\tStatus');
        console.log('─'.repeat(100));

        rooms.forEach(room => {
            console.log(`${room.room_id}\t${room.room_number}\t\t${room.room_type.padEnd(35)}\tRs. ${room.room_price_per_day}\t${room.room_status}`);
        });

        console.log('\n✅ Room prices updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating room prices:', error);
        process.exit(1);
    }
}

updateRoomPrices();
