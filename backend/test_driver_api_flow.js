const db = require('./config/db');

const API_URL = 'http://localhost:5000/api/auth';

async function testApiFlow() {
    try {
        console.log('1. Logging in...');
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'driver01@gmail.com',
                password: 'password123'
            })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful. OK.');

        console.log('2. Updating Profile via API...');
        const newAddr = 'API Test Address ' + Date.now();

        const updateRes = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'Driver One',
                email: 'driver01@gmail.com',
                phone: '0771234567',
                address: newAddr,
                nationality: 'Sri Lankan'
            })
        });

        if (!updateRes.ok) {
            throw new Error(`Update failed: ${updateRes.status} ${updateRes.statusText}`);
        }
        console.log('Update response OK.');

        console.log('3. Verifying in Database...');
        const connection = await db.getConnection();
        const [drivers] = await connection.query(
            'SELECT * FROM Driver WHERE user_id = (SELECT user_id FROM Users WHERE email = ?)',
            ['driver01@gmail.com']
        );

        if (drivers.length === 0) {
            console.log('FAILURE: Driver record not found.');
        } else {
            console.log('Driver Record Address:', drivers[0].driver_address);
            if (drivers[0].driver_address === newAddr) {
                console.log('SUCCESS: Address updated correctly via API.');
            } else {
                console.log('FAILURE: Address mismatch.');
                console.log('Expected:', newAddr);
                console.log('Actual:', drivers[0].driver_address);
            }
        }

        connection.release();
        process.exit();

    } catch (error) {
        console.error('API Test Failed:', error.message);
        process.exit(1);
    }
}

testApiFlow();
