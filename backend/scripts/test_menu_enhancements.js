const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testMenuEnhancements() {
    try {
        console.log('Logging in to get token...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin01@gmail.com', // Admin can also manage menu
                password: '@Vidhy117'
            })
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.error || 'Login failed');

        const token = loginData.token;
        console.log('Login successful.');

        // 1. Add Menu Item with Image and Category
        console.log('Adding new menu item...');
        const addRes = await fetch('http://localhost:5000/api/chef/menu', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                item_name: 'Test Gourmet Burger',
                item_price: 1500,
                item_availability: 'Available',
                item_image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
                meal_type: 'Lunch',
                item_category: 'Burgers'
            })
        });

        const addData = await addRes.json();
        if (!addRes.ok) throw new Error(addData.error || 'Add item failed');
        console.log('✅ Menu item added successfully');

        // 2. Fetch all menu items to find the ID
        const listRes = await fetch('http://localhost:5000/api/chef/menu', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const menu = await listRes.json();
        const testItem = menu.find(i => i.item_name === 'Test Gourmet Burger');
        if (!testItem) throw new Error('Could not find added test item');
        console.log('✅ Found test item with ID:', testItem.item_id);

        // 3. Delete the Menu Item
        console.log(`Deleting menu item ${testItem.item_id}...`);
        const delRes = await fetch(`http://localhost:5000/api/chef/menu/${testItem.item_id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const delData = await delRes.json();
        if (!delRes.ok) throw new Error(delData.error || 'Delete item failed');
        console.log('✅ Menu item deleted successfully');

    } catch (err) {
        console.error('❌ Test failed:', err.message);
    }
}

testMenuEnhancements();
