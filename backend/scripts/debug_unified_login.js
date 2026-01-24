const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

async function testUnifiedLogin() {
    console.log('--- Testing Unified Login ---');

    // 1. Test Admin
    try {
        console.log('\nTesting Admin Login (admin01@gmail.com)...');
        const res = await axios.post(`${BASE_URL}/login`, {
            email: 'admin01@gmail.com',
            password: 'admin01'
        });
        console.log('✅ Admin Login Success:', res.data.user.role);
    } catch (err) {
        console.error('❌ Admin Login Failed:', err.response?.data?.error);
    }

    // 2. Test Guest
    try {
        console.log('\nTesting Guest Login (guest01@gmail.com)...');
        const res = await axios.post(`${BASE_URL}/login`, {
            email: 'guest01@gmail.com',
            password: 'guest01'
        });
        console.log('✅ Guest Login Success:', res.data.user.role);
    } catch (err) {
        console.error('❌ Guest Login Failed:', err.response?.data?.error);
    }

    // 3. Test Invalid
    try {
        console.log('\nTesting Invalid Login...');
        await axios.post(`${BASE_URL}/login`, {
            email: 'fake@gmail.com',
            password: 'wrong'
        });
    } catch (err) {
        console.log('✅ Invalid Login correctly failed:', err.response?.status === 401 ? '401 Unauthorized' : err.response?.status);
    }
}

testUnifiedLogin();
