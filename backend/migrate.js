const mysql = require('mysql2/promise');

async function migrate() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Kayal2003',
            port: 3308,
            database: 'hotelmanagement'
        });

        console.log('Adding first_name and last_name columns...');
        await conn.query('ALTER TABLE Users ADD COLUMN first_name VARCHAR(100) AFTER user_id');
        await conn.query('ALTER TABLE Users ADD COLUMN last_name VARCHAR(100) AFTER first_name');

        console.log('Migrating existing names...');
        // Split name into first_name and last_name based on the first space. 
        // If there's no space, last_name gets the same value or stays empty.
        await conn.query("UPDATE Users SET first_name = SUBSTRING_INDEX(name, ' ', 1), last_name = SUBSTRING(name, LENGTH(SUBSTRING_INDEX(name, ' ', 1)) + 2) WHERE name IS NOT NULL AND name != ''");
        
        // Handle cases where name didn't have a space or last_name is empty
        await conn.query("UPDATE Users SET last_name = first_name WHERE last_name = '' OR last_name IS NULL");

        console.log('Dropping old name column...');
        await conn.query('ALTER TABLE Users DROP COLUMN name');

        console.log('Migration successful!');
        await conn.end();
    } catch(e) {
        console.error('Migration failed:', e);
    }
}

migrate();
