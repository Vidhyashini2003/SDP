const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkDb() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Kayal2003',
            port: 3308,
            database: 'hotelmanagement'
        });
        const tables = ['Receptionist', 'KitchenStaff', 'Driver', 'Guest'];
        for (const table of tables) {
            const [cols] = await conn.query(`SHOW COLUMNS FROM ${table}`);
            console.log(`${table} columns:`, cols.map(c => c.Field).join(', '));
        }
        await conn.end();
    } catch (e) {
        console.log(e);
    }
}
checkDb();
