const axios = require('axios');

async function reproduce() {
    try {
        // 1. Login
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'guest01@gmail.com',
            password: '@Vidhy117'
        });
        const token = loginRes.data.token;
        console.log('Logged in, token received');

        // 2. Try to book activity (outside of booking range to trigger the validation logic)
        // Room booking #5 is 2026-03-21 to 2026-03-22 (approx)
        const payload = {
            activity_id: 1, // Scuba Diving
            start_time: '2026-04-21T09:00:00.000Z',
            end_time: '2026-04-21T10:00:00.000Z',
            total_amount: 1500,
            rb_id: 5
        };

        console.log('Sending activity booking request...');
        try {
            const res = await axios.post('http://localhost:5000/api/bookings/activities', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Success:', res.data);
        } catch (error) {
            console.log('Error Status:', error.response?.status);
            console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
        }
    } catch (error) {
        console.error('Login or other error:', error.message);
    }
}

reproduce();
