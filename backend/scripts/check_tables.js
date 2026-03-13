const db = require('../config/db');

async function checkTables() {
    try {
        console.log('Checking database tables...\n');

        // Get all tables
        const [tables] = await db.query('SHOW TABLES');

        console.log('Available Tables:');
        tables.forEach(table => {
            console.log(`  - ${Object.values(table)[0]}`);
        });

        // Find menu-related table
        const menuTable = tables.find(t =>
            Object.values(t)[0].toLowerCase().includes('menu') ||
            Object.values(t)[0].toLowerCase().includes('food') ||
            Object.values(t)[0].toLowerCase().includes('item')
        );

        if (menuTable) {
            const tableName = Object.values(menuTable)[0];
            console.log(`\nFound menu table: ${tableName}`);

            const [columns] = await db.query(`DESCRIBE ${tableName}`);
            console.log('\nColumns:');
            columns.forEach(col => {
                console.log(`  - ${col.Field} (${col.Type})`);
            });

            const [items] = await db.query(`SELECT * FROM ${tableName} LIMIT 3`);
            console.log('\nSample Items:');
            console.log(items);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkTables();
