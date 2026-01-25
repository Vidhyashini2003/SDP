// axios removed
const db = require('../config/db');

async function testOrders() {
    try {
        console.log('Testing /api/kitchen/orders response...');
        // Mock a query directly since we can't easily auth in script without extensive setup
        // But wait, I can just use the controller logic directly if I mock req/res!

        // Let's just run a DB query that mirrors the controller to see if guest_id is there
        const [rows] = await db.query(
            `SELECT fo.order_id, fo.guest_id, fo.order_status 
             FROM foodorder fo
             JOIN orderitem oi ON fo.order_id = oi.order_id
             LIMIT 1`
        );
        console.log('DB Query Result (Direct):', rows[0]);

        if (rows[0] && rows[0].guest_id) {
            console.log('✅ DB returns guest_id correctly.');
        } else {
            console.log('❌ DB query missing guest_id?');
        }

    } catch (e) {
        console.error(e);
    }
    process.exit();
}

testOrders();
