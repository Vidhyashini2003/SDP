const mysql = require('mysql2/promise');

async function checkDb() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Kayal2003',
            port: 3308,
            database: 'hotelmanagement'
        });
        const [cols] = await conn.query('SHOW COLUMNS FROM activity');
        console.log('activity columns:', JSON.stringify(cols, null, 2));
        await conn.end();
    } catch (e) {
        console.log(e);
    }
}
checkDb();
