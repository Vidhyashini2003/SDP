const db = require('../config/db');

const BASE_URL = 'http://localhost:5000/api';

async function verify() {
    console.log('--- E2E Verification: Dining Option ---');
    try {
        // 1. Generate unique user
        const email = `test_dinin_${Date.now()}@example.com`;
        const password = 'password123';

        console.log(`Registering guest: ${email}`);
        const regRes = await fetch(`${BASE_URL}/auth/guest/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                guest_name: 'Test Guest',
                guest_email: email,
                guest_password: password,
                guest_phone: '5555555555'
            })
        });
        if (!regRes.ok) throw new Error(`Register failed: ${regRes.statusText}`);

        // 2. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password,
                role: 'guest'
            })
        });
        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Got Token');

        // 3. Ensure a menu item exists
        await db.query('INSERT IGNORE INTO menuitem (item_id, item_name, item_price, item_availability) VALUES (999, "Test Kottu", 500, "Available")');

        // 4. Place Order with Dine-in
        const orderData = {
            items: [{ item_id: 999, quantity: 1 }],
            total_amount: 500,
            payment_method: 'Cash',
            dining_option: 'Dine-in'
        };

        console.log('Placing Order with dining_option: Dine-in');
        const orderRes = await fetch(`${BASE_URL}/guest/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        if (!orderRes.ok) {
            const errorText = await orderRes.text();
            throw new Error(`Order failed: ${orderRes.status} - ${errorText}`);
        }

        const orderResData = await orderRes.json();
        const orderId = orderResData.orderId;
        console.log(`Order Placed. ID: ${orderId}`);

        // 5. Verify DB
        const [rows] = await db.query('SELECT dining_option FROM foodorder WHERE order_id = ?', [orderId]);
        const actualOption = rows[0].dining_option;

        console.log(`DB Value for dining_option: '${actualOption}'`);

        if (actualOption === 'Dine-in') {
            console.log('✅ SUCCESS: Order saved correctly as Dine-in.');
        } else {
            console.error(`❌ FAILURE: Order saved as '${actualOption}'. Expected 'Dine-in'.`);
            process.exit(1);
        }

    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    }
    process.exit(0);
}

verify();
