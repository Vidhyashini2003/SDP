const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyDeps() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        const tables = [
            ['roombooking', 'rb_payment_id'],
            ['activitybooking', 'ab_payment_id'],
            ['hirevehicle', 'vb_payment_id'],
            ['refund', 'payment_id'],
            ['foodorder', 'payment_id']
        ];

        for (const [table, col] of tables) {
            const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table} WHERE ${col} = 2`);
            const [rows1] = await connection.execute(`SELECT COUNT(*) as count FROM ${table} WHERE ${col} = 1`);
            console.log(`Table ${table}: Count(ID=2) = ${rows[0].count}, Count(ID=1) = ${rows1[0].count}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

verifyDeps();
