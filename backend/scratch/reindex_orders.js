const mysql = require('mysql2/promise');
require('dotenv').config();

async function reindexOrders() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        console.log('--- Reindexing foodorder ---');
        await connection.execute('UPDATE foodorder SET order_id = 1 WHERE order_id = 9');
        await connection.execute('UPDATE foodorder SET order_id = 2 WHERE order_id = 10');
        await connection.execute('UPDATE foodorder SET order_id = 3 WHERE order_id = 11');

        console.log('--- Reindexing orderitem ---');
        await connection.execute('UPDATE orderitem SET order_item_id = 1, order_id = 1 WHERE order_item_id = 9');
        await connection.execute('UPDATE orderitem SET order_item_id = 2, order_id = 2 WHERE order_item_id = 10');
        await connection.execute('UPDATE orderitem SET order_item_id = 3, order_id = 3 WHERE order_item_id = 11');

        console.log('--- Resetting Auto-increment ---');
        await connection.execute('ALTER TABLE foodorder AUTO_INCREMENT = 4');
        await connection.execute('ALTER TABLE orderitem AUTO_INCREMENT = 4');

        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Reindexing complete successfully');

    } catch (err) {
        console.error('❌ Error during reindexing:', err);
    } finally {
        await connection.end();
    }
}

reindexOrders();
