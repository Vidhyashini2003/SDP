/**
 * Quick test to verify room and activity booking detection
 * This will test if rooms/activities with active bookings show the warning
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testBookingDetection() {
    console.log('🧪 Testing Booking Detection for Rooms and Activities\n');

    try {
        // First, login as receptionist to get auth token
        console.log('1️⃣  Logging in as receptionist...');
        const loginRes = await axios.post(`${API_BASE}/auth/login`, {
            email: 'recep01@hotel.com',
            password: 'password'
        });

        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('✅ Logged in successfully\n');

        // Test Room 65 (has booking from 2026-01-27 to 2026-01-28)
        console.log('2️⃣  Testing Room 65 status change (should have active booking)...');
        try {
            await axios.put(
                `${API_BASE}/receptionist/rooms/65/status`,
                { status: 'Maintenance' },
                config
            );
            console.log('❌ ERROR: Room status updated without checking bookings!\n');
        } catch (error) {
            if (error.response?.data?.requiresConfirmation) {
                console.log(`✅ SUCCESS: Detected ${error.response.data.activeBookingsCount} active booking(s)!`);
                console.log('   System correctly requires cancellation reason.\n');
            } else {
                console.log('❌ ERROR:', error.response?.data?.error || error.message, '\n');
            }
        }

        // Test Activity (if any exist)
        console.log('3️⃣  Testing Activity status change...');
        const activitiesRes = await axios.get(`${API_BASE}/receptionist/activities`, config);
        if (activitiesRes.data.length > 0) {
            const firstActivity = activitiesRes.data[0];
            try {
                await axios.put(
                    `${API_BASE}/receptionist/activities/${firstActivity.activity_id}/status`,
                    { status: 'Unavailable' },
                    config
                );
                console.log('✅ Activity status updated (no active bookings)\n');
            } catch (error) {
                if (error.response?.data?.requiresConfirmation) {
                    console.log(`✅ SUCCESS: Detected ${error.response.data.activeBookingsCount} active booking(s)!`);
                    console.log('   System correctly requires cancellation reason.\n');
                } else {
                    console.log('❌ ERROR:', error.response?.data?.error || error.message, '\n');
                }
            }
        } else {
            console.log('⚠️  No activities found to test.\n');
        }

        console.log('✅ All tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response?.data) {
            console.error('Response:', error.response.data);
        }
    }
}

// Run the test
testBookingDetection();
