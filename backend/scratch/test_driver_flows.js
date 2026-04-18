async function testDriverFlows() {
    console.log('--- Starting Driver Workflow Tests ---');
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'driver01@gmail.com', password: '@Vidhy117' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        const headers = { Authorization: `Bearer ${token}` };

        const requestsRes = await fetch('http://localhost:5000/api/driver/requests', { headers });
        const requestsData = await requestsRes.json();
        console.log(`✅ Fetched Hire Requests: ${requestsData.length} requests found`);

        for (const reqToAccept of requestsData) {
            console.log(`Attempting to accept request ID: ${reqToAccept.id}, Type: ${reqToAccept.request_type}`);
            try {
                const acceptRes = await fetch(`http://localhost:5000/api/driver/requests/${reqToAccept.id}/accept?type=${reqToAccept.request_type}`, { method: 'POST', headers });
                const acceptData = await acceptRes.json();
                if (!acceptRes.ok) throw new Error(JSON.stringify(acceptData));
                console.log(`✅ Accepted request successfully:`, acceptData);
            } catch (acceptErr) {
                console.error(`❌ Failed to accept request:`, acceptErr.message);
            }
        }

        // Fetch Trips to see if they were added
        const tripsRes = await fetch('http://localhost:5000/api/driver/trips', { headers });
        const tripsData = await tripsRes.json();
        console.log(`✅ Fetched Trips: ${tripsData.length} trips found`);
        
        // Loop through trips and try to complete one of them
        for (const trip of tripsData) {
            if (trip.vb_status !== 'Completed') {
                console.log(`Attempting to complete trip ID: ${trip.vb_id || trip.trip_id}, Type: ${trip.type}`);
                try {
                    const compRes = await fetch(`http://localhost:5000/api/driver/trips/${trip.vb_id || trip.trip_id}/status?type=${trip.type}`, { 
                        method: 'PUT', 
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'Completed' })
                    });
                    const compData = await compRes.json();
                    if (!compRes.ok) throw new Error(JSON.stringify(compData));
                    console.log(`✅ Completed trip successfully:`, compData);
                } catch (compErr) {
                    console.error(`❌ Failed to complete trip:`, compErr.message);
                }
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testDriverFlows();
