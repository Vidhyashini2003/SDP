const db = require('../config/db');

async function checkLatestBooking() {
    try {
        const [roomBookings] = await db.query('SELECT * FROM roombooking ORDER BY rb_id DESC LIMIT 1');
        if (roomBookings.length === 0) {
            console.log('No room bookings found.');
            process.exit(0);
        }
        
        const latestRb = roomBookings[0];
        console.log('=== LATEST ROOM BOOKING ===');
        console.log(latestRb);
        
        const rbId = latestRb.rb_id;
        
        const [activities] = await db.query('SELECT * FROM activitybooking WHERE rb_id = ?', [rbId]);
        console.log('\n=== LINKED ACTIVITIES ===');
        console.log(activities);
        
        const [foodOrders] = await db.query('SELECT * FROM foodorder WHERE rb_id = ?', [rbId]);
        console.log('\n=== LINKED FOOD ORDERS ===');
        console.log(foodOrders);
        
        const [vehicles] = await db.query('SELECT * FROM hirevehicle WHERE rb_id = ?', [rbId]);
        console.log('\n=== LINKED VEHICLES ===');
        console.log(vehicles);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkLatestBooking();
