const fs = require('fs');
const mysql = require('mysql2/promise');

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
        let out = '';
        for (const table of tables) {
            const [cols] = await conn.query(`SHOW COLUMNS FROM ${table}`);
            out += `${table} columns: ${cols.map(c => c.Field).join(', ')}\n`;
        }
        await conn.end();
        fs.writeFileSync('cols.txt', out, 'utf8');
        console.log('Done writing cols.txt');
    } catch (e) {
        console.log(e);
    }
}
checkDb();
