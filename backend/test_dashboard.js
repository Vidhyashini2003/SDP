const axios = require('axios');

async function testDashboardStats() {
    try {
        console.log('Testing dashboard stats endpoint...\n');

        // You'll need a valid JWT token for this endpoint
        // For now, let's just check if the server is responsive
        const response = await axios.get('http://localhost:5000/api/admin/dashboard-stats', {
            headers: {
                // Add auth token if you have one, or create a test without auth
            },
            validateStatus: function (status) {
                return status < 500; // Resolve only if the status code is less than 500
            }
        });

        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));

        if (response.status === 200) {
            console.log('\n✅ Dashboard stats endpoint working correctly!');
        } else if (response.status === 401) {
            console.log('\n⚠️  Endpoint requires authentication (this is expected)');
            console.log('Database query should work now, just need valid token to test');
        }

    } catch (error) {
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testDashboardStats();
