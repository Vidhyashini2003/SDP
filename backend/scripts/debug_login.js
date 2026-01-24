const axios = require('axios');

async function testLogin() {
    try {
        console.log('Attempting login...');
        const response = await axios.post('http://localhost:5000/api/auth/admin/login', {
            admin_email: 'admin01@gmail.com',
            admin_password: 'admin01'
        });
        console.log('Login successful:', response.data);
    } catch (error) {
        console.error('Login failed:', error.response ? error.response.data : error.message);
    }
}

testLogin();
