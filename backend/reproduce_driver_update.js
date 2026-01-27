const db = require('./config/db');

// Config
const API_URL = 'http://localhost:5000/api';
const EMAIL = 'rajesh.driver@hotel.com';
const PASSWORD = 'Driver123';

async function testDriverUpdate() {
    try {
        console.log('1. Logging in as driver...');
        const loginPayload = JSON.stringify({ email: EMAIL, password: PASSWORD });

        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: loginPayload
        });

        if (!loginRes.ok) {
            const err = await loginRes.text();
            throw new Error(`Login failed: ${loginRes.status} ${err}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        const userId = loginData.user.id;
        console.log('Login successful. Token obtained. UserId:', userId);

        console.log('2. Updating profile with new address...');
        const newAddress = '123 Test Street, Colombo, Sri Lanka ' + Date.now();

        const updatePayload = JSON.stringify({
            name: 'Rajesh Kumar',
            email: EMAIL,
            phone: '0771234567',
            address: newAddress,
            role: 'driver' // This triggers the driver specific update path in authController
        });

        const updateRes = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: updatePayload
        });

        if (!updateRes.ok) {
            const err = await updateRes.text();
            throw new Error(`Update failed: ${updateRes.status} ${err}`);
        }
        console.log('Profile update request sent.');

        console.log('3. Verifying update in database...');
        const connection = await db.getConnection();
        // Join with users or just select by user_id since we have it
        const [rows] = await connection.query('SELECT driver_address FROM Driver WHERE user_id = ?', [userId]);
        connection.release();

        if (rows.length > 0 && rows[0].driver_address === newAddress) {
            console.log('SUCCESS: proper address found in database:', rows[0].driver_address);
        } else {
            console.error('FAILURE: Address not updated in database. Found:', rows[0] ? rows[0].driver_address : 'No record');
            process.exit(1);
        }

        process.exit(0);

    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    }
}

testDriverUpdate();
