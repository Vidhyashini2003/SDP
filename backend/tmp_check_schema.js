const pool = require('./config/db');

async function checkSchema() {
    try {
        const [rows] = await pool.execute("DESCRIBE Users");
        console.log('Users Schema:', rows);
        process.exit(0);
    } catch (error) {
        console.error('Schema check failed:', error);
        process.exit(1);
    }
}

checkSchema();
