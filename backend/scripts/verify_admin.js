const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function verifyAdmin() {
    let conn;
    try {
        const email = 'admin01@gmail.com';
        
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME
        });

        const [rows] = await conn.query('SELECT user_id, first_name, last_name, email, role, account_status FROM Users WHERE email = ?', [email]);
        
        if (rows.length > 0) {
            console.log('✅ Admin verification successful:');
            console.table(rows);
        } else {
            console.log('❌ Admin not found in database.');
        }

    } catch (e) {
        console.error('Error during verification:', e);
    } finally {
        if (conn) await conn.end();
    }
}

verifyAdmin();
