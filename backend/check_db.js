const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config({ path: './.env' });

async function check() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Kayal2003',
            database: process.env.DB_NAME || 'HotelManagement',
            port: process.env.DB_PORT || 3308
        });

        let output = '';
        
        const tables = ['foodorder', 'orderitem', 'activitybooking', 'vehiclebooking', 'roombooking'];
        
        for (const table of tables) {
            output += `--- ${table} columns ---\n`;
            const [columns] = await connection.query(`DESCRIBE ${table}`);
            output += JSON.stringify(columns, null, 2) + '\n\n';
        }

        fs.writeFileSync('schema_output.txt', output);
        console.log('Schema written to schema_output.txt');

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

check();
