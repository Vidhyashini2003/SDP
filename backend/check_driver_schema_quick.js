const db = require('./config/db');

async function checkSchema() {
    try {
        const [columns] = await db.query('DESCRIBE Driver');
        console.log('Driver Table Schema:', columns);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSchema();
