const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testUserHistory() {
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

        // Let's test with user_id 1004 (Kamal Perera) from the screenshot
        const userId = 1004;
        console.log(`Calling User History endpoint for user_id ${userId}...`);
        const historyRes = await fetch(`http://localhost:5000/api/reports/user-history/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const historyData = await historyRes.json();
        if (!historyRes.ok) throw new Error(historyData.error || 'Fetch user history failed');

        console.log('✅ User History endpoint call successful (Status 200)');
        console.log('History data preview:');
        console.table(historyData.slice(0, 5));

    } catch (err) {
        console.error('❌ Test failed:', err.message);
    }
}

testUserHistory();
