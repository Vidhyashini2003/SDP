const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkIds() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        console.log('--- foodorder ---');
        const [orders] = await connection.execute('SELECT order_id FROM foodorder');
        console.log(orders);

        console.log('--- orderitem ---');
        const [items] = await connection.execute('SELECT order_item_id, order_id FROM orderitem');
        console.log(items);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkIds();
