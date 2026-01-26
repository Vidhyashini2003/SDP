
const db = require('./config/db');

async function checkColumns() {
    try {
        const connection = await db.getConnection();
        const [rows] = await connection.query('SELECT * FROM Driver LIMIT 1');
        if (rows.length > 0) {
            console.log('Columns:', Object.keys(rows[0]));
        } else {
            console.log('Driver table is empty, checking columns via DESCRIBE');
            const [cols] = await connection.query('DESCRIBE Driver');
            console.log(cols.map(c => c.Field));
        }
        connection.release();
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkColumns();
