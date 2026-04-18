async function checkUserReportFields() {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin01@gmail.com', password: '@Vidhy117' })
    });
    const { token } = await loginRes.json();
    const headers = { Authorization: `Bearer ${token}` };

    const res = await fetch('http://localhost:5000/api/reports/users', { headers });
    const users = await res.json();
    console.log('User report fields (first user):', Object.keys(users[0]));
    console.log('First user:', users[0]);
}
checkUserReportFields();
