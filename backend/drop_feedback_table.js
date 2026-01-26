
const db = require('./config/db');

async function dropTable() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await db.getConnection();

        console.log("Dropping table 'feedback'...");
        await connection.query("DROP TABLE IF EXISTS feedback");

        console.log("Table dropped successfully.");

    } catch (error) {
        console.error('Drop failed:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

dropTable();
