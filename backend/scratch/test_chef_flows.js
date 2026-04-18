async function testChefFlows() {
    console.log('--- Starting Chef Workflow Tests ---');
    try {
        // 1. Login
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'chef01@gmail.com', password: '@Vidhy117' })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(JSON.stringify(loginData));
        const token = loginData.token;
        console.log('✅ Login successful');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Fetch Menu
        const menuRes = await fetch('http://localhost:5000/api/chef/menu', { headers });
        const menuData = await menuRes.json();
        console.log(`✅ Fetched Menu: ${menuData.length} items found`);

        // 3. Fetch Orders
        const ordersRes = await fetch('http://localhost:5000/api/chef/orders', { headers });
        const ordersData = await ordersRes.json();
        console.log(`✅ Fetched Orders: ${ordersData.length} orders found`);

        // 4. Test order state transitions if there are any pending orders
        for (const order of ordersData) {
            console.log(`Order ID: ${order.order_id}, Status: ${order.order_status}`);
            if (order.order_status === 'Pending') {
                console.log(`Attempting to mark order ${order.order_id} as Preparing...`);
                try {
                    const startRes = await fetch(`http://localhost:5000/api/chef/orders/${order.order_id}/start-cooking`, {
                        method: 'PUT',
                        headers: { ...headers, 'Content-Type': 'application/json' }
                    });
                    const startData = await startRes.json();
                    if (!startRes.ok) throw new Error(JSON.stringify(startData));
                    console.log(`✅ Started cooking order ${order.order_id}`);
                } catch (e) {
                    console.error(`❌ Failed to start cooking order:`, e.message);
                }
            }
        }

        // 5. Fetch Damages
        const damagesRes = await fetch('http://localhost:5000/api/chef/damages', { headers });
        const damagesData = await damagesRes.json();
        console.log(`✅ Fetched Damages: ${Array.isArray(damagesData) ? damagesData.length : 'unknown'} records found`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testChefFlows();
