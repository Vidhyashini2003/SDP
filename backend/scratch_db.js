require('dotenv').config({ path: './.env' });
const db = require('./config/db');

async function alterTable() {
    const connection = await db.getConnection();
    try {
        await connection.query("ALTER TABLE quickride DROP COLUMN dropoff_location;");
        console.log("dropoff_location removed.");

        // Let's verify pickup_location exists
        const [rows] = await connection.query("SHOW COLUMNS FROM quickride");
        console.log("Columns:", rows.map(r => r.Field));
    } catch (e) {
        console.error(e);
    } finally {
        connection.release();
        process.exit();
    }
}

alterTable();
