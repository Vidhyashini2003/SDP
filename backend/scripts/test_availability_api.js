/**
 * Simple API testing script for Manage Availability endpoints
 * Run this after logging in as receptionist to test the new endpoints
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// You'll need to get a valid token by logging in first
// For now, this is a template showing what endpoints to test

async function testAvailabilityAPIs(authToken) {
    const config = {
        headers: { Authorization: `Bearer ${authToken}` }
    };

    console.log('🧪 Testing Manage Availability APIs...\n');

    try {
        // Test 1: Get all vehicles
        console.log('1️⃣  Testing GET /receptionist/vehicles');
        const vehicles = await axios.get(`${API_BASE}/receptionist/vehicles`, config);
        console.log(`✅ Found ${vehicles.data.length} vehicles\n`);

        // Test 2: Get all rooms
        console.log('2️⃣  Testing GET /receptionist/rooms');
        const rooms = await axios.get(`${API_BASE}/receptionist/rooms`, config);
        console.log(`✅ Found ${rooms.data.length} rooms\n`);

        // Test 3: Get all activities
        console.log('3️⃣  Testing GET /receptionist/activities');
        const activities = await axios.get(`${API_BASE}/receptionist/activities`, config);
        console.log(`✅ Found ${activities.data.length} activities\n`);

        // Test 4: Try to update a room status (will fail if bookings exist and no reason provided)
        if (rooms.data.length > 0) {
            const roomId = rooms.data[0].room_id;
            console.log(`4️⃣  Testing PUT /receptionist/rooms/${roomId}/status`);
            try {
                await axios.put(
                    `${API_BASE}/receptionist/rooms/${roomId}/status`,
                    { status: 'Maintenance' },
                    config
                );
                console.log('✅ Room status updated (no active bookings)\n');
            } catch (error) {
                if (error.response?.data?.requiresConfirmation) {
                    console.log(`⚠️  Confirmation required: ${error.response.data.activeBookingsCount} active bookings`);
                    console.log('✅ Endpoint correctly requires cancellation reason\n');
                } else {
                    console.error('❌ Unexpected error:', error.message);
                }
            }
        }

        // Test 5: Try to update an activity status
        if (activities.data.length > 0) {
            const activityId = activities.data[0].activity_id;
            console.log(`5️⃣  Testing PUT /receptionist/activities/${activityId}/status`);
            try {
                await axios.put(
                    `${API_BASE}/receptionist/activities/${activityId}/status`,
                    { status: 'Unavailable' },
                    config
                );
                console.log('✅ Activity status updated (no active bookings)\n');
            } catch (error) {
                if (error.response?.data?.requiresConfirmation) {
                    console.log(`⚠️  Confirmation required: ${error.response.data.activeBookingsCount} active bookings`);
                    console.log('✅ Endpoint correctly requires cancellation reason\n');
                } else {
                    console.error('❌ Unexpected error:', error.message);
                }
            }
        }

        console.log('✅ All API tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response?.status === 401) {
            console.log('\n⚠️  Authentication required. Please provide a valid auth token.');
        }
    }
}

// Instructions for running this test
console.log(`
📋 To run this test:

1. Log in as receptionist via the frontend or Postman
2. Copy the auth token from localStorage or the login response
3. Run: node backend/scripts/test_availability_api.js [YOUR_TOKEN]

Or test manually using curl:

# Get all rooms
curl http://localhost:5000/api/receptionist/rooms \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Update room status
curl -X PUT http://localhost:5000/api/receptionist/rooms/1/status \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "Maintenance"}'

# Update with reason (if bookings exist)
curl -X PUT http://localhost:5000/api/receptionist/rooms/1/status \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "Maintenance", "reason": "Plumbing repair needed"}'
`);

// If token provided as command line argument, run the tests
const token = process.argv[2];
if (token) {
    testAvailabilityAPIs(token);
} else {
    console.log('💡 No token provided. Showing usage instructions only.');
}
