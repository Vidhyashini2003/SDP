const db = require('../config/db');

async function verifyFoodOrder() {
    console.log('--- Verifying Food Order Placement ---');
    try {
        // 1. Get a guest
        const [guests] = await db.query('SELECT guest_id FROM Guest LIMIT 1');
        if (guests.length === 0) {
            console.log('⚠️ No guests found. Cannot verify.');
            return;
        }
        const guestId = guests[0].guest_id;
        console.log(`Using Guest ID: ${guestId}`);

        // 2. Get a menu item
        const [menuItems] = await db.query('SELECT * FROM MenuItem LIMIT 1');
        if (menuItems.length === 0) {
            console.log('⚠️ No menu items found. Creating one...');
            await db.query('INSERT INTO MenuItem (item_name, item_price, item_availability) VALUES ("Test Item", 100.00, "Available")');
            // Re-fetch
        }
        const [items] = await db.query('SELECT * FROM MenuItem LIMIT 1');
        const item = items[0];
        console.log(`Using Menu Item: ${item.item_name} (ID: ${item.item_id}, Price: ${item.item_price})`);

        // 3. Simulate Order Payload
        const payload = {
            items: [
                {
                    item_id: item.item_id,
                    quantity: 2,
                    price: item.item_price
                }
            ],
            total_amount: item.item_price * 2,
            payment_method: 'Cash'
        };

        // 4. Insert into DB (Simulating controller logic)
        console.log('Simulating Controller Logic...');

        // Insert Order
        const [orderRes] = await db.query(
            'INSERT INTO foodorder (guest_id, total_amount, payment_method, order_status) VALUES (?, ?, ?, "Pending")',
            [guestId, payload.total_amount, payload.payment_method]
        );
        const orderId = orderRes.insertId;
        console.log(`✅ Order Created: ID ${orderId}`);

        // Insert Order Items
        const orderItemsValues = payload.items.map(i => [orderId, i.item_id, i.quantity, i.price]);
        await db.query(
            'INSERT INTO orderitem (order_id, item_id, quantity, item_price) VALUES ?',
            [orderItemsValues]
        );
        console.log('✅ Order Items Created');

    } catch (err) {
        console.error('❌ Verification failed:', err);
    }
    process.exit(0);
}

verifyFoodOrder();
