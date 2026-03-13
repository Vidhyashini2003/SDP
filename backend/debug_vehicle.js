const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function debugVehicle() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'guest01@gmail.com',
            password: '@Vidhy117'
        });
        const token = loginRes.data.token;
        console.log('Token received.');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        console.log('2. Fetching active bookings...');
        const bookingsRes = await axios.get(`${BASE_URL}/guest/bookings/active`, config);
        const activeBookings = bookingsRes.data.bookings;
        
        if (!activeBookings || activeBookings.length === 0) {
            console.log('No active bookings found for this guest.');
            return;
        }
        
        const rb_id = activeBookings[0].rb_id;
        console.log(`Using rb_id: ${rb_id}`);

        console.log('3. Fetching available vehicles...');
        const vehiclesRes = await axios.get(`${BASE_URL}/bookings/vehicles/available`, {
            ...config,
            params: { date: '2026-04-23', days: 1 }
        });
        const vehicles = vehiclesRes.data;
        
        if (!vehicles || vehicles.length === 0) {
            console.log('No vehicles available.');
            return;
        }

        const vehicle_id = vehicles[0].vehicle_id;
        console.log(`Using vehicle_id: ${vehicle_id}`);

        console.log('4. Attempting to create vehicle booking...');
        try {
            const payload = {
                vehicle_id: vehicle_id,
                vb_date: '2026-04-23',
                vb_days: 1,
                rb_id: rb_id.toString() // Mimic frontend string ID
            };
            console.log('Payload:', payload);
            const response = await axios.post(`${BASE_URL}/bookings/vehicles`, payload, config);
            console.log('SUCCESS:', response.data);
        } catch (err) {
            console.log('FAILURE:', err.response ? err.response.data : err.message);
        }

    } catch (error) {
        console.error('Debug script error:', error.message);
    }
}

debugVehicle();
