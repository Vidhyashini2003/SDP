const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, '../migrations/add_driver_address_column.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Remove "USE HotelManagement;" because db config might already select it, 
        // or we run it as a query. But typical mysql2 run might fail with multiple statements if not configured.
        // Let's just run the ALTER command directly or split it.

        // Simpler approach for this specific migration:
        const connection = await db.getConnection();
        console.log('Connected to database...');

        try {
            // check if column exists first to avoid error
            const [rows] = await connection.query("SHOW COLUMNS FROM Driver LIKE 'driver_address'");
            if (rows.length > 0) {
                console.log('Column driver_address already exists. Skipping.');
            } else {
                console.log('Adding driver_address column...');
                await connection.query("ALTER TABLE Driver ADD COLUMN driver_address TEXT");
                console.log('Column added successfully.');
            }
        } catch (err) {
            console.error('Error executing query:', err);
        } finally {
            connection.release();
        }

        process.exit();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
