const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testStaffHistory() {
    try {
        console.log('Logging in to get token...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin01@gmail.com',
                password: '@Vidhy117'
            })
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.error || 'Login failed');

        const token = loginData.token;
        console.log('Login successful.');

        const chefId = 1008;
        console.log(`Calling History endpoint for Chef (user_id ${chefId})...`);
        const chefRes = await fetch(`http://localhost:5000/api/reports/user-history/${chefId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const chefData = await chefRes.json();
        console.log('✅ Chef History successful');
        console.table(chefData.slice(0, 3));

        // Test with Driver Priyantha Jayasooriya (user_id 1009)
        const driverId = 1009;
        console.log(`Calling History endpoint for Driver (user_id ${driverId})...`);
        // Test filtered history for Chef (Food only, date range)
        console.log(`Calling Filtered History for Chef (type=Food, date range)...`);
        const chefFilteredRes = await fetch(`http://localhost:5000/api/reports/user-history/${chefId}?type=Food&startDate=2026-03-01&endDate=2026-03-15`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const chefFilteredData = await chefFilteredRes.json();
        console.log('✅ chef Filtered History successful');
        console.table(chefFilteredData);

    } catch (err) {
        console.error('❌ Test failed:', err.message);
    }
}

testStaffHistory();
