const db = require('../config/db');

async function showColumns() {
    try {
        const [columns] = await db.query('DESCRIBE menuitem');

        console.log('Columns in menuitem table:');
        columns.forEach((col, i) => {
            console.log(`${i + 1}. ${col.Field} - ${col.Type}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

showColumns();
