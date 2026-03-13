const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testReportsEndpoint() {
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
        console.log('Login successful. Token obtained.');

        console.log('Calling User Reports endpoint...');
        const reportRes = await fetch('http://localhost:5000/api/reports/users?role=All', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const reportData = await reportRes.json();
        if (!reportRes.ok) throw new Error(reportData.error || 'Fetch users report failed');

        console.log('✅ User Reports endpoint call successful (Status 200)');
        console.log('Report data preview:');
        console.table(reportData.slice(0, 5));

    } catch (err) {
        console.error('❌ Test failed:', err.message);
    }
}

testReportsEndpoint();
