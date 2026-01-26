
const db = require('./config/db');

async function checkSchema() {
    try {
        const connection = await db.getConnection();
        const [rows] = await connection.query('SHOW CREATE TABLE Driver');
        console.log(JSON.stringify(rows[0]['Create Table'], null, 2));
        connection.release();
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkSchema();
