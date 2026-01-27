const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function dumpSchema() {
    try {
        const connection = await db.getConnection();
        const [rows] = await connection.query('SHOW CREATE TABLE Driver');
        const schema = rows[0]['Create Table'];
        fs.writeFileSync(path.join(__dirname, 'driver_schema_dump.txt'), schema);
        console.log('Schema dumped to driver_schema_dump.txt');
        connection.release();
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
dumpSchema();
