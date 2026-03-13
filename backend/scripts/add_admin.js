const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

async function addAdmin() {
    let conn;
    try {
        const adminData = {
            email: 'admin01@gmail.com',
            password: '@Vidhy117',
            first_name: 'Vijay',
            last_name: 'Vidhy'
        };

        const passwordHash = await bcrypt.hash(adminData.password, 10);
        
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME
        });

        console.log(`Connecting to database: ${process.env.DB_NAME} at ${process.env.DB_HOST}:${process.env.DB_PORT}`);

        // Check if exists
        const [existing] = await conn.query('SELECT * FROM Users WHERE email = ?', [adminData.email]);
        if (existing.length > 0) {
            console.log(`Admin with email ${adminData.email} already exists. Updating details...`);
            await conn.query(
                `UPDATE Users SET first_name = ?, last_name = ?, password = ?, role = 'admin', account_status = 'Active' WHERE email = ?`,
                [adminData.first_name, adminData.last_name, passwordHash, adminData.email]
            );
            console.log(`Updated admin: ${adminData.email}`);
        } else {
            // Insert User
            const [ures] = await conn.query(
                `INSERT INTO Users (first_name, last_name, email, password, role, account_status) 
                 VALUES (?, ?, ?, ?, 'admin', 'Active')`,
                [adminData.first_name, adminData.last_name, adminData.email, passwordHash]
            );
            console.log(`Created admin: ${adminData.email} (user_id: ${ures.insertId})`);
        }

    } catch (e) {
        console.error('Error adding admin:', e);
    } finally {
        if (conn) await conn.end();
    }
}

addAdmin();
