const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function check() {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Kayal2003',
            database: process.env.DB_NAME || 'HotelManagement',
            port: 3308
        });

        let output = '';

        const [oiCols] = await conn.query('DESCRIBE orderitem');
        output += '--- orderitem ---\n';
        oiCols.forEach(c => {
            output += `${c.Field} | ${c.Type} | ${c.Null} | ${c.Key} | ${c.Default}\n`;
        });

        const [foCols] = await conn.query('DESCRIBE foodorder');
        output += '\n--- foodorder ---\n';
        foCols.forEach(c => {
            output += `${c.Field} | ${c.Type} | ${c.Null} | ${c.Key} | ${c.Default}\n`;
        });

        const [oiSample] = await conn.query('SELECT * FROM orderitem ORDER BY order_item_id DESC LIMIT 1');
        output += '\n--- orderitem sample ---\n';
        if (oiSample.length > 0) {
            Object.keys(oiSample[0]).forEach(key => {
                output += `${key}: ${oiSample[0][key]}\n`;
            });
        }

        fs.writeFileSync('output_debug_v2.txt', output);
        await conn.end();
        console.log('Done.');
    } catch (err) {
        console.error('Error:', err);
    }
}
check();
