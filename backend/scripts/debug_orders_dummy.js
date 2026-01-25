const axios = require('axios');

async function debugOrders() {
    try {
        // Login as kitchen staff to get token
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'kitstaff01@example.com', // Assuming this exists or I should check seeds. 
            // Better to use a known user or just check the public/protected logic.
            // Actually I'll just skip auth for now if I can or check specific DB output directly.
            password: 'password123',
            role: 'kitchen'
        });
        const token = loginRes.data.token;

        const res = await axios.get('http://localhost:5000/api/kitchen/orders', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Order keys:', Object.keys(res.data[0]));
        console.log('Sample Order:', JSON.stringify(res.data[0], null, 2));
    } catch (err) {
        console.error(err.message);
    }
}
// debugOrders();
// Since I can't easily run axios from node without installing it in the script folder or ensuring it's in node_modules,
// I will just query the DB directly to see if the controller query corresponds to what I expect.
// Actually checking the file I just edited is safer.
// I will rely on reading the file content I just wrote.
