const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPayment() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        console.log('--- payment table ---');
        const [payments] = await connection.execute('SELECT * FROM payment');
        console.log(payments);

        console.log('--- checking foreign key dependencies for payment_id ---');
        // This is a common way to check for FKs in MySQL
        const [fks] = await connection.execute(`
            SELECT TABLE_NAME, COLUMN_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE REFERENCED_TABLE_NAME = 'payment' 
            AND REFERENCED_COLUMN_NAME = 'payment_id'
        `);
        console.log('Tables referencing payment.payment_id:', fks);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkPayment();
