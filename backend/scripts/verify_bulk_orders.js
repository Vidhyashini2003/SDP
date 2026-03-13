const axios = require('axios');

async function testBulkOrder() {
    const baseURL = 'http://localhost:5000/api/guest';
    // Note: This requires a valid token. In a real scenario, we'd log in.
    // For this verification, I'll check the database directly after manual testing 
    // or simulate if I had a token. 
    // Since I can't easily get a token here, I will check the database for the results 
    // of the implementation.
}

const mysql = require('mysql2/promise');
async function verifyDatabase() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Kayal2003',
            database: 'HotelManagement',
            port: 3308
        });

        console.log('--- Checking recent payments ---');
        const [payments] = await conn.query('SELECT * FROM payment ORDER BY payment_id DESC LIMIT 3');
        console.table(payments);

        console.log('\n--- Checking recent food orders ---');
        const [orders] = await conn.query('SELECT order_id, scheduled_date, meal_type, payment_id FROM foodorder ORDER BY order_id DESC LIMIT 5');
        console.table(orders);

        await conn.end();
    } catch (err) {
        console.error('Verification failed:', err);
    }
}

verifyDatabase();
