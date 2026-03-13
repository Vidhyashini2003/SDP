const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testStaffEndpoint() {
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

        console.log('Calling staff endpoint...');
        const staffRes = await fetch('http://localhost:5000/api/admin/staff', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const staffData = await staffRes.json();
        if (!staffRes.ok) throw new Error(staffData.error || 'Fetch staff failed');

        console.log('✅ Staff endpoint call successful (Status 200)');
        console.log('Staff list preview:');
        console.table(staffData.slice(0, 5));

    } catch (err) {
        console.error('❌ Test failed:', err.message);
    }
}

testStaffEndpoint();
