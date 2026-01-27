const db = require('./config/db');

async function checkCols() {
    try {
        const connection = await db.getConnection();
        const [rows] = await connection.query('SHOW COLUMNS FROM Driver');
        console.log(rows.map(r => r.Field).join(', '));
        connection.release();
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkCols();
