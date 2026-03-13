const db = require('../config/db');

async function checkMenuSchema() {
    try {
        console.log('Checking menu table schema...\n');

        // Get table structure
        const [columns] = await db.query('DESCRIBE menu');

        console.log('Menu Table Columns:');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });

        // Get sample data
        const [items] = await db.query('SELECT * FROM menu LIMIT 3');
        console.log('\nSample Menu Items:');
        items.forEach(item => {
            console.log(`  ${item.item_id}: ${item.item_name} - ${item.item_category}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkMenuSchema();
