const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Kayal2003',
            database: process.env.DB_NAME || 'HotelManagement',
            port: 3308
        });

        console.log('Altering foodorder table...');
        await conn.query(`
            ALTER TABLE foodorder 
            MODIFY COLUMN order_status ENUM('Pending', 'Preparing', 'Prepared', 'Delivered', 'Cancelled') 
            DEFAULT 'Pending'
        `);
        console.log('✅ foodorder table updated successfully');

        await conn.end();
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
